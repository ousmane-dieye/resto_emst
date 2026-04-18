#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Tuer les processus existants sur les ports
fuser -k 3001/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null
fuser -k 5174/tcp 2>/dev/null
sleep 1

echo "Démarrage de SmartResto ESMT..."
echo ""

echo "=== Backend (port 3001) ==="
cd "$SCRIPT_DIR/server" && node src/index.js &
BACKEND_PID=$!
sleep 2
echo "Backend PID: $BACKEND_PID"

echo ""
echo "=== Frontend (port 5173) ==="
cd "$SCRIPT_DIR/client" && npm run dev -- --port 5173 &
FRONTEND_PID=$!
sleep 2
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "=== SmartResto prêt ==="
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo ""
echo "Comptes test:"
echo "  admin@esmt.sn / admin123"
echo "  cuisinier@esmt.sn / cuisine123"
echo ""
echo "Pour arrêter: kill $BACKEND_PID $FRONTEND_PID"

wait