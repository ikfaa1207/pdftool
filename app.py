import os
import re
import uuid
import time
import shutil
import zipfile
import multiprocessing
from typing import List, Dict, Any
import uvicorn
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fitz  # PyMuPDF

app = FastAPI(title="B2B Document Redactor & Sanitizer")

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

def cleanup_old_sessions():
    """Delete temporary session folders older than 15 minutes."""
    try:
        now = time.time()
        if os.path.exists(TEMP_DIR):
            for folder in os.listdir(TEMP_DIR):
                folder_path = os.path.join(TEMP_DIR, folder)
                if os.path.isdir(folder_path):
                    # 900 seconds = 15 minutes
                    if now - os.path.getmtime(folder_path) > 900:
                        shutil.rmtree(folder_path, ignore_errors=True)
    except Exception as e:
        print(f"Error cleaning up old sessions: {e}")

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

class OrganizeRequest(BaseModel):
    session_id: str
    pages: List[OrganizePageItem]

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    cleanup_old_sessions()
    
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    session_id = uuid.uuid4().hex
    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, mode=0o700, exist_ok=True)
    
    pdf_path = os.path.join(session_dir, "input.pdf")
    with open(pdf_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
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
            print(f"Error rendering page {page_num}: {e}")
            
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
    cleanup_old_sessions()
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
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
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
            merged_doc.insert_pdf(doc)
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
    cleanup_old_sessions()
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    session_id = uuid.uuid4().hex
    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, mode=0o700, exist_ok=True)
    
    pdf_path = os.path.join(session_dir, "input.pdf")
    with open(pdf_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
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
            print(f"Error rendering split preview page {page_num}: {e}")
            
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
    cleanup_old_sessions()
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    session_id = uuid.uuid4().hex
    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, mode=0o700, exist_ok=True)
    
    pdf_path = os.path.join(session_dir, "input.pdf")
    with open(pdf_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
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
    cleanup_old_sessions()
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    session_id = uuid.uuid4().hex
    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, mode=0o700, exist_ok=True)
    
    pdf_path = os.path.join(session_dir, "input.pdf")
    with open(pdf_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
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
                    print(f"Skipping image compression for xref {xref}: {img_err}")
                    
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
    return {"status": "success"}

# Mount frontend files

@app.post("/api/organize/upload")
async def organize_upload(file: UploadFile = File(...)):
    cleanup_old_sessions()
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    session_id = uuid.uuid4().hex
    session_dir = os.path.join(TEMP_DIR, session_id)
    os.makedirs(session_dir, mode=0o700, exist_ok=True)
    
    pdf_path = os.path.join(session_dir, "input.pdf")
    with open(pdf_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
        
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
            print(f"Error rendering organize preview page {page_num}: {e}")
            
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
            # Insert original page into output document
            out_doc.insert_pdf(src_doc, from_page=item.page_num, to_page=item.page_num)
            
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

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index():
    index_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("Backend API is running. static/index.html not found.")

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
