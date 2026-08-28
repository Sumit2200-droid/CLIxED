#!/usr/bin/env python3
"""Fetch Substack posts via API (primary) or RSS (fallback) and write to data/posts.json."""
import os
import json
import re
import sys
import urllib.request
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
JINA_PREFIX = "https://r.jina.ai/"
PUB_URL = "https://test7334.substack.com"
API_URL = PUB_URL + "/api/v1/archive?sort=new&limit=50"
FEED_URL = PUB_URL + "/feed"
PROXY_FEED_URL = "https://api.allorigins.win/raw?url=" + FEED_URL
CONTENT_TAG = "{http://purl.org/rss/1.0/modules/content/}encoded"
OUTPUT = "data/posts.json"
PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23E8E4DF'/%3E%3Crect x='200' y='140' width='200' height='120' rx='8' fill='%23D4CFC8'/%3E%3Cpath d='M260 200h80M260 220h60' stroke='%23B8AFA5' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E"


def fetch_json(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json"
    })
    with urllib.request.urlopen(req, timeout=45) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_jina_json(url):
    """Fetch JSON through Jina Reader and extract the Markdown Content payload."""
    jina_url = JINA_PREFIX + url

    req = urllib.request.Request(
        jina_url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/plain, */*",
        },
    )

    with urllib.request.urlopen(req, timeout=45) as resp:
        raw = resp.read().decode("utf-8")

    marker = "Markdown Content:"

    if marker not in raw:
        raise ValueError("Jina response did not contain Markdown Content")

    payload = raw.split(marker, 1)[1].strip()

    return json.loads(payload)

def fetch_xml(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/xml, text/xml, */*"
    })
    with urllib.request.urlopen(req, timeout=45) as resp:
        return resp.read().decode("utf-8")


def strip_html(text):
    text = re.sub(r"<[^>]*>", " ", text)
    return re.sub(r"\s+", " ", text).strip()



def sanitize_content(html):
    """Light sanitization: strip script/style/iframe tags, on*= handlers,
    and empty leftover paragraphs/captions (e.g. stray '.' under images)."""
    if not html:
        return ""
    html = re.sub(r"(?is)<script.*?</script>", "", html)
    html = re.sub(r"(?is)<style.*?</style>", "", html)
    html = re.sub(r"(?is)<iframe.*?</iframe>", "", html)
    html = re.sub(r'(?i)\son\w+\s*=\s*"[^"]*"', "", html)
    html = re.sub(r"(?i)\son\w+\s*=\s*'[^']*'", "", html)
    html = re.sub(r"(?is)<figcaption[^>]*>\s*(&nbsp;|\.|\s)*\s*</figcaption>", "", html)
    html = re.sub(r"(?is)<p[^>]*>\s*(<strong>|<em>|<b>|<i>)?\s*(&nbsp;|\.|\s)*\s*(</strong>|</em>|</b>|</i>)?\s*</p>", "", html)
    return html.strip()

def truncate(text, limit=280):
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
    """Fetch posts from Substack API with full post content."""
    print(f"Trying Substack API: {API_URL}")

    try:
        data = fetch_json(API_URL)
    except Exception as direct_error:
        print(f"Direct Substack API failed: {direct_error}")
        print("Trying Substack API via Jina...")
        data = fetch_jina_json(API_URL)

    if not isinstance(data, list):
        print("API returned non-list response")
        return None

    if not data:
        print("API returned empty post list")
        return None

    print(f"API returned {len(data)} archive items.")

    posts = []

    for item in data:
        try:
            post_id = item.get("id")
            title = (item.get("title") or "").strip()
            link = (item.get("canonical_url") or "").strip()

            if not post_id or not title or not link:
                print("  SKIP: API item missing id, title, or link")
                return None

            detail_url = f"{PUB_URL}/api/v1/posts/by-id/{post_id}"

            print(f"  Fetching full content for post {post_id}")

            try:
              detail = fetch_json(detail_url)
            except Exception as direct_error:
                   print(f"  Direct post API failed: {direct_error}")
                   print("  Trying post API via Jina...")
                   detail = fetch_jina_json(detail_url)

            if not isinstance(detail, dict):
                print(f"  Invalid detail response for: {title}")
                return None

            post_detail = detail.get("post")

            if not isinstance(post_detail, dict):
                print(f"  Missing post object for: {title}")
                return None

            content = sanitize_content(
                post_detail.get("body_html") or ""
            )

            if not content:
                print(f"  Missing full content for: {title}")
                return None

            title = (
                post_detail.get("title")
                or title
            ).strip()

            link = (
                post_detail.get("canonical_url")
                or link
            ).strip()

            pub_date = parse_api_date(
                post_detail.get("post_date")
                or item.get("post_date")
                or ""
            )

            description = truncate(
                strip_html(
                    post_detail.get("description")
                    or item.get("description")
                    or item.get("truncated_body_text")
                    or ""
                )
            )

            thumbnail = (
                post_detail.get("cover_image")
                or item.get("cover_image")
                or ""
            )

            if not thumbnail or not thumbnail.startswith("https://"):
                thumbnail = PLACEHOLDER_IMG

            posts.append({
                "title": title,
                "link": link,
                "pubDate": pub_date,
                "description": description,
                "thumbnail": thumbnail,
                "content": content,
            })

        except Exception as e:
            print(
                f"  SKIP (API item error): "
                f"{item.get('title', '?')} — {e}"
            )
            return None

    if len(posts) != len(data):
        print(
            f"API validation failed: "
            f"{len(posts)} of {len(data)} posts processed"
        )
        return None

    print(
        f"API validation passed: "
        f"{len(posts)} posts with full content"
    )

    return posts


