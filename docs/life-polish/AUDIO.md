# A little sound, with room for quiet

The old V1 renderer synthesized short action/step tones and exposed a mute control. The V2 renderer disabled Phaser audio and had no matching sound service. This pass adds the small standalone [V2 audio service](../../src/app/v2/audio.ts); PM owns its interface and playback wiring.

The score is original and generated in the browser. There are no downloaded music files, media requests or asset-loading delay. A soft triangle voice through a low-pass filter plays short selection/back/confirmation sounds. Parcel, project and completed-day moments have small answers rather than a continuous stream of footsteps. The musical phrase has six melody notes, two lower answers and substantial silence across 12.8 seconds. It runs only while the player is actually watching an active day.

## Integration contract

`createLifeAudio()` creates one silent scope per tab, disposing any previous scope. It opens no AudioContext until a player gesture calls `unlock()`. The [visit-level sound provider](../../src/app/v2/LifeSound.tsx) creates it in a mount effect, saves it in a ref and disposes that exact scope in the effect cleanup; that also handles React's repeated development lifecycle. It wraps both the Journey and development diagnostic player without recreating sound when sheets change. `readLifeAudioPreference()` supplies initial UI state without creating audio.

- `enabled` reads the current setting. `setEnabled(boolean)` persists the V2 preference, honoring the old `nh:sound` mute flag when no new preference exists.
- `unlock(): Promise<void>` is called from a gesture. Queue one cue in its completion if a first-click sound is wanted. Unsupported/denied audio remains quiet without an application error.
- `setPlaying(boolean)` follows actual film play/pause/menu suspension. It starts or stops the sparse music, without changing any game fact.
- `cue('select' | 'back' | 'confirm' | 'parcel' | 'project' | 'day')` emits only after unlock. Repeated cues are rate-limited and scheduled voices are capped at six.
- `dispose()` disconnects/stops voices, clears the timer and closes the owned context.

Mute, hidden-page notification and disposal stop all voices and cancel pending unlock authority. Returning from a hidden page remains quiet until another gesture. An off gesture cannot be undone by an older async resume. A subsequent explicit on gesture can retry that interrupted unlock without making another context. The master gain is zero while muted; no future scheduled note can revive it.

## Focused proof

[The actual WebAudio report](audio-proof.json) exercises eleven defined boundaries in one owned Codex Browser page: no context before gesture; actual gesture unlock; immediate mute; hidden event; quiet return; cue bounds; old-scope retirement; pending-resume mute; later explicit on; persisted off; pending-resume disposal. It records zero JavaScript errors. The audio-context, oscillator and gain nodes are real. Only the deferred resume used for races is controlled.

The automation surface did not report `document.hidden` after activating a second owned tab. That branch therefore uses a controlled `document.hidden` value and `visibilitychange` event. It proves the service's visibility response, not a physical browser-window transition. Page-local memory storage leaves the user's profile preferences untouched. All owned tabs are closed.

An actual OfflineAudioContext rendered the same exported score, note scheduler, master level and low-pass mix to a 13.8-second PCM preview. The mixed preview peaks at **0.0236** (about −32.5 dBFS), has **zero clipped samples**, and spends about **69%** of its samples near silence. Its aggregate RMS is **−59.0 dBFS**, including the intentional gaps. Individual UI cues finish within **65–494 ms**. This is intentionally restrained; output-device loudness is not inferred from these digital measurements.

The generated [reference WAV](audio/quiet-preview.wav) is preserved outside TEMP and is not a runtime dependency. No human-listening claim is made by this proof. Application type checking passed after service implementation and again after the PM integrated the final sound controls and player behavior.

Two tooling observations were resolved while verifying: oscillator `ended` callbacks can wait behind context suspension, so the proof tracks explicit immediate stop separately; and mute now clears the master automation timeline and sets its intrinsic value to zero before suspension. Failed provisional records stay in TEMP. No wallet, application write, inference call or chain transaction occurred.
