let idleTimer;
// const IDLE_TIME = 30 * 60 * 1000; // 30 Minutes

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

    // Animation/Information logic
    btn.innerText = "⏳ Verifying...";
    btn.disabled = true;
    btn.style.opacity = "0.7";

    const hash = await hashPassword(pass);
    sendToGoogle({ action: 'login', username: user, passwordHash: hash });
}

window.onload = () => {
    const savedUser = localStorage.getItem('isLoggedIn');
    const savedFullName = localStorage.getItem('operatorFullName');
    const savedLoc = localStorage.getItem('assignedLocation');

    // If data exists in LocalStorage, skip login
    if (savedUser === 'true' && savedFullName && savedLoc) {
        showScanner(savedFullName, savedLoc);
    }
    resetIdleTimer();
};

function loginResponse(res) {
    const btn = document.getElementById('loginBtn');
    
    if (res.status === "AUTH_SUCCESS") {
        const fullName = res.operatorFullName || "Unknown Operator";
        const assignedLoc = res.location || "Unknown Location";

        // SAVE TO LOCAL STORAGE (This survives the reload)
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('operatorFullName', fullName);
        localStorage.setItem('assignedLocation', assignedLoc);

        showScanner(fullName, assignedLoc);
    } else {
        alert("Invalid Username or Password");
        btn.innerText = "Sign In";
        btn.disabled = false;
        btn.style.opacity = "1";
    }
}

function showScanner(fullName, location) {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('scannerPage').classList.remove('hidden');
    
    document.getElementById('operator').value = fullName; 
    document.getElementById('location').value = location;
    
    document.getElementById('displayLocation').innerText = "📍 " + location;
    document.getElementById('welcomeUser').innerText = "Logged in as: " + fullName;
    
    startScanner();
}

function resetIdleTimer() {
    clearTimeout(idleTimer);
    // Ensure logout happens if idle for 30 mins
    idleTimer = setTimeout(() => {
        alert("Session expired due to inactivity.");
        logout(); 
    }, 30 * 60 * 1000); 
}

function logout() {
    localStorage.clear();
    location.reload();
}

// Global activity listener
['mousedown', 'touchstart', 'keypress'].forEach(evt =>
    document.addEventListener(evt, resetIdleTimer, true)
);