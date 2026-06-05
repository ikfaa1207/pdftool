// Unified State Management Store for SecureRedact PDF

export const State = {
    sessionData: {
        sessionId: null,
        filename: "",
        totalPages: 0,
        pages: [], // { page_num, width, height, image_url }
        findings: [] // { id, page_num, category, text, rects: [{x0,y0,x1,y1}] }
    },
    redactedFindingIds: new Set(),
    manualRedactions: [], // { id, page_num, x0, y0, x1, y1 }
    zoomLevel: 1.0,
    isRegexSearch: false,
    currentTabIndex: 0,

    mergeSessionData: {
        sessionId: null,
        files: [] // { fileId, filename, pageCount }
    },

    splitSessionData: {
        sessionId: null,
        filename: "",
        totalPages: 0,
        pages: [], // { page_num, width, height, image_url }
        selectedPages: new Set(),
        mode: "extract" // "extract" or "parts"
    },
    splitCutPoints: new Set(),

    securitySessionData: {
        sessionId: null,
        filename: "",
        fileSize: 0,
        totalPages: 0,
        isEncrypted: false
    },

    compressSessionData: {
        sessionId: null,
        filename: "",
        fileSize: 0,
        level: "medium"
    },

    organizeSessionData: {
        sessionId: null,
        filename: "",
        totalPages: 0,
        pages: [] // { page_num, width, height, image_url, rotation, deleted }
    },

    watermarkSessionData: {
        sessionId: null,
        filename: "",
        totalPages: 0,
        pages: [], // { page_num, width, height, image_url }
        currentPage: 0,
        type: "text",
        text: "CONFIDENTIAL",
        color: "#ef4444",
        fontSize: 36,
        rotation: 45,
        scale: 0.3,
        position: "center",
        opacity: 0.3,
        pagesMode: "all",
        customPages: "",
        logoUrl: null,
        logoFile: null
    },

    convertSessionData: {
        activeTab: "pdf-to-img",
        pdfSessionId: null,
        pdfFilename: "",
        pdfTotalPages: 0,
        pdfPages: [],
        pdfCurrentPage: 0,
        pdfFormat: "png",
        pdfDpi: 150,
        pdfPagesMode: "all",
        pdfCustomPages: "",
        imgSessionId: null,
        imgFiles: []
    }
};

export function saveAllStates() {
    let activeMode = "dashboard";
    const securitySection = document.getElementById("securitySection");
    const workspaceSection = document.getElementById("workspaceSection");
    const uploadSection = document.getElementById("uploadSection");
    const compressSection = document.getElementById("compressSection");
    const organizeSection = document.getElementById("organizeSection");
    const watermarkSection = document.getElementById("watermarkSection");
    const convertSection = document.getElementById("convertSection");
    const mergeSection = document.getElementById("mergeSection");
    const splitSection = document.getElementById("splitSection");

    if (securitySection && !securitySection.classList.contains("hidden")) activeMode = "security";
    else if (workspaceSection && !workspaceSection.classList.contains("hidden")) activeMode = "sanitize";
    else if (uploadSection && !uploadSection.classList.contains("hidden")) activeMode = "sanitize";
    else if (mergeSection && !mergeSection.classList.contains("hidden")) activeMode = "merge";
    else if (splitSection && !splitSection.classList.contains("hidden")) activeMode = "split";
    else if (compressSection && !compressSection.classList.contains("hidden")) activeMode = "compress";
    else if (organizeSection && !organizeSection.classList.contains("hidden")) activeMode = "organize";
    else if (watermarkSection && !watermarkSection.classList.contains("hidden")) activeMode = "watermark";
    else if (convertSection && !convertSection.classList.contains("hidden")) activeMode = "convert";

    const serializedState = {
        activeMode: activeMode,
        sessionData: State.sessionData,
        redactedFindingIds: Array.from(State.redactedFindingIds),
        manualRedactions: State.manualRedactions,
        mergeSessionData: State.mergeSessionData,
        splitSessionData: {
            ...State.splitSessionData,
            selectedPages: Array.from(State.splitSessionData.selectedPages)
        },
        splitCutPoints: Array.from(State.splitCutPoints),
        securitySessionData: State.securitySessionData,
        compressSessionData: State.compressSessionData,
        organizeSessionData: State.organizeSessionData,
        watermarkSessionData: {
            ...State.watermarkSessionData,
            logoUrl: null, // Don't serialize local object URLs
            logoFile: null  // Don't serialize File objects
        },
        convertSessionData: State.convertSessionData
    };
    sessionStorage.setItem("secure_redact_state", JSON.stringify(serializedState));
}

export function restoreAllStates(state) {
    if (!state) return;
    
    // Restore Sanitize
    if (state.sessionData && state.sessionData.sessionId) {
        State.sessionData = state.sessionData;
        State.redactedFindingIds = new Set(state.redactedFindingIds || []);
        State.manualRedactions = state.manualRedactions || [];
        
        const fileNameDisplay = document.getElementById("fileNameDisplay");
        const propFileName = document.getElementById("propFileName");
        const propPageCount = document.getElementById("propPageCount");
        const totalPagesNum = document.getElementById("totalPagesNum");
        const currentPageNum = document.getElementById("currentPageNum");
        const zoomDisplay = document.getElementById("zoomDisplay");
        const workspaceSection = document.getElementById("workspaceSection");
        const uploadSection = document.getElementById("uploadSection");

        if (fileNameDisplay) {
            fileNameDisplay.innerText = State.sessionData.filename;
            fileNameDisplay.title = State.sessionData.filename;
        }
        if (propFileName) {
            propFileName.innerText = State.sessionData.filename;
            propFileName.title = State.sessionData.filename;
        }
        if (propPageCount) propPageCount.innerText = State.sessionData.totalPages;
        if (totalPagesNum) totalPagesNum.innerText = State.sessionData.totalPages;
        if (currentPageNum) currentPageNum.innerText = "1";
        if (zoomDisplay) zoomDisplay.innerText = "100%";
        State.zoomLevel = 1.0;
        
        if (workspaceSection) workspaceSection.classList.remove("hidden");
        if (uploadSection) uploadSection.classList.add("hidden");
    }
    
    // Restore Merge
    if (state.mergeSessionData && state.mergeSessionData.sessionId) {
        State.mergeSessionData = state.mergeSessionData;
    }
    
    // Restore Split
    if (state.splitSessionData && state.splitSessionData.sessionId) {
        State.splitSessionData = {
            ...state.splitSessionData,
            selectedPages: new Set(state.splitSessionData.selectedPages || [])
        };
        State.splitCutPoints = new Set(state.splitCutPoints || []);
    }
    
    // Restore Security
    if (state.securitySessionData && state.securitySessionData.sessionId) {
        State.securitySessionData = state.securitySessionData;
    }
    
    // Restore Compress
    if (state.compressSessionData && state.compressSessionData.sessionId) {
        State.compressSessionData = state.compressSessionData;
    }
    
    // Restore Organize
    if (state.organizeSessionData && state.organizeSessionData.sessionId) {
        State.organizeSessionData = state.organizeSessionData;
    }

    // Restore Watermark
    if (state.watermarkSessionData && state.watermarkSessionData.sessionId) {
        State.watermarkSessionData = state.watermarkSessionData;
    }
    
    // Restore Convert
    if (state.convertSessionData) {
        State.convertSessionData = state.convertSessionData;
    }
}
