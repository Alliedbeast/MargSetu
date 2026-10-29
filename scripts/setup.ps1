$ErrorActionPreference = 'Stop'

Write-Host "Setting up Marg Setu / SIH26002..."

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js 18+ is required." }
if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw "Python 3.11+ is required." }

npm install
Push-Location frontend
npm install
Pop-Location

python -m venv .venv
if ($IsWindows) {
  .\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
} else {
  ./.venv/bin/python -m pip install -r backend/requirements.txt
}

Write-Host "Setup complete. Run: npm run dev"
