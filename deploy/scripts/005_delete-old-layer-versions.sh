#!/usr/bin/env bash
set -euo pipefail

LAYER_NAME="${1:-}"
KEEP="${2:-5}"

if [[ -z "${LAYER_NAME}" ]]; then
  echo "Usage: 005_delete-old-layer-versions.sh <layer-name> [keep-count]" >&2
  exit 1
fi

if ! [[ "${KEEP}" =~ ^[0-9]+$ ]]; then
  echo "keep-count must be a non-negative integer, got: ${KEEP}" >&2
  exit 1
fi

echo "Retaining ${KEEP} most recent version(s) of layer ${LAYER_NAME} ..."

VERSIONS_TO_DELETE=$(
  aws lambda list-layer-versions \
    --layer-name "${LAYER_NAME}" \
    --query "LayerVersions[${KEEP}:].Version" \
    --output text \
    --no-cli-pager 2>/dev/null || true
)

if [[ -z "${VERSIONS_TO_DELETE}" || "${VERSIONS_TO_DELETE}" == "None" ]]; then
  echo "No old layer versions to delete."
  exit 0
fi

for VERSION in ${VERSIONS_TO_DELETE}; do
  echo "Deleting layer version ${LAYER_NAME}:${VERSION} ..."
  if ! aws lambda delete-layer-version \
    --layer-name "${LAYER_NAME}" \
    --version-number "${VERSION}" \
    --no-cli-pager; then
    echo "Warning: could not delete ${LAYER_NAME}:${VERSION} (may still be referenced by a function version)."
  fi
done
