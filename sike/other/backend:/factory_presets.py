"""
factory_presets.py
---------------------------------------
LGBTQRCode — Factory Presets Library

This file defines the creative "factory default" looks
for each supported QR Type (URL, Payment, WiFi, Contact, Message).

Each Type contains one or more "Looks" (sub-presets) that include
visual settings, emoji choices, and caption text. These are
intended as attractive, ready-to-use starting points for users,
but can be fully edited inside the app.

Author: Jacob Henderson
Version: 1.0
Last Updated: October 2025
"""

# ============================================================
# FACTORY_PRESETS — Default Looks Library
# ============================================================

FACTORY_PRESETS = {
    "URL": [
        {
            "caption": "EXPLORE",
            "center_emoji": "🧭",
            "body": "#000000",
            "eye_ring": "#919191",
            "eye_center": "#7697bb",
            "bg": "#FFFFFF",
            "bg_transparent": False,
            "module_shape": "Rounded",
            "eye_ring_shape": "Square",
            "eye_center_shape": "Square",
            "modules_mode": "Emoji",
            "modules_emoji": "🔗",
            "modules_scale": 0.9,
            "center_logo": True,
            "center_mode": "Emoji",
            "center_scale": 0.9,
            "campaign_text": "#000000",
        },
        {
            "caption": "GO",
            "center_emoji": "🚀",
            "body": "#222222",
            "eye_ring": "#888888",
            "eye_center": "#555555",
            "bg": "#FFFFFF",
            "bg_transparent": False,
            "module_shape": "Square",
            "eye_ring_shape": "Rounded",
            "eye_center_shape": "Square",
            "modules_mode": "Emoji",
            "modules_emoji": "🌐",
            "modules_scale": 0.9,
            "center_logo": True,
            "center_mode": "Emoji",
            "center_scale": 0.9,
            "campaign_text": "#000000",
        },
        {
            "caption": "VISIT",
            "center_emoji": "🔗",
            "body": "#111111",
            "eye_ring": "#919191",
            "eye_center": "#c0c0c0",
            "bg": "#FFFFFF",
            "bg_transparent": False,
            "module_shape": "Rounded",
            "eye_ring_shape": "Rounded",
            "eye_center_shape": "Rounded",
            "modules_mode": "Emoji",
            "modules_emoji": "🔗",
            "modules_scale": 0.9,
            "center_logo": True,
            "center_mode": "Emoji",
            "center_scale": 0.9,
            "campaign_text": "#000000",
        },
    ],

    "Payment": [
        {
            "caption": "SUPPORT",
            "center_emoji": "💜",
            "body": "#111111",
            "eye_ring": "#111111",
            "eye_center": "#111111",
            "bg": "#FFFFFF",
            "bg_transparent": True,
            "module_shape": "Rounded",
            "eye_ring_shape": "Rounded",
            "eye_center_shape": "Rounded",
            "modules_mode": "Shape",
            "modules_emoji": "💸",
            "modules_scale": 0.9,
            "center_logo": True,
            "center_mode": "Emoji",
            "center_scale": 0.85,
            "campaign_text": "#111111",
        },
        {
            "caption": "PAY",
            "center_emoji": "💰",
            "body": "#000000",
            "eye_ring": "#888888",
            "eye_center": "#444444",
            "bg": "#FFFFFF",
            "bg_transparent": False,
            "module_shape": "Square",
            "eye_ring_shape": "Rounded",
            "eye_center_shape": "Rounded",
            "modules_mode": "Shape",
            "modules_emoji": "💸",
            "modules_scale": 0.9,
            "center_logo": True,
            "center_mode": "Emoji",
            "center_scale": 0.85,
            "campaign_text": "#000000",
        },
        {
            "caption": "GIVE",
            "center_emoji": "🤝",
            "body": "#222222",
            "eye_ring": "#444444",
            "eye_center": "#999999",
            "bg": "#FFFFFF",
            "bg_transparent": False,
            "module_shape": "Rounded",
            "eye_ring_shape": "Rounded",
            "eye_center_shape": "Rounded",
            "modules_mode": "Emoji",
            "modules_emoji": "🤲",
            "modules_scale": 0.9,
            "center_logo": True,
            "center_mode": "Emoji",
            "center_scale": 0.9,
            "campaign_text": "#000000",
        },
    ],

    "WiFi": [
        {
            "caption": "CONNECT",
            "center_emoji": "📶",
            "body": "#1d4ed8",
            "eye_ring": "#1d4ed8",
            "eye_center": "#1d4ed8",
            "bg": "#FFFFFF",
            "bg_transparent": False,
            "module_shape": "Square",
            "eye_ring_shape": "Rounded",
            "eye_center_shape": "Rounded",
            "modules_mode": "Shape",
            "modules_emoji": "📶",
            "modules_scale": 0.9,
            "center_logo": True,
            "center_mode": "Emoji",
            "center_scale": 0.9,
            "campaign_text": "#1d4ed8",
        },
        {
            "caption": "SIGNAL",
            "center_emoji": "📡",
            "body": "#3b82f6",
            "eye_ring": "#60a5fa",
            "eye_center": "#1d4ed8",
            "bg": "#FFFFFF",
            "bg_transparent": False,
            "module_shape": "Rounded",
            "eye_ring_shape": "Rounded",
            "eye_center_shape": "Rounded",
            "modules_mode": "Emoji",
            "modules_emoji": "📶",
            "modules_scale": 0.9,
            "center_logo": True,
            "center_mode": "Emoji",
            "center_scale": 0.9,
            "campaign_text": "#1d4ed8",
        },
    ],

    "Contact": [
        {
            "caption": "HELLO",
            "center_emoji": "👋",
            "body": "#111111",
            "eye_ring": "#111111",
            "eye_center": "#111111",
            "bg": "#FFFFFF",
            "bg_transparent": False,
            "module_shape": "Rounded",
            "eye_ring_shape": "Rounded",
            "eye_center_shape": "Rounded",
            "modules_mode": "Shape",
            "modules_emoji": "👋",
            "modules_scale": 0.9,
            "center_logo": True,
            "center_mode": "Emoji",
            "center_scale": 0.85,
            "campaign_text": "#000000",
        },
        {
            "caption": "HEY",
            "center_emoji": "🖐️",
            "body": "#000000",
            "eye_ring": "#888888",
            "eye_center": "#444444",
            "bg": "#FFFFFF",
            "bg_transparent": False,
            "module_shape": "Square",
            "eye_ring_shape": "Rounded",
            "eye_center_shape": "Rounded",
            "modules_mode": "Emoji",
            "modules_emoji": "👋",
            "modules_scale": 0.9,
            "center_logo": True,
            "center_mode": "Emoji",
            "center_scale": 0.85,
            "campaign_text": "#000000",
        },
    ],

    "Message": [
        {
            "caption": "RESIST",
            "center_emoji": "💬",
            "body": "#000000",
            "eye_ring": "#444444",
            "eye_center": "#888888",
            "bg": "#FFFFFF",
            "bg_transparent": False,
            "module_shape": "Rounded",
            "eye_ring_shape": "Rounded",
            "eye_center_shape": "Rounded",
            "modules_mode": "Shape",
            "modules_emoji": "💬",
            "modules_scale": 0.9,
            "center_logo": True,
            "center_mode": "Emoji",
            "center_scale": 0.85,
            "campaign_text": "#000000",
        },
        {
            "caption": "SAY HI",
            "center_emoji": "💭",
            "body": "#222222",
            "eye_ring": "#777777",
            "eye_center": "#999999",
            "bg": "#FFFFFF",
            "bg_transparent": False,
            "module_shape": "Square",
            "eye_ring_shape": "Rounded",
            "eye_center_shape": "Rounded",
            "modules_mode": "Emoji",
            "modules_emoji": "💬",
            "modules_scale": 0.9,
            "center_logo": True,
            "center_mode": "Emoji",
            "center_scale": 0.85,
            "campaign_text": "#000000",
        },
    ],
}


# ============================================================
# Helper Functions (optional, for GUI / introspection)
# ============================================================

def list_types() -> list[str]:
    """Return all available QR Types."""
    return list(FACTORY_PRESETS.keys())


def list_looks(qr_type: str) -> list[str]:
    """Return available 'look' captions for a given Type."""
    looks = FACTORY_PRESETS.get(qr_type, [])
    return [look.get("caption", "Unnamed") for look in looks]


def get_preset(qr_type: str, index: int = 0) -> dict:
    """Return a specific look dict for the given Type."""
    looks = FACTORY_PRESETS.get(qr_type, [])
    if not looks:
        return {}
    return looks[index % len(looks)]


# ============================================================
# End of factory_presets.py
# ============================================================


