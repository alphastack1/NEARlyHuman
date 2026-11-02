"""V2 currency design experiment. No network, source or chain side effects.

Actual deterministic crop/care profiles are frozen in the adjacent profiles.json.
Fast cadence envelope cases deliberately use a conservative accounting upper bound,
not a claim that an NPC can ship six points on every day or live indefinitely.
"""
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = Path(__file__).resolve().parents[3] / 'TEMP' / 'economy-research' / 'currency'

TOKEN_PRICE = 250.0
K_DEFAULT = 50_000.0
CAPACITY = 30_000.0
REFILL_PER_REAL_DAY = 30_000.0


class Bucket:
    def __init__(self, cap=CAPACITY, refill=REFILL_PER_REAL_DAY):
        self.capacity, self.rate = cap, refill
        self.available, self.reserved, self.minted, self.now = cap, 0.0, 0.0, 0.0
    def tick(self, now):
        assert now >= self.now
        self.available = min(self.capacity - self.reserved,
                             self.available + self.rate * (now - self.now))
        self.now = now
        self.check()
    def reserve(self, amount):
        if amount > self.available + 1e-7:
            return False
        self.available -= amount
        self.reserved += amount
        self.check()
        return True
    def finish(self, reserved, actual):
        assert -1e-7 <= actual <= reserved + 1e-7
        self.reserved -= reserved
        self.available += reserved - actual
        self.minted += actual
        self.check()
    def check(self):
        assert self.available >= -1e-6 and self.reserved >= -1e-6
        assert self.available + self.reserved <= self.capacity + 1e-6
        assert self.minted <= self.capacity + self.rate * self.now + 1e-5


def run(label, profiles, *, periods=365, ops=1, founders=100, profile='best_observed',
        reinvest=True, pressure='P', k=K_DEFAULT, limited=True, eth_births=0,
        active_fraction=1.0, stop_fraction_at=None, frozen_fraction=0.0,
        envelope=False, bucket_capacity=CAPACITY, bucket_rate=REFILL_PER_REAL_DAY):
    """Real period is 24h, game day count is independent.

    Multi-NFT holdings are pooled and reinvested, a conservative strong-holder case.
    Newborns advance starting NEXT opportunity. A physical points packet that cannot
    be funded waits intact. Queue processing here is a monetary upper stress model:
    it does not simulate the extra later mail routine or inventory-space contention.
    It therefore cannot be used as a game survival/throughput proof.
    """
    bucket = Bucket(cap=bucket_capacity, refill=bucket_rate) if limited else None
    # Cohort age -> count. Each economic opportunity is one completed game day.
    cohorts = {0: founders * active_fraction}
    idle = founders * (1 - active_fraction)
    dead = 0.0
    bank = supply = issued = nft_burn = 0.0
    token_births = 0
    external_births = founders
    queue = {}
    unfunded_attempts = 0
    delayed_points_peak = 0.0
    stopped = False
    death_money_witness = None
    series = []
    game_ops = 0
    trace = profiles[profile]['pointsByGameDay']
    snapshots = {1, 7, 14, 30, 60, 90, 180, 365, periods}
    aborted = None
    # Factor snapshots at accepted request, no hourly market state. This model's
    # per-op cohorts share the canonical pre-settlement P: a concurrent batch
    # stress witness, not a claim that sequential settlements preserve P.
    for period in range(1, periods + 1):
        if eth_births:
            cohorts[0] = cohorts.get(0, 0) + eth_births
            external_births += eth_births
        if stop_fraction_at == period and not stopped:
            # Illustrative death removes productivity ONLY; bank/supply survive.
            before = (bank, supply, issued, nft_burn)
            for age, count in list(cohorts.items()):
                removed = count * frozen_fraction
                cohorts[age] -= removed
                dead += removed
            stopped = True
            assert before == (bank, supply, issued, nft_burn)
            death_money_witness = dict(before=before, after=(bank, supply, issued, nft_burn), passed=True)
        for opportunity in range(ops):
            now = (period - 1) + opportunity / ops
            if bucket:
                bucket.tick(now)
            measure = supply if pressure == 'S' else (issued if pressure == 'C' else supply + nft_burn)
            quote_factor = k / (k + measure)
            updated = {}
            for age, count in cohorts.items():
                age += 1
                cohort_age = min(age, 7) if envelope else age
                updated[cohort_age] = updated.get(cohort_age, 0) + count
                base = (6.0 if age > 6 else 0.0) if envelope else trace[age - 1]
                if base:
                    queue[base] = queue.get(base, 0) + count
            cohorts = updated
            game_ops += 1
            # Queue groups are whole per-NFT shipment packets. No partial reward.
            remaining = {}
            for base, count in queue.items():
                payout = base * quote_factor
                permitted = count if bucket is None else min(count, math.floor((bucket.available + 1e-8) / payout))
                # Fractional cohorts only appear in explicit 50%/stalled tests.
                if count < 1 and (bucket is None or bucket.available + 1e-8 >= payout * count):
                    permitted = count
                amount = payout * permitted
                if permitted:
                    if bucket:
                        assert bucket.reserve(amount)
                        bucket.finish(amount, amount)
                    bank += amount
                    supply += amount
                    issued += amount
                left = count - permitted
                if left > 1e-8:
                    remaining[base] = left
                    unfunded_attempts += 1
            queue = remaining
            delayed_points_peak = max(delayed_points_peak, sum(base * n for base, n in queue.items()))
            if reinvest:
                births = math.floor((bank + 1e-8) / TOKEN_PRICE)
                if births:
                    cost = births * TOKEN_PRICE
                    bank -= cost
                    supply -= cost
                    nft_burn += cost
                    token_births += births
                    cohorts[0] = cohorts.get(0, 0) + births
            assert abs(supply + nft_burn - issued) < 1e-5 * max(1.0, issued)
            assert bank >= -1e-5 and supply >= -1e-5
            if sum(cohorts.values()) > 100_000:
                aborted = f'Bounded experiment stopped at >100,000 active NFTs on real period {period}'
                break
        if period in snapshots or aborted:
            measure = supply if pressure == 'S' else (issued if pressure == 'C' else supply + nft_burn)
            series.append(dict(realPeriod=period, completedGameDayOpportunities=game_ops,
                               activeNfts=round(sum(cohorts.values()), 6), idleNfts=idle, deadNfts=dead,
                               totalNfts=external_births + token_births, tokenFundedBirths=token_births,
                               issuedTokens=round(issued, 6), outstandingTokens=round(supply, 6),
                               bankedTokens=round(bank, 6), nftMintBurnTokens=nft_burn,
                               nextFactor=k / (k + measure),
                               waitingBasePoints=round(sum(b*n for b,n in queue.items()), 6),
                               bucketAvailable=None if bucket is None else round(bucket.available, 6)))
        if aborted:
            break
    return dict(label=label, assumptions=dict(realPeriods=periods, opportunitiesPerRealPeriod=ops,
                founders=founders, physicalProfile=None if envelope else profile,
                profileKind='conditional6ptPerGameDayUpperEnvelopeAfter6StartupDays' if envelope else 'deterministicCareInventoryPolicy',
                reinvest=reinvest, pressure=pressure, K=k, mintPrice=TOKEN_PRICE,
                bucketCapacity=bucket_capacity if limited else None,
                bucketRefillPer24h=bucket_rate if limited else None,
                ethPaidBirthsPerPeriod=eth_births, activeFraction=active_fraction,
                deathPeriod=stop_fraction_at, deathFraction=frozen_fraction,
                noOfflineAge=True, newbornEarliestNextOpportunity=True,
                acceptanceModel='Per-op concurrent cohort batch snapshots canonical P before any settlement, not sequential accepted-and-settled requests.',
                reservationModel='Atomic actual-packet reserve/settle; excludes worst-feasible-Q held during AI. Zero blocked packets is not full-request liveness proof.',
                pooledOwnerBank=True, nonNftTokenBurn=0, gameTokenMarketValueModelled=False),
                abort=aborted, unfundedPacketAttempts=unfunded_attempts,
                peakWaitingBasePoints=round(delayed_points_peak, 6),
                deathMoneyWitness=death_money_witness, series=series)


