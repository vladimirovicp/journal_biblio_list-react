# React App Audit and Controlled Refactor

## 1. Summary of Issues

### Critical
- `src/pages/Home/HomePage.tsx` mixed UI rendering, API requests, payload parsing, sorting, and side-effect orchestration in one file.
- API and transformation logic were tightly coupled to page-level UI.

### High
- No dedicated HTTP request layer.
- Repetitive async state orchestration in page effects.
- Feature-specific component had unclear naming (`joutnalsNumbers`).

### Medium
- Config source used JS + d.ts split inside a TS project.
- Page styles contained dead selectors no longer needed after decomposition.

## 2. Before / After Architecture

### Before
- `pages/Home/HomePage.tsx` handled:
  - endpoint building
  - request execution
  - pagination loop
  - issue details enrichment
  - payload normalization
  - article filtering
  - UI rendering

### After
- `features/journal/api/journalApi.ts`: journal endpoints + request orchestration.
- `features/journal/model/parsers.ts`: payload normalization and extraction.
- `features/journal/model/sort.ts`: issue sorting rules.
- `features/journal/hooks/useJournalIssues.ts`: issues loading state + side effects.
- `features/journal/hooks/useJournalArticles.ts`: articles loading state + side effects.
- `features/journal/components/IssueSelector.tsx`: issue select UI.
- `features/journal/components/JournalArticles.tsx`: article list UI.
- `shared/lib/http/requestJson.ts`: centralized JSON request helper.
- `shared/config/environments.ts`: typed env config source.
- `pages/Home/HomePage.tsx`: composition-only page.

## 3. Files Changed

- `src/pages/Home/HomePage.tsx`
- `src/pages/Home/HomePage.module.css`
- `src/app/App.tsx`

## 4. Files Added

- `src/shared/lib/http/requestJson.ts`
- `src/shared/config/environments.ts`
- `src/features/journal/api/journalApi.ts`
- `src/features/journal/model/types.ts`
- `src/features/journal/model/parsers.ts`
- `src/features/journal/model/sort.ts`
- `src/features/journal/hooks/useJournalIssues.ts`
- `src/features/journal/hooks/useJournalArticles.ts`
- `src/features/journal/components/IssueSelector.tsx`
- `src/features/journal/components/IssueSelector.module.css`
- `src/features/journal/components/JournalArticles.tsx`
- `src/features/journal/components/JournalArticles.module.css`

## 5. Files Removed

- `src/components/joutnalsNumbers/joutnalsNumbers.tsx`
- `src/components/joutnalsNumbers/joutnalsNumbers.module.css`
- `src/config/environments.js`
- `src/config/environments.d.ts`

## 6. What Was Extracted

### API
- Journal issues fetching, page loading, issue details loading, and article loading moved from `HomePage` into `features/journal/api/journalApi.ts`.

### Hooks
- Issues state machine extracted to `useJournalIssues`.
- Articles state machine extracted to `useJournalArticles`.

### Utils / Model
- Response parsing (`extractIssues`, `extractIssueMetadata`, `extractArticles`) extracted to `model/parsers.ts`.
- Metadata sorting extracted to `model/sort.ts`.
- Domain types extracted to `model/types.ts`.

### Shared
- Generic HTTP JSON helper extracted to `shared/lib/http/requestJson.ts`.
- Environment config centralized in `shared/config/environments.ts`.

## 7. Remaining Problems

- No unit/integration tests around parser behavior and sorting priority.
- API response contracts are dynamic (`unknown`) and rely on runtime guards only.
- N+1 detail requests for issues may become expensive with large issue counts.
- No caching/retry/dedup strategy for fetches.

## 8. Recommendations

1. Add tests for:
   - issue metadata extraction (`und -> value`)
   - article filtering by selected issue nid/uri
   - sorting priority (`year -> volume -> number -> part`)
2. Introduce request-level caching for issue details to reduce repeated network calls.
3. Add lightweight error telemetry wrapper for failed API calls.
4. Consider React Query (or equivalent) if data complexity grows.
5. Consider route-level code splitting for future feature growth.

## 9. Validation Results

- `npm run lint` passed.
- `npm run build` passed.
- Imports resolved after module moves and deletions.
