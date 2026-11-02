import { mkdirSync, writeFileSync } from 'node:fs';
import { closeV2Campaign, inspectV2Campaign } from '../../server/v2/budget';
// This operator command never runs from an API route or ordinary application boot.
const [id, reason] = process.argv.slice(2);
if (!id || !reason) throw Error('Supply the exact campaign ID and an audit reason.');
const before = await inspectV2Campaign(id);
const result = await closeV2Campaign(id, reason);
const audit = { at: new Date().toISOString(), scope: 'Explicit unused-campaign release; original limit, entries and charges preserved; V1 allocation unchanged.', before, ...result };
mkdirSync(new URL('../../TEMP/v2-checks/', import.meta.url), { recursive: true });
writeFileSync(new URL('../../TEMP/v2-checks/closed-campaign.json', import.meta.url), JSON.stringify(audit, null, 2));
console.log(JSON.stringify({ id, complete: result.campaign?.complete, chargedMicroUSD: result.campaign?.chargedMicroUSD, releasedMicroUSD: result.releasedMicroUSD, closed: !!result.campaign?.closed }));
