let html5QrcodeScanner;
let totalScans = 0;
let isSyncing = false;

/**
 * Helper: Formats date to YYYY-MM-DD HH:mm:ss.SSS
 */
function getFormattedTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
}

// Check sync status on initial load
window.addEventListener('load', () => {
    updateSyncIndicator();
});

function startScanner() { 
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("reader", {
            fps: 20,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
        });
    }
    html5QrcodeScanner.render(onScanSuccess);
    
    setTimeout(() => {
        const readerElement = document.getElementById('reader');
        if (readerElement) readerElement.style.border = "";
    }, 100);
}

function onScanSuccess(decodedText) {
    const locValue = document.getElementById('location').value;
    const opValue = document.getElementById('operator').value;
    const fullTimestamp = getFormattedTimestamp();
    const displayTime = fullTimestamp.split(' ')[1].split('.')[0]; 

    // Instant UI Feedback
    totalScans++;
    const scanCountEl = document.getElementById('scanCount');
    if (scanCountEl) scanCountEl.innerText = totalScans;
    
    updateHistoryUI(displayTime);
    
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.innerText = "✅ SAVED LOCALLY";
        statusDiv.className = "success-bg";
    }

    // Save to Queue
    const scanEntry = {
        action: 'scan',
        qrContent: decodedText,
        location: locValue,
        operator: opValue,
        timestamp: fullTimestamp,
        id: Date.now() 
    };
    
    let queue = JSON.parse(localStorage.getItem('scanQueue') || '[]');
    queue.push(scanEntry);
    localStorage.setItem('scanQueue', JSON.stringify(queue));

    updateSyncIndicator();

    // Reset and Sync
    html5QrcodeScanner.clear();
    setTimeout(() => {
        resetScanner();
        processSyncQueue();
    }, 1000);
}

async function processSyncQueue() {
    if (isSyncing) return;
    
    let queue = JSON.parse(localStorage.getItem('scanQueue') || '[]');
    if (queue.length === 0) return;

    isSyncing = true;
    const nextItem = queue[0];
    
    if (typeof sendToGoogle === "function") {
        sendToGoogle(nextItem);
        
        // Safety timeout: If no response in 10s, release lock to allow retry
        setTimeout(() => { isSyncing = false; }, 10000);
    } else {
        isSyncing = false;
    }
}

function handleResponse(res) {
    // Release the sync lock immediately on any response
    isSyncing = false;

    if (res.status === "AUTH_SUCCESS" || res.status === "AUTH_FAIL") {
        if (typeof loginResponse === "function") loginResponse(res);
        return;
    }

    if (res.status === "SUCCESS" || res.status === "ALREADY_SCANNED") {
        let queue = JSON.parse(localStorage.getItem('scanQueue') || '[]');
        queue.shift();
        localStorage.setItem('scanQueue', JSON.stringify(queue));
        
        updateSyncIndicator();

        if (queue.length > 0) {
            setTimeout(processSyncQueue, 500);
        }
    } else {
        updateSyncIndicator(); 
    }
}

function updateHistoryUI(timeStr) {
    const scanList = document.getElementById('scanList');
    if (!scanList) return;

    if (totalScans === 1) scanList.innerHTML = ''; 
    const newItem = `<li><span>${timeStr}</span> Scan Recorded</li>`;
    scanList.insertAdjacentHTML('afterbegin', newItem);
    while (scanList.children.length > 5) scanList.removeChild(scanList.lastElementChild);
}

function resetScanner() {
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.innerText = "Ready to scan...";
        statusDiv.className = "";
    }
    startScanner();
}

function updateSyncIndicator() {
    const queue = JSON.parse(localStorage.getItem('scanQueue') || '[]');
    const statusDiv = document.getElementById('syncStatus');
    const syncText = document.getElementById('syncText');
    const syncIcon = document.getElementById('syncIcon');

    // Prevent errors if UI elements aren't loaded yet
    if (!statusDiv || !syncText || !syncIcon) return;

    if (queue.length === 0) {
        statusDiv.className = "sync-indicator sync-synced";
        syncText.innerText = "Fully Synced";
        syncIcon.innerText = "✓";
    } else {
        statusDiv.className = "sync-indicator sync-pending";
        syncText.innerText = `${queue.length} Pending`;
        syncIcon.innerText = "●";
    }
}