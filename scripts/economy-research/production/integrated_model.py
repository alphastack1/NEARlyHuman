"""Reproducible V2 design experiment, not production rules or a Jev playtest.

Integer need units are 1/100 percent. Integer values are 1/10 base point.
The model checks real routine/main contention and delivered inventory. It does
not pretend to reproduce the current full incident/illness/death engine.
"""
from collections import Counter
from dataclasses import dataclass, asdict
from pathlib import Path
import json

OUT = Path(__file__).resolve().parents[3] / 'TEMP' / 'economy-research' / 'production'
WATER_LOSS = [700, 600, 700, 700, 600, 700]

# first growth ticks, output count, repeat ticks, decipoints, own-use need/gain
SPEC = {
    'daisy': (3, 1, 0, 65, 'morale', 1500),
    'marigold': (3, 1, 0, 65, 'morale', 1500),
    'lavender': (6, 1, 0, 95, 'morale', 2500),
    'rose': (8, 1, 0, 115, 'morale', 3500),
    'strawberry': (3, 1, 0, 65, 'food', 3000),
    'blueberry': (6, 1, 0, 95, 'food', 4000),
    'grape': (8, 6, 2, 40, 'food', 3500),
    'apple': (8, 6, 2, 40, 'food', 6000),
    'tree': (6, 10, 2, 0, None, 0),
}
FRUIT_WATER = {'strawberry': 1500, 'blueberry': 1000, 'grape': 2500, 'apple': 1000}
RECIPES = {'spoon': (3, 116), 'toy_boat': (6, 212), 'birdhouse': (8, 276), 'large_chest': (10, 340)}
VALUE = {k: v[3] for k, v in SPEC.items()} | {k: v[1] for k, v in RECIPES.items()}

@dataclass
class Plot:
    species: str
    ticks: int
    yields_left: int
    moisture: int = 2
    dry_days: int = 0
    ready_since: int = 0


