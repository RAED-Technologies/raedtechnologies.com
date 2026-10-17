"""Generate the RAED Technologies brand asset kit into brand-assets/.

Requires: fonttools, pillow (pip), rsvg-convert, google-chrome.
Usage: python tools/brand_assets.py <dir-with-geist-500.ttf-and-geist-700.ttf>
"""
import shutil
import subprocess
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "brand-assets"
FONTS = Path(sys.argv[1])

INK, WHITE, ACCENT = "#0B0D12", "#FFFFFF", "#2F6BFF"
GRAY_ON_LIGHT, GRAY_ON_DARK = "#5B6170", "#A9B0BC"
TAGLINE = "Digital Solutions. Intelligent Automation. Software Engineering."

# Mark geometry (32-unit grid), identical to src/partials/logo.svg
R_PATH = "M10 23V9h6.2a4.3 4.3 0 0 1 1.3 8.4L21.5 23"


def mark(tile, ink, dot, size=32, x=0, y=0, rounded=True):
    s = size / 32
    rx = 7 if rounded else 0
    tile_el = f'<rect width="32" height="32" rx="{rx}" fill="{tile}"/>' if tile else ""
    return (f'<g transform="translate({x} {y}) scale({s})">{tile_el}'
            f'<path d="{R_PATH}" fill="none" stroke="{ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<circle cx="22.5" cy="10" r="2" fill="{dot}"/></g>')


class Font:
    def __init__(self, path):
        self.f = TTFont(path)
        self.glyphs = self.f.getGlyphSet()
        self.cmap = self.f.getBestCmap()
        self.upm = self.f["head"].unitsPerEm
        self.cap = self.f["OS/2"].sCapHeight

    def text(self, s, size, x, baseline, fill, tracking=0.0):
        """Outline text as an SVG path; returns (svg, advance_width)."""
        k = size / self.upm
        pen = SVGPathPen(self.glyphs)
        cx = 0.0
        for ch in s:
            g = self.cmap[ord(ch)]
            self.glyphs[g].draw(TransformPen(pen, (k, 0, 0, -k, x + cx, baseline)))
            cx += self.glyphs[g].width * k + tracking * size
        width = cx - (tracking * size if s else 0)
        return f'<path d="{pen.getCommands()}" fill="{fill}"/>', width


BOLD, MEDIUM = Font(FONTS / "geist-700.ttf"), Font(FONTS / "geist-500.ttf")


def wordmark(x, baseline, size, main, sub):
    """'RAED Technologies' as on the website header (bold + medium, .35em gap)."""
    a, w1 = BOLD.text("RAED", size, x, baseline, main, tracking=0.04)
    b, w2 = MEDIUM.text("Technologies", size, x + w1 + size * 0.35, baseline, sub)
    return a + b, w1 + size * 0.35 + w2


def svg(w, h, body, bg=None):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}">{rect}{body}</svg>\n'


def horizontal(theme):
    tile, ink, main, sub = ((INK, WHITE, INK, GRAY_ON_LIGHT) if theme == "dark-text"
                            else (WHITE, INK, WHITE, GRAY_ON_DARK))
    m, fs, pad = 64, 34, 8
    cap = BOLD.cap * fs / BOLD.upm
    base = pad + m / 2 + cap / 2
    text, tw = wordmark(pad + m + 20, base, fs, main, sub)
    return svg(pad + m + 20 + tw + pad, m + pad * 2, mark(tile, ink, ACCENT, m, pad, pad) + text)


def stacked(theme):
    tile, ink, main, sub = ((INK, WHITE, INK, GRAY_ON_LIGHT) if theme == "dark-text"
                            else (WHITE, INK, WHITE, GRAY_ON_DARK))
    m, fs, pad = 120, 40, 12
    _, tw = wordmark(0, 0, fs, main, sub)
    w = max(m, tw) + pad * 2
    text, _ = wordmark((w - tw) / 2, pad + m + 28 + BOLD.cap * fs / BOLD.upm, fs, main, sub)
    return svg(w, pad + m + 28 + BOLD.cap * fs / BOLD.upm + pad + 6, mark(tile, ink, ACCENT, m, (w - m) / 2, pad) + text)


