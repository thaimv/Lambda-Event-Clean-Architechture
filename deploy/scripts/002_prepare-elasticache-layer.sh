#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAYER_ZIP="elasticache-layer.zip"

cd "$ROOT_DIR"

echo "Building ElastiCache layer via app/lambda/layer/elasticache/prepare-elasticache.sh ..."
bash app/lambda/layer/elasticache/prepare-elasticache.sh

mkdir -p layers/elasticache
cp app/lambda/layer/elasticache/output.zip "layers/elasticache/${LAYER_ZIP}"

echo "Layer ready: layers/elasticache/${LAYER_ZIP}"
ls -lh "layers/elasticache/${LAYER_ZIP}"
