# Workspace conventions

- Keep the repository tidy. Use `TEMP/` for temporary working files, exploratory scripts, logs, intermediate outputs, and other scratch material.
- `TEMP/` is gitignored. Its entire contents may be deleted by the user once the work is complete.
- Once an output is finished, tested where appropriate, and verified, move the permanent result into its appropriate project location outside `TEMP/`.
- Permanent source code, configuration, documentation, assets, and build processes must not depend on anything in `TEMP/`.
- Keep production pushes infrequent: pushing to `main` triggers a Netlify deployment and consumes the user's credits.

# Rooster artwork

- The owner's procedural rooster artwork in `src/art/rooster.ts` and `src/art/rooster-data.ts` is canonical. Use its existing generator for the in-game rooster and preserve its seeded shape, palette, accessories and poses.
- Do not redraw or substitute the rooster artwork unless the owner explicitly requests that change. Visual improvements should focus on environments, lighting, rendering and UI around the original artwork.
