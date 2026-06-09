## Purpose

<!-- Describe the purpose of changes that have been made in this pull request -->

## Detail of changes

<!-- Provide details on how the issue was fixed or how the feature was implemented -->

## Regression

<!-- Provide regression information for this pull request -->

## Self-test evidence

### Test cases

<!-- Provide self-test evidence by listing the test cases and their evidence -->

### Masking sensitive logs

<!-- Provide evidence of masking sensitive data in logs -->

## Pull request Checklist

**General Checklist**

- [ ] Follow Architecture rules

**Code Checklist**

- [ ] Has description of changes (PR)
- [ ] Has evidence of changes (PR): happy case, error case, edge case
- [ ] Unit tests added or updated
- [ ] Unit test followed the Detail Design
- [ ] Unit test passed and ensure code coverage is not reduced
- [ ] Update Detail Design (if needed)
- [ ] No syntax or code style, convention issues (follow the Project Coding Conventions)
- [ ] No build errors
- [ ] No duplicate codes
- [ ] Code changes reviewed by another team member
- [ ] Remove unnecessary code
- [ ] Need run migrations (need comment command)
- [ ] Need run seeder data (need comment command)
- [ ] Stepfunction workflows changed

<!-- If migrations or seeder are needed, comment the command below, e.g.:
Migration: `npm run prisma:migrate`
Seeder: `npm run seed`
-->
