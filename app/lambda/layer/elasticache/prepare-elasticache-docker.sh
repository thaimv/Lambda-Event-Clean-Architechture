#!/bin/bash

function prepare_elasticache_lambda_layer_docker() {
  cd app/lambda/layer/elasticache

  # Cleanup
  echo "Cleaning up workspace ..."
  rm -rf output.zip

  # Build using Docker
  echo "Building ElastiCache layer using Docker..."
  docker build -t elasticache-builder .

  # Extract the built layer
  echo "Extracting layer from Docker container..."
  docker run --rm -v "$(pwd):/output" elasticache-builder sh -c "cp /build/elasticache.zip /output/output.zip"

  # Cleanup Docker image (optional)
  echo "Cleaning up Docker image..."
  docker rmi elasticache-builder

  # Output stats
  echo "Stats:"
  if command -v md5 &> /dev/null; then
    md5 output.zip
  elif command -v md5sum &> /dev/null; then
    md5sum output.zip
  fi
  ls -lh output.zip

  cd ../../../..
}

prepare_elasticache_lambda_layer_docker
