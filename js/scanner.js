let html5QrcodeScanner;
let totalScans = 0;

function startScanner() {
    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5QrcodeScanner("reader", {
            fps: 20,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        });
    }
    html5QrcodeScanner.render(onScanSuccess);
}

function onScanSuccess(decodedText) {
    const statusDiv = document.getElementById('status');
    const locValue = document.getElementById('location').value;
    const opValue = document.getElementById('operator').value;

    statusDiv.innerText = "⏳ PROCESSING...";
    statusDiv.className = "";

    html5QrcodeScanner.clear();

    // Verification: If location is still undefined, stop the scan
    if (!locValue || locValue === "undefined") {
        statusDiv.innerText = "❌ Error: No Location Assigned";
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

// This handles the response from the 'scan' action
function handleResponse(res) {
    const statusDiv = document.getElementById('status');
    const scanList = document.getElementById('scanList');

    const scripts = document.querySelectorAll('script[src*="callback=handleResponse"]');
    scripts.forEach(s => s.remove());

    if (res.status === "AUTH_SUCCESS" || res.status === "AUTH_FAIL") {
        loginResponse(res);
        return;
    }

    if (res.status === "ALREADY_SCANNED") {
        statusDiv.innerText = "🛑 DUPLICATE REJECTED";
        statusDiv.classList.add('error-bg');
        setTimeout(resetScanner, 1000);
    } else if (res.status === "SUCCESS") {
        statusDiv.innerText = "✅ SAVED";
        statusDiv.classList.add('success-bg');

        // Update Counter
        totalScans++;
        document.getElementById('scanCount').innerText = totalScans;

        // Update History List (Show last 3 scans)
        if (totalScans === 1) scanList.innerHTML = ''; // Clear "No scans yet" message
        const now = new Date();
        const timeStr = now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0');
        const newItem = `<li style="padding: 5px 0; border-bottom: 1px solid #f1f5f9;">
                            <b>${timeStr}</b> - Saved successfully
                         </li>`;
        scanList.insertAdjacentHTML('afterbegin', newItem);

        // Keep only the last 3 for speed and screen space
        if (scanList.children.length > 3) scanList.lastElementChild.remove();

        setTimeout(resetScanner, 800);
    }
}

function resetScanner() {
    const statusDiv = document.getElementById('status');
    statusDiv.innerText = "Ready to scan...";
    statusDiv.className = "";
    startScanner();
}