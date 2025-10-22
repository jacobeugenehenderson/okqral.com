"""
LGBTQRCode — GUI (Tkinter) + Segno + Grid-SVG export (with Emoji center)
- Types: URL, Payment (as link), WiFi, Contact, Message
- PNG export via rasterizing our custom SVG (CairoSVG); falls back to segno if CairoSVG is missing
- SVG export via grid_builder.svg_from_qr:
   • per-module grid
   • module + eye shapes (Square / Rounded / Circle)
   • colors (Body / Eye Ring / Eye Center / optional BG)
   • optional center clearing with either empty space or an Emoji


Controls (no 'advanced' toggle):
 • Campaign name (filename)
 • Colors: Body / Eye Ring / Eye Center + optional transparent background (or BG HEX)
 • Shapes: Modules + Eyes (Square / Rounded / Circle)
 • Center clearing toggle + Center Mode (None/Emoji), Emoji, and scale
 • Tracking params (optional) for URL/Payment
"""

from __future__ import annotations


import os
import platform
import re
import time
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from tkinter import colorchooser
from factory_presets import FACTORY_PRESETS, get_preset, list_looks

import segno
from grid_builder import (
    svg_from_qr,
)  # must support center_mode, center_emoji, center_scale


# Optional preview rendering helpers (recommended)
try:
    import cairosvg  # for SVG → PNG raster conversion
except Exception:
    cairosvg = None


try:
    from PIL import Image, ImageTk  # for showing PNGs in Tkinter
except Exception:
    Image = ImageTk = None


# Optional large emoji catalog
try:
    import emoji as _emoji_lib  # pip install emoji
except Exception:
    _emoji_lib = None


APP_TITLE = "LGBTQRCode v0.6"
DEFAULT_TRACKING = "love_jacky"


TARGET_PNG_PX = 1200
BORDER_MODULES = 4
ECC_LEVELS = ["L", "M", "Q", "H"]
QR_TYPES = ["URL", "Payment", "WiFi", "Contact", "Message", "Event", "Map"]
SHAPES = ["Square", "Rounded", "Circle"]


FACTORY_PRESETS = {
    "URL": {
        "body": "#00da00",
        "eye_ring": "#ea20d2",
        "eye_center": "#ea033c",
        "bg_transparent": False,
        "bg": "#FFFFFF",
        "module_shape": "Square",
        "eye_ring_shape": "Square",
        "eye_center_shape": "Square",
        "modules_mode": "Shape",
        "modules_emoji": "😀",
        "modules_scale": 0.90,
        "center_logo": False,
        "center_mode": "None",
        "center_emoji": "😊",
        "center_scale": 0.90,
    },
    "Payment": {
        "body": "#111111",
        "eye_ring": "#111111",
        "eye_center": "#111111",
        "bg_transparent": True,
        "bg": "#FFFFFF",
        "module_shape": "Rounded",
        "eye_ring_shape": "Rounded",
        "eye_center_shape": "Square",
        "modules_mode": "Shape",
        "modules_emoji": "💸",
        "modules_scale": 0.90,
        "center_logo": True,
        "center_mode": "Emoji",
        "center_emoji": "💜",
        "center_scale": 0.85,
    },
    "WiFi": {
        "body": "#1d4ed8",
        "eye_ring": "#1d4ed8",
        "eye_center": "#1d4ed8",
        "bg_transparent": False,
        "bg": "#FFFFFF",
        "module_shape": "Square",
        "eye_ring_shape": "Rounded",
        "eye_center_shape": "Circle",
        "modules_mode": "Shape",
        "modules_emoji": "📶",
        "modules_scale": 0.90,
        "center_logo": False,
        "center_mode": "None",
        "center_emoji": "📶",
        "center_scale": 0.90,
    },
    "Contact": {
        "body": "#111111",
        "eye_ring": "#111111",
        "eye_center": "#111111",
        "bg_transparent": False,
        "bg": "#FFFFFF",
        "module_shape": "Rounded",
        "eye_ring_shape": "Rounded",
        "eye_center_shape": "Rounded",
        "modules_mode": "Shape",
        "modules_emoji": "👋",
        "modules_scale": 0.90,
        "center_logo": True,
        "center_mode": "Emoji",
        "center_emoji": "👋",
        "center_scale": 0.80,
    },
    "Message": {
        "body": "#16a34a",
        "eye_ring": "#16a34a",
        "eye_center": "#16a34a",
        "bg_transparent": False,
        "bg": "#FFFFFF",
        "module_shape": "Square",
        "eye_ring_shape": "Square",
        "eye_center_shape": "Square",
        "modules_mode": "Shape",
        "modules_emoji": "💬",
        "modules_scale": 0.90,
        "center_logo": True,
        "center_mode": "Emoji",
        "center_emoji": "💬",
        "center_scale": 0.85,
    },
}
# ---- helpers ---------------------------------------------------------


def _xdg_desktop_dir() -> Path | None:
    cfg = Path.home() / ".config" / "user-dirs.dirs"
    if not cfg.exists():
        return None
    try:
        txt = cfg.read_text(encoding="utf-8", errors="ignore")
        m = re.search(r'XDG_DESKTOP_DIR="?(.+?)"?\n', txt)
        if not m:
            return None
        raw = m.group(1).replace("$HOME", str(Path.home()))
        p = Path(raw).expanduser()
        return p if p.exists() else None
    except Exception:
        return None


def get_default_output_dir() -> str:
    system = platform.system()
    home = Path.home()
    candidates: list[Path] = []
    if system == "Windows":
        candidates += [home / "Desktop", home / "OneDrive" / "Desktop"]
        for child in home.glob("OneDrive*"):
            candidates.append(child / "Desktop")
    elif system == "Linux":
        xdg = _xdg_desktop_dir()
        if xdg:
            candidates.append(xdg)
        candidates.append(home / "Desktop")
    else:
        candidates.append(home / "Desktop")
    for p in candidates:
        if p.exists() and p.is_dir():
            return str(p)
    return str(Path.cwd())


def is_hex_color(s: str) -> bool:
    s = (s or "").strip()
    if s.startswith("#"):
        s = s[1:]
    return len(s) in (3, 6) and all(c in "0123456789abcdefABCDEF" for c in s)


def norm_hex(s: str) -> str:
    s = (s or "").strip()
    if not s:
        return "#000000"
    if not s.startswith("#"):
        s = "#" + s
    if len(s) == 4:
        s = "#" + "".join(ch * 2 for ch in s[1:])
    return s


def smart_filename(*parts: str, ext: str = "png") -> str:
    ts = time.strftime("%Y%m%d-%H%M%S")
    safe = [
        p.strip().replace(" ", "_").replace("/", "-") for p in parts if p and p.strip()
    ]
    base = "_".join(safe) if safe else "qr"
    return f"{base}_{ts}.{ext}"


def slugify(s: str) -> str:
    s = (s or "").strip()
    s = re.sub(r"[^A-Za-z0-9._-]+", "_", s)
    return s.strip("_") or "qr"


def _iter_emoji_catalog():
    """Return list of (name, char, group) from the emoji library; empty list if unavailable."""
    data = []
    if _emoji_lib and hasattr(_emoji_lib, "EMOJI_DATA"):
        for ch, meta in _emoji_lib.EMOJI_DATA.items():
            name = meta.get("en") or meta.get("name") or ""
            group = meta.get("group") or ""
            # Filter out skin-tone modifier codepoints standing alone
            if name and ch.strip():
                data.append((name, ch, group))
    # Sort by name for stable browsing
    return sorted(data, key=lambda t: t[0])


# ---- Color picker helper ---------------------------------------------------


def pick_color(target_var, refresh_cb=None):
    """Open a system color picker and update the associated StringVar."""
    color = colorchooser.askcolor(color=target_var.get(), title="Choose color")
    if color and color[1]:
        target_var.set(color[1])
        if refresh_cb:
            refresh_cb()


# ---- GUI -------------------------------------------------------------


