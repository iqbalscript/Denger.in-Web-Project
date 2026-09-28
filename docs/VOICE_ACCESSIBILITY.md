# Voice accessibility V1

## Scope and cost

Voice is an optional accessibility layer for `/chat`; text chat remains fully usable when either browser capability is unavailable. V1 uses browser-native Web Speech APIs only:

- Speech-to-text (STT): `SpeechRecognition` or `webkitSpeechRecognition`
- Text-to-speech (TTS): `window.speechSynthesis` and `SpeechSynthesisUtterance`

The Dengar.in speech-provider, storage, and additional server-compute cost is **Rp0**. There is no speech API key, speech backend endpoint, audio file generation, database table, Supabase change, or Vercel speech service.

## Safety path

```
voice → final transcript → editable chat input → person presses KIRIM
      → existing deterministic crisis gate → existing /api/chat pipeline
      → validated assistant response → optional TTS
```

Recognition never submits text, calls `/api/chat`, routes to crisis, or awards gamification. A spoken crisis statement is only evaluated when the person explicitly submits the transcript, using the existing client and server deterministic crisis gates. TTS is available only on rendered assistant text that arrived through the existing validated response path. Crisis Hub has no TTS in V1.

## Privacy

Before the first microphone start in a mounted chat session, the UI displays:

> Suaramu diproses oleh fitur suara browser/perangkatmu. Dengar.in tidak menyimpan rekaman suara. Dukungan dan pemrosesan dapat berbeda tergantung browser.

Dengar.in does not request or receive a `MediaStream`, upload raw audio, log raw audio, store audio in `localStorage`, or include audio in recovery/backup data. The browser may use a device, operating-system, or vendor recognition service. In particular, some browser implementations use server-based recognition, so this feature makes no local-only, offline, or encrypted-audio claim.

Once the person explicitly presses **KIRIM**, the recognized text is handled exactly like typed text by the existing chat system; its normal text-processing and retention characteristics apply.

## Permissions Policy

The global policy stays restrictive:

```
camera=(), microphone=(), geolocation=(), payment=(), usb=()
```

Only `/chat` sends this later route-specific policy:

```
camera=(), microphone=(self), geolocation=(), payment=(), usb=()
```

This permits the top-level Dengar.in `/chat` document to ask for microphone access after a person explicitly starts voice input. Camera, geolocation, payment, and USB remain disabled. All other routes retain `microphone=()`.

## Browser support and fallback

TTS and STT are detected separately after client hydration:

- TTS is broadly available, but an Indonesian installed voice is not guaranteed. The app prefers `id-ID`, then another `id` voice, then lets the browser use its default.
- STT has limited and inconsistent support. Chromium browsers commonly expose a prefixed compatibility API; Safari support also varies; Firefox users should expect the text fallback unless their browser exposes the API.
- Browser, device, permission, network, language-pack, and vendor-service conditions can change at runtime.

If STT is unavailable, the microphone button is not shown and the person can continue typing. If TTS is unavailable, no listen button is shown. Missing capability never blocks page rendering or the normal text chat flow.

## Interaction and cleanup

The microphone starts only through an explicit **Bicara** action followed by the first-use disclosure confirmation. The interface exposes a visible listening status and **Berhenti** control. Permission denial, no speech, aborted, network, and generic errors leave the editable text path available.

TTS has explicit **Dengarkan** and **Berhenti** controls. Starting one message cancels any previous utterance. Recognition is aborted and synthesis is cancelled when the chat component unmounts or the person navigates away.
