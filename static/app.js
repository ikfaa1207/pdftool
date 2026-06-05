// State Management
let sessionData = {
    sessionId: null,
    filename: "",
    totalPages: 0,
    pages: [], // { page_num, width, height, image_url }
    findings: [] // { id, page_num, category, text, rects: [{x0,y0,x1,y1}] }
};

let redactedFindingIds = new Set();
let manualRedactions = []; // { id, page_num, x0, y0, x1, y1 }
let zoomLevel = 1.0;
let isRegexSearch = false;

let mergeSessionData = {
    sessionId: null,
    files: [] // { fileId, filename, pageCount }
};

let splitSessionData = {
    sessionId: null,
    filename: "",
    totalPages: 0,
    pages: [], // { page_num, width, height, image_url }
    selectedPages: new Set(),
    mode: "extract" // "extract" or "parts"
};
let splitCutPoints = new Set();

let securitySessionData = {
    sessionId: null,
    filename: "",
    fileSize: 0,
    totalPages: 0,
    isEncrypted: false
};

let compressSessionData = {
    sessionId: null,
    filename: "",
    fileSize: 0,
    level: "medium"
};

let organizeSessionData = {
    sessionId: null,
    filename: "",
    totalPages: 0,
    pages: [] // { page_num, width, height, image_url, rotation, deleted }
};


// DOM Elements
const dashboardSection = document.getElementById("dashboardSection");
const toolSanitizeCard = document.getElementById("toolSanitizeCard");
const toolMergeCard = document.getElementById("toolMergeCard");
const toolSplitCard = document.getElementById("toolSplitCard");
const toolSecurityCard = document.getElementById("toolSecurityCard");
const toolCompressCard = document.getElementById("toolCompressCard");

const headerLogo = document.getElementById("headerLogo");

const sanitizeBackBtn = document.getElementById("sanitizeBackBtn");
const mergeBackBtn = document.getElementById("mergeBackBtn");
const splitBackBtn = document.getElementById("splitBackBtn");
const securityBackBtn = document.getElementById("securityBackBtn");
const compressBackBtn = document.getElementById("compressBackBtn");
const organizeBackBtn = document.getElementById("organizeBackBtn");

const compressSection = document.getElementById("compressSection");
const compressUploadCard = document.getElementById("compressUploadCard");
const compressFileInput = document.getElementById("compressFileInput");
const compressDropZone = document.getElementById("compressDropZone");
const compressWorkspaceContainer = document.getElementById("compressWorkspaceContainer");
const compressFileNameDisplay = document.getElementById("compressFileNameDisplay");
const compressFileSizeDisplay = document.getElementById("compressFileSizeDisplay");

// Configuration / Results Panels
const compressConfigPanel = document.getElementById("compressConfigPanel");
const compressResultsPanel = document.getElementById("compressResultsPanel");
const executeCompressBtn = document.getElementById("executeCompressBtn");
const closeCompressBtn = document.getElementById("closeCompressBtn");
const downloadCompressedBtn = document.getElementById("downloadCompressedBtn");
const closeCompressResultsBtn = document.getElementById("closeCompressResultsBtn");

// Results Displays
const originalSizeResult = document.getElementById("originalSizeResult");
const compressedSizeResult = document.getElementById("compressedSizeResult");
const savingPercentResult = document.getElementById("savingPercentResult");
const savingAbsoluteResult = document.getElementById("savingAbsoluteResult");

const organizeSection = document.getElementById("organizeSection");
const organizeUploadCard = document.getElementById("organizeUploadCard");
const organizeFileInput = document.getElementById("organizeFileInput");
const organizeDropZone = document.getElementById("organizeDropZone");
const organizeWorkspaceContainer = document.getElementById("organizeWorkspaceContainer");
const organizeFileNameDisplay = document.getElementById("organizeFileNameDisplay");
const organizeTotalPagesVal = document.getElementById("organizeTotalPagesVal");
const organizeDeleteCountVal = document.getElementById("organizeDeleteCountVal");
const organizeRotateCountVal = document.getElementById("organizeRotateCountVal");
const executeOrganizeBtn = document.getElementById("executeOrganizeBtn");
const clearOrganizeBtn = document.getElementById("clearOrganizeBtn");
const organizeThumbnailGrid = document.getElementById("organizeThumbnailGrid");
const closeOrganizeWorkspaceBtn = document.getElementById("closeOrganizeWorkspaceBtn");
const toolOrganizeCard = document.getElementById("toolOrganizeCard");

const securitySection = document.getElementById("securitySection");
const securityUploadCard = document.getElementById("securityUploadCard");
const securityFileInput = document.getElementById("securityFileInput");
const securityDropZone = document.getElementById("securityDropZone");
const securityWorkspaceContainer = document.getElementById("securityWorkspaceContainer");
const securityFileNameDisplay = document.getElementById("securityFileNameDisplay");
const securityPageCountDisplay = document.getElementById("securityPageCountDisplay");
const securityFileSizeDisplay = document.getElementById("securityFileSizeDisplay");

// Unlock Form Elements
const securityUnlockOverlay = document.getElementById("securityUnlockOverlay");
const securityUnlockPasswordInput = document.getElementById("securityUnlockPasswordInput");
const toggleUnlockPasswordBtn = document.getElementById("toggleUnlockPasswordBtn");
const executeUnlockBtn = document.getElementById("executeUnlockBtn");
const closeUnlockBtn = document.getElementById("closeUnlockBtn");

// Protect Form Elements
const securityProtectOptions = document.getElementById("securityProtectOptions");
const securityUserPasswordInput = document.getElementById("securityUserPasswordInput");
const toggleUserPasswordBtn = document.getElementById("toggleUserPasswordBtn");
const securityOwnerPasswordInput = document.getElementById("securityOwnerPasswordInput");
const toggleOwnerPasswordBtn = document.getElementById("toggleOwnerPasswordBtn");
const preventPrintToggle = document.getElementById("preventPrintToggle");
const preventCopyToggle = document.getElementById("preventCopyToggle");
const preventModifyToggle = document.getElementById("preventModifyToggle");
const executeProtectBtn = document.getElementById("executeProtectBtn");
const closeProtectBtn = document.getElementById("closeProtectBtn");


const uploadSection = document.getElementById("uploadSection");
const workspaceSection = document.getElementById("workspaceSection");
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const loadingModal = document.getElementById("loadingModal");
const loadingText = document.getElementById("loadingText");
const loadingProgressBar = document.getElementById("loadingProgressBar");

// Workspace Elements
const fileNameDisplay = document.getElementById("fileNameDisplay");
const currentPageNum = document.getElementById("currentPageNum");
const totalPagesNum = document.getElementById("totalPagesNum");
const zoomDisplay = document.getElementById("zoomDisplay");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const clearAllRedactionsBtn = document.getElementById("clearAllRedactionsBtn");
const pdfViewer = document.getElementById("pdfViewer");

// Thumbnail Sidebar Elements
const toggleThumbnailsBtn = document.getElementById("toggleThumbnailsBtn");
const thumbnailSidebar = document.getElementById("thumbnailSidebar");
const thumbnailSidebarContent = document.getElementById("thumbnailSidebarContent");

// Mobile Sidebar Drawer Elements
const toggleRightSidebarBtn = document.getElementById("toggleRightSidebarBtn");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const sidebarRight = document.querySelector(".sidebar-right");

// Fit Presets
const fitWidthBtn = document.getElementById("fitWidthBtn");
const fitPageBtn = document.getElementById("fitPageBtn");

// Sidebar Right & Tab Elements
const totalFindingsBadge = document.getElementById("totalFindingsBadge");
const aiFindingsTab = document.getElementById("aiFindingsTab");
const manualSearchTab = document.getElementById("manualSearchTab");
const settingsExportTab = document.getElementById("settingsExportTab");

const aiFindingsContent = document.getElementById("aiFindingsContent");
const manualSearchContent = document.getElementById("manualSearchContent");
const settingsExportContent = document.getElementById("settingsExportContent");

const searchInput = document.getElementById("searchInput");
const regexToggleBtn = document.getElementById("regexToggleBtn");
const searchBtn = document.getElementById("searchBtn");
const findingsContainer = document.getElementById("findingsContainer");
const searchResultsContainer = document.getElementById("searchResultsContainer");

// Sidebar Settings Card Elements
const propFileName = document.getElementById("propFileName");
const propPageCount = document.getElementById("propPageCount");
const propRedactionsCount = document.getElementById("propRedactionsCount");
const stripMetadataCheckbox = document.getElementById("stripMetadataCheckbox");
const sanitizeBtn = document.getElementById("sanitizeBtn");
const closeWorkspaceBtn = document.getElementById("closeWorkspaceBtn");

// Merge Elements
const mergeDropZone = document.getElementById("mergeDropZone");
const mergeFileInput = document.getElementById("mergeFileInput");
const mergeFileListContainer = document.getElementById("mergeFileListContainer");
const mergeFileList = document.getElementById("mergeFileList");
const executeMergeBtn = document.getElementById("executeMergeBtn");
const clearMergeBtn = document.getElementById("clearMergeBtn");

// Split Elements
const splitUploadCard = document.getElementById("splitUploadCard");
const splitWorkspaceContainer = document.getElementById("splitWorkspaceContainer");
const splitDropZone = document.getElementById("splitDropZone");
const splitFileInput = document.getElementById("splitFileInput");
const splitFileNameDisplay = document.getElementById("splitFileNameDisplay");
const splitModeExtractBtn = document.getElementById("splitModeExtractBtn");
const splitModePartsBtn = document.getElementById("splitModePartsBtn");
const splitGuideTitle = document.getElementById("splitGuideTitle");
const splitGuideText = document.getElementById("splitGuideText");
const splitTotalPagesVal = document.getElementById("splitTotalPagesVal");
const splitTargetCountVal = document.getElementById("splitTargetCountVal");
const executeSplitBtn = document.getElementById("executeSplitBtn");
const clearSplitBtn = document.getElementById("clearSplitBtn");
const splitThumbnailGrid = document.getElementById("splitThumbnailGrid");
const splitPartsRangeGroup = document.getElementById("splitPartsRangeGroup");
const splitPartsInput = document.getElementById("splitPartsInput");
const closeSplitWorkspaceBtn = document.getElementById("closeSplitWorkspaceBtn");

