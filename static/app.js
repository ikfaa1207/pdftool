import { State, saveAllStates, restoreAllStates } from './state.js';
import { 
    renderPDF, reRenderAllOverlays, renderPageOverlays, setupDrawingEvents, 
    removeManualRedaction, adjustZoom, applyZoom, fitToWidth, fitToPage, 
    scrollToPage, scrollToPrevPage, scrollToNextPage, getCurrentVisiblePage, 
    handleViewerScroll, renderThumbnails, updateActiveThumbnail, toggleThumbnailSidebar 
} from './canvas.js';

import { 
    apiUploadPDF, apiSearchPDF, apiRedactPDF, apiCleanupSession, 
    apiMergeUpload, apiMergeExecute, apiSplitUpload, apiSplitExtract, 
    apiSplitParts, apiSecurityUpload, apiSecurityUnlock, apiSecurityProtect, 
    apiCompressUpload, apiCompressExecute, apiOrganizeUpload, apiOrganizeExecute, 
    apiWatermarkUpload, apiWatermarkUploadLogo, apiWatermarkExecute, 
    apiConvertUploadPdf, apiConvertUploadImages, apiConvertPdfToImage, apiConvertImageToPdf 
} from './api.js';

import { DOM } from './dom.js';

const {
    dashboardSection,
    toolSanitizeCard,
    toolMergeCard,
    toolSplitCard,
    toolSecurityCard,
    toolCompressCard,
    toolOrganizeCard,
    toolWatermarkCard,
    toolConvertCard,
    headerLogo,
    themeToggleBtn,
    sanitizeBackBtn,
    mergeBackBtn,
    splitBackBtn,
    securityBackBtn,
    compressBackBtn,
    organizeBackBtn,
    watermarkBackBtn,
    convertPdfBackBtn,
    convertImgBackBtn,
    uploadSection,
    workspaceSection,
    dropZone,
    fileInput,
    loadingModal,
    loadingText,
    loadingProgressBar,
    fileNameDisplay,
    currentPageNum,
    totalPagesNum,
    zoomDisplay,
    prevPageBtn,
    nextPageBtn,
    zoomInBtn,
    zoomOutBtn,
    clearAllRedactionsBtn,
    pdfViewer,
    toggleThumbnailsBtn,
    thumbnailSidebar,
    thumbnailSidebarContent,
    toggleRightSidebarBtn,
    sidebarBackdrop,
    sidebarRight,
    fitWidthBtn,
    fitPageBtn,
    totalFindingsBadge,
    aiFindingsTab,
    manualSearchTab,
    settingsExportTab,
    aiFindingsContent,
    manualSearchContent,
    settingsExportContent,
    searchInput,
    regexToggleCheckbox,
    searchBtn,
    findingsContainer,
    searchResultsContainer,
    propFileName,
    propPageCount,
    propRedactionsCount,
    stripMetadataCheckbox,
    sanitizeBtn,
    closeWorkspaceBtn,
    mergeDropZone,
    mergeFileInput,
    mergeFileListContainer,
    mergeFileList,
    executeMergeBtn,
    clearMergeBtn,
    splitUploadCard,
    splitWorkspaceContainer,
    splitDropZone,
    splitFileInput,
    splitFileNameDisplay,
    splitModeExtractBtn,
    splitModePartsBtn,
    splitGuideTitle,
    splitGuideText,
    splitTotalPagesVal,
    splitTargetCountVal,
    executeSplitBtn,
    clearSplitBtn,
    splitThumbnailGrid,
    splitPartsRangeGroup,
    splitPartsInput,
    closeSplitWorkspaceBtn,
    compressSection,
    compressUploadCard,
    compressFileInput,
    compressDropZone,
    compressWorkspaceContainer,
    compressFileNameDisplay,
    compressFileSizeDisplay,
    compressConfigPanel,
    compressResultsPanel,
    executeCompressBtn,
    closeCompressBtn,
    downloadCompressedBtn,
    closeCompressResultsBtn,
    originalSizeResult,
    compressedSizeResult,
    savingPercentResult,
    savingAbsoluteResult,
    organizeSection,
    organizeUploadCard,
    organizeFileInput,
    organizeDropZone,
    organizeWorkspaceContainer,
    organizeFileNameDisplay,
    organizeTotalPagesVal,
    organizeDeleteCountVal,
    organizeRotateCountVal,
    executeOrganizeBtn,
    clearOrganizeBtn,
    organizeThumbnailGrid,
    closeOrganizeWorkspaceBtn,
    organizeAddBlankBtn,
    watermarkSection,
    watermarkUploadCard,
    watermarkFileInput,
    watermarkDropZone,
    watermarkWorkspaceContainer,
    watermarkFileNameDisplay,
    closeWatermarkWorkspaceBtn,
    watermarkTypeTextBtn,
    watermarkTypeImageBtn,
    watermarkTextConfigGroup,
    watermarkImageConfigGroup,
    watermarkTextVal,
    watermarkTextColor,
    watermarkTextColorHex,
    watermarkTextFontSize,
    watermarkTextFontSizeLabel,
    watermarkTextRotation,
    watermarkTextRotationLabel,
    logoUploadTriggerBtn,
    watermarkLogoInput,
    watermarkLogoFileName,
    watermarkImageScale,
    watermarkImageScaleLabel,
    watermarkPosition,
    watermarkOpacity,
    watermarkOpacityLabel,
    watermarkPagesMode,
    watermarkCustomPagesGroup,
    watermarkCustomPagesVal,
    executeWatermarkBtn,
    watermarkPreviewImage,
    watermarkVisualOverlay,
    watermarkCurrentPageNum,
    watermarkTotalPagesNum,
    watermarkPrevPageBtn,
    watermarkNextPageBtn,
    watermarkPreviewPageCard,
    convertSection,
    convertTabsPdfToImg,
    convertTabsImgToPdf,
    convertPdfToImgWorkspace,
    convertPdfUploadCard,
    convertPdfFileInput,
    convertPdfDropZone,
    convertPdfWorkspaceContainer,
    convertPdfFileNameDisplay,
    closeConvertPdfWorkspaceBtn,
    convertImageFormat,
    convertImageDpi,
    convertImageDpiLabel,
    convertPdfPagesMode,
    convertPdfCustomPagesGroup,
    convertPdfCustomPagesVal,
    executePdfToImgBtn,
    convertPdfPreviewPageCard,
    convertPdfPreviewImage,
    convertPdfCurrentPageNum,
    convertPdfTotalPagesNum,
    convertPdfPrevPageBtn,
    convertPdfNextPageBtn,
    convertImgToPdfWorkspace,
    convertImgUploadCard,
    convertImgFileInput,
    convertImgDropZone,
    convertImgWorkspaceContainer,
    convertImgCountDisplay,
    closeConvertImgWorkspaceBtn,
    convertPdfFitMode,
    convertStandardPageOptions,
    convertPageSize,
    convertPageOrientation,
    executeImgToPdfBtn,
    convertImageGrid,
    securitySection,
    securityUploadCard,
    securityFileInput,
    securityDropZone,
    securityWorkspaceContainer,
    securityFileNameDisplay,
    securityPageCountDisplay,
    securityFileSizeDisplay,
    securityUnlockOverlay,
    securityUnlockPasswordInput,
    toggleUnlockPasswordBtn,
    executeUnlockBtn,
    closeUnlockBtn,
    securityProtectOptions,
    securityUserPasswordInput,
    toggleUserPasswordBtn,
    securityOwnerPasswordInput,
    toggleOwnerPasswordBtn,
    preventPrintToggle,
    preventCopyToggle,
    preventModifyToggle,
    executeProtectBtn,
    closeProtectBtn
} = DOM;

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
    if (watermarkBackBtn) watermarkBackBtn.addEventListener("click", returnToDashboard);
 
    // Dashboard Cards (optional if present)
    if (toolSanitizeCard) toolSanitizeCard.addEventListener("click", () => switchAppMode("sanitize"));
    if (toolMergeCard) toolMergeCard.addEventListener("click", () => switchAppMode("merge"));
    if (toolSplitCard) toolSplitCard.addEventListener("click", () => switchAppMode("split"));
    if (toolSecurityCard) toolSecurityCard.addEventListener("click", () => switchAppMode("security"));
    if (toolCompressCard) toolCompressCard.addEventListener("click", () => switchAppMode("compress"));
    if (toolOrganizeCard) toolOrganizeCard.addEventListener("click", () => switchAppMode("organize"));
    if (toolWatermarkCard) toolWatermarkCard.addEventListener("click", () => switchAppMode("watermark"));
    if (toolConvertCard) toolConvertCard.addEventListener("click", () => switchAppMode("convert"));

    // Initialize 3D Tilt & Cursor Glow for Dashboard Cards
    document.querySelectorAll(".dashboard-card").forEach(card => {
        card.addEventListener("mousemove", e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty("--mouse-x", `${(x / rect.width) * 100}%`);
            card.style.setProperty("--mouse-y", `${(y / rect.height) * 100}%`);
            
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            const tiltX = (yc - y) / 10;
            const tiltY = (x - xc) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.03, 1.03, 1.03)`;
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
        });
    });

    // Handle Tab Indicator resizing dynamically
    window.addEventListener("resize", () => {
        const activeTabBtn = document.querySelector(".sidebar-tab-btn.active");
        if (activeTabBtn) {
            const indicator = document.getElementById("sidebarTabIndicator");
            if (indicator) {
                indicator.style.transition = "none";
                indicator.style.left = `${activeTabBtn.offsetLeft}px`;
                indicator.style.width = `${activeTabBtn.offsetWidth}px`;
                void indicator.offsetHeight;
                indicator.style.transition = "all 0.35s cubic-bezier(0.25, 1, 0.5, 1)";
            }
        }
    });

    // Position the tab indicator initially
    setTimeout(() => {
        switchMainTab("ai-findings");
    }, 100);

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

    // Regex Toggle Switch
    if (regexToggleCheckbox) {
        regexToggleCheckbox.addEventListener("change", (e) => {
            State.isRegexSearch = e.target.checked;
            if (State.isRegexSearch) {
                searchInput.placeholder = "Enter regular expression (e.g. \\b[A-Z]{3}\\d{4}\\b)...";
            } else {
                searchInput.placeholder = "Enter keyword to redact...";
            }
            saveAllStates();
        });
    }
    
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
            State.compressSessionData.level = btn.dataset.level;
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
                triggerFileDownload(url, `compressed_${State.compressSessionData.filename || "document.pdf"}`);
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

    if (executeOrganizeBtn) executeOrganizeBtn.addEventListener("click", runOrganize);
    if (clearOrganizeBtn) clearOrganizeBtn.addEventListener("click", clearOrganizeState);
    if (closeOrganizeWorkspaceBtn) closeOrganizeWorkspaceBtn.addEventListener("click", closeOrganizeWorkspace);
    if (organizeAddBlankBtn) organizeAddBlankBtn.addEventListener("click", addOrganizeBlankPage);

    // File Drag & Drop (Watermark)
    if (watermarkDropZone) {
        watermarkDropZone.addEventListener("click", () => {
            watermarkFileInput.click();
        });
        watermarkDropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            watermarkDropZone.classList.add("dragover");
        });
        watermarkDropZone.addEventListener("dragleave", () => {
            watermarkDropZone.classList.remove("dragover");
        });
        watermarkDropZone.addEventListener("drop", handleWatermarkFileDrop);
    }
    if (watermarkFileInput) {
        watermarkFileInput.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        watermarkFileInput.addEventListener("change", handleWatermarkFileSelect);
    }

    // Watermark Type Toggles
    if (watermarkTypeTextBtn) {
        watermarkTypeTextBtn.addEventListener("click", () => switchWatermarkType("text"));
    }
    if (watermarkTypeImageBtn) {
        watermarkTypeImageBtn.addEventListener("click", () => switchWatermarkType("image"));
    }

    // Logo Image Upload
    if (logoUploadTriggerBtn) {
        logoUploadTriggerBtn.addEventListener("click", () => watermarkLogoInput.click());
    }
    if (watermarkLogoInput) {
        watermarkLogoInput.addEventListener("change", handleLogoSelect);
    }

    // Sliders & Inputs Real-time preview updates
    if (watermarkTextVal) {
        watermarkTextVal.addEventListener("input", (e) => {
            State.watermarkSessionData.text = e.target.value;
            updateWatermarkLivePreview();
        });
    }
    if (watermarkTextColor) {
        watermarkTextColor.addEventListener("input", (e) => {
            State.watermarkSessionData.color = e.target.value;
            if (watermarkTextColorHex) watermarkTextColorHex.innerText = e.target.value.toUpperCase();
            updateWatermarkLivePreview();
        });
    }
    if (watermarkTextFontSize) {
        watermarkTextFontSize.addEventListener("input", (e) => {
            State.watermarkSessionData.fontSize = parseInt(e.target.value);
            if (watermarkTextFontSizeLabel) watermarkTextFontSizeLabel.innerText = e.target.value + "px";
            updateWatermarkLivePreview();
        });
    }
    if (watermarkTextRotation) {
        watermarkTextRotation.addEventListener("input", (e) => {
            State.watermarkSessionData.rotation = parseInt(e.target.value);
            if (watermarkTextRotationLabel) watermarkTextRotationLabel.innerText = e.target.value + "°";
            updateWatermarkLivePreview();
        });
    }
    if (watermarkImageScale) {
        watermarkImageScale.addEventListener("input", (e) => {
            State.watermarkSessionData.scale = parseFloat(e.target.value) / 100;
            if (watermarkImageScaleLabel) watermarkImageScaleLabel.innerText = (parseFloat(e.target.value) / 100).toFixed(1);
            updateWatermarkLivePreview();
        });
    }
    if (watermarkOpacity) {
        watermarkOpacity.addEventListener("input", (e) => {
            State.watermarkSessionData.opacity = parseFloat(e.target.value) / 100;
            if (watermarkOpacityLabel) watermarkOpacityLabel.innerText = e.target.value + "%";
            updateWatermarkLivePreview();
        });
    }
    if (watermarkPosition) {
        watermarkPosition.addEventListener("change", (e) => {
            State.watermarkSessionData.position = e.target.value;
            updateWatermarkLivePreview();
        });
    }
    if (watermarkPagesMode) {
        watermarkPagesMode.addEventListener("change", (e) => {
            State.watermarkSessionData.pagesMode = e.target.value;
            if (e.target.value === "custom") {
                if (watermarkCustomPagesGroup) watermarkCustomPagesGroup.classList.remove("hidden");
            } else {
                if (watermarkCustomPagesGroup) watermarkCustomPagesGroup.classList.add("hidden");
            }
            updateWatermarkLivePreview();
        });
    }
    if (watermarkCustomPagesVal) {
        watermarkCustomPagesVal.addEventListener("input", (e) => {
            State.watermarkSessionData.customPages = e.target.value;
            updateWatermarkLivePreview();
        });
    }

    // Pagination
    if (watermarkPrevPageBtn) {
        watermarkPrevPageBtn.addEventListener("click", () => {
            if (State.watermarkSessionData.currentPage > 0) {
                State.watermarkSessionData.currentPage--;
                renderWatermarkPage();
            }
        });
    }
    if (watermarkNextPageBtn) {
        watermarkNextPageBtn.addEventListener("click", () => {
            if (State.watermarkSessionData.currentPage < State.watermarkSessionData.totalPages - 1) {
                State.watermarkSessionData.currentPage++;
                renderWatermarkPage();
            }
        });
    }

    // Execute & Workspace controls
    if (executeWatermarkBtn) executeWatermarkBtn.addEventListener("click", runWatermark);
    if (closeWatermarkWorkspaceBtn) closeWatermarkWorkspaceBtn.addEventListener("click", closeWatermarkWorkspace);
    
    // Convert Workspace Listeners
    if (convertPdfBackBtn) convertPdfBackBtn.addEventListener("click", returnToDashboard);
    if (convertImgBackBtn) convertImgBackBtn.addEventListener("click", returnToDashboard);
    if (closeConvertPdfWorkspaceBtn) closeConvertPdfWorkspaceBtn.addEventListener("click", closeConvertPdfWorkspace);
    if (closeConvertImgWorkspaceBtn) closeConvertImgWorkspaceBtn.addEventListener("click", closeConvertImgWorkspace);
    
    convertTabsPdfToImg.forEach(btn => {
        btn.addEventListener("click", () => switchConvertTab("pdf-to-img"));
    });
    convertTabsImgToPdf.forEach(btn => {
        btn.addEventListener("click", () => switchConvertTab("img-to-pdf"));
    });

    if (convertImageFormat) {
        convertImageFormat.addEventListener("change", (e) => {
            State.convertSessionData.pdfFormat = e.target.value;
            saveAllStates();
        });
    }
    if (convertImageDpi) {
        convertImageDpi.addEventListener("input", (e) => {
            State.convertSessionData.pdfDpi = parseInt(e.target.value);
            if (convertImageDpiLabel) convertImageDpiLabel.innerText = e.target.value + " DPI";
            saveAllStates();
        });
    }
    if (convertPdfPagesMode) {
        convertPdfPagesMode.addEventListener("change", (e) => {
            State.convertSessionData.pdfPagesMode = e.target.value;
            if (e.target.value === "custom") {
                if (convertPdfCustomPagesGroup) convertPdfCustomPagesGroup.classList.remove("hidden");
            } else {
                if (convertPdfCustomPagesGroup) convertPdfCustomPagesGroup.classList.add("hidden");
            }
            saveAllStates();
        });
    }
    if (convertPdfCustomPagesVal) {
        convertPdfCustomPagesVal.addEventListener("input", (e) => {
            State.convertSessionData.pdfCustomPages = e.target.value;
            saveAllStates();
        });
    }
    
    if (convertPdfPrevPageBtn) {
        convertPdfPrevPageBtn.addEventListener("click", () => {
            if (State.convertSessionData.pdfCurrentPage > 0) {
                State.convertSessionData.pdfCurrentPage--;
                renderConvertPdfPage();
            }
        });
    }
    if (convertPdfNextPageBtn) {
        convertPdfNextPageBtn.addEventListener("click", () => {
            if (State.convertSessionData.pdfCurrentPage < State.convertSessionData.pdfTotalPages - 1) {
                State.convertSessionData.pdfCurrentPage++;
                renderConvertPdfPage();
            }
        });
    }
    
    if (convertPdfFitMode) {
        convertPdfFitMode.addEventListener("change", (e) => {
            if (e.target.value === "standard") {
                if (convertStandardPageOptions) convertStandardPageOptions.classList.remove("hidden");
            } else {
                if (convertStandardPageOptions) convertStandardPageOptions.classList.add("hidden");
            }
            saveAllStates();
        });
    }
    if (convertPageSize) {
        convertPageSize.addEventListener("change", () => saveAllStates());
    }
    if (convertPageOrientation) {
        convertPageOrientation.addEventListener("change", () => saveAllStates());
    }
    
    if (convertPdfDropZone) {
        convertPdfDropZone.addEventListener("click", () => convertPdfFileInput.click());
        convertPdfDropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            convertPdfDropZone.classList.add("dragover");
        });
        convertPdfDropZone.addEventListener("dragleave", () => {
            convertPdfDropZone.classList.remove("dragover");
        });
        convertPdfDropZone.addEventListener("drop", handleConvertPdfDrop);
    }
    if (convertPdfFileInput) {
        convertPdfFileInput.addEventListener("click", (e) => e.stopPropagation());
        convertPdfFileInput.addEventListener("change", handleConvertPdfSelect);
    }

    if (convertImgDropZone) {
        convertImgDropZone.addEventListener("click", () => convertImgFileInput.click());
        convertImgDropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            convertImgDropZone.classList.add("dragover");
        });
        convertImgDropZone.addEventListener("dragleave", () => {
            convertImgDropZone.classList.remove("dragover");
        });
        convertImgDropZone.addEventListener("drop", handleConvertImgDrop);
    }
    if (convertImgFileInput) {
        convertImgFileInput.addEventListener("click", (e) => e.stopPropagation());
        convertImgFileInput.addEventListener("change", handleConvertImgSelect);
    }

    if (executePdfToImgBtn) executePdfToImgBtn.addEventListener("click", runPdfToImage);
    if (executeImgToPdfBtn) executeImgToPdfBtn.addEventListener("click", runImageToPdf);
    
    // Monitor scroll inside viewer to update page indicator
    const viewerOuter = document.querySelector(".pdf-viewer-outer");
    if (viewerOuter) viewerOuter.addEventListener("scroll", handleViewerScroll);
    
    // Restore session state on load if exists
    const savedStateStr = sessionStorage.getItem("secure_redact_state");
    if (savedStateStr) {
        try {
            const state = JSON.parse(savedStateStr);
            restoreAllStates(state);
            
            // Re-render UI based on restored active mode
            if (State.sessionData && State.sessionData.sessionId) {
                renderFindingsList();
                renderPDF();
                renderThumbnails();
                updateRedactionCount();
            }
            if (State.mergeSessionData && State.mergeSessionData.sessionId) {
                renderMergeFileList();
            }
            if (State.splitSessionData && State.splitSessionData.sessionId) {
                renderSplitThumbnails();
            }
            if (State.securitySessionData && State.securitySessionData.sessionId) {
                renderSecurityWorkspace();
            }
            if (State.compressSessionData && State.compressSessionData.sessionId) {
                renderCompressWorkspace();
            }
            if (State.organizeSessionData && State.organizeSessionData.sessionId) {
                renderOrganizeWorkspace();
            }
            if (State.watermarkSessionData && State.watermarkSessionData.sessionId) {
                renderWatermarkWorkspace();
            }
            if (State.convertSessionData) {
                renderConvertWorkspace();
            }
            
            if (state.activeMode && state.activeMode !== "dashboard") {
                switchAppMode(state.activeMode);
            }
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
    
    apiUploadPDF(file)
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

const TABS = ["ai-findings", "manual-search", "settings-export"];

// Workspace Tab Switching
function switchMainTab(tabId) {
    const nextTabIndex = TABS.indexOf(tabId);
    const direction = nextTabIndex > State.currentTabIndex ? "left" : "right";
    
    // Switch active states of tab buttons
    let activeBtn = null;
    document.querySelectorAll(".sidebar-tab-btn").forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add("active");
            activeBtn = btn;
        } else {
            btn.classList.remove("active");
        }
    });

    // Position sliding tab indicator
    const indicator = document.getElementById("sidebarTabIndicator");
    if (indicator && activeBtn) {
        indicator.style.left = `${activeBtn.offsetLeft}px`;
        indicator.style.width = `${activeBtn.offsetWidth}px`;
    }

    // Switch active states of tab pane containers and apply directional transitions
    document.querySelectorAll(".tab-content-pane").forEach(pane => {
        const targetId = `${tabId.replace(/-([a-z])/g, g => g[1].toUpperCase())}Content`;
        pane.classList.remove("slide-left", "slide-right");
        
        if (pane.id === targetId) {
            pane.classList.add("active");
            if (nextTabIndex !== State.currentTabIndex) {
                void pane.offsetWidth; // Force reflow to restart keyframe animations
                pane.classList.add(direction === "left" ? "slide-left" : "slide-right");
            }
        } else {
            pane.classList.remove("active");
        }
    });
    
    State.currentTabIndex = nextTabIndex;
}


// Workspace Initialization
function initializeWorkspace(data) {
    State.sessionData = {
        sessionId: data.session_id,
        filename: data.filename,
        totalPages: data.total_pages,
        pages: data.pages,
        findings: data.findings
    };
    
    // Default: Redact all automatic findings
    State.redactedFindingIds = new Set(State.sessionData.findings.map(f => f.id));
    State.manualRedactions = [];
    State.zoomLevel = 1.0;
    zoomDisplay.innerText = "100%";
    
    // Update labels
    fileNameDisplay.innerText = State.sessionData.filename;
    fileNameDisplay.title = State.sessionData.filename;
    propFileName.innerText = State.sessionData.filename;
    propFileName.title = State.sessionData.filename;
    propPageCount.innerText = State.sessionData.totalPages;
    totalPagesNum.innerText = State.sessionData.totalPages;
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
    
    // Switch views first so that elements are visible in the DOM and layout dimensions are correctly calculated
    uploadSection.classList.add("hidden");
    workspaceSection.classList.remove("hidden");
    
    // Switch to findings tab by default
    switchMainTab("ai-findings");
    
    // Fit to width by default once layout dimensions are established
    setTimeout(() => {
        fitToWidth();
    }, 150);
}

// Populate Findings Sidebar accordion with specific PII category icons using Switch Toggles
function renderFindingsList() {
    findingsContainer.innerHTML = "";
    totalFindingsBadge.innerText = State.sessionData.findings.length;
    
    if (State.sessionData.findings.length === 0) {
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
    State.sessionData.findings.forEach(finding => {
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
        const allChecked = items.every(item => State.redactedFindingIds.has(item.id));
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
            const isRedacted = State.redactedFindingIds.has(item.id);
            
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
        State.redactedFindingIds.add(id);
    } else {
        State.redactedFindingIds.delete(id);
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
        const isRedacted = State.redactedFindingIds.has(item.id);
        
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
    
    apiSearchPDF(State.sessionData.sessionId, query, State.isRegexSearch)
    .then(data => {
        showLoading(false);
        
        if (data.results.length === 0) {
            alert("No matches found for search query.");
            return;
        }
        
        // Add new findings to session findings
        data.results.forEach(result => {
            // Check if finding is already added to avoid double counts
            const exists = State.sessionData.findings.some(f => f.text === result.text && f.page_num === result.page_num);
            if (!exists) {
                State.sessionData.findings.push(result);
                State.redactedFindingIds.add(result.id); // Auto-check new search results
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
// Global actions
function clearAllRedactions() {
    if (confirm("Are you sure you want to clear all manual and automatic redactions?")) {
        State.redactedFindingIds.clear();
        State.manualRedactions = [];
        
        // Uncheck all sidebar items
        document.querySelectorAll(".finding-item-cb").forEach(cb => cb.checked = false);
        document.querySelectorAll(".category-master-cb").forEach(cb => cb.checked = false);
        
        reRenderAllOverlays();
        updateRedactionCount();
    }
}

function updateRedactionCount() {
    // Count active auto findings + manual boxes
    const activeAutoCount = Array.from(State.redactedFindingIds).reduce((acc, id) => {
        const finding = State.sessionData.findings.find(f => f.id === id);
        return acc + (finding ? finding.rects.length : 0);
    }, 0);
    
    const totalCount = activeAutoCount + State.manualRedactions.length;
    propRedactionsCount.innerText = totalCount;
}

// Save Redactions & metadata to compile PDF
function runSanitization() {
    if (State.sessionData.findings.length === 0 && State.manualRedactions.length === 0) {
        alert("No redactions defined to sanitize this document.");
        return;
    }
    
    showLoading(true, "Sanitizing Document Layers...", 20);
    
    // Group active findings and manual edits by page
    const redactionPayload = [];
    
    // Build redactions payload
    for (let pNum = 0; pNum < State.sessionData.totalPages; pNum++) {
        const pageRects = [];
        
        // Add checked auto findings
        const pageFindings = State.sessionData.findings.filter(f => f.page_num === pNum && State.redactedFindingIds.has(f.id));
        pageFindings.forEach(f => {
            pageRects.push(...f.rects);
        });
        
        // Add manual highlights
        const pageManuals = State.manualRedactions.filter(m => m.page_num === pNum);
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
        session_id: State.sessionData.sessionId,
        redactions: redactionPayload,
        strip_metadata: stripMetadataCheckbox.checked
    };
    
    apiRedactPDF(State.sessionData.sessionId, redactionPayload, stripMetadataCheckbox.checked)
    .then(data => {
        updateProgress(90);
        
        // Trigger file download
        triggerFileDownload(data.download_url, `redacted_${State.sessionData.filename}`);
        
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
    State.sessionData = {
        sessionId: null,
        filename: "",
        totalPages: 0,
        pages: [],
        findings: []
    };
    State.redactedFindingIds.clear();
    State.manualRedactions = [];
    
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
    if (splitSec) splitSec.classList.add("hidden");    if (securitySection) securitySection.classList.add("hidden");
    if (compressSection) compressSection.classList.add("hidden");
    if (organizeSection) organizeSection.classList.add("hidden");
    if (watermarkSection) watermarkSection.classList.add("hidden");
    if (convertSection) convertSection.classList.add("hidden");
 
    if (mode === "dashboard") {
        if (dashboardSection) dashboardSection.classList.remove("hidden");
    } else if (mode === "sanitize") {
        if (State.sessionData.sessionId) {
            if (workspaceSection) workspaceSection.classList.remove("hidden");
        } else {
            if (uploadSection) uploadSection.classList.remove("hidden");
        }
    } else if (mode === "merge") {
        if (mergeSec) mergeSec.classList.remove("hidden");
        renderMergeFileList();
    } else if (mode === "split") {
        if (splitSec) splitSec.classList.remove("hidden");
        if (State.splitSessionData.sessionId) {
            if (splitUploadCard) splitUploadCard.classList.add("hidden");
            if (splitWorkspaceContainer) splitWorkspaceContainer.classList.remove("hidden");
            renderSplitThumbnails();
        } else {
            if (splitUploadCard) splitUploadCard.classList.remove("hidden");
            if (splitWorkspaceContainer) splitWorkspaceContainer.classList.add("hidden");
        }
    } else if (mode === "security") {
        if (securitySection) securitySection.classList.remove("hidden");
        if (State.securitySessionData.sessionId) {
            if (securityUploadCard) securityUploadCard.classList.add("hidden");
            if (securityWorkspaceContainer) securityWorkspaceContainer.classList.remove("hidden");
            renderSecurityWorkspace();
        } else {
            if (securityUploadCard) securityUploadCard.classList.remove("hidden");
            if (securityWorkspaceContainer) securityWorkspaceContainer.classList.add("hidden");
        }
    } else if (mode === "compress") {
        if (compressSection) compressSection.classList.remove("hidden");
        if (State.compressSessionData.sessionId) {
            if (compressUploadCard) compressUploadCard.classList.add("hidden");
            if (compressWorkspaceContainer) compressWorkspaceContainer.classList.remove("hidden");
            renderCompressWorkspace();
        } else {
            if (compressUploadCard) compressUploadCard.classList.remove("hidden");
            if (compressWorkspaceContainer) compressWorkspaceContainer.classList.add("hidden");
        }
    } else if (mode === "organize") {
        if (organizeSection) organizeSection.classList.remove("hidden");
        if (State.organizeSessionData.sessionId) {
            if (organizeUploadCard) organizeUploadCard.classList.add("hidden");
            if (organizeWorkspaceContainer) organizeWorkspaceContainer.classList.remove("hidden");
            renderOrganizeWorkspace();
        } else {
            if (organizeUploadCard) organizeUploadCard.classList.remove("hidden");
            if (organizeWorkspaceContainer) organizeWorkspaceContainer.classList.add("hidden");
        }
    } else if (mode === "watermark") {
        if (watermarkSection) watermarkSection.classList.remove("hidden");
        if (State.watermarkSessionData.sessionId) {
            if (watermarkUploadCard) watermarkUploadCard.classList.add("hidden");
            if (watermarkWorkspaceContainer) watermarkWorkspaceContainer.classList.remove("hidden");
            renderWatermarkWorkspace();
        } else {
            if (watermarkUploadCard) watermarkUploadCard.classList.remove("hidden");
            if (watermarkWorkspaceContainer) watermarkWorkspaceContainer.classList.add("hidden");
        }
    } else if (mode === "convert") {
        if (convertSection) convertSection.classList.remove("hidden");
        renderConvertWorkspace();
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
    closeWatermarkWorkspace(); // Cleans watermark state
    closeConvertWorkspace(); // Cleans convert state
    
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
        if (State.mergeSessionData.sessionId) {
            formData.append("session_id", State.mergeSessionData.sessionId);
        }

        apiMergeUpload(file, State.mergeSessionData.sessionId)
        .then(data => {
            State.mergeSessionData.sessionId = data.session_id;
            State.mergeSessionData.files.push({
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
    if (State.mergeSessionData.files.length === 0) {
        mergeFileListContainer.classList.add("hidden");
        return;
    }

    mergeFileListContainer.classList.remove("hidden");

    State.mergeSessionData.files.forEach((file, index) => {
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
                <button class="merge-action-btn move-down" title="Move Down" ${index === State.mergeSessionData.files.length - 1 ? "disabled" : ""}>
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
    if (targetIndex < 0 || targetIndex >= State.mergeSessionData.files.length) return;

    const file = State.mergeSessionData.files.splice(index, 1)[0];
    State.mergeSessionData.files.splice(targetIndex, 0, file);
    renderMergeFileList();
}

function removeMergeFile(index) {
    State.mergeSessionData.files.splice(index, 1);
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
            const file = State.mergeSessionData.files.splice(fromIndex, 1)[0];
            State.mergeSessionData.files.splice(toIndex, 0, file);
            renderMergeFileList();
        }
    });
}

function runMerge() {
    if (State.mergeSessionData.files.length < 2) {
        alert("Please upload at least 2 PDF files to merge.");
        return;
    }

    showLoading(true, "Merging documents...", 50);

    const fileIds = State.mergeSessionData.files.map(f => f.fileId);

    apiMergeExecute(State.mergeSessionData.sessionId, fileIds)
    .then(data => {
        updateProgress(90);
        
        triggerFileDownload(data.download_url, "merged_document.pdf");

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
    State.mergeSessionData = {
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

    apiSplitUpload(file)
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
    State.splitSessionData = {
        sessionId: data.session_id,
        filename: data.filename,
        totalPages: data.total_pages,
        pages: data.pages,
        selectedPages: new Set(),
        mode: "extract"
    };

    splitFileNameDisplay.innerText = State.splitSessionData.filename;
    splitFileNameDisplay.title = State.splitSessionData.filename;
    splitTotalPagesVal.innerText = State.splitSessionData.totalPages;
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
    const totalPages = State.splitSessionData.totalPages;
    
    State.splitSessionData.pages.forEach((page, index) => {
        const card = document.createElement("div");
        card.className = "split-page-card";
        card.dataset.pageNum = page.page_num;

        const isSelected = State.splitSessionData.selectedPages.has(page.page_num);
        if (isSelected && State.splitSessionData.mode === "extract") {
            card.classList.add("selected");
        }

        card.innerHTML = `
            <div class="split-checkbox-container ${State.splitSessionData.mode === "parts" ? "hidden" : ""}">
                <input type="checkbox" class="split-page-checkbox" ${isSelected ? "checked" : ""}>
            </div>
            <div class="split-page-img-container">
                <img src="${page.image_url}" alt="Page ${page.page_num + 1}">
            </div>
            <span class="split-page-number">Page ${page.page_num + 1}</span>
        `;

        card.addEventListener("click", (e) => {
            if (e.target.classList.contains("split-page-checkbox")) return;
            
            if (State.splitSessionData.mode === "extract") {
                toggleSplitPageSelection(page.page_num);
            }
        });

        card.querySelector(".split-page-checkbox").addEventListener("change", (e) => {
            if (State.splitSessionData.mode === "extract") {
                toggleSplitPageSelection(page.page_num, e.target.checked);
            } else {
                e.target.checked = !e.target.checked;
            }
        });

        splitThumbnailGrid.appendChild(card);

        // Render split gutter between items for visual cuts (only in parts mode)
        if (State.splitSessionData.mode === "parts" && index < totalPages - 1) {
            const gutter = document.createElement("div");
            gutter.className = "split-gutter";
            gutter.dataset.gutterIdx = index;
            if (State.splitCutPoints.has(index)) {
                gutter.classList.add("active");
            }

            gutter.innerHTML = `
                <div class="split-gutter-line"></div>
                <div class="split-gutter-scissors">
                    <i class="fa-solid fa-scissors"></i>
                </div>
            `;

            gutter.addEventListener("click", () => {
                if (State.splitCutPoints.has(index)) {
                    State.splitCutPoints.delete(index);
                    gutter.classList.remove("active");
                } else {
                    State.splitCutPoints.add(index);
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
    
    let shouldSelect = forceState !== null ? forceState : !State.splitSessionData.selectedPages.has(pageNum);
    
    if (shouldSelect) {
        State.splitSessionData.selectedPages.add(pageNum);
        card.classList.add("selected");
        if (checkbox) checkbox.checked = true;
    } else {
        State.splitSessionData.selectedPages.delete(pageNum);
        card.classList.remove("selected");
        if (checkbox) checkbox.checked = false;
    }

    splitTargetCountVal.innerText = `${State.splitSessionData.selectedPages.size} selected`;
}

function switchSplitMode(mode) {
    if (State.splitSessionData.mode === mode) return;
    State.splitSessionData.mode = mode;

    if (mode === "extract") {
        splitModeExtractBtn.classList.add("active");
        splitModePartsBtn.classList.remove("active");
        splitPartsRangeGroup.classList.add("hidden");
        
        splitGuideTitle.innerHTML = `<i class="fa-solid fa-circle-info"></i> How to Extract`;
        splitGuideText.innerText = "Check the checkbox on the top-right corner of each page preview you wish to extract. Only checked pages will be combined into your new PDF.";

        State.splitCutPoints.clear();
        splitPartsInput.value = "";
        renderSplitThumbnails();
        splitTargetCountVal.innerText = `${State.splitSessionData.selectedPages.size} selected`;
    } else {
        splitModeExtractBtn.classList.remove("active");
        splitModePartsBtn.classList.add("active");
        splitPartsRangeGroup.classList.remove("hidden");

        splitGuideTitle.innerHTML = `<i class="fa-solid fa-scissors"></i> Visual Range Groups`;
        splitGuideText.innerText = "Click between pages to split, or enter page ranges manually (e.g. 1-2, 3-5). Page groups will color-code themselves.";

        State.splitSessionData.selectedPages.clear();
        renderSplitThumbnails();
        handleSplitPartsInputChange(true);
    }
}

// Bidirectional Sync helper: CutPoints -> Input Field
function updateInputFromCutPoints() {
    const totalPages = State.splitSessionData.totalPages;
    if (totalPages <= 0) return;
    
    const ranges = [];
    let startPage = 1;
    
    for (let i = 0; i < totalPages - 1; i++) {
        if (State.splitCutPoints.has(i)) {
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
    State.splitCutPoints.clear();
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
        if (cutPoint >= 0 && cutPoint < State.splitSessionData.totalPages - 1) {
            State.splitCutPoints.add(cutPoint);
        }
    }
    
    // Update visual active class on gutters
    document.querySelectorAll(".split-gutter").forEach(gutter => {
        const idx = parseInt(gutter.dataset.gutterIdx);
        if (State.splitCutPoints.has(idx)) {
            gutter.classList.add("active");
        } else {
            gutter.classList.remove("active");
        }
    });
}

function handleSplitPartsInputChange(syncCutPoints = true) {
    if (State.splitSessionData.mode !== "parts") return;
    
    if (syncCutPoints) {
        updateCutPointsFromInput();
    }
    
    const val = splitPartsInput.value.trim();
    const totalPages = State.splitSessionData.totalPages;

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
    if (!State.splitSessionData.sessionId) return;

    if (State.splitSessionData.mode === "extract") {
        if (State.splitSessionData.selectedPages.size === 0) {
            alert("Please select at least one page to extract.");
            return;
        }

        showLoading(true, "Extracting pages...", 40);

        const pages = Array.from(State.splitSessionData.selectedPages).sort((a, b) => a - b);

        apiSplitExtract(State.splitSessionData.sessionId, pages)
        .then(data => {
            updateProgress(80);
            triggerFileDownload(data.download_url, `extracted_${State.splitSessionData.filename}`);

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
                    if (i >= 1 && i <= State.splitSessionData.totalPages) {
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

        apiSplitParts(State.splitSessionData.sessionId, parts)
        .then(data => {
            updateProgress(80);
            triggerFileDownload(data.download_url, `split_${State.splitSessionData.filename.replace(".pdf", "")}.zip`);

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
    if (State.splitSessionData.mode === "extract") {
        State.splitSessionData.selectedPages.clear();
        renderSplitThumbnails();
        splitTargetCountVal.innerText = "0 selected";
    } else {
        State.splitCutPoints.clear();
        splitPartsInput.value = "";
        handleSplitPartsInputChange(false);
    }
}

function closeSplitWorkspace() {
    State.splitSessionData = {
        sessionId: null,
        filename: "",
        totalPages: 0,
        pages: [],
        selectedPages: new Set(),
        mode: "extract"
    };
    State.splitCutPoints.clear();

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
    
    apiSecurityUpload(file)
    .then(data => {
        State.securitySessionData = {
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
    if (securityFileNameDisplay) {
        securityFileNameDisplay.innerText = State.securitySessionData.filename;
        securityFileNameDisplay.title = State.securitySessionData.filename;
    }
    
    let sizeText = "";
    if (State.securitySessionData.fileSize > 1024 * 1024) {
        sizeText = (State.securitySessionData.fileSize / (1024 * 1024)).toFixed(2) + " MB";
    } else {
        sizeText = (State.securitySessionData.fileSize / 1024).toFixed(1) + " KB";
    }
    if (securityFileSizeDisplay) securityFileSizeDisplay.innerText = sizeText;
    
    if (securityPageCountDisplay) {
        securityPageCountDisplay.innerText = State.securitySessionData.totalPages + (State.securitySessionData.totalPages === 1 ? " page" : " pages");
    }
    
    if (State.securitySessionData.isEncrypted) {
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
    
    apiSecurityUnlock(State.securitySessionData.sessionId, password)
    .then(data => {
        showLoading(false);
        // Direct download of decrypted PDF
        triggerFileDownload(data.download_url, `unlocked_${State.securitySessionData.filename || "document.pdf"}`);
        
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
    
    apiSecurityProtect(State.securitySessionData.sessionId, {
        user_password: userPassword,
        owner_password: ownerPassword,
        prevent_print: preventPrintToggle.checked,
        prevent_copy: preventCopyToggle.checked,
        prevent_modify: preventModifyToggle.checked
    })
    .then(data => {
        showLoading(false);
        // Direct download of protected PDF
        triggerFileDownload(data.download_url, `protected_${State.securitySessionData.filename || "document.pdf"}`);
        
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
    State.securitySessionData = {
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

window.addEventListener("beforeunload", (e) => {
    const isSessionActive = State.sessionData.sessionId || 
                            (State.mergeSessionData.files && State.mergeSessionData.files.length > 0) || 
                            State.splitSessionData.sessionId || 
                            State.securitySessionData.sessionId ||
                            State.compressSessionData.sessionId ||
                            State.organizeSessionData.sessionId ||
                            State.watermarkSessionData.sessionId ||
                            State.convertSessionData.pdfSessionId ||
                            State.convertSessionData.imgSessionId ||
                            (State.convertSessionData.imgFiles && State.convertSessionData.imgFiles.length > 0);
                            
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
    console.log(`Starting secure download from ${url} as ${filename}`);
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.statusText}`);
            }
            return response.blob();
        })
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Revoke the Object URL after a short timeout so the browser has time to start the download
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
            }, 1000);
        })
        .catch(err => {
            console.error("Secure blob download failed, falling back to direct download:", err);
            // Fallback to direct download link click in case of network issue
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
}

function cleanupSessionOnServer(sessionId) {
    apiCleanupSession(sessionId);
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
    
    apiCompressUpload(file)
    .then(data => {
        State.compressSessionData = {
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
    if (compressFileNameDisplay) {
        compressFileNameDisplay.innerText = State.compressSessionData.filename;
        compressFileNameDisplay.title = State.compressSessionData.filename;
    }
    
    let sizeText = "";
    if (State.compressSessionData.fileSize > 1024 * 1024) {
        sizeText = (State.compressSessionData.fileSize / (1024 * 1024)).toFixed(2) + " MB";
    } else {
        sizeText = (State.compressSessionData.fileSize / 1024).toFixed(1) + " KB";
    }
    if (compressFileSizeDisplay) compressFileSizeDisplay.innerText = sizeText;
    
    // Ensure correct configuration panel visibility
    if (compressConfigPanel) compressConfigPanel.classList.remove("hidden");
    if (compressResultsPanel) compressResultsPanel.classList.add("hidden");
    
    // Ensure segment buttons reflect correct state (e.g. from restored state)
    const segmentBtns = document.querySelectorAll("#compressSection .segment-btn");
    segmentBtns.forEach(btn => {
        if (btn.dataset.level === State.compressSessionData.level) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

function runCompress() {
    if (!State.compressSessionData.sessionId) return;
    
    showLoading(true, "Compressing document...", 40);
    
    apiCompressExecute(State.compressSessionData.sessionId, State.compressSessionData.level)
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
    if (State.compressSessionData.sessionId) {
        cleanupSessionOnServer(State.compressSessionData.sessionId);
    }

    State.compressSessionData = {
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
    
    apiOrganizeUpload(file)
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
    State.organizeSessionData = {
        sessionId: data.session_id,
        filename: data.filename,
        totalPages: data.total_pages,
        pages: data.pages.map(p => ({
            ...p,
            rotation: 0,
            deleted: false
        }))
    };
    
    if (organizeFileNameDisplay) {
        organizeFileNameDisplay.innerText = State.organizeSessionData.filename;
        organizeFileNameDisplay.title = State.organizeSessionData.filename;
    }
    
    renderOrganizeWorkspace();
    
    if (organizeUploadCard) organizeUploadCard.classList.add("hidden");
    if (organizeWorkspaceContainer) organizeWorkspaceContainer.classList.remove("hidden");
}

function renderOrganizeWorkspace() {
    if (!organizeThumbnailGrid) return;
    organizeThumbnailGrid.innerHTML = "";
    
    State.organizeSessionData.pages.forEach((page, index) => {
        const card = document.createElement("div");
        card.className = "organize-page-card";
        card.setAttribute("draggable", "true");
        
        if (page.deleted) {
            card.classList.add("deleted");
        }
        
        let previewHtml = '';
        if (page.is_blank) {
            previewHtml = `
                <div class="organize-blank-page-placeholder" style="transform: rotate(${page.rotation || 0}deg);">
                    <i class="fa-solid fa-file"></i>
                    <span>Blank Page</span>
                </div>
            `;
        } else {
            previewHtml = `
                <img src="${page.image_url}" class="organize-page-img" alt="Page ${index + 1}" style="transform: rotate(${page.rotation || 0}deg);">
            `;
        }
        
        card.innerHTML = `
            <div class="organize-page-img-container">
                ${previewHtml}
                <div class="organize-page-controls">
                    <button class="organize-control-btn shift-left" title="Move Left" ${index === 0 ? 'disabled style="opacity: 0.3; pointer-events: none;"' : ''}>
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <button class="organize-control-btn shift-right" title="Move Right" ${index === State.organizeSessionData.pages.length - 1 ? 'disabled style="opacity: 0.3; pointer-events: none;"' : ''}>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                    <button class="organize-control-btn rotate-ccw" title="Rotate Counter-Clockwise">
                        <i class="fa-solid fa-rotate-left"></i>
                    </button>
                    <button class="organize-control-btn rotate-cw" title="Rotate Clockwise">
                        <i class="fa-solid fa-rotate-right"></i>
                    </button>
                    <button class="organize-control-btn duplicate-page" title="Duplicate Page">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                    <button class="organize-control-btn delete-page" title="Delete Page">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            <span class="organize-page-number">Page ${index + 1}${page.is_blank ? ' (Blank)' : ` (Orig. ${page.page_num + 1})`}</span>
        `;
        
        // Add event listeners inside the controls
        card.querySelector(".shift-left").addEventListener("click", (e) => {
            e.stopPropagation();
            shiftOrganizePage(index, "left");
        });
        
        card.querySelector(".shift-right").addEventListener("click", (e) => {
            e.stopPropagation();
            shiftOrganizePage(index, "right");
        });
        
        card.querySelector(".rotate-ccw").addEventListener("click", (e) => {
            e.stopPropagation();
            toggleOrganizePageRotation(index, "ccw");
        });
        
        card.querySelector(".rotate-cw").addEventListener("click", (e) => {
            e.stopPropagation();
            toggleOrganizePageRotation(index, "cw");
        });
        
        card.querySelector(".duplicate-page").addEventListener("click", (e) => {
            e.stopPropagation();
            duplicateOrganizePage(index);
        });
        
        card.querySelector(".delete-page").addEventListener("click", (e) => {
            e.stopPropagation();
            toggleOrganizePageDeletion(index, true);
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
                toggleOrganizePageDeletion(index, false);
            });
            card.appendChild(overlay);
        }
        
        // Native HTML5 Drag and Drop event listeners
        card.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", index);
            card.classList.add("dragging");
        });
        
        card.addEventListener("dragover", (e) => {
            e.preventDefault();
            card.classList.add("drag-over");
        });
        
        card.addEventListener("dragleave", () => {
            card.classList.remove("drag-over");
        });
        
        card.addEventListener("drop", (e) => {
            e.preventDefault();
            card.classList.remove("drag-over");
            const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
            const toIndex = index;
            if (!isNaN(fromIndex) && fromIndex !== toIndex) {
                const movedPage = State.organizeSessionData.pages.splice(fromIndex, 1)[0];
                State.organizeSessionData.pages.splice(toIndex, 0, movedPage);
                renderOrganizeWorkspace();
                saveAllStates();
            }
        });
        
        card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
        });
        
        organizeThumbnailGrid.appendChild(card);
    });
    
    // Append the "+" card at the end of the grid
    const addCard = document.createElement("div");
    addCard.className = "organize-add-card";
    addCard.innerHTML = `
        <i class="fa-solid fa-circle-plus"></i>
        <span>Add Blank Page</span>
    `;
    addCard.addEventListener("click", () => {
        addOrganizeBlankPage();
    });
    organizeThumbnailGrid.appendChild(addCard);
    
    updateOrganizeSummary();
}

function toggleOrganizePageRotation(index, direction) {
    const page = State.organizeSessionData.pages[index];
    if (!page) return;
    
    if (direction === "cw") {
        page.rotation = (page.rotation + 90) % 360;
    } else {
        page.rotation = (page.rotation - 90) % 360;
        if (page.rotation < 0) page.rotation += 360;
    }
    
    renderOrganizeWorkspace();
    saveAllStates();
}

function toggleOrganizePageDeletion(index, isDeleted) {
    const page = State.organizeSessionData.pages[index];
    if (!page) return;
    
    page.deleted = isDeleted;
    
    renderOrganizeWorkspace();
    saveAllStates();
}

function shiftOrganizePage(index, direction) {
    const pages = State.organizeSessionData.pages;
    if (direction === "left" && index > 0) {
        const temp = pages[index];
        pages[index] = pages[index - 1];
        pages[index - 1] = temp;
    } else if (direction === "right" && index < pages.length - 1) {
        const temp = pages[index];
        pages[index] = pages[index + 1];
        pages[index + 1] = temp;
    }
    renderOrganizeWorkspace();
    saveAllStates();
}

function duplicateOrganizePage(index) {
    const pageToDuplicate = State.organizeSessionData.pages[index];
    if (!pageToDuplicate) return;
    
    const duplicateItem = {
        ...pageToDuplicate,
        deleted: false
    };
    
    State.organizeSessionData.pages.splice(index + 1, 0, duplicateItem);
    renderOrganizeWorkspace();
    saveAllStates();
}

function addOrganizeBlankPage() {
    if (!State.organizeSessionData.sessionId) return;
    
    const blankItem = {
        page_num: -1,
        is_blank: true,
        rotation: 0,
        deleted: false
    };
    
    State.organizeSessionData.pages.push(blankItem);
    renderOrganizeWorkspace();
    saveAllStates();
}

function updateOrganizeSummary() {
    if (!State.organizeSessionData.sessionId) return;
    
    const total = State.organizeSessionData.pages.length;
    const deletedCount = State.organizeSessionData.pages.filter(p => p.deleted).length;
    const rotatedCount = State.organizeSessionData.pages.filter(p => !p.deleted && p.rotation !== 0).length;
    
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
    if (!State.organizeSessionData.sessionId) return;
    
    const remainingPages = State.organizeSessionData.pages.filter(p => !p.deleted);
    if (remainingPages.length === 0) {
        alert("Cannot organize a document with all pages deleted.");
        return;
    }
    
    showLoading(true, "Applying changes and compiling PDF...", 40);
    
    const payload = {
        session_id: State.organizeSessionData.sessionId,
        pages: remainingPages.map(p => ({
            page_num: p.page_num,
            rotation: p.rotation,
            is_blank: p.is_blank || false
        }))
    };
    
    apiOrganizeExecute(State.organizeSessionData.sessionId, payload.pages)
    .then(data => {
        showLoading(false);
        triggerFileDownload(data.download_url, `organized_${State.organizeSessionData.filename || "document.pdf"}`);
        
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
    if (!State.organizeSessionData.sessionId) return;
    
    if (confirm("Are you sure you want to reset all rotations, reorderings, duplications, and blank pages?")) {
        const originalPages = [];
        for (let i = 0; i < State.organizeSessionData.totalPages; i++) {
            originalPages.push({
                page_num: i,
                width: 612,
                height: 792,
                image_url: `/api/organize/page/${State.organizeSessionData.sessionId}/${i}`,
                rotation: 0,
                deleted: false,
                is_blank: false
            });
        }
        State.organizeSessionData.pages = originalPages;
        renderOrganizeWorkspace();
        saveAllStates();
    }
}

function closeOrganizeWorkspace() {
    if (State.organizeSessionData.sessionId) {
        cleanupSessionOnServer(State.organizeSessionData.sessionId);
    }
    
    State.organizeSessionData = {
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

// Watermark PDF Tool Handlers
function handleWatermarkFileSelect(e) {
    if (watermarkFileInput.files.length > 0) {
        uploadWatermarkFile(watermarkFileInput.files[0]);
    }
}

function handleWatermarkFileDrop(e) {
    e.preventDefault();
    watermarkDropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
        uploadWatermarkFile(e.dataTransfer.files[0]);
    }
}

function uploadWatermarkFile(file) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
        alert("Please upload a PDF file.");
        return;
    }
    
    showLoading(true, "Uploading and analyzing PDF...", 20);
    
    const formData = new FormData();
    formData.append("file", file);
    
    apiWatermarkUpload(file)
    .then(data => {
        showLoading(false);
        initializeWatermarkWorkspace(data);
    })
    .catch(err => {
        showLoading(false);
        alert(err.message);
        if (watermarkFileInput) watermarkFileInput.value = "";
    });
}

function initializeWatermarkWorkspace(data) {
    State.watermarkSessionData = {
        sessionId: data.session_id,
        filename: data.filename,
        totalPages: data.total_pages,
        pages: data.pages,
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
    };
    
    if (watermarkFileNameDisplay) {
        watermarkFileNameDisplay.innerText = State.watermarkSessionData.filename;
        watermarkFileNameDisplay.title = State.watermarkSessionData.filename;
    }
    
    // Reset inputs visually
    if (watermarkTextVal) watermarkTextVal.value = "CONFIDENTIAL";
    if (watermarkTextColor) watermarkTextColor.value = "#ef4444";
    if (watermarkTextColorHex) watermarkTextColorHex.innerText = "#EF4444";
    if (watermarkTextFontSize) watermarkTextFontSize.value = 36;
    if (watermarkTextFontSizeLabel) watermarkTextFontSizeLabel.innerText = "36px";
    if (watermarkTextRotation) watermarkTextRotation.value = 45;
    if (watermarkTextRotationLabel) watermarkTextRotationLabel.innerText = "45°";
    if (watermarkImageScale) watermarkImageScale.value = 30;
    if (watermarkImageScaleLabel) watermarkImageScaleLabel.innerText = "0.3";
    if (watermarkOpacity) watermarkOpacity.value = 30;
    if (watermarkOpacityLabel) watermarkOpacityLabel.innerText = "30%";
    if (watermarkPosition) watermarkPosition.value = "center";
    if (watermarkPagesMode) watermarkPagesMode.value = "all";
    if (watermarkCustomPagesVal) watermarkCustomPagesVal.value = "";
    if (watermarkCustomPagesGroup) watermarkCustomPagesGroup.classList.add("hidden");
    if (watermarkLogoFileName) watermarkLogoFileName.innerText = "No file chosen";
    
    switchWatermarkType("text");
    renderWatermarkWorkspace();
    
    if (watermarkUploadCard) watermarkUploadCard.classList.add("hidden");
    if (watermarkWorkspaceContainer) watermarkWorkspaceContainer.classList.remove("hidden");
}

function switchWatermarkType(type) {
    State.watermarkSessionData.type = type;
    if (type === "text") {
        if (watermarkTypeTextBtn) watermarkTypeTextBtn.classList.add("active");
        if (watermarkTypeImageBtn) watermarkTypeImageBtn.classList.remove("active");
        if (watermarkTextConfigGroup) watermarkTextConfigGroup.classList.remove("hidden");
        if (watermarkImageConfigGroup) watermarkImageConfigGroup.classList.add("hidden");
    } else {
        if (watermarkTypeTextBtn) watermarkTypeTextBtn.classList.remove("active");
        if (watermarkTypeImageBtn) watermarkTypeImageBtn.classList.add("active");
        if (watermarkTextConfigGroup) watermarkTextConfigGroup.classList.add("hidden");
        if (watermarkImageConfigGroup) watermarkImageConfigGroup.classList.remove("hidden");
    }
    updateWatermarkLivePreview();
}

function handleLogoSelect(e) {
    if (watermarkLogoInput.files.length > 0) {
        const file = watermarkLogoInput.files[0];
        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file.");
            return;
        }
        
        State.watermarkSessionData.logoFile = file;
        if (watermarkLogoFileName) watermarkLogoFileName.innerText = file.name;
        
        // Revoke old object URL if exists
        if (State.watermarkSessionData.logoUrl) {
            URL.revokeObjectURL(State.watermarkSessionData.logoUrl);
        }
        State.watermarkSessionData.logoUrl = URL.createObjectURL(file);
        
        // Upload logo image to server
        const formData = new FormData();
        formData.append("session_id", State.watermarkSessionData.sessionId);
        formData.append("file", file);
        
        apiWatermarkUploadLogo(State.watermarkSessionData.sessionId, file)
        .then(data => {
            console.log("Logo uploaded successfully");
            updateWatermarkLivePreview();
        })
        .catch(err => {
            alert("Failed to upload logo: " + err.message);
        });
    }
}

function renderWatermarkWorkspace() {
    renderWatermarkPage();
}

function renderWatermarkPage() {
    if (!State.watermarkSessionData.sessionId) return;
    
    const pageNum = State.watermarkSessionData.currentPage;
    const page = State.watermarkSessionData.pages[pageNum];
    
    if (watermarkPreviewImage) watermarkPreviewImage.src = page.image_url;
    if (watermarkCurrentPageNum) watermarkCurrentPageNum.innerText = pageNum + 1;
    if (watermarkTotalPagesNum) watermarkTotalPagesNum.innerText = State.watermarkSessionData.totalPages;
    
    // Scale preview page card to preserve aspect ratio
    if (watermarkPreviewPageCard) {
        watermarkPreviewPageCard.style.aspectRatio = `${page.width} / ${page.height}`;
    }
    
    updateWatermarkLivePreview();
}

function updateWatermarkLivePreview() {
    if (!watermarkVisualOverlay) return;
    
    // Check if watermark is active on the current visible page
    let shouldShow = true;
    const curIdx = State.watermarkSessionData.currentPage;
    
    if (State.watermarkSessionData.pagesMode === "first" && curIdx !== 0) {
        shouldShow = false;
    } else if (State.watermarkSessionData.pagesMode === "custom" && State.watermarkSessionData.customPages) {
        // Parse custom range
        const activePages = [];
        const parts = State.watermarkSessionData.customPages.split(",");
        const total = State.watermarkSessionData.totalPages;
        parts.forEach(part => {
            part = part.trim();
            if (part.includes("-")) {
                const rng = part.split("-");
                if (rng.length === 2) {
                    const start = parseInt(rng[0]);
                    const end = parseInt(rng[1]);
                    if (!isNaN(start) && !isNaN(end)) {
                        const s = Math.max(1, Math.min(total, start)) - 1;
                        const e = Math.max(1, Math.min(total, end)) - 1;
                        const low = Math.min(s, e);
                        const high = Math.max(s, e);
                        for (let i = low; i <= high; i++) {
                            activePages.push(i);
                        }
                    }
                }
            } else {
                const idx = parseInt(part);
                if (!isNaN(idx)) {
                    activePages.push(idx - 1);
                }
            }
        });
        shouldShow = activePages.includes(curIdx);
    }
    
    if (!shouldShow) {
        watermarkVisualOverlay.innerHTML = "";
        return;
    }
    
    // Clear overlay
    watermarkVisualOverlay.className = "watermark-visual-overlay";
    watermarkVisualOverlay.innerHTML = "";
    
    if (State.watermarkSessionData.position === "tiled") {
        watermarkVisualOverlay.classList.add("tiled-grid");
        const tileCount = 9;
        for (let i = 0; i < tileCount; i++) {
            const item = createWatermarkVisualItem(true);
            if (item) watermarkVisualOverlay.appendChild(item);
        }
    } else {
        const item = createWatermarkVisualItem(false);
        if (item) {
            // Apply positioning
            const pos = State.watermarkSessionData.position;
            if (pos === "center") {
                item.style.position = "absolute";
                item.style.top = "50%";
                item.style.left = "50%";
                item.style.transform = `translate(-50%, -50%) rotate(${State.watermarkSessionData.rotation}deg)`;
            } else if (pos === "top-left") {
                item.style.position = "absolute";
                item.style.top = "32px";
                item.style.left = "32px";
                item.style.transform = `rotate(${State.watermarkSessionData.rotation}deg)`;
            } else if (pos === "top-right") {
                item.style.position = "absolute";
                item.style.top = "32px";
                item.style.right = "32px";
                item.style.transform = `rotate(${State.watermarkSessionData.rotation}deg)`;
            } else if (pos === "bottom-left") {
                item.style.position = "absolute";
                item.style.bottom = "32px";
                item.style.left = "32px";
                item.style.transform = `rotate(${State.watermarkSessionData.rotation}deg)`;
            } else if (pos === "bottom-right") {
                item.style.position = "absolute";
                item.style.bottom = "32px";
                item.style.right = "32px";
                item.style.transform = `rotate(${State.watermarkSessionData.rotation}deg)`;
            }
            watermarkVisualOverlay.appendChild(item);
        }
    }
}

function createWatermarkVisualItem(isTiled = false) {
    if (State.watermarkSessionData.type === "text") {
        const span = document.createElement("span");
        span.className = "watermark-preview-item";
        span.innerText = State.watermarkSessionData.text || "CONFIDENTIAL";
        span.style.color = State.watermarkSessionData.color;
        span.style.opacity = State.watermarkSessionData.opacity;
        span.style.fontSize = `${State.watermarkSessionData.fontSize}px`;
        if (isTiled) {
            span.style.transform = `rotate(${State.watermarkSessionData.rotation}deg)`;
        }
        return span;
    } else {
        // Image logo type
        if (!State.watermarkSessionData.logoUrl) {
            const placeholder = document.createElement("div");
            placeholder.style.color = "var(--text-muted)";
            placeholder.style.fontSize = "var(--font-size-xs)";
            placeholder.style.fontStyle = "italic";
            placeholder.style.opacity = State.watermarkSessionData.opacity;
            placeholder.innerText = "[Select logo image]";
            return placeholder;
        }
        const img = document.createElement("img");
        img.className = "watermark-preview-item-image";
        img.src = State.watermarkSessionData.logoUrl;
        img.style.opacity = State.watermarkSessionData.opacity;
        
        // Size scale based on layout
        const percentageWidth = State.watermarkSessionData.scale * 100;
        img.style.width = `${percentageWidth}%`;
        
        if (isTiled) {
            img.style.transform = `rotate(${State.watermarkSessionData.rotation || 0}deg)`;
        }
        return img;
    }
}

function runWatermark() {
    if (!State.watermarkSessionData.sessionId) return;
    
    if (State.watermarkSessionData.type === "image" && !State.watermarkSessionData.logoFile) {
        alert("Please select and upload a logo image first.");
        return;
    }
    
    showLoading(true, "Stamping watermark onto document...", 40);
    
    const payload = {
        session_id: State.watermarkSessionData.sessionId,
        type: State.watermarkSessionData.type,
        text: State.watermarkSessionData.text,
        color: State.watermarkSessionData.color,
        font_size: State.watermarkSessionData.fontSize,
        opacity: State.watermarkSessionData.opacity,
        rotation: State.watermarkSessionData.rotation,
        scale: State.watermarkSessionData.scale,
        position: State.watermarkSessionData.position,
        pages_mode: State.watermarkSessionData.pagesMode,
        custom_pages: State.watermarkSessionData.customPages
    };
    
    apiWatermarkExecute(State.watermarkSessionData.sessionId, {
        type: State.watermarkSessionData.type,
        text: State.watermarkSessionData.text,
        color: State.watermarkSessionData.color,
        font_size: State.watermarkSessionData.fontSize,
        opacity: State.watermarkSessionData.opacity,
        rotation: State.watermarkSessionData.rotation,
        scale: State.watermarkSessionData.scale,
        position: State.watermarkSessionData.position,
        pages_mode: State.watermarkSessionData.pagesMode,
        custom_pages: State.watermarkSessionData.customPages
    })
    .then(data => {
        showLoading(false);
        triggerFileDownload(data.download_url, `watermarked_${State.watermarkSessionData.filename || "document.pdf"}`);
        
        setTimeout(() => {
            alert("Document watermarked successfully! Downloaded version.");
            returnToDashboard();
        }, 1000);
    })
    .catch(error => {
        showLoading(false);
        alert("Watermarking failed: " + error.message);
    });
}

function closeWatermarkWorkspace() {
    if (State.watermarkSessionData.sessionId) {
        cleanupSessionOnServer(State.watermarkSessionData.sessionId);
    }
    
    // Revoke object URL
    if (State.watermarkSessionData.logoUrl) {
        URL.revokeObjectURL(State.watermarkSessionData.logoUrl);
    }
    
    State.watermarkSessionData = {
        sessionId: null,
        filename: "",
        totalPages: 0,
        pages: [],
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
    };
    
    if (watermarkFileInput) watermarkFileInput.value = "";
    if (watermarkLogoInput) watermarkLogoInput.value = "";
    if (watermarkVisualOverlay) watermarkVisualOverlay.innerHTML = "";
    if (watermarkPreviewImage) watermarkPreviewImage.src = "";
    
    if (watermarkWorkspaceContainer) watermarkWorkspaceContainer.classList.add("hidden");
    if (watermarkUploadCard) watermarkUploadCard.classList.remove("hidden");
    
    saveAllStates();
}

// Convert Format tool handlers
function renderConvertWorkspace() {
    switchConvertTab(State.convertSessionData.activeTab);
    
    if (State.convertSessionData.pdfSessionId) {
        if (convertPdfUploadCard) convertPdfUploadCard.classList.add("hidden");
        if (convertPdfWorkspaceContainer) convertPdfWorkspaceContainer.classList.remove("hidden");
        
        if (convertPdfFileNameDisplay) {
            convertPdfFileNameDisplay.innerText = State.convertSessionData.pdfFilename;
            convertPdfFileNameDisplay.title = State.convertSessionData.pdfFilename;
        }
        if (convertImageFormat) convertImageFormat.value = State.convertSessionData.pdfFormat;
        if (convertImageDpi) {
            convertImageDpi.value = State.convertSessionData.pdfDpi;
            if (convertImageDpiLabel) convertImageDpiLabel.innerText = State.convertSessionData.pdfDpi + " DPI";
        }
        if (convertPdfPagesMode) {
            convertPdfPagesMode.value = State.convertSessionData.pdfPagesMode;
            if (State.convertSessionData.pdfPagesMode === "custom") {
                if (convertPdfCustomPagesGroup) convertPdfCustomPagesGroup.classList.remove("hidden");
            } else {
                if (convertPdfCustomPagesGroup) convertPdfCustomPagesGroup.classList.add("hidden");
            }
        }
        if (convertPdfCustomPagesVal) convertPdfCustomPagesVal.value = State.convertSessionData.pdfCustomPages;
        
        renderConvertPdfPage();
    } else {
        if (convertPdfUploadCard) convertPdfUploadCard.classList.remove("hidden");
        if (convertPdfWorkspaceContainer) convertPdfWorkspaceContainer.classList.add("hidden");
    }
    
    if (State.convertSessionData.imgSessionId || (State.convertSessionData.imgFiles && State.convertSessionData.imgFiles.length > 0)) {
        if (convertImgUploadCard) convertImgUploadCard.classList.add("hidden");
        if (convertImgWorkspaceContainer) convertImgWorkspaceContainer.classList.remove("hidden");
        
        renderConvertImageGrid();
    } else {
        if (convertImgUploadCard) convertImgUploadCard.classList.remove("hidden");
        if (convertImgWorkspaceContainer) convertImgWorkspaceContainer.classList.add("hidden");
    }
}

function switchConvertTab(tab) {
    State.convertSessionData.activeTab = tab;
    saveAllStates();
    
    if (tab === "pdf-to-img") {
        convertTabsPdfToImg.forEach(btn => btn.classList.add("active"));
        convertTabsImgToPdf.forEach(btn => btn.classList.remove("active"));
        if (convertPdfToImgWorkspace) convertPdfToImgWorkspace.classList.remove("hidden");
        if (convertImgToPdfWorkspace) convertImgToPdfWorkspace.classList.add("hidden");
    } else {
        convertTabsPdfToImg.forEach(btn => btn.classList.remove("active"));
        convertTabsImgToPdf.forEach(btn => btn.classList.add("active"));
        if (convertPdfToImgWorkspace) convertPdfToImgWorkspace.classList.add("hidden");
        if (convertImgToPdfWorkspace) convertImgToPdfWorkspace.classList.remove("hidden");
    }
}

function handleConvertPdfSelect(e) {
    if (e.target.files.length > 0) {
        uploadConvertPdfFile(e.target.files[0]);
    }
}

function handleConvertPdfDrop(e) {
    e.preventDefault();
    if (convertPdfDropZone) convertPdfDropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
        uploadConvertPdfFile(e.dataTransfer.files[0]);
    }
}

function uploadConvertPdfFile(file) {
    if (!file.name.endsWith(".pdf") && !file.name.endsWith(".PDF")) {
        alert("Please select a valid PDF file.");
        return;
    }
    
    showLoading(true, "Uploading PDF for format conversion...", 30);
    
    const formData = new FormData();
    formData.append("file", file);
    
    apiConvertUploadPdf(file)
    .then(data => {
        showLoading(false);
        initializeConvertPdfWorkspace(data);
    })
    .catch(err => {
        showLoading(false);
        alert("Upload failed: " + err.message);
        if (convertPdfFileInput) convertPdfFileInput.value = "";
    });
}

function initializeConvertPdfWorkspace(data) {
    State.convertSessionData.pdfSessionId = data.session_id;
    State.convertSessionData.pdfFilename = data.filename;
    State.convertSessionData.pdfTotalPages = data.total_pages;
    State.convertSessionData.pdfPages = data.pages;
    State.convertSessionData.pdfCurrentPage = 0;
    
    if (convertPdfFileNameDisplay) {
        convertPdfFileNameDisplay.innerText = data.filename;
        convertPdfFileNameDisplay.title = data.filename;
    }
    
    if (convertPdfUploadCard) convertPdfUploadCard.classList.add("hidden");
    if (convertPdfWorkspaceContainer) convertPdfWorkspaceContainer.classList.remove("hidden");
    
    renderConvertPdfPage();
    saveAllStates();
}

function renderConvertPdfPage() {
    if (!State.convertSessionData.pdfSessionId) return;
    
    const pageNum = State.convertSessionData.pdfCurrentPage;
    const page = State.convertSessionData.pdfPages[pageNum];
    
    if (convertPdfPreviewImage) convertPdfPreviewImage.src = page.image_url;
    if (convertPdfCurrentPageNum) convertPdfCurrentPageNum.innerText = pageNum + 1;
    if (convertPdfTotalPagesNum) convertPdfTotalPagesNum.innerText = State.convertSessionData.pdfTotalPages;
    
    if (convertPdfPreviewPageCard) {
        convertPdfPreviewPageCard.style.aspectRatio = `${page.width} / ${page.height}`;
    }
}

function handleConvertImgSelect(e) {
    if (e.target.files.length > 0) {
        uploadConvertImages(e.target.files);
    }
}

function handleConvertImgDrop(e) {
    e.preventDefault();
    if (convertImgDropZone) convertImgDropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
        uploadConvertImages(e.dataTransfer.files);
    }
}

function uploadConvertImages(files) {
    const validFiles = Array.from(files).filter(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        return ["png", "jpg", "jpeg", "webp"].includes(ext);
    });
    
    if (validFiles.length === 0) {
        alert("Please select valid image files (PNG, JPG/JPEG, or WEBP).");
        return;
    }
    
    showLoading(true, "Uploading image assets...", 30);
    
    const formData = new FormData();
    validFiles.forEach(file => {
        formData.append("files", file);
    });
    
    if (State.convertSessionData.imgSessionId) {
        formData.append("session_id", State.convertSessionData.imgSessionId);
    }
    
    apiConvertUploadImages(files, State.convertSessionData.imgSessionId)
    .then(data => {
        showLoading(false);
        State.convertSessionData.imgSessionId = data.session_id;
        State.convertSessionData.imgFiles = State.convertSessionData.imgFiles.concat(data.images);
        
        if (convertImgUploadCard) convertImgUploadCard.classList.add("hidden");
        if (convertImgWorkspaceContainer) convertImgWorkspaceContainer.classList.remove("hidden");
        
        renderConvertImageGrid();
        saveAllStates();
    })
    .catch(err => {
        showLoading(false);
        alert("Upload failed: " + err.message);
        if (convertImgFileInput) convertImgFileInput.value = "";
    });
}

