#!/usr/bin/env bash
# Build único para deploy em produção (ex: Render) como um serviço só:
# o backend Express serve tanto a API (/api/*) quanto o app mobile
# exportado para web (tudo mais).
#
# Uso (local, pra testar o build de produção):
#   bash render-build.sh
#   PORT=3333 DATABASE_URL=... ANTHROPIC_API_KEY=... JWT_SECRET=... node backend/dist/index.js
#
# No Render, configure:
#   Build Command: bash render-build.sh
#   Start Command: node backend/dist/index.js

set -euo pipefail
cd "$(dirname "$0")"

echo "==> [1/4] Instalando dependências do mobile"
cd mobile
# npm ci (em vez de npm install) respeita o package-lock.json à risca —
# evita que o instalador reresolva versões (o que já causou um conflito de
# peer dependency do react-dom em produção que não acontecia localmente).
npm ci

echo "==> [2/4] Exportando o app mobile para web (build de produção)"
# EXPO_PUBLIC_API_URL="" faz o app usar caminhos relativos (/api/...),
# resolvidos contra a própria origem — já que backend e web ficam no mesmo
# serviço/domínio em produção, isso evita CORS e não exige saber a URL final
# do serviço em tempo de build.
EXPO_PUBLIC_API_URL="" npx expo export --platform web --output-dir dist
cd ..

echo "==> [3/4] Instalando dependências do backend e compilando TypeScript"
cd backend
npm ci
echo "==> node: $(node --version) | npm: $(npm --version) | typescript: $(./node_modules/.bin/tsc --version)"
npm run build
cd ..

echo "==> [4/4] Copiando build web para backend/public"
rm -rf backend/public
mkdir -p backend/public
cp -r mobile/dist/. backend/public/

echo "==> Build concluído. Start command: node backend/dist/index.js"
