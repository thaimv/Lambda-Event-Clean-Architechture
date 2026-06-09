#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
export NODE_PATH="$PROJECT_ROOT/app/lambda/src:${NODE_PATH:-}"

cd "$SCRIPT_DIR"

ENV_FILE="$PROJECT_ROOT/out/simulator/env.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: env.yml not found at: $ENV_FILE"
  exit 1
fi

load_env_yml() {
  local file="$1"
  local in_local=0
  local key value

  while IFS= read -r line || [ -n "$line" ]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue

    if [[ "$line" == "local:" ]]; then
      in_local=1
      continue
    fi

    if (( in_local )); then
      if [[ "$line" =~ ^[A-Za-z0-9_]+:[[:space:]]*$ ]]; then
        break
      fi

      if [[ "$line" =~ ^[[:space:]]+([A-Za-z0-9_]+):[[:space:]]*(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        value="${value%%[[:space:]]#*}"
        value="${value%"${value##*[![:space:]]}"}"
        if [[ "$value" == \'*\' ]]; then
          value="${value:1:${#value}-2}"
        elif [[ "$value" == \"*\" ]]; then
          value="${value:1:${#value}-2}"
        fi
        export "$key=$value"
      fi
    fi
  done < "$file"
}

echo "Loading environment variables from $ENV_FILE"
load_env_yml "$ENV_FILE"

LAMBDA=${1:-}
if [ -z "$LAMBDA" ]; then
  echo "Usage: ./run_script.sh <lambda-name>"
  echo "Example: ./run_script.sh delete-user"
  exit 1
fi

HANDLER_PATH="../../app/lambda/src/${LAMBDA}/index"

if [ ! -f "$PROJECT_ROOT/app/lambda/src/${LAMBDA}/index.ts" ]; then
  echo "Error: Lambda handler not found: app/lambda/src/${LAMBDA}/index.ts"
  exit 1
fi

if [ -f "events/${LAMBDA}.json" ]; then
  EVENT_FILE="events/${LAMBDA}.json"
else
  EVENT_FILE="events/empty.json"
fi

echo "Lambda: $LAMBDA"
echo "Handler: $HANDLER_PATH"
echo "Event: $EVENT_FILE"

cat > temp.js << EOL
const { handler } = require('$HANDLER_PATH');
const event = require('./$EVENT_FILE');

handler(event, {})
  .then(result => {
    console.log('Result:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('Error:', error);
  });
EOL

npx ts-node \
  -r tsconfig-paths/register \
  --project "$PROJECT_ROOT/tsconfig.json" \
  temp.js

rm temp.js
