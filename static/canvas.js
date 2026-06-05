// PDF Viewer & Bounding Box Drawing Engine for SecureRedact PDF

import { DOM } from './dom.js';
import { State, saveAllStates } from './state.js';

const {
    pdfViewer,
    thumbnailSidebarContent,
    thumbnailSidebar,
    currentPageNum,
    totalPagesNum,
    zoomDisplay
} = DOM;

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 1. Render main PDF viewer pages
export function renderPDF() {
    pdfViewer.innerHTML = "";
    
    State.sessionData.pages.forEach(page => {
        const pageContainer = document.createElement("div");
        pageContainer.id = `page-container-${page.page_num}`;
        pageContainer.className = "page-container loading";
        
        const scaledWidth = page.width * State.zoomLevel;
        const scaledHeight = page.height * State.zoomLevel;
        
        pageContainer.style.width = `${scaledWidth}px`;
        pageContainer.style.height = `${scaledHeight}px`;
        
        const img = document.createElement("img");
        img.className = "page-image";
        img.src = page.image_url;
        img.style.width = "100%";
        img.style.height = "100%";
        
        img.onload = () => {
            pageContainer.classList.remove("loading");
        };
        img.onerror = () => {
            pageContainer.classList.remove("loading");
        };
        
        const overlay = document.createElement("div");
        overlay.id = `page-overlay-${page.page_num}`;
        overlay.className = "page-overlay";
        overlay.dataset.pageNum = page.page_num;
        
        // Setup Drag & Draw Events
        setupDrawingEvents(overlay, page);
        
        pageContainer.appendChild(img);
        pageContainer.appendChild(overlay);
        pdfViewer.appendChild(pageContainer);
        
        // Trigger rendering of highlights inside overlay
        renderPageOverlays(page.page_num, overlay, page);
    });
}

export function reRenderAllOverlays() {
    State.sessionData.pages.forEach(page => {
        const overlay = document.getElementById(`page-overlay-${page.page_num}`);
        if (overlay) {
            renderPageOverlays(page.page_num, overlay, page);
        }
    });
}

// Render redactions (auto & manual) for a specific page using percentage-based positions
export function renderPageOverlays(page_num, overlay, page) {
    overlay.innerHTML = "";
    
    // 1. Render Auto-detected findings on this page
    const pageFindings = State.sessionData.findings.filter(f => f.page_num === page_num);
    pageFindings.forEach(finding => {
        const isRedacted = State.redactedFindingIds.has(finding.id);
        
        finding.rects.forEach(rect => {
            const rectEl = document.createElement("div");
            rectEl.className = "redaction-highlight";
            if (isRedacted) rectEl.classList.add("redacted");
            
            rectEl.dataset.findingId = finding.id;
            rectEl.dataset.tooltip = `${finding.category}: ${finding.text}`;
            
            // Set percentage position and size relative to parent container
            rectEl.style.left = `${(rect.x0 / page.width) * 100}%`;
            rectEl.style.top = `${(rect.y0 / page.height) * 100}%`;
            rectEl.style.width = `${((rect.x1 - rect.x0) / page.width) * 100}%`;
            rectEl.style.height = `${((rect.y1 - rect.y0) / page.height) * 100}%`;
            
            // Toggle highlight click
            rectEl.addEventListener("click", (e) => {
                e.stopPropagation();
                // Coordinate state update centrally via dispatch / global handler or imported toggle
                // Let's call the global window function for backward compatibility
                if (window.toggleFindingRedaction) {
                    const nowRedacted = !State.redactedFindingIds.has(finding.id);
                    window.toggleFindingRedaction(finding.id, nowRedacted);
                }
            });
            
            overlay.appendChild(rectEl);
        });
    });
    
    // 2. Render Manual Redactions on this page
    const pageManuals = State.manualRedactions.filter(m => m.page_num === page_num);
    pageManuals.forEach(man => {
        const manEl = document.createElement("div");
        manEl.className = "manual-redaction-box";
        
        // Set percentage position and size relative to parent container
        manEl.style.left = `${(man.x0 / page.width) * 100}%`;
        manEl.style.top = `${(man.y0 / page.height) * 100}%`;
        manEl.style.width = `${((man.x1 - man.x0) / page.width) * 100}%`;
        manEl.style.height = `${((man.y1 - man.y0) / page.height) * 100}%`;
        
        // Delete button
        const delBtn = document.createElement("div");
        delBtn.className = "manual-redaction-delete";
        delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        delBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            removeManualRedaction(man.id);
        });
        
        manEl.appendChild(delBtn);
        overlay.appendChild(manEl);
    });
}