function renderConvertImageGrid() {
    if (!convertImageGrid) return;
    convertImageGrid.innerHTML = "";
    
    const count = State.convertSessionData.imgFiles.length;
    if (convertImgCountDisplay) {
        convertImgCountDisplay.innerText = `${count} image${count !== 1 ? 's' : ''} uploaded`;
    }
    
    State.convertSessionData.imgFiles.forEach((file, idx) => {
        const card = document.createElement("div");
        card.className = "convert-image-card";
        
        const idxLabel = document.createElement("div");
        idxLabel.className = "convert-image-index";
        idxLabel.innerText = idx + 1;
        card.appendChild(idxLabel);
        
        const thumbContainer = document.createElement("div");
        thumbContainer.className = "convert-image-thumb-container";
        
        const img = document.createElement("img");
        img.className = "convert-image-thumb";
        img.src = file.thumbnail_url;
        img.alt = file.filename;
        thumbContainer.appendChild(img);
        card.appendChild(thumbContainer);
        
        const details = document.createElement("div");
        details.className = "convert-image-details";
        details.innerText = file.filename;
        card.appendChild(details);
        
        const overlay = document.createElement("div");
        overlay.className = "convert-image-overlay";
        
        if (idx > 0) {
            const leftBtn = document.createElement("button");
            leftBtn.className = "convert-overlay-btn move-btn";
            leftBtn.title = "Move Left";
            leftBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
            leftBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                shiftImageOrderLeft(idx);
            });
            overlay.appendChild(leftBtn);
        }
        
        const delBtn = document.createElement("button");
        delBtn.className = "convert-overlay-btn delete-btn";
        delBtn.title = "Remove";
        delBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        delBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            removeCompiledImage(idx);
        });
        overlay.appendChild(delBtn);
        
        if (idx < count - 1) {
            const rightBtn = document.createElement("button");
            rightBtn.className = "convert-overlay-btn move-btn";
            rightBtn.title = "Move Right";
            rightBtn.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
            rightBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                shiftImageOrderRight(idx);
            });
            overlay.appendChild(rightBtn);
        }
        
        card.appendChild(overlay);
        convertImageGrid.appendChild(card);
    });
}

