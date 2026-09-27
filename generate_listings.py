#!/usr/bin/env python3
"""
RentGoX static listing page generator — auto mode.

Runs inside GitHub Actions. Pulls approved + available listings
LIVE from Supabase (only safe, public teaser fields — no phone,
no GPS, no address, no owner info), then builds:

  1. One static HTML page per listing, under  listing/<slug>.html
  2. One "area hub" landing page per city (e.g. Agartala, Tripura),
     under  hub/<slug>.html — a rich, keyword-heavy page built for
     searches like "room rent Agartala" / "Tripura room rent"
  3. A full sitemap.xml (static pages + listing pages + hub pages)

No secrets are needed beyond the existing public "anon" key that is
already shipped inside the RentGoX Android app and inside category.html
on this same website — Supabase Row Level Security controls what this
key can read, not secrecy of the key itself.
"""

import json
import os
import re
import urllib.request
from datetime import date
from collections import defaultdict

SITE_ROOT = os.path.dirname(os.path.abspath(__file__))
LISTING_DIR = os.path.join(SITE_ROOT, "listing")
HUB_DIR = os.path.join(SITE_ROOT, "hub")
SITEMAP_FILE = os.path.join(SITE_ROOT, "sitemap.xml")

BASE_URL = "https://rentgox.github.io/rentgox-website"
PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.rentgox.com"
TODAY = date.today().isoformat()

SUPABASE_URL = "https://uvkpanxzujecilwvxtid.supabase.co"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2a3Bhbnh6dWplY2lsd3Z4dGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MjAzNjMsImV4cCI6MjA5ODE5NjM2M30."
    "rCFvdYgtJjcEcej-Pfly2DXflAM3FgIKHSSUtQW0ycE"
)

# ONLY these columns are requested — never phone, latitude, longitude,
# google_maps_link, address, owner_name, owner_phone.
LISTING_FIELDS = "id,title,price,location,description,photo_url,type"

STATIC_PAGES = [
    ("", "weekly", "1.0"),
    ("category.html", "weekly", "0.8"),
    ("contact.html", "monthly", "0.5"),
    ("founder.html", "monthly", "0.7"),
    ("privacy.html", "monthly", "0.3"),
    ("terms.html", "monthly", "0.3"),
    ("refund.html", "monthly", "0.3"),
]


def fetch_listings():
    url = (
        f"{SUPABASE_URL}/rest/v1/properties"
        f"?select={LISTING_FIELDS}"
        f"&is_available=eq.true"
        f"&status=eq.approved"
        f"&order=created_at.desc"
    )
    req = urllib.request.Request(
        url,
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode("utf-8"))


def slugify(text):
    text = (text or "").lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")


def escape_html(value):
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def format_price(price):
    try:
        return f"₹{int(float(price)):,}/mo"
    except (TypeError, ValueError):
        return ""


def smart_title(s):
    s = (s or "").strip()
    return s.title() if s.islower() else s


def build_slug(item):
    title_part = slugify(smart_title(item.get("title", "listing")))
    location_part = slugify(item.get("location", ""))
    short_id = str(item["id"]).split("-")[0]
    parts = [p for p in [title_part, location_part] if p]
    return "-".join(parts) + "-" + short_id


def parse_location(location):
    """'Ramthakur College near, Agartala, Tripura' -> (area, city, state)"""
    parts = [p.strip() for p in (location or "").split(",") if p.strip()]
    if len(parts) >= 3:
        return parts[0], parts[-2], parts[-1]
    if len(parts) == 2:
        return "", parts[0], parts[1]
    if len(parts) == 1:
        return "", parts[0], ""
    return "", "", ""


