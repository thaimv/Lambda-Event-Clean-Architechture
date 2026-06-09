#!/bin/bash

function prepare_elasticache_lambda_layer() {
  cd app/lambda/layer/elasticache

  # Cleanup
  echo "Cleaning up workspace ..."
  rm -rf output

  # Npm Clean install
  echo "Installing dependencies..."
  npm install --force --include=optional

  # Manually install Linux-specific valkey package with platform override
  echo "Installing Linux-specific valkey package..."
  npm_config_target_platform=linux npm_config_target_arch=x64 npm install @valkey/valkey-glide-linux-x64-gnu --force --no-save || echo "Warning: Could not install Linux package directly"

  # Manual download of Linux package if npm failed
  if [ ! -s "node_modules/@valkey/valkey-glide-linux-x64-gnu/package.json" ]; then
    echo "Attempting to manually download Linux binary..."

    # Create directory structure
    mkdir -p node_modules/@valkey/valkey-glide-linux-x64-gnu

    # Try multiple version downloads
    VERSIONS=("2.4.1" "2.1.1" "2.1.0" "2.0.1" "2.0.0")

    for VERSION in "${VERSIONS[@]}"; do
      echo "Trying version $VERSION..."
      TARBALL_URL="https://registry.npmjs.org/@valkey/valkey-glide-linux-x64-gnu/-/valkey-glide-linux-x64-gnu-$VERSION.tgz"

      if curl -f -L "$TARBALL_URL" | tar -xz -C node_modules/@valkey/valkey-glide-linux-x64-gnu --strip-components=1 2>/dev/null; then
        echo "Successfully downloaded version $VERSION"
        break
      else
        echo "Version $VERSION not available, trying next..."
        # Clean up failed attempt
        rm -rf node_modules/@valkey/valkey-glide-linux-x64-gnu/*
      fi
    done

    # Verify download
    if [ -s "node_modules/@valkey/valkey-glide-linux-x64-gnu/package.json" ]; then
      echo "Linux package successfully downloaded!"
    else
      echo "Failed to download Linux package from all attempted versions"
    fi
  fi

  cp node_modules/.package-lock.json ./package-lock.json

  # Set consistent timestamps to improve caching
  find node_modules -exec touch -d '1985-10-21 09:00:00' {} \;

  # Create temporary structure
  echo "Creating layer structure ..."
  mkdir -p tmp/nodejs/node_modules

  # Copy nodejs directory contents to tmp
  echo "Prepare ElastiCache layer ..."
  cp -r node_modules/* tmp/nodejs/node_modules/

  # Remove unnecessary files to reduce layer size
  echo "Optimizing layer size..."
  cd tmp/nodejs/node_modules
  find node_modules -name "*.md" -delete 2>/dev/null || true
  find node_modules -name "*.txt" -delete 2>/dev/null || true
  find node_modules -name "CHANGELOG*" -delete 2>/dev/null || true
  find node_modules -name "HISTORY*" -delete 2>/dev/null || true
  find node_modules -name "LICENSE*" -delete 2>/dev/null || true
  find node_modules -name "NOTICE*" -delete 2>/dev/null || true
  find node_modules -name "README*" -delete 2>/dev/null || true
  find node_modules -name ".git*" -delete 2>/dev/null || true
  find node_modules -name ".npm*" -delete 2>/dev/null || true
  find node_modules -name "test*" -type d -exec rm -rf {} + 2>/dev/null || true
  find node_modules -name "tests*" -type d -exec rm -rf {} + 2>/dev/null || true
  find node_modules -name "example*" -type d -exec rm -rf {} + 2>/dev/null || true
  find node_modules -name "examples*" -type d -exec rm -rf {} + 2>/dev/null || true
  find node_modules -name "benchmark*" -type d -exec rm -rf {} + 2>/dev/null || true
  find node_modules -name "benchmarks*" -type d -exec rm -rf {} + 2>/dev/null || true
  find node_modules -name "docs*" -type d -exec rm -rf {} + 2>/dev/null || true
  find node_modules -name "coverage*" -type d -exec rm -rf {} + 2>/dev/null || true

  # Remove development files
  find node_modules -name "*.ts" -not -path "*/types/*" -delete 2>/dev/null || true
  find node_modules -name "*.map" -delete 2>/dev/null || true
  find node_modules -name "tsconfig.json" -delete 2>/dev/null || true
  find node_modules -name ".eslintrc*" -delete 2>/dev/null || true
  find node_modules -name ".prettierrc*" -delete 2>/dev/null || true

  # Go back to tmp root
  cd ../..

  # Compress
  echo "Compressing ..."
  zip -rqX output.zip . && mv output.zip ./../output.zip

  # Cleanup
  echo "Remove unzipped files ..."
  cd ..
  rm -rf tmp
  rm -rf node_modules

  # Output
  echo "Stats:"
  if command -v md5 &> /dev/null; then
    md5 output.zip
  elif command -v md5sum &> /dev/null; then
    md5sum output.zip
  fi
  ls -lh output.zip

  cd ../../../..
}

prepare_elasticache_lambda_layer