// Initialize Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    // Theme Toggle
    if (themeToggleBtn) themeToggleBtn.addEventListener("click", toggleTheme);
    
    // Header Logo Navigation
    if (headerLogo) headerLogo.addEventListener("click", returnToDashboard);

    // Global Mode Navigation Buttons
    const navSanitizeBtn = document.getElementById("navSanitizeBtn");
    const navMergeBtn = document.getElementById("navMergeBtn");
    const navSplitBtn = document.getElementById("navSplitBtn");
    
    if (navSanitizeBtn) navSanitizeBtn.addEventListener("click", () => switchAppMode("sanitize"));
    if (navMergeBtn) navMergeBtn.addEventListener("click", () => switchAppMode("merge"));
    if (navSplitBtn) navSplitBtn.addEventListener("click", () => switchAppMode("split"));

    // Back to Dashboard buttons (optional if present)
    if (sanitizeBackBtn) sanitizeBackBtn.addEventListener("click", returnToDashboard);
    if (mergeBackBtn) mergeBackBtn.addEventListener("click", returnToDashboard);
    if (splitBackBtn) splitBackBtn.addEventListener("click", returnToDashboard);
    if (securityBackBtn) securityBackBtn.addEventListener("click", returnToDashboard);
    if (compressBackBtn) compressBackBtn.addEventListener("click", returnToDashboard);
    if (organizeBackBtn) organizeBackBtn.addEventListener("click", returnToDashboard);

    // Dashboard Cards (optional if present)
    if (toolSanitizeCard) toolSanitizeCard.addEventListener("click", () => switchAppMode("sanitize"));
    if (toolMergeCard) toolMergeCard.addEventListener("click", () => switchAppMode("merge"));
    if (toolSplitCard) toolSplitCard.addEventListener("click", () => switchAppMode("split"));
    if (toolSecurityCard) toolSecurityCard.addEventListener("click", () => switchAppMode("security"));
    if (toolCompressCard) toolCompressCard.addEventListener("click", () => switchAppMode("compress"));
    if (toolOrganizeCard) toolOrganizeCard.addEventListener("click", () => switchAppMode("organize"));

    // File Drag & Drop (Sanitize)
    if (dropZone) {
        dropZone.addEventListener("click", () => {
            fileInput.click();
        });
        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.classList.add("dragover");
        });
        dropZone.addEventListener("dragleave", () => {
            dropZone.classList.remove("dragover");
        });
        dropZone.addEventListener("drop", handleFileDrop);
    }
    if (fileInput) {
        fileInput.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        fileInput.addEventListener("change", handleFileSelect);
    }
    
    // File Drag & Drop (Merge)
    if (mergeDropZone) {
        mergeDropZone.addEventListener("click", () => {
            mergeFileInput.click();
        });
        mergeDropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            mergeDropZone.classList.add("dragover");
        });
        mergeDropZone.addEventListener("dragleave", () => {
            mergeDropZone.classList.remove("dragover");
        });
        mergeDropZone.addEventListener("drop", handleMergeFileDrop);
    }
    if (mergeFileInput) {
        mergeFileInput.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        mergeFileInput.addEventListener("change", handleMergeFileSelect);
    }

    // File Drag & Drop (Split)
    if (splitDropZone) {
        splitDropZone.addEventListener("click", () => {
            splitFileInput.click();
        });
        splitDropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            splitDropZone.classList.add("dragover");
        });
        splitDropZone.addEventListener("dragleave", () => {
            splitDropZone.classList.remove("dragover");
        });
        splitDropZone.addEventListener("drop", handleSplitFileDrop);
    }
    if (splitFileInput) {
        splitFileInput.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        splitFileInput.addEventListener("change", handleSplitFileSelect);
    }

    // Split Mode Toggle Buttons
    if (splitModeExtractBtn) splitModeExtractBtn.addEventListener("click", () => switchSplitMode("extract"));
    if (splitModePartsBtn) splitModePartsBtn.addEventListener("click", () => switchSplitMode("parts"));

    // Split Inputs & Controls
    if (splitPartsInput) splitPartsInput.addEventListener("input", handleSplitPartsInputChange);
    if (executeSplitBtn) executeSplitBtn.addEventListener("click", runSplit);
    if (clearSplitBtn) clearSplitBtn.addEventListener("click", clearSplitState);
    if (closeSplitWorkspaceBtn) closeSplitWorkspaceBtn.addEventListener("click", closeSplitWorkspace);

    // Merge Actions
    if (executeMergeBtn) executeMergeBtn.addEventListener("click", runMerge);
    if (clearMergeBtn) clearMergeBtn.addEventListener("click", clearMergeState);

    // Main Tabs Switching
    if (aiFindingsTab) aiFindingsTab.addEventListener("click", () => switchMainTab("ai-findings"));
    if (manualSearchTab) manualSearchTab.addEventListener("click", () => switchMainTab("manual-search"));
    if (settingsExportTab) settingsExportTab.addEventListener("click", () => switchMainTab("settings-export"));

    // Inline Regex Toggle
    if (regexToggleBtn) regexToggleBtn.addEventListener("click", toggleRegexSearch);
    
    // Search Action
    if (searchBtn) searchBtn.addEventListener("click", handleCustomSearch);
    if (searchInput) {
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") handleCustomSearch();
        });
    }
    
    // Zoom Controls
    if (zoomInBtn) zoomInBtn.addEventListener("click", () => adjustZoom(0.1));
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => adjustZoom(-0.1));
    
    // Fit Presets
    if (fitWidthBtn) fitWidthBtn.addEventListener("click", fitToWidth);
    if (fitPageBtn) fitPageBtn.addEventListener("click", fitToPage);
    
    // Toggle Thumbnail Sidebar
    if (toggleThumbnailsBtn) toggleThumbnailsBtn.addEventListener("click", toggleThumbnailSidebar);
    
    // Mobile Sidebar Drawer Actions
    if (toggleRightSidebarBtn) {
        toggleRightSidebarBtn.addEventListener("click", toggleRightSidebar);
    }
    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener("click", closeAllMobileSidebars);
    }
    
    // Mobile close buttons inside drawers
    const closeRightSidebarBtn = document.getElementById("closeRightSidebarBtn");
    if (closeRightSidebarBtn) {
        closeRightSidebarBtn.addEventListener("click", closeAllMobileSidebars);
    }
    
    // Pagination (Scroll tracking and button clicks)
    if (prevPageBtn) prevPageBtn.addEventListener("click", scrollToPrevPage);
    if (nextPageBtn) nextPageBtn.addEventListener("click", scrollToNextPage);
    
    // Global Actions
    if (clearAllRedactionsBtn) clearAllRedactionsBtn.addEventListener("click", clearAllRedactions);
    if (sanitizeBtn) sanitizeBtn.addEventListener("click", runSanitization);
    if (closeWorkspaceBtn) closeWorkspaceBtn.addEventListener("click", closeWorkspace);
    
    // File Drag & Drop (Security)
    if (securityDropZone) {
        securityDropZone.addEventListener("click", () => {
            securityFileInput.click();
        });
        securityDropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            securityDropZone.classList.add("dragover");
        });
        securityDropZone.addEventListener("dragleave", () => {
            securityDropZone.classList.remove("dragover");
        });
        securityDropZone.addEventListener("drop", handleSecurityFileDrop);
    }
    if (securityFileInput) {
        securityFileInput.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        securityFileInput.addEventListener("change", handleSecurityFileSelect);
    }

    // Password Visibility Toggles
    if (toggleUnlockPasswordBtn && securityUnlockPasswordInput) {
        toggleUnlockPasswordBtn.addEventListener("click", () => {
            const isPw = securityUnlockPasswordInput.type === "password";
            securityUnlockPasswordInput.type = isPw ? "text" : "password";
            toggleUnlockPasswordBtn.querySelector("i").className = isPw ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
        });
    }
    if (toggleUserPasswordBtn && securityUserPasswordInput) {
        toggleUserPasswordBtn.addEventListener("click", () => {
            const isPw = securityUserPasswordInput.type === "password";
            securityUserPasswordInput.type = isPw ? "text" : "password";
            toggleUserPasswordBtn.querySelector("i").className = isPw ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
        });
    }
    if (toggleOwnerPasswordBtn && securityOwnerPasswordInput) {
        toggleOwnerPasswordBtn.addEventListener("click", () => {
            const isPw = securityOwnerPasswordInput.type === "password";
            securityOwnerPasswordInput.type = isPw ? "text" : "password";
            toggleOwnerPasswordBtn.querySelector("i").className = isPw ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
        });
    }

    // Security Action Handlers
    if (executeUnlockBtn) executeUnlockBtn.addEventListener("click", runUnlock);
    if (executeProtectBtn) executeProtectBtn.addEventListener("click", runProtect);
    if (closeUnlockBtn) closeUnlockBtn.addEventListener("click", closeSecurityWorkspace);
    if (closeProtectBtn) closeProtectBtn.addEventListener("click", closeSecurityWorkspace);

    // File Drag & Drop (Compress)
    if (compressDropZone) {
        compressDropZone.addEventListener("click", () => {
            compressFileInput.click();
        });
        compressDropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            compressDropZone.classList.add("dragover");
        });
        compressDropZone.addEventListener("dragleave", () => {
            compressDropZone.classList.remove("dragover");
        });
        compressDropZone.addEventListener("drop", handleCompressFileDrop);
    }
    if (compressFileInput) {
        compressFileInput.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        compressFileInput.addEventListener("change", handleCompressFileSelect);
    }

    // Segmented Option Pills for Compress
    const segmentBtns = document.querySelectorAll("#compressSection .segment-btn");
    segmentBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            segmentBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            compressSessionData.level = btn.dataset.level;
        });
    });

    // Compress Action Handlers
    if (executeCompressBtn) executeCompressBtn.addEventListener("click", runCompress);
    if (closeCompressBtn) closeCompressBtn.addEventListener("click", closeCompressWorkspace);
    if (closeCompressResultsBtn) closeCompressResultsBtn.addEventListener("click", closeCompressResults);
    if (downloadCompressedBtn) {
        downloadCompressedBtn.addEventListener("click", () => {
            const url = downloadCompressedBtn.dataset.downloadUrl;
            if (url) {
                triggerFileDownload(url, `compressed_${compressSessionData.filename || "document.pdf"}`);
            }
        });
    }

    // File Drag & Drop (Organize)
    if (organizeDropZone) {
        organizeDropZone.addEventListener("click", () => {
            organizeFileInput.click();
        });
        organizeDropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            organizeDropZone.classList.add("dragover");
        });
        organizeDropZone.addEventListener("dragleave", () => {
            organizeDropZone.classList.remove("dragover");
        });
        organizeDropZone.addEventListener("drop", handleOrganizeFileDrop);
    }
    if (organizeFileInput) {
        organizeFileInput.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        organizeFileInput.addEventListener("change", handleOrganizeFileSelect);
    }

    // Organize Action Handlers
    if (executeOrganizeBtn) executeOrganizeBtn.addEventListener("click", runOrganize);
    if (clearOrganizeBtn) clearOrganizeBtn.addEventListener("click", clearOrganizeState);
    if (closeOrganizeWorkspaceBtn) closeOrganizeWorkspaceBtn.addEventListener("click", closeOrganizeWorkspace);
    
    // Monitor scroll inside viewer to update page indicator
    const viewerOuter = document.querySelector(".pdf-viewer-outer");
    if (viewerOuter) viewerOuter.addEventListener("scroll", handleViewerScroll);
    
    // Restore session state on load if exists
    const savedStateStr = sessionStorage.getItem("secure_redact_state");
    if (savedStateStr) {
        try {
            const state = JSON.parse(savedStateStr);
            restoreAllStates(state);
        } catch (e) {
            console.error("Failed to restore session state:", e);
            sessionStorage.removeItem("secure_redact_state");
        }
    }
});

// Theme Management
function toggleTheme() {
    document.body.classList.toggle("dark");
    const icon = themeToggleBtn.querySelector("i");
    if (document.body.classList.contains("dark")) {
        icon.className = "fa-solid fa-sun";
    } else {
        icon.className = "fa-solid fa-moon";
    }
}

// File Upload Handler
function handleFileDrop(e) {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
        uploadFile(e.dataTransfer.files[0]);
    }
}

function handleFileSelect(e) {
    if (fileInput.files.length > 0) {
        uploadFile(fileInput.files[0]);
    }
}

function uploadFile(file) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
        alert("Please upload a PDF file.");
        return;
    }
    
    showLoading(true, "Uploading File...", 10);
    
    const formData = new FormData();
    formData.append("file", file);
    
    // Simulate upload progress
    let progress = 10;
    const progressInterval = setInterval(() => {
        if (progress < 80) {
            progress += 5;
            updateProgress(progress);
        }
    }, 300);
    
    fetch("/api/upload", {
        method: "POST",
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.detail || "Upload failed") });
        }
        return response.json();
    })
    .then(data => {
        clearInterval(progressInterval);
        updateProgress(100);
        
        setTimeout(() => {
            showLoading(false);
            initializeWorkspace(data);
        }, 300);
    })
    .catch(error => {
        clearInterval(progressInterval);
        showLoading(false);
        alert("Error: " + error.message);
        if (fileInput) fileInput.value = "";
    });
}

