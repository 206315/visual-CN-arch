# Repository Guidelines

## Project Structure & Module Organization
The main application lives in `src/` and is a Vite + React + TypeScript client. Use `src/components/` for shared UI, `src/pages/` for route-level screens, `src/services/` for integrations, `src/utils/` for reusable logic, and `src/types/` for declarations. Static runtime data lives in `public/`, while desktop entry points are in `electron/` and Android packaging files are in `android/`. Utility scripts such as `scripts/add_real_buildings_500.js` are one-off data helpers. Treat `editor-main/`, `threejs-3dmodel-edit-master/`, and `three_js_demo-main/` as embedded side projects unless a task explicitly targets them.

## Build, Test, and Development Commands
Run `npm install` once to sync dependencies. Use `npm run dev` to start the Vite dev server on port `3000`. Use `npm run build` to type-check and create the production bundle in `dist/`. Use `npm run preview` to serve the built app locally. Use `npm run electron:dev` to open the Electron shell against the current project, and `npm run electron:build` to package the desktop app into `dist-desktop/`. Windows helper scripts such as `start_project.bat`, `build_portable.bat`, and `build_apk.bat` wrap common local workflows.

## Coding Style & Naming Conventions
Write TypeScript/TSX with 2-space indentation, semicolons, and single quotes to match the existing source. Prefer strict typing over `any`; `tsconfig.json` enables `strict` mode. Use PascalCase for React components and page files (`HomePage.tsx`), camelCase for utilities and services (`buildingSimilarity.ts`), and keep asset/data filenames descriptive. Import app code via the `@/*` alias when that improves readability. Styling is driven by Tailwind plus `src/index.css`; keep custom tokens aligned with `tailwind.config.js`.

## Testing Guidelines
There is no root automated test suite configured yet. At minimum, run `npm run build` before submitting changes and manually verify the affected page, 3D view, or Electron flow. If you add tests, place them beside the feature or under a dedicated `src/__tests__/` folder and name them `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
The current history only contains `Initial commit`, so no mature convention exists yet. Use short, imperative commit subjects such as `Add bridge point cloud legend` or `Fix Electron preload path`. Pull requests should include a clear summary, impacted areas, manual verification steps, and screenshots or recordings for UI/3D changes. Link the related issue or task when available.
