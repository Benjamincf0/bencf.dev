# Repository Guidelines

## Project Structure & Module Organization

This personal portfolio uses React, TypeScript, and Vite. `src/main.tsx` mounts `src/App.tsx`, which assembles page sections from `src/components/`. Section styles live in `src/styles/`; global styles live in `src/index.css`. Imported images and icons belong in `src/assets/`; static files, including Gaussian splat models, live in `public/`. Rendering utilities include `src/four.ts` and `src/GaussianSplat.js`.

The contact form's Python AWS Lambda lives in `backend/lambdas/email_lambda/lambda_function.py`. Deployment workflows are in `.github/workflows/`. Generated output goes to `dist/` and should remain untracked.

## Build, Test, and Development Commands

Use Bun to match CI:

- `bun install`: install dependencies.
- `bun run dev`: start the Vite development server.
- `bun run build`: generate the production bundle in `dist/`.
- `bun run preview`: serve the production build locally.
- `bun run lint`: run Oxlint using `.oxlintrc.json`.

Equivalent npm scripts are available. Both `bun.lock` and `package-lock.json` exist; avoid unrelated lockfile changes. The build invokes Vite only and does not perform a separate TypeScript check.

## Coding Style & Naming Conventions

Follow nearby code: generally two-space indentation in TSX and four spaces in Python. Use PascalCase component names and lowercase section filenames, such as `contactme.tsx` with `contactme.css`. Prefer functional React components and hooks. Use the existing `#components/*`, `#styles/*`, and `#assets/*` import aliases. Preserve local quote and semicolon conventions; no formatter is configured. Oxlint enforces React hook rules and checks TypeScript.

## Testing Guidelines

No automated test framework, test script, or coverage threshold is configured. Run lint and a production build for code changes. Manually verify affected sections at desktop and mobile widths, including navigation, rendering, and contact-form states. Mock contact submissions during checks to avoid sending real email through AWS SES.

## Commit & Pull Request Guidelines

History uses short, informal descriptions such as `new projects`; no strict commit convention is evident. Write concise, descriptive messages scoped to one change. PRs should explain the change, list validation performed, link relevant issues, and include screenshots for visual updates.

## Deployment & Configuration

Pushes to `main` deploy the frontend to S3 and invalidate CloudFront; backend changes also deploy the Lambda. Keep AWS credentials out of source and use the workflows' configured repository variables and secrets.
