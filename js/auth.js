/**
 * Attempts login by sending credentials to Google Sheets
 */
function attemptLogin() {
    const user = document.getElementById('userField').value;
    const pass = document.getElementById('passField').value;
    const btn = document.getElementById('loginBtn');

    btn.disabled = true;
    btn.innerText = "Authenticating...";

    const loginData = {
        action: 'login',
        username: user,
        password: pass
    };

    // Send to Google (Response handled by handleResponse in scanner.js)
    if (typeof sendToGoogle === "function") {
        sendToGoogle(loginData);
    }
}

/**
 * Specifically handles the result of a login attempt
 * Called by handleResponse in scanner.js
 */
function loginResponse(res) {
    const btn = document.getElementById('loginBtn');
    
    if (res.status === "AUTH_SUCCESS") {
        // Save session locally
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('operatorName', res.operatorName);
        
        // Populate the app
        document.getElementById('operator').value = res.operatorName;
        document.getElementById('welcomeUser').innerText = `Logged in as: ${res.operatorName}`;
        
        // Load locations into select dropdown
        populateLocations(res.locations);
        
        // Switch views
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('scannerPage').classList.remove('hidden');
        
        // Start camera
        if (typeof startScanner === "function") {
            startScanner();
        }
    } else {
        alert("Login Failed: " + (res.message || "Invalid credentials"));
        btn.disabled = false;
        btn.innerText = "Sign In";
    }
}

/**
 * Populates the dropdown and sets the default location
 */
function populateLocations(locations) {
    const select = document.getElementById('location');
    select.innerHTML = ''; // Clear existing
    
    locations.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc;
        opt.textContent = `📍 ${loc}`;
        select.appendChild(opt);
    });

    updateLocationDisplay();
}

/**
 * Updates the H2 header when location changes
 */
function updateLocationDisplay() {
    const select = document.getElementById('location');
    const header = document.getElementById('displayLocation');
    if (select.value) {
        header.innerText = select.value;
    }
}

/**
 * Clears local storage and reloads the page
 */
function logout() {
    if (confirm("Are you sure you want to logout? Any unsynced scans may be lost.")) {
        localStorage.clear();
        location.reload();
    }
}

// Auto-check session on page load
window.onload = () => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        // You would typically re-verify with the server here, 
        // but for speed, we can restore the UI state.
        const savedName = localStorage.getItem('operatorName');
        document.getElementById('operator').value = savedName;
        document.getElementById('welcomeUser').innerText = `Logged in as: ${savedName}`;
        
        // Note: You may need a 'refresh' action to get the location list again
        // Or store the locations list in localStorage as well.
    }
};