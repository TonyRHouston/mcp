#!/usr/bin/env bash
set -euo pipefail

# Fixed session for consistent browser state across invocations.
SESSION="${PLAYWRIGHT_CLI_SESSION:-copilot}"

exec playwright-cli --session="$SESSION" "$@"
