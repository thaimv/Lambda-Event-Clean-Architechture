#!/bin/bash

function prepare_prisma_lambda_layer() {
  cd app/lambda/layer/prisma

  # Cleanup
  echo "Cleaning up workspace ..."
  rm -rf output

  # Npm Clean install
  npm ci
  find node_modules -exec touch -d '1985-10-21 09:00:00' {} \;

  # Generate Prisma
  npm run generate

  # Create layer
  echo "Creating layer ..."
  mkdir -p tmp/nodejs/node_modules/.prisma
  mkdir -p tmp/nodejs/node_modules/@prisma

  # Copy Prisma Client
  echo "Prepare Prisma Client lambda layer ..."
  cp -r node_modules/.prisma/client tmp/nodejs/node_modules/.prisma
  cp -r node_modules/@prisma tmp/nodejs/node_modules

  # Remove Prisma CLI
  echo "Remove Prisma CLI..."
  rm -rf tmp/nodejs/node_modules/@prisma/cli

  # Remove Prisma native binaries
  echo "Remove Prisma native binaries..."
  rm -rf tmp/nodejs/node_modules/.prisma/client/*darwin* || true
  rm -rf tmp/nodejs/node_modules/.prisma/client/*windows* || true
  rm -rf tmp/nodejs/node_modules/.prisma/client/*debian* || true
  rm -rf tmp/nodejs/node_modules/@prisma/engines || true

  # Compress
  echo "Compressing ..."
  cd tmp
  zip -rqX output.zip . && mv output.zip ./../output.zip
  cd ..

  # Cleanup
  echo "Remove unzipped files ..."
  rm -rf tmp
  rm -rf node_modules

  # Output
  echo "Stats:"
  md5 output.zip
  ls -lh output.zip

  cd ../../../..
}

prepare_prisma_lambda_layer
