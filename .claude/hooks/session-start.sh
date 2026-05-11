#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Kill any existing server on port 8080
pkill -f "python3 -m http.server 8080" 2>/dev/null || true

# Start static file server in background
cd "$CLAUDE_PROJECT_DIR"
nohup python3 -m http.server 8080 > /tmp/milk-sky-server.log 2>&1 &

sleep 1

if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/milk-sky.html | grep -q "200"; then
  echo "milk-sky server running at http://localhost:8080/milk-sky.html"
else
  echo "Warning: server may not have started — check /tmp/milk-sky-server.log"
fi
