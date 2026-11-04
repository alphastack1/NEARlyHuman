import { ARTICLES } from './content';

const forms: Record<string, string> = {
  seeds: 'seed', seedling: 'seed', seedlings: 'seed', crops: 'crop', plants: 'plant', planting: 'plant', planted: 'plant',
  blueberries: 'blueberry', strawberries: 'strawberry', apples: 'apple', grapes: 'grape', flowers: 'flower', trees: 'tree', beds: 'bed', plots: 'plot',
  mint: 'hatch', minted: 'hatch', minting: 'hatch', hatching: 'hatch', hatched: 'hatch',
  dead: 'death', died: 'death', dying: 'death', dies: 'death',
  watering: 'water', watered: 'water', drinking: 'drink', drinks: 'drink', bottles: 'bottle',
  supplies: 'supply', supplied: 'supply', wallets: 'wallet', tokens: 'token', coins: 'token', nfts: 'nft',
  transfer: 'transfer', transferring: 'transfer', transfers: 'transfer', transferred: 'transfer',
  withdrawing: 'withdraw', withdrawal: 'withdraw', withdrawals: 'withdraw',
  failed: 'failure', failing: 'failure', failures: 'failure', errors: 'error', cancelled: 'cancel', canceled: 'cancel',
  personality: 'personality', personalities: 'personality', crafting: 'craft', crafts: 'craft', crafted: 'craft',
  sign: 'signature', signs: 'signature', signing: 'signature', signed: 'signature', signatures: 'signature',
  fees: 'fee', costs: 'cost', prices: 'price',
  playing: 'play', plays: 'play', earning: 'earn', earnings: 'earn', earned: 'earn', earns: 'earn',
  funding: 'fund', funded: 'fund', funds: 'fund', testnets: 'testnet',
};
const aliases: Record<string, string> = {
  'first-day': 'start beginner onboarding tutorial introduction how play hatch name',
  'worlds-wallets': 'network blockchain connect wallet faucet funds gas fee price cost meteor rabby near robinhood',
  'care-supplies': 'food hunger thirst water bottle bread eating drinking health stock inventory supply',
  'strengths-personality': 'strength personality stats skill character trait allocation',
  garden: 'seed crop grow growth planting plant wet water watering well fruit flower tree soil bed plot daisy marigold lavender rose strawberry blueberry grape apple wood',
  workshop: 'craft wood recipe spoon toy boat birdhouse large chest build workbench',
  'weather-visitors': 'rain weather fire damage broken repair power outage visitor pests cat bird event sickness storm',
  'nft-purse': 'nft ownership purse balance withdraw token money transfer',
  nhc: 'nhc token earn earning earnings money income make ship shipping price reward emission economy supply burn hatch currency',
  'sharing-transfers': 'share link transfer sell sale nft owner ownership',
  'remembered-lives': 'death dead died dying burn withdraw purse remembered health survival',
  'jev-saving': 'ai jev model thoughts choice plan inference save saved saving blockchain transaction signature two twice',
  contracts: 'address source github contract explorer verify security audit trust code',
  troubleshooting: 'help error failure failed stuck retry recovery cancel wallet signature pending missing transaction interrupted',
  'privacy-data': 'privacy data public private record memory local browser storage wallet account session',
};
function words(value: string) {
  return value.toLowerCase().normalize('NFKD')
    .replace(/\b(?:can['’]t|cannot)\b/g, 'can not').replace(/\bwon['’]t\b/g, 'will not')
    .replace(/n['’]t\b/g, ' not').replace(/['’](?:m|re|ve|ll|d|s)\b/g, ' ')
    .replace(/\bmake(?:\s+more)?\s+money\b/g, 'earn money')
    .replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean).map(word => forms[word] || word);
}
const index = ARTICLES.map(article => ({ article, title: words(article.title), summary: words(article.summary),
  aliases: words(aliases[article.slug] || ''), body: words(article.sections.map(s => [s.title, ...(s.paragraphs || []), ...(s.bullets || []), ...(s.table?.rows.flat() || [])].join(' ')).join(' ')) }));

/** A small token index understands the game's common terms without fuzzy
 * substring accidents such as “dead” matching “deadline”. */
export function searchArticles(query: string) {
  const stop = new Set(['a', 'an', 'the', 'and', 'or', 'my', 'your', 'our', 'their', 'i', 'me', 'you', 'we', 'they', 'he', 'she', 'it', 'its', 'is', 'are', 'was', 'were', 'be', 'been', 'do', 'does', 'did', 'can', 'could', 'would', 'should', 'will', 'have', 'has', 'had', 'not', 'how', 'what', 'when', 'where', 'why', 'if', 'of', 'for', 'to', 'in', 'on', 'at', 'from', 'with', 'after', 'before', 'happens', 'happen', 'please', 'long', 'take', 'takes', 'much', 'get', 'getting']);
  const terms = words(query).filter(word => !stop.has(word));
  if (!terms.length) return [];
  const match = (tokens: string[], term: string) => tokens.some(token => token === term || term.length >= 3 && token.startsWith(term));
  return index.map(entry => {
    const fields = [...entry.title, ...entry.summary, ...entry.aliases, ...entry.body];
    if (!terms.every(term => match(fields, term))) return { article: entry.article, score: 0 };
    const score = terms.reduce((n, term) => n + (match(entry.title, term) ? 8 : 0) + (match(entry.summary, term) ? 4 : 0) + (match(entry.aliases, term) ? 3 : 0) + (match(entry.body, term) ? 1 : 0), 0);
    return { article: entry.article, score };
  }).filter(entry => entry.score > 0).sort((a, b) => b.score - a.score).map(entry => entry.article);
}