class Model:
    def __init__(self, layout, policy='batch', recipe='large_chest', incident_every=0,
                 imperfect=None, self_use=False, days=365, capture_trace=True):
        self.layout = layout
        self.policy, self.recipe = policy, recipe
        self.incident_every, self.imperfect = incident_every, imperfect
        self.self_use, self.days = self_use, days
        self.capture_trace = capture_trace
        self.plots = [None] * 4
        self.stock = Counter({'bread': 3, 'water': 3})
        self.needs = dict(food=10000, water=10000, morale=10000, energy=10000)
        self.minima = self.needs.copy()
        self.initial = self.stock.copy()
        self.delivered, self.consumed, self.produced, self.shipped = [Counter() for _ in range(4)]
        self.counts, self.main_counts = Counter(), Counter()
        self.bank, self.wilted, self.wet_ticks = 0, 0, 0
        self.trace, self.events, self.checks = [], [], []
        self.pending_treat = []
        self.alive, self.low_need_ticks = True, 0
        self.wood_used = 0
        self.first_harvest = self.first_ship = self.first_craft = None
        self.max_stock_units, self.max_finished_units = 6, 0
        self.peak_ship_points = self.max_wet_slots = 0

    def consume(self, key, amount=1):
        assert self.stock[key] >= amount, (self.day, key, self.stock)
        self.stock[key] -= amount
        self.consumed[key] += amount

    def gift(self):
        # The owner can omit surplus care items; never deliver a second seed.
        kit = [k for k in ('bread', 'water') if self.stock[k] < 4]
        if self.incident_every and self.day % self.incident_every == self.incident_every - 1:
            kit += ['medicine']
        elif self.incident_every and self.day % self.incident_every == 0:
            kit += ['bandage']
        else:
            for i, plot in enumerate(self.plots):
                key = 'seed_' + self.layout[i]
                if plot is None and self.stock[key] < sum(p is None and s == self.layout[i] for p, s in zip(self.plots, self.layout)):
                    kit += [key]
                    break
        assert len(kit) <= 3 and len(kit) == len(set(kit))
        for item in kit:
            self.stock[item] += 1
            self.delivered[item] += 1
        return kit

    def finished(self):
        return [k for k in VALUE if VALUE[k] and self.stock[k] > 0]

    def exportable(self):
        units = {k: self.stock[k] for k in self.finished()}
        if self.self_use:
            # One household flower and one fruit, not one of every species.
            flowers = [k for k in units if k in SPEC and SPEC[k][4] == 'morale']
            fruit = [k for k in units if k in FRUIT_WATER]
            if flowers: units[max(flowers, key=lambda k: SPEC[k][5])] -= 1
            if fruit: units[min(fruit, key=lambda k: VALUE[k])] -= 1
        return {k: v for k, v in units.items() if v}

    def main_choice(self):
        ready = [i for i, p in enumerate(self.plots) if p and p.ticks == 0]
        empty = [i for i, p in enumerate(self.plots) if p is None and self.stock['seed_' + self.layout[i]] > 0]
        recipe = list(RECIPES)[sum(self.produced[r] for r in RECIPES) % 4] if self.recipe == 'cycle' else self.recipe
        craft = self.stock['wood'] >= RECIPES[recipe][0]
        if self.policy == 'immediate':
            if ready: return ('harvest', ready)
            if craft: return ('craft', recipe)
            if empty: return ('plant', empty[0])
        else:
            if empty: return ('plant', empty[0])
            oldest = max((self.day - self.plots[i].ready_since for i in ready), default=0)
            if ready and (len(ready) >= 2 or oldest >= 2): return ('harvest', ready)
            if craft: return ('craft', recipe)
            if ready:
                # Hold a lone yield at most two days to align a physical round.
                if not any(p and 0 < p.ticks <= 2 for p in self.plots): return ('harvest', ready)
        return ('quiet', None)

    def do_main(self, choice):
        action, arg = choice
        if action == 'plant':
            species = self.layout[arg]
            self.consume('seed_' + species)
            first, total, *_ = SPEC[species]
            assert self.plots[arg] is None
            # Proposed coherent planting sequence includes initial well water.
            self.plots[arg] = Plot(species, first, total)
        elif action == 'harvest':
            if self.first_harvest is None: self.first_harvest = self.day
            for i in arg:
                p = self.plots[i]
                assert p and p.ticks == 0
                item = 'wood' if p.species == 'tree' else p.species
                self.stock[item] += 1
                self.produced[item] += 1
                p.yields_left -= 1
                if p.yields_left == 0: self.plots[i] = None
                else:
                    p.ticks = SPEC[p.species][2]
                    p.ready_since = 0
        elif action == 'craft':
            if self.first_craft is None: self.first_craft = self.day
            wood = RECIPES[arg][0]
            self.consume('wood', wood)
            self.wood_used += wood
            self.stock[arg] += 1
            self.produced[arg] += 1
        if action != 'quiet': self.needs['energy'] -= 300
        self.main_counts[action] += 1
        return action + (':' + str(arg) if arg is not None else '')

    def routine(self, phase, leisure, watered, shipped_today):
        # Two controlled misses in a row every fortnight, to expose growth loss.
        skip_garden = self.imperfect == 'skip_garden' and self.day % 14 in (0, 1)
        skip_morale = self.imperfect == 'profit_only'
        action, used_leisure, wet, shipped = 'quiet', leisure, watered, shipped_today
        if phase == 1 and (self.needs['food'] <= 7000 or self.needs['water'] <= 6500):
            own_fruit = [k for k in FRUIT_WATER if self.stock[k]] if self.self_use and self.day % 3 == 0 else []
            food = min(own_fruit, key=lambda k: (abs(SPEC[k][5] - (10000 - self.needs['food'])), VALUE[k])) if own_fruit else 'bread'
            if self.stock[food] and self.stock['water']:
                self.consume(food); self.consume('water')
                self.needs['food'] = min(10000, self.needs['food'] + (4000 if food == 'bread' else SPEC[food][5]))
                self.needs['water'] = min(10000, self.needs['water'] + 5000 + FRUIT_WATER.get(food, 0))
                action = 'breakfast' if food == 'bread' else 'breakfast_' + food
        elif phase == 2 and not watered and not skip_garden and any(p and p.moisture == 0 for p in self.plots):
            for p in self.plots:
                if p: p.moisture = 2
            action, wet = 'water_round', True
        elif self.pending_treat and self.stock[self.pending_treat[0]]:
            item = self.pending_treat.pop(0)
            self.consume(item)
            action = 'treat_' + item
        elif self.self_use and self.needs['morale'] < 8000 and any(self.stock[k] for k in ('daisy', 'marigold', 'lavender', 'rose')):
            flowers = [k for k in ('daisy', 'marigold', 'lavender', 'rose') if self.stock[k]]
            item = max(flowers, key=lambda k: SPEC[k][5])
            self.consume(item)
            self.needs['morale'] = min(10000, self.needs['morale'] + SPEC[item][5])
            action = 'enjoy_' + item
        elif not skip_morale and self.needs['morale'] <= 8500 and leisure < 2:
            self.needs['morale'] = min(10000, self.needs['morale'] + 1000)
            action, used_leisure = 'leisure', leisure + 1
        elif self.exportable() and not shipped_today:
            # No truncation: max four physically collected finished goods.
            ship_items = []
            available = self.exportable()
            for k in sorted(available, key=lambda k: VALUE[k], reverse=True):
                for _ in range(min(available[k], 4 - len(ship_items))): ship_items.append(k)
                if len(ship_items) == 4: break
            dp = sum(VALUE[k] for k in ship_items)
            for k in ship_items:
                self.consume(k); self.shipped[k] += 1
            self.bank += dp
            self.peak_ship_points = max(self.peak_ship_points, dp / 10)
            if self.first_ship is None: self.first_ship = self.day
            action, shipped = 'ship:' + ','.join(ship_items), True
        if action != 'quiet': self.needs['energy'] -= 200 if action.startswith('breakfast') else 100
        self.counts[action.split(':')[0]] += 1
        return action, used_leisure, wet, shipped

    def grow(self):
        for i, p in enumerate(self.plots):
            if p is None: continue
            if p.ticks > 0:
                if p.moisture:
                    p.ticks -= 1; p.dry_days = 0; self.wet_ticks += 1
                    if p.ticks == 0: p.ready_since = self.day + 1
                else:
                    p.dry_days += 1
                    if p.dry_days >= 2:
                        self.events.append([self.day, 'wilt', i, p.species])
                        self.plots[i] = None; self.wilted += 1
                        continue
            p.moisture = max(0, p.moisture - 1)

    def conservation(self):
        for k in self.stock.keys() | self.initial.keys() | self.delivered.keys() | self.produced.keys() | self.consumed.keys():
            assert self.stock[k] == self.initial[k] + self.delivered[k] + self.produced[k] - self.consumed[k], (self.day, k)
        assert self.bank == sum(VALUE[k] * v for k, v in self.shipped.items())
        assert self.produced['wood'] - self.wood_used == self.stock['wood']
        assert self.produced['wood'] <= 10 * self.consumed['seed_tree']
        for k in ('grape', 'apple'): assert self.produced[k] <= 6 * self.consumed['seed_' + k]
        assert all(v >= 0 for v in self.stock.values())
        assert len(self.plots) == 4

    def run(self):
        points_by_day = []
        for self.day in range(1, self.days + 1):
            before = self.bank
            kit = self.gift()
            if self.incident_every and self.day % self.incident_every == 0:
                self.pending_treat.extend(['medicine', 'bandage'])
            planned = self.main_choice()
            leisure, watered, shipped = 0, False, False
            actions, main = [], None
            for phase in range(6):
                if phase:
                    action, leisure, watered, shipped = self.routine(phase, leisure, watered, shipped)
                    actions.append(action)
                if phase == 3: main = self.do_main(planned)
                self.needs['food'] -= 500
                self.needs['water'] -= WATER_LOSS[phase]
                self.needs['morale'] -= 294
                for k in self.needs: self.needs[k] = max(0, self.needs[k])
                for k in self.minima: self.minima[k] = min(self.minima[k], self.needs[k])
                if min(self.needs[k] for k in ('food', 'water', 'morale', 'energy')) <= 0:
                    # A defined failed design witness, not a current canonical death formula.
                    self.low_need_ticks += 1
            if self.low_need_ticks:
                self.events.append([self.day, 'care_floor_breached'])
                self.alive = False
            if self.alive: self.grow()
            self.needs['energy'] = min(10000, self.needs['energy'] + 3500)
            self.max_stock_units = max(self.max_stock_units, sum(self.stock.values()))
            self.max_finished_units = max(self.max_finished_units, sum(self.stock[k] for k in VALUE if VALUE[k]))
            self.max_wet_slots = max(self.max_wet_slots, sum(p is not None for p in self.plots))
            points_by_day.append((self.bank - before) / 10)
            self.conservation()
            if self.capture_trace: self.trace.append({'day': self.day, 'kit': kit, 'main': main, 'routines': actions,
                               'needPercent': {k: v / 100 for k, v in self.needs.items()},
                               'plots': [asdict(p) if p else None for p in self.plots],
                               'stock': {k: v for k, v in self.stock.items() if v},
                               'pointsShipped': points_by_day[-1]})
            if not self.alive: break
        return {'layout': self.layout, 'policy': self.policy, 'recipe': self.recipe,
                'incidentEvery': self.incident_every, 'imperfect': self.imperfect, 'selfUse': self.self_use,
                'daysRequested': self.days, 'daysCompleted': self.day, 'careFloorIntact': self.alive,
                'totalPointsShipped': self.bank / 10, 'pointsPerDay': self.bank / 10 / self.day,
                'pointsByGameDay': points_by_day, 'minimumPercent': {k: v / 100 for k, v in self.minima.items()},
                'routineCounts': dict(self.counts), 'mainCounts': dict(self.main_counts),
                'normalRoutineUseFraction': 1 - self.counts['quiet'] / (5 * self.day),
                'firstHarvestDay': self.first_harvest, 'firstShipmentDay': self.first_ship, 'firstCraftDay': self.first_craft,
                'maxShipmentPoints': self.peak_ship_points, 'produced': dict(self.produced), 'shipped': dict(self.shipped),
                'consumed': dict(self.consumed), 'delivered': dict(self.delivered), 'remainingStock': dict(self.stock),
                'wilted': self.wilted, 'wetGrowthTicks': self.wet_ticks,
                'maxFinishedStockUnits': self.max_finished_units, 'maxTotalStockUnits': self.max_stock_units,
                'events': self.events, 'traceFirst30': self.trace[:30]}


