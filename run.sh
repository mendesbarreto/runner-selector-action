#!/bin/bash
# Local testing script for runner-fallback-action
# Usage: ./run.sh

env "INPUT_PRIMARY-RUNNER=macos-m1-max-10-cores-local" \
  "INPUT_FALLBACK-RUNNER=ubuntu-latest" \
  "INPUT_GITHUB-TOKEN=$GITHUB_TOKEN" \
  "INPUT_CHECK-ORG-RUNNERS=true" \
  "GITHUB_REPOSITORY=$GITHUB_REPOSITORY" \
  node index.js
