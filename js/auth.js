let idleTimer;
const IDLE_TIME = 30 * 60 * 1000; // 30 Minutes

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

function loginResponse(res) {
    const btn = document.getElementById('loginBtn');

    if (res.status === "AUTH_SUCCESS") {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('scannerPage').classList.remove('hidden');

        const fullName = res.operatorFullName || "Unknown Operator";
        const assignedLoc = res.location || "Unknown Location";

        // Store data
        document.getElementById('operator').value = fullName;
        document.getElementById('location').value = assignedLoc;

        // Update UI
        document.getElementById('displayLocation').innerText = "📍 " + assignedLoc;
        document.getElementById('welcomeUser').innerText = "Logged in as: " + fullName; // New Line

        startScanner();
        resetIdleTimer();
    } else {
        alert("Invalid Username or Password");
        btn.innerText = "Sign In";
        btn.disabled = false;
        btn.style.opacity = "1";
    }
}

function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(logout, IDLE_TIME);
}

function logout() {
    sessionStorage.clear();
    location.reload();
}

// Global activity listener
['mousedown', 'touchstart', 'keypress'].forEach(evt =>
    document.addEventListener(evt, resetIdleTimer, true)
);