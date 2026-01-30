#!/usr/bin/env bash
set -euo pipefail

export STORAGE_TYPE="googledrive"
export GOOGLE_DRIVE_CREDENTIALS="$(cat "$HOME/mcpc-485920-48a0ce66cec0.json")"
export GOOGLE_DRIVE_FILENAME="mcp-memory.json"
export GOOGLE_DRIVE_FOLDER_ID="1_fPYYG4QfEHL5D-3f0tVgEDefkB-BJ4I"

echo "$(date -Iseconds) - VS Code spawned mcp-memory-drive" >> /tmp/mcp-memory-drive.startup.log

node /home/web3tony/mcp/src/memory/dist/index.js