function showLoading(show, text = "Loading...", progress = 0) {
    if (show) {
        loadingText.innerText = text;
        loadingProgressBar.style.width = `${progress}%`;
        loadingModal.classList.remove("hidden");
    } else {
        loadingModal.classList.add("hidden");
    }
}

function updateProgress(progress) {
    loadingProgressBar.style.width = `${progress}%`;
}

// Workspace Tab Switching
function switchMainTab(tabId) {
    // Switch active states of tab buttons
    document.querySelectorAll(".sidebar-tab-btn").forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Switch active states of tab pane containers
    document.querySelectorAll(".tab-content-pane").forEach(pane => {
        if (pane.id === `${tabId.replace(/-([a-z])/g, g => g[1].toUpperCase())}Content`) {
            pane.classList.add("active");
        } else {
            pane.classList.remove("active");
        }
    });
}

// Inline Regex Toggle Handler
function toggleRegexSearch() {
    isRegexSearch = !isRegexSearch;
    regexToggleBtn.classList.toggle("active", isRegexSearch);
    if (isRegexSearch) {
        searchInput.placeholder = "Enter regular expression (e.g. \\b[A-Z]{3}\\d{4}\\b)...";
    } else {
        searchInput.placeholder = "Enter keyword to redact...";
    }
}

// Workspace Initialization
function initializeWorkspace(data) {
    sessionData = {
        sessionId: data.session_id,
        filename: data.filename,
        totalPages: data.total_pages,
        pages: data.pages,
        findings: data.findings
    };
    
    // Default: Redact all automatic findings
    redactedFindingIds = new Set(sessionData.findings.map(f => f.id));
    manualRedactions = [];
    zoomLevel = 1.0;
    zoomDisplay.innerText = "100%";
    
    // Update labels
    fileNameDisplay.innerText = sessionData.filename;
    propFileName.innerText = sessionData.filename;
    propPageCount.innerText = sessionData.totalPages;
    totalPagesNum.innerText = sessionData.totalPages;
    currentPageNum.innerText = "1";
    
    // Populate Sidebars
    renderFindingsList();
    renderPDF();
    renderThumbnails();
    updateRedactionCount();
    
    // Reset Search Results pane
    searchResultsContainer.innerHTML = `
        <div class="sidebar-empty-state">
            <i class="fa-solid fa-magnifying-glass"></i>
            <p>Run a search to find custom terms.</p>
        </div>
    `;
    
    // Switch to findings tab by default
    switchMainTab("ai-findings");
    
    // Switch views
    uploadSection.classList.add("hidden");
    workspaceSection.classList.remove("hidden");
    
    // Fit to width by default once layout dimensions are established
    setTimeout(() => {
        fitToWidth();
    }, 150);
}

// Populate Findings Sidebar accordion with specific PII category icons using Switch Toggles
function renderFindingsList() {
    findingsContainer.innerHTML = "";
    totalFindingsBadge.innerText = sessionData.findings.length;
    
    if (sessionData.findings.length === 0) {
        findingsContainer.innerHTML = `
            <div class="sidebar-empty-state">
                <i class="fa-solid fa-shield-circle-check"></i>
                <p>No sensitive data patterns auto-detected.</p>
            </div>
        `;
        return;
    }
    
    // Category icons mapping dictionary
    const CATEGORY_ICONS = {
        "Email": "fa-envelope",
        "Phone Number": "fa-phone",
        "Social Security Number (SSN)": "fa-id-card",
        "Employer Identification Number (EIN)": "fa-building-columns",
        "Credit Card": "fa-credit-card",
        "IP Address": "fa-network-wired",
        "Custom Search": "fa-magnifying-glass",
        "Custom Regex Match": "fa-code"
    };
    
    // Group by category
    const grouped = {};
    sessionData.findings.forEach(finding => {
        if (!grouped[finding.category]) {
            grouped[finding.category] = [];
        }
        grouped[finding.category].push(finding);
    });
    
    // Render each category group
    Object.keys(grouped).sort().forEach(category => {
        const items = grouped[category];
        const groupEl = document.createElement("div");
        groupEl.className = "findings-category-group";
        
        // Header
        const allChecked = items.every(item => redactedFindingIds.has(item.id));
        const checkedAttr = allChecked ? "checked" : "";
        const iconClass = CATEGORY_ICONS[category] || "fa-eye";
        
        groupEl.innerHTML = `
            <div class="category-header">
                <div class="category-title">
                    <label class="switch category-toggle-label" onclick="event.stopPropagation();">
                        <input type="checkbox" class="category-master-cb" data-category="${category}" ${checkedAttr}>
                        <span class="slider"></span>
                    </label>
                    <i class="fa-solid ${iconClass}"></i>
                    <span>${category} (${items.length})</span>
                </div>
                <i class="fa-solid fa-chevron-down category-chevron"></i>
            </div>
            <div class="category-items-list"></div>
        `;
        
        const listEl = groupEl.querySelector(".category-items-list");
        
        // Add items to category list
        items.forEach(item => {
            const itemRow = document.createElement("div");
            itemRow.className = "finding-item-row";
            const isRedacted = redactedFindingIds.has(item.id);
            
            itemRow.innerHTML = `
                <div class="finding-left">
                    <label class="switch item-toggle-switch">
                        <input type="checkbox" class="finding-item-cb" data-finding-id="${item.id}" ${isRedacted ? "checked" : ""}>
                        <span class="slider"></span>
                    </label>
                    <span class="finding-text" title="${escapeHtml(item.text)}">${escapeHtml(item.text)}</span>
                </div>
                <span class="finding-page-link" data-page="${item.page_num}">Pg ${item.page_num + 1}</span>
            `;
            
            // Go to page click handler
            itemRow.querySelector(".finding-page-link").addEventListener("click", () => {
                scrollToPage(item.page_num);
                closeAllMobileSidebars();
            });
            
            // Checkbox change handler
            itemRow.querySelector(".finding-item-cb").addEventListener("change", (e) => {
                toggleFindingRedaction(item.id, e.target.checked);
            });
            
            listEl.appendChild(itemRow);
        });
        
        // Accordion toggle click handler
        groupEl.querySelector(".category-header").addEventListener("click", () => {
            groupEl.classList.toggle("collapsed");
        });
        
        // Master category checkbox toggle handler
        groupEl.querySelector(".category-master-cb").addEventListener("change", (e) => {
            const checked = e.target.checked;
            items.forEach(item => {
                toggleFindingRedaction(item.id, checked, false); // batch toggle without re-rendering list each time
            });
            // Update item checkboxes visually
            groupEl.querySelectorAll(".finding-item-cb").forEach(cb => cb.checked = checked);
            reRenderAllOverlays();
            updateRedactionCount();
        });
        
        findingsContainer.appendChild(groupEl);
    });
}

// Toggle redaction status of a finding
function toggleFindingRedaction(id, check, triggerListRender = true) {
    if (check) {
        redactedFindingIds.add(id);
    } else {
        redactedFindingIds.delete(id);
    }
    
    // Update individual visual block
    document.querySelectorAll(`.redaction-highlight[data-finding-id="${id}"]`).forEach(el => {
        if (check) {
            el.classList.add("redacted");
        } else {
            el.classList.remove("redacted");
        }
    });
    
    // Sync checkbox/switch states visually
    const aiCb = document.querySelector(`.finding-item-cb[data-finding-id="${id}"]`);
    if (aiCb) aiCb.checked = check;
    
    const searchCb = document.querySelector(`.search-result-cb[data-finding-id="${id}"]`);
    if (searchCb) searchCb.checked = check;
    
    updateRedactionCount();
    
    if (triggerListRender) {
        // Update category master checkbox states
        updateCategoryMasterCheckboxes();
    }
}

// Check category master checkboxes match current item states
function updateCategoryMasterCheckboxes() {
    const groups = document.querySelectorAll(".findings-category-group");
    groups.forEach(group => {
        const itemCbs = Array.from(group.querySelectorAll(".finding-item-cb"));
        const masterCb = group.querySelector(".category-master-cb");
        if (itemCbs.length > 0 && masterCb) {
            const allChecked = itemCbs.every(cb => cb.checked);
            masterCb.checked = allChecked;
        }
    });
}

// Render PDF pages
function renderPDF() {
    pdfViewer.innerHTML = "";
    
    sessionData.pages.forEach(page => {
        const pageContainer = document.createElement("div");
        pageContainer.id = `page-container-${page.page_num}`;
        pageContainer.className = "page-container";
        
        const scaledWidth = page.width * zoomLevel;
        const scaledHeight = page.height * zoomLevel;
        
        pageContainer.style.width = `${scaledWidth}px`;
        pageContainer.style.height = `${scaledHeight}px`;
        
        const img = document.createElement("img");
        img.className = "page-image";
        img.src = page.image_url;
        img.style.width = "100%";
        img.style.height = "100%";
        
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

function reRenderAllOverlays() {
    sessionData.pages.forEach(page => {
        const overlay = document.getElementById(`page-overlay-${page.page_num}`);
        if (overlay) {
            renderPageOverlays(page.page_num, overlay, page);
        }
    });
}

// Render redactions (auto & manual) for a specific page using percentage-based positions
function renderPageOverlays(page_num, overlay, page) {
    overlay.innerHTML = "";
    
    // 1. Render Auto-detected findings on this page
    const pageFindings = sessionData.findings.filter(f => f.page_num === page_num);
    pageFindings.forEach(finding => {
        const isRedacted = redactedFindingIds.has(finding.id);
        
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
                const nowRedacted = !redactedFindingIds.has(finding.id);
                toggleFindingRedaction(finding.id, nowRedacted);
                
                // Update checkbox in sidebar
                const cb = document.querySelector(`.finding-item-cb[data-finding-id="${finding.id}"]`);
                if (cb) cb.checked = nowRedacted;
            });
            
            overlay.appendChild(rectEl);
        });
    });
    
    // 2. Render Manual Redactions on this page
    const pageManuals = manualRedactions.filter(m => m.page_num === page_num);
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
function setupDrawingEvents(overlay, page) {
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
                
                manualRedactions.push(newRedaction);
                renderPageOverlays(page.page_num, overlay, page);
                updateRedactionCount();
            }
        }
    };
    
    overlay.addEventListener("mouseup", endDrawing);
    overlay.addEventListener("mouseleave", endDrawing);
}

function removeManualRedaction(id) {
    manualRedactions = manualRedactions.filter(m => m.id !== id);
    reRenderAllOverlays();
    updateRedactionCount();
}

// Render custom search results inside the search tab list with Switch Toggles
function renderSearchResultsList(results, query) {
    searchResultsContainer.innerHTML = "";
    
    const headerEl = document.createElement("div");
    headerEl.className = "search-results-header";
    headerEl.innerHTML = `
        <h4 style="margin: 8px 0; font-size: var(--font-size-xs); color: var(--text-secondary);">
            Search Results for "${escapeHtml(query)}" (${results.length})
        </h4>
    `;
    searchResultsContainer.appendChild(headerEl);
    
    results.forEach(item => {
        const itemRow = document.createElement("div");
        itemRow.className = "finding-item-row";
        const isRedacted = redactedFindingIds.has(item.id);
        
        itemRow.innerHTML = `
            <div class="finding-left">
                <label class="switch item-toggle-switch">
                    <input type="checkbox" class="search-result-cb" data-finding-id="${item.id}" ${isRedacted ? "checked" : ""}>
                    <span class="slider"></span>
                </label>
                <span class="finding-text" title="${escapeHtml(item.text)}">${escapeHtml(item.text)}</span>
            </div>
            <span class="finding-page-link" data-page="${item.page_num}">Pg ${item.page_num + 1}</span>
        `;
        
        // Go to page click handler
        itemRow.querySelector(".finding-page-link").addEventListener("click", () => {
            scrollToPage(item.page_num);
            closeAllMobileSidebars();
        });
        
        // Checkbox change handler
        itemRow.querySelector(".search-result-cb").addEventListener("change", (e) => {
            toggleFindingRedaction(item.id, e.target.checked);
        });
        
        searchResultsContainer.appendChild(itemRow);
    });
}

