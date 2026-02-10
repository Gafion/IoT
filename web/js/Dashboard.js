document.addEventListener('DOMContentLoaded', () => {
const gridElement = document.getElementById('deviceGrid');
const rowsElement = document.getElementById('deviceRows');
const errorElement = document.getElementById('error');
const lastRefreshElement = document.getElementById('lastRefresh');
const logoutBtn = document.getElementById('logoutBtn');

const MOCK_DEVICES = [
    { deviceId: "Living Room Lamp", ledOn: true, timestampUtc: new Date(Date.now() - 135000).toISOString() },
    { deviceId: "Kitchen Fan", ledOn: false, timestampUtc: new Date(Date.now() - 435000).toISOString() },
    { deviceId: "Bedroom Heater", ledOn: true, timestampUtc: new Date(Date.now() - 1035000).toISOString() }
];

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
      try {
          const res = await fetch('/api/auth/logout', { method: 'POST' });
          if (res.ok) {
              window.location.href = '/login';
          }
      } catch (e) {
          console.error('Logout failed', e);
      }
  });
}

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

function fmtTimestamp(ts) {
    const t = ts ? Date.parse(ts) : NaN;
    if (!Number.isFinite(t)) return "-";

    const d = new Date(t);

    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");

    const dd = String(d.getDate()).padStart(2, "0");
    const mon = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();

    return `${hh}:${mm}:${ss} ${dd}/${mon}/${yyyy}`;
}

function renderCards(devices) {
    const now = Date.now();
    if (!gridElement) return;
    gridElement.innerHTML = devices.map(d => {
        const ts = d.timestampUtc ?? d.timestampUTC ?? d.timestamp ?? null;
        const t = ts ? Date.parse(ts) : NaN;
        const ageSeconds = Number.isFinite(t) ? Math.floor((now - t) / 1000) : NaN;

        const isOn = !!d.ledOn;
        const stateText = isOn ? "ON" : "OFF";
        const badgeClass = isOn ? "on" : "off";

        return `
            <div class="device-card" onclick="window.location.href='/history?deviceId=${encodeURIComponent(d.deviceId)}'">
                <div class="device-image">
                    <div class="placeholder-img"></div>
                </div>
                <div class="device-info">
                    <div class="device-name">${escapeHtml(d.deviceId)}</div>
                    <div class="device-state">
                        <span class="badge ${badgeClass}">${stateText}</span>
                    </div>
                    <div class="device-timestamp">${escapeHtml(fmtTimestamp(ts))}</div>
                    <div class="device-age">${fmtAge(ageSeconds)}</div>
                </div>
            </div>
        `;
    }).join("");
}

function renderTable(devices) {
    const now = Date.now();
    if (!rowsElement) return;
    rowsElement.innerHTML = devices.map(d => {
        const ts = d.timestampUtc ?? d.timestampUTC ?? d.timestamp ?? null;
        const t = ts ? Date.parse(ts) : NaN;
        const ageSeconds = Number.isFinite(t) ? Math.floor((now - t) / 1000) : NaN;

        const isOn = !!d.ledOn;
        const stateText = isOn ? "ON" : "OFF";
        const badgeClass = isOn ? "on" : "off";

        return `
            <tr onclick="window.location.href='/history?deviceId=${encodeURIComponent(d.deviceId)}'" style="cursor: pointer;">
                <td>${escapeHtml(d.deviceId)}</td>
                <td><span class="badge ${badgeClass}">${stateText}</span></td>
                <td>${escapeHtml(fmtTimestamp(ts))}</td>
                <td>${fmtAge(ageSeconds)}</td>
            </tr>
        `;
    }).join("");
}

function render(devices) {
    if (gridElement) return renderCards(devices);
    if (rowsElement) return renderTable(devices);
    if (errorElement) errorElement.textContent = "UI not found: neither #deviceGrid nor #deviceRows exists.";
}

async function refresh() {
    try {
        if (errorElement) errorElement.textContent = "";
        const res = await fetch("/api/readings/status-per-device", { cache: "no-store" });
        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const devices = await res.json();
        
        if (!devices || devices.length === 0) {
            render(MOCK_DEVICES);
            if (errorElement) errorElement.textContent = "No live data available. Showing placeholders.";
        } else {
            render(devices);
        }

        if (lastRefreshElement) lastRefreshElement.textContent = `Last refresh: ${fmtTimestamp(new Date().toISOString())}`;
    } catch (e) {
        console.warn('API fetch failed, using mock data', e);
        if (errorElement) errorElement.textContent = `Offline: ${e.message}. Showing placeholders.`;
        render(MOCK_DEVICES);
        if (lastRefreshElement) lastRefreshElement.textContent = `Last refresh: ${fmtTimestamp(new Date().toISOString())} (Mock)`;
    }
}

refresh();
setInterval(refresh, 2000);
});