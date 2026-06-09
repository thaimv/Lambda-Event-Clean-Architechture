#!/usr/bin/env bash
# Build one Lambda handler, zip it, and stage under artifacts/<lambda-name>/.
# Usage: 004_build-lambda-artifact.sh <lambda-name> <zip-filename>
set -euo pipefail

LAMBDA_NAME="${1:?lambda name required}"
ZIP_FILE="${2:?zip filename required}"
ARTIFACT_DIR="artifacts/${LAMBDA_NAME}"

echo "Building ${LAMBDA_NAME}..."
npm run "build:${LAMBDA_NAME}"

echo "Zipping ${LAMBDA_NAME}..."
(cd "build/${LAMBDA_NAME}" && zip -r "../../${ZIP_FILE}" .)

echo "Staging ${LAMBDA_NAME} artifact..."
mkdir -p "${ARTIFACT_DIR}"
mv "${ZIP_FILE}" "${ARTIFACT_DIR}/"

ls -lah "${ARTIFACT_DIR}"
