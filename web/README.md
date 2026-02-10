# Web (Static HTML/CSS/JS)

Static frontend for the dashboard, history, and auth pages. These files are automatically copied into the backend `wwwroot/` during build/publish and are then served by the ASP.NET Core app.

## Structure
- `html/Dashboard.html` — Main dashboard (requires auth)
- `html/History.html` — Device history view with filters and a chart (requires auth)
- `html/Login.html`, `html/Register.html` — Auth pages
- `css/*` — Styling, including dark mode and shared variables
- `js/*` — Page logic (Theme, Login, Register, Dashboard, History)

Notes:
- `History.html` uses Chart.js via CDN.
- The backend maps `/dashboard`, `/login`, `/register`, and `/history` to these HTML files under `wwwroot/html`.

## Development
Edit files here and run the backend. The `IoTApi.csproj` contains an `ItemGroup` that links all files from `../../web/**` and copies them to the output on build/publish.

To see changes:
1. Make edits under `web/`
2. Rebuild or re-run the backend
3. Refresh the browser

## API integration
The JS files call the backend API endpoints (e.g., `/api/readings/status`, `/api/readings/status-per-device`, `/api/readings/history/{deviceId}`) and use cookie-based auth after login/registration.
