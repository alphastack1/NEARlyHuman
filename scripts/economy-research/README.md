# Standalone V2 economy experiments

These small reference models support [the economy's design research](../../docs/economy-v2/RESEARCH.md). The [current economy guide](../../docs/ECONOMY.md) describes the later implementation. These models are not game runtime, contract implementations, a test framework, Jev playtests or token-value forecasts. They use Python's standard library and Node built-ins; no network, wallet or credentials are accessed.

Run from the repository root with Python 3.10+ and the project's Node installation:

```powershell
python -B scripts/economy-research/production/integrated_model.py
python -B scripts/economy-research/production/layout_sweep.py
python -B scripts/economy-research/production/currency_crosscheck.py
python -B scripts/economy-research/currency/model.py
node scripts/economy-research/settlement/model.mjs
```

Each command creates its output directory under `TEMP/economy-research/`. The `-B` option avoids Python cache files beside the permanent source. No permanent code/build depends on generated files. Deleting TEMP does not delete an input, accepted rule, frozen profile or saved evidence. No npm/build/test script runs these automatically.

- `production/integrated_model.py`: deterministic care/inventory schedules, all catalog variants and representative treatment/self-use/imperfect policies. Full selected daily traces are temporary outputs.
- `production/layout_sweep.py`: 350 finite heuristic schedules, including all 70 four-slot production-class multisets. Not exhaustive policy optimization.
- `production/currency_crosscheck.py`: independent six-decimal integer first-250-token thresholds and 36 optional birth-seed sensitivity checks. Imports the production model, not the currency implementation.
- `currency/model.py`: 35 comparative issuance/reinvestment scenarios, plus exact integer money/refill witnesses. Uses only adjacent frozen `profiles.json`, containing four 2,190-day physical shipment profiles. Comparative cohort arithmetic uses floats; production money must not.
- `settlement/model.mjs`: 35 bounded economy/ownership witnesses, rounding pairs and tiny bucket-state exploration. Terminal fixtures stand for a separate canonical biological reducer and do not implement it.

The frozen profiles were independently regenerated from the preserved production rules and compared before promotion. Their metadata identifies the permanent source. Editing productive rules requires regenerating/reviewing those profiles deliberately, not continuing to call old profiles evidence for new behavior.

Compact verified results are in `docs/economy-v2/`. Model output may contain more detail than the permanent evidence, such as complete action/need traces and cohort snapshots. The models should be rerun only after a meaningful rule change or to resolve a defined uncertainty; they are evidence for decisions, not the development goal.
