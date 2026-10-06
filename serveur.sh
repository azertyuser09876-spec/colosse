#!/usr/bin/env bash
# Lance le serveur en ligne de Colosse (Node.js 18+ suffit, aucun paquet à installer).
cd "$(dirname "$0")" && exec node server/server.js
