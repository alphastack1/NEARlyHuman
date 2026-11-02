"""Broader deterministic scheduler sweep; not a full policy optimization proof."""
import itertools
import json
from integrated_model import Model, OUT

rows = []
top = []
# Distinct production schedules; cosmetic/own-use variants do not affect a
# pure shipping policy. Canonical seed order is deliberately kept explicit.
classes = ['tree', 'grape', 'rose', 'blueberry', 'strawberry']
for layout_tuple in itertools.combinations_with_replacement(classes, 4):
    layout = list(layout_tuple)
    for policy in ['immediate', 'batch']:
        for recipe in (['spoon', 'toy_boat', 'birdhouse', 'large_chest'] if 'tree' in layout else ['spoon']):
            result = Model(layout, policy=policy, recipe=recipe, capture_trace=False).run()
            row = {k: result[k] for k in ['layout', 'policy', 'recipe', 'totalPointsShipped', 'pointsPerDay', 'firstShipmentDay', 'firstCraftDay', 'minimumPercent', 'normalRoutineUseFraction', 'careFloorIntact', 'mainCounts']}
            rows.append(row)
            top.append(result)
            top.sort(key=lambda x: x['totalPointsShipped'], reverse=True)
            top = top[:5]
assert all(r['careFloorIntact'] for r in rows)
rows.sort(key=lambda x: x['pointsPerDay'], reverse=True)
report = {'scope': 'All70 four-slot production-class multisets, canonical planting order, two deterministic main heuristics and four craft goals where relevant. All365day integrated care/inventory models. Not a complete search over ordering, state or Jev policies.',
          'cases': len(rows), 'rows': rows, 'top5CompletePointTraces': top}
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'layout-sweep.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'cases': len(rows), 'top10': rows[:10]}, indent=2))