def main():
    catalog = ['daisy', 'marigold', 'lavender', 'rose', 'strawberry', 'blueberry', 'grape', 'apple']
    layouts = {f'mono_{k}': [k] * 4 for k in catalog}
    layouts['mixed_no_tree'] = ['daisy', 'lavender', 'grape', 'apple']
    for t in range(1, 5): layouts[f'tree_{t}'] = ['tree'] * t + ['strawberry', 'blueberry', 'apple'][:4-t]
    cases = {}
    for name, layout in layouts.items():
        recipes = list(RECIPES) + ['cycle'] if 'tree' in layout else ['large_chest']
        for policy in ('immediate', 'batch'):
            for recipe in recipes:
                key = f'{name}_{policy}_{recipe}'
                cases[key] = Model(layout, policy=policy, recipe=recipe).run()
    chosen_layout = ['tree', 'strawberry', 'lavender', 'apple']
    for mode, kwargs in {
        'mixed_cozy': dict(self_use=True),
        'mixed_stress': dict(incident_every=7),
        'mixed_stress_cozy': dict(incident_every=7, self_use=True),
        'mixed_missed_watering': dict(imperfect='skip_garden'),
        'mixed_profit_only': dict(imperfect='profit_only'),
    }.items():
        cases[mode] = Model(chosen_layout, recipe='cycle', **kwargs).run()
    metadata = {
        'scope': 'Hypothetical V2 deterministic inventory/action/care-capacity experiment. Not actual Jev choices, token earnings or a complete biological survival proof.',
        'proposedRules': ['One actual seed delivery/day maximum; kit bread+water as needed +one seed OR medicine OR bandage; omit surplus care food/drink.',
            'One plant/harvest-all-ready/craft-one main undertaking/day; five ordinary routine openings.',
            'Planting includes initial well water. Growth is one tick only at completed living bedtime.',
            'Shared well round costs one routine and waters all occupied slots incl ready; no drinking bottle.',
            'Ready yields wait; no output accrues until actual pickup. Repeat timer resets on pickup.',
            'Ship max4 finished units in one routine; one modeled shipping round/day. No raw wood exports.',
            'Breakfast consumes bread1+water1; costs actual two item energies. Leisure max2/day.',
            'Cozy policy reserves at most1household flower and1fruit, enjoys flowers at morale<80 and chooses own fruit at every third-day breakfast when available. Fruit replaces bread, with both actual food/drink costs. Sales forgone are real.',
            'Stress is two treatment chores every7days, actual supplies displace two seed deliveries; no invented injury effects.',
            'Care failure means an explicit need floor breach in this model, NOT a canonical onchain death predicate.'],
        'units': 'Values integer decipoints; displayed points divide by10. Not currency price or guaranteed return.',
        'catalog': {k: dict(firstTicks=v[0], totalOutputs=v[1], repeatTicks=v[2], basePoints=v[3]/10,
                            ownUseNeed=v[4], ownUseGain=v[5]/100, ownUseWater=FRUIT_WATER.get(k, 0)/100) for k, v in SPEC.items()},
        'recipes': {k: dict(wood=v[0], basePoints=v[1]/10) for k, v in RECIPES.items()},
        'analyticalLongRunBound': {'pointsPerOccupiedPlotDay': 1, 'pointsPerMain': 2, 'loosePointsPerGameDay': 6,
            'conditions': 'Empty start, NPC-only provenance, no extra saleable grants, minimum time/work accounting; excludes stored claim lump and does not prove all possible mixed-policy optima.'},
        'maximumLegalFourChestShipmentPoints': 136,
        'cases': cases,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'integrated-results.json').write_text(json.dumps(metadata, indent=2) + '\n')
    for name in ('mixed_stress', 'mixed_stress_cozy', 'mixed_cozy'):
        # Traces complete enough for independent care/action audit, including after Day30.
        cfg = cases[name]
        sim = Model(chosen_layout, recipe='cycle', incident_every=cfg['incidentEvery'], self_use=cfg['selfUse'])
        sim.run()
        (OUT / (name + '-trace.json')).write_text(json.dumps(sim.trace, indent=2) + '\n')
    by_tree = {}
    for t in range(5):
        candidates = [(k, v) for k, v in cases.items() if (k.startswith('mono_') or k.startswith('mixed_no_tree_')) if t == 0] if t == 0 else [(k, v) for k, v in cases.items() if k.startswith(f'tree_{t}_')]
        key, best = max(candidates, key=lambda kv: kv[1]['pointsPerDay'])
        by_tree[t] = {'case': key, **{k: best[k] for k in ('totalPointsShipped', 'pointsPerDay', 'firstShipmentDay', 'firstCraftDay', 'minimumPercent', 'normalRoutineUseFraction', 'maxShipmentPoints', 'mainCounts')}}
    compact = {'bestObservedByTrees': by_tree,
               'mixedComparisons': {k: {p: cases[k][p] for p in ('daysCompleted', 'careFloorIntact', 'totalPointsShipped', 'pointsPerDay', 'firstShipmentDay', 'firstCraftDay', 'minimumPercent', 'normalRoutineUseFraction', 'maxShipmentPoints', 'mainCounts', 'wilted', 'produced')} for k in cases if k.startswith('mixed_') and not k.startswith('mixed_no_tree_')}}
    (OUT / 'summary.json').write_text(json.dumps(compact, indent=2) + '\n')
    print(json.dumps(compact, indent=2))

if __name__ == '__main__': main()
