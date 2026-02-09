const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

function getApiBase() {
    const el = document.getElementById('meta[name="api-base"]');
    if (!el || !el.content) {
        throw new Error('Missing <meta name="api-base">');
    }
    return new URL(el.content);
}
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    try {
        const apiBase = getApiBase();
        const url = new URL('/api/auth/login', apiBase);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password, rememberMe })
        });

        if (response.ok) {
            window.location.href = '/dashboard';
        } else {
            const data = await response.json();
            errorMessage.textContent = data.message || 'Login failed. Please try again.';
            errorMessage.style.display = 'block';
        }
    } catch (err) {
        errorMessage.textContent = 'An error occurred. Please try again later.';
        errorMessage.style.display = 'block';
    }
});
