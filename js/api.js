/**
 * Sends data to the Google Apps Script Web App
 * @param {Object} data - The payload to send
 */
function sendToGoogle(data) {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbwe_xiAkxfLdTgLCtEZCzwam_3fNoEun54gAvzeR-NXIkwErMP9AknSA1a0G2GrQIZo/exec";
    // ADD THIS LINE to ensure the GAS knows which function to call
    data.callback = "handleResponse"; 

    const params = new URLSearchParams(data).toString();
    const finalUrl = `${scriptUrl}?${params}`;

    const script = document.createElement('script');
    script.src = finalUrl;
    document.body.appendChild(script);
    script.onload = () => document.body.removeChild(script);
}