"""Build the journal's committed font subsets from source, without an Astro build.

Requires fonttools/brotli only when regenerating; ordinary builds use the saved
WOFF2 assets. Unknown future characters retain native serif fallbacks.
"""
import copy
import hashlib
import io
import json
import re
import urllib.request
from collections import Counter
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "src/assets/fonts"
CACHE = ROOT / ".artifacts/font-sources"
MANIFEST = ROOT / "docs/font-manifest.json"
PUNCTUATION = "，。、“”‘’：；！？…—·（）《》「」『』【】［］"


def chinese(text):
    return {ord(c) for c in text if 0x3400 <= ord(c) <= 0x9FFF or c in PUNCTUATION}


def ranges(chars):
    values = sorted(chars)
    groups = []
    if not values:
        return ""
    start = end = values[0]
    for value in values[1:]:
        if value == end + 1:
            end = value
        else:
            groups.append(f"U+{start:X}" if start == end else f"U+{start:X}-{end:X}")
            start = end = value
    groups.append(f"U+{start:X}" if start == end else f"U+{start:X}-{end:X}")
    return ",".join(groups)


def subset_font(font, chars):
    options = subset.Options()
    options.recalc_timestamp = False
    cutter = subset.Subsetter(options=options)
    cutter.populate(unicodes=sorted(set(chars).intersection(font.getBestCmap())))
    cutter.subset(font)
    return font


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    previous = json.loads(MANIFEST.read_text(encoding="utf-8"))
    revision = previous["googleFontsRevision"]
    frequency = Counter()
    headings = set()
    display = chinese(PUNCTUATION)
    for source in (ROOT / "src").rglob("*"):
        if source.suffix not in {".md", ".astro", ".ts"}:
            continue
        text = source.read_text(encoding="utf-8")
        for char in text:
            if ord(char) in chinese(char):
                frequency[ord(char)] += 1
        if source.suffix == ".md":
            for title in re.findall(r"^title:\s*(.+)$", text, re.M):
                display.update(chinese(title))
            for title in re.findall(r"^#{1,6}\s+(.+)$", text, re.M):
                headings.update(chinese(title))
                display.update(chinese(title))
            for strong in re.findall(r"\*\*(.+?)\*\*", text):
                headings.update(chinese(strong))
        else:
            display.update(chinese(text))
    corpus = set(frequency) | display | headings
    headings |= display
    font_path = CACHE / "noto-serif-sc.ttf"
    if not font_path.exists():
        urllib.request.urlretrieve(f"https://raw.githubusercontent.com/google/fonts/{revision}/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf", font_path)
    kai_path = CACHE / "lxgw-wenkai-regular.ttf"
    if not kai_path.exists():
        urllib.request.urlretrieve("https://github.com/lxgw/LxgwWenKai/releases/download/v1.522/LXGWWenKai-Regular.ttf", kai_path)
    source_font = subset_font(TTFont(font_path, recalcTimestamp=False), corpus)
    faces = []
    files = {}

    def save(font, name, family, weight, chars=None, style="normal"):
        # Declare actual coverage so Latin fallback faces are not downloaded
        # while the browser is resolving Chinese characters.
        if chars is None:
            chars = set(font.getBestCmap())
        font.flavor = "woff2"
        font.recalcTimestamp = False
        target = ASSETS / name
        buffer = io.BytesIO()
        font.save(buffer)
        data = buffer.getvalue()
        # Avoid rewriting fonts that the preview server may currently have open.
        if not target.exists() or target.read_bytes() != data:
            temporary = target.with_suffix(".woff2.tmp")
            temporary.write_bytes(data)
            temporary.replace(target)
        files[name] = {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
        rule = f"@font-face {{\n font-family: '{family}'; font-style: {style}; font-weight: {weight}; font-display: swap;\n src: url('../assets/fonts/{name}') format('woff2');"
        if chars:
            rule += f"\n unicode-range: {ranges(chars)};"
        faces.append(rule + "\n}")
        font.close()

    for weight in (400, 600):
        instance = instantiateVariableFont(copy.deepcopy(source_font), {"wght": weight}, inplace=True)
        if weight == 400:
            ordered = sorted(corpus, key=lambda cp: (-frequency[cp], cp))
            chunks = [set(ordered[i:i + 750]) for i in range(0, len(ordered), 750)]
        else:
            chunks = [display, headings - display]
        for index, chars in enumerate(chunks):
            if not chars:
                continue
            font = subset_font(copy.deepcopy(instance), chars)
            save(font, f"journal-serif-sc-{weight}-{index}.woff2", "Journal Serif SC", str(weight), chars)
        instance.close()
    source_font.close()

    # Display headings include article headings as well as frontmatter titles.
    kai = subset_font(TTFont(kai_path, recalcTimestamp=False), display)
    save(kai, "journal-kai-sc-400.woff2", "Journal Kai SC", "400", display)

    for style, filename in (("normal", "source-serif-4-latin-standard-normal.woff2"), ("italic", "source-serif-4-latin-standard-italic.woff2")):
        path = ROOT / "node_modules/@fontsource-variable/source-serif-4/files" / filename
        font = TTFont(path, recalcTimestamp=False)
        instantiateVariableFont(font, {"wght": (400, 600)}, inplace=True)
        save(font, f"journal-serif-latin-{style}.woff2", "Source Serif 4 Variable", "400 600", style=style)
    sans_path = ROOT / "node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-standard-normal.woff2"
    font = TTFont(sans_path, recalcTimestamp=False)
    instantiateVariableFont(font, {"wght": (400, 600)}, inplace=True)
    save(font, "journal-sans-latin.woff2", "DM Sans Variable", "400 600")

    # Editorial display face: Lora, a well-balanced serif with sturdy strokes,
    # covers latin display/editorial text (replaces Fraunces whose thin strokes
    # read poorly at heading sizes).
    for style, filename in (("normal", "lora-latin-wght-normal.woff2"), ("italic", "lora-latin-wght-italic.woff2")):
        path = ROOT / "node_modules/@fontsource-variable/lora/files" / filename
        font = TTFont(path, recalcTimestamp=False)
        instantiateVariableFont(font, {"wght": (400, 600)}, inplace=True)
        save(font, f"journal-editorial-latin-{style}.woff2", "Lora Variable", "400 600", style=style)

    # Code face: JetBrains Mono — designed for developers, clear letterforms.
    for style, filename in (("normal", "jetbrains-mono-latin-wght-normal.woff2"), ("italic", "jetbrains-mono-latin-wght-italic.woff2")):
        path = ROOT / "node_modules/@fontsource-variable/jetbrains-mono/files" / filename
        font = TTFont(path, recalcTimestamp=False)
        instantiateVariableFont(font, {"wght": (400, 600)}, inplace=True)
        save(font, f"journal-mono-latin-{style}.woff2", "JetBrains Mono Variable", "400 600", style=style)

    (ROOT / "src/styles/fonts.css").write_text("/* Generated from the journal's text by scripts/prepare-fonts.py. */\n" + "\n\n".join(faces) + "\n", encoding="utf-8")
    MANIFEST.write_text(json.dumps({"googleFontsRevision": revision, "weightRange": [400, 600], "corpusGlyphCount": len(corpus), "displayGlyphCount": len(display), "headingGlyphCount": len(headings), "files": files}, indent=2) + "\n", encoding="utf-8")
    for name in previous.get("files", {}):
        stale = ASSETS / name
        if name not in files and stale.parent == ASSETS and stale.is_file():
            stale.unlink()
    print(json.dumps({"corpusGlyphs": len(corpus), "displayGlyphs": len(display), "files": files, "totalBytes": sum(item["bytes"] for item in files.values())}, indent=2), flush=True)


if __name__ == "__main__":
    main()
