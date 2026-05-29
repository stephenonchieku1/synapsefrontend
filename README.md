# 🧠 Synapse — Voice-Guided Medicine Assistant (MVP)

Synapse is a voice-guided medicine assistant that allows users to search for medications or scan prescriptions/medicine labels to understand:

1. What the medicine is used for (in layman terms)
2. Brand-to-generic mappings (e.g. Priton → Chlorphenamine)
3. Drug class categorization (e.g. Antihistamine)
4. Safety & suitability warnings (who it might not be suitable for)
5. Complementary herbal alternatives
6. A spoken summary narration in **English** or **Kiswahili**

This repository contains two components:

| Component | Stack | Description |
|---|---|---|
| `backend/` | Python · FastAPI · Google Gemini | OCR, AI medical analysis, Speech Synthesis |
| `frontend/` | Next.js 16 · React 19 · TypeScript · Tailwind | Glassmorphic UI with interactive audio avatar |

---

## 📋 Prerequisites

Install these tools **before** starting. Expand each platform for specific instructions.

### Required for All Platforms

| Tool | Version | Download |
|---|---|---|
| **Python** | 3.10 or higher | https://python.org/downloads |
| **Node.js** | 18 or higher | https://nodejs.org |
| **Bun** *(recommended)* | latest | https://bun.sh |
| **Google Gemini API Key** | — | https://aistudio.google.com/app/apikey |

---

### 🪟 Windows — Additional Prerequisites

> **Tesseract OCR** is required for prescription/label scanning on Windows.

1. **Download and install Tesseract**:
   - Go to https://github.com/UB-Mannheim/tesseract/wiki
   - Download the latest **64-bit installer** (e.g. `tesseract-ocr-w64-setup-5.x.x.exe`)
   - Run the installer and note the install path (default: `C:\Program Files\Tesseract-OCR`)

2. **Add Tesseract to your PATH**:
   - Open **Start → Search → "Edit the system environment variables"**
   - Click **Environment Variables → System Variables → Path → Edit → New**
   - Add: `C:\Program Files\Tesseract-OCR`
   - Click **OK** on all dialogs

3. **Verify**:
   ```powershell
   tesseract --version
   ```

4. **PowerShell Execution Policy** (if you see script errors):
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

---

### 🍎 macOS — Additional Prerequisites

> macOS uses a native Swift-based OCR tool (built-in Vision framework — **no extra install needed**).

Optionally install Tesseract as a fallback via Homebrew:
```bash
brew install tesseract
```

Install **Xcode Command Line Tools** if not already present:
```bash
xcode-select --install
```

---

### 🐧 Linux — Additional Prerequisites

> Linux uses a pre-compiled OCR binary bundled in `backend/app/services/ocr_tool`.

Install Tesseract as a fallback:
```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y tesseract-ocr

# Fedora / RHEL
sudo dnf install tesseract

# Arch Linux
sudo pacman -S tesseract
```

Make sure the bundled binary is executable:
```bash
chmod +x backend/app/services/ocr_tool
```

---

## 🚀 Getting Started

### Step 1 — Clone the Repository

```bash
git clone https://github.com/stephenonchieku1/synapsebackend.git
cd synapse-mvp
```

---

## 🖥️ Backend Setup

### 🪟 Windows

```powershell
# 1. Navigate to backend
cd backend

# 2. Create a virtual environment
python -m venv .venv

# 3. Activate the virtual environment
.venv\Scripts\Activate.ps1

# 4. Install dependencies
pip install -r requirements.txt

# 5. Copy and configure environment variables
copy .env.example .env
notepad .env
```

Edit `.env` and set your key:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=8000
HOST=0.0.0.0
```

```powershell
# 6. Start the backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 🍎 macOS

```bash
# 1. Navigate to backend
cd backend

# 2. Create a virtual environment
python3 -m venv .venv

# 3. Activate it
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Copy and configure environment variables
cp .env.example .env
nano .env   # or: open -e .env
```

Edit `.env`:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=8000
HOST=0.0.0.0
```

```bash
# 6. Start the backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 🐧 Linux

```bash
# 1. Navigate to backend
cd backend

# 2. Create a virtual environment
python3 -m venv .venv

# 3. Activate it
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Copy and configure environment variables
cp .env.example .env
nano .env
```

Edit `.env`:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=8000
HOST=0.0.0.0
```

```bash
# 6. Ensure the OCR binary is executable
chmod +x app/services/ocr_tool

# 7. Start the backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

