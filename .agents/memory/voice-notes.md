---
name: Voice notes implementation
description: How voice recording/playback is implemented in ChatPage and GroupChatPage.
---

# Voice Notes

## Architecture
- **Recording:** Browser `MediaRecorder` API (`audio/webm` preferred, `audio/ogg` fallback)
- **Storage:** Supabase `voice-messages` bucket (public) — DMs at `{userId}/{ts}.webm`, group at `group/{userId}/{ts}.webm`
- **Delivery:** GetStream `sendMessage` with `attachments: [{ type: 'voice', asset_url, url }]`
- **Playback:** `new Audio(url)` stored in `audioRefs` ref map, toggled play/pause by message id

## State
Both pages add: `isRecording`, `recordingTime`, `uploadingVoice`, `playingId`, `voiceError`
Refs: `mediaRecorderRef`, `audioChunksRef`, `recordingTimerRef`, `audioRefs`

## Unmount cleanup
Both pages have a dedicated `useEffect(() => () => { ... }, [])` that:
- Clears `recordingTimerRef` interval
- Stops the `MediaRecorder` if still active
- Pauses and clears `src` on all `audioRefs` entries

## GroupChatPage message mapping
`mapGroupMsg()` helper inside `openRoom()` reads `attachments[0]` for `type==='voice'` — applied to both history (`state.messages`) and `message.new` events.

## Message type check constraint (DB)
- `messages.type` check: `'text' | 'image' | 'voice' | 'emoji' | 'file'`
- `group_messages.type` check: `'text' | 'image' | 'video' | 'audio' | 'file' | 'system'`

**Why:** `messages` uses `'voice'`; `group_messages` uses `'audio'` — they are inconsistent. DM voice attachments are not stored in the Supabase `messages` table at all (they go through GetStream); only group voice could be stored there.