# ---------------------------------------------------------------- #
# Individual listing pages
# ---------------------------------------------------------------- #

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} in {location} | RentGoX</title>
<meta name="description" content="{title} available in {location} for {price}. See photos and enquire on the RentGoX app.">
<link rel="canonical" href="{canonical_url}">
<meta property="og:title" content="{title} in {location} | RentGoX">
<meta property="og:description" content="{title} available in {location} for {price}.">
{og_image_tag}
<meta property="og:type" content="product">
<link rel="stylesheet" href="../css/style.css">
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": {json_title},
  "description": {json_description},
  "url": "{canonical_url}",
  "address": {{
    "@type": "PostalAddress",
    "addressLocality": {json_city},
    "addressRegion": {json_state},
    "addressCountry": "IN"
  }}
}}
</script>
</head>
<body>
  <div class="container" style="padding-top:120px; padding-bottom:80px; max-width:640px;">
    <a href="../category.html?type={type_lower}" style="color:var(--text-muted); font-size:14px; text-decoration:none;">&larr; Back to {type_title} listings</a>

    <div style="margin-top:24px; border:1px solid var(--border); border-radius:22px; overflow:hidden; background:var(--surface);">
      {photo_block}
      <div style="padding:24px 26px;">
        <h1 style="margin:0 0 8px; font-family:var(--font-display); color:var(--text);">{title}</h1>
        <p style="margin:0 0 6px; color:var(--text-muted);">&#128205; {location}</p>
        <p style="margin:0 0 20px; font-weight:700; color:var(--teal); font-family:var(--font-mono); font-size:18px;">{price}</p>

        {description_block}

        <a href="{play_store_link}" target="_blank" rel="noopener" class="btn btn-primary" style="display:inline-block; text-decoration:none;">
          <span>View Full Details in App</span>
        </a>
        <p style="margin-top:12px; font-size:12.5px; color:var(--text-muted);">
          Exact location, phone number, more photos and amenities are available inside the RentGoX app.
        </p>
      </div>
    </div>

    <p style="margin-top:28px; font-size:13.5px;">
      <a href="../hub/{hub_slug}.html" style="color:var(--violet);">See all rooms in {city}, {state} &rarr;</a>
    </p>
  </div>
