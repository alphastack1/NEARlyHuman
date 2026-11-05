import { PROJECT } from './project';

export interface GuideSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
  links?: { label: string; href: string }[];
}

export interface GuideArticle {
  slug: string;
  title: string;
  summary: string;
  group: 'start' | 'home' | 'ownership' | 'technical';
  sections: GuideSection[];
  related: string[];
}

export const GUIDE_GROUPS = [
  { id: 'start', title: 'Start here', description: 'Your first rooster and day.' },
  { id: 'home', title: 'Life at home', description: 'Care, growing and making.' },
  { id: 'ownership', title: 'What you own', description: 'One NFT, a continuing world.' },
  { id: 'technical', title: 'Under the hood', description: 'Jev, saving and the chain.' },
] as const;

const source = PROJECT.sourceUrl;
const guide = (slug: string, label: string) => ({ label, href: `/docs/${slug}` });

/** Public, player-first content. No wallet, engine or service modules are loaded. */
export const ARTICLES: readonly GuideArticle[] = [
  {
    slug: 'first-day', title: 'Your first day', group: 'start',
    summary: 'Hatch a rooster, choose supplies and prepare its first day.',
    sections: [
      { id: 'choose-a-world', title: 'Choose a world', paragraphs: [
        'Choose NEAR Testnet with Meteor, or Robinhood Testnet with Rabby or another EVM wallet. Connect when you are ready to hatch. Each world keeps its own lives and balances.',
      ], links: [guide('worlds-wallets', 'Wallets & testnet funds')] },
      { id: 'hatch-a-life', title: 'Hatch your rooster', paragraphs: [
        'Give your rooster a name and confirm its hatch in your wallet. Its original artwork is generated from its seed; this is your own NFT and saved home.',
        'Balanced strengths are ready to use. Open Strengths only if you want to change them before hatching.',
      ], links: [guide('strengths-personality', 'What strengths change')] },
      { id: 'pack-a-little-post', title: 'Pack supplies', paragraphs: [
        'Choose up to three different supplies, with at most one seed packet or sapling. Bread, a water bottle and a seed are a simple place to start; check what is already stored at home.',
        'Review the day and its fee before confirming. A free sign-in message proves wallet ownership. Accepting the day is a separate paid transaction.',
      ] },
      { id: 'watch-what-happens', title: 'Watch what happens', paragraphs: [
        'Jev chooses a main undertaking and smaller routines. Its replies leave sealed thoughts while the day prepares; the choices stay a surprise.',
        'The completed day is saved before its film plays. Watch, pause, inspect objects or finish the film. Nothing ages while you are away.',
      ], links: [guide('care-supplies', 'Care & supplies'), { label: 'Open App', href: PROJECT.appHref }] },
    ], related: ['worlds-wallets', 'care-supplies', 'jev-saving'],
  },
  {
    slug: 'worlds-wallets', title: 'Worlds & wallets', group: 'start',
    summary: 'Choose the right wallet and testnet funds for the world you want to enter.',
    sections: [
      { id: 'two-worlds', title: 'Two separate worlds', table: {
        headers: ['World', 'Wallet', 'Fees use'], rows: [
          ['NEAR Testnet', 'Meteor through NEAR Connect', 'Test NEAR'],
          ['Robinhood Testnet · 46630', 'Rabby / EVM wallet', 'Test ETH'],
        ],
      }, paragraphs: [
        'Use the world name in the app to choose or switch. Changing worlds does not move a rooster, inventory or NHC. The same NFT number can belong to a different life on another chain.',
        'The game currently supports these two testnets. Mainnet lives are not available.',
      ] },
      { id: 'native-near', title: 'NEAR with Meteor', paragraphs: [
        'Create or import a NEAR Testnet account in Meteor, then choose NEAR Testnet in the game and connect Meteor. Check the selected account in the wallet prompt.',
        'Native NEAR uses its own account system. Adding an EVM network in Rabby does not connect this NEAR world.',
      ], links: [
        { label: 'Meteor getting started', href: 'https://help.meteorwallet.app/en/collections/1-getting-started' },
        { label: 'NEAR testnet faucet', href: 'https://docs.near.org/getting-started/faucet' },
      ] },
      { id: 'robinhood', title: 'Robinhood with an EVM wallet', paragraphs: [
        'Choose Robinhood Testnet in the game, connect Rabby or another EVM wallet, and approve the network switch if asked. The testnet chain ID is 46630.',
        'Keep test ETH in the selected address for hatching, day fees and network gas. The app shows the payment before you confirm; a wallet balance on another chain cannot pay it.',
      ], links: [
        { label: 'Robinhood network guide', href: 'https://docs.robinhood.com/chain/connecting/' },
        { label: 'Robinhood testnet faucet', href: 'https://faucet.testnet.chain.robinhood.com/' },
        { label: 'Rabby Wallet', href: 'https://rabby.io/' },
      ] },
      { id: 'keep-the-right-context', title: 'Before confirming', bullets: [
        'Check the world, wallet account and payment in the app and wallet.',
        'Keep enough native testnet funds for fees. NHC and native gas are different balances.',
        'Let an unresolved payment finish or use its recovery action before changing worlds.',
      ], paragraphs: ['NEAR token-funded births and purse withdrawals may attach a storage deposit. Unused storage funding returns; the wallet shows the attached amount before confirmation.'] },
    ], related: ['first-day', 'troubleshooting', 'contracts'],
  },
  {
    slug: 'care-supplies', title: 'Care & supplies', group: 'home',
    summary: 'Choose supplies based on current needs and what is already stored at home.',
    sections: [
      { id: 'read-the-home', title: 'Look at what is needed', paragraphs: [
        'The top bars show health, food, water, energy and mood. Touch the pantry, garden, workshop and other objects to inspect the saved home.',
        'Before preparing another day, check both needs and stored supplies. Bread, drinking water or treatment may be more useful than another seed when care is running low.',
      ] },
      { id: 'packing', title: 'Packing supplies', paragraphs: [
        'A parcel holds up to three different supply types, with at most one seed packet or sapling. Stored items carry over, so you do not need to replace everything each day.',
        'The rooster collects its parcel from the mailbox. Jev chooses what to fetch, use, keep or make; packing an item does not force a particular action.',
      ], table: { headers: ['Supply', 'Useful for'], rows: [
        ['Bread, water, milk, steak', 'Meals and drinks'],
        ['Bandage', 'A wound'],
        ['Medicine', 'Illness or infection'],
        ['Soap', 'Washing or a dirty preparation surface'],
        ['Toolkit, umbrella, compost', 'Household repairs, protection or blocked soil'],
        ['Seed packet or sapling', 'One new planting when a bed is available'],
      ] } },
      { id: 'different-water', title: 'Drinking water and garden water', paragraphs: [
        'The blue bottle is drinking water stored at home. It can also be used for an eligible fire response.',
        'Garden watering draws from the well. A watering round reaches every occupied bed and does not use a drinking bottle.',
      ], links: [guide('garden', 'Growing in four beds')] },
      { id: 'small-routines', title: 'Daily routines', paragraphs: [
        'Breakfast, a drink, a nap and a quiet sit share the day with one main undertaking. Jev can respond to current needs and household events along the way.',
        'Needs and conditions matter only when a new day is advanced. Waiting, pausing and rewatching do not make a rooster hungry or thirsty.',
      ] },
    ], related: ['first-day', 'garden', 'weather-visitors', 'remembered-lives'],
  },
  {
    slug: 'strengths-personality', title: 'Strengths & personality', group: 'home',
    summary: 'How Body, Wits and Spirit affect the rules, and how preferences shape Jev’s choices.',
    sections: [
      { id: 'three-strengths', title: 'Three strengths', paragraphs: ['You have five points to place before hatching. Balanced starts at Body 2, Wits 2 and Spirit 1.'],
        table: { headers: ['Strength', 'What it helps'], rows: [
          ['Body', 'Less physical harm from mishaps'],
          ['Wits', 'Better chances on fallible tasks'],
          ['Spirit', 'Slower mood loss'],
        ] },
      },
      { id: 'not-a-job-class', title: 'Preferences, not orders', paragraphs: [
        'Its seed gives the rooster a consistent visual identity and preferences. Recent days and a saved intention help Jev choose what to do next.',
        'Strengths affect the rules; preferences affect choices. Neither guarantees success, a specific project or a shipment. You do not need to optimise them to begin.',
      ] },
      { id: 'keep-a-little-history', title: 'Memory between days', paragraphs: [
        'The saved intention can be kept or reviewed as the rooster gathers materials and lives through more days. It is a reminder, not a deadline or an automatic reward.',
        'The original procedural artwork stays with that life. It is not a fresh AI portrait generated after every turn.',
      ] },
    ], related: ['first-day', 'jev-saving', 'nft-purse'],
  },
  {
    slug: 'garden', title: 'The garden', group: 'home',
    summary: 'Growth times, watering and yields for flowers, fruit and wood in four garden beds.',
    sections: [
      { id: 'plant-and-water', title: 'A bed for each planting', paragraphs: [
        'Send one seed packet or sapling in a day’s parcel. Jev may plant it in an empty, usable bed as its main undertaking. Each of the four beds holds one planting, including a wood tree.',
        'A new planting starts in damp soil. Later, one well-watering round tops up all occupied beds. Rain can help too; drinking bottles are separate.',
      ] },
      { id: 'growth', title: 'Count wet bedtimes', paragraphs: [
        'Growth advances at the end of a played day when the bed is moist and usable. These are growing bedtimes, not hours offline or time spent watching.',
        'A planting with three growing bedtimes becomes ready after the third wet bedtime; it can be gathered on a later day. Jev still has to choose the harvest.',
        'First and repeat growth are measured in wet bedtimes. A dash means the planting clears after one pickup.',
      ], table: { headers: ['Plant', 'First', 'Total yield', 'Repeat'], rows: [
        ['Daisy', '3', '1 flower', '—'],
        ['Marigold', '3', '1 flower', '—'],
        ['Lavender', '6', '1 flower', '—'],
        ['Rose', '8', '1 flower', '—'],
        ['Strawberry', '3', '1 fruit', '—'],
        ['Blueberry', '6', '1 fruit', '—'],
        ['Grape', '8', '6 fruit', '2'],
        ['Apple', '8', '6 fruit', '2'],
        ['Wood tree', '6', '10 wood', '2'],
      ] } },
      { id: 'when-things-go-wrong', title: 'Dry soil and setbacks', paragraphs: [
        'A growing planting can wilt after two consecutive dry bedtimes. Pests may delay progress, and a washout can block soil until Jev restores it with compost.',
        'Repeat plants do not last forever. After the final pickup the bed clears, leaving space for something new.',
      ] },
      { id: 'what-happens-to-a-harvest', title: 'Using the harvest', paragraphs: [
        'One harvest round gathers all ready beds. Fruit can be eaten, flowers can be enjoyed, and finished produce may be kept or sent away.',
        'Harvesting does not itself credit NHC. An actual outgoing shipment is what can earn tokens for this life. Raw wood is saved for making things.',
      ], links: [guide('workshop', 'Workshop recipes'), guide('nhc', 'How NHC is earned')] },
    ], related: ['care-supplies', 'workshop', 'weather-visitors'],
  },
  {
    slug: 'workshop', title: 'The workshop', group: 'home',
    summary: 'Grow wood, craft finished objects, and choose what to keep or ship.',
    sections: [
      { id: 'wood', title: 'Start with a tree', paragraphs: [
        'A sapling occupies one garden bed. After six wet bedtimes it can yield its first wood, then more after every two wet bedtimes, for ten wood in total.',
        'Wood cannot be added as a free parcel supply or shipped raw. It must be grown, gathered and stored by the rooster.',
      ] },
      { id: 'recipes', title: 'Four handmade goods', table: { headers: ['Object', 'Wood used'], rows: [
        ['Spoon', '3'], ['Toy boat', '6'], ['Birdhouse', '8'], ['Large chest', '10'],
      ] }, paragraphs: [
        'Crafting uses stored wood and the day’s main undertaking. It makes one finished object; a harvest round or planting cannot also be another main project that day.',
        'Larger objects use more wood. Keeping wood for a later idea is a valid choice, not a failed day.',
      ] },
      { id: 'keep-or-post', title: 'Storage & shipping', paragraphs: [
        'Jev can keep a finished good or carry eligible goods to the outgoing mailbox. Making an object does not automatically sell it or increase the purse.',
        'There is at most one shipping round per day, carrying up to four finished goods. What stays at home remains in that NFT’s inventory.',
      ] },
      { id: 'home-projects', title: 'Work on the home, too', paragraphs: [
        'Wood and a toolkit may be used for domestic building or repairs instead of sellable crafts. Some jobs can fumble and started materials can be spent even when they fail.',
        'A saved intention can help Jev gather wood for a project, while immediate care and current incidents still matter.',
      ] },
    ], related: ['garden', 'nhc', 'nft-purse'],
  },
  {
    slug: 'weather-visitors', title: 'Weather & visitors', group: 'home',
    summary: 'How rain, household damage, illness and visitors can change a day.',
    sections: [
      { id: 'not-every-day', title: 'Room for ordinary days', paragraphs: [
        'Some days are quiet. Others may bring weather, household damage, illness or a visitor. Events depend on the actual home and supplies; they are not a guaranteed daily checklist.',
        'Jev sees an incident once it has started, including what is affected and the time left to respond. Future events and decisions stay hidden during preparation.',
      ] },
      { id: 'things-that-can-happen', title: 'What might change', table: { headers: ['Event', 'What it can mean'], rows: [
        ['Rain', 'Waters occupied beds; a broken window may need protection'],
        ['Power cut', 'Hot cooking is unavailable; stored milk can spoil'],
        ['Seed-eater', 'One growing planting can be delayed'],
        ['Hungry visitor', 'An eligible stored food can be taken if it stays'],
        ['Damage or mishap', 'A fixture may need repair, or a wound may need care'],
        ['Illness or contamination', 'Medicine or washing may be useful'],
        ['Washout', 'One bed may need compost before growth resumes'],
      ] } },
      { id: 'responses', title: 'Useful things make options', paragraphs: [
        'A toolkit, umbrella, medicine or compost can make a response possible when the matching problem exists. A visitor may be shooed or offered an eligible item. These are choices, not promises of success.',
        'Cooking or backup heat can also go wrong and need a quick response. Supplying care does not make a life invulnerable.',
      ] },
      { id: 'not-a-merchant', title: 'A visitor is not a trader', paragraphs: [
        'The current visitors are animals and household encounters, not merchants or another player’s agent. There is no NPC barter market.',
        'Finished goods leave through the rooster’s shipping round. Their NHC credit follows the game’s onchain rules.',
      ], links: [guide('nhc', 'The purse and NHC')] },
    ], related: ['care-supplies', 'garden', 'remembered-lives'],
  },
  {
    slug: 'nft-purse', title: 'Your NFT & its purse', group: 'ownership',
    summary: 'What the NFT carries, how its purse is backed and who controls it.',
    sections: [
      { id: 'one-continuing-life', title: 'What stays with the NFT', paragraphs: [
        'The rooster’s saved state, household, garden, inventory and intention belong to its NFT. Its public link opens that rooster, not a generic example.',
        'Its original appearance comes from its procedural seed. Ownership and saved progress can be inspected through the game and the correct chain explorer.',
      ] },
      { id: 'a-purse-for-this-life', title: 'The NFT’s purse', paragraphs: [
        'An actual shipment of finished home-grown or handmade goods may credit NHC to this NFT’s purse. Harvesting and crafting alone do not mint a reward.',
        'The allocation is backed by token units held in that world’s contract vault. The rooster does not need a separate private key, and Jev cannot withdraw or spend the purse.',
      ] },
      { id: 'owner-rights', title: 'Rights stay with the owner', paragraphs: [
        'The current NFT owner can explicitly withdraw NHC, including while a day is preparing or after the rooster dies. A remembered life keeps its NFT and purse.',
        'A transfer carries the saved life, belongings and remaining purse rights to the new owner. A pending day temporarily locks transfers.',
      ], links: [guide('sharing-transfers', 'Sharing & transfers'), guide('remembered-lives', 'Remembered lives')] },
      { id: 'separate-worlds', title: 'Keep worlds separate', paragraphs: [
        'NEAR Testnet and Robinhood Testnet have separate collections, inventories and NHC supplies. There is no bridge or combined cross-chain purse.',
        'NHC is a game utility token with no promised cash redemption.',
      ] },
    ], related: ['nhc', 'sharing-transfers', 'contracts'],
  },
  {
    slug: 'nhc', title: 'NHC', group: 'ownership',
    summary: 'Earn NHC through shipping, withdraw it or use it to hatch another NFT.',
    sections: [
      { id: 'earned-through-shipping', title: 'Earned through shipping', paragraphs: [
        'Flowers, fruit and the four finished crafts are eligible goods. Gifted care supplies and raw wood cannot be shipped for NHC.',
        'The contract derives the actual goods consumed and shipment points from the day. Only a completed eligible shipment credits that life’s purse; packing, harvesting or crafting alone does not.',
      ] },
      { id: 'changing-rewards', title: 'Rewards change', paragraphs: [
        'Each world has a bounded reward bucket and cumulative issuance pressure. As more NHC has been issued in that world, the same goods credit less than at the start.',
        'Supply limits, growing time, materials, Jev’s choices and survival all affect what can be shipped. There is no fixed income, guaranteed sale or promised cash exchange.',
      ] },
      { id: 'what-to-do-with-it', title: 'Keep, withdraw or hatch', bullets: [
        'Keep NHC in the life’s purse.',
        'Withdraw it to the current owner’s wallet with an explicit confirmation.',
        'Burn 250 NHC from one selected purse to hatch another life.',
      ], paragraphs: [
        'The app also supports wallet-token hatching. On Robinhood this needs an exact ERC-20 approval before birth; native NEAR burns wallet units directly. NHC uses six decimal places in both worlds.',
        'Burning for a birth does not reset cumulative issuance pressure. Native network gas and day-preparation fees remain separate from NHC.',
      ] },
      { id: 'transfer-burn', title: 'A 0.5% transfer burn', paragraphs: [
        'Current testnet contracts burn 0.5% of ordinary NHC transfers while the owner-controlled switch is on. A purse withdrawal debits the gross amount; the review shows the burn and what reaches your wallet.',
        'Shipment issuance and direct 250-NHC birth burns have no extra transfer fee. The original Robinhood collection keeps its original token rules.',
      ] },
      { id: 'after-transfer-or-death', title: 'After transfer or death', paragraphs: [
        'Remaining purse rights move with the NFT. Death stops new days and future production, but does not confiscate already credited tokens.',
        'Withdrawing from a purse does not withdraw the rooster’s household items. Those remain part of its saved life.',
      ] },
    ], related: ['nft-purse', 'workshop', 'contracts'],
  },
  {
    slug: 'sharing-transfers', title: 'Sharing & transfers', group: 'ownership',
    summary: 'Share a rooster’s saved days or transfer its NFT, home and remaining purse rights.',
    sections: [
      { id: 'share-a-life', title: 'Share a rooster', paragraphs: [
        'Use the life’s share link to preserve its NFT number, collection and world. A visitor can view the public home and saved days without connecting a wallet.',
        'Viewing and replaying do not grant care, spending or ownership permissions. Only the current owner can accept another day or use the purse.',
      ] },
      { id: 'transfer-together', title: 'Transfer the NFT', paragraphs: [
        'An NFT transfer carries the saved home, garden, inventory, intention and remaining purse rights. The former owner no longer controls the purse.',
        'Transfers are temporarily locked while a day is pending. Let that original attempt settle or resolve before transferring; changing wallet accounts does not cancel it.',
      ] },
      { id: 'use-the-correct-chain', title: 'Use the correct chain', paragraphs: [
        'Check the collection and world before using a wallet or third-party transfer tool. A Robinhood address and a native NEAR account use different transaction systems.',
        'Native NEAR supports direct NFT transfers, approvals and enumeration. The asynchronous nft_transfer_call route is disabled. Do not assume every marketplace flow is supported.',
      ], links: [guide('contracts', 'Collections & source'), guide('worlds-wallets', 'Worlds & wallets')] },
    ], related: ['nft-purse', 'remembered-lives', 'privacy-data'],
  },
  {
    slug: 'remembered-lives', title: 'Remembered lives', group: 'ownership',
    summary: 'A life can end. Its history and remaining purse do not disappear.',
    sections: [
      { id: 'care-matters', title: 'Care matters', paragraphs: [
        'Unresolved hunger, thirst, wounds, illness or infection can end a life. Supplying useful care gives Jev options; it does not guarantee every choice or outcome.',
        'Rare accidents can also happen, including an unavoidable structural accident in the current rules. A healthy rooster is not immortal.',
      ] },
      { id: 'nothing-ages-offline', title: 'No clock while you are away', paragraphs: [
        'A rooster does not lose health, grow plants or face events merely because real time passes. Biological time advances when a new day is completed.',
        'Pausing, finishing a film or rewatching history changes the presentation, not the life’s age. A failed operational attempt leaves the biological save unchanged.',
      ] },
      { id: 'what-remains', title: 'What remains', paragraphs: [
        'A remembered life keeps its NFT, final saved home and history. It cannot prepare new days or make more goods.',
        'The current owner can still withdraw its remaining NHC. The NFT and purse rights can still transfer when no pending day locks them.',
      ], links: [guide('nft-purse', 'Your NFT & its purse'), guide('first-day', 'Hatch another rooster')] },
    ], related: ['care-supplies', 'nft-purse', 'nhc'],
  },
  {
    slug: 'jev-saving', title: 'Jev & saving', group: 'technical',
    summary: 'How Jev chooses actions and how the contract verifies the completed day.',
    sections: [
      { id: 'the-mind', title: 'Jev chooses', paragraphs: [
        'NEAR AI Cloud’s Jev model receives the current life, supplies, needs, recent attempts and a bounded set of legal choices. It chooses one main undertaking and smaller routines, with soft preferences for that particular rooster.',
        'A saved intention may carry into later days. Current incidents include their actual target and response window; future events are not revealed. This is not an open chat or a player-written command script.',
      ] },
      { id: 'sealed-thoughts', title: 'Replies stay sealed', paragraphs: [
        'During preparation, a completed response leaves a sealed thought. The interface shows progress without revealing the chosen action or spoiling the day.',
        'The linked-block stage shows the completed day being saved. Its film becomes ready after settlement, and plays those recorded outcomes rather than making new choices during playback.',
      ] },
      { id: 'what-is-verified', title: 'What the chain checks', paragraphs: [
        'The service submits a bounded action trace. The contract checks the life rules, material consumption, growth, crafting, death and shipment points, then derives the saved state and reward.',
        'The relay is trusted to call Jev and choose delegated actions. Offchain inference is not claimed to be trustless or cryptographically attested. Published source and verification evidence are not a third-party security audit.',
      ], links: [
        { label: 'Day preparation source', href: `${source}/blob/main/server/evm/preparation.ts` },
        { label: 'Jev choice context', href: `${source}/blob/main/server/evm/choices.ts` },
        guide('contracts', 'Contracts & official links'),
      ] },
      { id: 'when-a-call-fails', title: 'If preparation fails', paragraphs: [
        'An operational failure does not advance the biological save. A confirmed transaction remains onchain and is not erased or automatically refunded.',
        'Check the original attempt first if the wallet result is uncertain. Once an attempt is conclusively failed, the app can offer a fresh try.',
      ], links: [guide('troubleshooting', 'A wallet or day needs help')] },
    ], related: ['first-day', 'contracts', 'privacy-data'],
  },
  {
    slug: 'contracts', title: 'Contracts & official links', group: 'technical',
    summary: 'The two current testnet collections, their source and the rules behind each saved day.',
    sections: [
      { id: 'current-deployments', title: 'Current testnet worlds', paragraphs: [
        'The collection and token links on this page identify the currently configured testnet deployments. Follow the explorer for that world; a mainnet explorer or an unrelated collection is a different asset.',
        'Robinhood uses an ERC-721 life and ERC-20 NHC. Native NEAR combines its NFT and NEP-141 token interfaces in one contract account. Each world backs its own NFT purse allocations.',
      ] },
      { id: 'source', title: 'Read the source', links: [
        { label: 'Download the contract sources (.zip)', href: PROJECT.sourceArchive },
        { label: 'Source file hashes & build settings', href: '/source/nearlyhuman-contracts.json' },
        { label: 'Robinhood collection source', href: '/source/evm/Game.sol.txt' },
        { label: 'Native NEAR contract source', href: '/source/near/lib.rs.txt' },
        { label: 'Original deployment sources (.zip)', href: '/source/contracts.zip' },
        { label: 'Original source hashes & settings', href: '/source/manifest.json' },
        { label: 'Project repository', href: source },
        { label: 'Robinhood contracts', href: `${source}/tree/main/contracts/evm` },
        { label: 'Native NEAR contract', href: `${source}/tree/main/contracts/near` },
        { label: 'Shared life rules', href: `${source}/tree/main/src/domain` },
        { label: 'How saved days are verified', href: '/docs/jev-saving#what-is-verified' },
      ], paragraphs: ['Downloads include exact source hashes, pinned build settings and public deployment references. The original source archive remains unchanged.'] },
      { id: 'authority', title: 'Know the boundaries', bullets: [
        'Owners explicitly approve hatching, paid days, withdrawals and token-funded births.',
        'The relay selects delegated choices; contracts derive legal inventory and rewards.',
        'Administrative roles can pause admissions and manage supported settings under contract rules.',
        'Game randomness suits this casual game; it is not presented as secure lottery randomness.',
        'The hosted app, inference service and relay remain operational dependencies.',
      ], links: [guide('jev-saving', 'Jev & saving'), guide('nft-purse', 'Purse ownership')] },
    ], related: ['worlds-wallets', 'jev-saving', 'privacy-data'],
  },
  {
    slug: 'troubleshooting', title: 'Help & recovery', group: 'start',
    summary: 'Find the next useful step without losing the attempt you already made.',
    sections: [
      { id: 'wrong-wallet', title: 'The wallet or network looks wrong', paragraphs: [
        'Check the world name in the app. Native NEAR needs its NEAR Testnet account in Meteor; Robinhood needs the selected EVM address on chain 46630.',
        'Reconnect the intended account and check its native testnet balance. A balance on another chain is not spendable in this world.',
      ], links: [guide('worlds-wallets', 'Wallets & testnet funds')] },
      { id: 'two-confirmations', title: 'Why another confirmation?', paragraphs: [
        'The readable ownership message signs you in without spending funds. A paid onchain action is a separate confirmation with a fee.',
        'Token-funded hatching can also need an ERC-20 approval on Robinhood before the birth transaction. Review the action and amount instead of assuming every request is just a sign-in.',
      ] },
      { id: 'uncertain-payment', title: 'The wallet closed or the page restarted', paragraphs: [
        'Return to the same app, world and owner account. Use the displayed check or resume action for the original payment, then inspect its explorer result if available.',
        'Do not start another payment just because a callback was missed. Keep the browser’s site data: the app uses it to recognise interrupted operations.',
      ], links: [{ label: 'Return to the app', href: PROJECT.appHref }] },
      { id: 'failed-day', title: 'The day could not finish', paragraphs: [
        'Wait for the app to resolve the original attempt. A conclusive operational failure leaves the saved life unchanged; then you can prepare a fresh attempt.',
        'Confirmed transactions remain visible and fees are not automatically refunded. A rejected wallet request sends nothing; it is different from a confirmed failed transaction.',
      ] },
      { id: 'quiet-day', title: 'It did not use what I packed', paragraphs: [
        'Jev chooses from what is possible. A seed may stay in storage, wood may be saved, and a finished object may be kept instead of shipped. A quiet day is allowed.',
        'Check the pantry, bed and current needs before choosing the next supplies. Jev decides which available actions to take.',
      ], links: [guide('care-supplies', 'Care & supplies'), guide('garden', 'Growth and harvesting')] },
    ], related: ['worlds-wallets', 'first-day', 'jev-saving'],
  },
  {
    slug: 'privacy-data', title: 'Public life & your data', group: 'technical',
    summary: 'The life is public. Wallet approval and the service’s operating records are different layers.',
    sections: [
      { id: 'public-life', title: 'Public game data', paragraphs: [
        'Wallet addresses, NFT ownership and transactions are public on their chain. The game also exposes public life views, NFT metadata and saved-day films so a shared link can show the same life to another visitor.',
        'A rooster’s name, home, inventory, intentions and saved outcomes should be treated as public game data. Do not put personal secrets into a name.',
      ] },
      { id: 'service-records', title: 'What the service handles', paragraphs: [
        'Sign-in uses a wallet address or NEAR account, a signed challenge and a short-lived session. Owner-only requests use that session to check the selected owner and world.',
        'The hosted service keeps preparation jobs, quotes, replay records and inference/accounting records needed to operate the game. Jev receives game context such as the rooster’s name, needs, stock, intention and recent activity.',
        'Public game data and owner-only service records are not the same access layer. This game does not promise confidential inference or a private blockchain history.',
      ] },
      { id: 'this-browser', title: 'What stays in this browser', paragraphs: [
        'The app remembers selected worlds, visit state, wallet-session information and interrupted-operation records in browser storage. Those records help restore the right context after a restart.',
        'Clearing site data can remove local recovery context. It does not erase the NFT, an onchain transaction or the service’s saved records.',
      ] },
      { id: 'wallet-secrets', title: 'Keep recovery words in your wallet', paragraphs: [
        'NEARlyHuman connects through the wallet’s own approval flow. The site does not need your recovery words or private key.',
        'Opening wallet, faucet, explorer or other external links takes you to that provider. Check the destination before approving anything.',
      ], links: [guide('contracts', 'Official project links'), guide('troubleshooting', 'Help with an interrupted attempt')] },
    ], related: ['sharing-transfers', 'jev-saving', 'contracts'],
  },
];

export function getArticle(slug: string): GuideArticle | undefined {
  return ARTICLES.find(article => article.slug === slug);
}
