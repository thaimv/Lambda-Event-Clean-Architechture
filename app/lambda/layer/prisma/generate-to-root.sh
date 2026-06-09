#!/usr/bin/env bash
set -euo pipefail

LAYER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$LAYER_DIR/../../../.." && pwd)"
ROOT_NODE_MODULES="$ROOT_DIR/node_modules"

cd "$LAYER_DIR"

if [ ! -d node_modules ] || [ ! -x node_modules/.bin/prisma ]; then
  echo "Installing Prisma layer dependencies..."
  npm ci
fi

echo "Generating Prisma client in layer..."
npm run generate

if [ ! -d node_modules/.prisma/client ]; then
  echo "Error: Prisma client was not generated in layer node_modules"
  exit 1
fi

mkdir -p "$ROOT_NODE_MODULES/.prisma"
rm -rf "$ROOT_NODE_MODULES/.prisma/client"
cp -r node_modules/.prisma/client "$ROOT_NODE_MODULES/.prisma/"

echo "Copied Prisma client to $ROOT_NODE_MODULES/.prisma/client"
