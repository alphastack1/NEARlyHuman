# Application integration contract

The frontend calls the typed client in src/app/api.ts. It sends no provider key, arbitrary candidate list, state mutation, external URL or worker authority.

- Public config exposes only network/address/model/multiplier.
- Challenge + wallet message signature creates a short server session; this is not payment. Session is scoped to account and chain. A changed account/network clears it.
- Rooster lists/current state are read from the canonical contract, bounded/paged. API shapes are in the client.
- Quote reserves capacity before returning a signed AdmissionPermit. permit values use decimal strings across JSON; src/chain/permit.ts normalizes them losslessly. Value is processing plus mint; totalEstimate adds estimated owner network gas. First-day retry has no delivery/new mint charge.
- Frontend broadcasts through the wallet using mint/requestDay and then posts only the hash to accept. The server verifies the canonical event and creates/resumes the funded request. No accepted request can be canceled by closing a menu.
- Job reads never buy inference. Wake only resumes the existing accepted obligation. A local AI failure remains recording_failure until chain terminal/release is confirmed.
- Replay returns a verified saved DayResult; it never generates a new day. Ready requires matching canonical commitment. Outcome is the compact chain fallback and returns truthful care/memorial/trial routing.
- Expired release is a direct wallet/contract operation, gas only, strictly after the chain deadline. It remains available if the preparation backend is unavailable. Recheck canonical result before paid retry.

Server owns server/** and netlify/functions/**. UI owns src/app/** except api.ts, main.tsx and styles. Domain and renderer own their previously assigned paths. Communicate API changes before editing another owner's files.
