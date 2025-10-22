# grid_builder.py
from __future__ import annotations
from typing import Dict, Optional, Tuple, List
import math
import os
import base64


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _svg_color(v: Optional[str]) -> str:
    """None/''/'transparent' -> 'none' for SVG fill attributes."""
    return "none" if v in (None, "", "transparent") else str(v)


def _roundrect_path(x: float, y: float, w: float, h: float, r: float) -> str:
    """Return a path for a rounded rectangle (clockwise)."""
    r = max(0.0, min(r, w / 2.0, h / 2.0))
    return (
        f"M{x+r},{y} H{x+w-r} A{r},{r} 0 0 1 {x+w},{y+r} "
        f"V{y+h-r} A{r},{r} 0 0 1 {x+w-r},{y+h} "
        f"H{x+r} A{r},{r} 0 0 1 {x},{y+h-r} V{y+r} "
        f"A{r},{r} 0 0 1 {x+r},{y} Z"
    )


def _module_shape_path(kind: str, x: float, y: float, s: float) -> str:
    """Return a single-path shape for a module square at (x,y) with side s."""
    k = (kind or "Square").lower()
    if k == "circle":
        cx, cy, r = x + s / 2.0, y + s / 2.0, s / 2.0
        # Circle as two arcs (SVG path)
        return f"M {cx},{cy} m {-r},0 a {r},{r} 0 1,0 {s},0 a {r},{r} 0 1,0 {-s},0 Z"
    if k == "rounded":
        return _roundrect_path(x, y, s, s, r=s * 0.22)
    # Square
    return f"M{x},{y} h{s} v{s} h{-s} Z"


def _eye_shape_path(kind: str, x: float, y: float, size_px: float) -> str:
    """Wrapper to reuse module shape generator for larger sizes (7x7, 5x5, 3x3)."""
    return _module_shape_path(kind, x, y, size_px)


# ---------------------------------------------------------------------------
# Main builder
# ---------------------------------------------------------------------------


