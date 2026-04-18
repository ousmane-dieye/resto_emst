#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

fuser -k 3001/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null
sleep 1

echo "Démarrage de SmartResto ESMT..."
echo ""

echo "=== Backend (port 3001) ==="
screen -dmS backend bash -c "cd $SCRIPT_DIR/server && node src/index.js"
sleep 2
echo "Backend: http://localhost:3001"

echo ""
echo "=== Frontend (port 5173) ==="
screen -dmS frontend bash -c "cd $SCRIPT_DIR/client && npm run dev"
sleep 2
echo "Frontend: http://localhost:5173"

echo ""
echo "=== SmartResto prêt ==="
echo ""
echo "Comptes test:"
echo "  admin@esmt.sn / admin123"
echo "  cuisinier@esmt.sn / cuisine123"
echo ""
echo "Pour arrêter: screen -dr backend; screen -dr frontend"