def exact_witnesses():
    bucket = Bucket(cap=100, refill=100)
    assert bucket.reserve(80)
    bucket.tick(1)
    assert (bucket.available, bucket.reserved) == (20, 80)
    bucket.finish(80, 30)
    assert (bucket.available, bucket.reserved, bucket.minted) == (70, 0, 30)
    bucket.tick(1.5)
    assert bucket.available == 100
    assert bucket.reserve(100)
    bucket.finish(100, 0)  # expiry releases the SAME capacity, not a second grant
    assert bucket.available == 100
    # One-unit-aware integer quote; aggregate base decipoints and floor once.
    U, K, P = 10**6, 50_000 * 10**6, 50_000 * 10**6
    quote = lambda d: d * U * K // (10 * (K + P))
    assert quote(1360) == 68 * U  # four saved chests; no 6/day clipping
    assert quote(65) == 325 * U // 100
    # NFT token burn doesn't move P; wallet/purse/death transfers don't move S.
    issued, outstanding, nft_burn = 1000, 1000, 0
    outstanding -= 250
    nft_burn += 250
    assert outstanding + nft_burn == issued == 1000
    # Exact second-based fractional refill. Discard excess fractional credit at
    # capacity rather than accumulating a hidden second bucket.
    cap, available, reserved, carry, minted = 30_000 * U, 30_000 * U, 0, 0, 0
    rate24h, last = 30_000 * U, 0
    pending = []
    for now in range(1, 100_001, 13):
        raw = carry + (now - last) * rate24h
        credit, remainder = divmod(raw, 86400)
        space = cap - available - reserved
        if credit >= space:
            available += space
            carry = 0
        else:
            available += credit
            carry = remainder
        last = now
        q = min(available, (now * 7919) % (136 * U))
        available -= q
        reserved += q
        pending.append(q)
        if len(pending) > 6:
            old_q = pending.pop(0)
            actual = old_q * (now % 11) // 10
            reserved -= old_q
            available += old_q - actual
            minted += actual
        assert 0 <= available and 0 <= reserved and available + reserved <= cap
        assert minted * 86400 <= cap * 86400 + rate24h * now
        assert 0 <= carry < 86400
    return dict(bucketOutstandingReservationWitness='pass', exactSecondRefillStates=7693,
                exactSecondRefillWitness='pass', tokenDecimals=6, fourChestShipmentAtHalfFactorTokens=68,
                unitAwareIntegerQuote='pass', nonResettingNftMintBurnPressure='pass',
                exactFormula='floor(baseDecipoints * tokenSmallestUnitsPerToken * KSmallestUnits / (10 * (KSmallestUnits + PSnapshotSmallestUnits)))')


