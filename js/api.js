const scriptURL = 'https://script.google.com/macros/s/AKfycbykzbNnK6bTAbZWKyqm5meLFGJWNL8dXzlcmCI5pbsHv_cTM1xtbkG6NrX9OH4wXhDp/exec';

function sendToGoogle(params) {
    return new Promise((resolve) => {
        const callbackName = 'handleResponse';
        const script = document.createElement('script');
        
        // Build query string
        let queryString = `?callback=${callbackName}`;
        for (const key in params) {
            queryString += `&${key}=${encodeURIComponent(params[key])}`;
        }
        
        script.src = scriptURL + queryString;
        
        // Handle network errors
        script.onerror = () => {
            document.getElementById('status').innerText = "❌ CONNECTION ERROR";
            setTimeout(resetScanner, 2000);
        };

        document.body.appendChild(script);
    });
}