def svg_from_qr(
    qr,
    *,
    module_px: int = 18,
    border_modules: int = 4,
    colors: Optional[Dict[str, Optional[str]]] = None,
    campaign: Optional[str] = None,                  # <- single campaign arg
    campaign_font_family: str = "Work Sans, Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    campaign_font_size_ratio: float = 0.09,          # ~9% of QR width baseline
    campaign_gap_ratio: float = 0.08,                # gap between QR and caption
    include_center: bool = False,
    center_frac: float = 0.25,
    module_shape: str = "Square",
    eye_ring_shape: str = "Square",
    eye_center_shape: str = "Square",
    center_mode: str = "none",       # "none" | "emoji"
    center_emoji: str = "😊",
    center_scale: float = 0.90,
    module_fill: str = "shape",      # "shape" | "emoji"
    module_emoji: str = "😀",
    module_scale: float = 0.90,
) -> str:
    
    """
    Build an SVG drawing the QR as a per-module grid with optional:
      - emoji-per-module fill
      - center exclusion box (whole rows/cols only) + center emoji
      - caption
      - transparent or colored background
    """
    colors = colors or {}
    bg = _svg_color(colors.get("bg"))
    body_color = colors.get("body") or "#000000"
    eye_ring_color = colors.get("eye_ring") or body_color
    eye_center_color = colors.get("eye_center") or body_color
    caption_color = colors.get("campaign_text") or "#000000"

    # Base geometry
    mod_w, mod_h = qr.symbol_size(scale=1, border=0)  # modules (no quiet zone)
    b = int(border_modules)
    px = int(module_px)

    # Outer canvas (QR box)
    full_w = (mod_w + 2 * b) * px
    full_h = (mod_h + 2 * b) * px

    # Caption presence + geometry (must be known before <svg> header)
    ct = (campaign or "").strip()
    cap_gap = int((mod_w * px) * 0.06) if ct else 0      # gap between QR and caption
    cap_h   = int((mod_w * px) * 0.12) if ct else 0      # caption band height
    canvas_h = full_h + cap_gap + cap_h                  # total canvas height

    # Symbol pixel origin (top-left of content area inside quiet zone)
    sym_left = b * px
    sym_top = b * px

    # Finder eyes (7x7) at TL, TR, BL in module coords
    eyes: List[Tuple[int, int]] = [(0, 0), (mod_w - 7, 0), (0, mod_h - 7)]

    # Matrix of bools
    matrix: List[List[bool]] = [[bool(v) for v in row] for row in qr.matrix]

    # --- Center exclusion region in MODULE units (whole rows/cols) ----
    center_box_mod: Optional[Tuple[int, int, int, int]] = None  # l, t, r, b (inclusive)
    center_box_px: Optional[float] = None
    cx_px = cy_px = None

    if include_center:
        desired_mod = max(1, int(math.floor(min(mod_w, mod_h) * float(center_frac))))
        if desired_mod % 2 == 0:
            desired_mod -= 1
        desired_mod = max(1, min(desired_mod, min(mod_w, mod_h)))

        l_mod = (mod_w - desired_mod) // 2
        t_mod = (mod_h - desired_mod) // 2
        r_mod = l_mod + desired_mod - 1
        b_mod = t_mod + desired_mod - 1
        center_box_mod = (l_mod, t_mod, r_mod, b_mod)

        center_box_px = desired_mod * px
        cx_px = sym_left + (mod_w * px) / 2.0
        cy_px = sym_top + (mod_h * px) / 2.0

    def _in_eye(mx: int, my: int) -> bool:
        for ex, ey in eyes:
            if ex <= mx < ex + 7 and ey <= my < ey + 7:
                return True
        return False

    def _in_center_box(mx: int, my: int) -> bool:
        if not center_box_mod:
            return False
        l, t, r, btm = center_box_mod
        return l <= mx <= r and t <= my <= btm

    # -------------------- Begin SVG -------------------------------
    out: List[str] = []
    out.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{full_w}" height="{canvas_h}" viewBox="0 0 {full_w} {canvas_h}">'
    )

    # Background
    if bg != "none":
        out.append(f'<rect x="0" y="0" width="{full_w}" height="{canvas_h}" fill="{bg}"/>')

    # -------------------- Modules (body) -------------------------------
    use_emoji_modules = str(module_fill).lower() == "emoji"

    # shared per-module scaling
    s   = max(0.6, min(1.0, float(module_scale or 1.0)))  # clamp for scan reliability
    pxs = px * s                                          # scaled module size (px)
    pad = (px - pxs) / 2.0                                # inset so it stays centered
    fs  = f"{(px * s):.3f}px"                             # font-size for emoji modules

    if use_emoji_modules:

        out.append(
            f'<g aria-label="modules-emoji" font-size="{fs}" text-anchor="middle" '
            f'dominant-baseline="central" font-family="Apple Color Emoji, Noto Color Emoji, Segoe UI Emoji, sans-serif">'
        )            
        
        for my in range(mod_h):
            for mx in range(mod_w):
                if not matrix[my][mx] or _in_eye(mx, my) or _in_center_box(mx, my):
                    continue
                cxm = (mx + b) * px + px / 2.0
                cym = (my + b) * px + px / 2.0
                out.append(f'<text x="{cxm:.3f}" y="{cym:.3f}">{module_emoji}</text>')
        out.append("</g>")
    else:
        out.append(f'<g fill="{body_color}">')
        path_parts: List[str] = []
        for my in range(mod_h):
            py0 = (my + b) * px
            for mx in range(mod_w):
                if not matrix[my][mx] or _in_eye(mx, my) or _in_center_box(mx, my):
                    continue
                px0 = (mx + b) * px
                # apply scaling: inset top-left by `pad`, shrink size to `pxs`
                path_parts.append(_module_shape_path(module_shape, px0 + pad, py0 + pad, pxs))
        if path_parts:
            out.append(f'<path d="{" ".join(path_parts)}"/>')
        out.append("</g>")

    # -------------------- Finder eyes ----------------------------------
    def _draw_eye(ex: int, ey: int):
        x = (ex + b) * px
        y = (ey + b) * px

        ring_outer = _eye_shape_path(eye_ring_shape, x, y, 7 * px)
        ring_inner = _eye_shape_path(eye_ring_shape, x + px, y + px, 5 * px)
        out.append(
            f'<path d="{ring_outer} {ring_inner}" fill="{eye_ring_color}" fill-rule="evenodd"/>'
        )

        core = _eye_shape_path(eye_center_shape, x + 2 * px, y + 2 * px, 3 * px)
        out.append(f'<path d="{core}" fill="{eye_center_color}"/>')

    for ex, ey in eyes:
        _draw_eye(ex, ey)

    # -------------------- Center emoji (no clearing rect) --------------
    if (
        include_center
        and center_box_px
        and center_mode.lower() == "emoji"
        and (center_emoji or "").strip()
    ):
        fs_side = center_box_px * float(center_scale)
        dy = center_box_px * 0.02
        try:
            cp_hex = f"{ord(center_emoji):x}"
        except TypeError:
            cp_hex = ""
        asset_path = os.path.join("emoji_assets", f"{cp_hex}.png") if cp_hex else ""
        if asset_path and os.path.exists(asset_path):
            with open(asset_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("ascii")
            out.append(
                f'<image x="{cx_px - fs_side/2:.3f}" y="{cy_px - fs_side/2:.3f}" '
                f'width="{fs_side:.3f}" height="{fs_side:.3f}" '
                f'href="data:image/png;base64,{b64}"/>'
            )
        else:
            out.append(
                f'<text x="{cx_px:.3f}" y="{(cy_px + dy):.3f}" text-anchor="middle" '
                f'dominant-baseline="central" font-size="{(center_box_px * float(center_scale)):.3f}px" '
                f'font-family="Apple Color Emoji, Noto Color Emoji, Segoe UI Emoji, EmojiOne Color, Twemoji, sans-serif">'
                f"{center_emoji}</text>"
            )

    # --- Caption (single centered line, merged logic) ---
    if ct:
        import html as _html
        display_ct = (ct or "")[:25]
        _safe = _html.escape(display_ct)

        pad_x = full_w * 0.06
        available_w = max(1.0, (mod_w * px) - 2 * pad_x)

        length_for_size = max(1, len(display_ct))
        max_fs_by_width = available_w / max(1.0, 0.56 * length_for_size)    
       
        cap_area_h = canvas_h - full_h               # == cap_gap + cap_h
        max_fs_by_height = min(cap_area_h * 0.60, (mod_w * px) * 0.10)

        cap_fs = max(12.0, min(max_fs_by_width, max_fs_by_height))

        # Midpoint between bottom of QR (full_h) and bottom of background (canvas_h)
        y_cap = (full_h + canvas_h) / 2.0 - (cap_fs * 0.5)
        cap_color = (colors or {}).get("campaign_text") or "#000000"

        out.append(
            f'<text x="{full_w/2:.3f}" y="{y_cap:.3f}" text-anchor="middle" '
            f'alignment-baseline="middle" font-size="{cap_fs:.3f}px" '
            f'font-family="{campaign_font_family}" '
            f'fill="{cap_color}">{_safe}</text>'
        )

    out.append("</svg>")
    return "\n".join(out)
