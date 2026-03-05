let idleTimer;

async function hashPassword(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function attemptLogin() {
    const user = document.getElementById('userField').value;
    const pass = document.getElementById('passField').value;
    const btn = document.getElementById('loginBtn');

    if (!user || !pass) return alert("Please fill all fields");

    btn.innerText = "⏳ Verifying...";
    btn.disabled = true;
    btn.style.opacity = "0.7";

    const hash = await hashPassword(pass);
    sendToGoogle({ action: 'login', username: user, passwordHash: hash });
}

// Helper to reset button if login fails
function resetLoginButton() {
    const btn = document.getElementById('loginBtn');
    btn.innerText = "Sign In";
    btn.disabled = false;
    btn.style.opacity = "1";
}

window.onload = () => {
    const savedUser = localStorage.getItem('isLoggedIn');
    const savedFullName = localStorage.getItem('operatorFullName');
    const savedLocs = JSON.parse(localStorage.getItem('assignedLocations'));
    const lastActive = localStorage.getItem('currentActiveLocation');

    if (savedUser === 'true' && savedFullName && savedLocs) {
        setupScannerUI(savedFullName, savedLocs, lastActive);
    }
    resetIdleTimer(); // Start timer on load
};

function loginResponse(res) {
    if (res.status === "AUTH_SUCCESS") {
        const fullName = res.operatorFullName;
        const locations = res.locations; 

        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('operatorFullName', fullName);
        localStorage.setItem('assignedLocations', JSON.stringify(locations));

        setupScannerUI(fullName, locations);
    } else {
        alert("Invalid Login Credentials");
        resetLoginButton();
    }
}

function setupScannerUI(fullName, locations, savedLoc = null) {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('scannerPage').classList.remove('hidden');
    
    document.getElementById('operator').value = fullName;
    document.getElementById('welcomeUser').innerText = "Logged in as: " + fullName;

    const locSelect = document.getElementById('location');
    const locContainer = document.getElementById('locationContainer');
    locSelect.innerHTML = ''; 

    locations.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc;
        opt.innerText = "📍 " + loc;
        locSelect.appendChild(opt);
    });

    // LOGIC FIX: Hide the container entirely if only 1 location exists
    if (locations.length <= 1) {
        locSelect.value = locations[0];
        locContainer.classList.add('hidden'); // This hides the label and the box
    } else {
        locContainer.classList.remove('hidden');
        locSelect.disabled = false;
        if (savedLoc && locations.includes(savedLoc)) {
            locSelect.value = savedLoc;
        }
    }

    // Wrap in a small timeout to ensure DOM is ready
    setTimeout(() => {
        updateLocationDisplay();
        if (typeof startScanner === "function") startScanner();
    }, 50);
}

function updateLocationDisplay() {
    const locSelect = document.getElementById('location');
    const display = document.getElementById('displayLocation');
    
    if (locSelect && locSelect.value) {
        display.innerText = locSelect.value;
        localStorage.setItem('currentActiveLocation', locSelect.value);
    }
}

function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        alert("Session expired due to inactivity.");
        logout(); 
    }, 30 * 60 * 1000); 
}

function logout() {
    localStorage.clear();
    location.reload();
}

['mousedown', 'touchstart', 'keypress'].forEach(evt =>
    document.addEventListener(evt, resetIdleTimer, true)
);