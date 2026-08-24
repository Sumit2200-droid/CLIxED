#!/usr/bin/env python3
"""Fetch Substack RSS feed and output a clean JSON array to data/posts.json."""

import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

FEED_URL = "https://test7334.substack.com/feed"
OUTPUT_PATH = "data/posts.json"
MAX_POSTS = 12
TRUNCATE_LEN = 150


def strip_html(text):
    """Remove all HTML tags and collapse whitespace."""
    text = re.sub(r"<[^>]*>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def truncate(text, limit=TRUNCATE_LEN):
    """Truncate text to limit characters, adding ellipsis if needed."""
    if len(text) > limit:
        return text[:limit].rstrip() + "\u2026"
    return text


def extract_thumbnail(item):
    """Extract thumbnail URL from <enclosure> or first <img> in content."""
    # Try <enclosure> tag first
    enclosure = item.find("enclosure")
    if enclosure is not None:
        url = enclosure.get("url", "")
        if url and url.startswith("https://"):
            return url

    # Fall back to first <img> src in content:encoded or description
    for tag_name in ["content:encoded", "{http://purl.org/rss/1.0/modules/content/}encoded", "description"]:
        el = item.find(tag_name)
        if el is not None and el.text:
            match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', el.text)
            if match:
                url = match.group(1)
                if url.startswith("https://"):
                    return url

    return ""


def parse_date(date_str):
    """Parse an RSS pubDate string into ISO date format (YYYY-MM-DD)."""
    if not date_str:
        return ""
    # Handle RFC 2822 dates like "Thu, 15 Aug 2024 10:30:00 +0000"
    try:
        # Python's email.utils is good for RFC 2822 but let's use a simpler approach
        from email.utils import parsedate_to_datetime
        dt = parsedate_to_datetime(date_str.strip())
        return dt.strftime("%Y-%m-%d")
    except Exception:
        pass
    # Try standard ISO formats
    try:
        dt = datetime.fromisoformat(date_str.strip().replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return ""


def main():
    # Fetch the RSS feed
    print(f"Fetching RSS feed from {FEED_URL}...")
    req = urllib.request.Request(
        FEED_URL,
        headers={"User-Agent": "CLIxED-GitHub-Actions/1.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        xml_data = resp.read().decode("utf-8")

    print(f"Received {len(xml_data)} bytes of XML.")

    # Parse XML
    root = ET.fromstring(xml_data)
    channel = root.find("channel")
    if channel is None:
        print("ERROR: No <channel> element found in RSS feed.")
        sys.exit(1)

    items = channel.findall("item")
    print(f"Found {len(items)} items in feed.")

    posts = []
    for item in items:
        title_el = item.find("title")
        link_el = item.find("link")
        pubdate_el = item.find("pubDate")
        desc_el = item.find("description")

        title = title_el.text.strip() if title_el is not None and title_el.text else ""
        link = link_el.text.strip() if link_el is not None and link_el.text else ""

        if not title or not link:
            continue

        # Get raw description and strip HTML + truncate
        raw_desc = ""
        if desc_el is not None and desc_el.text:
            raw_desc = desc_el.text
        description = truncate(strip_html(raw_desc))

        pub_date = parse_date(pubdate_el.text if pubdate_el is not None else "")
        thumbnail = extract_thumbnail(item)

        posts.append({
            "title": title,
            "link": link,
            "pubDate": pub_date,
            "description": description,
            "thumbnail": thumbnail,
        })

    # Sort newest first by pubDate
    posts.sort(key=lambda p: p["pubDate"], reverse=True)

    # Keep only the latest N
    posts = posts[:MAX_POSTS]

    print(f"Outputting {len(posts)} posts to {OUTPUT_PATH}")

    # Write JSON
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)

    print("Done.")


if __name__ == "__main__":
    main()
