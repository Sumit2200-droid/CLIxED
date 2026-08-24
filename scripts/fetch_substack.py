#!/usr/bin/env python3
"""Fetch Substack posts via API (primary) or RSS (fallback) and write to data/posts.json."""

import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

PUB_URL = "https://test7334.substack.com"
API_URL = PUB_URL + "/api/v1/archive?sort=new&limit=50"
FEED_URL = PUB_URL + "/feed"
OUTPUT = "data/posts.json"
PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23E8E4DF'/%3E%3Crect x='200' y='140' width='200' height='120' rx='8' fill='%23D4CFC8'/%3E%3Cpath d='M260 200h80M260 220h60' stroke='%23B8AFA5' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E"


def fetch_json(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json"
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def fetch_xml(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/xml, text/xml, */*"
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def strip_html(text):
    text = re.sub(r"<[^>]*>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def truncate(text, limit=150):
    if len(text) > limit:
        return text[:limit].rstrip() + "\u2026"
    return text


def parse_api_date(date_str):
    if not date_str:
        return ""
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return ""


def try_api():
    """Fetch posts from Substack API. Returns list of post dicts or None on failure."""
    print(f"Trying API: {API_URL}")
    data = fetch_json(API_URL)
    if not isinstance(data, list):
        print("API returned non-list response")
        return None

    posts = []
    for item in data:
        try:
            title = (item.get("title") or "").strip()
            link = (item.get("canonical_url") or "").strip()
            if not title or not link:
                continue

            pub_date = parse_api_date(item.get("post_date", ""))
            description = truncate(strip_html(item.get("description") or item.get("truncated_body_text") or ""))
            thumbnail = item.get("cover_image") or ""
            if not thumbnail or not thumbnail.startswith("https://"):
                thumbnail = PLACEHOLDER_IMG

            posts.append({
                "title": title,
                "link": link,
                "pubDate": pub_date,
                "description": description,
                "thumbnail": thumbnail,
            })
        except Exception as e:
            print(f"  SKIP (API item error): {item.get('title', '?')} — {e}")

    return posts


def try_rss():
    """Fetch posts from RSS feed. Returns list of post dicts or None on failure."""
    print(f"Trying RSS fallback: {FEED_URL}")
    xml_data = fetch_xml(FEED_URL)
    root = ET.fromstring(xml_data)
    channel = root.find("channel")
    if channel is None:
        return None

    items = channel.findall("item")
    posts = []
    for item in items:
        try:
            title_el = item.find("title")
            link_el = item.find("link")
            pubdate_el = item.find("pubDate")
            desc_el = item.find("description")

            title = title_el.text.strip() if title_el is not None and title_el.text else ""
            link = link_el.text.strip() if link_el is not None and link_el.text else ""
            if not title or not link:
                continue

            raw_desc = desc_el.text if desc_el is not None and desc_el.text else ""
            description = truncate(strip_html(raw_desc))

            pub_date = ""
            if pubdate_el is not None and pubdate_el.text:
                try:
                    dt = parsedate_to_datetime(pubdate_el.text.strip())
                    pub_date = dt.strftime("%Y-%m-%d")
                except Exception:
                    pass

            thumbnail = ""
            enc = item.find("enclosure")
            if enc is not None:
                url = enc.get("url", "")
                if url.startswith("https://"):
                    thumbnail = url
            if not thumbnail:
                for tag in ["{http://purl.org/rss/1.0/modules/content/}encoded", "description"]:
                    el = item.find(tag)
                    if el is not None and el.text:
                        m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', el.text)
                        if m and m.group(1).startswith("https://"):
                            thumbnail = m.group(1)
                            break
            if not thumbnail:
                thumbnail = PLACEHOLDER_IMG

            posts.append({
                "title": title,
                "link": link,
                "pubDate": pub_date,
                "description": description,
                "thumbnail": thumbnail,
            })
        except Exception as e:
            print(f"  SKIP (RSS item error): {item.findtext('title', '?')} — {e}")

    return posts


def main():
    posts = None
    source = ""

    # Try API first — it's always current
    try:
        posts = try_api()
        if posts is not None:
            source = "API"
    except Exception as e:
        print(f"API failed: {e}")

    # Fallback to RSS if API failed
    if posts is None:
        try:
            posts = try_rss()
            if posts is not None:
                source = "RSS"
        except Exception as e:
            print(f"RSS also failed: {e}")

    if posts is None:
        print("ERROR: Both API and RSS failed. Leaving existing posts.json untouched.")
        sys.exit(1)

    feed_count = len(posts)
    posts.sort(key=lambda p: p["pubDate"], reverse=True)

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)

    print(f"Source: {source}")
    print(f"Fetched {feed_count} items from Substack")
    print(f"Wrote {len(posts)} items to {OUTPUT}")
    if feed_count != len(posts):
        print(f"WARNING: count mismatch ({feed_count} fetched vs {len(posts)} written)")
    else:
        print("All items included. No posts excluded.")


if __name__ == "__main__":
    main()
