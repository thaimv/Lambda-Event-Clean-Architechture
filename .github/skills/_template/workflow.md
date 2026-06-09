# Skill Workflow Template

## Reference

- List files to read before starting.

---

## Step 1 — Pre-check Input

1. Read [manifest.yaml](./manifest.yaml) — use `input`, `output`, `templates`, `prev_skill`, and `next_skill` as the skill contract for this run.
2. Parse the skill argument(s) and confirm they match `manifest.yaml` → `input`.
3. If `prev_skill` is a list, the current run must follow **one of** those skills; if a single name, confirm implementation exists from that skill (e.g. `lambda-event-impl`).
4. Confirm required files/paths exist.
5. If input is missing, ambiguous, or invalid → **stop and ask** before continuing.

---

## Step 2 — {Main Work}

1. Do the primary task.
2. Follow project rules and conventions.

---

## Step N — Verify Output

1. Confirm the expected artifact(s) exist at the path(s) defined in `manifest.yaml` → `output`.
2. Validate format and completeness against the skill goal.
3. Report summary to the user (success, gaps, or next steps — suggest `next_skill` when applicable; if `next_skill` is a list, suggest the matching path).