class QRApp(ttk.Frame):
    def __init__(self, master: tk.Tk):
        super().__init__(master, padding=12)
        self.pack(fill="both", expand=True)

        master.title(APP_TITLE)
        master.minsize(860, 680)

        # State
        self.output_dir = tk.StringVar(self, get_default_output_dir())
        self.campaign = tk.StringVar(self, "")
        self.show_campaign = tk.BooleanVar(self, True)
        self.qr_type = tk.StringVar(self, QR_TYPES[0])
        self.ecc = tk.StringVar(self, "M")
        self.source = tk.StringVar(self, "")
        self.medium = tk.StringVar(self, "")
        self.tracking_token = tk.StringVar(self, DEFAULT_TRACKING)

        # preset look index per Type
        self._look_index_by_type = {t: 0 for t in QR_TYPES}

        # Colors
        self.body_color = tk.StringVar(self, "#d7d7d7")
        self.eye_ring_color = tk.StringVar(self, "#d7d7d7")
        self.eye_center_color = tk.StringVar(self, "#d7d7d7")
        self.campaign_text_color = tk.StringVar(self, "#000000")
        self.bg_transparent = tk.BooleanVar(self, False)
        self.bg_color = tk.StringVar(self, "#FFFFFF")

        # Shapes
        self.module_shape = tk.StringVar(self, "Square")
        self.eye_ring_shape = tk.StringVar(self, "Square")
        self.eye_center_shape = tk.StringVar(self, "Square")

        # Module fill mode (Shape or Emoji)
        self.modules_mode = tk.StringVar(self, "Shape")  # "Shape" | "Emoji"
        self.modules_emoji = tk.StringVar(self, "😀")
        self.center_emoji_var = tk.StringVar(value="⭐")
        self.modules_scale = tk.DoubleVar(self, 0.90)

        # Center clearing + center content_init_
        self.center_logo = tk.BooleanVar(self, False)
        self.center_mode = tk.StringVar(self, "None")  # "None" | "Emoji"
        self.center_emoji = tk.StringVar(self, "😊")
        self.center_scale = tk.DoubleVar(self, 0.90)  # 0.10–1.00

        self._recent_emojis: list[str] = []

        # Presets per Type (stateless pre-fills)
        self._campaign_presets = {
            "URL":     "ENGAGE",
            "WIFI":    "JOIN",
            "PAYMENT": "SUPPORT",
            "CONTACT": "HELLO",
            "MESSAGE": "SHARE",
        }

        # Export formats
        self.want_png = tk.BooleanVar(self, True)
        self.want_svg = tk.BooleanVar(self, True)

        # Type-specific vars
        self.url_data = tk.StringVar(self, "")

        # Payment
        self.pay_mode = tk.StringVar(self, "Generic Link")
        self.pay_username = tk.StringVar(self, "")  # username/@handle/$cashtag (no $/@)
        self.pay_amount = tk.StringVar(self, "")
        self.pay_note = tk.StringVar(self, "")
        self.pay_link = tk.StringVar(self, "")

        # Wi-Fi
        self.wifi_ssid = tk.StringVar(self, "")
        self.wifi_password = tk.StringVar(self, "")
        self.wifi_security = tk.StringVar(self, "WPA")
        self.wifi_hidden = tk.BooleanVar(self, False)

        # Contact
        self.v_first = tk.StringVar(self, "")
        self.v_last = tk.StringVar(self, "")
        self.v_phone = tk.StringVar(self, "")
        self.v_phone2 = tk.StringVar(self, "")
        self.v_phone1_type = tk.StringVar(self, "CELL")
        self.v_phone2_type = tk.StringVar(self, "WORK")
        self.v_email = tk.StringVar(self, "")
        self.v_email2 = tk.StringVar(self, "")
        self.v_email1_type = tk.StringVar(self, "INTERNET")
        self.v_email2_type = tk.StringVar(self, "WORK")
        self.v_org = tk.StringVar(self, "")
        self.v_title = tk.StringVar(self, "")
        self.v_street = tk.StringVar(self, "")
        self.v_city = tk.StringVar(self, "")
        self.v_region = tk.StringVar(self, "")
        self.v_postal = tk.StringVar(self, "")
        self.v_country = tk.StringVar(self, "")
        self.v_website = tk.StringVar(self, "")
        self.v_note = tk.StringVar(self, "")
        self.v_bday = tk.StringVar(self, "")

        # Message
        self.msg_mode = tk.StringVar(self, "Personal")  # "Personal" | "Resistbot"
        self.sms_number = tk.StringVar(self, "")
        self.sms_text = tk.StringVar(self, "")
        self._personal_last_number = ""

        # --- Fonts (Work Sans via system install; fallback to Tk default) ---
        from tkinter import font as tkfont

        try:
            # You already have Work Sans installed in ~/Library/Fonts,
            # so Tk can resolve it by family name.
            self._font_normal = tkfont.Font(family="Work Sans", size=10)
            self._font_italic = tkfont.Font(family="Work Sans", size=10, slant="italic")

            # sanity: if Tk substituted a different family, fall back
            if self._font_normal.cget("family") != "Work Sans":
                raise RuntimeError("Work Sans not resolved by Tk")
        except Exception as e:
            print("Work Sans not available, falling back to TkDefaultFont:", e)
            try:
                self._font_normal = tkfont.nametofont("TkDefaultFont")
                self._font_italic = self._font_normal.copy()
                self._font_italic.configure(slant="italic")
            except Exception:
                self._font_normal = None
                self._font_italic = None

        self.URL_PLACEHOLDER = "Your URL Here"

        # Build UI and show initial fields
        self._build_ui()
        self._render_type_fields()
        self._on_type_changed()
        self._ensure_url_placeholder()
        self._update_preview()

        # Wire live preview once (do not duplicate this elsewhere)
        for v in (
            self.qr_type,
            self.ecc,
            self.campaign,
            self.show_campaign,
            self.body_color,
            self.eye_ring_color,
            self.eye_center_color,
            self.campaign_text_color,
            self.bg_transparent,
            self.bg_color,
            self.module_shape,
            self.eye_ring_shape,
            self.eye_center_shape,
            self.center_logo,
            self.center_mode,
            self.center_emoji,
            self.center_scale,
            self.source,
            self.medium,
            self.tracking_token,
            self.want_png,
            self.want_svg,
            self.modules_mode,
            self.modules_emoji,
            self.modules_scale,
            self.url_data,
            self.pay_mode,
            self.pay_username,
            self.pay_amount,
            self.pay_note,
            self.pay_link,
            self.wifi_ssid,
            self.wifi_password,
            self.wifi_security,
            self.wifi_hidden,
            self.v_first,
            self.v_last,
            self.v_phone,
            self.v_phone2,
            self.v_phone1_type,
            self.v_phone2_type,
            self.v_email,
            self.v_email2,
            self.v_email1_type,
            self.v_email2_type,
            self.v_org,
            self.v_title,
            self.v_street,
            self.v_city,
            self.v_region,
            self.v_postal,
            self.v_country,
            self.v_website,
            self.v_bday,
            self.v_note,
            self.msg_mode,
            self.sms_number,
            self.sms_text,
        ):
            try:
                v.trace_add("write", lambda *_: self._schedule_preview_update())
            except Exception:
                pass

    def _get_preset_for(self, t: str, look_index: int = 0) -> dict:
        """
        Return a factory preset for the given Type using factory_presets.py.
        """
        try:
            # uses the function you imported: get_preset(type, index)
            return get_preset(t, look_index) or {}
        except Exception as e:
            print(f"[Preset error for {t}]", e)
            return {}

    def _current_look_names(self) -> list[str]:
        try:
            return list_looks(self.qr_type.get()) or []
        except Exception:
            return []

    def _set_look_badge(self):
        names = self._current_look_names()
        state = "normal" if len(names) > 1 else "disabled"
        if getattr(self, "_look_left", None):
            self._look_left.config(state=state)
        if getattr(self, "_look_right", None):
            self._look_right.config(state=state)

    def _apply_look_index(self, trigger_preview: bool = True):
        t = self.qr_type.get()
        i = self._look_index_by_type.get(t, 0)

        # apply preset
        try:
            preset = get_preset(t, i)
        except Exception:
            preset = get_preset(t)
        self._apply_preset_to_ui(preset, trigger_preview=False)

        # set caption only if user hasn't typed something different
        names = self._current_look_names()
        look_name = names[i] if i < len(names) else None

        if look_name:
            # Only overwrite if caption matches the previous default for this type OR is empty
            current = (self.campaign.get() or "").strip()
            default_for_type = self._campaign_presets.get(t.upper(), "ENGAGE")
            if current == "" or current == default_for_type or current in names:
                self.campaign.set(look_name)

        self.show_campaign.set(True)
        self._update_preview()

    def _cycle_look(self, delta: int):
        names = self._current_look_names()
        if not names:
            return
        t = self.qr_type.get()
        cur = self._look_index_by_type.get(t, 0)
        self._look_index_by_type[t] = (cur + int(delta)) % len(names)
        self._apply_look_index(trigger_preview=True)
    
    def _on_type_changed(self, *_):
        # 0) cancel any pending preview so we don't render mid-change
        if getattr(self, "_preview_after", None):
            try:
                self.after_cancel(self._preview_after)
            except Exception:
                pass
        self._preview_after = None

        t_raw = self.qr_type.get() or "URL"
        t_key = t_raw.upper()

        # 1) swap the Details panel for the new Type
        self._render_type_fields()

        # 2) apply factory preset for that Type (just styles)
        self._look_index_by_type[t_raw] = 0
        self._apply_look_index(trigger_preview=False)

        # 3) caption defaults
        self.show_campaign.set(True)
        self.campaign.set(self._campaign_presets.get(t_key, "ENGAGE"))

        # 4) URL placeholder only if on URL
        self._ensure_url_placeholder()

        # 5) single, final preview
        self._update_preview()

    def _apply_preset_to_ui(self, p: dict, trigger_preview: bool = True) -> None:
        """Push preset values into Tk variables."""
        # colors
        self.body_color.set(p.get("body", self.body_color.get()))
        self.eye_ring_color.set(p.get("eye_ring", self.eye_ring_color.get()))
        self.eye_center_color.set(p.get("eye_center", self.eye_center_color.get()))
        self.bg_transparent.set(
            bool(p.get("bg_transparent", self.bg_transparent.get()))
        )
        self.bg_color.set(p.get("bg", self.bg_color.get()))
        # shapes
        self.module_shape.set(p.get("module_shape", self.module_shape.get()))
        self.eye_ring_shape.set(p.get("eye_ring_shape", self.eye_ring_shape.get()))
        self.eye_center_shape.set(
            p.get("eye_center_shape", self.eye_center_shape.get())
        )
        # modules fill
        self.modules_mode.set(p.get("modules_mode", self.modules_mode.get()))
        self.modules_emoji.set(p.get("modules_emoji", self.modules_emoji.get()))
        self.modules_scale.set(float(p.get("modules_scale", self.modules_scale.get())))
        # center
        self.center_logo.set(bool(p.get("center_logo", self.center_logo.get())))
        self.center_mode.set(p.get("center_mode", self.center_mode.get()))
        self.center_emoji.set(p.get("center_emoji", self.center_emoji.get()))
        self.center_scale.set(float(p.get("center_scale", self.center_scale.get())))
        if trigger_preview:
            self._schedule_preview_update()

    def _gather_current_as_preset(self) -> dict:
        """Read current UI into a preset dict."""
        return {
            "body": self.body_color.get(),
            "eye_ring": self.eye_ring_color.get(),
            "eye_center": self.eye_center_color.get(),
            "bg_transparent": bool(self.bg_transparent.get()),
            "bg": self.bg_color.get(),
            "module_shape": self.module_shape.get(),
            "eye_ring_shape": self.eye_ring_shape.get(),
            "eye_center_shape": self.eye_center_shape.get(),
            "modules_mode": self.modules_mode.get(),
            "modules_emoji": self.modules_emoji.get(),
            "modules_scale": float(self.modules_scale.get()),
            "center_logo": bool(self.center_logo.get()),
            "center_mode": self.center_mode.get(),
            "center_emoji": self.center_emoji.get(),
            "center_scale": float(self.center_scale.get()),
        }

        self._build_ui()

        # build the UI and render the initial fields
        self._build_ui()
        self._render_type_fields()

        # Cycle sub-looks with arrow keys
        self.bind_all("<Left>",  lambda e: self._cycle_look(-1))
        self.bind_all("<Right>", lambda e: self._cycle_look(+1))

        # live preview wiring (debounced)
        for v in (
            # global controls
            self.qr_type,
            self.ecc,
            self.campaign,
            self.body_color,
            self.eye_ring_color,
            self.eye_center_color,
            self.campaign_text_color,
            self.bg_transparent,
            self.bg_color,
            self.module_shape,
            self.eye_ring_shape,
            self.eye_center_shape,
            self.center_logo,
            self.center_mode,
            self.center_emoji,
            self.center_scale,
            self.source,
            self.medium,
            self.tracking_token,
            self.want_png,
            self.want_svg,
            self.modules_mode,
            self.modules_emoji,
            self.modules_scale,
            # URL
            self.url_data,
            # Payment
            self.pay_mode,
            self.pay_username,
            self.pay_amount,
            self.pay_note,
            self.pay_link,
            # Wi-Fi
            self.wifi_ssid,
            self.wifi_password,
            self.wifi_security,
            self.wifi_hidden,
            # Contact
            self.v_first,
            self.v_last,
            self.v_phone,
            self.v_phone2,
            self.v_phone1_type,
            self.v_phone2_type,
            self.v_email,
            self.v_email2,
            self.v_email1_type,
            self.v_email2_type,
            self.v_org,
            self.v_title,
            self.v_street,
            self.v_city,
            self.v_region,
            self.v_postal,
            self.v_country,
            self.v_website,
            self.v_bday,
            self.v_note,
            # Message
            self.msg_mode,
            self.sms_number,
            self.sms_text,
        ):
            try:
                v.trace_add("write", lambda *_: self._schedule_preview_update())
            except Exception:
                pass

        # ---------- UI ----------------------------------------------------
        self._build_ui()
        self._render_type_fields()
        self._on_type_changed()

        # live preview wiring (debounced)
        for v in (
            # global controls
            self.qr_type,
            self.ecc,
            self.campaign,
            self.body_color,
            self.eye_ring_color,
            self.eye_center_color,
            self.campaign_text_color,
            self.bg_transparent,
            self.bg_color,
            self.module_shape,
            self.eye_ring_shape,
            self.eye_center_shape,
            self.center_logo,
            self.center_mode,
            self.center_emoji,
            self.center_scale,
            self.source,
            self.medium,
            self.tracking_token,
            self.want_png,
            self.want_svg,
            self.modules_mode,
            self.modules_emoji,
            self.modules_scale,
            # URL
            self.url_data,
            # Payment
            self.pay_mode,
            self.pay_username,
            self.pay_amount,
            self.pay_note,
            self.pay_link,
            # Wi-Fi
            self.wifi_ssid,
            self.wifi_password,
            self.wifi_security,
            self.wifi_hidden,
            # Contact
            self.v_first,
            self.v_last,
            self.v_phone,
            self.v_phone2,
            self.v_phone1_type,
            self.v_phone2_type,
            self.v_email,
            self.v_email2,
            self.v_email1_type,
            self.v_email2_type,
            self.v_org,
            self.v_title,
            self.v_street,
            self.v_city,
            self.v_region,
            self.v_postal,
            self.v_country,
            self.v_website,
            self.v_bday,
            self.v_note,
            # Message
            self.msg_mode,
            self.sms_number,
            self.sms_text,
        ):
            try:
                v.trace_add("write", lambda *_: self._schedule_preview_update())
            except Exception:
                pass

    def _build_ui(self):

        # Top row: Type, ECC, Campaign
        top = ttk.Frame(self)
        top.pack(fill="x", pady=(0, 8))
        ttk.Label(top, text="Type").grid(row=0, column=0, sticky="w")
        cb = ttk.Combobox(
            top, textvariable=self.qr_type, values=QR_TYPES, state="readonly", width=12
        )
        cb.grid(row=1, column=0, sticky="w")
        cb.bind("<<ComboboxSelected>>",
                lambda e: self._on_type_changed())

        ttk.Label(top, text="ECC").grid(row=0, column=1, sticky="w", padx=(16, 0))
        ttk.Combobox(
            top, textvariable=self.ecc, values=ECC_LEVELS, width=4, state="readonly"
        ).grid(row=1, column=1, sticky="w", padx=(16, 0))

        ttk.Label(top, text="Campaign (filename)").grid(
            row=0, column=2, sticky="w", padx=(16, 0)
        )

        # Show/Hide caption
        ttk.Checkbutton(
            top,
            text="Show caption",
            variable=self.show_campaign,
            command=self._schedule_preview_update
        ).grid(row=1, column=3, sticky="w", padx=(8, 0))

        ttk.Entry(top, textvariable=self.campaign, width=28).grid(
            row=1, column=2, sticky="w", padx=(16, 0)
        )

        # Preview panel
        preview = ttk.LabelFrame(self, text="Preview")
        preview.pack(fill="both", expand=True, pady=(8, 0))

        # Use grid so we can place arrows left/right of the preview
        preview.columnconfigure(0, weight=0)   # left arrow
        preview.columnconfigure(1, weight=1)   # preview expands
        preview.columnconfigure(2, weight=0)   # right arrow
        preview.rowconfigure(0, weight=1)

        # Left arrow
        ttk.Button(
            preview, text="◀", width=3,
            command=lambda: self._cycle_look(-1)
        ).grid(row=0, column=0, sticky="nsw", padx=(8, 6), pady=8)

        # The preview image/label in the center
        self._preview_label = ttk.Label(preview, anchor="center")
        self._preview_label.grid(row=0, column=1, sticky="nsew", padx=8, pady=8)

        # Right arrow
        ttk.Button(
            preview, text="▶", width=3,
            command=lambda: self._cycle_look(+1)
        ).grid(row=0, column=2, sticky="nse", padx=(6, 8), pady=8)

        self._preview_after = None

        self._set_look_badge()

        # Colors --------------------------------------------------------
        col = ttk.LabelFrame(self, text="Colors")
        col.pack(fill="x", pady=(8, 8))

        def make_color_row(label, var, row, col_offset=0):
            ttk.Label(col, text=label).grid(row=row, column=col_offset, sticky="e")
            entry = ttk.Entry(col, textvariable=var, width=10)
            entry.grid(row=row, column=col_offset + 1, sticky="w", padx=(6, 0))

            # Live color swatch
            swatch = tk.Label(col, bg=var.get(), width=2, relief="solid", borderwidth=1)
            swatch.grid(row=row, column=col_offset + 2, padx=(6, 0))

            # Update swatch dynamically when hex changes
            def update_swatch(*_):
                swatch.configure(bg=var.get())

            var.trace_add("write", update_swatch)

            # Pick button
            ttk.Button(
                col,
                text="Pick",
                command=lambda v=var: pick_color(v, self._schedule_preview_update),
            ).grid(row=row, column=col_offset + 3, padx=(6, 12))

        # Body, Eye Ring, Eye Center rows
        make_color_row("Body", self.body_color, 0)
        make_color_row("Eye Ring", self.eye_ring_color, 1)
        make_color_row("Eye Center", self.eye_center_color, 2)
        # Campaign Text color
        make_color_row("Campaign Text", self.campaign_text_color, 4)

        # Transparent background + BG color
        ttk.Checkbutton(
            col,
            text="Transparent background",
            variable=self.bg_transparent,
            command=self._schedule_preview_update,
        ).grid(row=3, column=0, columnspan=2, sticky="w", pady=(8, 0))

        ttk.Label(col, text="BG").grid(row=3, column=2, sticky="e", pady=(8, 0))
        ttk.Entry(col, textvariable=self.bg_color, width=10).grid(
            row=3, column=3, sticky="w", padx=(6, 12), pady=(8, 0)
        )
        # Shapes
        shp = ttk.LabelFrame(self, text="Shapes")
        shp.pack(fill="x", pady=(0, 8))

        # Adjust grid weights so rightmost columns compress evenly
        for i in range(6):
            shp.grid_columnconfigure(i, weight=1, uniform="shapes")

        ttk.Label(shp, text="Modules").grid(row=0, column=0, sticky="e")
        cb_mod = ttk.Combobox(
            shp,
            textvariable=self.module_shape,
            values=SHAPES,
            state="readonly",
            width=10,
        )
        
        cb_mod.grid(row=0, column=1, sticky="w", padx=(6, 12))
        ttk.Label(shp, text="Eye Ring").grid(row=0, column=2, sticky="e")

        cb_ring = ttk.Combobox(
            shp,
            textvariable=self.eye_ring_shape,
            values=SHAPES,
            state="readonly",
            width=10,
        )

        cb_ring.grid(row=0, column=3, sticky="w", padx=(6, 12))

        ttk.Label(shp, text="Eye Center").grid(row=0, column=4, sticky="e")
        cb_core = ttk.Combobox(
            shp,
            textvariable=self.eye_center_shape,
            values=SHAPES,
            state="readonly",
            width=10,
        )

        cb_core.grid(row=0, column=5, sticky="w", padx=(0, 6))
        for cb in (cb_mod, cb_ring, cb_core):
            cb.bind("<<ComboboxSelected>>", lambda e: self._schedule_preview_update())

        # Module fill selector (Shape vs Emoji)
        ttk.Label(shp, text="Module Fill").grid(
            row=2, column=0, sticky="e", pady=(8, 0)
        )
        fill_cb = ttk.Combobox(
            shp,
            textvariable=self.modules_mode,
            values=["Shape", "Emoji"],
            state="readonly",
            width=10,
        )
        fill_cb.grid(row=2, column=1, sticky="w", padx=(6, 12), pady=(8, 0))

        # Emoji + scale controls for module fill
        ttk.Label(shp, text="Emoji").grid(row=2, column=2, sticky="e", pady=(8, 0))
        mod_emoji_wrap = ttk.Frame(shp)
        mod_emoji_wrap.grid(row=2, column=3, sticky="w", padx=(6, 12), pady=(8, 0))
        mod_emoji_entry = ttk.Entry(
            mod_emoji_wrap, textvariable=self.modules_emoji, width=8
        )
        mod_emoji_entry.pack(side="left")

        ttk.Button(
            mod_emoji_wrap,
            text="Pick…",
            command=lambda: self._build_emoji_picker_window(
                title="Pick an Emoji (Modules)", apply_cb=self._apply_modules_emoji
            ),
        ).pack(side="left", padx=(6, 0))

        ttk.Label(shp, text="Scale").grid(row=2, column=4, sticky="e", pady=(8, 0))
        mod_scale_spin = ttk.Spinbox(
            shp,
            textvariable=self.modules_scale,
            from_=0.10,
            to=1.00,
            increment=0.05,
            width=6,
        )
        mod_scale_spin.grid(row=2, column=5, sticky="w", pady=(8, 0))

        # Center clearing + content
        centerf = ttk.LabelFrame(self, text="Center clearing")
        centerf.pack(fill="x", pady=(0, 8))
        ttk.Checkbutton(
            centerf, text="Reserve center logo space", variable=self.center_logo
        ).grid(row=0, column=0, sticky="w")

        ttk.Label(centerf, text="Center mode").grid(
            row=1, column=0, sticky="e", pady=(6, 0)
        )
        mode_cb = ttk.Combobox(
            centerf,
            textvariable=self.center_mode,
            values=["None", "Emoji"],
            state="readonly",
            width=10,
        )
        mode_cb.grid(row=1, column=1, sticky="w", pady=(6, 0), padx=(6, 12))

        ttk.Label(centerf, text="Emoji").grid(row=1, column=2, sticky="e", pady=(6, 0))

        emoji_wrap = ttk.Frame(centerf)
        emoji_wrap.grid(row=1, column=3, sticky="w", pady=(6, 0), padx=(6, 12))

        emoji_entry = ttk.Entry(emoji_wrap, textvariable=self.center_emoji, width=8)
        emoji_entry.pack(side="left")

        ttk.Button(
            emoji_wrap,
            text="Pick…",
            command=lambda: self._build_emoji_picker_window(
                title="Pick an Emoji (Center)", apply_cb=self._apply_emoji_from_picker
            ),
        ).pack(side="left", padx=(6, 0))

        ttk.Label(centerf, text="Scale").grid(row=1, column=4, sticky="e", pady=(6, 0))
        scale_spin = ttk.Spinbox(
            centerf,
            textvariable=self.center_scale,
            from_=0.10,
            to=1.00,
            increment=0.05,
            width=6,
        )
        scale_spin.grid(row=1, column=5, sticky="w", pady=(6, 0))

        def _toggle_module_fill(*_):
            want = self.modules_mode.get() == "Emoji"
            try:
                mod_emoji_entry.config(state=("normal" if want else "disabled"))
            except tk.TclError:
                pass
            try:
                mod_scale_spin.config(state="normal")   # always enabled
            except tk.TclError:
                pass

        fill_cb.bind(
            "<<ComboboxSelected>>",
            lambda e: (_toggle_module_fill(), self._schedule_preview_update()),
        )
        _toggle_module_fill()

        def _toggle_center_controls(*_):
            want = self.center_mode.get() == "Emoji" and self.center_logo.get()
            state = "normal" if want else "disabled"
            for w in (emoji_entry, scale_spin):
                try:
                    w.config(state=state)
                except tk.TclError:
                    pass

        mode_cb.bind(
            "<<ComboboxSelected>>",
            lambda e: (_toggle_center_controls(), self._schedule_preview_update()),
        )
        self.center_logo.trace_add("write", lambda *_: _toggle_center_controls())
        _toggle_center_controls()

        # Dynamic fields container
        self.dynamic = ttk.LabelFrame(self, text="Details")
        self.dynamic.pack(fill="x", pady=(8, 8))

        # Tracking
        self.track = ttk.LabelFrame(self, text="Tracking (optional)")
        self.track.pack(fill="x", pady=(8, 8))
        ttk.Label(self.track, text="Source").grid(row=0, column=0, sticky="e")
        ttk.Entry(self.track, textvariable=self.source, width=18).grid(
            row=0, column=1, sticky="w", padx=(6, 12)
        )
        ttk.Label(self.track, text="Medium").grid(row=0, column=2, sticky="e")
        ttk.Entry(self.track, textvariable=self.medium, width=18).grid(
            row=0, column=3, sticky="w", padx=(6, 12)
        )
        ttk.Label(self.track, text="Token").grid(row=0, column=4, sticky="e")
        ttk.Entry(self.track, textvariable=self.tracking_token, width=14).grid(
            row=0, column=5, sticky="w", padx=(6, 12)
        )

        # build dynamic area now
        self._render_type_fields()

        # Export frame
        export = ttk.LabelFrame(self, text="Export")
        export.pack(fill="x", pady=(8, 8))
        ttk.Checkbutton(export, text="PNG", variable=self.want_png).grid(
            row=0, column=0, sticky="w"
        )
        ttk.Checkbutton(export, text="SVG (vector grid)", variable=self.want_svg).grid(
            row=0, column=1, sticky="w", padx=(8, 0)
        )
        ttk.Label(export, text="Output folder").grid(
            row=1, column=0, sticky="e", pady=(8, 0)
        )
        ttk.Entry(export, textvariable=self.output_dir, width=52).grid(
            row=1, column=1, columnspan=3, sticky="we", padx=(8, 8), pady=(8, 0)
        )
        ttk.Button(export, text="Choose…", command=self._choose_dir).grid(
            row=1, column=4, sticky="w", pady=(8, 0)
        )

        # Bottom
        bottom = ttk.Frame(self)
        bottom.pack(fill="x")
        ttk.Button(bottom, text="Generate", command=self._on_generate).pack(side="left")
        
        self.status = ttk.Label(bottom, text="Ready.")
        self.status.pack(side="left", padx=(12, 0))
        ttk.Button(
            bottom,
            text="Reset Styles",
            command=self._reset_styles
        ).pack(side="left", padx=(8, 0))


    # Placeholder helpers (go right above "dynamic type fields")

    def _attach_placeholder(self, entry: ttk.Entry, var: tk.StringVar, text: str):
        """Show an italic/grey placeholder that ALSO counts as content so preview runs."""
        def _apply():
            if not (var.get() or "").strip():
                var.set(text)
                entry._is_placeholder = True
                try:
                    if getattr(self, "_font_italic", None):
                        entry.configure(font=self._font_italic, foreground="#777777")
                except Exception:
                    pass

        def _focus_in(_evt):
            if getattr(entry, "_is_placeholder", False):
                entry.delete(0, "end")
                var.set("")
                entry._is_placeholder = False
                try:
                    if getattr(self, "_font_normal", None):
                        entry.configure(font=self._font_normal, foreground="#000000")
                except Exception:
                    pass

        def _focus_out(_evt):
            if not (var.get() or "").strip():
                _apply()

        _apply()
        entry.bind("<FocusIn>", _focus_in)
        entry.bind("<FocusOut>", _focus_out)


    def _ensure_url_placeholder(self):
        """Re-attach the URL placeholder if we're on URL and the entry exists."""
        try:
            if self.qr_type.get() == "URL" and getattr(self, "_url_entry", None):
                self._attach_placeholder(self._url_entry, self.url_data, self.URL_PLACEHOLDER)
        except Exception:
            pass

    def _reset_styles(self):
        t = self.qr_type.get()
        # Reapply factory preset for current Type (stateless)
        self._apply_preset_to_ui(FACTORY_PRESETS.get(t, {}), trigger_preview=False)
        # Rebuild the type-specific area (keeps typed data in those fields)
        self._render_type_fields()
        # Force preview now
        self._update_preview()
        try:
            self.status.config(text=f"Styles reset for {t}.")
        except Exception:
            pass

    # ---------- dynamic type fields -----------------------------------

    def _clear_dynamic(self):
        if not hasattr(self, "dynamic"):
            return
        for w in self.dynamic.winfo_children():
            try:
                w.destroy()
            except Exception:
                pass

    def _render_type_fields(self):
        self._clear_dynamic()
        g = self.dynamic
        pad = {"padx": (0, 8), "pady": (3, 3)}
        t = self.qr_type.get()

        # Show tracking only for URL/Payment
        want_track = t in ("URL", "Payment")
        try:
            self.track.pack_info()
            is_visible = True
        except tk.TclError:
            is_visible = False
        if want_track and not is_visible:
            self.track.pack(fill="x", pady=(8, 8))
        elif not want_track and is_visible:
            self.track.pack_forget()

        # URL
        if t == "URL":
            ttk.Label(g, text="URL").grid(row=0, column=0, sticky="e", **pad)
            self._url_entry = ttk.Entry(g, textvariable=self.url_data, width=64)
            self._url_entry.grid(row=0, column=1, sticky="w")

            # Placeholder that also counts as content (so preview runs)
            self._attach_placeholder(self._url_entry, self.url_data, self.URL_PLACEHOLDER)

        # PAYMENT
        elif t == "Payment":
            ttk.Label(g, text="Mode").grid(row=0, column=0, sticky="e", **pad)
            mode_menu = ttk.Combobox(
                g,
                textvariable=self.pay_mode,
                values=[
                    "Generic Link",
                    "Stripe Payment Link",
                    "PayPal.me",
                    "Venmo",
                    "Cash App",
                ],
                width=22,
                state="readonly",
            )
            mode_menu.grid(row=0, column=1, sticky="w")

            ttk.Label(g, text="Username / Link").grid(
                row=1, column=0, sticky="e", **pad
            )
            user_entry = ttk.Entry(g, textvariable=self.pay_username, width=40)
            user_entry.grid(row=1, column=1, columnspan=3, sticky="we")

            ttk.Label(g, text="Amount").grid(row=2, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.pay_amount, width=10).grid(
                row=2, column=1, sticky="w"
            )

            ttk.Label(g, text="Note / Message").grid(row=2, column=2, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.pay_note, width=30).grid(
                row=2, column=3, sticky="w"
            )

            ttk.Label(g, text="Direct Link (optional)").grid(
                row=3, column=0, sticky="e", **pad
            )
            link_entry = ttk.Entry(g, textvariable=self.pay_link, width=60)
            link_entry.grid(row=3, column=1, columnspan=3, sticky="we")

            def _payment_mode_refresh(*_):
                m = self.pay_mode.get()
                if m in ("Generic Link", "Stripe Payment Link"):
                    link_entry.config(state="normal")
                    user_entry.config(state="disabled")
                else:
                    link_entry.config(state="disabled")
                    user_entry.config(state="normal")

            mode_menu.bind(
                "<<ComboboxSelected>>",
                lambda e: (_payment_mode_refresh(), self._schedule_preview_update()),
            )
            _payment_mode_refresh()

        # WIFI
        elif t == "WiFi":
            ttk.Label(g, text="SSID").grid(row=0, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.wifi_ssid, width=28).grid(
                row=0, column=1, sticky="w"
            )
            ttk.Label(g, text="Password").grid(row=0, column=2, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.wifi_password, width=28, show="*").grid(
                row=0, column=3, sticky="w"
            )
            ttk.Label(g, text="Security").grid(row=1, column=0, sticky="e", **pad)
            ttk.Combobox(
                g,
                textvariable=self.wifi_security,
                values=["WPA", "WEP", "nopass"],
                width=10,
                state="readonly",
            ).grid(row=1, column=1, sticky="w")
            ttk.Checkbutton(g, text="Hidden network", variable=self.wifi_hidden).grid(
                row=1, column=2, sticky="w"
            )

        # CONTACT
        elif t == "Contact":
            ttk.Label(g, text="First").grid(row=0, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.v_first, width=20).grid(
                row=0, column=1, sticky="w"
            )
            ttk.Label(g, text="Last").grid(row=0, column=2, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.v_last, width=20).grid(
                row=0, column=3, sticky="w"
            )

            ttk.Label(g, text="Phone 1").grid(row=1, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.v_phone, width=20).grid(
                row=1, column=1, sticky="w"
            )
            ttk.Combobox(
                g,
                textvariable=self.v_phone1_type,
                values=["CELL", "WORK", "HOME", "MAIN"],
                width=8,
                state="readonly",
            ).grid(row=1, column=2, sticky="w")

            ttk.Label(g, text="Phone 2").grid(row=1, column=3, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.v_phone2, width=20).grid(
                row=1, column=4, sticky="w"
            )
            ttk.Combobox(
                g,
                textvariable=self.v_phone2_type,
                values=["WORK", "HOME", "CELL", "MAIN"],
                width=8,
                state="readonly",
            ).grid(row=1, column=5, sticky="w")

            ttk.Label(g, text="Email 1").grid(row=2, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.v_email, width=20).grid(
                row=2, column=1, sticky="w"
            )
            ttk.Combobox(
                g,
                textvariable=self.v_email1_type,
                values=["INTERNET", "WORK", "HOME"],
                width=10,
                state="readonly",
            ).grid(row=2, column=2, sticky="w")

            ttk.Label(g, text="Email 2").grid(row=2, column=3, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.v_email2, width=20).grid(
                row=2, column=4, sticky="w"
            )
            ttk.Combobox(
                g,
                textvariable=self.v_email2_type,
                values=["WORK", "HOME", "INTERNET"],
                width=10,
                state="readonly",
            ).grid(row=2, column=5, sticky="w")

            ttk.Label(g, text="Street").grid(row=3, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.v_street, width=42).grid(
                row=3, column=1, columnspan=3, sticky="we"
            )
            ttk.Label(g, text="City").grid(row=4, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.v_city, width=18).grid(
                row=4, column=1, sticky="w"
            )
            ttk.Label(g, text="State/Region").grid(row=4, column=2, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.v_region, width=12).grid(
                row=4, column=3, sticky="w"
            )
            ttk.Label(g, text="Postal").grid(row=4, column=4, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.v_postal, width=10).grid(
                row=4, column=5, sticky="w"
            )
            ttk.Label(g, text="Country").grid(row=5, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.v_country, width=18).grid(
                row=5, column=1, sticky="w"
            )

            ttk.Label(g, text="Website").grid(row=6, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.v_website, width=42).grid(
                row=6, column=1, columnspan=3, sticky="we"
            )
            ttk.Label(g, text="Birthday (YYYY-MM-DD)").grid(
                row=6, column=4, sticky="e", **pad
            )
            ttk.Entry(g, textvariable=self.v_bday, width=12).grid(
                row=6, column=5, sticky="w"
            )

            ttk.Label(g, text="Notes").grid(row=7, column=0, sticky="ne", **pad)
            ttk.Entry(g, textvariable=self.v_note, width=60).grid(
                row=7, column=1, columnspan=5, sticky="we"
            )

        # MESSAGE
        elif t == "Message":
            ttk.Label(g, text="Mode").grid(row=0, column=0, sticky="e", **pad)
            mode_menu = ttk.Combobox(
                g,
                textvariable=self.msg_mode,
                values=["Personal", "Resistbot"],
                width=12,
                state="readonly",
            )
            mode_menu.grid(row=0, column=1, sticky="w")

            ttk.Label(g, text="Phone #").grid(row=1, column=0, sticky="e", **pad)
            phone_entry = ttk.Entry(g, textvariable=self.sms_number, width=20)
            phone_entry.grid(row=1, column=1, sticky="w")

            ttk.Label(g, text="Message").grid(row=1, column=2, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.sms_text, width=40).grid(
                row=1, column=3, sticky="w"
            )

            def _apply_mode():
                mode = self.msg_mode.get()
                if mode == "Resistbot":
                    current = self.sms_number.get().strip()
                    if current and current != "50409":
                        self._personal_last_number = current
                    self.sms_number.set("50409")
                    if not self.sms_text.get().strip():
                        self.sms_text.set("RESIST")
                    try:
                        phone_entry.config(state="disabled")
                    except tk.TclError:
                        pass
                else:
                    if self.sms_number.get().strip() == "50409":
                        self.sms_number.set(self._personal_last_number or "")
                    try:
                        phone_entry.config(state="normal")
                    except tk.TclError:
                        pass

            mode_menu.bind(
                "<<ComboboxSelected>>",
                lambda e: (_apply_mode(), self._schedule_preview_update()),
            )
            _apply_mode()

        # EVENT
        elif t == "Event":
            if not hasattr(self, "evt_title"):      self.evt_title = tk.StringVar(self, "")
            if not hasattr(self, "evt_start"):      self.evt_start = tk.StringVar(self, "2025-11-09 16:00:00")
            if not hasattr(self, "evt_end"):        self.evt_end   = tk.StringVar(self, "2025-11-09 18:00:00")
            if not hasattr(self, "evt_location"):   self.evt_location = tk.StringVar(self, "")
            if not hasattr(self, "evt_details"):    self.evt_details  = tk.StringVar(self, "")
            if not hasattr(self, "evt_link_style"): self.evt_link_style = tk.StringVar(self, "Google Calendar")

            ttk.Label(g, text="Title").grid(row=0, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.evt_title, width=42).grid(row=0, column=1, columnspan=3, sticky="we")

            ttk.Label(g, text="Starts (UTC)").grid(row=1, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.evt_start, width=20).grid(row=1, column=1, sticky="w")

            ttk.Label(g, text="Ends (UTC)").grid(row=1, column=2, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.evt_end, width=20).grid(row=1, column=3, sticky="w")

            ttk.Label(g, text="Location").grid(row=2, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.evt_location, width=42).grid(row=2, column=1, columnspan=3, sticky="we")

            ttk.Label(g, text="Details").grid(row=3, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.evt_details, width=42).grid(row=3, column=1, columnspan=3, sticky="we")

            ttk.Label(g, text="Link style").grid(row=4, column=0, sticky="e", **pad)
            ttk.Combobox(
                g,
                textvariable=self.evt_link_style,
                values=["Google Calendar", "Hosted .ics (embedded)"],
                width=22,
                state="readonly",
            ).grid(row=4, column=1, sticky="w")

        # MAP
        elif t == "Map":
            if not hasattr(self, "map_query"):    self.map_query    = tk.StringVar(self, "")
            if not hasattr(self, "map_lat"):      self.map_lat      = tk.StringVar(self, "")
            if not hasattr(self, "map_lng"):      self.map_lng      = tk.StringVar(self, "")
            if not hasattr(self, "map_provider"): self.map_provider = tk.StringVar(self, "Google")

            ttk.Label(g, text="Query / Address").grid(row=0, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.map_query, width=52).grid(row=0, column=1, columnspan=3, sticky="we")

            ttk.Label(g, text="Lat").grid(row=1, column=0, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.map_lat, width=14).grid(row=1, column=1, sticky="w")

            ttk.Label(g, text="Lng").grid(row=1, column=2, sticky="e", **pad)
            ttk.Entry(g, textvariable=self.map_lng, width=14).grid(row=1, column=3, sticky="w")

            ttk.Label(g, text="Provider").grid(row=2, column=0, sticky="e", **pad)
            ttk.Combobox(
                g,
                textvariable=self.map_provider,
                values=["Google", "Apple", "geo"],
                width=10,
                state="readonly",
            ).grid(row=2, column=1, sticky="w")

    # always refresh preview
        self._schedule_preview_update()

    # ---------- utils / payload --------------------------------------

    def _choose_dir(self):
        d = filedialog.askdirectory(initialdir=self.output_dir.get(), mustexist=True)
        if d:
            self.output_dir.set(d)

    def _chosen_bg(self) -> str | None:
        """None means transparent background in SVG."""
        return (
            None
            if self.bg_transparent.get()
            else norm_hex(self.bg_color.get() or "#FFFFFF")
        )

    def _maybe_track(self, url: str) -> str:
        """Append tracking params only if any field is non-empty."""
        src = self.source.get().strip()
        med = self.medium.get().strip()
        tok = self.tracking_token.get().strip() or DEFAULT_TRACKING
        if not any([src, med, tok]):
            return url
        joiner = "&" if ("?" in url) else "?"
        return f"{url}{joiner}source={src}&medium={med}&tracking={tok}"

    def _build_payload(self) -> segno.QRCode:
        """Build the segno QR payload from current UI state."""
        t = self.qr_type.get()
        ecc = self.ecc.get()

        if t == "URL":
            url = self.url_data.get().strip()
            if not url:
                raise ValueError("URL is required.")
            return segno.make(self._maybe_track(url), error=ecc)

        if t == "Payment":
            m = self.pay_mode.get()
            usr = self.pay_username.get().strip().lstrip("$").lstrip("@")
            amt = self.pay_amount.get().strip()
            note = self.pay_note.get().strip()
            link = self.pay_link.get().strip()

            def _is_amount(s: str) -> bool:
                try:
                    return float(s) >= 0
                except Exception:
                    return False

            if m in ("Generic Link", "Stripe Payment Link"):
                if not link:
                    raise ValueError("Paste a direct payment link.")
                return segno.make(self._maybe_track(link), error=ecc)

            if m == "PayPal.me":
                if not usr:
                    raise ValueError("Enter your PayPal.me name.")
                url = f"https://paypal.me/{usr}"
                if _is_amount(amt):
                    url += f"/{amt}"
                return segno.make(self._maybe_track(url), error=ecc)

            if m == "Venmo":
                if not usr:
                    raise ValueError("Enter your Venmo username.")
                base = f"https://venmo.com/{usr}?txn=pay"
                if _is_amount(amt):
                    base += f"&amount={amt}"
                if note:
                    from urllib.parse import quote

                    base += f"&note={quote(note)}"
                return segno.make(self._maybe_track(base), error=ecc)

            if m == "Cash App":
                if not usr:
                    raise ValueError("Enter your Cash App cashtag.")
                url = f"https://cash.app/${usr}"
                if _is_amount(amt):
                    url += f"/{amt}"
                return segno.make(self._maybe_track(url), error=ecc)

            raise ValueError("Unsupported payment mode.")

        if t == "WiFi":
            ssid = self.wifi_ssid.get().strip()
            if not ssid:
                raise ValueError("SSID is required for Wi-Fi.")
            pwd = self.wifi_password.get()
            sec = self.wifi_security.get()
            hid = self.wifi_hidden.get()

            def esc(s: str) -> str:
                return (
                    (s or "")
                    .replace("\\", "\\\\")
                    .replace(";", "\\;")
                    .replace(",", "\\,")
                    .replace(":", "\\:")
                )

            parts = [f"WIFI:S:{esc(ssid)};"]
            if sec and sec.lower() != "nopass":
                parts.append(f"T:{esc(sec)};")
            if pwd:
                parts.append(f"P:{esc(pwd)};")
            if hid:
                parts.append("H:true;")
            parts.append(";")
            return segno.make("".join(parts), error=ecc)

        if t == "Contact":

            def esc_vc(s: str) -> str:
                return (
                    (s or "")
                    .replace("\\", "\\\\")
                    .replace(";", "\\;")
                    .replace(",", "\\,")
                    .replace("\n", "\\n")
                )

            first = self.v_first.get().strip()
            last = self.v_last.get().strip()

            v = [
                "BEGIN:VCARD",
                "VERSION:3.0",
                f"N:{esc_vc(last)};{esc_vc(first)};;;",
                f"FN:{esc_vc((first + ' ' + last).strip())}",
            ]
            if self.v_org.get().strip():
                v.append(f"ORG:{esc_vc(self.v_org.get().strip())}")
            if self.v_title.get().strip():
                v.append(f"TITLE:{esc_vc(self.v_title.get().strip())}")

            if self.v_phone.get().strip():
                v.append(
                    f"TEL;TYPE={esc_vc(self.v_phone1_type.get())}:{esc_vc(self.v_phone.get().strip())}"
                )
            if self.v_phone2.get().strip():
                v.append(
                    f"TEL;TYPE={esc_vc(self.v_phone2_type.get())}:{esc_vc(self.v_phone2.get().strip())}"
                )

            if self.v_email.get().strip():
                v.append(
                    f"EMAIL;TYPE={esc_vc(self.v_email1_type.get())}:{esc_vc(self.v_email.get().strip())}"
                )
            if self.v_email2.get().strip():
                v.append(
                    f"EMAIL;TYPE={esc_vc(self.v_email2_type.get())}:{esc_vc(self.v_email2.get().strip())}"
                )

            if any(
                f.get().strip()
                for f in (
                    self.v_street,
                    self.v_city,
                    self.v_region,
                    self.v_postal,
                    self.v_country,
                )
            ):
                v.append(
                    "ADR;TYPE=HOME:;;"
                    f"{esc_vc(self.v_street.get())};"
                    f"{esc_vc(self.v_city.get())};"
                    f"{esc_vc(self.v_region.get())};"
                    f"{esc_vc(self.v_postal.get())};"
                    f"{esc_vc(self.v_country.get())}"
                )
            if self.v_website.get().strip():
                v.append(f"URL:{esc_vc(self.v_website.get().strip())}")
            if self.v_bday.get().strip():
                b = self.v_bday.get().strip().replace("-", "")
                if len(b) == 8 and b.isdigit():
                    v.append(f"BDAY:{b}")
            if self.v_note.get().strip():
                v.append(f"NOTE:{esc_vc(self.v_note.get().strip())}")
            v.append("END:VCARD")
            return segno.make("\n".join(v), error=ecc)

        if t == "Message":
            number = self.sms_number.get().strip()
            if not number:
                raise ValueError("Phone number is required for Message.")
            return segno.make(
                f"SMSTO:{number}:{self.sms_text.get().strip()}", error=ecc
            )

        # --- Event ---
        if t == "Event":
            from urllib.parse import quote
            title = (self.evt_title.get() or "").strip()
            start = (self.evt_start.get() or "").strip()   # "YYYY-MM-DD HH:MM:SS" UTC
            end   = (self.evt_end.get()   or "").strip()
            loc   = (self.evt_location.get() or "").strip()
            det   = (self.evt_details.get()  or "").strip()
            style = (self.evt_link_style.get() or "Google Calendar")

            if not (title and start and end):
                raise ValueError("Title, Starts, and Ends are required for Event. Use UTC 'YYYY-MM-DD HH:MM:SS'.")

            def to_z(s: str) -> str:
                s = s.replace("-", "").replace(":", "").replace(" ", "T")
                if not s.endswith("Z"):
                    s += "Z"
                return s

            if style == "Google Calendar":
                url = (
                    "https://calendar.google.com/calendar/render?action=TEMPLATE"
                    f"&text={quote(title)}"
                    f"&dates={to_z(start)}/{to_z(end)}"
                    f"&details={quote(det)}"
                    f"&location={quote(loc)}"
                )
                return segno.make(self._maybe_track(url), error=ecc)

            ics = "\r\n".join([
                "BEGIN:VCALENDAR",
                "VERSION:2.0",
                "PRODID:-//LGBTQRCode//Event//EN",
                "BEGIN:VEVENT",
                f"UID:{int(time.time())}-{abs(hash(title))}@lgbtqrcode",
                f"DTSTAMP:{time.strftime('%Y%m%dT%H%M%SZ', time.gmtime())}",
                f"DTSTART:{to_z(start)}",
                f"DTEND:{to_z(end)}",
                f"SUMMARY:{title}",
                f"DESCRIPTION:{det}",
                f"LOCATION:{loc}",
                "END:VEVENT",
                "END:VCALENDAR",
            ])
            from urllib.parse import quote as _q
            data_url = "data:text/calendar;charset=utf-8," + _q(ics)
            return segno.make(data_url, error=ecc)

        # --- Map ---
        if t == "Map":
            from urllib.parse import quote
            prov = (self.map_provider.get() or "Google").lower()
            q    = (self.map_query.get()    or "").strip()
            lat  = (self.map_lat.get()      or "").strip()
            lng  = (self.map_lng.get()      or "").strip()

            if prov == "google":
                if lat and lng:
                    url = f"https://maps.google.com/?q={lat},{lng}"
                elif q:
                    url = f"https://maps.google.com/?q={quote(q)}"
                else:
                    raise ValueError("Enter address/query or lat/lng for Map.")
            elif prov == "apple":
                if lat and lng:
                    url = f"https://maps.apple.com/?ll={lat},{lng}"
                    if q:
                        url += f"&q={quote(q)}"
                elif q:
                    url = f"https://maps.apple.com/?q={quote(q)}"
                else:
                    raise ValueError("Enter address/query or lat/lng for Map.")
            else:  # geo
                if lat and lng:
                    label = quote(q) if q else f"{lat},{lng}"
                    url = f"geo:{lat},{lng}?q={lat},{lng}({label})"
                elif q:
                    url = f"geo:0,0?q={quote(q)}"
                else:
                    raise ValueError("Enter address/query or lat/lng for Map.")

            return segno.make(self._maybe_track(url), error=ecc)

        # If nothing matched:
        raise ValueError("Unsupported type.")

    def _compute_scale_for_target(self, qr, target_px: int, border_modules: int) -> int:
        """Fallback segno raster scale (used only if CairoSVG is missing)."""
        modules_w, _ = qr.symbol_size(scale=1, border=0)
        modules_w = int(float(modules_w))
        total_modules = modules_w + 2 * int(border_modules)
        if total_modules <= 0:
            return 2
        return max(2, int(target_px) // total_modules)

    def _build_preview_payload(self):
        """Build a payload for preview only—never fails."""
        try:
            return self._build_payload()
        except Exception:
            t = self.qr_type.get()
            ecc = self.ecc.get()
            if t == "URL":
                data = "https://example.org/preview"
            elif t == "Payment":
                data = "https://example.org/pay"
            elif t == "WiFi":
                data = "WIFI:S:MyNetwork;;"
            elif t == "Contact":
                data = "BEGIN:VCARD\nVERSION:3.0\nFN:Preview\nEND:VCARD"
            elif t == "Message":
                data = "SMSTO:5551234567:Preview"
            else:
                data = "Preview"
            return segno.make(data, error=ecc)

    # ---------- preview -----------------------------------------------

    def _schedule_preview_update(self):
        if getattr(self, "_preview_after", None):
            try:
                self.after_cancel(self._preview_after)
            except Exception:
                pass
        self._preview_after = self.after(120, self._update_preview)

    def _update_preview(self, placeholder: bool = False):
        try:
           qr = segno.make("https://example.com/preview", error="M") if placeholder else self._build_preview_payload()
        except Exception as e:
            self.status.config(text=f"Preview error: {e}")
            return

        try:
            colors = {
                "bg": self._chosen_bg(),
                "body": norm_hex(self.body_color.get()),
                "eye_ring": norm_hex(self.eye_ring_color.get()),
                "eye_center": norm_hex(self.eye_center_color.get()),
                "campaign_text": norm_hex(self.campaign_text_color.get()),
            }

            svg_text = svg_from_qr(
                qr,
                module_px=18,
                border_modules=BORDER_MODULES,
                colors=colors,
                campaign=(self.campaign.get() if self.show_campaign.get() else ""), # caption
                include_center=self.center_logo.get(),
                center_frac=0.25,
                module_shape=self.module_shape.get(),
                eye_ring_shape=self.eye_ring_shape.get(),
                eye_center_shape=self.eye_center_shape.get(),
                module_fill=(
                    "emoji" if self.modules_mode.get() == "Emoji" else "shape"
                ),
                module_emoji=self.modules_emoji.get(),
                module_scale=float(self.modules_scale.get()),
                center_mode=(
                    "emoji"
                    if (self.center_logo.get() and self.center_mode.get() == "Emoji")
                    else "none"
                ),
                center_emoji=self.center_emoji.get(),
                center_scale=float(self.center_scale.get()),
            )

            if not isinstance(svg_text, str) or not svg_text.strip():
                raise ValueError("svg_from_qr() returned no SVG text")

            if cairosvg and Image and ImageTk:
                from io import BytesIO

                png_bytes = cairosvg.svg2png(
                    bytestring=svg_text.encode("utf-8"),
                    output_width=360,
                    output_height=360,
                )
                buf = BytesIO(png_bytes)
                img = Image.open(buf).convert("RGBA")
                self._preview_photo = ImageTk.PhotoImage(img)
                self._preview_label.config(image=self._preview_photo, text="")
            else:
                self._preview_label.config(
                    image="",
                    text="Install CairoSVG + Pillow for accurate preview.\nExported SVG is still correct.",
                )
        except Exception as e:
            self._preview_label.config(image="", text=f"Preview error: {e}")

        # ---------- export -------------------------------------------------

        # ---------- emoji picker -------------------------------------------

        # If a picker is already open, focus it instead of opening another
        existing = getattr(self, "_emoji_picker_window", None)
        if existing and existing.winfo_exists():
            existing.lift()
            existing.focus_set()
            
        return

        # create the window
        win = tk.Toplevel(self)
        self._emoji_picker_window = win
        win.title(title)
        win.transient(self.winfo_toplevel())
        win.grab_set()
        win.lift()
        win.focus_set()

        def _close():
            try:
                self._emoji_picker_window = None
            finally:
                win.destroy()
        win.protocol("WM_DELETE_WINDOW", _close)
        win.bind("<Destroy>", lambda e: setattr(self, "_emoji_picker_window", None))

        # UI
        ttk.Label(win, text="Search").pack(anchor="w", padx=8, pady=(8, 0))
        query = tk.StringVar(win, "")
        ent = ttk.Entry(win, textvariable=query, width=28)
        ent.pack(fill="x", padx=8)

        frm = ttk.Frame(win)
        frm.pack(fill="both", expand=True, padx=8, pady=8)
        lb = tk.Listbox(frm, height=12)
        lb.pack(side="left", fill="both", expand=True)
        sb = ttk.Scrollbar(frm, orient="vertical", command=lb.yview)
        sb.pack(side="right", fill="y")
        lb.config(yscrollcommand=sb.set)

        # Catalog
        try:
            catalog = _iter_emoji_catalog()
        except Exception:
            catalog = [
                ("grinning face", "😀", ""),
                ("smiling face with hearts", "🥰", ""),
                ("thumbs up", "👍", ""),
                ("rainbow", "🌈", ""),
                ("transgender flag", "🏳️‍⚧️", ""),
                ("sparkles", "✨", ""),
                ("party popper", "🎉", ""),
                ("heart", "❤️", ""),
                ("fire", "🔥", ""),
                ("check mark", "✅", ""),
            ]

            def refresh_list(*_):
                q = (query.get() or "").strip().lower()
                lb.delete(0, "end")
                for name, ch, _grp in catalog:
                    if not q or (q in name.lower()) or (q in ch):
                        lb.insert("end", f"{ch}  {name}")

            refresh_list()
            query.trace_add("write", lambda *_: refresh_list())

            def apply_selection(*_):
                sel = lb.curselection()
                if not sel:
                    return
                line = lb.get(sel[0])
                chosen = line.split(" ", 1)[0]
                try:
                    apply_cb(chosen)
                finally:
                    _close()

            lb.bind("<Double-Button-1>", apply_selection)

            btns = ttk.Frame(win)
            btns.pack(fill="x", padx=8, pady=(0, 8))
            ttk.Button(btns, text="OK", command=apply_selection).pack(side="right")
            ttk.Button(btns, text="Cancel", command=_close).pack(side="right", padx=(0, 6))

            ent.focus_set()

    def _apply_emoji_from_picker(self, emoji_char: str):
        self.center_emoji.set(emoji_char)
        self._schedule_preview_update()

    def _apply_modules_emoji(self, emoji_char: str):
        self.modules_emoji.set(emoji_char)
        self._schedule_preview_update()

    # ---------- export -------------------------------------------------

    def _on_generate(self):
        campaign = (self.campaign.get() or "").strip()
        if not campaign:
            messagebox.showerror("Missing Campaign Name", "Please enter a Campaign Name.")
            return
        base = slugify(campaign)

        try:
            qr = self._build_payload()
        except Exception as e:
            messagebox.showerror("Invalid settings", str(e))
            return

        outdir = self.output_dir.get()
        os.makedirs(outdir, exist_ok=True)
        saved: list[str] = []

        # Build ONE SVG (used for both PNG & SVG)
        colors = {
            "bg": self._chosen_bg(),
            "body": norm_hex(self.body_color.get()),
            "eye_ring": norm_hex(self.eye_ring_color.get()),
            "eye_center": norm_hex(self.eye_center_color.get()),
            "campaign_text": norm_hex(self.campaign_text_color.get()),
        }

        svg_text = svg_from_qr(
            qr,
            module_px=18,
            border_modules=BORDER_MODULES,
            colors=colors,
            campaign=(self.campaign.get() if self.show_campaign.get() else ""),
            include_center=self.center_logo.get(),
            center_frac=0.25,
            module_shape=self.module_shape.get(),
            eye_ring_shape=self.eye_ring_shape.get(),
            eye_center_shape=self.eye_center_shape.get(),
            module_fill=("emoji" if self.modules_mode.get() == "Emoji" else "shape"),
            module_emoji=self.modules_emoji.get(),
            module_scale=float(self.modules_scale.get()),
            center_mode=("emoji" if (self.center_logo.get() and self.center_mode.get() == "Emoji") else "none"),
            center_emoji=self.center_emoji.get(),
            center_scale=float(self.center_scale.get()),
        )

        # PNG — rasterize custom SVG
        if self.want_png.get():
            try:
                fn = os.path.join(outdir, f"{base}.png")
                if cairosvg:
                    png_bytes = cairosvg.svg2png(
                        bytestring=svg_text.encode("utf-8"),
                        output_width=TARGET_PNG_PX,
                        output_height=TARGET_PNG_PX,
                    )
                    with open(fn, "wb") as f:
                        f.write(png_bytes)
                else:
                    # Fallback: segno (no custom shapes)
                    scale = self._compute_scale_for_target(qr, TARGET_PNG_PX, BORDER_MODULES)
                    qr.save(
                        fn,
                        scale=scale,
                        border=BORDER_MODULES,
                        dark=norm_hex(self.body_color.get()),
                        light=(None if self.bg_transparent.get() else norm_hex(self.bg_color.get())),
                    )
                saved.append(os.path.basename(fn))
            except Exception as e:
                messagebox.showerror("PNG export failed", str(e))
                return

        # SVG — write the same grid SVG
        if self.want_svg.get():
            try:
                fn = os.path.join(outdir, f"{base}.svg")
                with open(fn, "w", encoding="utf-8") as f:
                    f.write(svg_text)
                saved.append(os.path.basename(fn))
            except Exception as e:
                messagebox.showerror("SVG export failed", str(e))
                return

        self.status.config(text=(f"Saved: {', '.join(saved)}" if saved else "Nothing saved"))
        if not saved:
            messagebox.showinfo("Nothing exported", "Select at least one format (PNG or SVG).")


# ---- boot ------------------------------------------------------------

# --------- HOTFIX: make the emoji picker a real method ----------
def __qrapp_build_emoji_picker_window(self, title: str, apply_cb):
    if _emoji_lib is None:
        messagebox.showinfo(
            "Emoji library not installed",
            "Install the emoji package to use the picker:\n\npython3 -m pip install emoji",
        )
        return

    existing = getattr(self, "_emoji_picker_window", None)
    if existing and existing.winfo_exists():
        existing.lift()
        existing.focus_set()
        return

    win = tk.Toplevel(self)
    self._emoji_picker_window = win
    win.title(title)
    win.transient(self.winfo_toplevel())
    win.grab_set()
    win.lift()
    win.focus_set()

    def _close():
        try:
            self._emoji_picker_window = None
        finally:
            win.destroy()

    win.protocol("WM_DELETE_WINDOW", _close)
    win.bind("<Destroy>", lambda e: setattr(self, "_emoji_picker_window", None))

    ttk.Label(win, text="Search").pack(anchor="w", padx=8, pady=(8, 0))
    query = tk.StringVar(win, "")
    ent = ttk.Entry(win, textvariable=query, width=28)
    ent.pack(fill="x", padx=8)

    frm = ttk.Frame(win)
    frm.pack(fill="both", expand=True, padx=8, pady=8)
    lb = tk.Listbox(frm, height=12)
    lb.pack(side="left", fill="both", expand=True)
    sb = ttk.Scrollbar(frm, orient="vertical", command=lb.yview)
    sb.pack(side="right", fill="y")
    lb.config(yscrollcommand=sb.set)

    try:
        catalog = _iter_emoji_catalog()
    except Exception:
        catalog = [
            ("grinning face", "😀", ""), ("smiling face with hearts", "🥰", ""),
            ("thumbs up", "👍", ""), ("rainbow", "🌈", ""), ("transgender flag", "🏳️‍⚧️", ""),
            ("sparkles", "✨", ""), ("party popper", "🎉", ""), ("heart", "❤️", ""),
            ("fire", "🔥", ""), ("check mark", "✅", ""),
        ]

    def refresh_list(*_):
        q = (query.get() or "").strip().lower()
        lb.delete(0, "end")
        for name, ch, _grp in catalog:
            if not q or (q in name.lower()) or (q in ch):
                lb.insert("end", f"{ch}  {name}")

    refresh_list()
    query.trace_add("write", lambda *_: refresh_list())

    def apply_selection(*_):
        sel = lb.curselection()
        if not sel:
            return
        line = lb.get(sel[0])
        chosen = line.split(" ", 1)[0]
        try:
            apply_cb(chosen)
        finally:
            _close()

    lb.bind("<Double-Button-1>", apply_selection)

    btns = ttk.Frame(win)
    btns.pack(fill="x", padx=8, pady=(0, 8))
    ttk.Button(btns, text="OK", command=apply_selection).pack(side="right")
    ttk.Button(btns, text="Cancel", command=_close).pack(side="right", padx=(0, 6))

    ent.focus_set()

# Attach it to the class so the buttons can call it
QRApp._build_emoji_picker_window = __qrapp_build_emoji_picker_window

# --------- /HOTFIX ---------------------------------------------------

if __name__ == "__main__":
    root = tk.Tk()
    try:
        if "clam" in ttk.Style().theme_names():
            ttk.Style().theme_use("clam")
    except Exception:
        pass
    app = QRApp(root)
    root.mainloop()
