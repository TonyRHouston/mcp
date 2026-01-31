#!/usr/bin/env bash
set -euo pipefail

export STORAGE_TYPE="filesystem"
export MEMORY_FILE_PATH="$HOME/data/mcp-memory.json"
export MEMORY_FILTER_MODE="strict"

echo "$(date -Iseconds) - VS Code spawned mcp-memory-drive" >> /tmp/mcp-memory-drive.startup.log

node /home/web3tony/mcp/src/memory/dist/index.js
