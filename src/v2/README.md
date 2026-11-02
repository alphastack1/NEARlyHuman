# V2 life kernel

This module is the isolated V2 authority reference. The live V1 entrypoints are not redirected here yet. It imports no old domain engine, scratch data, wallet or network service.

- `types.ts` fixes the34-item catalog,39 action IDs, owned state and trace shapes.
- `state.ts` constructs a newborn, validates bounds/kits and provides the shared32-bit labeled draw.
- `catalog.ts` defines finite crops/crafts, personal uses and the maximum four-unit shipment bound.
- `kernel.ts` derives the complete day: care, house/material consumption, primary episodes, phase loss, finite growth and legitimate death. Its output is a state and integer shipment **decipoints**, never a caller-supplied purse/reward.
- `codec.ts` uses the same ABI tuples as the Solidity port. Canonical decoding rejects trailing/alternative bytes rather than silently hashing a different object.
- `rescue.ts` constructs one conservative positive care certificate. It does not claim to find every possible rescue; the verifier rechecks any returned path.

The opcode count is an internal vocabulary, not a daily action list. A normal day still has one substantial project and five ordinary choices, with separately bounded acute responses. This version retains essential domestic work but does not expose V1's separate bandage-on-chair or drip-diversion variants; their reserved house flags do not grant another action.

The money controller separately owns current NFT ownership, request status/revision/deadline, reward quotes, issuance pressure, reservations and backed purses. `State.seed` is the immutable life/appearance identity; `Context.seed` is the accepted day seed.

## Preparing a recorded day

Call `openDay(base,kit,acceptedSeed,shippingAllowed,goal)`. For each slot1..60:

1. If needed, call `previewPrimary(context,slot)`. This returns an owned hypothetical post-onset context, not authority to change the real day.
2. For a harmful proposal, ask `buildCareCertificate(proposal.context)` for a valid path, or provide no certificate for conservative softening.
3. Call `beginSlot(context,slot,certificate)` before asking for a choice. Current needs/conditions now include the admitted automatic episode.
4. Select a member of `legalActions(context)` at a real action opportunity. Use `undefined` only for an implicit interlude. An explicit `Op.Quiet` is still an ordinary choice and consumes that opportunity.
5. Call `endSlot(context,selectedStep)`. It applies the action, phase consequences and any living bedtime atomically to this provisional context. No step may follow a derived terminal result.

Call `finishDay` only at a complete living day or derived terminal prefix. A living day with a nonempty uncollected parcel is invalid. An incomplete provider attempt does not become a canonical state. Alternatively `replayDay` performs the whole deterministic replay from the base, kit, trace, accepted seed and certificate.

`Context.open` prevents accidental duplicate clock application. Receipt `before` includes the state before that slot's automatic onset, so displayed deltas do not hide an incident. Context and receipts contain plain owned values; no external storage handles are cloned.

## Certificate bounds

A certificate covers the remaining current day and exactly two future bedtimes. Its step slots use day offsets: current1..60, next61..120, final121..180. Two future kit masks obey the same supply rules. All actual opportunity limits, pickup timing and crossed deadlines apply. Only deterministic care and already known acute responses are allowed; no shipment, production, purse operation, lucky task roll or invented future harvest may appear.

Future random proposals and the separate structural exception are excluded from the certificate claim. Existing contamination is conservatively exposed rather than assuming a favorable future draw. The end must be alive, fed, hydrated, rested and clear of active clinical/exposure conditions. The hypothetical state is discarded; its kits/growth/recovery never leak into the actual day.

## Choice facts

Candidate `chanceBps` is mechanical success chance, not Jev's choice probability. Nominal `recovery` and declared `energy` are independent of the known future draw. `possibleFailures` describes separate exposure/complication risks; e.g. raw food consumption succeeds while still carrying a25% illness-exposure risk. Money quotes depend on the accepted controller pressure and should filter a zero-token shipment before presenting it to Jev.
