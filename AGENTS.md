# Workspace conventions

- Keep the repository tidy. Use `TEMP/` for temporary working files, exploratory scripts, logs, intermediate outputs, and other scratch material.
- `TEMP/` is gitignored. Its entire contents may be deleted by the user once the work is complete.
- Once an output is finished, tested where appropriate, and verified, move the permanent result into its appropriate project location outside `TEMP/`.
- Permanent source code, configuration, documentation, assets, and build processes must not depend on anything in `TEMP/`.
- Keep production pushes infrequent: pushing to `main` triggers a Netlify deployment and consumes the user's credits.
