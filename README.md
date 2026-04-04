# QuantityMeasurementApp_Frontend

This repository now contains two frontends:

- `angular-ui/` is the current Angular implementation and should be used for active development.
- The root-level HTML/CSS/JS files are the legacy static UI and are kept only for reference.

## Angular App

The Angular app mirrors the original UI and behavior:

- Login page
- Signup page
- Quantity comparison
- Quantity conversion
- Arithmetic for add, subtract, and divide

### Run Angular Frontend

```powershell
cd c:\QuantityMeasurementApp_Frontend\angular-ui
npm start
```

Open `http://localhost:4200`.

### Angular Project Structure

- `angular-ui/src/app/pages/home/home.component.ts`
- `angular-ui/src/app/pages/login/login.component.ts`
- `angular-ui/src/app/pages/signup/signup.component.ts`
- `angular-ui/src/app/services/api.service.ts`
- `angular-ui/src/app/services/auth.service.ts`
- `angular-ui/public/data/app-config.json`
- `angular-ui/public/data/units.json`

## Legacy Static UI

The original static pages still live at the repository root:

- `index.html`
- `login.html`
- `signup.html`
- `styles/main.css`
- `scripts/api.js`
- `scripts/auth.js`
- `scripts/app.js`
- `scripts/login.js`
- `scripts/signup.js`
- `data/app-config.json`
- `data/units.json`

These files are no longer the primary app entry points.

## Backend Used

Both frontends use the same backend endpoints:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/quantitymeasurement/convert`
- `POST /api/quantitymeasurement/compare`
- `POST /api/quantitymeasurement/add`
- `POST /api/quantitymeasurement/subtract`
- `POST /api/quantitymeasurement/divide`
- `GET /api/quantitymeasurement/history`

The Angular app reads its config from `angular-ui/public/data/app-config.json`.

## Run Backend

From backend folder:

```powershell
cd c:\QuantityMeasurementApp\src\QuantityMeasurementApp.Api
dotnet run
```

Default dev API URL is expected as `https://localhost:7137`.

## Notes

- Do not open either frontend directly with `file://` if you expect JSON/API fetch calls to work reliably.
- For the legacy static UI, serve the repository root with a local static server.