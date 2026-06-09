# Code Review Criteria

## Severity Levels

| Level | Label    | Meaning               | PR Impact             |
| ----- | -------- | --------------------- | --------------------- |
| 🔴    | CRITICAL | Must fix before merge | REQUEST_CHANGES       |
| 🟠    | HIGH     | Should fix            | APPROVE_WITH_COMMENTS |
| 🟡    | MEDIUM   | Recommended           | APPROVE_WITH_COMMENTS |
| 🟢    | LOW      | Nice to have          | APPROVE               |

## Finding Categories

Use one category per finding for grouping and de-duplication.

| Category          | Use for                                               |
| ----------------- | ----------------------------------------------------- |
| `ARCHITECTURE`    | Clean Architecture direction, module boundaries       |
| `LAYERING`        | Layer responsibilities (Presenter/UseCase/Repository) |
| `VALIDATION`      | Input validation, boundary checks, Zod usage          |
| `SECURITY`        | Secrets, injection risks, unsafe input handling       |
| `ERROR_HANDLING`  | Error class usage, error mapping/status behavior      |
| `DI`              | Inversify decorators, bindings, injection style       |
| `TESTING`         | Unit/E2E coverage and quality                         |
| `NAMING`          | Naming conventions and file/class suffix rules        |
| `TYPES`           | `any` usage and type-safety concerns                  |
| `MAINTAINABILITY` | Duplication, SOLID, readability, style                |
| `DOCUMENTATION`   | JSDoc and public interface docs                       |

## Critical Checks (must pass)

- [ ] [ARCHITECTURE] Clean Architecture layer direction respected (Presenter → UseCase → Repository → DataSource)
- [ ] [LAYERING] No business logic in Lambda handler
- [ ] [ARCHITECTURE] No cross-Lambda direct imports (share via `app/lambda/src/common/` or DI interfaces)
- [ ] [VALIDATION] Zod validation in presenter — no raw event fields passed to use cases
- [ ] [SECURITY] No security vulnerabilities (SQL injection, exposed secrets, unvalidated input)
- [ ] [ERROR_HANDLING] Custom error classes used — no raw `new Error()` thrown from use cases
- [ ] [DI] New classes decorated with `@injectable()` and registered in DI config

## High Checks (should pass)

- [ ] [MAINTAINABILITY] SOLID principles followed
- [ ] [DI] Constructor injection via `@inject` — no property injection
- [ ] [TESTING] Unit tests for new/changed use case logic
- [ ] [ARCHITECTURE] Repository interface updated when new method added
- [ ] [DI] DI tokens updated in `app/lambda/src/common/constants/di.const.ts` or `<name>/consts.ts`, registered in `<name>/module.ts`
- [ ] [LAYERING] Presenter updated when event shape or response mapping changes

## Medium Checks (recommended)

- [ ] [NAMING] Naming conventions match standards (file suffixes, class names)
- [ ] [TYPES] No `any` types without justification
- [ ] [ERROR_HANDLING] Error cases handled and mapped to appropriate HTTP status codes
- [ ] [MAINTAINABILITY] No code duplication → extract to `app/lambda/src/common/`
- [ ] [TESTING] Unit tests under `app/lambda/test/<name>/` for new/changed logic

## Low Checks (nice to have)

- [ ] [MAINTAINABILITY] Minor style improvements
- [ ] [TESTING] Additional edge-case tests
- [ ] [DOCUMENTATION] JSDoc on public interfaces

## Vote Mapping (recommendation only — user votes manually)

| Findings                     | Recommended Vote          | Value |
| ---------------------------- | ------------------------- | ----- |
| No CRITICAL, no HIGH         | Approved                  | `10`  |
| No CRITICAL, has HIGH        | Approved with suggestions | `5`   |
| Has CRITICAL                 | Waiting for author        | `-5`  |
| Multiple CRITICAL + security | Rejected                  | `-10` |

> ⚠️ AI must NOT auto-vote. Show recommendation and ask user to vote on the PR page.