// Query custom matches from PDF
function handleCustomSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    showLoading(true, "Searching Document...", 40);
    
    fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionData.sessionId,
            query: query,
            is_regex: isRegexSearch
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.detail || "Search failed") });
        }
        return response.json();
    })
    .then(data => {
        showLoading(false);
        
        if (data.results.length === 0) {
            alert("No matches found for search query.");
            return;
        }
        
        // Add new findings to session findings
        data.results.forEach(result => {
            // Check if finding is already added to avoid double counts
            const exists = sessionData.findings.some(f => f.text === result.text && f.page_num === result.page_num);
            if (!exists) {
                sessionData.findings.push(result);
                redactedFindingIds.add(result.id); // Auto-check new search results
            }
        });
        
        // Render search results directly in the Search tab
        renderSearchResultsList(data.results, query);
        
        // Refresh sidebar lists and workspace highlights
        renderFindingsList();
        reRenderAllOverlays();
        updateRedactionCount();
        
        // Scroll to first new result
        if (data.results.length > 0) {
            scrollToPage(data.results[0].page_num);
        }
        
        searchInput.value = "";
    })
    .catch(error => {
        showLoading(false);
        alert("Search error: " + error.message);
    });
}

// Workspace Zoom Adjustment (In-place DOM scaling)
function adjustZoom(factor) {
    let newZoom = zoomLevel + factor;
    newZoom = Math.max(0.3, Math.min(3.0, newZoom));
    applyZoom(newZoom);
}

// Apply zoom factor by resizing the elements directly (avoiding DOM recreation)
function applyZoom(value) {
    zoomLevel = value;
    if (zoomDisplay) {
        zoomDisplay.innerText = `${Math.round(zoomLevel * 100)}%`;
    }
    
    sessionData.pages.forEach(page => {
        const pageContainer = document.getElementById(`page-container-${page.page_num}`);
        if (pageContainer) {
            const scaledWidth = page.width * zoomLevel;
            const scaledHeight = page.height * zoomLevel;
            pageContainer.style.width = `${scaledWidth}px`;
            pageContainer.style.height = `${scaledHeight}px`;
        }
    });
}

// Fit page to available width
function fitToWidth() {
    if (!sessionData.pages || sessionData.pages.length === 0) return;
    const viewerOuter = document.querySelector(".pdf-viewer-outer");
    if (!viewerOuter) return;
    
    const availableWidth = viewerOuter.clientWidth - 64; // subtract padding
    const pageWidth = sessionData.pages[0].width;
    const newZoom = availableWidth / pageWidth;
    
    applyZoom(newZoom);
}

// Fit page to available height
function fitToPage() {
    if (!sessionData.pages || sessionData.pages.length === 0) return;
    const viewerOuter = document.querySelector(".pdf-viewer-outer");
    if (!viewerOuter) return;
    
    const availableHeight = viewerOuter.clientHeight - 64; // subtract padding
    const pageHeight = sessionData.pages[0].height;
    const newZoom = availableHeight / pageHeight;
    
    applyZoom(newZoom);
}

// Scrolling Page Navigations
function scrollToPage(pageNum) {
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

function scrollToPrevPage() {
    const activePage = getCurrentVisiblePage();
    if (activePage > 0) {
        scrollToPage(activePage - 1);
    }
}

function scrollToNextPage() {
    const activePage = getCurrentVisiblePage();
    if (activePage < sessionData.totalPages - 1) {
        scrollToPage(activePage + 1);
    }
}

// Helper to check which page is currently in view
function getCurrentVisiblePage() {
    const containers = document.querySelectorAll(".page-container");
    const viewerOuter = document.querySelector(".pdf-viewer-outer");
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

function handleViewerScroll() {
    if (!sessionData.sessionId) return;
    const activePage = getCurrentVisiblePage();
    currentPageNum.innerText = activePage + 1;
    updateActiveThumbnail(activePage);
}

// Global actions
function clearAllRedactions() {
    if (confirm("Are you sure you want to clear all manual and automatic redactions?")) {
        redactedFindingIds.clear();
        manualRedactions = [];
        
        // Uncheck all sidebar items
        document.querySelectorAll(".finding-item-cb").forEach(cb => cb.checked = false);
        document.querySelectorAll(".category-master-cb").forEach(cb => cb.checked = false);
        
        reRenderAllOverlays();
        updateRedactionCount();
    }
}

function updateRedactionCount() {
    // Count active auto findings + manual boxes
    const activeAutoCount = Array.from(redactedFindingIds).reduce((acc, id) => {
        const finding = sessionData.findings.find(f => f.id === id);
        return acc + (finding ? finding.rects.length : 0);
    }, 0);
    
    const totalCount = activeAutoCount + manualRedactions.length;
    propRedactionsCount.innerText = totalCount;
}

// Save Redactions & metadata to compile PDF
function runSanitization() {
    if (sessionData.findings.length === 0 && manualRedactions.length === 0) {
        alert("No redactions defined to sanitize this document.");
        return;
    }
    
    showLoading(true, "Sanitizing Document Layers...", 20);
    
    // Group active findings and manual edits by page
    const redactionPayload = [];
    
    // Build redactions payload
    for (let pNum = 0; pNum < sessionData.totalPages; pNum++) {
        const pageRects = [];
        
        // Add checked auto findings
        const pageFindings = sessionData.findings.filter(f => f.page_num === pNum && redactedFindingIds.has(f.id));
        pageFindings.forEach(f => {
            pageRects.push(...f.rects);
        });
        
        // Add manual highlights
        const pageManuals = manualRedactions.filter(m => m.page_num === pNum);
        pageManuals.forEach(m => {
            pageRects.push({ x0: m.x0, y0: m.y0, x1: m.x1, y1: m.y1 });
        });
        
        if (pageRects.length > 0) {
            redactionPayload.push({
                page_num: pNum,
                rects: pageRects
            });
        }
    }
    
    updateProgress(50);
    
    const requestBody = {
        session_id: sessionData.sessionId,
        redactions: redactionPayload,
        strip_metadata: stripMetadataCheckbox.checked
    };
    
    fetch("/api/redact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.detail || "Sanitization request failed") });
        }
        return response.json();
    })
    .then(data => {
        updateProgress(90);
        
        // Trigger file download
        const downloadUrl = data.download_url;
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `redacted_${sessionData.filename}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        updateProgress(100);
        setTimeout(() => {
            showLoading(false);
            alert("Document successfully sanitized and downloaded! Ephemeral session terminated.");
            closeWorkspace();
        }, 500);
    })
    .catch(error => {
        showLoading(false);
        alert("Sanitization error: " + error.message);
    });
}

function closeWorkspace() {
    sessionData = {
        sessionId: null,
        filename: "",
        totalPages: 0,
        pages: [],
        findings: []
    };
    redactedFindingIds.clear();
    manualRedactions = [];
    
    pdfViewer.innerHTML = "";
    findingsContainer.innerHTML = "";
    searchResultsContainer.innerHTML = `
        <div class="sidebar-empty-state">
            <i class="fa-solid fa-magnifying-glass"></i>
            <p>Run a search to find custom terms.</p>
        </div>
    `;
    
    // Clear thumbnails and expand sidebar for next document
    if (thumbnailSidebarContent) thumbnailSidebarContent.innerHTML = "";
    if (thumbnailSidebar) thumbnailSidebar.classList.remove("collapsed");
    
    // Close mobile sidebars
    closeAllMobileSidebars();
    
    // Default to first tab
    switchMainTab("ai-findings");
    
    workspaceSection.classList.add("hidden");
    uploadSection.classList.remove("hidden");
    if (fileInput) fileInput.value = "";
}

// Utility to escape HTML elements inside string
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Build and render page thumbnails in the sidebar
function renderThumbnails() {
    if (!thumbnailSidebarContent) return;
    thumbnailSidebarContent.innerHTML = "";
    
    sessionData.pages.forEach(page => {
        const item = document.createElement("div");
        item.className = "thumbnail-item";
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
        
        item.addEventListener("click", () => {
            scrollToPage(page.page_num);
        });
        
        thumbnailSidebarContent.appendChild(item);
    });
}

// Highlight active thumbnail and scroll it into view inside the sidebar
function updateActiveThumbnail(pageNum) {
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
function toggleThumbnailSidebar() {
    if (thumbnailSidebar) {
        thumbnailSidebar.classList.toggle("collapsed");
    }
}

// // Mobile sidebar drawer toggles
function toggleRightSidebar() {
    if (!sidebarRight) return;
    sidebarRight.classList.toggle("open");
    updateBackdropVisibility();
}

function closeAllMobileSidebars() {
    if (sidebarRight) sidebarRight.classList.remove("open");
    updateBackdropVisibility();
}

function updateBackdropVisibility() {
    const isRightOpen = sidebarRight && sidebarRight.classList.contains("open");
    
    if (sidebarBackdrop) {
        if (isRightOpen) {
            sidebarBackdrop.classList.remove("hidden");
        } else {
            sidebarBackdrop.classList.add("hidden");
        }
    }
}

// Navigation & App Mode management
function switchAppMode(mode) {
    // Update nav buttons active states
    document.querySelectorAll(".nav-btn").forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Hide all sections first
    if (dashboardSection) dashboardSection.classList.add("hidden");
    if (uploadSection) uploadSection.classList.add("hidden");
    if (workspaceSection) workspaceSection.classList.add("hidden");
    
    const mergeSec = document.getElementById("mergeSection");
    const splitSec = document.getElementById("splitSection");
    if (mergeSec) mergeSec.classList.add("hidden");
    if (splitSec) splitSec.classList.add("hidden");
    if (securitySection) securitySection.classList.add("hidden");
    if (compressSection) compressSection.classList.add("hidden");
    if (organizeSection) organizeSection.classList.add("hidden");

    if (mode === "dashboard") {
        if (dashboardSection) dashboardSection.classList.remove("hidden");
    } else if (mode === "sanitize") {
        if (sessionData.sessionId) {
            if (workspaceSection) workspaceSection.classList.remove("hidden");
        } else {
            if (uploadSection) uploadSection.classList.remove("hidden");
        }
    } else if (mode === "merge") {
        if (mergeSec) mergeSec.classList.remove("hidden");
        renderMergeFileList();
    } else if (mode === "split") {
        if (splitSec) splitSec.classList.remove("hidden");
        if (splitSessionData.sessionId) {
            if (splitUploadCard) splitUploadCard.classList.add("hidden");
            if (splitWorkspaceContainer) splitWorkspaceContainer.classList.remove("hidden");
            renderSplitThumbnails();
        } else {
            if (splitUploadCard) splitUploadCard.classList.remove("hidden");
            if (splitWorkspaceContainer) splitWorkspaceContainer.classList.add("hidden");
        }
    } else if (mode === "security") {
        if (securitySection) securitySection.classList.remove("hidden");
        if (securitySessionData.sessionId) {
            if (securityUploadCard) securityUploadCard.classList.add("hidden");
            if (securityWorkspaceContainer) securityWorkspaceContainer.classList.remove("hidden");
            renderSecurityWorkspace();
        } else {
            if (securityUploadCard) securityUploadCard.classList.remove("hidden");
            if (securityWorkspaceContainer) securityWorkspaceContainer.classList.add("hidden");
        }
    } else if (mode === "compress") {
        if (compressSection) compressSection.classList.remove("hidden");
        if (compressSessionData.sessionId) {
            if (compressUploadCard) compressUploadCard.classList.add("hidden");
            if (compressWorkspaceContainer) compressWorkspaceContainer.classList.remove("hidden");
            renderCompressWorkspace();
        } else {
            if (compressUploadCard) compressUploadCard.classList.remove("hidden");
            if (compressWorkspaceContainer) compressWorkspaceContainer.classList.add("hidden");
        }
    } else if (mode === "organize") {
        if (organizeSection) organizeSection.classList.remove("hidden");
        if (organizeSessionData.sessionId) {
            if (organizeUploadCard) organizeUploadCard.classList.add("hidden");
            if (organizeWorkspaceContainer) organizeWorkspaceContainer.classList.remove("hidden");
            renderOrganizeWorkspace();
        } else {
            if (organizeUploadCard) organizeUploadCard.classList.remove("hidden");
            if (organizeWorkspaceContainer) organizeWorkspaceContainer.classList.add("hidden");
        }
    }
}

function showTool(tool) {
    switchAppMode(tool);
}

function returnToDashboard() {
    closeWorkspace(); // Cleans sanitize state
    clearMergeState(); // Cleans merge state
    closeSplitWorkspace(); // Cleans split state
    closeSecurityWorkspace(); // Cleans security state
    closeCompressWorkspace(); // Cleans compress state
    closeOrganizeWorkspace(); // Cleans organize state
    
    switchAppMode("dashboard");
}

// Merge PDFs tool handlers
function handleMergeFileSelect(e) {
    if (mergeFileInput.files.length > 0) {
        uploadMergeFiles(Array.from(mergeFileInput.files));
    }
}

function handleMergeFileDrop(e) {
    e.preventDefault();
    mergeDropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
        uploadMergeFiles(Array.from(e.dataTransfer.files));
    }
}

function uploadMergeFiles(files) {
    const invalid = files.some(f => !f.name.toLowerCase().endsWith(".pdf"));
    if (invalid) {
        alert("All uploaded files must be PDFs.");
        return;
    }

    showLoading(true, "Uploading and parsing PDFs...", 20);

    let uploadedCount = 0;
    const totalToUpload = files.length;

    function uploadNext(index) {
        if (index >= totalToUpload) {
            showLoading(false);
            renderMergeFileList();
            return;
        }

        const file = files[index];
        const formData = new FormData();
        formData.append("file", file);
        if (mergeSessionData.sessionId) {
            formData.append("session_id", mergeSessionData.sessionId);
        }

        fetch("/api/merge/upload", {
            method: "POST",
            body: formData
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw new Error(err.detail || `Upload failed for ${file.name}`) });
            }
            return res.json();
        })
        .then(data => {
            mergeSessionData.sessionId = data.session_id;
            mergeSessionData.files.push({
                fileId: data.file_id,
                filename: data.filename,
                pageCount: data.page_count,
                previewUrl: data.preview_url
            });
            uploadedCount++;
            updateProgress(Math.round((uploadedCount / totalToUpload) * 100));
            uploadNext(index + 1);
        })
        .catch(err => {
            showLoading(false);
            alert(err.message);
            if (mergeFileInput) mergeFileInput.value = "";
        });
    }

    uploadNext(0);
}

function renderMergeFileList() {
    mergeFileList.innerHTML = "";
    if (mergeSessionData.files.length === 0) {
        mergeFileListContainer.classList.add("hidden");
        return;
    }

    mergeFileListContainer.classList.remove("hidden");

    mergeSessionData.files.forEach((file, index) => {
        const item = document.createElement("div");
        item.className = "merge-file-item";
        item.draggable = true;
        item.dataset.index = index;

        item.innerHTML = `
            <div class="merge-drag-handle">
                <i class="fa-solid fa-grip-vertical"></i>
            </div>
            <div class="merge-file-preview">
                <img src="${file.previewUrl || '/static/pdf-icon.png'}" alt="Preview">
            </div>
            <div class="merge-file-info">
                <span class="merge-file-name" title="${escapeHtml(file.filename)}">${escapeHtml(file.filename)}</span>
                <span class="merge-file-pages">${file.pageCount} page(s)</span>
            </div>
            <div class="merge-file-actions">
                <button class="merge-action-btn move-up" title="Move Up" ${index === 0 ? "disabled" : ""}>
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button class="merge-action-btn move-down" title="Move Down" ${index === mergeSessionData.files.length - 1 ? "disabled" : ""}>
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
                <button class="merge-action-btn delete" title="Remove File">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;

        item.querySelector(".move-up").addEventListener("click", () => moveMergeFile(index, -1));
        item.querySelector(".move-down").addEventListener("click", () => moveMergeFile(index, 1));
        item.querySelector(".delete").addEventListener("click", () => removeMergeFile(index));

        setupMergeDragAndDrop(item);

        mergeFileList.appendChild(item);
    });
}

