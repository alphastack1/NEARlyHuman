# NEARlyHuman mockups — chunk 01

Open [index.html](index.html) for the local review gallery. It uses no external fonts, libraries, scripts, or network services. Images remain whole boards and can be opened at full resolution.

This chunk contains **nine boards / nineteen panels**: eight pairs of square UI scenes and one three-state stove reference. It covers a useful subset of the complete map; it does not complete all 121 UI states.

| Board | Image | Mapped coverage |
| --- | --- | --- |
| NH-001 | [Core anchors](NH-001-core-anchors.png) | UI-08C kitchen; UI-05F bedroom care composition |
| NH-002 | [Arrival and hatch](NH-002-arrival-hatch.png) | UI-01A; UI-02A |
| NH-003 | [Birth and stock](NH-003-birth-stock.png) | UI-03B; UI-03B-STARTER |
| NH-004 | [Zero versus three additions](NH-004-delivery-zero-three.png) | UI-05A; UI-05F |
| NH-005 | [Water inspection](NH-005-water-inspection.png) | UI-05D / ITEM-water; UI-05D-INSPECT |
| NH-006 | [Preparation and saving](NH-006-preparing-saving.png) | UI-06D; UI-06H |
| NH-007 | [Saved day and replay](NH-007-saved-replay.png) | UI-07A; UI-08B |
| NH-008 | [Brain modes](NH-008-brain-modes.png) | UI-06E-PIN; UI-08H-PIN |
| NH-009 | [Stove states](NH-009-stove-states.png) | OBJ-STOVE intact / damaged / wood-patched; H10, WS-08-F01, WS-23-F05 |

Use the [scene map](../../SCENE_MAP.md) for quantitative rules and exact behavior, [RP-01](../../reference-pack/RP-01-home-bok-01-layout.svg) for the provisional home/anchor plan, and [RP-02](../../reference-pack/RP-02-square-hud-care-bounds.svg) for logical HUD/care bounds. The original [VR-01](../../references/VR-01-approved-house-and-care.png) remains the style authority.

Known limitations to preserve in review:

- NH-001's right card may say Use stored supplies while three additions are selected. **NH-004 owns the zero-versus-three care composition.**
- NH-007's Watch the recorded day is supporting text, not a second action button.
- Generated rooms/camera crops approximate the connected home. Do not trace them into engine geometry or collision data.
- Actual sprites, precise source scale, contact animation, phone reflow, accessibility, and runtime behavior have not been validated by these images.
- Model/job data are illustrative. LV03 → next day 4 is a mainnet design fixture, not an eligible testnet fourth day.

All nine final selected boards were visually inspected by root and a reviewing subagent. Targeted corrections are present. The review found no further material issue beyond the documented copy/hierarchy notes; this is visual-reference acceptance, not implementation verification.

Read [BUILD_NOTES.md](BUILD_NOTES.md) for the review disposition, [PROMPTS.md](PROMPTS.md) for the built-in generation briefs/corrections, and [coverage.json](coverage.json) for explicit illustrated-versus-pending state accounting.

Files in this folder and design/reference-pack/ are permanent and do not depend on temporary working material. No deployment is required to review them.
