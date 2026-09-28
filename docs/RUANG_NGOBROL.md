# Ruang Ngobrol V1

Ruang Ngobrol is a turn-based browser voice interface at `/ruang-ngobrol`.
It is separate from Voice V1 in `/chat` and is not Gemini Live or native
audio-to-audio.

## Safety path

```
final browser SpeechRecognition transcript
  -> deterministic client crisis check
  -> existing POST /api/chat
  -> server context crisis screen + deterministic crisis gate
  -> existing orchestrator, provider, and output validation
  -> validated displayed text
  -> optional browser speechSynthesis
```

Client screening is defense-in-depth. The server performs its mandatory
deterministic checks before cache access or model orchestration. A client-side
crisis result never calls `/api/chat`; a server crisis result ends the room and
routes to `/crisis`.

## Privacy and storage

- Dengar.in does not record or upload raw microphone audio.
- Browser speech recognition may be processed by the browser or its vendor;
  the UI discloses this before microphone activation.
- Only cleared text is sent through the existing Dengar.in text AI pipeline.
- Captions and room history stay in React memory and are cleared on end or
  navigation. They are not written to browser storage, recovery, analytics,
  databases, or Supabase.
- Room requests send `noStore: true`, so the existing Redis AI-response cache
  is skipped for both reads and writes.

## Limits and compatibility

The room is capped at ten minutes per browser session. This is a wellbeing UI
boundary, not a substitute for the existing server-side rate limit. Speech
recognition and browser TTS degrade independently; text chat remains available
when either is unsupported or unavailable.

No Gemini Live WebSocket, browser Gemini key, token endpoint, audio endpoint,
or additional environment variable is used.

## Route security

`/ruang-ngobrol` has the same narrow header as `/chat`:

```
camera=(), microphone=(self), geolocation=(), payment=(), usb=()
```

Every other route remains covered by the deny-by-default microphone policy.
No CSP provider origin is added because all application requests remain
same-origin to `/api/chat`.
