import assert from 'node:assert/strict';
import { searchArticles } from '../../src/site/search';

const firstAnswers: [string, string][] = [
  ['two signatures', 'jev-saving'],
  ['why sign twice', 'jev-saving'],
  ['how much does it cost', 'worlds-wallets'],
  ['cost of minting', 'worlds-wallets'],
  ['my rooster died', 'remembered-lives'],
  ['can I sell my rooster', 'sharing-transfers'],
  ['water plants', 'garden'],
  ['connect Meteor', 'worlds-wallets'],
  ['toy boat', 'workshop'],
  ["I can't connect my wallet", 'worlds-wallets'],
  ['I can’t connect my wallet', 'worlds-wallets'],
  ["why won't Meteor connect", 'worlds-wallets'],
  ['how do I start playing', 'first-day'],
  ['where can I get testnet funds', 'worlds-wallets'],
  ['how do I make money', 'nhc'],
  ['how can I make more money', 'nhc'],
  ['how do I earn money', 'nhc'],
  ['why do I have to sign twice', 'jev-saving'],
  ['how much are the fees', 'worlds-wallets'],
];
for (const [query, slug] of firstAnswers) assert.equal(searchArticles(query)[0]?.slug, slug, query);
const emptyQueries = ['', 'how does it', 'zxqv blorptastic', 'wallet zxqv', "I can't connect zxqv", 'make zxqv money'];
for (const query of emptyQueries) assert.equal(searchArticles(query).length, 0, query);
assert(!searchArticles('dead').some(article => article.slug === 'first-day'), 'Word normalization must not become unrelated substring matching.');
console.log(JSON.stringify({ pass: true, realisticQueries: firstAnswers.length, emptyOrUnrelatedQueries: emptyQueries.length + 1 }));