def wordmark_only(theme):
    main, sub = (INK, GRAY_ON_LIGHT) if theme == "dark-text" else (WHITE, GRAY_ON_DARK)
    fs, pad = 40, 6
    cap = BOLD.cap * fs / BOLD.upm
    text, tw = wordmark(pad, pad + cap, fs, main, sub)
    return svg(tw + pad * 2, cap + pad * 2 + 2, text)


def write(rel, content):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content)
    return p


def png(src, rel, width=None, height=None):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    args = ["rsvg-convert", str(src), "-o", str(p)]
    if width:
        args += ["-w", str(width)]
    if height:
        args += ["-h", str(height)]
    subprocess.run(args, check=True)
    return p


def pdf(src, rel):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["rsvg-convert", "-f", "pdf", str(src), "-o", str(p)], check=True)


def banner(w, h, safe_w, safe_h, rel):
    """Dark cover image: subtle grid, lockup + tagline centred in the platform safe area."""
    fs = safe_h * 0.17
    m = fs * 1.9
    cap = BOLD.cap * fs / BOLD.upm
    _, tw = wordmark(0, 0, fs, WHITE, GRAY_ON_DARK)
    lock_w = m + fs * 0.6 + tw
    tag_fs = fs * 0.5
    _, tag_w = MEDIUM.text(TAGLINE, tag_fs, 0, 0, GRAY_ON_DARK)
    if tag_w > safe_w * 0.92:
        tag_fs *= safe_w * 0.92 / tag_w
        _, tag_w = MEDIUM.text(TAGLINE, tag_fs, 0, 0, GRAY_ON_DARK)
    gap = fs * 0.9
    block_h = m + gap + tag_fs
    top = (h - block_h) / 2
    lx = (w - lock_w) / 2
    text, _ = wordmark(lx + m + fs * 0.6, top + m / 2 + cap / 2, fs, WHITE, GRAY_ON_DARK)
    tag, _ = MEDIUM.text(TAGLINE, tag_fs, (w - tag_w) / 2, top + m + gap + MEDIUM.cap * tag_fs / MEDIUM.upm, GRAY_ON_DARK)
    cell = max(h / 8, 40)
    grid = (f'<defs><pattern id="g" width="{cell}" height="{cell}" patternUnits="userSpaceOnUse">'
            f'<path d="M{cell} 0H0V{cell}" fill="none" stroke="#FFFFFF" stroke-opacity=".06" stroke-width="1"/></pattern>'
            f'<radialGradient id="v" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="{ACCENT}" stop-opacity=".16"/>'
            f'<stop offset="1" stop-color="{ACCENT}" stop-opacity="0"/></radialGradient></defs>'
            f'<rect width="{w}" height="{h}" fill="url(#g)"/><rect width="{w}" height="{h}" fill="url(#v)"/>'
            f'<rect y="{h - 3}" width="{w}" height="3" fill="{ACCENT}"/>')
    body = grid + mark(WHITE, INK, ACCENT, m, lx, top) + text + tag
    src = write(f"_src/{Path(rel).stem}.svg", svg(w, h, body, INK))
    png(src, rel, w, h)


def avatar(size_rel_pairs, bg=INK, ink=WHITE):
    """Square profile picture: full-bleed tile (platforms crop to circle), glyph at ~56%."""
    body = mark(None, ink, ACCENT, 32 * 0.56 * 16, 16 * 32 * 0.22, 16 * 32 * 0.22)
    src = write(f"_src/avatar-{'dark' if bg == INK else 'light'}.svg", svg(512, 512, body, bg))
    for size, rel in size_rel_pairs:
        png(src, rel, size, size)
    return src


