---
name: Text stories & LiveKit toggle correctness
description: Pitfalls when adding text-type stories to the stories system, and correct LiveKit mute/camera toggle pattern.
---

## Text Stories — end-to-end wiring

When inserting a text story, `media_url` is empty and `media_type='text'`. All three of these things must happen together or viewers cannot see the story:

1. **DB select must include `text_content,bg_color`** in the stories query (not just media_url/media_type).
2. **ViewStory interface must carry `mediaType`, `textContent`, `bgColor`** fields.
3. **Every `setViewing(...)` call** (own story + others' stories) must pass `mediaType`, `textContent`, `bgColor` from the DbStory row.
4. **Viewer UI must branch on `viewing.mediaType === 'text'`** and render a gradient div with the text instead of an `<img>` or `<video>`.

Skipping any one of these steps causes text stories to silently render as broken images or nothing.

**Why:** The stories system was originally image/video only; adding a new media_type requires all four layers to be updated simultaneously — schema, fetch, state, render.

**How to apply:** Whenever adding a new story type, update all four layers before shipping.

## LiveKit Mute/Camera Toggle

Incorrect pattern (stale closure bug):
```tsx
<button onClick={async () => { setMuted(m => !m); await room.localParticipant.setMicrophoneEnabled(muted) }}>
```
The SDK call reads `muted` from the old closure — device state and UI state become inverted.

Correct pattern:
```tsx
<button onClick={async () => {
  const nextMuted = !muted
  setMuted(nextMuted)
  await room.localParticipant.setMicrophoneEnabled(!nextMuted)
}}>
```
Compute the next value first, apply to both React state and SDK in the same handler.

**Why:** React state updates are async; the closure captures the old value. Computing next state explicitly avoids the stale read.
