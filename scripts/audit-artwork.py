#!/usr/bin/env python3
"""Make art inspection sheets from the geometry exercised by the native JVM test.

These are artwork-fit previews, not screenshots of an Android device.
Requires Pillow; run after testDebugUnitTest.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'app/build/reports/artwork-layout.json'
OUT = ROOT / 'artifacts/artwork-audit'


def render(entry):
    viewport = Image.new('RGB', tuple(entry['viewport']), '#171310')
    with Image.open(ROOT / 'game' / entry['file']) as atlas:
        frame = atlas.crop(tuple(entry['source'])).convert('RGB')
    left, top, right, bottom = entry['destination']
    frame = frame.resize((round(right-left), round(bottom-top)), Image.Resampling.LANCZOS)
    viewport.paste(frame, (round(left), round(top)))
    return viewport


def main():
    entries = json.loads(REPORT.read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    for label, size in [('phone', [392, 420]), ('landscape', [824, 310]),
                        ('evidence', [280, 220]), ('collection', [600, 150])]:
        selected = sorted((e for e in entries if e['viewport'] == size), key=lambda e: e['key'])
        width, height = 210, 260 if label == 'phone' else 150
        sheet = Image.new('RGB', (width*7, height*((len(selected)+6)//7)), '#28211c')
        draw = ImageDraw.Draw(sheet)
        for index, entry in enumerate(selected):
            preview = render(entry)
            preview.thumbnail((width-10, height-28), Image.Resampling.LANCZOS)
            x = (index % 7)*width + (width-preview.width)//2
            y = (index // 7)*height
            sheet.paste(preview, (x, y))
            draw.text(((index % 7)*width+5, y+height-22), entry['key'], fill='#ff9a59')
        sheet.save(OUT / f'all-65-{label}.jpg', quality=92)
    for key in ['bar', 'underpass', 'cover', 'television', 'evidenceTable']:
        render(next(e for e in entries if e['key'] == key and e['viewport'] == [392, 420])).save(OUT / f'{key}-phone.png')
    print(f'650 native geometry checks; 65 illustrations in four inspection sheets: {OUT}')


if __name__ == '__main__':
    main()
