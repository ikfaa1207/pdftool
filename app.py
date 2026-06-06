import os
import re
import uuid
import time
import shutil
import zipfile
import multiprocessing
import logging
import logging.config
import threading
from typing import List, Dict, Any
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fitz  # PyMuPDF

# Logging configuration
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "%(levelprefix)s %(asctime)s [%(name)s] %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "file": {
            "format": "%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
        "file": {
            "formatter": "file",
            "class": "logging.handlers.RotatingFileHandler",
            "filename": "app.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "encoding": "utf-8",
        },
    },
    "loggers": {
        "app": {"handlers": ["console", "file"], "level": "INFO"},
        "uvicorn": {"handlers": ["console", "file"], "level": "INFO", "propagate": False},
    },
}

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger("app")

is_debug = os.environ.get("APP_DEBUG", "true").lower() == "true"
app = FastAPI(
    title="B2B Document Redactor & Sanitizer",
    docs_url="/docs" if is_debug else None,
    redoc_url="/redoc" if is_debug else None,
    openapi_url="/openapi.json" if is_debug else None
)

# Restrict CORS for production security
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_workspace")
# Secure owner-only permissions (0o700)
os.makedirs(TEMP_DIR, mode=0o700, exist_ok=True)

def safe_save_upload(file: UploadFile, dest_path: str, max_size_mb: int = 50, allowed_types: List[str] = None):
    # Enforce strict maximum file size cap
    max_bytes = max_size_mb * 1024 * 1024
    total_bytes = 0
    
    # Read the first chunk to verify file signatures (magic numbers)
    first_chunk = file.file.read(1024)
    total_bytes += len(first_chunk)
    
    if allowed_types:
        is_valid = False
        if "pdf" in allowed_types:
            # PDF magic number is %PDF- (hex: 25 50 44 46)
            if first_chunk.startswith(b"%PDF-"):
                is_valid = True
        if "image" in allowed_types:
            # PNG: 89 50 4E 47 0D 0A 1A 0A
            # JPEG: FF D8 FF
            # WEBP: RIFF (first 4 bytes) and WEBP (bytes 8-12)
            if (first_chunk.startswith(b"\x89PNG\r\n\x1a\n") or 
                first_chunk.startswith(b"\xff\xd8\xff") or 
                (first_chunk.startswith(b"RIFF") and b"WEBP" in first_chunk[8:16])):
                is_valid = True
                
        if not is_valid:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file format signature. Allowed formats: {', '.join(allowed_types)}."
            )
            
    # Write file in chunks and check total size
    try:
        with open(dest_path, "wb") as f:
            f.write(first_chunk)
            while True:
                chunk = file.file.read(81920) # 80KB chunks
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > max_bytes:
                    raise HTTPException(
                        status_code=413, 
                        detail=f"Upload rejected. File size exceeds the limit of {max_size_mb}MB."
                    )
                f.write(chunk)
    except Exception as e:
        if os.path.exists(dest_path):
            try:
                os.remove(dest_path)
            except Exception:
                pass
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"Failed to process file upload: {str(e)}")

def validate_session_id(session_id: str):
    if not session_id or not re.match(r"^[a-f0-9]{32}$", session_id):
        raise HTTPException(status_code=400, detail="Invalid session identifier format.")

def validate_file_id(file_id: str):
    if not file_id or not re.match(r"^[a-f0-9]{32}$", file_id):
        raise HTTPException(status_code=400, detail="Invalid file identifier format.")

def regex_worker(pattern, text, q):
    try:
        compiled = re.compile(pattern)
        # findall can return tuples if groups are defined, which is fine
        matches = set(compiled.findall(text))
        q.put(("ok", list(matches)))
    except Exception as e:
        q.put(("error", str(e)))

def safe_regex_search(pattern: str, text: str, timeout: float = 1.0) -> List[str]:
    try:
        re.compile(pattern)
    except re.error as e:
        raise HTTPException(status_code=400, detail=f"Invalid regular expression: {str(e)}")
        
    q = multiprocessing.Queue()
    p = multiprocessing.Process(target=regex_worker, args=(pattern, text, q))
    p.start()
    try:
        status, res = q.get(timeout=timeout)
        if status == "error":
            raise HTTPException(status_code=400, detail=res)
        
        # Flatten matches if findall returned lists of tuples/strings
        flat_matches = []
        for match in res:
            if isinstance(match, tuple):
                flat_matches.extend([m for m in match if m])
            else:
                flat_matches.append(match)
        return list(set(flat_matches))
    except Exception as e:
        p.terminate()
        p.join()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail="Regular expression search timed out. Catastrophic backtracking or pattern complexity limit exceeded.")
    finally:
        if p.is_alive():
            p.terminate()
            p.join()

# Regex Patterns for Sensitive Data Detection
PATTERNS = {
    "Email": r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
    "Phone Number": r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',
    "Social Security Number (SSN)": r'\b\d{3}-\d{2}-\d{4}\b',
    "Employer Identification Number (EIN)": r'\b\d{2}-\d{7}\b',
    "Credit Card": r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
    "IP Address": r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
}

def session_cleanup_worker():
    """Background thread that runs indefinitely to clean up expired sessions."""
    logger.info("Background session cleanup worker thread initialized.")
    while True:
        try:
            now = time.time()
            if os.path.exists(TEMP_DIR):
                for folder in os.listdir(TEMP_DIR):
                    folder_path = os.path.join(TEMP_DIR, folder)
                    if os.path.isdir(folder_path):
                        # 900 seconds = 15 minutes
                        if now - os.path.getmtime(folder_path) > 900:
                            logger.info(f"Purging expired session folder: {folder}")
                            shutil.rmtree(folder_path, ignore_errors=True)
        except Exception as e:
            logger.error(f"Error in background session cleanup worker: {e}")
        time.sleep(60)

@app.on_event("startup")
async def startup_event():
    # Start the daemon thread for session cleanup
    cleanup_thread = threading.Thread(target=session_cleanup_worker, daemon=True)
    cleanup_thread.start()
    logger.info("Application startup: Background session cleanup worker thread started.")

class RedactionItem(BaseModel):
    page_num: int
    rects: List[Dict[str, float]]

class RedactRequest(BaseModel):
    session_id: str
    redactions: List[RedactionItem]
    strip_metadata: bool

class SearchRequest(BaseModel):
    session_id: str
    query: str
    is_regex: bool = False

class MergeExecuteRequest(BaseModel):
    session_id: str
    file_ids: List[str]

class SplitExtractRequest(BaseModel):
    session_id: str
    pages: List[int]

class SplitPartsRequest(BaseModel):
    session_id: str
    parts: List[List[int]]

class SecurityUnlockRequest(BaseModel):
    session_id: str
    password: str