function shiftImageOrderLeft(idx) {
    if (idx <= 0) return;
    const list = State.convertSessionData.imgFiles;
    const temp = list[idx - 1];
    list[idx - 1] = list[idx];
    list[idx] = temp;
    
    renderConvertImageGrid();
    saveAllStates();
}

function shiftImageOrderRight(idx) {
    const list = State.convertSessionData.imgFiles;
    if (idx >= list.length - 1) return;
    const temp = list[idx + 1];
    list[idx + 1] = list[idx];
    list[idx] = temp;
    
    renderConvertImageGrid();
    saveAllStates();
}

function removeCompiledImage(idx) {
    State.convertSessionData.imgFiles.splice(idx, 1);
    
    if (State.convertSessionData.imgFiles.length === 0) {
        closeConvertImgWorkspace();
    } else {
        renderConvertImageGrid();
        saveAllStates();
    }
}

function runPdfToImage() {
    if (!State.convertSessionData.pdfSessionId) return;
    
    showLoading(true, "Converting PDF pages into images...", 40);
    
    const payload = {
        session_id: State.convertSessionData.pdfSessionId,
        format: State.convertSessionData.pdfFormat,
        dpi: State.convertSessionData.pdfDpi,
        pages_mode: State.convertSessionData.pdfPagesMode,
        custom_pages: State.convertSessionData.pdfCustomPages
    };
    
    apiConvertPdfToImage(State.convertSessionData.pdfSessionId, {
        format: State.convertSessionData.pdfFormat,
        dpi: State.convertSessionData.pdfDpi,
        pages_mode: State.convertSessionData.pdfPagesMode,
        custom_pages: State.convertSessionData.pdfCustomPages
    })
    .then(data => {
        showLoading(false);
        const name = State.convertSessionData.pdfFilename.split('.').slice(0, -1).join('.');
        const ext = data.is_zip ? "zip" : State.convertSessionData.pdfFormat;
        triggerFileDownload(data.download_url, `converted_${name}.${ext}`);
        
        setTimeout(() => {
            alert("PDF pages converted successfully!");
            returnToDashboard();
        }, 1000);
    })
    .catch(error => {
        showLoading(false);
        alert("Conversion failed: " + error.message);
    });
}

