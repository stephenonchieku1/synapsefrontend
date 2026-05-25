# Synapse Frontend

This is the Next.js frontend client for Synapse, a voice-guided medicine assistant.

## Tech Stack
* Next.js (App Router)
* Tailwind CSS
* TypeScript
* Lucide React (Icons)
* HTML Audio API for voice synthesis narration

---

## Getting Started

First, make sure the [backend server](../backend/README.md) is running.

1. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

2. Create a `.env` file in this directory and specify the backend API URL:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

3. Run the development server:
   ```bash
   bun dev
   # or
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

For complete project details and backend instructions, refer to the [Root README](../README.md).
