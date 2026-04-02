# QuantityMeasurementApp_Frontend

Simple frontend for QuantityMeasurementApp backend with:

- Login page
- Signup page
- Quantity Comparison
- Quantity Conversion
- Arithmetic (Add, Subtract, Divide)

## Project Structure

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

## Backend Used

This frontend connects to backend endpoints from QuantityMeasurementApp:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/quantitymeasurement/convert`
- `POST /api/quantitymeasurement/compare`
- `POST /api/quantitymeasurement/add`
- `POST /api/quantitymeasurement/subtract`
- `POST /api/quantitymeasurement/divide`
- `GET /api/quantitymeasurement/history`

Base URL is configured in `data/app-config.json`.

## Run Backend

From backend folder:

```powershell
cd c:\QuantityMeasurementApp\src\QuantityMeasurementApp.Api
dotnet run
```

Default dev API URL is expected as `https://localhost:7137`.

## Run Frontend

Do not open HTML directly with `file://` because JSON/API fetch calls may fail.
Serve frontend with a local static server.

Example with VS Code Live Server extension, or any static server rooted at:

`c:\QuantityMeasurementApp_Frontend`

Then open:

- `/index.html`
- `/login.html`
- `/signup.html`