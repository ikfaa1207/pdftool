// API Services Layer for SecureRedact PDF

async function request(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        let errMsg = `Request failed: ${response.statusText}`;
        try {
            const errData = await response.json();
            errMsg = errData.detail || errMsg;
        } catch (e) {
            // Ignore parse errors, fallback to default
        }
        throw new Error(errMsg);
    }
    return response.json();
}

// 1. Sanitize & Redact PDF
export function apiUploadPDF(file) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/upload", {
        method: "POST",
        body: formData
    });
}

export function apiSearchPDF(sessionId, query, isRegex) {
    return request("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            query: query,
            is_regex: isRegex
        })
    });
}

export function apiRedactPDF(sessionId, redactions, stripMetadata) {
    return request("/api/redact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            redactions: redactions,
            strip_metadata: stripMetadata
        })
    });
}

// 2. Session Cleanup
export function apiCleanupSession(sessionId) {
    if (!sessionId) return Promise.resolve();
    // Use standard fetch without request helper to prevent blocking/reject handlers
    return fetch(`/api/cleanup/${sessionId}`, { method: "POST", keepalive: true })
        .catch(err => console.error("Session cleanup failed:", err));
}

// 3. Merge PDFs
export function apiMergeUpload(file, sessionId = null) {
    const formData = new FormData();
    formData.append("file", file);
    if (sessionId) {
        formData.append("session_id", sessionId);
    }
    return request("/api/merge/upload", {
        method: "POST",
        body: formData
    });
}

export function apiMergeExecute(sessionId, fileIds) {
    return request("/api/merge/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            file_ids: fileIds
        })
    });
}

// 4. Split PDF
export function apiSplitUpload(file) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/split/upload", {
        method: "POST",
        body: formData
    });
}

export function apiSplitExtract(sessionId, pages) {
    return request("/api/split/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            pages: pages
        })
    });
}

export function apiSplitParts(sessionId, parts) {
    return request("/api/split/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            parts: parts
        })
    });
}

// 5. Protect & Unlock PDF
export function apiSecurityUpload(file) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/security/upload", {
        method: "POST",
        body: formData
    });
}

export function apiSecurityUnlock(sessionId, password) {
    return request("/api/security/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            password: password
        })
    });
}

export function apiSecurityProtect(sessionId, config) {
    return request("/api/security/protect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            ...config
        })
    });
}

// 6. Compress PDF
export function apiCompressUpload(file) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/compress/upload", {
        method: "POST",
        body: formData
    });
}

export function apiCompressExecute(sessionId, level) {
    return request("/api/compress/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            level: level
        })
    });
}

// 7. Organize PDF
export function apiOrganizeUpload(file) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/organize/upload", {
        method: "POST",
        body: formData
    });
}

export function apiOrganizeExecute(sessionId, pages) {
    return request("/api/organize/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            pages: pages
        })
    });
}

// 8. Watermark PDF
export function apiWatermarkUpload(file) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/watermark/upload", {
        method: "POST",
        body: formData
    });
}

export function apiWatermarkUploadLogo(sessionId, file) {
    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("file", file);
    return request("/api/watermark/logo", {
        method: "POST",
        body: formData
    });
}

export function apiWatermarkExecute(sessionId, config) {
    return request("/api/watermark/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            ...config
        })
    });
}

// 9. Format Converter
export function apiConvertUploadPdf(file) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/api/convert/upload-pdf", {
        method: "POST",
        body: formData
    });
}

export function apiConvertUploadImages(files, sessionId = null) {
    const formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append("files", file);
    });
    if (sessionId) {
        formData.append("session_id", sessionId);
    }
    return request("/api/convert/upload-images", {
        method: "POST",
        body: formData
    });
}

export function apiConvertPdfToImage(sessionId, config) {
    return request("/api/convert/pdf-to-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            ...config
        })
    });
}

export function apiConvertImageToPdf(sessionId, config) {
    return request("/api/convert/image-to-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            ...config
        })
    });
}
