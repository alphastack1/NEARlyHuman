import { createV2Campaign } from '../../server/v2/budget';
const [id, amount] = process.argv.slice(2);
if (!id || !amount || !/^[1-9]\d{0,5}$/.test(amount)) throw Error('Supply an exact campaign ID and its fixed microUSD allocation.');
console.log(JSON.stringify(await createV2Campaign(id, Number(amount))));
