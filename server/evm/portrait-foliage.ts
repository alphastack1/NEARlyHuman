/** Foreground wild leaves, permanently outside the four productive garden beds. */
export function portraitCornerFoliage(colors: { deep: string; grass: string; light: string }, salt: number): string {
  const dark = colors.deep, mid = colors.grass, light = colors.light;
  const out: string[] = [];
  const path = (d: string, color: string, opacity = 1) => out.push(`<path d="${d}" fill="${color}"${opacity === 1 ? '' : ` opacity="${opacity}"`}/>`);
  const rect = (x: number, y: number, w: number, h: number, color: string, opacity = 1) => out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"${opacity === 1 ? '' : ` opacity="${opacity}"`}/>`);
  // A single low shadow unites three broad stepped blades into one rooted clump.
  path('M0 150h5v2h8v-2h7v3h6v3h5v4H0z', dark);
  // Left blade turns toward the light: wide lobes, a sheltered underside and a
  // broken pale ridge. It reads as a leaf mass even in an eighty-pixel image.
  path('M4 159v-5H0v-6h-3v-7h4v-4h5v-3h4v5h3v9h-2v5H8v6z', dark);
  path('M3 153v-6H0v-6h3v-3h5v4h3v6H8v5z', mid);
  path('M3 140h3v4h3v4H7v-3H4v-2H3z', light);
  path('M1 149h3v3h2v3h2v3H6v-3H3v-3H1z', light, .58);
  rect(8,146,2,3,dark,.7);
  // The upper central leaf is deliberately one coherent blade, with a scalloped
  // edge rather than the old repeated vertical grass/wheat strokes.
  path('M9 158v-8H7v-7h3v-6h4v-4h4v4h3v6h-2v6h-4v9z', dark);
  path('M11 152v-8h1v-5h4v-3h1v7h2v4h-4v5z', mid);
  path('M14 139h2v5h-2v4h-2v-5h2z', light);
  path('M10 148h3v3h-1v3h-2z', light, .65);
  // A lower blade opens toward the paving, staying well clear of the rooster.
  path('M15 160v-6h2v-5h4v-4h6v-3h4v6h-3v5h-5v4h-5v3z', dark);
  path('M18 155v-5h4v-3h5v-2h2v3h-3v4h-5v3z', mid);
  path('M20 151h3v-3h5v1h-3v3h-3v2h-3v-1h1z', light);
  rect(23,154,3,1,mid,.75);
  rect(5,158,5,1,mid,.8);
  // On the right the tall blade is cropped at the very outer edge (x >= 159),
  // leaving the saved plants and their bed surfaces unobscured.
  out.push('<g transform="translate(3 0)">');
  path('M160 153h-3v-9h-1v-9h2v-6h3v-5h6v7h3v10h-4v7h-4v5z', dark);
  path('M159 146v-9h1v-6h4v-4h1v8h2v4h-3v5h-3v2z', mid);
  path('M161 132h2v6h-2v4h-2v-5h2z', light);
  rect(157,140,1,5,light,.55);
  out.push('</g>');
  // The second right leaf sits below all bed surfaces, at the foreground edge.
  out.push('<g transform="translate(0 2)">');
  path('M157 160h-6v-4h-3v-4h8v-3h5v4h3v7z', dark);
  path('M154 158v-3h-3v-2h5v-2h3v2h2v2h-4v3z', mid);
  path('M153 153h3v-2h3v1h-2v3h-3v1h-1z', light);
  out.push('</g>');
  // Restrained seed-stable nicks add hand-made grain without fine noisy hatching.
  if (salt & 1) rect(16,145,1,2,light,.6);
  if (salt & 2) rect(25,148,2,1,light,.65);
  if (salt & 4) rect(158,155,2,1,light,.7);
  return `<g data-ambient-foliage="true">${out.join('')}</g>`;
}