function moveMergeFile(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= mergeSessionData.files.length) return;

    const file = mergeSessionData.files.splice(index, 1)[0];
    mergeSessionData.files.splice(targetIndex, 0, file);
    renderMergeFileList();
}

function removeMergeFile(index) {
    mergeSessionData.files.splice(index, 1);
    renderMergeFileList();
}

let dragSourceEl = null;

function setupMergeDragAndDrop(item) {
    item.addEventListener("dragstart", (e) => {
        dragSourceEl = item;
        item.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.dataset.index);
    });

    item.addEventListener("dragend", () => {
        item.classList.remove("dragging");
        document.querySelectorAll(".merge-file-item").forEach(el => {
            el.style.borderTop = "";
            el.style.borderBottom = "";
        });
    });

    item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        
        const rect = item.getBoundingClientRect();
        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
        
        document.querySelectorAll(".merge-file-item").forEach(el => {
            el.style.borderTop = "";
            el.style.borderBottom = "";
        });
        
        if (next) {
            item.style.borderBottom = "2px solid var(--primary)";
        } else {
            item.style.borderTop = "2px solid var(--primary)";
        }
    });

    item.addEventListener("drop", (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
        const toIndex = parseInt(item.dataset.index);

        if (fromIndex !== toIndex) {
            const file = mergeSessionData.files.splice(fromIndex, 1)[0];
            mergeSessionData.files.splice(toIndex, 0, file);
            renderMergeFileList();
        }
    });
}

function runMerge() {
    if (mergeSessionData.files.length < 2) {
        alert("Please upload at least 2 PDF files to merge.");
        return;
    }

    showLoading(true, "Merging documents...", 50);

    const fileIds = mergeSessionData.files.map(f => f.fileId);

    fetch("/api/merge/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: mergeSessionData.sessionId,
            file_ids: fileIds
        })
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => { throw new Error(err.detail || "Merge failed") });
        }
        return res.json();
    })
    .then(data => {
        updateProgress(90);
        
        const link = document.createElement("a");
        link.href = data.download_url;
        link.download = "merged_document.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        updateProgress(100);
        setTimeout(() => {
            showLoading(false);
            alert("PDFs successfully merged and downloaded!");
            returnToDashboard();
        }, 500);
    })
    .catch(err => {
        showLoading(false);
        alert(err.message);
    });
}

function clearMergeState() {
    mergeSessionData = {
        sessionId: null,
        files: []
    };
    if (mergeFileInput) mergeFileInput.value = "";
    renderMergeFileList();
}

// Split PDF tool handlers
function handleSplitFileSelect(e) {
    if (splitFileInput.files.length > 0) {
        uploadSplitFile(splitFileInput.files[0]);
    }
}

function handleSplitFileDrop(e) {
    e.preventDefault();
    splitDropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
        uploadSplitFile(e.dataTransfer.files[0]);
    }
}

function uploadSplitFile(file) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
        alert("Please upload a PDF file.");
        return;
    }

    showLoading(true, "Uploading and analyzing PDF...", 20);

    const formData = new FormData();
    formData.append("file", file);

    fetch("/api/split/upload", {
        method: "POST",
        body: formData
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => { throw new Error(err.detail || "Upload failed") });
        }
        return res.json();
    })
    .then(data => {
        showLoading(false);
        initializeSplitWorkspace(data);
    })
    .catch(err => {
        showLoading(false);
        alert(err.message);
        if (splitFileInput) splitFileInput.value = "";
    });
}

function initializeSplitWorkspace(data) {
    splitSessionData = {
        sessionId: data.session_id,
        filename: data.filename,
        totalPages: data.total_pages,
        pages: data.pages,
        selectedPages: new Set(),
        mode: "extract"
    };

    splitFileNameDisplay.innerText = splitSessionData.filename;
    splitTotalPagesVal.innerText = splitSessionData.totalPages;
    splitTargetCountVal.innerText = "0 selected";

    splitPartsRangeGroup.classList.add("hidden");
    splitPartsInput.value = "";
    splitModeExtractBtn.classList.add("active");
    splitModePartsBtn.classList.remove("active");

    splitGuideTitle.innerHTML = `<i class="fa-solid fa-circle-info"></i> How to Extract`;
    splitGuideText.innerText = "Check the checkbox on the top-right corner of each page preview you wish to extract. Only checked pages will be combined into your new PDF.";

    renderSplitThumbnails();

    splitUploadCard.classList.add("hidden");
    splitWorkspaceContainer.classList.remove("hidden");
}

function renderSplitThumbnails() {
    splitThumbnailGrid.innerHTML = "";
    const totalPages = splitSessionData.totalPages;
    
    splitSessionData.pages.forEach((page, index) => {
        const card = document.createElement("div");
        card.className = "split-page-card";
        card.dataset.pageNum = page.page_num;

        const isSelected = splitSessionData.selectedPages.has(page.page_num);
        if (isSelected && splitSessionData.mode === "extract") {
            card.classList.add("selected");
        }

        card.innerHTML = `
            <div class="split-checkbox-container ${splitSessionData.mode === "parts" ? "hidden" : ""}">
                <input type="checkbox" class="split-page-checkbox" ${isSelected ? "checked" : ""}>
            </div>
            <div class="split-page-img-container">
                <img src="${page.image_url}" alt="Page ${page.page_num + 1}">
            </div>
            <span class="split-page-number">Page ${page.page_num + 1}</span>
        `;

        card.addEventListener("click", (e) => {
            if (e.target.classList.contains("split-page-checkbox")) return;
            
            if (splitSessionData.mode === "extract") {
                toggleSplitPageSelection(page.page_num);
            }
        });

        card.querySelector(".split-page-checkbox").addEventListener("change", (e) => {
            if (splitSessionData.mode === "extract") {
                toggleSplitPageSelection(page.page_num, e.target.checked);
            } else {
                e.target.checked = !e.target.checked;
            }
        });

        splitThumbnailGrid.appendChild(card);

        // Render split gutter between items for visual cuts (only in parts mode)
        if (splitSessionData.mode === "parts" && index < totalPages - 1) {
            const gutter = document.createElement("div");
            gutter.className = "split-gutter";
            gutter.dataset.gutterIdx = index;
            if (splitCutPoints.has(index)) {
                gutter.classList.add("active");
            }

            gutter.innerHTML = `
                <div class="split-gutter-line"></div>
                <div class="split-gutter-scissors">
                    <i class="fa-solid fa-scissors"></i>
                </div>
            `;

            gutter.addEventListener("click", () => {
                if (splitCutPoints.has(index)) {
                    splitCutPoints.delete(index);
                    gutter.classList.remove("active");
                } else {
                    splitCutPoints.add(index);
                    gutter.classList.add("active");
                }
                updateInputFromCutPoints();
            });

            splitThumbnailGrid.appendChild(gutter);
        }
    });
}

