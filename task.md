# Phase 3: Final UI & Infrastructure Polish — Task Tracker

## Step 10: Validator & Watcher Fixes
- [ ] Update `validate_projects.py` with atomic writes
- [ ] Implement `sys.exit(1)` on syntax error and remove stale `.tmp` files
- [ ] Handle nested directories & duplicate IDs in validator
- [ ] Ensure cross-platform path normalization and unicode escaping in validator
- [ ] Expand `tests/test_validation.py` to cover new edge cases
- [ ] Install `chokidar-cli` and `npm-run-all`
- [ ] Update `package.json` to concurrently run Vite and chokidar watcher

## Step 11: Content Integrity
- [ ] Remove all spike fixtures from `python-projects/`
- [ ] Create beginner-friendly sample projects (e.g. number guesser, greeting)
- [ ] Ensure spike fixtures in `tests/fixtures/python-runtime/` remain untouched

## Step 12: React Routing & Architecture
- [ ] Implement `HashRouter` in `src/main.tsx`
- [ ] Create `Home` page component
- [ ] Create `ProjectDetails` page component
- [ ] Create `ProjectGallery` and `ProjectCard` components
- [ ] Create `CodeViewer` component with `react-syntax-highlighter`
- [ ] Create `CompatibilityBanner` component

## Step 13: Styling & Polish
- [ ] Implement child-friendly, modern, glassmorphic CSS theme
- [ ] Refine `InputPrompt` design
- [ ] Add loading states and empty states
- [ ] Ensure responsive layout (mobile/tablet/desktop)

## Step 14: Final Verification
- [ ] Run `python tests/test_validation.py`
- [ ] Verify production build `npm run build` handles syntax errors properly
- [ ] Manually verify UI across different screen sizes
- [ ] Ensure Phase 1 execution engine is still working with spike fixtures
- [ ] Prepare Phase 3 Final Walkthrough Report
