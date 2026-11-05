/** Cosmetic, seed-stable cottage finishes; this never depicts game possessions. */
export function portraitWallMaterial(salt: number, colors: { trim: string; wall: string; plaster: string; wood: string }): string {
  const out: string[] = [];
  const rect = (x: number, y: number, w: number, h: number, color: string, opacity = 1) => out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"${opacity === 1 ? '' : ` opacity="${opacity}"`}/>`);
  const path = (d: string, color: string, opacity = 1) => out.push(`<path d="${d}" fill="${color}"${opacity === 1 ? '' : ` opacity="${opacity}"`}/>`);
  let random = salt >>> 0;
  const draw = () => {
    random ^= random << 13; random ^= random >>> 17; random ^= random << 5;
    return random >>> 0;
  };
  const finish = salt % 4;
  if (finish === 0) {
    // Painted clapboards: broad luminous boards, narrow shaded lower lips.
    rect(8, 23, 88, 71, '#e9d8ae');
    for (let row = 0; row < 10; row++) {
      const y = 23 + row * 8;
      rect(8, y, 88, 7, row % 3 === 0 ? '#f5e7c5' : row % 3 === 1 ? '#e8d9b3' : '#efe0bb');
      rect(8, y, 88, 1, '#fff0ce', .8);
      rect(8, y + 7, 88, 1, '#9d8c6b', .65);
      const seam = 31 + (row % 3) * 23;
      rect(seam, y + 1, 1, 6, '#bfa983', .55);
      for (const x of [10, 47, 94]) {
        rect(x, y + 4, 1, 1, '#9b8c70', .65);
        rect(x, y + 5, 1, 1, '#fff1cf', .8);
      }
    }
    for (let i = 0; i < 20; i++) {
      const x = 10 + draw() % 82, y = 26 + draw() % 61;
      const w = 3 + draw() % 7;
      path(`M${x} ${y}h${w}v1h-3v1h-3v-1h-2z`, '#ba9f78', .3);
    }
    path('M10 33h6v1h3v1h-7v-1h-2zM53 66h8v1h-2v1h-5v-1h-1zM82 87h8v1h-6v1h-2z', '#b89b72', .45);
  } else if (finish === 1) {
    // Timber-and-lime panels. Structural darks stay outside the rooster's face.
    rect(8, 23, 88, 71, '#dfc9a3');
    rect(13, 28, 25, 57, '#f1dfb7');
    rect(46, 28, 48, 57, '#ead4ac');
    path('M15 29h20v2H17v48h-2zM48 30h43v2H50v48h-2z', '#fff0c9', .72);
    path('M12 23h32v5H12zM8 23h5v71H8zM38 24h7v70h-7zM94 23h5v71h-5zM11 85h86v7H11z', colors.trim);
    path('M10 24h2v60h-2zM39 28h2v55h-2zM95 28h2v55h-2zM13 85h81v2H13z', colors.wood);
    path('M15 28h4v4h4v4h4v4h4v4h4v5h-4v-5h-4v-4h-4v-4h-4v-4h-4z', '#a57f58');
    path('M17 28h2v4h4v4h4v4h4v4h4v2h-2v-2h-4v-4h-4v-4h-4v-4h-4z', '#ceaa77');
    for (let i = 0; i < 22; i++) {
      const x = 15 + draw() % 77, y = 31 + draw() % 50;
      path(`M${x} ${y}h${2 + draw() % 5}v1h-2v1h-2z`, i % 3 ? '#bda480' : '#fff0c8', .45);
    }
    path('M40 32v9h1v7h-1v9M96 54v8h1v11', '#5d4c3f', .45);
    for (const [x, y] of [[10, 29], [40, 29], [40, 81], [96, 81], [15, 88], [90, 88]]) rect(x, y, 1, 1, '#e2c28d');
  } else if (finish === 2) {
    // Hand-trowelled ochre/terracotta wash, with weathered stone at the foot.
    rect(8, 23, 88, 71, '#dfb48a');
    path('M14 27h20v3h12v5h-8v9H23v-4H13zM47 28h42v5h-7v9H65v-4H49zM16 53h32v4h7v11H42v6H21zM56 60h27v3h9v12H75v6H56z', '#edca9d', .78);
    path('M11 27h4v20h-4zM44 44h13v3h-6v6h-7zM82 36h11v15h-3V40h-8zM17 76h17v5H17zM51 79h12v3H51z', '#bd8c71', .44);
    path('M25 31h13v1H25zM52 36h10v1H52zM58 66h17v1H58zM28 68h8v1h-8zM76 79h11v1H76z', '#f6d9aa', .75);
    for (let i = 0; i < 32; i++) {
      const x = 11 + draw() % 81, y = 27 + draw() % 57;
      rect(x, y, 1 + draw() % 3, 1, i % 3 ? '#ad8265' : '#ffe0b3', .3);
    }
    rect(8, 83, 88, 11, '#9e9276');
    const stones = [[8,83,16,5],[26,83,22,6],[50,83,12,5],[64,83,19,6],[85,82,11,7],[8,90,24,6],[34,90,17,5],[53,90,23,6],[78,90,18,5],[8,25,6,10],[8,37,7,12],[8,51,6,8]];
    for (let i = 0; i < stones.length; i++) {
      const [x,y,w,h] = stones[i]!;
      rect(x,y,w,h,i % 3 === 0 ? '#c1b08b' : i % 3 === 1 ? '#b09d7e' : '#ccbb94');
      rect(x+1,y,w-2,1,'#e0cc9c',.75);
      if (i % 2) rect(x+w-3,y+2,2,1,'#8b8068',.5);
    }
  } else {
    // Uneven warm limestone courses. Low-contrast mortar keeps the face readable.
    rect(8, 23, 88, 71, '#ac9c7c');
    let y = 23;
    for (let row = 0; y < 94; row++) {
      const height = 9 + draw() % 5;
      let x = 5 - (row % 2) * 8;
      while (x < 96) {
        const width = 14 + draw() % 14;
        const tone = ['#d2c09a', '#dcca9f', '#c5b38f', '#e0cba0', '#cdbc97'][draw() % 5]!;
        path(`M${x+1} ${y}h${width-3}v1h2v${height-3}h-1v1H${x+1}v-1h-1v-${height-3}h1z`, tone);
        rect(x+2,y+1,width-5,1,'#f2dfb2',.65);
        path(`M${x+3} ${y+height-3}h${width-7}v1H${x+3}z`, '#9e8e71', .4);
        const grain = 3 + draw() % (width - 5);
        rect(x+grain,y+3,2+draw()%3,1,'#ad9875',.45);
        if (draw()%2) rect(x+width-5,y+height-5,2,1,'#f3dfad',.65);
        x += width;
      }
      y += height;
    }
    path('M10 26h1v7h-1zM45 37h1v4h-1zM92 72h1v5h-1z', '#8b8167', .4);
  }
  return `<defs><clipPath id="wall-material"><rect x="8" y="23" width="88" height="71"/></clipPath></defs><g clip-path="url(#wall-material)">${out.join('')}</g>`;
}
