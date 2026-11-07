"""Regenerate the site's grainy gradient PNGs with Python's standard library."""

import math
from pathlib import Path
import random
import struct
import zlib


OUTPUT = Path(__file__).resolve().parents[1] / 'public/assets/gradients'
OUTPUT.mkdir(parents=True, exist_ok=True)


def render(name, width, height, sample, transparent=False):
    rng = random.Random(name)
    pixels = bytearray()
    for y in range(height):
        pixels.append(0)  # PNG filter: none
        for x in range(width):
            value = sample((x + 0.5) / width, (y + 0.5) / height)
            # Uncorrelated grain breaks up quantisation, with a deliberately
            # visible texture. RGBA textures dither coverage, not white RGB.
            grain = min(2.5, value) if transparent else 2.5
            value = max(0, min(255, round(value + rng.uniform(-grain, grain))))
            pixels.extend((255, 255, 255, value) if transparent else (value,) * 3)

    def chunk(kind, data):
        return (struct.pack('!I', len(data)) + kind + data
                + struct.pack('!I', zlib.crc32(kind + data)))

    header = struct.pack('!2I5B', width, height, 8, 6 if transparent else 2, 0, 0, 0)
    png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header)
           + chunk(b'IDAT', zlib.compress(pixels, 9)) + chunk(b'IEND', b''))
    (OUTPUT / (name + '.png')).write_bytes(png)


def radial(x, y, cx, cy, rx, ry, end=0.75):
    return max(0, 1 - math.hypot((x - cx) / rx, (y - cy) / ry) / end)


render('feature', 1200, 800, lambda x, y:
       23 - 5 * y + 14 * radial(x, y, .5, -.25, .7, 1.1))
render('button', 600, 120, lambda x, y:
       42 + (255 - 42) * 16 / 255 * radial(x, y, .5, -.5, .9, 1.5))
render('card', 900, 400, lambda x, y:
       36 + (255 - 36) * 8 / 255 * radial(x, y, .5, -.8, 1.1, 1.7, .7))
render('border', 900, 600, lambda x, y:
       5 + 31 * max(0, 1 - (x * .26 + y) / .65), True)
render('edge', 1000, 2, lambda x, y: 48 * (1 - abs(2 * x - 1)), True)
# Full radial pools have transparent margins so they can move without tiling.
render('light', 760, 420, lambda x, y:
       48 * radial(x, y, .5, .5, .5, .5, 1), True)
render('feature-light', 920, 600, lambda x, y:
       8 * radial(x, y, .5, .5, .5, .5), True)
render('under-light', 320, 100, lambda x, y:
       12 * radial(x, y, .5, .5, .5, .5, 1), True)
render('halo', 900, 400, lambda x, y:
       28 * radial(x, y, .5, .5, .5, .5, .7), True)
render('reflection', 1000, 1000, lambda x, y:
       230 * radial(x, y, .5, .5, .5, .5, 1) ** 2, True)