class SecurityProtectRequest(BaseModel):
    session_id: str
    user_password: str = ""
    owner_password: str = ""
    prevent_print: bool = False
    prevent_copy: bool = False
    prevent_modify: bool = False

class CompressRequest(BaseModel):
    session_id: str
    level: str

class OrganizePageItem(BaseModel):
    page_num: int
    rotation: int
    is_blank: bool = False


class OrganizeRequest(BaseModel):
    session_id: str
    pages: List[OrganizePageItem]

class WatermarkExecuteRequest(BaseModel):
    session_id: str
    type: str  # "text" or "image"
    text: str = "CONFIDENTIAL"
    color: str = "#ef4444"
    font_size: int = 36
    opacity: float = 0.3
    rotation: int = 45
    scale: float = 0.3
    position: str = "center"
    pages_mode: str = "all"
    custom_pages: str = ""

class PDFToImageRequest(BaseModel):
    session_id: str
    format: str  # "png" or "jpeg"
    dpi: int = 150
    pages_mode: str = "all"
    custom_pages: str = ""

class ImageToPDFRequest(BaseModel):
    session_id: str
    images: List[str]
    fit_mode: str  # "match" or "standard"
    page_size: str = "A4"
    orientation: str = "portrait"

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    logger.info(f"Upload PDF request received: {file.filename}")
    
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    session_id = uuid.uuid4().hex
    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, mode=0o700, exist_ok=True)
    
    pdf_path = os.path.join(session_dir, "input.pdf")
    safe_save_upload(file, pdf_path, max_size_mb=50, allowed_types=["pdf"])
        
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        shutil.rmtree(session_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
        
    pages = []
    findings = []
    
    # Process each page
    for page_num in range(len(doc)):
        page = doc[page_num]
        rect = page.rect
        width, height = rect.width, rect.height
        
        # Save page as preview image
        try:
            pix = page.get_pixmap(dpi=150)
            img_path = os.path.join(session_dir, f"page_{page_num}.png")
            pix.save(img_path)
        except Exception as e:
            logger.error(f"Error rendering page {page_num}: {e}")
            
        pages.append({
            "page_num": page_num,
            "width": width,
            "height": height,
            "image_url": f"/api/page/{session_id}/{page_num}"
        })
        
        # Extract text and run auto-detection
        text = page.get_text("text")
        
        for category, pattern in PATTERNS.items():
            matches = set(re.findall(pattern, text))
            for match in matches:
                # Search for the match coordinates on the page
                rect_list = page.search_for(match)
                if rect_list:
                    # Convert fitz Rect to dictionary format
                    rects = [{"x0": r.x0, "y0": r.y0, "x1": r.x1, "y1": r.y1} for r in rect_list]
                    findings.append({
                        "id": uuid.uuid4().hex,
                        "page_num": page_num,
                        "category": category,
                        "text": match,
                        "rects": rects
                    })
                    
    doc.close()
    
    return {
        "session_id": session_id,
        "filename": file.filename,
        "total_pages": len(pages),
        "pages": pages,
        "findings": findings
    }

@app.get("/api/page/{session_id}/{page_num}")
async def get_page_image(session_id: str, page_num: int):
    validate_session_id(session_id)
    img_path = os.path.join(TEMP_DIR, session_id, f"page_{page_num}.png")
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Page preview image not found.")
    return FileResponse(img_path, media_type="image/png")

@app.post("/api/search")
async def search_pdf(req: SearchRequest):
    validate_session_id(req.session_id)
    session_dir = os.path.join(TEMP_DIR, req.session_id)
    pdf_path = os.path.join(session_dir, "input.pdf")
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Session expired or file not found.")
        
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to open PDF: {str(e)}")
        
    results = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        
        if req.is_regex:
            # Custom Regex search with ReDoS protection timeout
            text = page.get_text("text")
            matches = safe_regex_search(req.query, text)
            for match in matches:
                rect_list = page.search_for(match)
                if rect_list:
                    rects = [{"x0": r.x0, "y0": r.y0, "x1": r.x1, "y1": r.y1} for r in rect_list]
                    results.append({
                        "id": uuid.uuid4().hex,
                        "page_num": page_num,
                        "category": "Custom Regex Match",
                        "text": match,
                        "rects": rects
                    })
        else:
            # Normal text search
            rect_list = page.search_for(req.query)
            if rect_list:
                rects = [{"x0": r.x0, "y0": r.y0, "x1": r.x1, "y1": r.y1} for r in rect_list]
                results.append({
                    "id": uuid.uuid4().hex,
                    "page_num": page_num,
                    "category": "Custom Search",
                    "text": req.query,
                    "rects": rects
                })
                
    doc.close()
    return {"results": results}

@app.post("/api/redact")
async def redact_pdf(req: RedactRequest):
    validate_session_id(req.session_id)
    session_dir = os.path.join(TEMP_DIR, req.session_id)
    pdf_path = os.path.join(session_dir, "input.pdf")
    output_path = os.path.join(session_dir, "redacted.pdf")
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Session expired or file not found.")
        
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to open PDF: {str(e)}")
        
    try:
        # Group redactions by page number
        red_by_page = {}
        for item in req.redactions:
            if item.page_num not in red_by_page:
                red_by_page[item.page_num] = []
            red_by_page[item.page_num].extend(item.rects)
            
        # Apply redactions page by page
        for page_num in range(len(doc)):
            if page_num in red_by_page:
                page = doc[page_num]
                for r in red_by_page[page_num]:
                    rect = fitz.Rect(r["x0"], r["y0"], r["x1"], r["y1"])
                    # Add redaction annotation (default color is black)
                    page.add_redact_annot(rect, fill=(0, 0, 0))
                # Apply the redaction to delete text & images permanently
                page.apply_redactions()
                
        # Handle metadata stripping
        if req.strip_metadata:
            doc.set_metadata({
                "producer": "",
                "creator": "",
                "author": "",
                "title": "",
                "subject": "",
                "keywords": "",
                "creationDate": "",
                "modDate": ""
            })
            
        # Save output PDF with garbage collection to ensure deleted bytes are removed
        doc.save(output_path, garbage=3, deflate=True)
        doc.close()
        
    except Exception as e:
        if 'doc' in locals() and not doc.is_closed:
            doc.close()
        raise HTTPException(status_code=500, detail=f"Redaction failed: {str(e)}")
        
    return {"download_url": f"/api/download/{req.session_id}"}

@app.get("/api/download/{session_id}")
async def download_redacted_pdf(session_id: str, background_tasks: BackgroundTasks):
    validate_session_id(session_id)
    session_dir = os.path.join(TEMP_DIR, session_id)
    output_path = os.path.join(session_dir, "redacted.pdf")
    
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Redacted document not found. Did you sanitize it first?")
        
    # Queue folder cleanup after file is sent
    def remove_session():
        time.sleep(2)  # short delay to ensure file lock is released
        shutil.rmtree(session_dir, ignore_errors=True)
        
    background_tasks.add_task(remove_session)
    
    # We retrieve the original file name if possible, else default
    filename = "sanitized_document.pdf"
    return FileResponse(output_path, media_type="application/pdf", filename=filename)

@app.post("/api/merge/upload")
async def merge_upload(file: UploadFile = File(...), session_id: str = Form(None)):
    logger.info(f"Merge upload request received: {file.filename}")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    if session_id:
        validate_session_id(session_id)
    else:
        session_id = uuid.uuid4().hex
        
    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, mode=0o700, exist_ok=True)
    
    file_id = uuid.uuid4().hex
    file_path = os.path.join(session_dir, f"{file_id}.pdf")
    safe_save_upload(file, file_path, max_size_mb=50, allowed_types=["pdf"])
        
    try:
        doc = fitz.open(file_path)
        page_count = len(doc)
        
        # Render the first page as a preview
        if page_count > 0:
            page = doc[0]
            pix = page.get_pixmap(dpi=80)  # low dpi for faster rendering/loading
            preview_path = os.path.join(session_dir, f"{file_id}_preview.png")
            pix.save(preview_path)
            
        doc.close()
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Invalid PDF: {str(e)}")
        
    return {
        "session_id": session_id,
        "file_id": file_id,
        "filename": file.filename,
        "page_count": page_count,
        "preview_url": f"/api/merge/preview/{session_id}/{file_id}"
    }

