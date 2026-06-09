#!/usr/bin/env bash
# Deploy Step Functions from JSON config.
# Each item:
#   {
#     "state_machine_name": "DeleteUserBatch",
#     "definition_file": "app/stepfunction/workflows/delete-user-batch/workflow.json",
#     "lambda_placeholders": { "delete-user": "aws-function-name" },
#     "s3_placeholders": { "bucket-key": "bucket-name" },
#     "state_machine_placeholders": { "other-sm": "OtherStateMachineName" },
#     "athena_db": "optional-db-name"
#   }
# Requires: AWS_REGION, AWS_ACCOUNT_ID
# Usage: 006_deploy-stepfunctions-from-config.sh '<json>'
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONFIG="${1:?JSON config required}"

cd "$ROOT_DIR"

: "${AWS_REGION:?AWS_REGION is required}"
: "${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID is required}"

mkdir -p build/stepfunctions

ITEMS=()
while IFS= read -r item; do
  ITEMS+=("${item}")
done < <(jq -c '.[]' <<<"${CONFIG}")

if [[ "${#ITEMS[@]}" -eq 0 ]]; then
  echo "No Step Functions defined in config." >&2
  exit 1
fi

WORKFLOW_COUNT=0

for item in "${ITEMS[@]}"; do
  STATE_MACHINE_NAME=$(jq -r '.state_machine_name' <<<"${item}")
  DEFINITION_FILE=$(jq -r '.definition_file' <<<"${item}")

  if [[ ! -f "${DEFINITION_FILE}" ]]; then
    echo "Workflow definition file not found: ${DEFINITION_FILE}" >&2
    exit 1
  fi

  STATE_MACHINE_ARN="arn:aws:states:${AWS_REGION}:${AWS_ACCOUNT_ID}:stateMachine:${STATE_MACHINE_NAME}"
  RENDERED_DEFINITION_FILE="build/stepfunctions/${STATE_MACHINE_NAME}.workflow.rendered.json"

  echo "→ Deploying Step Function: ${STATE_MACHINE_NAME}"
  echo "  ARN: ${STATE_MACHINE_ARN}"
  echo "  Definition: ${DEFINITION_FILE}"

  sed -e "s|__REGION__|${AWS_REGION}|g" \
    -e "s|__ACCOUNT_ID__|${AWS_ACCOUNT_ID}|g" \
    "${DEFINITION_FILE}" > "${RENDERED_DEFINITION_FILE}"

  while IFS=$'\t' read -r SF_KEY SF_FN; do
    [[ -z "${SF_KEY}" ]] && continue
    LAMBDA_PLACEHOLDER="__LAMBDA_$(echo "${SF_KEY}" | tr '[:lower:]-' '[:upper:]_')__"
    sed -i "s|${LAMBDA_PLACEHOLDER}|${SF_FN}|g" "${RENDERED_DEFINITION_FILE}"
  done < <(jq -r '.lambda_placeholders // {} | to_entries[] | [.key, .value] | @tsv' <<<"${item}")

  while IFS=$'\t' read -r S3_KEY S3_BUCKET; do
    [[ -z "${S3_KEY}" ]] && continue
    S3_PLACEHOLDER="__S3_BUCKET_$(echo "${S3_KEY}" | tr '[:lower:]-' '[:upper:]_')__"
    sed -i "s|${S3_PLACEHOLDER}|${S3_BUCKET}|g" "${RENDERED_DEFINITION_FILE}"
  done < <(jq -r '.s3_placeholders // {} | to_entries[] | [.key, .value] | @tsv' <<<"${item}")

  while IFS=$'\t' read -r SM_KEY SM_NAME; do
    [[ -z "${SM_KEY}" ]] && continue
    SM_PLACEHOLDER="__STATE_MACHINE_$(echo "${SM_KEY}" | tr '[:lower:]-' '[:upper:]_')__"
    sed -i "s|${SM_PLACEHOLDER}|${SM_NAME}|g" "${RENDERED_DEFINITION_FILE}"
  done < <(jq -r '.state_machine_placeholders // {} | to_entries[] | [.key, .value] | @tsv' <<<"${item}")

  ATHENA_DB=$(jq -r '.athena_db // empty' <<<"${item}")
  if [[ -n "${ATHENA_DB}" ]]; then
    sed -i "s|__ATHENA_DB__|${ATHENA_DB}|g" "${RENDERED_DEFINITION_FILE}"
  fi

  if grep -Eq '__LAMBDA_[A-Z0-9_]+__|__S3_BUCKET_[A-Z0-9_]+__|__STATE_MACHINE_[A-Z0-9_]+__|__ATHENA_DB__|__REGION__|__ACCOUNT_ID__' \
    "${RENDERED_DEFINITION_FILE}"; then
    echo "Unresolved placeholder in ${RENDERED_DEFINITION_FILE}" >&2
    grep -Eo '__[A-Z0-9_]+__' "${RENDERED_DEFINITION_FILE}" | sort -u >&2
    exit 1
  fi

  aws stepfunctions update-state-machine \
    --region "${AWS_REGION}" \
    --state-machine-arn "${STATE_MACHINE_ARN}" \
    --definition "file://${RENDERED_DEFINITION_FILE}"

  echo "✓ ${STATE_MACHINE_NAME} deployed successfully"
  WORKFLOW_COUNT=$((WORKFLOW_COUNT + 1))
done

echo "✓ Step Functions deployment completed (${WORKFLOW_COUNT} workflows)"
