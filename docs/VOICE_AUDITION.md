# Local Gemini TTS voice audition

Run this local-only command from the repository root:

```powershell
npm run voice:audition
```

It generates six fixed, non-crisis Indonesian lines for exactly three prebuilt
voices: `Sulafat`, `Achird`, and `Achernar`. It keeps the model fixed at
`gemini-3.8-flash-lite-tts` and places the delivery instruction only in
`speech_metadata.style`, never in the spoken text.

The command reads the existing local server-only `GEMINI_API_KEY` without
printing it. It writes 18 transient WAV files, a manifest, and `index.html`
under the operating system temporary directory, then prints the exact path.
Open `index.html` locally to audition by category and voice. No application
route, server endpoint, database, browser storage, cache, or production
configuration is involved.

The utility uses a conservative 16-second cadence and resumes files already
present in its output folder; it does not retry a failed provider request.
For a specific temporary folder, set `VOICE_AUDITION_OUTPUT_DIR` before
running it.

Review Indonesian pronunciation, rhythm, slang and code-switching, warmth,
calmness, intelligibility, synthetic/narrator/customer-service impression,
excessive cheerfulness or softness, and turn-to-turn consistency. Do not pick
a winner automatically; record a human decision before changing the fixed
production voice.
