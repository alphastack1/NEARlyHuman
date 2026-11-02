"""Independent integer payout threshold check; no currency model code imported."""
import json
from integrated_model import Model, OUT, SPEC

U = 10**6
K = 50_000 * U
M = 250 * U

def threshold(points):
    issued = 0
    previous = 0
    for day, p in enumerate(points, 1):
        d = round(p * 10)
        payout = d * U * K // (10 * (K + issued))
        previous = issued
        issued += payout
        if issued >= M:
            return dict(day=day, previousTokens=previous/U, crossingTokens=issued/U,
                        rawBasePoints=sum(points[:day]), integerArithmetic=True)
    return None

def run_profile(name, birth_seed=None):
    if name == 'best_observed':
        sim = Model(['tree']*3+['strawberry'], policy='batch', recipe='toy_boat', capture_trace=False)
    else:
        sim = Model(['tree','strawberry','lavender','apple'], recipe='cycle',
                    self_use=name != 'plain_stress',
                    incident_every=7 if name in ('plain_stress', 'cozy_stress') else 0,
                    capture_trace=False)
    if birth_seed:
        key = 'seed_' + birth_seed
        sim.stock[key] += 1
        sim.initial[key] += 1
    result = sim.run()
    return dict(threshold=threshold(result['pointsByGameDay']),
                total365Points=result['totalPointsShipped'], firstShipmentDay=result['firstShipmentDay'],
                seedDelivered=sum(v for k,v in result['delivered'].items() if k.startswith('seed_')),
                needFloors=result['minimumPercent'], points=result['pointsByGameDay'])

report = {'scope': 'Six-decimal integer token payout cross-check of one fixed NFT in an otherwise empty economy, current pressure quoted per accepted game day, all shipments banked until first250tokens. K50000, no seed/product purchases, no other burns, no external issuance, no reinvestment before first threshold. Not gas payback or a live outcome.',
          'tokenDecimals': 6,
          'originalBirth': '3bread+3water; no planted plots, no productive seed, wood or finished products. Day1 kit supplies the first seed, and planting begins Day1.',
          'extraBirthSeed': 'One nontradeable seed/sapling added to the initial pantry; plot remains empty; first water/growth still needs an actual plant action. All9 possible seed choices checked.',
          'profiles': {}}
for name in ['best_observed','plain_stress','cozy','cozy_stress']:
    baseline = run_profile(name)
    changes = {}
    for species in SPEC:
        modified = run_profile(name, species)
        changes[species] = dict(threshold=modified['threshold'], total365Points=modified['total365Points'],
                                firstShipmentDay=modified['firstShipmentDay'],
                                difference365=round(modified['total365Points']-baseline['total365Points'], 1),
                                pointsIdentical=modified['points'] == baseline['points'],
                                seedDeliveriesDifference=modified['seedDelivered']-baseline['seedDelivered'])
    report['profiles'][name] = {'baseline': {k:v for k,v in baseline.items() if k != 'points'}, 'birthSeedChecks': changes}
OUT.mkdir(parents=True, exist_ok=True)
(OUT/'currency-crosscheck.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({n: {'baseline':v['baseline'], 'birthSeedNonidentical':{k:c for k,c in v['birthSeedChecks'].items() if not c['pointsIdentical']}} for n,v in report['profiles'].items()},indent=2))
