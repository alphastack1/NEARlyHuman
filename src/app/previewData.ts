import type { Stats, TargetId } from '../domain';

export interface PreviewDay {url:string;tokenId:string;day:number;name:string;seed:string;stats:Stats;startTarget:TargetId}
/** Verified recorded visits, loaded individually; cosmetic boot identity matches the first. */
export const PREVIEW_DAYS:[PreviewDay,...PreviewDay[]]=[
  {
    "url": "/assets/preview/miso-day2-cba7a5e34202.json",
    "tokenId": "3",
    "day": 2,
    "name": "MISO",
    "seed": "0x5a4737bdc5788a3acb7ccec2063cf76a91791d0e4e203ee7e3a4a8f84dc3a1ec",
    "stats": {
      "body": 2,
      "wits": 2,
      "spirit": 1
    },
    "startTarget": "bed"
  },
  {
    "url": "/assets/preview/miso-day3-7835a1cdc3fe.json",
    "tokenId": "3",
    "day": 3,
    "name": "MISO",
    "seed": "0x5a4737bdc5788a3acb7ccec2063cf76a91791d0e4e203ee7e3a4a8f84dc3a1ec",
    "stats": {
      "body": 2,
      "wits": 2,
      "spirit": 1
    },
    "startTarget": "bed"
  },
  {
    "url": "/assets/preview/peep-day3-40268cb03106.json",
    "tokenId": "2",
    "day": 3,
    "name": "PEEP",
    "seed": "0x979865feead295b3add9300f03b7591f1c800ad7008c762121e70698a3ec7efa",
    "stats": {
      "body": 2,
      "wits": 2,
      "spirit": 1
    },
    "startTarget": "bed"
  }
];
export const PREVIEW_DAY_URL=PREVIEW_DAYS[0].url;