// Setup Canvas drawing handlers for manual redaction
export function setupDrawingEvents(overlay, page) {
    let startX = 0;
    let startY = 0;
    let isDrawing = false;
    let activeSelectionRect = null;
    
    overlay.addEventListener("mousedown", (e) => {
        if (e.target !== overlay) return; // avoid drawing when clicking existing boxes
        
        isDrawing = true;
        
        const rect = overlay.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        
        // Create selection container representation
        activeSelectionRect = document.createElement("div");
        activeSelectionRect.className = "selection-rect";
        activeSelectionRect.style.left = `${startX}px`;
        activeSelectionRect.style.top = `${startY}px`;
        overlay.appendChild(activeSelectionRect);
    });
    
    overlay.addEventListener("mousemove", (e) => {
        if (!isDrawing || !activeSelectionRect) return;
        
        const rect = overlay.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(startX - currentX);
        const height = Math.abs(startY - currentY);
        
        activeSelectionRect.style.left = `${left}px`;
        activeSelectionRect.style.top = `${top}px`;
        activeSelectionRect.style.width = `${width}px`;
        activeSelectionRect.style.height = `${height}px`;
    });
    
    const endDrawing = (e) => {
        if (!isDrawing) return;
        isDrawing = false;
        
        if (activeSelectionRect) {
            const rect = overlay.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;
            
            const left = Math.min(startX, endX);
            const top = Math.min(startY, endY);
            const width = Math.abs(startX - endX);
            const height = Math.abs(startY - endY);
            
            // Remove helper outline
            activeSelectionRect.remove();
            activeSelectionRect = null;
            
            // Add if drawn region has minimum drag size
            if (width > 6 && height > 6) {
                // Compute current scale based on layout dimensions
                const scaleX = overlay.clientWidth / page.width;
                const scaleY = overlay.clientHeight / page.height;
                const newRedaction = {
                    id: Math.random().toString(36).substring(2, 9),
                    page_num: page.page_num,
                    x0: left / scaleX,
                    y0: top / scaleY,
                    x1: (left + width) / scaleX,
                    y1: (top + height) / scaleY
                };
                
                State.manualRedactions.push(newRedaction);
                renderPageOverlays(page.page_num, overlay, page);
                if (window.updateRedactionCount) {
                    window.updateRedactionCount();
                }
            }
        }
    };
    
    overlay.addEventListener("mouseup", endDrawing);
    overlay.addEventListener("mouseleave", endDrawing);
}

export function removeManualRedaction(id) {
    State.manualRedactions = State.manualRedactions.filter(m => m.id !== id);
    reRenderAllOverlays();
    if (window.updateRedactionCount) {
        window.updateRedactionCount();
    }
}

// Workspace Zoom Adjustment (In-place DOM scaling)
export function adjustZoom(factor) {
    let newZoom = State.zoomLevel + factor;
    newZoom = Math.max(0.3, Math.min(3.0, newZoom));
    applyZoom(newZoom);
}

export function applyZoom(value) {
    State.zoomLevel = value;
    if (zoomDisplay) {
        zoomDisplay.innerText = `${Math.round(State.zoomLevel * 100)}%`;
    }
    
    State.sessionData.pages.forEach(page => {
        const pageContainer = document.getElementById(`page-container-${page.page_num}`);
        if (pageContainer) {
            const scaledWidth = page.width * State.zoomLevel;
            const scaledHeight = page.height * State.zoomLevel;
            pageContainer.style.width = `${scaledWidth}px`;
            pageContainer.style.height = `${scaledHeight}px`;
        }
    });
}

