# Contributing to Better State

Thanks for your interest in contributing! This document explains how to get the project running locally, coding standards, and how to submit changes.

## Development setup

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. Build library:
   ```bash
   npm run build
   ```

## Project structure (high level)

- `src/core/` — state, derived, resource, scheduler, internals, tracker
- `src/react/`, `src/vue/`, `src/svelte/` — framework bindings
- `src/persist/`, `src/middleware/`, `src/helpers/`, `src/async/`, `src/devtools/`
- `src/server/`, `src/ssr/`, `src/adapters/` — server integration, hydration, framework adapters
- `tests/` — vitest test suite

## Making changes

- Keep changes focused and incremental. Avoid large, mixed PRs.
- Add tests for all new features and bug fixes.
- Ensure `npm test` passes locally.
- Update `README.md` and any relevant docs when behavior or APIs change.

## Code style

- TypeScript, ES2020+, ESM modules.
- Prefer small, composable functions.
- Avoid unnecessary dependencies.
- Do not introduce breaking changes without discussion.

## Commit messages

- Use clear, descriptive messages.
- Prefix scope when useful, e.g., `core:`, `react:`, `persist:`, `server:`, `docs:`.
  - Examples:
    - `core: batch recompute notifications with tags`
    - `server: add serverResource TTL tests`
    - `docs: expand SSR hydration section`

## Pull requests

1. Create a feature branch from `main`.
2. Ensure the code builds and tests pass.
3. Describe the motivation, implementation, and any trade-offs in the PR description.
4. Mention any related issues and breaking changes.

## Reporting issues

- Use GitHub Issues and include:
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment (OS, Node, browser)
  - Minimal repro if possible

## Security

If you discover a security vulnerability, please report it privately via the repository's security policy (or by opening a security advisory). Do not open public issues for security reports.

## License and CLA

By contributing, you agree that your contributions will be licensed under the project’s license (GPL-3.0-or-later). If a Contributor License Agreement (CLA) becomes necessary in the future, maintainers will reach out before merging.
