#!/bin/bash
# Ejecutá esto UNA vez en la terminal de Cursor (o Terminal.app):
#   bash scripts/push-to-github.sh

set -e
cd "$(dirname "$0")/.."

echo "→ Subiendo a GitHub (ignaciochauvie7-ops/pupi)..."
git push origin main

echo ""
echo "✓ Listo. Verificá:"
git status
echo ""
echo "https://github.com/ignaciochauvie7-ops/pupi"
