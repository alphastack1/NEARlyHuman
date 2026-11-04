import robinhood from '../../contracts/v2/deployments/robinhood-testnet.json';
import near from '../../contracts/near/deployments/testnet.json';

const rhParams = new URLSearchParams({ v2: '1', chainId: String(robinhood.runtime.chainId), collection: robinhood.runtime.collection });
const nearParams = new URLSearchParams({ v2: '1', networkId: near.runtime.networkId, collection: near.runtime.collection });
const sourceUrl = 'https://github.com/alphastack1/NEARlyHuman';
export const PROJECT = {
  name: 'NEARlyHuman', siteUrl: 'https://nearlyhuman.netlify.app', sourceUrl,
  sourceArchive: '/source/contracts.zip',
  appHref: '/app?v2=1',
  exampleHref: `/?${rhParams}&rooster=1`,
  exampleImage: `/api/v2/nft/1/image.svg?chainId=${robinhood.runtime.chainId}&collection=${robinhood.runtime.collection}`,
  worlds: [
    { id: 'near-testnet', name: 'NEAR Testnet', shortName: 'NEAR', wallet: 'Meteor', currency: 'test NEAR',
      collection: near.runtime.collection, token: near.runtime.collection,
      explorer: `https://testnet.nearblocks.io/address/${near.runtime.collection}`,
      tokenExplorer: `https://testnet.nearblocks.io/address/${near.runtime.collection}`,
      sourceHref: '/source/files/contracts/near/src/lib.rs.txt', appHref: `/app?${nearParams}` },
    { id: 'robinhood-testnet', name: 'Robinhood Testnet', shortName: 'Robinhood', wallet: 'Rabby / EVM wallet', currency: 'test ETH',
      collection: robinhood.runtime.collection, token: robinhood.token,
      explorer: `https://explorer.testnet.chain.robinhood.com/address/${robinhood.runtime.collection}`,
      tokenExplorer: `https://explorer.testnet.chain.robinhood.com/address/${robinhood.token}`,
      sourceHref: '/source/files/contracts/v2/NEARlyHumanV2.sol.txt', appHref: `/app?${rhParams}` },
  ],
} as const;