// Fit page to available width
export function fitToWidth() {
    if (!State.sessionData.pages || State.sessionData.pages.length === 0) return;
    const viewerOuter = document.querySelector(".pdf-viewer-outer");
    if (!viewerOuter) return;
    
    const availableWidth = viewerOuter.clientWidth - 64; // subtract padding
    const pageWidth = State.sessionData.pages[0].width;
    const newZoom = availableWidth / pageWidth;
    
    applyZoom(newZoom);
}

// Fit page to available height
export function fitToPage() {
    if (!State.sessionData.pages || State.sessionData.pages.length === 0) return;
    const viewerOuter = document.querySelector(".pdf-viewer-outer");
    if (!viewerOuter) return;
    
    const availableHeight = viewerOuter.clientHeight - 64; // subtract padding
    const pageHeight = State.sessionData.pages[0].height;
    const newZoom = availableHeight / pageHeight;
    
    applyZoom(newZoom);
}

// Scrolling Page Navigations
export function scrollToPage(pageNum) {
    const pageContainer = document.getElementById(`page-container-${pageNum}`);
    if (pageContainer) {
        pageContainer.scrollIntoView({ behavior: "smooth", block: "start" });
        
        // Apply brief focus flash effect
        pageContainer.style.outline = "2px solid var(--primary)";
        setTimeout(() => {
            pageContainer.style.outline = "none";
        }, 1200);
    }
}

export function scrollToPrevPage() {
    const activePage = getCurrentVisiblePage();
    if (activePage > 0) {
        scrollToPage(activePage - 1);
    }
}

export function scrollToNextPage() {
    const activePage = getCurrentVisiblePage();
    if (activePage < State.sessionData.totalPages - 1) {
        scrollToPage(activePage + 1);
    }
}

// Helper to check which page is currently in view
export function getCurrentVisiblePage() {
    const containers = document.querySelectorAll(".page-container");
    const viewerOuter = document.querySelector(".pdf-viewer-outer");
    if (!viewerOuter) return 0;
    const outerRect = viewerOuter.getBoundingClientRect();
    const center = outerRect.top + (outerRect.height / 2);
    
    let closestPage = 0;
    let minDistance = Infinity;
    
    containers.forEach((container, idx) => {
        const rect = container.getBoundingClientRect();
        const elementCenter = rect.top + (rect.height / 2);
        const distance = Math.abs(center - elementCenter);
        if (distance < minDistance) {
            minDistance = distance;
            closestPage = idx;
        }
    });
    
    return closestPage;
}

export function handleViewerScroll() {
    if (!State.sessionData.sessionId) return;
    const activePage = getCurrentVisiblePage();
    currentPageNum.innerText = activePage + 1;
    updateActiveThumbnail(activePage);
}

// Build and render page thumbnails in the sidebar
export function renderThumbnails() {
    if (!thumbnailSidebarContent) return;
    thumbnailSidebarContent.innerHTML = "";
    
    State.sessionData.pages.forEach(page => {
        const item = document.createElement("div");
        item.className = "thumbnail-item loading";
        item.id = `thumbnail-item-${page.page_num}`;
        if (page.page_num === 0) {
            item.classList.add("active-thumbnail");
        }
        
        item.innerHTML = `
            <div class="thumbnail-image-container">
                <img src="${page.image_url}" alt="Page ${page.page_num + 1}">
            </div>
            <span class="thumbnail-page-number">Page ${page.page_num + 1}</span>
        `;
        
        const img = item.querySelector("img");
        if (img) {
            img.onload = () => {
                item.classList.remove("loading");
            };
            img.onerror = () => {
                item.classList.remove("loading");
            };
        }
        
        item.addEventListener("click", () => {
            scrollToPage(page.page_num);
        });
        
        thumbnailSidebarContent.appendChild(item);
    });
}

// Highlight active thumbnail and scroll it into view inside the sidebar
export function updateActiveThumbnail(pageNum) {
    document.querySelectorAll(".thumbnail-item").forEach(item => {
        item.classList.remove("active-thumbnail");
    });
    
    const activeThumb = document.getElementById(`thumbnail-item-${pageNum}`);
    if (activeThumb) {
        activeThumb.classList.add("active-thumbnail");
        activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}

// Collapse/Expand Thumbnail Sidebar
export function toggleThumbnailSidebar() {
    if (thumbnailSidebar) {
        thumbnailSidebar.classList.toggle("collapsed");
    }
}
