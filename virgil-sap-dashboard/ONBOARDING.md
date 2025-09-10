# Virgil SAP Dashboard — Onboarding

This guide helps new contributors get the app running locally.

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+ (to run the PowerPoint backend directly)
- PostgreSQL 

## Clone and install

```bash
# Clone
git clone <your-repo-url>
# Install JS deps from repo root
cd virgil-sap-dashboard
npm ci
python3.11 -m venv ../deck-template/venv311
source ../deck-template/venv311/bin/activate
pip install -r ../deck-template/requirements.txt
npm run dev
npm run dev:all #run deck-template with virgil-sap-dashboard
```

