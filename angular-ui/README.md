# AngularUi

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.23.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Environment configuration

This app generates `public/data/app-config.json` from `.env` before `start`, `build`, `watch`, and `test`.

Create your local environment file:

```bash
cp .env.example .env
```

Set these variables in `.env`:

```text
API_BASE_URL=http://localhost:5105
GOOGLE_CLIENT_ID=
```

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Deploying To Render

This app is ready to deploy as a static site on Render.

Use these settings:

- Build command: `npm install && npm run build`
- Publish directory: `dist/angular-ui/browser`
- Environment: provide `API_BASE_URL` (and optionally `GOOGLE_CLIENT_ID`) as environment variables for the build

If your hosting provider needs an SPA fallback, route all unknown paths to `index.html` so `/login` and `/signup` continue to work on refresh.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