✅ The backend API will be live at **http://localhost:8000**  
📄 Interactive API docs: **http://localhost:8000/docs**

---

## 🌐 Frontend Setup

Open a **new terminal window** (keep the backend running).

### 🪟 Windows

```powershell
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies (choose one)
bun install        # recommended — faster
# npm install      # alternative

# 3. Configure environment
copy .env.example .env 2>nul || echo NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 > .env

# 4. Start the dev server
bun dev
# or: npm run dev
```

---

### 🍎 macOS

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
bun install        # recommended
# npm install      # alternative

# 3. Configure environment (already set by default)
# NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# 4. Start the dev server
bun dev
# or: npm run dev
```

---

### 🐧 Linux

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
bun install        # recommended
# npm install      # alternative

# 3. Check .env is configured
cat .env
# Should contain: NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# 4. Start the dev server
bun dev
# or: npm run dev
```

---

✅ The frontend will be available at **http://localhost:3000**

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key for AI analysis | `AIza...` |
| `PORT` | No | Port for the FastAPI server | `8000` |
| `HOST` | No | Host binding address | `0.0.0.0` |

> **Get your Gemini API key** at https://aistudio.google.com/app/apikey — it's free to start.

### Frontend (`frontend/.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | ✅ Yes | URL of the running backend server | `http://localhost:8000` |

---

## 🔍 OCR Platform Support

The backend automatically selects the right OCR engine based on the host OS:

| Platform | OCR Method | Notes |
|---|---|---|
| **Windows** | PowerShell script (`ocr.ps1`) via Windows.Media.Ocr | Built-in Windows OCR + Tesseract fallback |
| **macOS** | Swift binary (`ocr.swift`) via Vision framework | Native Apple Vision — no install needed |
| **Linux** | Compiled binary (`ocr_tool`) | Bundled binary + Tesseract fallback |

---

## ✅ Verifying the Setup

Once both servers are running:

1. Open **http://localhost:3000** in your browser
2. Type **"Priton"** or **"Paracetamol"** in the search bar and press **Search**
3. You should see:
   - ✅ Brand → generic name mapping
   - ✅ Drug class badge
   - ✅ Uses list in plain language
   - ✅ Suitability warnings
   - ✅ Natural alternatives
   - ✅ Spoken audio narration (ensure your sound is on)
4. Switch language to **SW** (top right) to test Swahili translation and narration

---

## 🗂️ Project Structure

```
synapse-mvp/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── database.py          # SQLAlchemy DB setup
│   │   ├── routes/              # API route handlers
│   │   └── services/
│   │       ├── ai_service.py    # Google Gemini AI integration
│   │       ├── voice_service.py # edge-tts speech synthesis
│   │       ├── ocr.ps1          # Windows OCR script
│   │       ├── ocr.swift        # macOS OCR script
│   │       └── ocr_tool         # Linux OCR binary
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/                     # Next.js app source
    ├── package.json
    └── .env
```

---

## 🛠️ Troubleshooting

### Backend won't start — `ModuleNotFoundError`
Make sure your virtual environment is **activated** before running pip or uvicorn:
- Windows: `.venv\Scripts\Activate.ps1`
- macOS/Linux: `source .venv/bin/activate`

### Tesseract not found on Windows
Confirm the path is in your system PATH and restart your terminal after adding it.

### Frontend shows "Cannot connect to backend"
Ensure the backend is running (`http://localhost:8000` is accessible) and `NEXT_PUBLIC_BACKEND_URL` in `frontend/.env` matches.

### `bun` command not found
Install Bun: `curl -fsSL https://bun.sh/install | bash` (macOS/Linux) or visit https://bun.sh for Windows instructions. Alternatively, use `npm` everywhere instead.

### OCR not working on macOS
The Swift OCR tool requires **macOS 13+** and Xcode Command Line Tools:
```bash
xcode-select --install
```

### Permission denied on Linux OCR binary
```bash
chmod +x backend/app/services/ocr_tool
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| AI Engine | Google Gemini API (`google-genai`) |
| OCR | Platform-native (Windows/macOS/Linux) + Tesseract |
| Backend Framework | FastAPI + Uvicorn |
| Text-to-Speech | `edge-tts` (Microsoft Edge voices) |
| Database | SQLite via SQLAlchemy |
| Frontend Framework | Next.js 16 + React 19 |
| Styling | Tailwind CSS v4 |
| Language | TypeScript (frontend) · Python 3.10+ (backend) |
| Package Manager | Bun (recommended) / npm |

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
