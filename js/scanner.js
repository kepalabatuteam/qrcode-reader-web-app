let html5QrcodeScanner;
let totalScans = 0;

function startScanner() {
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("reader", {
            fps: 20,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true // Optional: adds a flashlight button
        });
    }

    html5QrcodeScanner.render(onScanSuccess);

    // Force internal elements to respect CSS after a tiny delay
    setTimeout(() => {
        const readerElement = document.getElementById('reader');
        if (readerElement) {
            readerElement.style.border = ""; // Removes the library's default inline border
        }
    }, 100);
}

function onScanSuccess(decodedText) {
    const statusDiv = document.getElementById('status');
    // Pull values from the UI elements populated during login
    const locValue = document.getElementById('location').value;
    const opValue = document.getElementById('operator').value;

    statusDiv.innerText = "⏳ PROCESSING...";
    statusDiv.className = "";

    // Stop scanner to prevent multiple scans of the same code
    html5QrcodeScanner.clear();

    // Safety check: ensure we have a valid location before sending to Google
    if (!locValue || locValue === "undefined" || locValue === "") {
        statusDiv.innerText = "❌ ERROR: NO LOCATION DETECTED";
        statusDiv.classList.add('error-bg');
        setTimeout(resetScanner, 2000);
        return;
    }

    sendToGoogle({
        action: 'scan',
        qrContent: decodedText,
        location: locValue,
        operator: opValue
    });
}

function handleResponse(res) {
    const statusDiv = document.getElementById('status');
    const scanList = document.getElementById('scanList');

    // Cleanup JSONP script tags
    const scripts = document.querySelectorAll('script[src*="callback=handleResponse"]');
    scripts.forEach(s => s.remove());

    // Redirect to auth logic if the response is login-related
    if (res.status === "AUTH_SUCCESS" || res.status === "AUTH_FAIL") {
        loginResponse(res);
        return;
    }

    if (res.status === "ALREADY_SCANNED") {
        statusDiv.innerText = "🛑 DUPLICATE REJECTED";
        statusDiv.classList.add('error-bg');
        setTimeout(resetScanner, 2000);
    } else if (res.status === "SUCCESS") {
        statusDiv.innerText = "✅ SAVED";
        statusDiv.classList.add('success-bg');

        // Update Session Counter
        totalScans++;
        document.getElementById('scanCount').innerText = totalScans;

        // Update Visual History Log
        updateHistoryUI();

        setTimeout(resetScanner, 800);
    } else {
        statusDiv.innerText = "❌ SERVER ERROR";
        statusDiv.classList.add('error-bg');
        setTimeout(resetScanner, 2000);
    }
}

function updateHistoryUI() {
    const scanList = document.getElementById('scanList');
    
    // 1. If this is the first scan of the session, clear the "No scans yet" message
    if (totalScans === 1) {
        scanList.innerHTML = ''; 
    }
    
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ":" + 
                    now.getMinutes().toString().padStart(2, '0') + ":" + 
                    now.getSeconds().toString().padStart(2, '0');
    
    // 2. Create the new list item with the span for the CSS color highlight
    const newItem = `<li><span>${timeStr}</span> Scan Recorded Successfully</li>`;
    
    // 3. Add the new scan to the top of the list
    scanList.insertAdjacentHTML('afterbegin', newItem);
    
    // 4. LIMIT FEATURE: If there are more than 5 logs, remove the oldest one (the last child)
    while (scanList.children.length > 5) {
        scanList.removeChild(scanList.lastElementChild);
    }
}

function resetScanner() {
    const statusDiv = document.getElementById('status');
    statusDiv.innerText = "Ready to scan...";
    statusDiv.className = "";
    startScanner();
}