def main():
    if OUT.exists():
        shutil.rmtree(OUT)

    # Vector logos
    vec = {
        "logo-horizontal-dark-text.svg": horizontal("dark-text"),
        "logo-horizontal-white-text.svg": horizontal("white-text"),
        "logo-stacked-dark-text.svg": stacked("dark-text"),
        "logo-stacked-white-text.svg": stacked("white-text"),
        "wordmark-dark.svg": wordmark_only("dark-text"),
        "wordmark-white.svg": wordmark_only("white-text"),
        "mark-primary.svg": svg(32, 32, mark(INK, WHITE, ACCENT)),
        "mark-inverse.svg": svg(32, 32, mark(WHITE, INK, ACCENT)),
        "mark-mono-black.svg": svg(32, 32, mark("#000000", WHITE, WHITE)),
        "mark-mono-white.svg": svg(32, 32, mark(WHITE, "#000000", "#000000")),
        "glyph-dark.svg": svg(32, 32, mark(None, INK, ACCENT)),
        "glyph-white.svg": svg(32, 32, mark(None, WHITE, ACCENT)),
    }
    for name, content in vec.items():
        src = write(f"svg/{name}", content)
        pdf(src, f"pdf/{name.replace('.svg', '.pdf')}")
        stem = name[:-4]
        if stem.startswith(("logo", "wordmark")):
            for w in (600, 1200, 2400):
                png(src, f"png/{stem}/{stem}-{w}w.png", width=w)
        else:
            for s in (64, 128, 256, 512, 1024):
                png(src, f"png/{stem}/{stem}-{s}.png", s, s)

    # Social profile pictures
    avatar([(400, "social/linkedin/linkedin-profile-400x400.png"),
            (400, "social/x-twitter/x-profile-400x400.png"),
            (720, "social/facebook/facebook-profile-720x720.png"),
            (320, "social/instagram/instagram-profile-320x320.png"),
            (1080, "social/instagram/instagram-profile-1080x1080.png"),
            (800, "social/youtube/youtube-profile-800x800.png"),
            (1024, "social/generic-profile-1024x1024.png")])
    avatar([(1024, "social/generic-profile-light-1024x1024.png")], bg=WHITE, ink=INK)

    # Social cover images (width, height, safe area width, safe area height)
    banner(1128, 191, 1128 - 300, 191, "social/linkedin/linkedin-cover-1128x191.png")
    banner(4200, 700, 3400, 700, "social/linkedin/linkedin-cover-hires-4200x700.png")
    banner(1500, 500, 1200, 360, "social/x-twitter/x-header-1500x500.png")
    banner(1640, 624, 1300, 470, "social/facebook/facebook-cover-1640x624.png")
    banner(2560, 1440, 1546, 423, "social/youtube/youtube-banner-2560x1440.png")
    banner(1200, 627, 1000, 450, "social/linkedin/linkedin-share-1200x627.png")
    shutil.copy(ROOT / "src/public/og.png", OUT / "social/website-og-1200x630.png")

    # Favicons
    fav = OUT / "svg/mark-primary.svg"
    (OUT / "favicon").mkdir()
    shutil.copy(ROOT / "src/public/favicon.svg", OUT / "favicon/favicon.svg")
    for s in (16, 32, 48, 180, 192, 512):
        png(fav, f"favicon/_{s}.png", s, s)
    Image.open(OUT / "favicon/_48.png").save(OUT / "favicon/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    (OUT / "favicon/_180.png").rename(OUT / "favicon/apple-touch-icon-180x180.png")
    (OUT / "favicon/_192.png").rename(OUT / "favicon/android-chrome-192x192.png")
    (OUT / "favicon/_512.png").rename(OUT / "favicon/android-chrome-512x512.png")
    for s in (16, 32, 48):
        (OUT / f"favicon/_{s}.png").rename(OUT / f"favicon/favicon-{s}x{s}.png")

    shutil.rmtree(OUT / "_src")
    shutil.copy(ROOT / "tools/brand-assets-README.md", OUT / "README.md")
    print(f"Wrote {sum(1 for p in OUT.rglob('*') if p.is_file())} files to {OUT}")


if __name__ == "__main__":
    main()