</body>
</html>
"""


def render_listing_page(item):
    title = escape_html(smart_title(item.get("title", "Listing")))
    location = escape_html(item.get("location", "Location available in app"))
    price = format_price(item.get("price"))
    listing_type = item.get("type") or "Room"
    photo_url = item.get("photo_url") or ""
    slug = build_slug(item)
    _, city, state = parse_location(item.get("location", ""))

    if photo_url:
        photo_block = (
            f'<img src="{escape_html(photo_url)}" alt="{title} in {location}" '
            f'style="width:100%; height:220px; object-fit:cover; display:block;" loading="lazy">'
        )
        og_image_tag = f'<meta property="og:image" content="{escape_html(photo_url)}">'
    else:
        photo_block = (
            '<div style="height:220px; display:flex; align-items:center; justify-content:center; '
            'font-size:40px; background:linear-gradient(160deg, rgba(109,94,245,.22), rgba(52,209,191,.14));">'
            "&#127968;</div>"
        )
        og_image_tag = ""

    description_text = escape_html((item.get("description") or "").strip())
    description_block = (
        f'<p style="margin:0 0 20px; color:var(--text);">{description_text}</p>'
        if description_text else ""
    )

    canonical_url = f"{BASE_URL}/listing/{slug}.html"
    play_store_link = f"{PLAY_STORE_URL}&referrer=id%3D{item['id']}"
    hub_slug = slugify(f"rooms-in-{city}-{state}") if city else ""

    return slug, PAGE_TEMPLATE.format(
        title=title,
        location=location,
        price=price if price else "Price available in app",
        canonical_url=canonical_url,
        og_image_tag=og_image_tag,
        json_title=json.dumps(smart_title(item.get("title", "Listing"))),
        json_description=json.dumps(item.get("description") or title),
        json_type=json.dumps(listing_type),
        json_city=json.dumps(city or ""),
        json_state=json.dumps(state or ""),
        price_number=item.get("price") or "0",
        json_location=json.dumps(item.get("location", "")),
        type_lower=listing_type.lower(),
        type_title=listing_type,
        photo_block=photo_block,
        description_block=description_block,
        play_store_link=play_store_link,
        hub_slug=hub_slug or "index",
        city=escape_html(city or "your area"),
        state=escape_html(state or ""),
    )


# ---------------------------------------------------------------- #
# Area hub landing pages (e.g. "Rooms for Rent in Agartala, Tripura")
# ---------------------------------------------------------------- #

HUB_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Room &amp; PG Rent in {city}, {state} | Verified Listings on RentGoX</title>
<meta name="description" content="Looking for a room, PG or flat on rent in {city}, {state}? Browse {count} verified listings across {areas_text} on RentGoX, starting from {min_price}.">
<meta name="keywords" content="room rent {city}, {city} room rent, {state} room rent, PG in {city}, flat rent {city}, রুম ভাড়া {city_bn}, {state_bn} রুম ভাড়া, বাসা ভাড়া {city_bn}">
<link rel="canonical" href="{canonical_url}">
<meta property="og:title" content="Room &amp; PG Rent in {city}, {state} | RentGoX">
<meta property="og:description" content="Browse {count} verified room, PG and flat listings in {city}, {state} on RentGoX.">
<meta property="og:type" content="website">
<link rel="stylesheet" href="../css/style.css">
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Rooms for rent in {city}, {state}",
  "itemListElement": [
{item_list_json}
  ]
}}
</script>
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
{faq_json}
  ]
}}
</script>
<style>
  .hub-hero {{
    position:relative; overflow:hidden; border-radius:28px;
    background:var(--grad-primary); color:#fff;
    padding:56px 32px 48px; margin-top:96px;
  }}
  .hub-hero::before {{
    content:""; position:absolute; inset:0;
    background:var(--grad-radial); mix-blend-mode:screen;
  }}
  .hub-hero h1 {{
    position:relative; font-family:var(--font-display); font-size:clamp(28px,5vw,44px);
    line-height:1.15; margin:0 0 14px; max-width:680px;
  }}
  .hub-hero p {{ position:relative; max-width:560px; opacity:.92; font-size:16px; margin:0 0 22px; }}
  .chip-row {{ position:relative; display:flex; flex-wrap:wrap; gap:8px; }}
  .chip {{
    background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.35);
    color:#fff; font-size:13px; padding:6px 14px; border-radius:999px;
  }}
  .stat-row {{ display:flex; gap:28px; flex-wrap:wrap; margin:32px 0 8px; }}
  .stat {{ min-width:120px; }}
  .stat b {{ display:block; font-family:var(--font-display); font-size:28px; color:var(--text); }}
  .stat span {{ font-size:13px; color:var(--text-muted); }}
  .hub-grid {{
    display:grid; grid-template-columns:repeat(auto-fill, minmax(240px,1fr));
    gap:18px; margin-top:22px;
  }}
  .hub-card {{
    border:1px solid var(--border); border-radius:18px; overflow:hidden;
    background:var(--surface); text-decoration:none; color:inherit;
    display:block; transition:transform .2s var(--ease-soft), box-shadow .2s;
  }}
  .hub-card:hover {{ transform:translateY(-3px); box-shadow:var(--shadow-md); }}
  .hub-card .thumb {{ height:150px; background-size:cover; background-position:center; }}
  .hub-card .thumb.placeholder {{
    display:flex; align-items:center; justify-content:center; font-size:32px;
    background:linear-gradient(160deg, rgba(34,45,74,.14), rgba(214,84,48,.10));
  }}
  .hub-card .body {{ padding:14px 16px; }}
  .hub-card h3 {{ margin:0 0 4px; font-family:var(--font-display); font-size:17px; }}
  .hub-card .loc {{ font-size:12.5px; color:var(--text-muted); margin:0 0 6px; }}
  .hub-card .price {{ font-family:var(--font-mono); font-weight:700; color:var(--teal); font-size:15px; }}
  .why-grid {{ display:grid; grid-template-columns:repeat(auto-fit, minmax(200px,1fr)); gap:18px; margin:18px 0 8px; }}
  .why-card {{ border:1px solid var(--border); border-radius:16px; padding:18px; background:var(--surface); }}
  .why-card h4 {{ margin:0 0 6px; font-family:var(--font-display); font-size:16px; }}
  .why-card p {{ margin:0; font-size:13.5px; color:var(--text-muted); }}
  details.faq {{ border:1px solid var(--border); border-radius:14px; padding:14px 18px; margin-bottom:10px; background:var(--surface); }}
  details.faq summary {{ cursor:pointer; font-weight:600; color:var(--text); }}
  details.faq p {{ margin:10px 0 0; color:var(--text-muted); font-size:14px; }}
  section.hub-section {{ margin-top:48px; }}
  section.hub-section h2 {{ font-family:var(--font-display); font-size:24px; margin:0 0 6px; }}
  section.hub-section > .lead {{ color:var(--text-muted); font-size:14.5px; margin:0 0 18px; }}
</style>
</head>
<body>
  <div class="container" style="max-width:1080px; padding-bottom:80px;">

    <div class="hub-hero">
      <h1>Rent a Room, PG or Flat in {city}, {state}</h1>
      <p>{intro_line}</p>
      <div class="chip-row">{area_chips}</div>
    </div>

    <div class="stat-row">
      <div class="stat"><b>{count}</b><span>Live listings</span></div>
      <div class="stat"><b>{area_count}</b><span>Areas covered</span></div>
      <div class="stat"><b>{min_price}</b><span>Starting from</span></div>
    </div>

    <section class="hub-section">
      <h2>Available now in {city}</h2>
      <p class="lead">Updated automatically — every listing below is currently marked available.</p>
      <div class="hub-grid">
        {listing_cards}
      </div>
    </section>

    <section class="hub-section">
      <h2>Why rent through RentGoX in {state}?</h2>
      <div class="why-grid">
        <div class="why-card">
          <h4>Verified listings only</h4>
          <p>Every room shown here has been reviewed and approved before it goes live — no fake or duplicate posts.</p>
        </div>
        <div class="why-card">
          <h4>Local to {city}</h4>
          <p>Built for renters and owners in {city} and across {state}, covering areas like {areas_text}.</p>
        </div>
        <div class="why-card">
          <h4>Direct owner contact</h4>
          <p>Open the RentGoX app to view exact location, phone number and photos, and message the owner directly.</p>
        </div>
      </div>
    </section>

    <section class="hub-section">
      <h2>Frequently asked questions</h2>
      {faq_html}
    </section>

    <div style="text-align:center; margin-top:48px; padding:32px; border-radius:22px; background:var(--ink-soft);">
      <p style="margin:0 0 14px; font-family:var(--font-display); font-size:20px; color:var(--text);">
        Get the RentGoX app to contact owners in {city} directly
      </p>
      <a href="{play_store_link}" target="_blank" rel="noopener" class="btn btn-primary" style="display:inline-block; text-decoration:none;">
        <span>Download RentGoX</span>
      </a>
    </div>

  </div>
</body>
</html>
"""


