# Responsive website image optimization

4 November 2026. This pass reduces the bytes needed for the public website's environment and handbook illustrations. It does not redraw either illustration, change the canonical rooster, alter NFT metadata or touch gameplay/chain state.

## Selected assets

The original PNGs under `design/website-build/assets/` remain the input. New static variants are committed under `public/site/`; production does not depend on the scratch generator or any TEMP file. The previous `hero-home.webp` and `handbook.webp` are retained for cached pages and compatibility.

| Image | Dimensions | AVIF bytes | WebP bytes | AVIF reduction from previous single image |
| --- | --- | ---: | ---: | ---: |
| Hero | 640×480 | 107,624 | 114,446 | 78.5% |
| Hero | 960×720 | 198,426 | 217,268 | 60.4% |
| Hero | 1448×1086 | 345,545 | 384,396 | 31.1% |
| Handbook | 320×213 | 23,342 | 24,642 | 80.8% |
| Handbook | 560×373 | 49,782 | 54,728 | 59.1% |
| Handbook | 768×512 | 77,848 | 85,150 | 36.1% |

The previous hero was **501,190 bytes** at 1448×1086; the previous handbook was **121,772 bytes** at 768×512. These percentages compare encoded asset sizes, not a measured page-load-time improvement. The selected size depends on actual layout width and device pixel ratio; a higher-density phone may choose960px rather than640px.

Files follow `hero-home-{width}.avif` / `.webp` and `handbook-{width}.avif` / `.webp`. [The machine manifest](image-variants.json) records all dimensions, hashes, byte counts, original-source hashes and transparency checks.

## Quality and transparency

The comparison included resized lossless references, the existing high-quality WebP, WebP qualities 80/86/90, AVIF qualities 65/75/85 and nearest-neighbor versus LANCZOS resizing. Actual-display sheets at 320px and 720px were inspected as well as 640px native candidates. LANCZOS kept the illustrative material lines and silhouettes more natural than nearest-neighbor at these fractional resize ratios. AVIF 75 and WebP 86 retained the roof, floor, vegetation and book details closely at their intended display sizes.

Default AVIF encoding made the alpha plane slightly lossy. The selected AVIFs instead use the encoder's lossless alpha setting. All 12 final variants were decoded and their alpha planes compared with the corresponding resized RGBA reference: **maximum alpha error 0**. Transparent corners remain fully transparent, with no solid matte. RGB compression remains lossy; these are not claimed pixel-identical to the original PNGs. The separate canonical rooster SVG pixels are unchanged.

## Reproduction

Tooling used Pillow 12.3 with the already-installed AVIF/WebP codecs; no production dependency was added. Proportional dimensions are rounded to whole pixels. Each size is made directly from its original PNG, never from a previously compressed WebP.

```python
from PIL import Image

source = Image.open("design/website-build/assets/hero-home-original.png").convert("RGBA")
width = 640
height = round(source.height * width / source.width)
image = source.resize((width, height), Image.Resampling.LANCZOS)
image.save("hero-home-640.avif", "AVIF", quality=75, speed=6,
           subsampling="4:4:4", advanced={"a:lossless": "1"})
image.save("hero-home-640.webp", "WEBP", quality=86, method=6,
           alpha_quality=100, exact=True)
```

For the full 1448px hero, the original dimensions are used without resizing. The handbook uses the same process from `handbook-original.png`. The page integration should provide matching picture/source widths and accurate sizes; unused small/detail illustrations can remain lazy-loaded. Browser request selection and load timings are verified separately from these encoding checks.
