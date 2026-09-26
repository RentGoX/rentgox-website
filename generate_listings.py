#!/usr/bin/env python3
"""
RentGoX static listing page generator — auto mode.

Runs inside GitHub Actions. Pulls approved + available listings
LIVE from Supabase (only safe, public teaser fields — no phone,
no GPS, no address, no owner info), then builds:

  1. One static HTML page per listing, under  listing/<slug>.html
  2. A full sitemap.xml (static pages + every listing page)

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

SITE_ROOT = os.path.dirname(os.path.abspath(__file__))
LISTING_DIR = os.path.join(SITE_ROOT, "listing")
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
        return f"৳{int(float(price)):,}/mo"
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
  "@type": "Product",
  "name": {json_title},
  "description": {json_description},
  "category": {json_type},
  "offers": {{
    "@type": "Offer",
    "price": "{price_number}",
    "priceCurrency": "BDT",
    "availability": "https://schema.org/InStock"
  }},
  "areaServed": {json_location}
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
  </div>
</body>
</html>
"""


def render_page(item):
    title = escape_html(smart_title(item.get("title", "Listing")))
    location = escape_html(item.get("location", "Location available in app"))
    price = format_price(item.get("price"))
    listing_type = item.get("type") or "Room"
    photo_url = item.get("photo_url") or ""
    slug = build_slug(item)

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

    return slug, PAGE_TEMPLATE.format(
        title=title,
        location=location,
        price=price if price else "Price available in app",
        canonical_url=canonical_url,
        og_image_tag=og_image_tag,
        json_title=json.dumps(smart_title(item.get("title", "Listing"))),
        json_description=json.dumps(item.get("description") or title),
        json_type=json.dumps(listing_type),
        price_number=item.get("price") or "0",
        json_location=json.dumps(item.get("location", "")),
        type_lower=listing_type.lower(),
        type_title=listing_type,
        photo_block=photo_block,
        description_block=description_block,
        play_store_link=play_store_link,
    )


def build_sitemap(slugs):
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

    for slug in slugs:
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

    # remove old generated pages first so a rented-out/removed listing's
    # page doesn't linger on the site
    for name in os.listdir(LISTING_DIR):
        if name.endswith(".html"):
            os.remove(os.path.join(LISTING_DIR, name))

    slugs = []
    for item in items:
        slug, html = render_page(item)
        with open(os.path.join(LISTING_DIR, f"{slug}.html"), "w", encoding="utf-8") as f:
            f.write(html)
        slugs.append(slug)
        print(f"wrote listing/{slug}.html")

    with open(SITEMAP_FILE, "w", encoding="utf-8") as f:
        f.write(build_sitemap(slugs))
    print(f"wrote sitemap.xml with {len(STATIC_PAGES) + len(slugs)} URLs")


if __name__ == "__main__":
    main()