@app.get("/api/merge/preview/{session_id}/{file_id}")
async def get_merge_preview(session_id: str, file_id: str):
    validate_session_id(session_id)
    validate_file_id(file_id)
    preview_path = os.path.join(TEMP_DIR, session_id, f"{file_id}_preview.png")
    if not os.path.exists(preview_path):
        raise HTTPException(status_code=404, detail="Merge preview image not found.")
    return FileResponse(preview_path, media_type="image/png")

@app.post("/api/merge/execute")
async def merge_execute(req: MergeExecuteRequest):
    validate_session_id(req.session_id)
    for fid in req.file_ids:
        validate_file_id(fid)
    session_dir = os.path.join(TEMP_DIR, req.session_id)
    if not os.path.exists(session_dir):
        raise HTTPException(status_code=404, detail="Session expired or not found.")
        
    output_path = os.path.join(session_dir, "merged.pdf")
    merged_doc = fitz.open()
    
    try:
        for file_id in req.file_ids:
            file_path = os.path.join(session_dir, f"{file_id}.pdf")
            if not os.path.exists(file_path):
                raise HTTPException(status_code=400, detail=f"File {file_id} not found in this session.")
            
            doc = fitz.open(file_path)
            try:
                merged_doc.insert_pdf(doc)
            except Exception as e:
                logger.warning(f"Failed to insert PDF {file_id} with widgets, retrying without widgets: {e}")
                merged_doc.insert_pdf(doc, widgets=False)
            doc.close()
            
        merged_doc.save(output_path)
        merged_doc.close()
    except Exception as e:
        if not merged_doc.is_closed:
            merged_doc.close()
        raise HTTPException(status_code=500, detail=f"Failed to merge PDFs: {str(e)}")
        
    return {"download_url": f"/api/download/merge/{req.session_id}"}

@app.get("/api/download/merge/{session_id}")
async def download_merged_pdf(session_id: str, background_tasks: BackgroundTasks):
    validate_session_id(session_id)
    session_dir = os.path.join(TEMP_DIR, session_id)
    output_path = os.path.join(session_dir, "merged.pdf")
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Merged document not found.")
        
    def remove_session():
        time.sleep(2)
        shutil.rmtree(session_dir, ignore_errors=True)
        
    background_tasks.add_task(remove_session)
    return FileResponse(output_path, media_type="application/pdf", filename="merged_document.pdf")