function toggleSplitPageSelection(pageNum, forceState = null) {
    const card = splitThumbnailGrid.querySelector(`.split-page-card[data-page-num="${pageNum}"]`);
    if (!card) return;
    const checkbox = card.querySelector(".split-page-checkbox");
    
    let shouldSelect = forceState !== null ? forceState : !splitSessionData.selectedPages.has(pageNum);
    
    if (shouldSelect) {
        splitSessionData.selectedPages.add(pageNum);
        card.classList.add("selected");
        if (checkbox) checkbox.checked = true;
    } else {
        splitSessionData.selectedPages.delete(pageNum);
        card.classList.remove("selected");
        if (checkbox) checkbox.checked = false;
    }

    splitTargetCountVal.innerText = `${splitSessionData.selectedPages.size} selected`;
}

function switchSplitMode(mode) {
    if (splitSessionData.mode === mode) return;
    splitSessionData.mode = mode;

    if (mode === "extract") {
        splitModeExtractBtn.classList.add("active");
        splitModePartsBtn.classList.remove("active");
        splitPartsRangeGroup.classList.add("hidden");
        
        splitGuideTitle.innerHTML = `<i class="fa-solid fa-circle-info"></i> How to Extract`;
        splitGuideText.innerText = "Check the checkbox on the top-right corner of each page preview you wish to extract. Only checked pages will be combined into your new PDF.";

        splitCutPoints.clear();
        splitPartsInput.value = "";
        renderSplitThumbnails();
        splitTargetCountVal.innerText = `${splitSessionData.selectedPages.size} selected`;
    } else {
        splitModeExtractBtn.classList.remove("active");
        splitModePartsBtn.classList.add("active");
        splitPartsRangeGroup.classList.remove("hidden");

        splitGuideTitle.innerHTML = `<i class="fa-solid fa-scissors"></i> Visual Range Groups`;
        splitGuideText.innerText = "Click between pages to split, or enter page ranges manually (e.g. 1-2, 3-5). Page groups will color-code themselves.";

        splitSessionData.selectedPages.clear();
        renderSplitThumbnails();
        handleSplitPartsInputChange(true);
    }
}

// Bidirectional Sync helper: CutPoints -> Input Field
function updateInputFromCutPoints() {
    const totalPages = splitSessionData.totalPages;
    if (totalPages <= 0) return;
    
    const ranges = [];
    let startPage = 1;
    
    for (let i = 0; i < totalPages - 1; i++) {
        if (splitCutPoints.has(i)) {
            const endPage = i + 1;
            if (startPage === endPage) {
                ranges.push(`${startPage}`);
            } else {
                ranges.push(`${startPage}-${endPage}`);
            }
            startPage = i + 2;
        }
    }
    
    // Add the final range
    if (startPage === totalPages) {
        ranges.push(`${startPage}`);
    } else {
        ranges.push(`${startPage}-${totalPages}`);
    }
    
    splitPartsInput.value = ranges.join(", ");
    handleSplitPartsInputChange(false); // update color coding without rebuilding cut points
}

// Bidirectional Sync helper: Input Field -> CutPoints Set
function updateCutPointsFromInput() {
    splitCutPoints.clear();
    const val = splitPartsInput.value.trim();
    if (!val) {
        // Sync active state of gutters visually
        document.querySelectorAll(".split-gutter").forEach(gutter => gutter.classList.remove("active"));
        return;
    }
    
    const rangeStrings = val.split(",");
    const ranges = [];
    
    rangeStrings.forEach(rStr => {
        const match = rStr.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (match) {
            const start = parseInt(match[1]);
            const end = match[2] ? parseInt(match[2]) : start;
            ranges.push({ start, end });
        }
    });
    
    // Sort ranges by start page to ensure order
    ranges.sort((a, b) => a.start - b.start);
    
    for (let i = 0; i < ranges.length - 1; i++) {
        const cutPoint = ranges[i].end - 1;
        if (cutPoint >= 0 && cutPoint < splitSessionData.totalPages - 1) {
            splitCutPoints.add(cutPoint);
        }
    }
    
    // Update visual active class on gutters
    document.querySelectorAll(".split-gutter").forEach(gutter => {
        const idx = parseInt(gutter.dataset.gutterIdx);
        if (splitCutPoints.has(idx)) {
            gutter.classList.add("active");
        } else {
            gutter.classList.remove("active");
        }
    });
}

function handleSplitPartsInputChange(syncCutPoints = true) {
    if (splitSessionData.mode !== "parts") return;
    
    if (syncCutPoints) {
        updateCutPointsFromInput();
    }
    
    const val = splitPartsInput.value.trim();
    const totalPages = splitSessionData.totalPages;

    document.querySelectorAll(".split-page-card").forEach(card => {
        card.className = "split-page-card";
        const badge = card.querySelector(".split-page-group-badge");
        if (badge) badge.remove();
    });

    if (!val) {
        splitTargetCountVal.innerText = "0 parts defined";
        return;
    }

    const parts = [];
    const rangeStrings = val.split(",");
    
    rangeStrings.forEach((rStr, partIdx) => {
        const match = rStr.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
        if (match) {
            const start = parseInt(match[1]);
            const end = match[2] ? parseInt(match[2]) : start;
            
            const indices = [];
            const groupClass = `group-${partIdx % 6}`;

            for (let i = start; i <= end; i++) {
                if (i >= 1 && i <= totalPages) {
                    const pageIdx = i - 1;
                    indices.push(pageIdx);
                    
                    const card = splitThumbnailGrid.querySelector(`.split-page-card[data-page-num="${pageIdx}"]`);
                    if (card) {
                        card.classList.add(groupClass);
                        
                        if (!card.querySelector(".split-page-group-badge")) {
                            const badge = document.createElement("span");
                            badge.className = "split-page-group-badge";
                            badge.innerText = `Part ${partIdx + 1}`;
                            card.appendChild(badge);
                        }
                    }
                }
            }
            if (indices.length > 0) {
                parts.push(indices);
            }
        }
    });

    splitTargetCountVal.innerText = `${parts.length} parts defined`;
}

function runSplit() {
    if (!splitSessionData.sessionId) return;

    if (splitSessionData.mode === "extract") {
        if (splitSessionData.selectedPages.size === 0) {
            alert("Please select at least one page to extract.");
            return;
        }

        showLoading(true, "Extracting pages...", 40);

        const pages = Array.from(splitSessionData.selectedPages).sort((a, b) => a - b);

        fetch("/api/split/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: splitSessionData.sessionId,
                pages: pages
            })
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw new Error(err.detail || "Extraction failed") });
            }
            return res.json();
        })
        .then(data => {
            updateProgress(80);
            const link = document.createElement("a");
            link.href = data.download_url;
            link.download = `extracted_${splitSessionData.filename}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            updateProgress(100);
            setTimeout(() => {
                showLoading(false);
                alert("Pages successfully extracted and downloaded!");
                returnToDashboard();
            }, 500);
        })
        .catch(err => {
            showLoading(false);
            alert(err.message);
        });
    } else {
        const val = splitPartsInput.value.trim();
        if (!val) {
            alert("Please define at least one page range (e.g. 1-2, 3-5) or click between thumbnails to cut.");
            return;
        }

        const parts = [];
        const rangeStrings = val.split(",");
        
        rangeStrings.forEach(rStr => {
            const match = rStr.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
            if (match) {
                const start = parseInt(match[1]);
                const end = match[2] ? parseInt(match[2]) : start;
                
                const indices = [];
                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= splitSessionData.totalPages) {
                        indices.push(i - 1);
                    }
                }
                if (indices.length > 0) {
                    parts.push(indices);
                }
            }
        });

        if (parts.length === 0) {
            alert("Could not parse any valid page ranges. Please check format.");
            return;
        }

        showLoading(true, "Splitting PDF into parts...", 40);

        fetch("/api/split/parts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: splitSessionData.sessionId,
                parts: parts
            })
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => { throw new Error(err.detail || "Splitting failed") });
            }
            return res.json();
        })
        .then(data => {
            updateProgress(80);
            const link = document.createElement("a");
            link.href = data.download_url;
            link.download = `split_${splitSessionData.filename.replace(".pdf", "")}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            updateProgress(100);
            setTimeout(() => {
                showLoading(false);
                alert("PDF successfully split! Downloaded zip file containing parts.");
                returnToDashboard();
            }, 500);
        })
        .catch(err => {
            showLoading(false);
            alert(err.message);
        });
    }
}

function clearSplitState() {
    if (splitSessionData.mode === "extract") {
        splitSessionData.selectedPages.clear();
        renderSplitThumbnails();
        splitTargetCountVal.innerText = "0 selected";
    } else {
        splitCutPoints.clear();
        splitPartsInput.value = "";
        handleSplitPartsInputChange(false);
    }
}

function closeSplitWorkspace() {
    splitSessionData = {
        sessionId: null,
        filename: "",
        totalPages: 0,
        pages: [],
        selectedPages: new Set(),
        mode: "extract"
    };
    splitCutPoints.clear();

    if (splitFileInput) splitFileInput.value = "";
    splitThumbnailGrid.innerHTML = "";
    if (splitWorkspaceContainer) splitWorkspaceContainer.classList.add("hidden");
    if (splitUploadCard) splitUploadCard.classList.remove("hidden");
}

// Protect & Unlock PDF handlers
function handleSecurityFileSelect(e) {
    if (securityFileInput.files.length > 0) {
        uploadSecurityFile(securityFileInput.files[0]);
    }
}

function handleSecurityFileDrop(e) {
    e.preventDefault();
    securityDropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
        uploadSecurityFile(e.dataTransfer.files[0]);
    }
}

function uploadSecurityFile(file) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
        alert("Only PDF files are supported.");
        return;
    }
    
    showLoading(true, "Uploading and checking encryption status...", 30);
    
    const formData = new FormData();
    formData.append("file", file);
    
    fetch("/api/security/upload", {
        method: "POST",
        body: formData
    })
    .then(resp => {
        if (!resp.ok) {
            return resp.json().then(err => { throw new Error(err.detail || "Upload failed"); });
        }
        return resp.json();
    })
    .then(data => {
        securitySessionData = {
            sessionId: data.session_id,
            filename: data.filename,
            fileSize: data.file_size,
            totalPages: data.page_count,
            isEncrypted: data.is_encrypted
        };
        showLoading(false);
        switchAppMode("security");
    })
    .catch(error => {
        showLoading(false);
        alert("Upload error: " + error.message);
        if (securityFileInput) securityFileInput.value = "";
    });
}