def main():
    frozen = json.loads((HERE / 'profiles.json').read_text())
    profiles = frozen['profiles']
    cases = []
    for pressure in ('S', 'P', 'C'):
        cases.append(run(f'physical100founders365period1op_{pressure}', profiles, pressure=pressure, limited=False))
    for k in (10_000, 50_000, 100_000):
        cases.append(run(f'physical100fixed365period1op_K{k}', profiles, reinvest=False, k=k))
        cases.append(run(f'physical100reinvest365period6op_K{k}', profiles, ops=6, k=k))
    for profile in ('best_observed', 'cozy', 'plain_stress', 'cozy_stress'):
        cases.append(run(f'physical1founder365period1op_{profile}', profiles, founders=1, profile=profile))
    cases += [run('physical100fixed365period6op', profiles, ops=6, reinvest=False),
              run('physical100plus1ETHbirth365period1op', profiles, eth_births=1),
              run('physical100halfIdle365period1op', profiles, active_fraction=.5),
              run('physical100halfDieAfter90period365period1op', profiles, stop_fraction_at=91, frozen_fraction=.5),
              run('physical1000fixed60period6op', profiles, founders=1000, periods=60, ops=6, reinvest=False)]
    cases.append(run('physical1000plus10ETHbirth365period6op', profiles, founders=1000, eth_births=10, ops=6))
    for ops in (1, 6, 24, 96):
        cases.append(run(f'envelope100reinvest365period{ops}op', profiles, ops=ops, envelope=True))
    for capacity in (10_000, 30_000):
        for periods in (60, 365):
            cases.append(run(f'physical1000fixed{periods}period6op_bucket{capacity}', profiles,
                             founders=1000, periods=periods, ops=6, reinvest=False,
                             bucket_capacity=capacity, bucket_rate=capacity))
            cases.append(run(f'physical1000reinvest{periods}period6op_bucket{capacity}', profiles,
                             founders=1000, periods=periods, ops=6,
                             bucket_capacity=capacity, bucket_rate=capacity))
        for ops in (24, 96):
            cases.append(run(f'envelope1000reinvest365period{ops}op_bucket{capacity}', profiles,
                             founders=1000, ops=ops, envelope=True,
                             bucket_capacity=capacity, bucket_rate=capacity))
    first_mint = {}
    for name, p in profiles.items():
        solo_issued = 0.0
        for day, points in enumerate(p['pointsByGameDay'], 1):
            solo_issued += points * K_DEFAULT / (K_DEFAULT + solo_issued)
            if solo_issued >= TOKEN_PRICE:
                first_mint[name] = dict(gameDay=day, tokens=solo_issued,
                                       note='One fixed NFT, empty economy, same hypothetical policy; cumulative saved exports before first250-token mint; global pressure from other players lengthens this.')
                break
    report = dict(scope='Design simulation only; physical policies obey the sibling hypothetical V2 care/inventory rules, not actual Jev. Calendar periods and game days are separate. No token-market price, mainnet gas profit, AI behavior or population forecast.',
                  defaultRecommendation=dict(tokenDecimals=6, smallestUnitsPerToken=1_000_000,
                                             initialTokensPerBasePoint=1, seasonalNftTokenMintPrice=TOKEN_PRICE,
                                             nonResettingPressure='outstandingSupply + lifetimeNftMintBurns',
                                             K=K_DEFAULT, quoteSnapshot='CanonicalPAtAcceptedRequest', pendingQuoteLifetimeMinutes=15,
                                             bucketCapacity=CAPACITY, bucketRefillPer24Hours=REFILL_PER_REAL_DAY),
                  soloFirstTokenFundedNft=first_mint,
                  profileEvidence={name: {key: p[key] for key in ('daysCompleted', 'totalPointsShipped', 'pointsPerDay', 'firstShipmentDay', 'careFloorIntact', 'maxShipmentPoints')} for name,p in profiles.items()},
                  witnesses=exact_witnesses(), cases=cases)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'results.json').write_text(json.dumps(report, indent=2) + '\n')
    compact = [dict(label=c['label'], final=c['series'][-1], blocked=c['unfundedPacketAttempts'], abort=c['abort']) for c in cases]
    (OUT / 'summary.json').write_text(json.dumps(compact, indent=2) + '\n')
    print(json.dumps(compact, indent=2))


if __name__ == '__main__':
    main()