def render_hub_card(item):
    title = escape_html(smart_title(item.get("title", "Listing")))
    location = escape_html(item.get("location", ""))
    price = format_price(item.get("price")) or "Price in app"
    photo_url = item.get("photo_url") or ""
    slug = build_slug(item)

    if photo_url:
        thumb = f'<div class="thumb" style="background-image:url(\'{escape_html(photo_url)}\')"></div>'
    else:
        thumb = '<div class="thumb placeholder">&#127968;</div>'

    return f"""<a class="hub-card" href="../listing/{slug}.html">
      {thumb}
      <div class="body">
        <h3>{title}</h3>
        <p class="loc">&#128205; {location}</p>
        <p class="price">{price}</p>
      </div>
    </a>"""


def build_faqs(city, state, areas, min_price, max_price, count):
    areas_text = ", ".join(areas) if areas else f"{city}"
    faqs = [
        (
            f"Where can I find rooms for rent in {city}, {state}?",
            f"RentGoX currently lists {count} verified rooms, PGs and flats in {city}, "
            f"covering areas such as {areas_text}. Browse listings on this page or open the "
            f"RentGoX app to see the full, up-to-date list.",
        ),
        (
            f"What is the average rent for a room in {city}?",
            f"Rooms currently listed on RentGoX in {city} range from {min_price} to {max_price} "
            f"per month, depending on the area, room type and amenities.",
        ),
        (
            f"Which areas in {city} have rooms available right now?",
            f"As of today, RentGoX has listings in {areas_text}. New areas are added as owners "
            f"list new rooms, so check back or use the app for the latest additions.",
        ),
        (
            f"Is it safe to rent a room through RentGoX in {state}?",
            "Every listing shown here is reviewed and approved before it appears on the site or app. "
            "Exact address and phone number are only shared with you inside the app after you connect "
            "with the owner.",
        ),
        (
            "How do I contact a room owner?",
            f"Tap \"View Full Details in App\" on any listing, or download RentGoX directly, to see the "
            f"exact location, photos and the owner's contact number for that room in {city}.",
        ),
    ]
    return faqs


def render_faq_html(faqs):
    blocks = []
    for q, a in faqs:
        blocks.append(
            f'<details class="faq"><summary>{escape_html(q)}</summary><p>{escape_html(a)}</p></details>'
        )
    return "\n      ".join(blocks)


def render_faq_json(faqs):
    entries = []
    for q, a in faqs:
        entries.append(
            "    {\n"
            f'      "@type": "Question",\n      "name": {json.dumps(q)},\n'
            '      "acceptedAnswer": {\n        "@type": "Answer",\n'
            f'        "text": {json.dumps(a)}\n      }}\n    }}'
        )
    return ",\n".join(entries)


def render_itemlist_json(items):
    entries = []
    for i, item in enumerate(items, start=1):
        slug = build_slug(item)
        entries.append(
            "    {\n"
            '      "@type": "ListItem",\n'
            f'      "position": {i},\n'
            f'      "url": "{BASE_URL}/listing/{slug}.html"\n'
            "    }"
        )
    return ",\n".join(entries)


