#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAYER_ZIP="prisma-layer.zip"

cd "$ROOT_DIR"

echo "Building Prisma layer via app/lambda/layer/prisma/prepare-prisma.sh ..."
bash app/lambda/layer/prisma/prepare-prisma.sh

mkdir -p layers/prisma
cp app/lambda/layer/prisma/output.zip "layers/prisma/${LAYER_ZIP}"

echo "Layer ready: layers/prisma/${LAYER_ZIP}"
ls -lh "layers/prisma/${LAYER_ZIP}"
