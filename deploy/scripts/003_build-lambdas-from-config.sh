#!/usr/bin/env bash
# Build all Lambdas from a JSON array config.
# Each item: {"name":"delete-user","zip":"delete-user.zip"}
# Usage: 003_build-lambdas-from-config.sh '<json>'  OR  003_build-lambdas-from-config.sh @config.json
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONFIG="${1:?JSON config required}"

cd "$ROOT_DIR"

ITEMS=()
if [[ "${CONFIG}" == @* ]]; then
  CONFIG_FILE="${CONFIG#@}"
  if [[ ! -f "${CONFIG_FILE}" ]]; then
    echo "Config file not found: ${CONFIG_FILE}" >&2
    exit 1
  fi
  while IFS= read -r item; do
    ITEMS+=("${item}")
  done < <(jq -c '.[]' "${CONFIG_FILE}")
else
  while IFS= read -r item; do
    ITEMS+=("${item}")
  done < <(jq -c '.[]' <<<"${CONFIG}")
fi

if [[ "${#ITEMS[@]}" -eq 0 ]]; then
  echo "No Lambdas defined in config." >&2
  exit 1
fi

for item in "${ITEMS[@]}"; do
  NAME=$(jq -r '.name' <<<"${item}")
  ZIP=$(jq -r '.zip' <<<"${item}")
  RUNTIME=$(jq -r '.runtime // "nodejs"' <<<"${item}")

  if [[ "${RUNTIME}" == "python" ]]; then
    SRC_DIR="app/lambda/src/${NAME}"
    if [[ ! -d "${SRC_DIR}" ]]; then
      echo "Python source directory not found: ${SRC_DIR}" >&2
      exit 1
    fi
    ARTIFACT_DIR="artifacts/${NAME}"
    mkdir -p "build/${NAME}" "${ARTIFACT_DIR}"
    cp -r "${SRC_DIR}"/* "build/${NAME}/"
    (cd "build/${NAME}" && zip -r "../../${ARTIFACT_DIR}/${ZIP}" .)
    ls -lah "${ARTIFACT_DIR}"
    continue
  fi

  bash deploy/scripts/004_build-lambda-artifact.sh "${NAME}" "${ZIP}"
done
