const registerForm = document.getElementById('registerForm');
const errorMessage = document.getElementById('errorMessage');

function getApiBase() {
    const el = document.querySelector('meta[name="api-base"]');
    if (!el || !el.content) throw new Error('Missing <meta name="api-base">');
    return new URL(el.content);
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match.';
        errorMessage.style.display = 'block';
        return;
    }

    try {
        const apiBase = getApiBase();
        const url = new URL('/api/auth/register', apiBase);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            window.location.href = '/dashboard';
        } else {
            const data = await response.json();
            if (data.errors && Array.isArray(data.errors)) {
                errorMessage.textContent = data.errors.join(' ');
            } else {
                errorMessage.textContent = data.message || 'Registration failed.';
            }
            errorMessage.style.display = 'block';
        }
    } catch (err) {
        errorMessage.textContent = 'An error occurred. Please try again later.';
        errorMessage.style.display = 'block';
    }
});
