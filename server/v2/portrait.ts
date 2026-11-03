import { roosterSvg } from '../../src/art/rooster';
import type { V2PublicLife } from './views';

const xml = (s: string) => s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!));

/** Stable procedural identity, with current saved garden/workshop/life details. */
export function v2LifePortrait(life: Pick<V2PublicLife, 'state' | 'name'>): string {
  const s = life.state, remembered = !s.alive;
  const floor = remembered ? '#737a70' : '#b18a58', wall = remembered ? '#b7b9a8' : '#e7dfba';
  const art = roosterSvg(s.seed, 32, remembered ? 'dead' : 'idle').replace(/<svg[^>]*>/, '<g>').replace('</svg>', '</g>');
  const beds = s.plots.map((p, i) => {
    const x = 7 + i * 21, ready = p.kind > 0 && p.ticks === 0;
    const soil = p.soilBlocked ? '#66594c' : p.moisture ? '#755b42' : '#a17b51';
    const grownTree = p.kind === 9 && (p.left < 10 || p.ticks <= 3);
    const leaves = grownTree
      ? `<rect x="${x + 9}" y="76" width="3" height="12" fill="#755b42"/><rect x="${x + 4}" y="70" width="13" height="9" fill="#52734e"/><rect x="${x + 7}" y="67" width="8" height="5" fill="#8d9a71"/><rect x="${x + 5}" y="72" width="3" height="3" fill="#728661"/>`
      : p.kind ? `<rect x="${x + 9}" y="78" width="2" height="9" fill="#52734e"/><rect x="${x + 5}" y="81" width="5" height="3" fill="#52734e"/><rect x="${x + 11}" y="78" width="4" height="3" fill="#8d9a71"/>${ready ? `<rect x="${x + 7}" y="74" width="6" height="5" fill="${p.kind === 1 ? '#e7dfba' : p.kind === 2 ? '#edc55a' : p.kind === 3 || p.kind === 6 || p.kind === 7 ? '#4b667a' : '#b57153'}"/><rect x="${x + 9}" y="76" width="2" height="2" fill="#edc55a"/>` : ''}` : '';
    return `<rect x="${x}" y="84" width="18" height="8" fill="#755b42"/><rect x="${x + 1}" y="85" width="16" height="6" fill="${soil}"/>${leaves}${p.soilBlocked ? `<path d="M${x + 3} 87h4v2h3v-2h4" fill="none" stroke="#b0b398"/>` : ''}`;
  }).join('');
  const wood = s.inventory[6] ? '<path d="M72 55h12v3H72zM74 51h10v3H74z" fill="#b18a58"/><path d="M74 55v3M76 51v3" stroke="#e7dfba"/>' : '';
  const object = s.inventory[33] ? '<rect x="72" y="29" width="11" height="6" fill="#755b42"/><path d="M73 30h9M77 29v6" stroke="#e7dfba"/>'
    : s.inventory[32] ? '<path d="M74 29h7v6h-7zM72 29l6-5 6 5" fill="#b57153"/><rect x="77" y="30" width="2" height="2" fill="#182e3d"/>'
    : s.inventory[31] ? '<path d="M72 32h12l-3 3h-6z" fill="#4b667a"/><path d="M78 25v7h5z" fill="#eee9d5"/>'
    : s.inventory[30] ? '<path d="M75 27h3v4h-3zM76 31h1v4h-1z" fill="#e7dfba"/>' : '';
  const chair = s.house.chairLife ? '<path d="M13 48h9v3h-9zM12 43h2v16h-2zM21 48h2v11h-2zM14 43h7v2h-7z" fill="#755b42"/>' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 96 96" shape-rendering="crispEdges">
<rect width="96" height="96" fill="#eee9d5"/><rect x="2" y="2" width="92" height="92" fill="#182e3d"/>
<rect x="5" y="5" width="86" height="62" fill="${wall}"/><path d="M5 34h86v33H5z" fill="${floor}"/><path d="M5 39h86M5 45h86M5 51h86M5 57h86M5 63h86M25 34v5M57 39v6M17 45v6M66 51v6M35 57v6" stroke="#977547"/><path d="M5 32h86v3H5z" fill="#755b42"/>
<rect x="10" y="19" width="17" height="15" fill="#755b42"/><rect x="12" y="21" width="13" height="11" fill="#7894a0"/><path d="M18 21v11M12 26h13" stroke="#e7dfba"/>
<path d="M67 35h19v4H67zM69 39h3v19h-3zM81 39h3v19h-3z" fill="#755b42"/><path d="M68 35h17" stroke="#d4b483"/>${wood}${object}${chair}<ellipse cx="48" cy="54" rx="8" ry="1" fill="#977547"/>
<g transform="translate(31 20)">${art}</g><rect x="5" y="67" width="86" height="25" fill="#728661"/>${beds}
<rect x="5" y="5" width="86" height="11" fill="#182e3d"/><text x="9" y="13" font-family="monospace" font-size="6" font-weight="bold" fill="#eee9d5">${xml(life.name)}</text>
<text x="87" y="13" text-anchor="end" font-family="monospace" font-size="5" fill="#edc55a">${remembered ? 'REST' : `LV${String(s.level).padStart(2, '0')}`}</text></svg>`;
}
