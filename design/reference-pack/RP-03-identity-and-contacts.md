# RP-03 — identity, poses and contact guide

The visual guide uses BOK's upright magenta profile, yellow cap, red wing/beak, black tail and orange feet. [VR-01](../references/VR-01-approved-house-and-care.png) is the appearance reference; [condition/outcome studies](../mockups/final-pass/index.html#nh-095) extend its visual vocabulary without becoming native source data.

The source is a procedural 24×24 profile grid, with provisional feet pivot(12,23). Preserve the fixed grounded pivot while expanding transparent pose/accessory bounds; do not shrink hats or crop their top row. Right/left billboard convention applies: horizontal travel faces movement, vertical travel retains prior horizontal facing, contact chooses the readable profile.

Use the contacts in [direct consumption](../mockups/final-pass/index.html#nh-058), [baseline recovery](../mockups/final-pass/index.html#nh-061), [treatment](../mockups/chunk-04/index.html#nh-054), [garden](../mockups/final-pass/index.html#nh-059), [repair/craft](../mockups/chunk-04/index.html#nh-051) and [doorway](../mockups/final-pass/index.html#nh-067) references. Held props/particles are presentation, not persistent inventory/effects.

**Native implementation gate:** port the actual source trait revision/notices; correct upward top-row clipping and accessory-aware blink/sleep compositing. Verify all 30 accessory shapes across every shipping pose/facing and principal palette extremes at P320/P390, including tall/wide/face shapes. Generated redraws do not prove any of those source checks passed.