def try_rss():
    """Fetch posts from RSS feed. Returns list of post dicts or None on failure."""
    cache_buster = str(int(time.time()))
    fresh_feed_url = FEED_URL + "?_cb=" + cache_buster
    proxies = [
        fresh_feed_url,
        "https://r.jina.ai/" + fresh_feed_url,
        "https://api.allorigins.win/raw?url=" + fresh_feed_url,
        "https://api.codetabs.com/v1/proxy?quest=" + fresh_feed_url,
    ]
    xml_data = None
    last_error = None

    for proxy_url in proxies:
        for attempt in range(1, 4):  # try each proxy up to 3 times
            try:
                print(f"Trying RSS via: {proxy_url} (attempt {attempt})")
                xml_data = fetch_xml(proxy_url)
                break
            except Exception as e:
                print(f"  Failed: {e}")
                last_error = e
                if attempt < 3:
                    time.sleep(6)
        if xml_data is not None:
            break

    if xml_data is None:
        raise last_error

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

            content = ""
            content_el = item.find(CONTENT_TAG)
            if content_el is not None and content_el.text:
                content = sanitize_content(content_el.text)

            if not thumbnail:
                for tag in [CONTENT_TAG, "description"]:
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
                "content": content,
            })
        except Exception as e:
            print(f"  SKIP (RSS item error): {item.findtext('title', '?')} — {e}")

    return posts


def main():
    existing_posts = []

    if os.path.exists(OUTPUT) and os.path.getsize(OUTPUT) > 10:
        try:
            with open(OUTPUT, "r", encoding="utf-8") as f:
                existing_data = json.load(f)

            if isinstance(existing_data, list):
                existing_posts = existing_data

        except Exception as e:
            print(f"WARNING: Could not read existing posts.json: {e}")

    posts = None
    source = ""

    # ============================================================
    # PRIMARY SOURCE: SUBSTACK API
    # ============================================================

    try:
        posts = try_api()

        if posts is not None:
            source = "API"

    except Exception as e:
        print(f"Substack API failed: {e}")
        posts = None

    # ============================================================
    # FALLBACK SOURCE: RSS
    # ============================================================

    if posts is None:
        try:
            posts = try_rss()

            if posts is not None:
                source = "RSS"

        except Exception as e:
            print(f"RSS failed after all proxy retries: {e}")
            posts = None

    # ============================================================
    # FAILURE PROTECTION
    # ============================================================

    if posts is None:
        if existing_posts:
            print(
                "All sources failed. "
                "Existing posts.json is intact. "
                "Keeping last good data."
            )
            sys.exit(0)

        print(
            "ERROR: All Substack sources failed and "
            "no existing posts.json was found."
        )
        sys.exit(1)

    # ============================================================
    # WRITE SUCCESSFUL RESULT
    # ============================================================

    # The API has been fully validated before returning.
    # Therefore the API result is authoritative:
    # - New posts are added.
    # - Edited posts are updated.
    # - Deleted posts disappear from the website.
    #
    # RSS is only a fallback. If RSS is used, we do not remove
    # existing posts because a proxy/RSS response could be incomplete.

    if source == "API":
        posts.sort(
            key=lambda p: p["pubDate"],
            reverse=True,
        )

        final_posts = posts

        print("API synchronization accepted.")
        print("Deletion sync: ENABLED")

    else:
        existing_by_link = {
            p.get("link"): p
            for p in existing_posts
            if p.get("link")
        }

        for post in posts:
            link = post.get("link")

            if link:
                existing_by_link[link] = post

        final_posts = list(existing_by_link.values())

        final_posts.sort(
            key=lambda p: p["pubDate"],
            reverse=True,
        )

        print("RSS fallback synchronization accepted.")
        print("Deletion sync: DISABLED")

    # ============================================================
    # WRITE DATA
    # ============================================================

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(
            final_posts,
            f,
            ensure_ascii=False,
            indent=2,
        )

    feed_count = len(posts)
    stored_count = len(final_posts)

    with_content = sum(
        1
        for p in final_posts
        if p.get("content")
    )

    print()
    print("========================================")
    print(f"Source: {source}")
    print(f"Fetched: {feed_count}")
    print(f"Total stored: {stored_count}")
    print(f"Full content: {with_content}/{stored_count}")

    if source == "API":
        print("Deletion sync: ENABLED")
    else:
        print("Deletion sync: DISABLED (RSS fallback)")

    print("Existing data protected on failure.")
    print("========================================")


if __name__ == "__main__":
    main()
