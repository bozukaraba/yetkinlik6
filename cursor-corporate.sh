#!/bin/bash
export NODE_TLS_REJECT_UNAUTHORIZED=0
export NODE_EXTRA_CA_CERTS="$HOME/.cursor/corp-root-ca.crt"
export ELECTRON_ENABLE_LOGGING=1
exec /Applications/Cursor.app/Contents/MacOS/Cursor "$@" 