function runImageToPdf() {
    if (!State.convertSessionData.imgSessionId || State.convertSessionData.imgFiles.length === 0) return;
    
    showLoading(true, "Compiling images into PDF document...", 40);
    
    const imageIds = State.convertSessionData.imgFiles.map(f => f.file_id);
    const payload = {
        session_id: State.convertSessionData.imgSessionId,
        images: imageIds,
        fit_mode: convertPdfFitMode.value,
        page_size: convertPageSize.value,
        orientation: convertPageOrientation.value
    };
    
    apiConvertImageToPdf(State.convertSessionData.imgSessionId, {
        images: imageIds,
        fit_mode: convertPdfFitMode.value,
        page_size: convertPageSize.value,
        orientation: convertPageOrientation.value
    })
    .then(data => {
        showLoading(false);
        triggerFileDownload(data.download_url, "compiled_images.pdf");
        
        setTimeout(() => {
            alert("Images compiled successfully! Downloaded PDF.");
            returnToDashboard();
        }, 1000);
    })
    .catch(error => {
        showLoading(false);
        alert("Compilation failed: " + error.message);
    });
}

function closeConvertPdfWorkspace() {
    if (State.convertSessionData.pdfSessionId) {
        cleanupSessionOnServer(State.convertSessionData.pdfSessionId);
    }
    
    State.convertSessionData.pdfSessionId = null;
    State.convertSessionData.pdfFilename = "";
    State.convertSessionData.pdfTotalPages = 0;
    State.convertSessionData.pdfPages = [];
    State.convertSessionData.pdfCurrentPage = 0;
    
    if (convertPdfFileInput) convertPdfFileInput.value = "";
    if (convertPdfPreviewImage) convertPdfPreviewImage.src = "";
    
    if (convertPdfWorkspaceContainer) convertPdfWorkspaceContainer.classList.add("hidden");
    if (convertPdfUploadCard) convertPdfUploadCard.classList.remove("hidden");
    
    saveAllStates();
}