@app.post("/api/split/upload")
async def split_upload(file: UploadFile = File(...)):
    logger.info(f"Split upload request received: {file.filename}")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    session_id = uuid.uuid4().hex
    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, mode=0o700, exist_ok=True)
    
    pdf_path = os.path.join(session_dir, "input.pdf")
    safe_save_upload(file, pdf_path, max_size_mb=50, allowed_types=["pdf"])
        
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        shutil.rmtree(session_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
        
    pages = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        rect = page.rect
        
        try:
            pix = page.get_pixmap(dpi=100)
            pix.save(os.path.join(session_dir, f"page_{page_num}.png"))
        except Exception as e:
            logger.error(f"Error rendering split preview page {page_num}: {e}")
            
        pages.append({
            "page_num": page_num,
            "width": rect.width,
            "height": rect.height,
            "image_url": f"/api/split/page/{session_id}/{page_num}"
        })
        
    doc.close()
    return {
        "session_id": session_id,
        "filename": file.filename,
        "total_pages": len(pages),
        "pages": pages
    }

@app.get("/api/split/page/{session_id}/{page_num}")
async def get_split_page_image(session_id: str, page_num: int):
    validate_session_id(session_id)
    img_path = os.path.join(TEMP_DIR, session_id, f"page_{page_num}.png")
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Page preview image not found.")
    return FileResponse(img_path, media_type="image/png")

@app.post("/api/split/extract")
async def split_extract(req: SplitExtractRequest):
    validate_session_id(req.session_id)
    session_dir = os.path.join(TEMP_DIR, req.session_id)
    pdf_path = os.path.join(session_dir, "input.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Session expired or file not found.")
        
    output_path = os.path.join(session_dir, "extracted.pdf")
    try:
        doc = fitz.open(pdf_path)
        doc.select(req.pages)
        doc.save(output_path)
        doc.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
        
    return {"download_url": f"/api/download/split/{req.session_id}/extract"}

@app.post("/api/split/parts")
async def split_parts(req: SplitPartsRequest):
    validate_session_id(req.session_id)
    session_dir = os.path.join(TEMP_DIR, req.session_id)
    pdf_path = os.path.join(session_dir, "input.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Session expired or file not found.")
        
    zip_path = os.path.join(session_dir, "split_parts.zip")
    try:
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for i, page_indices in enumerate(req.parts):
                part_pdf_name = f"part_{i+1}.pdf"
                part_pdf_path = os.path.join(session_dir, part_pdf_name)
                
                doc = fitz.open(pdf_path)
                doc.select(page_indices)
                doc.save(part_pdf_path)
                doc.close()
                
                zipf.write(part_pdf_path, part_pdf_name)
                os.remove(part_pdf_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Splitting failed: {str(e)}")
        
    return {"download_url": f"/api/download/split/{req.session_id}/parts"}

@app.get("/api/download/split/{session_id}/{mode}")
async def download_split_result(session_id: str, mode: str, background_tasks: BackgroundTasks):
    validate_session_id(session_id)
    session_dir = os.path.join(TEMP_DIR, session_id)
    
    if mode == "extract":
        file_path = os.path.join(session_dir, "extracted.pdf")
        filename = "extracted_pages.pdf"
        media = "application/pdf"
    elif mode == "parts":
        file_path = os.path.join(session_dir, "split_parts.zip")
        filename = "split_parts.zip"
        media = "application/zip"
    else:
        raise HTTPException(status_code=400, detail="Invalid split mode.")
        
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested split file not found.")
        
    def remove_session():
        time.sleep(2)
        shutil.rmtree(session_dir, ignore_errors=True)
        
    background_tasks.add_task(remove_session)
    return FileResponse(file_path, media_type=media, filename=filename)

@app.post("/api/security/upload")
async def security_upload(file: UploadFile = File(...)):
    logger.info(f"Security upload request received: {file.filename}")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    session_id = uuid.uuid4().hex
    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, mode=0o700, exist_ok=True)
    
    pdf_path = os.path.join(session_dir, "input.pdf")
    safe_save_upload(file, pdf_path, max_size_mb=50, allowed_types=["pdf"])
        
    try:
        doc = fitz.open(pdf_path)
        is_encrypted = doc.is_encrypted
        page_count = len(doc)
        doc.close()
    except Exception as e:
        shutil.rmtree(session_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
        
    file_size = os.path.getsize(pdf_path)
    
    return {
        "session_id": session_id,
        "filename": file.filename,
        "is_encrypted": is_encrypted,
        "page_count": page_count,
        "file_size": file_size
    }

@app.post("/api/security/unlock")
async def security_unlock(req: SecurityUnlockRequest):
    validate_session_id(req.session_id)
    session_dir = os.path.join(TEMP_DIR, req.session_id)
    pdf_path = os.path.join(session_dir, "input.pdf")
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Session expired or file not found.")
        
    try:
        doc = fitz.open(pdf_path)
        if not doc.is_encrypted:
            doc.close()
            raise HTTPException(status_code=400, detail="Document is not password-protected.")
            
        auth_status = doc.authenticate(req.password)
        if auth_status == 0:
            doc.close()
            raise HTTPException(status_code=400, detail="Incorrect password. Access denied.")
            
        output_path = os.path.join(session_dir, "decrypted.pdf")
        doc.save(output_path)
        doc.close()
    except Exception as e:
        if 'doc' in locals() and not doc.is_closed:
            doc.close()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Decryption failed: {str(e)}")
        
    return {"download_url": f"/api/download/security/{req.session_id}/decrypt"}

@app.post("/api/security/protect")
async def security_protect(req: SecurityProtectRequest):
    validate_session_id(req.session_id)
    session_dir = os.path.join(TEMP_DIR, req.session_id)
    pdf_path = os.path.join(session_dir, "input.pdf")
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Session expired or file not found.")
        
    try:
        doc = fitz.open(pdf_path)
        
        # Base permissions allowing all features
        permissions = (
            fitz.PDF_PERM_PRINT | 
            fitz.PDF_PERM_MODIFY | 
            fitz.PDF_PERM_COPY | 
            fitz.PDF_PERM_ANNOTATE | 
            fitz.PDF_PERM_FORM | 
            fitz.PDF_PERM_ACCESSIBILITY | 
            fitz.PDF_PERM_ASSEMBLE | 
            fitz.PDF_PERM_PRINT_HQ
        )
        
        if req.prevent_print:
            permissions &= ~fitz.PDF_PERM_PRINT
            permissions &= ~fitz.PDF_PERM_PRINT_HQ
        if req.prevent_copy:
            permissions &= ~fitz.PDF_PERM_COPY
            permissions &= ~fitz.PDF_PERM_ACCESSIBILITY
        if req.prevent_modify:
            permissions &= ~fitz.PDF_PERM_MODIFY
            permissions &= ~fitz.PDF_PERM_ANNOTATE
            permissions &= ~fitz.PDF_PERM_FORM
            permissions &= ~fitz.PDF_PERM_ASSEMBLE
            
        output_path = os.path.join(session_dir, "protected.pdf")
        
        doc.save(
            output_path, 
            encryption=fitz.PDF_ENCRYPT_AES_256, 
            user_pw=req.user_password, 
            owner_pw=req.owner_password, 
            permissions=permissions
        )
        doc.close()
    except Exception as e:
        if 'doc' in locals() and not doc.is_closed:
            doc.close()
        raise HTTPException(status_code=500, detail=f"Failed to protect PDF: {str(e)}")
        
    return {"download_url": f"/api/download/security/{req.session_id}/protect"}

@app.get("/api/download/security/{session_id}/{mode}")
async def download_security_result(session_id: str, mode: str, background_tasks: BackgroundTasks):
    validate_session_id(session_id)
    session_dir = os.path.join(TEMP_DIR, session_id)
    
    if mode == "decrypt":
        file_path = os.path.join(session_dir, "decrypted.pdf")
        filename = "unlocked_document.pdf"
    elif mode == "protect":
        file_path = os.path.join(session_dir, "protected.pdf")
        filename = "protected_document.pdf"
    else:
        raise HTTPException(status_code=400, detail="Invalid mode.")
        
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested security file not found.")
        
    def remove_session():
        time.sleep(2)
        shutil.rmtree(session_dir, ignore_errors=True)
        
    background_tasks.add_task(remove_session)
    return FileResponse(file_path, media_type="application/pdf", filename=filename)

@app.post("/api/compress/upload")
async def compress_upload(file: UploadFile = File(...)):
    logger.info(f"Compress upload request received: {file.filename}")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    session_id = uuid.uuid4().hex
    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, mode=0o700, exist_ok=True)
    
    pdf_path = os.path.join(session_dir, "input.pdf")
    safe_save_upload(file, pdf_path, max_size_mb=50, allowed_types=["pdf"])
        
    try:
        doc = fitz.open(pdf_path)
        doc.close()
    except Exception as e:
        shutil.rmtree(session_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
        
    file_size = os.path.getsize(pdf_path)
    
    return {
        "session_id": session_id,
        "filename": file.filename,
        "file_size": file_size
    }

@app.post("/api/compress/execute")
async def compress_execute(req: CompressRequest):
    validate_session_id(req.session_id)
    session_dir = os.path.join(TEMP_DIR, req.session_id)
    pdf_path = os.path.join(session_dir, "input.pdf")
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Session expired or file not found.")
        
    try:
        from PIL import Image
        import io
        
        doc = fitz.open(pdf_path)
        
        if req.level == "low":
            quality = 85
            max_size = 1500
        elif req.level == "medium":
            quality = 65
            max_size = 1000
        elif req.level == "high":
            quality = 45
            max_size = 750
        else:
            doc.close()
            raise HTTPException(status_code=400, detail="Invalid compression level.")
            
        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images()
            for img_info in image_list:
                xref = img_info[0]
                try:
                    base_image = doc.extract_image(xref)
                    if not base_image:
                        continue
                    
                    image_bytes = base_image["image"]
                    img = Image.open(io.BytesIO(image_bytes))
                    
                    if max(img.size) > max_size:
                        ratio = max_size / max(img.size)
                        new_size = (int(img.width * ratio), int(img.height * ratio))
                        resample = getattr(Image, "Resampling", None)
                        resample_filter = resample.LANCZOS if resample else getattr(Image, "ANTIALIAS", 3)
                        img = img.resize(new_size, resample=resample_filter)
                        
                    if img.mode in ("RGBA", "LA"):
                        background = Image.new("RGB", img.size, (255, 255, 255))
                        background.paste(img, mask=img.split()[-1])
                        img = background
                    elif img.mode != "RGB":
                        img = img.convert("RGB")
                        
                    compressed_io = io.BytesIO()
                    img.save(compressed_io, format="JPEG", quality=quality, optimize=True)
                    compressed_bytes = compressed_io.getvalue()
                    
                    page.replace_image(xref, stream=compressed_bytes)
                except Exception as img_err:
                    logger.warning(f"Skipping image compression for xref {xref}: {img_err}")
                    
        output_path = os.path.join(session_dir, "compressed.pdf")
        doc.save(output_path, garbage=4, deflate=True)
        doc.close()
    except Exception as e:
        if 'doc' in locals() and not doc.is_closed:
            doc.close()
        raise HTTPException(status_code=500, detail=f"Compression failed: {str(e)}")
        
    original_size = os.path.getsize(pdf_path)
    compressed_size = os.path.getsize(output_path)
    
    return {
        "download_url": f"/api/download/compress/{req.session_id}",
        "original_size": original_size,
        "compressed_size": compressed_size
    }

@app.get("/api/download/compress/{session_id}")
async def download_compressed_pdf(session_id: str):
    validate_session_id(session_id)
    session_dir = os.path.join(TEMP_DIR, session_id)
    output_path = os.path.join(session_dir, "compressed.pdf")
    
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Compressed document not found.")
        
    return FileResponse(output_path, media_type="application/pdf", filename="compressed_document.pdf")

@app.post("/api/cleanup/{session_id}")
async def cleanup_session(session_id: str):
    validate_session_id(session_id)
    session_dir = os.path.join(TEMP_DIR, session_id)
    if os.path.exists(session_dir):
        shutil.rmtree(session_dir, ignore_errors=True)
        
    conv_dir = os.path.join(TEMP_DIR, f"conv_{session_id}")
    if os.path.exists(conv_dir):
        shutil.rmtree(conv_dir, ignore_errors=True)
        
    return {"status": "success"}

# Mount frontend files

@app.post("/api/organize/upload")
async def organize_upload(file: UploadFile = File(...)):
    logger.info(f"Organize upload request received: {file.filename}")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    session_id = uuid.uuid4().hex
    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, mode=0o700, exist_ok=True)
    
    pdf_path = os.path.join(session_dir, "input.pdf")
    safe_save_upload(file, pdf_path, max_size_mb=50, allowed_types=["pdf"])
        
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        shutil.rmtree(session_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
        
    pages = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        rect = page.rect
        
        try:
            pix = page.get_pixmap(dpi=100)
            img_path = os.path.join(session_dir, f"page_{page_num}.png")
            pix.save(img_path)
        except Exception as e:
            logger.error(f"Error rendering organize preview page {page_num}: {e}")
            
        pages.append({
            "page_num": page_num,
            "width": rect.width,
            "height": rect.height,
            "image_url": f"/api/organize/page/{session_id}/{page_num}"
        })
        
    doc.close()
    return {
        "session_id": session_id,
        "filename": file.filename,
        "total_pages": len(pages),
        "pages": pages
    }

@app.get("/api/organize/page/{session_id}/{page_num}")
async def get_organize_page_image(session_id: str, page_num: int):
    validate_session_id(session_id)
    img_path = os.path.join(TEMP_DIR, session_id, f"page_{page_num}.png")
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Page preview image not found.")
    return FileResponse(img_path, media_type="image/png")

@app.post("/api/organize/execute")
async def organize_execute(req: OrganizeRequest):
    validate_session_id(req.session_id)
    session_dir = os.path.join(TEMP_DIR, req.session_id)
    pdf_path = os.path.join(session_dir, "input.pdf")
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Session expired or file not found.")
        
    output_path = os.path.join(session_dir, "organized.pdf")
    
    try:
        src_doc = fitz.open(pdf_path)
        out_doc = fitz.open()
        
        for item in req.pages:
            if item.is_blank:
                # Find size of first page from source document, fallback to Letter (612x792)
                width, height = 612.0, 792.0
                if len(src_doc) > 0:
                    width = src_doc[0].rect.width
                    height = src_doc[0].rect.height
                out_doc.new_page(width=width, height=height)
            else:
                # Insert original page into output document
                try:
                    out_doc.insert_pdf(src_doc, from_page=item.page_num, to_page=item.page_num)
                except Exception as e:
                    logger.warning(f"Failed to insert page {item.page_num} with widgets, retrying without widgets: {e}")
                    out_doc.insert_pdf(src_doc, from_page=item.page_num, to_page=item.page_num, widgets=False)
            
            # Retrieve the newly inserted page
            page = out_doc[-1]
            
            # Apply target rotation (set_rotation sets absolute rotation angle: 0, 90, 180, 270)
            page.set_rotation(item.rotation % 360)
        
        out_doc.save(output_path, garbage=3, deflate=True)
        out_doc.close()
        src_doc.close()
    except Exception as e:
        if 'out_doc' in locals() and not out_doc.is_closed:
            out_doc.close()
        if 'src_doc' in locals() and not src_doc.is_closed:
            src_doc.close()
        raise HTTPException(status_code=500, detail=f"Page organization failed: {str(e)}")
        
    return {"download_url": f"/api/download/organize/{req.session_id}"}

@app.get("/api/download/organize/{session_id}")
async def download_organized_pdf(session_id: str):
    validate_session_id(session_id)
    session_dir = os.path.join(TEMP_DIR, session_id)
    output_path = os.path.join(session_dir, "organized.pdf")
    
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Organized document not found.")
        
    return FileResponse(output_path, media_type="application/pdf", filename="organized_document.pdf")

@app.post("/api/watermark/upload")
async def watermark_upload(file: UploadFile = File(...)):
    logger.info(f"Watermark upload request received: {file.filename}")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    session_id = uuid.uuid4().hex
    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, mode=0o700, exist_ok=True)
    
    pdf_path = os.path.join(session_dir, "input.pdf")
    safe_save_upload(file, pdf_path, max_size_mb=50, allowed_types=["pdf"])
        
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        shutil.rmtree(session_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
        
    pages = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        rect = page.rect
        
        try:
            pix = page.get_pixmap(dpi=100)
            img_path = os.path.join(session_dir, f"page_{page_num}.png")
            pix.save(img_path)
        except Exception as e:
            logger.error(f"Error rendering watermark preview page {page_num}: {e}")
            
        pages.append({
            "page_num": page_num,
            "width": rect.width,
            "height": rect.height,
            "image_url": f"/api/watermark/page/{session_id}/{page_num}"
        })
        
    doc.close()
    return {
        "session_id": session_id,
        "filename": file.filename,
        "total_pages": len(pages),
        "pages": pages
    }

@app.get("/api/watermark/page/{session_id}/{page_num}")
async def get_watermark_page_image(session_id: str, page_num: int):
    validate_session_id(session_id)
    img_path = os.path.join(TEMP_DIR, session_id, f"page_{page_num}.png")
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Page preview image not found.")
    return FileResponse(img_path, media_type="image/png")

@app.post("/api/watermark/logo")
async def watermark_logo(session_id: str = Form(...), file: UploadFile = File(...)):
    validate_session_id(session_id)
    session_dir = os.path.join(TEMP_DIR, session_id)
    if not os.path.exists(session_dir):
        raise HTTPException(status_code=404, detail="Session expired or not found.")
        
    logo_path = os.path.join(session_dir, "logo.png")
    safe_save_upload(file, logo_path, max_size_mb=10, allowed_types=["image"])
        
    try:
        from PIL import Image
        img = Image.open(logo_path)
        img.verify()
    except Exception as e:
        if os.path.exists(logo_path):
            os.remove(logo_path)
        raise HTTPException(status_code=400, detail=f"Uploaded file is not a valid image: {str(e)}")
        
    return {"status": "success"}

@app.post("/api/watermark/execute")
async def watermark_execute(req: WatermarkExecuteRequest):
    validate_session_id(req.session_id)
    session_dir = os.path.join(TEMP_DIR, req.session_id)
    pdf_path = os.path.join(session_dir, "input.pdf")
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Session expired or file not found.")
        
    output_path = os.path.join(session_dir, "watermarked.pdf")
    
    try:
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        
        target_pages = []
        if req.pages_mode == "first":
            target_pages = [0]
        elif req.pages_mode == "custom" and req.custom_pages:
            for part in req.custom_pages.split(','):
                part = part.strip()
                if '-' in part:
                    try:
                        start, end = part.split('-')
                        start_idx = int(start.strip()) - 1
                        end_idx = int(end.strip()) - 1
                        start_idx = max(0, min(total_pages - 1, start_idx))
                        end_idx = max(0, min(total_pages - 1, end_idx))
                        if start_idx <= end_idx:
                            target_pages.extend(range(start_idx, end_idx + 1))
                        else:
                            target_pages.extend(range(start_idx, end_idx - 1, -1))
                    except ValueError:
                        continue
                else:
                    try:
                        idx = int(part) - 1
                        if 0 <= idx < total_pages:
                            target_pages.append(idx)
                    except ValueError:
                        continue
            target_pages = list(sorted(set(target_pages)))
        else:
            target_pages = list(range(total_pages))
            
        if not target_pages:
            doc.close()
            raise HTTPException(status_code=400, detail="No valid target pages specified for watermarking.")
            
        if req.type == "text":
            hex_color = req.color.lstrip('#')
            if len(hex_color) == 3:
                hex_color = ''.join([c*2 for c in hex_color])
            rgb_color = tuple(int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))
            
            width = fitz.get_text_length(req.text, fontname="helv", fontsize=req.font_size)
            height = req.font_size
            font = fitz.Font("helv")
            
            for page_idx in target_pages:
                page = doc[page_idx]
                page_rect = page.rect
                
                if req.position == "tiled":
                    rows = 5
                    cols = 4
                    dx = page_rect.width / (cols + 1)
                    dy = page_rect.height / (rows + 1)
                    for r in range(1, rows + 1):
                        for c in range(1, cols + 1):
                            tx = c * dx
                            ty = r * dy
                            tw = fitz.TextWriter(page_rect)
                            p_start = fitz.Point(tx - width / 2, ty + height / 2)
                            tw.append(p_start, req.text, font=font, fontsize=req.font_size)
                            tw.write_text(page, color=rgb_color, opacity=req.opacity, morph=(fitz.Point(tx, ty), fitz.Matrix(req.rotation)))
                else:
                    tw = fitz.TextWriter(page_rect)
                    
                    cx = page_rect.width / 2
                    cy = page_rect.height / 2
                    
                    if req.position == "center":
                        p_start = fitz.Point(cx - width / 2, cy + height / 2)
                        tw.append(p_start, req.text, font=font, fontsize=req.font_size)
                        tw.write_text(page, color=rgb_color, opacity=req.opacity, morph=(fitz.Point(cx, cy), fitz.Matrix(req.rotation)))
                    else:
                        if req.position == "top-left":
                            p_start = fitz.Point(50, 50 + height)
                        elif req.position == "top-right":
                            p_start = fitz.Point(page_rect.width - width - 50, 50 + height)
                        elif req.position == "bottom-left":
                            p_start = fitz.Point(50, page_rect.height - 50)
                        elif req.position == "bottom-right":
                            p_start = fitz.Point(page_rect.width - width - 50, page_rect.height - 50)
                        else:
                            p_start = fitz.Point(cx - width / 2, cy + height / 2)
                            
                        tw.append(p_start, req.text, font=font, fontsize=req.font_size)
                        tw.write_text(page, color=rgb_color, opacity=req.opacity, morph=(p_start, fitz.Matrix(req.rotation)))
                        
        elif req.type == "image":
            from PIL import Image
            logo_path = os.path.join(session_dir, "logo.png")
            if not os.path.exists(logo_path):
                doc.close()
                raise HTTPException(status_code=400, detail="Logo image not uploaded yet.")
                
            img = Image.open(logo_path)
            if img.mode != "RGBA":
                img = img.convert("RGBA")
            r, g, b, a = img.split()
            a = a.point(lambda p: int(p * req.opacity))
            img = Image.merge("RGBA", (r, g, b, a))
            
            if req.rotation != 0:
                img = img.rotate(-req.rotation, expand=True)
            
            temp_logo_path = os.path.join(session_dir, "temp_logo.png")
            img.save(temp_logo_path, format="PNG")
            
            for page_idx in target_pages:
                page = doc[page_idx]
                page_rect = page.rect
                
                target_w = page_rect.width * req.scale
                target_h = img.height * (target_w / img.width)
                if target_h > page_rect.height * req.scale:
                    target_h = page_rect.height * req.scale
                    target_w = img.width * (target_h / img.height)
                    
                if req.position == "tiled":
                    rows = 3
                    cols = 3
                    dx = page_rect.width / (cols + 1)
                    dy = page_rect.height / (rows + 1)
                    for r_grid in range(1, rows + 1):
                        for c_grid in range(1, cols + 1):
                            tx = c_grid * dx
                            ty = r_grid * dy
                            x0 = tx - target_w / 2
                            y0 = ty - target_h / 2
                            rect = fitz.Rect(x0, y0, x0 + target_w, y0 + target_h)
                            page.insert_image(rect, filename=temp_logo_path, keep_proportion=True, overlay=True)
                else:
                    cx = page_rect.width / 2
                    cy = page_rect.height / 2
                    if req.position == "center":
                        x0 = (page_rect.width - target_w) / 2
                        y0 = (page_rect.height - target_h) / 2
                    elif req.position == "top-left":
                        x0 = 50
                        y0 = 50
                    elif req.position == "top-right":
                        x0 = page_rect.width - target_w - 50
                        y0 = 50
                    elif req.position == "bottom-left":
                        x0 = 50
                        y0 = page_rect.height - target_h - 50
                    elif req.position == "bottom-right":
                        x0 = page_rect.width - target_w - 50
                        y0 = page_rect.height - target_h - 50
                    else:
                        x0 = (page_rect.width - target_w) / 2
                        y0 = (page_rect.height - target_h) / 2
                        
                    rect = fitz.Rect(x0, y0, x0 + target_w, y0 + target_h)
                    page.insert_image(rect, filename=temp_logo_path, keep_proportion=True, overlay=True)
                    
            if os.path.exists(temp_logo_path):
                os.remove(temp_logo_path)
        else:
            doc.close()
            raise HTTPException(status_code=400, detail="Invalid watermark type.")
            
        doc.save(output_path, garbage=3, deflate=True)
        doc.close()
    except Exception as e:
        if 'doc' in locals() and not doc.is_closed:
            doc.close()
        raise HTTPException(status_code=500, detail=f"Watermarking failed: {str(e)}")
        
    return {"download_url": f"/api/download/watermark/{req.session_id}"}

@app.get("/api/download/watermark/{session_id}")
async def download_watermarked_pdf(session_id: str):
    validate_session_id(session_id)
    session_dir = os.path.join(TEMP_DIR, session_id)
    output_path = os.path.join(session_dir, "watermarked.pdf")
    
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Watermarked document not found.")
        
    return FileResponse(output_path, media_type="application/pdf", filename="watermarked_document.pdf")

@app.post("/api/convert/upload-pdf")
async def convert_upload_pdf(file: UploadFile = File(...)):
    logger.info(f"Convert PDF upload request received: {file.filename}")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    session_id = uuid.uuid4().hex
    session_dir = os.path.join(TEMP_DIR, f"conv_{session_id}")
    os.makedirs(session_dir, mode=0o700, exist_ok=True)
    
    pdf_path = os.path.join(session_dir, "input.pdf")
    safe_save_upload(file, pdf_path, max_size_mb=50, allowed_types=["pdf"])
        
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        shutil.rmtree(session_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
        
    pages = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        rect = page.rect
        try:
            pix = page.get_pixmap(dpi=100)
            pix.save(os.path.join(session_dir, f"page_{page_num}.png"))
        except Exception as e:
            logger.error(f"Error rendering convert preview page {page_num}: {e}")
            
        pages.append({
            "page_num": page_num,
            "width": rect.width,
            "height": rect.height,
            "image_url": f"/api/convert/page/{session_id}/{page_num}"
        })
        
    doc.close()
    return {
        "session_id": session_id,
        "filename": file.filename,
        "total_pages": len(pages),
        "pages": pages
    }

@app.get("/api/convert/page/{session_id}/{page_num}")
async def get_convert_page_image(session_id: str, page_num: int):
    validate_session_id(session_id)
    img_path = os.path.join(TEMP_DIR, f"conv_{session_id}", f"page_{page_num}.png")
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Page preview image not found.")
    return FileResponse(img_path, media_type="image/png")

@app.post("/api/convert/pdf-to-image")
async def convert_pdf_to_image(req: PDFToImageRequest):
    validate_session_id(req.session_id)
    session_dir = os.path.join(TEMP_DIR, f"conv_{req.session_id}")
    pdf_path = os.path.join(session_dir, "input.pdf")
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Session expired or PDF file not found.")
        
    try:
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        
        target_pages = []
        if req.pages_mode == "first":
            target_pages = [0]
        elif req.pages_mode == "custom" and req.custom_pages:
            for part in req.custom_pages.split(','):
                part = part.strip()
                if '-' in part:
                    try:
                        start, end = part.split('-')
                        start_idx = int(start.strip()) - 1
                        end_idx = int(end.strip()) - 1
                        start_idx = max(0, min(total_pages - 1, start_idx))
                        end_idx = max(0, min(total_pages - 1, end_idx))
                        if start_idx <= end_idx:
                            target_pages.extend(range(start_idx, end_idx + 1))
                        else:
                            target_pages.extend(range(start_idx, end_idx - 1, -1))
                    except ValueError:
                        continue
                else:
                    try:
                        idx = int(part) - 1
                        if 0 <= idx < total_pages:
                            target_pages.append(idx)
                    except ValueError:
                        continue
            target_pages = list(sorted(set(target_pages)))
        else:
            target_pages = list(range(total_pages))
            
        if not target_pages:
            doc.close()
            raise HTTPException(status_code=400, detail="No valid target pages specified for conversion.")
            
        ext = req.format.lower()
        if ext not in ["png", "jpeg"]:
            ext = "png"
            
        # If single page, render and download directly
        if len(target_pages) == 1:
            page_idx = target_pages[0]
            page = doc[page_idx]
            pix = page.get_pixmap(dpi=req.dpi)
            out_filename = f"page_{page_idx + 1}.{ext}"
            out_path = os.path.join(session_dir, out_filename)
            pix.save(out_path)
            doc.close()
            return {"download_url": f"/api/download/convert/{req.session_id}/{out_filename}", "is_zip": False}
        else:
            zip_filename = "converted_images.zip"
            zip_path = os.path.join(session_dir, zip_filename)
            with zipfile.ZipFile(zip_path, "w") as zipf:
                for page_idx in target_pages:
                    page = doc[page_idx]
                    pix = page.get_pixmap(dpi=req.dpi)
                    img_filename = f"page_{page_idx + 1}.{ext}"
                    img_temp_path = os.path.join(session_dir, f"temp_{img_filename}")
                    pix.save(img_temp_path)
                    zipf.write(img_temp_path, arcname=img_filename)
                    os.remove(img_temp_path)
            doc.close()
            return {"download_url": f"/api/download/convert/{req.session_id}/{zip_filename}", "is_zip": True}
            
    except Exception as e:
        if 'doc' in locals() and not doc.is_closed:
            doc.close()
        raise HTTPException(status_code=500, detail=f"PDF conversion failed: {str(e)}")

@app.post("/api/convert/upload-images")
async def convert_upload_images(files: List[UploadFile] = File(...), session_id: str = Form(None)):
    logger.info(f"Convert images upload request received: {len(files)} files")
    
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
        
    if session_id:
        validate_session_id(session_id)
    else:
        session_id = uuid.uuid4().hex
        
    session_dir = os.path.join(TEMP_DIR, f"conv_{session_id}")
    images_dir = os.path.join(session_dir, "images")
    os.makedirs(images_dir, mode=0o700, exist_ok=True)
    
    uploaded_images = []
    
    for file in files:
        ext = file.filename.split('.')[-1].lower()
        if ext not in ["png", "jpg", "jpeg", "webp"]:
            continue
            
        file_id = uuid.uuid4().hex
        img_filename = f"{file_id}.{ext}"
        img_path = os.path.join(images_dir, img_filename)
        safe_save_upload(file, img_path, max_size_mb=10, allowed_types=["image"])
            
        try:
            from PIL import Image as PILImage
            img = PILImage.open(img_path)
            width, height = img.size
            
            thumbnail_dir = os.path.join(session_dir, "thumbnails")
            os.makedirs(thumbnail_dir, mode=0o700, exist_ok=True)
            thumb_path = os.path.join(thumbnail_dir, f"{file_id}.png")
            
            img.thumbnail((300, 300))
            img.save(thumb_path, format="PNG")
            
            uploaded_images.append({
                "file_id": file_id,
                "filename": file.filename,
                "width": width,
                "height": height,
                "thumbnail_url": f"/api/convert/thumbnail/{session_id}/{file_id}"
            })
        except Exception as e:
            logger.error(f"Error processing uploaded image {file.filename}: {e}")
            continue
            
    if not uploaded_images:
        raise HTTPException(status_code=400, detail="No valid images were uploaded.")
        
    return {
        "session_id": session_id,
        "images": uploaded_images
    }

@app.get("/api/convert/thumbnail/{session_id}/{file_id}")
async def get_convert_thumbnail(session_id: str, file_id: str):
    validate_session_id(session_id)
    validate_file_id(file_id)
    thumb_path = os.path.join(TEMP_DIR, f"conv_{session_id}", "thumbnails", f"{file_id}.png")
    if not os.path.exists(thumb_path):
        raise HTTPException(status_code=404, detail="Thumbnail not found.")
    return FileResponse(thumb_path, media_type="image/png")

@app.post("/api/convert/image-to-pdf")
async def convert_image_to_pdf(req: ImageToPDFRequest):
    validate_session_id(req.session_id)
    session_dir = os.path.join(TEMP_DIR, f"conv_{req.session_id}")
    images_dir = os.path.join(session_dir, "images")
    if not os.path.exists(images_dir):
        raise HTTPException(status_code=404, detail="Images not found for this session.")
        
    output_pdf_path = os.path.join(session_dir, "compiled.pdf")
    
    try:
        from PIL import Image as PILImage
        doc = fitz.open()
        
        sizes = {
            "a4": (595.27, 841.89),
            "letter": (612.0, 792.0)
        }
        
        for file_id in req.images:
            img_file = None
            for fname in os.listdir(images_dir):
                if fname.startswith(file_id):
                    img_file = os.path.join(images_dir, fname)
                    break
                    
            if not img_file:
                continue
                
            img = PILImage.open(img_file)
            img_w, img_h = img.size
            
            if req.fit_mode == "match":
                page = doc.new_page(width=img_w, height=img_h)
                rect = fitz.Rect(0, 0, img_w, img_h)
                page.insert_image(rect, filename=img_file)
            else:
                std_w, std_h = sizes.get(req.page_size.lower(), (595.27, 841.89))
                if req.orientation.lower() == "landscape":
                    std_w, std_h = std_h, std_w
                    
                page = doc.new_page(width=std_w, height=std_h)
                
                margin = 36.0
                max_w = std_w - 2 * margin
                max_h = std_h - 2 * margin
                
                scale = min(max_w / img_w, max_h / img_h)
                fit_w = img_w * scale
                fit_h = img_h * scale
                
                x0 = margin + (max_w - fit_w) / 2
                y0 = margin + (max_h - fit_h) / 2
                rect = fitz.Rect(x0, y0, x0 + fit_w, y0 + fit_h)
                page.insert_image(rect, filename=img_file)
                
        if len(doc) == 0:
            doc.close()
            raise HTTPException(status_code=400, detail="No valid images were compiled.")
            
        doc.save(output_pdf_path, garbage=3, deflate=True)
        doc.close()
        
    except Exception as e:
        if 'doc' in locals() and not doc.is_closed:
            doc.close()
        raise HTTPException(status_code=500, detail=f"Image compilation failed: {str(e)}")
        
    return {"download_url": f"/api/download/convert/{req.session_id}/compiled.pdf"}

@app.get("/api/download/convert/{session_id}/{filename}")
async def download_convert_file(session_id: str, filename: str):
    validate_session_id(session_id)
    if not re.match(r"^[a-zA-Z0-9_\-\.]+$", filename):
        raise HTTPException(status_code=400, detail="Invalid filename format.")
        
    file_path = os.path.join(TEMP_DIR, f"conv_{session_id}", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Requested file not found.")
        
    return FileResponse(file_path, media_type="application/octet-stream", filename=filename)

class CachedStaticFiles(StaticFiles):
    def file_response(self, *args, **kwargs):
        response = super().file_response(*args, **kwargs)
        path = args[0]
        if path.endswith(".html"):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        else:
            response.headers["Cache-Control"] = "public, max-age=86400"
        return response

app.mount("/static", CachedStaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index():
    index_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "index.html")
    if os.path.exists(index_path):
        response = FileResponse(index_path)
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
    return HTMLResponse("Backend API is running. static/index.html not found.")

if __name__ == "__main__":
    host = os.environ.get("APP_HOST", "127.0.0.1")
    port = int(os.environ.get("APP_PORT", "8000"))
    reload = os.environ.get("APP_DEBUG", "true").lower() == "true"
    workers = int(os.environ.get("APP_WORKERS", "1"))
    
    logger.info(f"Starting server with Uvicorn (host={host}, port={port}, reload={reload}, workers={workers if not reload else None})...")
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=reload,
        workers=workers if not reload else None
    )
