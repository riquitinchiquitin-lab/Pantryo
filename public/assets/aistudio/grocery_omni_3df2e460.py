#!/usr/bin/env python3
"""
===============================================================================
Omni-Canada Grocery Vision Dataset Harvester (Pantryo)
===============================================================================

Purpose:
    Industrial-grade product image and metadata harvester spanning Canada's
    major grocery banners and store brands. Built for training edge computer vision
    models (PyTorch / ONNX).

Supported Stores & Sources:
    1. superc        : Super C (Quebec discount banner, Metro CDN)
    2. loblaws       : Loblaws (National full-service banner, PC assets)
    3. tnt           : T&T Supermarket (Asian imports & T&T private labels)
    4. voila         : Voilà by Sobeys / IGA (Compliments, Farm Boy, Panache)
    5. saveonfoods   : Save-On-Foods (Western Canada / Western Family)
    6. openfoodfacts : Canadian packaged brands API (Selection, PC, No Name, Québon)

Key Engineering Features:
    • Browser Session Fetching: Uses Playwright's `page.request.get` to bypass
      Cloudflare/Akamai 403 blocks with native session cookies.
    • Image Integrity Verification: Verifies byte payloads with PIL to eliminate
      corrupted downloads, empty SVGs, and low-res thumbnails (< 150x150).
    • Bilingual Metadata Export: Outputs `metadata_master.csv` with standard labels,
      category hierarchies, and store origins.

Requirements:
    pip install playwright requests tqdm pillow
    python -m playwright install chromium

Usage:
    # 1. Harvest a specific banner (e.g. Super C):
    python download_all_canadian_groceries.py --source superc --output_dir "C:\\DonneesEpicerie" --limit_per_category 30

    # 2. Harvest all Canadian chains sequentially:
    python download_all_canadian_groceries.py --source all --output_dir "C:\\DonneesEpicerie" --limit_per_category 25

    # 3. Direct bulk download of Canadian store brands via Open Food Facts:
    python download_all_canadian_groceries.py --source openfoodfacts --output_dir "C:\\DonneesEpicerie" --limit_per_category 50
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import sys
import time
import urllib.request
from pathlib import Path
from typing import Dict, List, Set
from urllib.parse import quote_plus

try:
    from PIL import Image as PILImage
except ImportError:
    PILImage = None

# =============================================================================
# AISLE & BANNER CONFIGURATIONS
# =============================================================================

STORES_CONFIG = {
    "superc": {
        "name": "Super C",
        "home": "https://www.superc.ca/en",
        "referer": "https://www.superc.ca/",
        "aisles": [
            ("fruits-vegetables", "Fruits & Vegetables", "Fruits et légumes", "https://www.superc.ca/en/aisles/fruits-vegetables"),
            ("dairy-eggs", "Dairy & Eggs", "Produits laitiers et œufs", "https://www.superc.ca/en/aisles/dairy-eggs"),
            ("meat-poultry", "Meat & Poultry", "Viandes et volailles", "https://www.superc.ca/en/aisles/meat-poultry"),
            ("pantry", "Pantry Staples", "Garde-manger", "https://www.superc.ca/en/aisles/pantry"),
            ("frozen", "Frozen Foods", "Surgelés", "https://www.superc.ca/en/aisles/frozen"),
            ("bakery", "Bakery", "Boulangerie", "https://www.superc.ca/en/aisles/bakery"),
            ("beverages", "Beverages", "Boissons", "https://www.superc.ca/en/aisles/beverages"),
            ("snacks", "Snacks", "Collations", "https://www.superc.ca/en/aisles/snacks"),
        ],
    },
    "loblaws": {
        "name": "Loblaws",
        "home": "https://www.loblaws.ca/en",
        "referer": "https://www.loblaws.ca/",
        "aisles": [
            ("fruits-vegetables", "Fruits & Vegetables", "Fruits et légumes", "https://www.loblaws.ca/en/food/fruits-vegetables/c/28000"),
            ("dairy-eggs", "Dairy & Eggs", "Produits laitiers et œufs", "https://www.loblaws.ca/en/food/dairy-eggs/c/28003"),
            ("meat-poultry", "Meat & Poultry", "Viandes et volailles", "https://www.loblaws.ca/en/food/meat/c/28001"),
            ("pantry", "Pantry Staples", "Garde-manger", "https://www.loblaws.ca/en/food/pantry/c/28006"),
            ("frozen", "Frozen Foods", "Surgelés", "https://www.loblaws.ca/en/food/frozen/c/28005"),
            ("bakery", "Bakery", "Boulangerie", "https://www.loblaws.ca/en/food/bakery/c/28004"),
            ("beverages", "Beverages", "Boissons", "https://www.loblaws.ca/en/food/drinks/c/28002"),
            ("snacks", "Snacks", "Collations", "https://www.loblaws.ca/en/food/snacks-chips-candy/c/28007"),
        ],
    },
    "tnt": {
        "name": "T&T Supermarket",
        "home": "https://www.tntsupermarket.com/eng/",
        "referer": "https://www.tntsupermarket.com/",
        "aisles": [
            ("fruits-vegetables", "Fruits & Vegetables", "Fruits et légumes", "https://www.tntsupermarket.com/eng/fresh-frozen/fruits-vegetables.html"),
            ("meat-seafood", "Meat & Seafood", "Viandes et fruits de mer", "https://www.tntsupermarket.com/eng/fresh-frozen/meat.html"),
            ("dairy-eggs", "Dairy & Eggs", "Produits laitiers", "https://www.tntsupermarket.com/eng/fresh-frozen/dairy-eggs.html"),
            ("pantry", "Cooking & Sauces", "Sauces et garde-manger", "https://www.tntsupermarket.com/eng/food/cooking-sauces.html"),
            ("noodles-rice", "Noodles & Rice", "Nouilles et riz", "https://www.tntsupermarket.com/eng/food/rice-noodles.html"),
            ("frozen", "Frozen & Dim Sum", "Surgelés et Dim Sum", "https://www.tntsupermarket.com/eng/fresh-frozen/frozen-food.html"),
            ("snacks", "Snacks & Sweets", "Collations", "https://www.tntsupermarket.com/eng/food/snacks.html"),
            ("beverages", "Beverages & Tea", "Boissons et thé", "https://www.tntsupermarket.com/eng/food/beverages.html"),
        ],
    },
    "voila": {
        "name": "Voilà by Sobeys/IGA",
        "home": "https://voila.ca/",
        "referer": "https://voila.ca/",
        "aisles": [
            ("fruits-vegetables", "Fruits & Vegetables", "Fruits et légumes", "https://voila.ca/categories/fresh-fruits-vegetables/WEB1100606"),
            ("dairy-eggs", "Dairy & Eggs", "Produits laitiers et œufs", "https://voila.ca/categories/dairy-eggs/WEB1100608"),
            ("meat-poultry", "Meat & Poultry", "Viandes et volailles", "https://voila.ca/categories/meat-seafood/WEB1100607"),
            ("pantry", "Pantry Staples", "Garde-manger", "https://voila.ca/categories/pantry/WEB1100611"),
            ("frozen", "Frozen Foods", "Surgelés", "https://voila.ca/categories/frozen/WEB1100610"),
            ("bakery", "Bakery", "Boulangerie", "https://voila.ca/categories/bakery/WEB1100609"),
            ("beverages", "Beverages", "Boissons", "https://voila.ca/categories/beverages/WEB1100612"),
            ("snacks", "Snacks", "Collations", "https://voila.ca/categories/snacks/WEB1100613"),
        ],
    },
    "saveonfoods": {
        "name": "Save-On-Foods",
        "home": "https://www.saveonfoods.com/sm/pickup/rsid/2222/",
        "referer": "https://www.saveonfoods.com/",
        "aisles": [
            ("fruits-vegetables", "Fruits & Vegetables", "Fruits et légumes", "https://www.saveonfoods.com/sm/pickup/rsid/2222/categories/fruits-vegetables-id-30737"),
            ("dairy-eggs", "Dairy & Eggs", "Produits laitiers et œufs", "https://www.saveonfoods.com/sm/pickup/rsid/2222/categories/dairy-eggs-id-30740"),
            ("meat-seafood", "Meat & Seafood", "Viandes et fruits de mer", "https://www.saveonfoods.com/sm/pickup/rsid/2222/categories/meat-seafood-id-30739"),
            ("pantry", "Pantry & Packaged", "Garde-manger", "https://www.saveonfoods.com/sm/pickup/rsid/2222/categories/packaged-id-30738"),
            ("frozen", "Frozen Foods", "Surgelés", "https://www.saveonfoods.com/sm/pickup/rsid/2222/categories/frozen-id-30742"),
            ("bakery", "Bakery", "Boulangerie", "https://www.saveonfoods.com/sm/pickup/rsid/2222/categories/bakery-id-30741"),
            ("beverages", "Beverages", "Boissons", "https://www.saveonfoods.com/sm/pickup/rsid/2222/categories/beverages-id-30743"),
            ("snacks", "Snacks & Candy", "Collations", "https://www.saveonfoods.com/sm/pickup/rsid/2222/categories/snacks-candy-id-30744"),
        ],
    },
}

CANADIAN_BRANDS = [
    "President's Choice",
    "No Name",
    "Selection",
    "Irresistibles",
    "Compliments",
    "Panache",
    "Western Family",
    "Farm Boy",
    "T&T",
    "Rooster",
    "Québon",
    "Lactantia",
]

# =============================================================================
# HELPER UTILITIES
# =============================================================================

def sanitize_filename(name: str) -> str:
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    name = re.sub(r"\s+", "_", name.strip())
    return name[:75]


def sanitize_slug(cat: str) -> str:
    cat = re.sub(r'[\\/*?:"<>|]', "", cat)
    return cat.strip().replace(" & ", "_").replace(" ", "_").lower()


def is_valid_image(image_bytes: bytes, min_dim: int = 150) -> bool:
    """Validates that bytes represent a non-corrupt image above minimum dimensions."""
    if len(image_bytes) < 2048:
        return False
    if PILImage is None:
        return True
    try:
        with PILImage.open(io.BytesIO(image_bytes)) as img:
            img.verify()
        with PILImage.open(io.BytesIO(image_bytes)) as img:
            w, h = img.size
            return w >= min_dim and h >= min_dim
    except Exception:
        return False


# =============================================================================
# UNIVERSAL PLAYWRIGHT BROWSER SCRAPER
# =============================================================================

def harvest_banner_playwright(
    banner_key: str,
    output_dir: Path,
    limit_per_category: int = 30,
    headless: bool = False,
) -> List[Dict[str, str]]:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("[ERROR] Playwright is not installed.")
        print("Run: pip install playwright && python -m playwright install chromium")
        sys.exit(1)

    cfg = STORES_CONFIG[banner_key]
    banner_name = cfg["name"]

    print("\n" + "=" * 65)
    print(f"Launching Playwright for {banner_name}...")
    print(f"  Target: {cfg['home']}")
    print("=" * 65 + "\n")

    all_downloaded: List[Dict[str, str]] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=headless,
            args=["--disable-blink-features=AutomationControlled", "--start-maximized"],
        )
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport=None,
        )
        page = context.new_page()

        # Step 1: Open store homepage to establish cookies and bypass bot checks
        try:
            page.goto(cfg["home"], timeout=45000, wait_until="domcontentloaded")
            time.sleep(3.5)
        except Exception as e:
            print(f"Warning on initial load: {e}")

        # Universal prompt/dialogue dismissals
        for sel in [
            "#onetrust-accept-btn-handler",
            "button:has-text('Accept All')",
            "button:has-text('Accept')",
            "button:has-text('Accepter')",
            "button[aria-label='Close']",
            "button.close-modal",
            ".modal-popup .action-close",
            "#btn-cookie-allow",
        ]:
            try:
                btn = page.query_selector(sel)
                if btn and btn.is_visible():
                    btn.click()
                    time.sleep(0.8)
            except Exception:
                pass

        # Step 2: Iterate through aisles
        for slug, cat_en, cat_fr, url in cfg["aisles"]:
            print(f"\n📂 [{banner_name}] Scanning {cat_en} / {cat_fr} -> {url}")
            try:
                page.goto(url, timeout=45000, wait_until="domcontentloaded")
                time.sleep(3.0)
            except Exception as e:
                print(f"  Failed loading {url}: {e}. Skipping.")
                continue

            # Handle post-navigation modals
            try:
                close_btn = page.query_selector("#onetrust-accept-btn-handler, button[aria-label='Close']")
                if close_btn and close_btn.is_visible():
                    close_btn.click()
            except Exception:
                pass

            # Scroll progressively to force lazy-loading
            print("  Scrolling page down to trigger image fetches...")
            for s in range(6):
                page.evaluate("window.scrollBy(0, 900);")
                time.sleep(1.0)

            # Universal DOM extraction script covering all banner card structures
            products_data = page.evaluate("""() => {
                const results = [];
                // Target all known product card selectors across chains
                const selectors = [
                    '.default-product-tile', '.product-tile', '.default-product-card',
                    '[data-testid="product-grid-item"]', '[data-testid="product-tile"]',
                    '.product-item', '.item.product',
                    '[data-testid="ProductCard"]', '.ProductCard',
                    'article[data-component="ProductTile"]'
                ];
                
                const cards = document.querySelectorAll(selectors.join(', '));

                cards.forEach(card => {
                    let title = '';
                    const titleEl = card.querySelector(
                        '[data-testid="product-title"], .product-item-name, .default-product-tile__title, h2, h3, a[href*="/p/"], a.product-item-link'
                    );
                    if (titleEl) {
                        title = (titleEl.innerText || titleEl.getAttribute('title') || '').trim();
                    }

                    let imgUrl = '';
                    const imgEl = card.querySelector('img');
                    if (imgEl) {
                        imgUrl = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '';
                        const srcset = imgEl.getAttribute('srcset') || imgEl.getAttribute('data-srcset');
                        if (srcset) {
                            const parts = srcset.split(',');
                            const best = parts[parts.length - 1].trim().split(' ')[0];
                            if (best) imgUrl = best;
                        }
                    }

                    if (title && imgUrl && !imgUrl.includes('placeholder') && !imgUrl.startsWith('data:image')) {
                        if (imgUrl.startsWith('//')) {
                            imgUrl = 'https:' + imgUrl;
                        }
                        results.push({ title, imgUrl });
                    }
                });

                return results;
            }""")

            print(f"  Detected {len(products_data)} items in {cat_en}.")

            category_dir = output_dir / banner_key / slug
            category_dir.mkdir(parents=True, exist_ok=True)

            downloaded_count = 0
            seen_urls: Set[str] = set()

            for item in products_data:
                if downloaded_count >= limit_per_category:
                    break

                raw_title = item.get("title", "").strip()
                img_url = item.get("imgUrl", "").strip()

                if not raw_title or not img_url or img_url in seen_urls:
                    continue
                seen_urls.add(img_url)

                safe_title = sanitize_filename(raw_title)
                save_file = category_dir / f"{safe_title}.jpg"

                try:
                    res = page.request.get(img_url, headers={"Referer": cfg["referer"]})
                    if res.status == 200:
                        raw_bytes = res.body()
                        if is_valid_image(raw_bytes, min_dim=150):
                            with open(save_file, "wb") as f:
                                f.write(raw_bytes)
                            downloaded_count += 1
                            all_downloaded.append({
                                "banner": banner_name,
                                "image_path": str(save_file.relative_to(output_dir)),
                                "name_en": raw_title,
                                "name_fr": "",
                                "category_en": cat_en,
                                "category_fr": cat_fr,
                                "category_slug": slug,
                                "source_url": img_url,
                            })
                except Exception:
                    pass

            print(f"  Saved {downloaded_count} verified images for {cat_en}!")
            time.sleep(1.2)

        browser.close()

    return all_downloaded


# =============================================================================
# OPEN FOOD FACTS CANADA HARVESTER (ALL STORE BRANDS)
# =============================================================================

def harvest_openfoodfacts_all(
    output_dir: Path,
    limit_per_category: int = 50,
) -> List[Dict[str, str]]:
    print("\n" + "=" * 65)
    print("Harvesting Canadian Grocery Store Brands via Open Food Facts...")
    print("=" * 65 + "\n")

    all_downloaded: List[Dict[str, str]] = []

    for brand in CANADIAN_BRANDS:
        brand_slug = sanitize_slug(brand)
        category_dir = output_dir / "brands" / brand_slug
        category_dir.mkdir(parents=True, exist_ok=True)

        print(f"Searching catalog for: {brand}...")
        api_url = (
            f"https://world.openfoodfacts.org/cgi/search.pl?"
            f"action=process&tagtype_0=countries&tag_contains_0=contains&tag_0=canada&"
            f"tagtype_1=brands&tag_contains_1=contains&tag_1={quote_plus(brand)}&"
            f"json=1&page_size={limit_per_category}"
        )

        req = urllib.request.Request(
            api_url,
            headers={"User-Agent": "PantryoCanadianGroceryHarvester/2.0 (contact@pantryo.app)"},
        )

        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"  API query failed for {brand}: {e}")
            continue

        products = data.get("products", [])
        print(f"  Found {len(products)} products with metadata.")

        downloaded_count = 0
        for p in products:
            if downloaded_count >= limit_per_category:
                break

            name_en = p.get("product_name_en") or p.get("product_name") or ""
            name_fr = p.get("product_name_fr") or ""
            primary_name = name_en or name_fr or p.get("generic_name") or ""
            img_url = p.get("image_front_url") or p.get("image_url")

            if not primary_name or not img_url:
                continue

            safe_name = sanitize_filename(primary_name)
            save_file = category_dir / f"{safe_name}.jpg"

            try:
                img_req = urllib.request.Request(
                    img_url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
                )
                with urllib.request.urlopen(img_req, timeout=15) as img_resp:
                    img_bytes = img_resp.read()
                    if is_valid_image(img_bytes, min_dim=150):
                        with open(save_file, "wb") as f:
                            f.write(img_bytes)
                        downloaded_count += 1
                        all_downloaded.append({
                            "banner": f"Store Brand ({brand})",
                            "image_path": str(save_file.relative_to(output_dir)),
                            "name_en": name_en.strip(),
                            "name_fr": name_fr.strip(),
                            "category_en": brand,
                            "category_fr": brand,
                            "category_slug": brand_slug,
                            "source_url": img_url,
                        })
            except Exception:
                pass

        print(f"  Saved {downloaded_count} verified images for {brand}!")
        time.sleep(0.8)

    return all_downloaded


# =============================================================================
# CLI ENTRY POINT
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Harvest grocery product images across Canadian supermarket chains."
    )
    parser.add_argument(
        "--source",
        choices=["superc", "loblaws", "tnt", "voila", "saveonfoods", "openfoodfacts", "all"],
        default="all",
        help="Store banner to harvest, or 'all' to cycle through every store.",
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="C:\\Users\\yan_b\\DonneesEpicerie",
        help="Destination directory for dataset storage.",
    )
    parser.add_argument(
        "--limit_per_category",
        type=int,
        default=30,
        help="Maximum images to retain per category per store.",
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        default=False,
        help="Run Playwright in headless mode (default: False for visual confirmation).",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 65)
    print(" Canadian Multi-Banner Vision Harvester")
    print(f" Selected Target : {args.source.upper()}")
    print(f" Target Directory: {output_dir}")
    print(f" Per Category    : {args.limit_per_category}")
    print("=" * 65)

    downloaded: List[Dict[str, str]] = []

    if args.source == "openfoodfacts":
        downloaded.extend(harvest_openfoodfacts_all(output_dir, args.limit_per_category))
    elif args.source == "all":
        for banner in ["superc", "loblaws", "tnt", "voila", "saveonfoods"]:
            downloaded.extend(
                harvest_banner_playwright(banner, output_dir, args.limit_per_category, args.headless)
            )
        downloaded.extend(harvest_openfoodfacts_all(output_dir, args.limit_per_category))
    else:
        downloaded.extend(
            harvest_banner_playwright(args.source, output_dir, args.limit_per_category, args.headless)
        )

    # Save comprehensive dataset CSV
    csv_path = output_dir / "metadata_master.csv"
    fieldnames = [
        "banner",
        "image_path",
        "name_en",
        "name_fr",
        "category_en",
        "category_fr",
        "category_slug",
        "source_url",
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(downloaded)

    print("\n" + "=" * 65)
    print(f"HARVEST COMPLETE: {len(downloaded)} total verified images saved.")
    print(f"  • Root Dataset Directory : {output_dir}")
    print(f"  • Master Metadata Index  : {csv_path}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()