function renderSecurityWorkspace() {
    if (securityFileNameDisplay) securityFileNameDisplay.innerText = securitySessionData.filename;
    
    let sizeText = "";
    if (securitySessionData.fileSize > 1024 * 1024) {
        sizeText = (securitySessionData.fileSize / (1024 * 1024)).toFixed(2) + " MB";
    } else {
        sizeText = (securitySessionData.fileSize / 1024).toFixed(1) + " KB";
    }
    if (securityFileSizeDisplay) securityFileSizeDisplay.innerText = sizeText;
    
    if (securityPageCountDisplay) {
        securityPageCountDisplay.innerText = securitySessionData.totalPages + (securitySessionData.totalPages === 1 ? " page" : " pages");
    }
    
    if (securitySessionData.isEncrypted) {
        if (securityUnlockOverlay) securityUnlockOverlay.classList.remove("hidden");
        if (securityProtectOptions) securityProtectOptions.classList.add("hidden");
        if (securityUnlockPasswordInput) {
            securityUnlockPasswordInput.value = "";
            securityUnlockPasswordInput.type = "password";
        }
        if (toggleUnlockPasswordBtn) {
            toggleUnlockPasswordBtn.querySelector("i").className = "fa-solid fa-eye";
        }
    } else {
        if (securityUnlockOverlay) securityUnlockOverlay.classList.add("hidden");
        if (securityProtectOptions) securityProtectOptions.classList.remove("hidden");
        
        // Clear protect inputs
        if (securityUserPasswordInput) {
            securityUserPasswordInput.value = "";
            securityUserPasswordInput.type = "password";
        }
        if (toggleUserPasswordBtn) {
            toggleUserPasswordBtn.querySelector("i").className = "fa-solid fa-eye";
        }
        if (securityOwnerPasswordInput) {
            securityOwnerPasswordInput.value = "";
            securityOwnerPasswordInput.type = "password";
        }
        if (toggleOwnerPasswordBtn) {
            toggleOwnerPasswordBtn.querySelector("i").className = "fa-solid fa-eye";
        }
        if (preventPrintToggle) preventPrintToggle.checked = false;
        if (preventCopyToggle) preventCopyToggle.checked = false;
        if (preventModifyToggle) preventModifyToggle.checked = false;
    }
}

function runUnlock() {
    const password = securityUnlockPasswordInput.value;
    if (!password) {
        alert("Please enter the password to unlock the document.");
        return;
    }
    
    showLoading(true, "Authenticating and unlocking PDF...", 50);
    
    fetch("/api/security/unlock", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            session_id: securitySessionData.sessionId,
            password: password
        })
    })
    .then(resp => {
        if (!resp.ok) {
            return resp.json().then(err => { throw new Error(err.detail || "Incorrect password"); });
        }
        return resp.json();
    })
    .then(data => {
        showLoading(false);
        // Direct download of decrypted PDF
        triggerFileDownload(data.download_url, `unlocked_${securitySessionData.filename || "document.pdf"}`);
        
        // Prompt success and return to dashboard
        setTimeout(() => {
            alert("Document unlocked successfully! Decrypted version downloaded.");
            returnToDashboard();
        }, 1000);
    })
    .catch(error => {
        showLoading(false);
        alert("Unlock failed: " + error.message);
    });
}

function runProtect() {
    const userPassword = securityUserPasswordInput.value;
    const ownerPassword = securityOwnerPasswordInput.value;
    
    if (!userPassword && !ownerPassword) {
        alert("Please specify at least a User Password or Owner Password to encrypt the PDF.");
        return;
    }
    
    if (ownerPassword && ownerPassword === userPassword) {
        alert("User Password and Owner Password should be different for proper security delegation.");
        return;
    }
    
    showLoading(true, "Securing document layers...", 60);
    
    fetch("/api/security/protect", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            session_id: securitySessionData.sessionId,
            user_password: userPassword,
            owner_password: ownerPassword,
            prevent_print: preventPrintToggle.checked,
            prevent_copy: preventCopyToggle.checked,
            prevent_modify: preventModifyToggle.checked
        })
    })
    .then(resp => {
        if (!resp.ok) {
            return resp.json().then(err => { throw new Error(err.detail || "Protection failed"); });
        }
        return resp.json();
    })
    .then(data => {
        showLoading(false);
        // Direct download of protected PDF
        triggerFileDownload(data.download_url, `protected_${securitySessionData.filename || "document.pdf"}`);
        
        setTimeout(() => {
            alert("Document secured successfully! Encrypted version downloaded.");
            returnToDashboard();
        }, 1000);
    })
    .catch(error => {
        showLoading(false);
        alert("Protection failed: " + error.message);
    });
}

function closeSecurityWorkspace() {
    securitySessionData = {
        sessionId: null,
        filename: "",
        fileSize: 0,
        totalPages: 0,
        isEncrypted: false
    };
    
    if (securityFileInput) securityFileInput.value = "";
    if (securityUnlockPasswordInput) securityUnlockPasswordInput.value = "";
    if (securityUserPasswordInput) securityUserPasswordInput.value = "";
    if (securityOwnerPasswordInput) securityOwnerPasswordInput.value = "";
    
    if (securityWorkspaceContainer) securityWorkspaceContainer.classList.add("hidden");
    if (securityUploadCard) securityUploadCard.classList.remove("hidden");
}

function saveAllStates() {
    let activeMode = "dashboard";
    if (securitySection && !securitySection.classList.contains("hidden")) activeMode = "security";
    else if (workspaceSection && !workspaceSection.classList.contains("hidden")) activeMode = "sanitize";
    else if (uploadSection && !uploadSection.classList.contains("hidden")) activeMode = "sanitize";
    else if (document.getElementById("mergeSection") && !document.getElementById("mergeSection").classList.contains("hidden")) activeMode = "merge";
    else if (document.getElementById("splitSection") && !document.getElementById("splitSection").classList.contains("hidden")) activeMode = "split";
    else if (compressSection && !compressSection.classList.contains("hidden")) activeMode = "compress";
    else if (organizeSection && !organizeSection.classList.contains("hidden")) activeMode = "organize";

    const state = {
        activeMode: activeMode,
        sessionData: sessionData,
        redactedFindingIds: Array.from(redactedFindingIds),
        manualRedactions: manualRedactions,
        mergeSessionData: mergeSessionData,
        splitSessionData: {
            ...splitSessionData,
            selectedPages: Array.from(splitSessionData.selectedPages)
        },
        splitCutPoints: Array.from(splitCutPoints),
        securitySessionData: securitySessionData,
        compressSessionData: compressSessionData,
        organizeSessionData: organizeSessionData
    };
    sessionStorage.setItem("secure_redact_state", JSON.stringify(state));
}

function restoreAllStates(state) {
    if (!state) return;
    
    // Restore Sanitize
    if (state.sessionData && state.sessionData.sessionId) {
        sessionData = state.sessionData;
        redactedFindingIds = new Set(state.redactedFindingIds || []);
        manualRedactions = state.manualRedactions || [];
        
        fileNameDisplay.innerText = sessionData.filename;
        if (propFileName) propFileName.innerText = sessionData.filename;
        if (propPageCount) propPageCount.innerText = sessionData.totalPages;
        if (totalPagesNum) totalPagesNum.innerText = sessionData.totalPages;
        if (currentPageNum) currentPageNum.innerText = "1";
        if (zoomDisplay) zoomDisplay.innerText = "100%";
        zoomLevel = 1.0;
        
        renderFindingsList();
        renderPDF();
        renderThumbnails();
        updateRedactionCount();
        
        if (workspaceSection) workspaceSection.classList.remove("hidden");
        if (uploadSection) uploadSection.classList.add("hidden");
    }
    
    // Restore Merge
    if (state.mergeSessionData && state.mergeSessionData.sessionId) {
        mergeSessionData = state.mergeSessionData;
    }
    
    // Restore Split
    if (state.splitSessionData && state.splitSessionData.sessionId) {
        splitSessionData = {
            ...state.splitSessionData,
            selectedPages: new Set(state.splitSessionData.selectedPages || [])
        };
        splitCutPoints = new Set(state.splitCutPoints || []);
    }
    
    // Restore Security
    if (state.securitySessionData && state.securitySessionData.sessionId) {
        securitySessionData = state.securitySessionData;
    }
    
    // Restore Compress
    if (state.compressSessionData && state.compressSessionData.sessionId) {
        compressSessionData = state.compressSessionData;
    }
    
    // Restore Organize
    if (state.organizeSessionData && state.organizeSessionData.sessionId) {
        organizeSessionData = state.organizeSessionData;
    }
    
    if (state.activeMode && state.activeMode !== "dashboard") {
        switchAppMode(state.activeMode);
    }
}

window.addEventListener("beforeunload", (e) => {
    const isSessionActive = sessionData.sessionId || 
                            (mergeSessionData.files && mergeSessionData.files.length > 0) || 
                            splitSessionData.sessionId || 
                            securitySessionData.sessionId ||
                            compressSessionData.sessionId ||
                            organizeSessionData.sessionId;
                            
    if (isSessionActive) {
        saveAllStates();
        e.preventDefault();
        e.returnValue = "";
    } else {
        sessionStorage.removeItem("secure_redact_state");
    }
});

// Helper functions for secure downloads and server cleanup
function triggerFileDownload(url, filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function cleanupSessionOnServer(sessionId) {
    if (!sessionId) return;
    fetch(`/api/cleanup/${sessionId}`, { method: "POST", keepalive: true })
    .catch(err => console.error("Session cleanup failed:", err));
}

// Compress PDF Tool Handlers
function handleCompressFileSelect(e) {
    if (compressFileInput.files.length > 0) {
        uploadCompressFile(compressFileInput.files[0]);
    }
}

function handleCompressFileDrop(e) {
    e.preventDefault();
    compressDropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
        uploadCompressFile(e.dataTransfer.files[0]);
    }
}

