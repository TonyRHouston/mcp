#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GCLOUD_FTP_ROOT="${GCLOUD_FTP_ROOT:-"$ROOT_DIR/gcloud-ftp"}"
GCLOUD_FTP_ENTRY="${GCLOUD_FTP_ENTRY:-"$GCLOUD_FTP_ROOT/dist/index.js"}"
MCP_FTP_ENTRY="${MCP_FTP_ENTRY:-"$ROOT_DIR/src/ftp/dist/index.js"}"

FTP_HOST="${FTP_HOST:-127.0.0.1}"
FTP_PORT="${FTP_PORT:-1821}"
FTP_USER="${FTP_USER:-user}"
FTP_PASS="${FTP_PASS:-user}"
GCLOUD_FTP_STARTUP_TIMEOUT="${GCLOUD_FTP_STARTUP_TIMEOUT:-20000}"
GCLOUD_FTP_LOG="${GCLOUD_FTP_LOG:-"$ROOT_DIR/gcloud-ftp.log"}"
ACCOUNT="${ACCOUNT:-default}"
GCLOUD_FTP_TOKEN="${GCLOUD_FTP_TOKEN:-"$GCLOUD_FTP_ROOT/cache/token-${ACCOUNT}.json"}"
GCLOUD_FTP_TOKEN_ALT="${GCLOUD_FTP_TOKEN_ALT:-"$ROOT_DIR/cache/token-${ACCOUNT}.json"}"

if [[ ! -f "$GCLOUD_FTP_ENTRY" ]]; then
  echo "gcloud-ftp entry not found: $GCLOUD_FTP_ENTRY" >&2
  echo "Build gcloud-ftp or set GCLOUD_FTP_ENTRY/GCLOUD_FTP_ROOT." >&2
  exit 1
fi

if [[ ! -f "$MCP_FTP_ENTRY" ]]; then
  echo "MCP FTP server entry not found: $MCP_FTP_ENTRY" >&2
  echo "Build the MCP FTP server or set MCP_FTP_ENTRY." >&2
  exit 1
fi

cleanup() {
  if [[ -n "${GCLOUD_PID:-}" ]] && kill -0 "$GCLOUD_PID" >/dev/null 2>&1; then
    kill "$GCLOUD_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

run_gcloud_foreground_for_auth() {
  echo "Starting gcloud-ftp in the foreground for OAuth..." >&2
  echo "Complete the browser flow, paste the code, then stop it with Ctrl+C." >&2
  export PORT="$FTP_PORT"
  export SERVER="$FTP_HOST"
  export FTP_USER
  export FTP_PASS
  (cd "$GCLOUD_FTP_ROOT" && node "$GCLOUD_FTP_ENTRY")
  if [[ ! -f "$GCLOUD_FTP_TOKEN" ]]; then
    if [[ -f "$GCLOUD_FTP_TOKEN_ALT" ]]; then
      mkdir -p "$(dirname "$GCLOUD_FTP_TOKEN")"
      cp "$GCLOUD_FTP_TOKEN_ALT" "$GCLOUD_FTP_TOKEN"
    fi
  fi
  if [[ ! -f "$GCLOUD_FTP_TOKEN" ]]; then
    echo "OAuth token still missing at $GCLOUD_FTP_TOKEN" >&2
    exit 1
  fi
}

echo "Starting gcloud-ftp..." >&2
auth_attempted=0
while :; do
  if [[ ! -f "$GCLOUD_FTP_TOKEN" ]] && [[ "$auth_attempted" -eq 0 ]]; then
    auth_attempted=1
    run_gcloud_foreground_for_auth
  fi

  (
    export PORT="$FTP_PORT"
    export SERVER="$FTP_HOST"
    export FTP_USER
    export FTP_PASS
    cd "$GCLOUD_FTP_ROOT"
    node "$GCLOUD_FTP_ENTRY"
  ) >"$GCLOUD_FTP_LOG" 2>&1 &

  GCLOUD_PID=$!

  timeout_sec=$((GCLOUD_FTP_STARTUP_TIMEOUT / 1000))
  timeout_sec=$((timeout_sec > 0 ? timeout_sec : 1))
  deadline=$((SECONDS + timeout_sec))

  ready=0
  while ((SECONDS < deadline)); do
    if ! kill -0 "$GCLOUD_PID" >/dev/null 2>&1; then
      echo "gcloud-ftp exited early. See $GCLOUD_FTP_LOG" >&2
      tail -n 50 "$GCLOUD_FTP_LOG" >&2 || true
      if [[ "$auth_attempted" -eq 0 ]]; then
        if command -v rg >/dev/null 2>&1; then
          if rg -q "Enter the code from that page here" "$GCLOUD_FTP_LOG"; then
            auth_attempted=1
            run_gcloud_foreground_for_auth
            continue 2
          fi
        else
          if grep -q "Enter the code from that page here" "$GCLOUD_FTP_LOG"; then
            auth_attempted=1
            run_gcloud_foreground_for_auth
            continue 2
          fi
        fi
      fi
      exit 1
    fi
    if (echo >"/dev/tcp/$FTP_HOST/$FTP_PORT") >/dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 0.25
  done

  if [[ "$ready" -ne 1 ]]; then
    echo "Timed out waiting for gcloud-ftp on $FTP_HOST:$FTP_PORT" >&2
    tail -n 50 "$GCLOUD_FTP_LOG" >&2 || true
    exit 1
  fi

  break
done

echo "gcloud-ftp is ready on $FTP_HOST:$FTP_PORT" >&2
echo "Starting MCP FTP server..." >&2

export GCLOUD_FTP_ROOT
export FTP_HOST
export FTP_PORT
export FTP_USER
export FTP_PASS
node "$MCP_FTP_ENTRY"