def build_hub_pages(items):
    groups = defaultdict(list)
    for item in items:
        _, city, state = parse_location(item.get("location", ""))
        if not city:
            continue
        groups[(city, state)].append(item)

    hub_pages = []  # (slug, html)

    for (city, state), group_items in groups.items():
        areas = sorted({parse_location(i.get("location", ""))[0] for i in group_items if parse_location(i.get("location", ""))[0]})
        prices = [float(i["price"]) for i in group_items if i.get("price")]
        min_price = format_price(min(prices)) if prices else "N/A"
        max_price = format_price(max(prices)) if prices else "N/A"
        areas_text = ", ".join(areas) if areas else city

        slug = slugify(f"rooms-in-{city}-{state}")
        canonical_url = f"{BASE_URL}/hub/{slug}.html"

        chips = "".join(f'<span class="chip">{escape_html(a)}</span>' for a in areas) or f'<span class="chip">{escape_html(city)}</span>'
        cards = "\n        ".join(render_hub_card(i) for i in group_items)

        faqs = build_faqs(city, state, areas, min_price, max_price, len(group_items))

        html = HUB_TEMPLATE.format(
            city=escape_html(city),
            state=escape_html(state),
            city_bn=escape_html(city),
            state_bn=escape_html(state),
            count=len(group_items),
            areas_text=escape_html(areas_text),
            area_count=len(areas) if areas else 1,
            min_price=min_price,
            canonical_url=canonical_url,
            intro_line=(
                f"Browse verified rooms, PGs and flats for rent in {escape_html(city)}, "
                f"{escape_html(state)} — updated directly from the RentGoX app, with new "
                f"listings added as they're approved."
            ),
            area_chips=chips,
            listing_cards=cards,
            faq_html=render_faq_html(faqs),
            faq_json=render_faq_json(faqs),
            item_list_json=render_itemlist_json(group_items),
            play_store_link=PLAY_STORE_URL,
        )
        hub_pages.append((slug, html))

    return hub_pages


# ---------------------------------------------------------------- #
# Sitemap
# ---------------------------------------------------------------- #

def build_sitemap(listing_slugs, hub_slugs):
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

    for path, changefreq, priority in STATIC_PAGES:
        loc = f"{BASE_URL}/{path}" if path else f"{BASE_URL}/"
        lines += [
            "  <url>", f"    <loc>{loc}</loc>",
            f"    <lastmod>{TODAY}</lastmod>",
            f"    <changefreq>{changefreq}</changefreq>",
            f"    <priority>{priority}</priority>", "  </url>",
        ]

    for slug in hub_slugs:
        loc = f"{BASE_URL}/hub/{slug}.html"
        lines += [
            "  <url>", f"    <loc>{loc}</loc>",
            f"    <lastmod>{TODAY}</lastmod>",
            "    <changefreq>daily</changefreq>",
            "    <priority>0.9</priority>", "  </url>",
        ]

    for slug in listing_slugs:
        loc = f"{BASE_URL}/listing/{slug}.html"
        lines += [
            "  <url>", f"    <loc>{loc}</loc>",
            f"    <lastmod>{TODAY}</lastmod>",
            "    <changefreq>weekly</changefreq>",
            "    <priority>0.6</priority>", "  </url>",
        ]

    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def main():
    items = fetch_listings()
    print(f"fetched {len(items)} approved+available listings")

    os.makedirs(LISTING_DIR, exist_ok=True)
    os.makedirs(HUB_DIR, exist_ok=True)

    # remove old generated pages first so a rented-out/removed listing's
    # page (or a stale hub page) doesn't linger on the site
    for folder in (LISTING_DIR, HUB_DIR):
        for name in os.listdir(folder):
            if name.endswith(".html"):
                os.remove(os.path.join(folder, name))

    listing_slugs = []
    for item in items:
        slug, html = render_listing_page(item)
        with open(os.path.join(LISTING_DIR, f"{slug}.html"), "w", encoding="utf-8") as f:
            f.write(html)
        listing_slugs.append(slug)
        print(f"wrote listing/{slug}.html")

    hub_slugs = []
    for slug, html in build_hub_pages(items):
        with open(os.path.join(HUB_DIR, f"{slug}.html"), "w", encoding="utf-8") as f:
            f.write(html)
        hub_slugs.append(slug)
        print(f"wrote hub/{slug}.html")

    with open(SITEMAP_FILE, "w", encoding="utf-8") as f:
        f.write(build_sitemap(listing_slugs, hub_slugs))
    print(f"wrote sitemap.xml with {len(STATIC_PAGES) + len(listing_slugs) + len(hub_slugs)} URLs")


if __name__ == "__main__":
    main()
