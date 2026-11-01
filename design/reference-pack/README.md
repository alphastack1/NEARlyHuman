# RP-01 / RP-02 production reference diagrams

These standalone SVGs implement the provisional authoring coordinates in the scene map. They are developer construction references, not game screens, palette alternatives, final art, production collision maps or completed runtime checks.

- RP-01-home-bok-01-layout.svg: 32×28 tile home, exact zone/door/fixture/approach positions, proposed camera crops, and route overlay.
- RP-02-square-hud-care-bounds.svg: ordinary replay and care templates using the same 256×256 logical art square, with exact HUD/world/message/card bounds.

Static verification: all 17 interaction approaches and six doorway tiles are reachable from mailbox approach (20,24) on the floor/door grid; no listed approach or door overlaps a solid fixture. Both optional chair anchors were conservatively blocked during this check even though only one chair exists. Body-wash and garden-view spots are standing markers, not solid obstacles. This does not prove sprite collision width, animation contact, accessory bounds, depth/occlusion, contrast, fonts, hit areas or dynamic phone reflow.

The SVGs contain all their own geometry, styles and labels. They have no runtime imports, external fonts or dependencies on scratch files. The adjacent authoring script and static-check JSON are working material; only verified SVGs and this note need promotion to the permanent reference-pack location.

## Completed guide contracts

- [RP-03 identity/poses/contacts](RP-03-identity-and-contacts.md).
- [RP-04 camera/occlusion](RP-04-camera-and-occlusion.md).
- [RP-05 replay pacing](RP-05-replay-pacing.md).

These finish the guide-level contract. Actual native-source/contact/accessory, responsive and timing witnesses remain implementation-stage work.
