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
    if (totalScans === 1) scanList.innerHTML = ''; // Clear "No scans yet" text

    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ":" +
        now.getMinutes().toString().padStart(2, '0') + ":" +
        now.getSeconds().toString().padStart(2, '0');

    const newItem = `<li style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; animation: fadeIn 0.5s;">
                        <span style="color: #2563eb; font-weight: bold;">${timeStr}</span> - Scan Recorded
                     </li>`;

    scanList.insertAdjacentHTML('afterbegin', newItem);

    // Keep only the last 3 entries to keep UI clean
    if (scanList.children.length > 3) {
        scanList.lastElementChild.remove();
    }
}

function resetScanner() {
    const statusDiv = document.getElementById('status');
    statusDiv.innerText = "Ready to scan...";
    statusDiv.className = "";
    startScanner();
}