function closeConvertImgWorkspace() {
    if (State.convertSessionData.imgSessionId) {
        cleanupSessionOnServer(State.convertSessionData.imgSessionId);
    }
    
    State.convertSessionData.imgSessionId = null;
    State.convertSessionData.imgFiles = [];
    
    if (convertImgFileInput) convertImgFileInput.value = "";
    if (convertImageGrid) convertImageGrid.innerHTML = "";
    
    if (convertImgWorkspaceContainer) convertImgWorkspaceContainer.classList.add("hidden");
    if (convertImgUploadCard) convertImgUploadCard.classList.remove("hidden");
    
    saveAllStates();
}

function closeConvertWorkspace() {
    if (State.convertSessionData.pdfSessionId) {
        cleanupSessionOnServer(State.convertSessionData.pdfSessionId);
    }
    if (State.convertSessionData.imgSessionId) {
        cleanupSessionOnServer(State.convertSessionData.imgSessionId);
    }
    
    State.convertSessionData = {
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
    };
    
    if (convertPdfFileInput) convertPdfFileInput.value = "";
    if (convertImgFileInput) convertImgFileInput.value = "";
    if (convertPdfPreviewImage) convertPdfPreviewImage.src = "";
    if (convertImageGrid) convertImageGrid.innerHTML = "";
    
    if (convertPdfWorkspaceContainer) convertPdfWorkspaceContainer.classList.add("hidden");
    if (convertPdfUploadCard) convertPdfUploadCard.classList.remove("hidden");
    if (convertImgWorkspaceContainer) convertImgWorkspaceContainer.classList.add("hidden");
    if (convertImgUploadCard) convertImgUploadCard.classList.remove("hidden");
    
    saveAllStates();
}



// Expose callback handlers to window for canvas.js imports
window.toggleFindingRedaction = toggleFindingRedaction;
window.updateRedactionCount = updateRedactionCount;
