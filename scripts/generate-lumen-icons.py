#!/usr/bin/env python3
"""Gera os icones do Lumen (estilo B6-progresso) para o PWA e a TWA Android.
Uso: python3 generate-lumen-icons.py <pasta_saida>   (requer Pillow)
Cria a mesma arvore de pastas do repo: dist/icons/... e android-twa/app/src/main/res/...
"""
import math, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops
SS = 4                      # supersampling
BG_TOP, BG_BOTTOM = (0x16, 0x23, 0x3B), (0x0B, 0x13, 0x24)
BG_FLAT = '#111B2F'         # cor do fundo do adaptive icon Android
LIT, LIT_GLOW, OFF, OFF_SHADE = (255, 227, 160), (255, 210, 122), (74, 88, 120), (56, 68, 94)
N_BEADS, N_LIT = 18, 8

def design(size, scale):
    """Desenho transparente (contas + cruz), centrado; scale=1 ocupa ~78% da altura."""
    W = size * SS; u = W / 512 * scale
    cx, cy0 = W / 2, W / 2 - 261 * u + 205 * u    # centro vertical do conjunto em W/2
    layer = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    pts = [(cx + 120 * u * math.cos(math.pi / 2 + 2 * math.pi * i / N_BEADS),
            cy0 + 130 * u * math.sin(math.pi / 2 + 2 * math.pi * i / N_BEADS)) for i in range(N_BEADS)]
    glow = Image.new('RGBA', (W, W), (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
    for x, y in pts[:N_LIT]:
        r = 26 * u; g.ellipse([x - r, y - r, x + r, y + r], fill=LIT_GLOW + (110,))
    glow = glow.filter(ImageFilter.GaussianBlur(12 * u))
    layer = Image.alpha_composite(layer, glow); d = ImageDraw.Draw(layer)
    r = 15 * u
    for i, (x, y) in enumerate(pts):
        if i < N_LIT: d.ellipse([x - r, y - r, x + r, y + r], fill=LIT + (255,))
        else:
            d.ellipse([x - r, y - r, x + r, y + r], fill=OFF_SHADE + (255,))
            d.ellipse([x - r * .92, y - r * .98, x + r * .85, y + r * .8], fill=OFF + (255,))
    top = cy0 + 147 * u
    d.line([pts[0], (cx, top + 8 * u)], fill=LIT + (255,), width=max(1, int(6 * u)))
    t = 16 * u; h = 110 * u; w = 72 * u; arm = top + 33 * u
    d.rounded_rectangle([cx - t / 2, top, cx + t / 2, top + h], radius=t * .3, fill=LIT + (255,))
    d.rounded_rectangle([cx - w / 2, arm - t / 2, cx + w / 2, arm + t / 2], radius=t * .3, fill=LIT + (255,))
    return layer

def background(size):
    W = size * SS; img = Image.new('RGBA', (W, W)); d = ImageDraw.Draw(img)
    for y in range(W):
        k = y / W; d.line([(0, y), (W, y)], fill=tuple(int(BG_TOP[i] * (1 - k) + BG_BOTTOM[i] * k) for i in range(3)) + (255,))
    return img

def render(size, scale, shape):
    """shape: 'square' (RGB, sem alfa), 'circle' (RGBA, cantos transparentes), 'none' (so desenho)."""
    W = size * SS
    art = design(size, scale)
    if shape == 'none':
        out = art
    else:
        out = Image.alpha_composite(background(size), art)
        if shape == 'circle':
            m = Image.new('L', (W, W), 0); ImageDraw.Draw(m).ellipse([0, 0, W - 1, W - 1], fill=255)
            out.putalpha(ImageChops.multiply(out.split()[3], m))
    out = out.resize((size, size), Image.LANCZOS)
    return out.convert('RGB') if shape == 'square' else out

def save(img, root, rel):
    p = os.path.join(root, *rel.split('/')); os.makedirs(os.path.dirname(p), exist_ok=True); img.save(p, optimize=True)

if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else '.'
    # PWA: RGB (o teste exige PNG color type 2). "any" quadrado; maskable dentro da zona segura (raio 40%).
    save(render(192, 1.0, 'square'), root, 'dist/icons/icon-192.png')
    save(render(512, 1.0, 'square'), root, 'dist/icons/icon-512.png')
    save(render(512, 0.84, 'square'), root, 'dist/icons/icon-maskable-512.png')
    res = 'android-twa/app/src/main/res'
    for dpi, mult in [('mdpi', 1), ('hdpi', 1.5), ('xhdpi', 2), ('xxhdpi', 3), ('xxxhdpi', 4)]:
        save(render(int(48 * mult), 1.0, 'circle'), root, f'{res}/mipmap-{dpi}/ic_launcher.png')
        # adaptive: 108dp, conteudo dentro do circulo seguro de 66dp
        save(render(int(108 * mult), 0.64, 'none'), root, f'{res}/mipmap-{dpi}/ic_launcher_foreground.png')
    save(render(512, 1.0, 'circle'), root, f'{res}/drawable/splash.png')