function uploadCompressFile(file) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
        alert("Please upload a PDF file.");
        return;
    }
    
    showLoading(true, "Uploading PDF...", 30);
    
    const formData = new FormData();
    formData.append("file", file);
    
    fetch("/api/compress/upload", {
        method: "POST",
        body: formData
    })
    .then(resp => {
        if (!resp.ok) {
            return resp.json().then(err => { throw new Error(err.detail || "Upload failed"); });
        }
        return resp.json();
    })
    .then(data => {
        compressSessionData = {
            sessionId: data.session_id,
            filename: data.filename,
            fileSize: data.file_size,
            level: "medium" // reset level to default on new upload
        };
        
        // Update level pills visually to match default level
        const segmentBtns = document.querySelectorAll("#compressSection .segment-btn");
        segmentBtns.forEach(btn => {
            if (btn.dataset.level === "medium") {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
        
        showLoading(false);
        switchAppMode("compress");
    })
    .catch(error => {
        showLoading(false);
        alert("Upload error: " + error.message);
        if (compressFileInput) compressFileInput.value = "";
    });
}

function renderCompressWorkspace() {
    if (compressFileNameDisplay) compressFileNameDisplay.innerText = compressSessionData.filename;
    
    let sizeText = "";
    if (compressSessionData.fileSize > 1024 * 1024) {
        sizeText = (compressSessionData.fileSize / (1024 * 1024)).toFixed(2) + " MB";
    } else {
        sizeText = (compressSessionData.fileSize / 1024).toFixed(1) + " KB";
    }
    if (compressFileSizeDisplay) compressFileSizeDisplay.innerText = sizeText;
    
    // Ensure correct configuration panel visibility
    if (compressConfigPanel) compressConfigPanel.classList.remove("hidden");
    if (compressResultsPanel) compressResultsPanel.classList.add("hidden");
    
    // Ensure segment buttons reflect correct state (e.g. from restored state)
    const segmentBtns = document.querySelectorAll("#compressSection .segment-btn");
    segmentBtns.forEach(btn => {
        if (btn.dataset.level === compressSessionData.level) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

function runCompress() {
    if (!compressSessionData.sessionId) return;
    
    showLoading(true, "Compressing document...", 40);
    
    fetch("/api/compress/execute", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            session_id: compressSessionData.sessionId,
            level: compressSessionData.level
        })
    })
    .then(resp => {
        if (!resp.ok) {
            return resp.json().then(err => { throw new Error(err.detail || "Compression failed"); });
        }
        return resp.json();
    })
    .then(data => {
        showLoading(false);
        
        // Show comparison stats in Results Panel
        if (compressConfigPanel) compressConfigPanel.classList.add("hidden");
        if (compressResultsPanel) compressResultsPanel.classList.remove("hidden");
        
        // Format original size
        let origSizeText = "";
        if (data.original_size > 1024 * 1024) {
            origSizeText = (data.original_size / (1024 * 1024)).toFixed(2) + " MB";
        } else {
            origSizeText = (data.original_size / 1024).toFixed(1) + " KB";
        }
        
        // Format compressed size
        let compSizeText = "";
        if (data.compressed_size > 1024 * 1024) {
            compSizeText = (data.compressed_size / (1024 * 1024)).toFixed(2) + " MB";
        } else {
            compSizeText = (data.compressed_size / 1024).toFixed(1) + " KB";
        }
        
        // Calculation
        const savedBytes = data.original_size - data.compressed_size;
        const savedPercent = data.original_size > 0 ? Math.round((savedBytes / data.original_size) * 100) : 0;
        
        let savedAbsText = "";
        if (savedBytes > 1024 * 1024) {
            savedAbsText = (savedBytes / (1024 * 1024)).toFixed(2) + " MB";
        } else {
            savedAbsText = (savedBytes / 1024).toFixed(1) + " KB";
        }
        
        if (originalSizeResult) originalSizeResult.innerText = origSizeText;
        if (compressedSizeResult) compressedSizeResult.innerText = compSizeText;
        if (savingPercentResult) savingPercentResult.innerText = savedPercent + "%";
        if (savingAbsoluteResult) savingAbsoluteResult.innerText = savedAbsText;
        
        // Store download url for the download button handler
        downloadCompressedBtn.dataset.downloadUrl = data.download_url;
        
        // Show/hide zero-savings notice
        const noSavingsNotice = document.getElementById("compressNoSavingsNotice");
        if (noSavingsNotice) {
            if (savedPercent <= 0) {
                noSavingsNotice.classList.remove("hidden");
            } else {
                noSavingsNotice.classList.add("hidden");
            }
        }
    })
    .catch(error => {
        showLoading(false);
        alert("Compression failed: " + error.message);
    });
}

function closeCompressWorkspace() {
    if (compressSessionData.sessionId) {
        cleanupSessionOnServer(compressSessionData.sessionId);
    }

    compressSessionData = {
        sessionId: null,
        filename: "",
        fileSize: 0,
        level: "medium"
    };
    
    if (compressFileInput) compressFileInput.value = "";
    
    if (compressWorkspaceContainer) compressWorkspaceContainer.classList.add("hidden");
    if (compressUploadCard) compressUploadCard.classList.remove("hidden");
    
    const noSavingsNotice = document.getElementById("compressNoSavingsNotice");
    if (noSavingsNotice) noSavingsNotice.classList.add("hidden");
}

function closeCompressResults() {
    closeCompressWorkspace();
}

// Organize PDF Tool Handlers
function handleOrganizeFileSelect(e) {
    if (organizeFileInput.files.length > 0) {
        uploadOrganizeFile(organizeFileInput.files[0]);
    }
}

function handleOrganizeFileDrop(e) {
    e.preventDefault();
    organizeDropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
        uploadOrganizeFile(e.dataTransfer.files[0]);
    }
}

function uploadOrganizeFile(file) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
        alert("Please upload a PDF file.");
        return;
    }
    
    showLoading(true, "Uploading and analyzing PDF...", 20);
    
    const formData = new FormData();
    formData.append("file", file);
    
    fetch("/api/organize/upload", {
        method: "POST",
        body: formData
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => { throw new Error(err.detail || "Upload failed"); });
        }
        return res.json();
    })
    .then(data => {
        showLoading(false);
        initializeOrganizeWorkspace(data);
    })
    .catch(err => {
        showLoading(false);
        alert(err.message);
        if (organizeFileInput) organizeFileInput.value = "";
    });
}

function initializeOrganizeWorkspace(data) {
    organizeSessionData = {
        sessionId: data.session_id,
        filename: data.filename,
        totalPages: data.total_pages,
        pages: data.pages.map(p => ({
            ...p,
            rotation: 0,
            deleted: false
        }))
    };
    
    if (organizeFileNameDisplay) organizeFileNameDisplay.innerText = organizeSessionData.filename;
    
    renderOrganizeWorkspace();
    
    if (organizeUploadCard) organizeUploadCard.classList.add("hidden");
    if (organizeWorkspaceContainer) organizeWorkspaceContainer.classList.remove("hidden");
}

function renderOrganizeWorkspace() {
    if (!organizeThumbnailGrid) return;
    organizeThumbnailGrid.innerHTML = "";
    
    organizeSessionData.pages.forEach(page => {
        const card = document.createElement("div");
        card.className = "organize-page-card";
        card.dataset.pageNum = page.page_num;
        
        if (page.deleted) {
            card.classList.add("deleted");
        }
        
        card.innerHTML = `
            <div class="organize-page-img-container">
                <img src="${page.image_url}" class="organize-page-img" alt="Page ${page.page_num + 1}" style="transform: rotate(${page.rotation || 0}deg);">
                <div class="organize-page-controls">
                    <button class="organize-control-btn rotate-ccw" title="Rotate Counter-Clockwise">
                        <i class="fa-solid fa-rotate-left"></i>
                    </button>
                    <button class="organize-control-btn rotate-cw" title="Rotate Clockwise">
                        <i class="fa-solid fa-rotate-right"></i>
                    </button>
                    <button class="organize-control-btn delete-page" title="Delete Page">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            <span class="organize-page-number">Page ${page.page_num + 1}</span>
        `;
        
        // Add event listeners inside the controls
        card.querySelector(".rotate-ccw").addEventListener("click", (e) => {
            e.stopPropagation();
            toggleOrganizePageRotation(page.page_num, "ccw");
        });
        
        card.querySelector(".rotate-cw").addEventListener("click", (e) => {
            e.stopPropagation();
            toggleOrganizePageRotation(page.page_num, "cw");
        });
        
        card.querySelector(".delete-page").addEventListener("click", (e) => {
            e.stopPropagation();
            toggleOrganizePageDeletion(page.page_num, true);
        });
        
        if (page.deleted) {
            const overlay = document.createElement("div");
            overlay.className = "organize-page-deleted-overlay";
            overlay.innerHTML = `
                <i class="fa-solid fa-trash-can"></i>
                <span>Page Deleted</span>
                <button class="restore-page-btn">Restore Page</button>
            `;
            overlay.querySelector(".restore-page-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                toggleOrganizePageDeletion(page.page_num, false);
            });
            card.appendChild(overlay);
        }
        
        organizeThumbnailGrid.appendChild(card);
    });
    
    updateOrganizeSummary();
}

function toggleOrganizePageRotation(pageNum, direction) {
    const page = organizeSessionData.pages.find(p => p.page_num === pageNum);
    if (!page) return;
    
    if (direction === "cw") {
        page.rotation = (page.rotation + 90) % 360;
    } else {
        page.rotation = (page.rotation - 90) % 360;
        if (page.rotation < 0) page.rotation += 360;
    }
    
    const card = document.querySelector(`.organize-page-card[data-page-num="${pageNum}"]`);
    if (card) {
        const img = card.querySelector(".organize-page-img");
        if (img) {
            img.style.transform = `rotate(${page.rotation}deg)`;
        }
    }
    
    updateOrganizeSummary();
    saveAllStates();
}

function toggleOrganizePageDeletion(pageNum, isDeleted) {
    const page = organizeSessionData.pages.find(p => p.page_num === pageNum);
    if (!page) return;
    
    page.deleted = isDeleted;
    
    const card = document.querySelector(`.organize-page-card[data-page-num="${pageNum}"]`);
    if (card) {
        if (isDeleted) {
            card.classList.add("deleted");
            let overlay = card.querySelector(".organize-page-deleted-overlay");
            if (!overlay) {
                overlay = document.createElement("div");
                overlay.className = "organize-page-deleted-overlay";
                overlay.innerHTML = `
                    <i class="fa-solid fa-trash-can"></i>
                    <span>Page Deleted</span>
                    <button class="restore-page-btn">Restore Page</button>
                `;
                overlay.querySelector(".restore-page-btn").addEventListener("click", (e) => {
                    e.stopPropagation();
                    toggleOrganizePageDeletion(pageNum, false);
                });
                card.appendChild(overlay);
            }
        } else {
            card.classList.remove("deleted");
            const overlay = card.querySelector(".organize-page-deleted-overlay");
            if (overlay) overlay.remove();
        }
    }
    
    updateOrganizeSummary();
    saveAllStates();
}

function updateOrganizeSummary() {
    if (!organizeSessionData.sessionId) return;
    
    const total = organizeSessionData.totalPages;
    const deletedCount = organizeSessionData.pages.filter(p => p.deleted).length;
    const rotatedCount = organizeSessionData.pages.filter(p => !p.deleted && p.rotation !== 0).length;
    
    if (organizeTotalPagesVal) organizeTotalPagesVal.innerText = total;
    if (organizeDeleteCountVal) organizeDeleteCountVal.innerText = `${deletedCount} deleted`;
    if (organizeRotateCountVal) organizeRotateCountVal.innerText = `${rotatedCount} rotated`;
    
    // Enable/disable Apply button based on remaining pages
    if (executeOrganizeBtn) {
        const remainingCount = total - deletedCount;
        executeOrganizeBtn.disabled = (remainingCount <= 0);
    }
}

function runOrganize() {
    if (!organizeSessionData.sessionId) return;
    
    const remainingPages = organizeSessionData.pages.filter(p => !p.deleted);
    if (remainingPages.length === 0) {
        alert("Cannot organize a document with all pages deleted.");
        return;
    }
    
    showLoading(true, "Applying changes and compiling PDF...", 40);
    
    const payload = {
        session_id: organizeSessionData.sessionId,
        pages: remainingPages.map(p => ({
            page_num: p.page_num,
            rotation: p.rotation
        }))
    };
    
    fetch("/api/organize/execute", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(resp => {
        if (!resp.ok) {
            return resp.json().then(err => { throw new Error(err.detail || "Organization failed"); });
        }
        return resp.json();
    })
    .then(data => {
        showLoading(false);
        triggerFileDownload(data.download_url, `organized_${organizeSessionData.filename || "document.pdf"}`);
        
        setTimeout(() => {
            alert("Changes applied successfully! Your organized PDF has been downloaded.");
            returnToDashboard();
        }, 1000);
    })
    .catch(error => {
        showLoading(false);
        alert("Organization failed: " + error.message);
    });
}

function clearOrganizeState() {
    if (!organizeSessionData.sessionId) return;
    
    if (confirm("Are you sure you want to reset all rotations and deletions?")) {
        organizeSessionData.pages.forEach(p => {
            p.rotation = 0;
            p.deleted = false;
        });
        renderOrganizeWorkspace();
        saveAllStates();
    }
}

function closeOrganizeWorkspace() {
    if (organizeSessionData.sessionId) {
        cleanupSessionOnServer(organizeSessionData.sessionId);
    }
    
    organizeSessionData = {
        sessionId: null,
        filename: "",
        totalPages: 0,
        pages: []
    };
    
    if (organizeFileInput) organizeFileInput.value = "";
    if (organizeThumbnailGrid) organizeThumbnailGrid.innerHTML = "";
    
    if (organizeWorkspaceContainer) organizeWorkspaceContainer.classList.add("hidden");
    if (organizeUploadCard) organizeUploadCard.classList.remove("hidden");
    
    saveAllStates();
}


