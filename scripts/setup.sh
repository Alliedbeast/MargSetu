#!/usr/bin/env bash
set -e
npm install
npm --prefix frontend install
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
printf '\nSetup complete. Run: npm run dev\n'
