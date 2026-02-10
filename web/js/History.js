document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('deviceId');
    const deviceNameElement = document.getElementById('deviceName');
    const historyRows = document.getElementById('historyRows');
    const historyStatus = document.getElementById('historyStatus');
    const logoutBtn = document.getElementById('logoutBtn');

    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    const timeFilter = document.getElementById('timeFilter');
    const stateFilter = document.getElementById('stateFilter');

    let allData = [];
    let chart = null;

    if (!deviceId) {
        deviceNameElement.textContent = "Device Not Found";
        historyStatus.textContent = "Error: No device ID provided.";
        return;
    }

    deviceNameElement.textContent = deviceId;

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/auth/logout', { method: 'POST' });
                if (res.ok) window.location.href = '/login';
            } catch (e) {
                console.error('Logout failed', e);
            }
        });
    }

    function fmtTime(ts) {
        const d = new Date(ts);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        const ss = String(d.getSeconds()).padStart(2, "0");
        return `${hh}:${mm}:${ss}`;
    }

    function fmtDate(ts) {
        const d = new Date(ts);
        const dd = String(d.getDate()).padStart(2, "0");
        const mon = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        return `${dd}/${mon}/${yyyy}`;
    }

    function updateChart(data) {
        const ctx = document.getElementById('historyChart').getContext('2d');
        
        // Prepare data for Chart.js
        // We want to show the state changes. 
        // We sort by timestamp ascending for the chart.
        const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        const labels = sortedData.map(d => fmtTime(d.timestamp));
        const values = sortedData.map(d => d.ledOn ? 1 : 0);

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Device State (1=ON, 0=OFF)',
                    data: values,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    stepped: true,
                    fill: true,
                    tension: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1.2,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => value === 1 ? 'ON' : (value === 0 ? 'OFF' : '')
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    function renderTable(data) {
        if (data.length === 0) {
            historyRows.innerHTML = '<tr><td colspan="4" style="text-align:center;">No matching records found.</td></tr>';
            return;
        }

        historyRows.innerHTML = data.map(d => {
            const isOn = !!d.ledOn;
            const stateText = isOn ? "ON" : "OFF";
            const badgeClass = isOn ? "on" : "off";
            const actionText = isOn ? "Device switched ON" : "Device switched OFF";

            return `
                <tr>
                    <td>${fmtTime(d.timestamp)}</td>
                    <td>${fmtDate(d.timestamp)}</td>
                    <td><span class="badge ${badgeClass}">${stateText}</span></td>
                    <td>${actionText}</td>
                </tr>
            `;
        }).join('');
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedDate = dateFilter.value; // YYYY-MM-DD
        const selectedTime = timeFilter.value; // HH:MM:SS or HH:MM
        const selectedState = stateFilter.value;

        const filtered = allData.filter(d => {
            const isOn = !!d.ledOn;
            const stateText = isOn ? "on" : "off";
            const actionText = (isOn ? "Device switched ON" : "Device switched OFF").toLowerCase();
            
            const dateObj = new Date(d.timestamp);
            const dateStr = dateObj.toISOString().split('T')[0];
            const timeStr = fmtTime(d.timestamp); // HH:MM:SS

            const matchesSearch = actionText.includes(searchTerm) || stateText.includes(searchTerm) || timeStr.includes(searchTerm);
            const matchesDate = !selectedDate || dateStr === selectedDate;
            const matchesTime = !selectedTime || timeStr.startsWith(selectedTime);
            const matchesState = selectedState === 'all' || stateText === selectedState;

            return matchesSearch && matchesDate && matchesTime && matchesState;
        });

        renderTable(filtered);
    }

    [searchInput, dateFilter, timeFilter, stateFilter].forEach(el => {
        el.addEventListener('input', applyFilters);
    });

    async function fetchData() {
        try {
            historyStatus.textContent = "Fetching data...";
            const res = await fetch(`/api/readings/history/${encodeURIComponent(deviceId)}?limit=50`);
            
            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            allData = await res.json();
            
            if (allData.length === 0) {
                // Use mock data if empty
                allData = generateMockData(deviceId);
                historyStatus.textContent = "No live data. Showing mock history.";
            } else {
                historyStatus.textContent = `Showing latest ${allData.length} actions.`;
            }

            updateChart(allData);
            renderTable(allData);

        } catch (e) {
            console.warn('Failed to fetch history, using mock data', e);
            allData = generateMockData(deviceId);
            historyStatus.textContent = "Offline. Showing mock history.";
            updateChart(allData);
            renderTable(allData);
        }
    }

    function generateMockData(id) {
        const mock = [];
        const now = Date.now();
        for (let i = 0; i < 50; i++) {
            mock.push({
                deviceId: id,
                ledOn: Math.random() > 0.5,
                timestamp: new Date(now - i * 1000 * 60 * 15).toISOString() // Every 15 mins
            });
        }
        return mock;
    }

    fetchData();
});
