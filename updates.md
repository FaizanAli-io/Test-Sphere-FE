# Updates — Question Pools & Dynamic Test Generation ✅

**Date:** 2026-02-02

---

## TL;DR 💡

- Introduced **Question Pools** to support dynamic test generation (random question selection).
- Removed obsolete `numQuestions` from `Test` and removed persisted `mode` (mode is provided as a query parameter on the questions API).
- Added strict validation for pool `config` (keys must be `QuestionType` values; values must be non-negative integers).

---

## Database & Entities 🔧

- New entity: `QuestionPool` (table `question_pool`)
  - Fields: `id`, `testId` (FK → `test`), `title`, `config` (JSON), `createdAt`, `updatedAt`
  - Index on `testId`
- Changes to `Question`:
  - Added nullable `questionPoolId` column (FK → `question_pool`) and index
  - Each `Question` still belongs to exactly one `Test` via `testId`
- Changes to `Test`:
  - **Removed** `numQuestions` and removed stored `mode` attribute

> Note: The DB has been reset; schema changes are applied directly via TypeORM entities.

---

## Validation rules ✅

- `config` must be an object where:
  - Keys are valid `QuestionType` enum members: `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER`, `LONG_ANSWER`
  - Values are non-negative integers
- Validation failure message: `config must be an object with keys from QuestionType and non-negative integer values`

---

## API Endpoints & Behavior 📡

Authentication: JWT required for all endpoints. Teacher-only actions are guarded by `RolesGuard`.

1. Get test questions

- GET `/tests/:testId/questions?mode=STATIC|POOL`
- Query param:
  - `mode` (optional) — values: `STATIC`, `POOL`. When omitted defaults to `STATIC`.
- Authorization:
  - Teachers: always return all questions (ignore `mode`).
  - Students: behavior depends on `mode`.
- Behavior:
  - `STATIC` → return all questions for the test
  - `POOL` → dynamic selection using all question pools associated with the test (see selection rules)

Example:

```
GET /tests/55/questions?mode=POOL
Authorization: Bearer <token>
```

2. Question Pool CRUD

- List pools: GET `/tests/:testId/pools` — returns all pools for a test
- Create pool: POST `/tests/:testId/pools` (Teacher)
  - Body: `{ "title": "Algebra MCQs", "config": { "MULTIPLE_CHOICE": 5, "TRUE_FALSE": 5 } }`
- Update pool: PATCH `/tests/pools/:id` (Teacher)
  - Body: any subset `{ "title": "...", "config": {...} }`
- Delete pool: DELETE `/tests/pools/:id` (Teacher)
  - Deleting a pool sets `question.questionPoolId` to `NULL` (relation uses `ON DELETE SET NULL`)

3. Question create/update

- `questionPoolId` is an optional integer field in question DTOs to assign a question to a pool

---

## Selection Algorithm (POOL mode) 🎲

- Load all pools for `testId`.
- For each pool:
  - Collect questions where `questionPoolId = pool.id`.
  - Group these questions by `type`.
  - For each `type` in `pool.config`, randomly select `config[type]` questions from that group using Fisher–Yates shuffle.
  - If requested count > available, select the available count (no error).
  - Ensure globally no duplicate questions selected across pools (dedupe by `id`).
- Response: array of selected question objects (no guaranteed total count).

---

## Frontend Integration Checklist ✅

- Fetch questions:
  - `GET /tests/:testId/questions?mode=POOL` for pool selection
  - `GET /tests/:testId/questions` or `?mode=STATIC` for all questions
- Pools UI (Teacher only):
  - List pools (`GET /tests/:testId/pools`)
  - Create pool (`POST /tests/:testId/pools`) — validate config client-side
  - Edit pool (`PATCH /tests/pools/:id`) — validate config
  - Delete pool (`DELETE /tests/pools/:id`)
- Question assignment UI:
  - Provide `questionPoolId` dropdown when creating/updating questions to assign them to pools
- Display warnings:
  - If pool `config` requests more questions than present, show a warning to teachers
- Remarks:
  - Pool selection is randomized per request. If deterministic selection is required, request an API addition to support seeding.

---

## Errors & Edge Cases ⚠️

- Invalid pool `config` → 400 Bad Request with validation message
- Invalid `mode` query param → 400 Bad Request (enum validation)
- Pool requests more questions than exist → returned selected list is shorter (no error)

---

## Developer Notes 🧑‍💻

- Key server files:
  - `src/typeorm/entities/question-pool.entity.ts` (new)
  - `src/typeorm/entities/question.entity.ts` (updated)
  - `src/test/test.service.ts` (selection logic + pool CRUD)
  - `src/test/question-pool.controller.ts` (new controller)
  - `src/test/test.dto.ts` (DTOs updated + `CreateQuestionPoolDto` / `UpdateQuestionPoolDto`)
  - `src/test/validators/pool-config.validator.ts` (custom validator)
- Tests recommended:
  - Unit tests for `IsValidPoolConfig` validator
  - Integration tests for pool endpoints and the `GET /tests/:testId/questions?mode=POOL` selection results
