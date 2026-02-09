const rowsElement = document.getElementById('deviceRows');
const errorElement = document.getElementById('error');
const lastRefreshElement = document.getElementById('lastRefresh');
const logoutBtn = document.getElementById('logoutBtn');

function getApiBase() {
    const el = document.querySelector('meta[name="api-base"]');
    if (!el || !el.content) throw new Error('Missing <meta name="api-base">');
    return new URL(el.content);
}

logoutBtn.addEventListener('click', async () => {
    try {
        const apiBase = getApiBase();
        const url = new URL('/api/auth/logout', apiBase);

        const res = await fetch(url,{
            method: 'POST',
            credentials: 'include'
        });

        if (res.ok) {
            window.location.href = '/login';
        }
    } catch (e) {
        console.error('Logout failed', e);
    }
});

function escapeHtml(s) {
    return String(s)
        .replaceAll(/&/g, '&amp;')
        .replaceAll(/</g, '&lt;')
        .replaceAll(/>/g, '&gt;')
        .replaceAll(/"/g, '&quot;')
        .replaceAll(/'/g, '&#039;');
}

function fmtAge(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return "-";
    }

    if (seconds < 60) {
        return `${seconds}s`;
    }

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

function render(devices) {
    const now = Date.now();

    rowsElement.innerHTML = devices.map(d => {
        const ts = d.timestampUtc ?? d.timestampUTC ?? d.timestamp ?? null;
        const t= ts ? Date.parse(ts) : NaN;
        const ageSeconds = Number.isFinite(t) ? Math.floor((now - t) / 1000) : NaN;

        const isOn = !!d.ledOn;
        const stateText = isOn ? "ON" : "OFF";
        const badgeClass = isOn ? "on" : "off";

        return `
            <tr>
                <td>${escapeHtml(d.deviceId)}</td>
                <td><span class="badge ${badgeClass}">${stateText}</span></td>
                <td>${escapeHtml(ts ?? ".")}</td>
                <td>${fmtAge(ageSeconds)}</td>
            </tr>
        `;
    }).join("");
}

async function refresh() {
    try {
        errorElement.textContent = "";

        const apiBase = getApiBase();
        const url = new URL('/api/readings/status-per-device', apiBase);

        const res = await fetch(url, {
            cache: "no-store",
            credentials: 'include'
        });

        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const devices = await res.json();
        render(devices);

        lastRefreshElement.textContent = `Last refresh: ${new Date().toISOString()}`;
    } catch (e) {
        errorElement.textContent = `Failed to load: ${e.message}`;
    }
}

refresh();
setInterval(refresh, 2000);