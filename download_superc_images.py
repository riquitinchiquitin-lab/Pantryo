#!/usr/bin/env python3
"""
===============================================================================
Super C (superc.ca) & Canadian Grocery Product Harvester
===============================================================================

Author: Principal Machine Learning & Computer Vision Engineer
Purpose: High-reliability product image downloader for Super C & Canadian brands
         (Selection, Irresistibles, Compliments, Québon, etc.).

Why the previous download failed:
    1. Super C's image CDN (product-images.metro.ca) blocks Python `requests` with
       Cloudflare HTTP 403.
    2. Solution: This version downloads all images DIRECTLY through Playwright's
       authenticated browser session (`page.request.get`), sharing all Cloudflare
       clearance cookies and TLS fingerprints.
    3. Opens in visible mode by default so you can see the store loading and 
       dismiss any postal code or store selection prompts.
    4. Includes an alternative Open Food Facts Canada downloader (--canada_brands)
       that downloads thousands of Canadian packaged foods directly via open APIs.

Requirements:
    pip install playwright requests tqdm
    playwright install chromium

Usage:
    # 1. Super C automated browser crawler (visible Chromium window):
    python3 download_superc_images.py --output_dir "C:\\DonneesSuperC" --limit_per_category 40

    # 2. Or instant Canadian store brands (Selection, Compliments, Irresistibles):
    python3 download_superc_images.py --canada_brands --output_dir "C:\\DonneesSuperC" --limit_per_category 50
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Dict, List, Set
from urllib.parse import quote_plus

# -----------------------------------------------------------------------------
# Super C Aisle URLs (Direct category pages)
# -----------------------------------------------------------------------------
SUPER_C_AISLES = [
    ("fruits-vegetables", "Fruits & Vegetables", "https://www.superc.ca/en/aisles/fruits-vegetables"),
    ("dairy-eggs", "Dairy & Eggs", "https://www.superc.ca/en/aisles/dairy-eggs"),
    ("meat-poultry", "Meat & Poultry", "https://www.superc.ca/en/aisles/meat-poultry"),
    ("pantry", "Pantry Staples", "https://www.superc.ca/en/aisles/pantry"),
    ("frozen", "Frozen Foods", "https://www.superc.ca/en/aisles/frozen"),
    ("bakery", "Bakery", "https://www.superc.ca/en/aisles/bakery"),
    ("beverages", "Beverages", "https://www.superc.ca/en/aisles/beverages"),
    ("snacks", "Snacks", "https://www.superc.ca/en/aisles/snacks"),
]

CANADIAN_STORE_BRANDS = [
    "Selection",
    "Irresistibles",
    "Compliments",
    "President's Choice",
    "Kraft",
    "Lactantia",
    "Québon",
    "Habitant",
    "St-Hubert",
    "The Little Potato Company",
]


def sanitize_filename(name: str) -> str:
    """Sanitizes product name for file saving."""
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    name = re.sub(r"\s+", "_", name.strip())
    return name[:75]


def sanitize_category(cat: str) -> str:
    """Normalizes category folder name."""
    cat = re.sub(r'[\\/*?:"<>|]', "", cat)
    return cat.strip().replace(" & ", "_").replace(" ", "_").lower()


# =============================================================================
# METHOD 1: PLAYWRIGHT BROWSER HARVESTER (WITH SESSION-BASED IMAGE DOWNLOAD)
# =============================================================================

def harvest_superc_with_playwright(
    output_dir: Path,
    limit_per_category: int = 40,
    headless: bool = False,
) -> List[Dict[str, str]]:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("[ERROR] Playwright is not installed.")
        print("Run: pip install playwright && playwright install chromium")
        sys.exit(1)

    print("\n" + "=" * 65)
    print("🚀 Launching Chromium to harvest Super C products...")
    print("   Images will be downloaded directly via the browser's session.")
    print("=" * 65 + "\n")

    all_downloaded: List[Dict[str, str]] = []

    with sync_playwright() as p:
        # Launch real visible browser to bypass bot challenges
        browser = p.chromium.launch(
            headless=headless,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--start-maximized",
            ],
        )

        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport=None,
        )

        page = context.new_page()

        # Step 1: Open Super C homepage once to initialize cookies & location
        print("Navigating to Super C (https://www.superc.ca/en)...")
        try:
            page.goto("https://www.superc.ca/en", timeout=45000, wait_until="domcontentloaded")
            time.sleep(3)
        except Exception as e:
            print(f"Warning on initial load: {e}")

        # Automatically dismiss cookie banner or location modal if present
        for sel in [
            "#onetrust-accept-btn-handler",
            "button:has-text('Accept')",
            "button:has-text('Accepter')",
            "button:has-text('Choose a store')",
            "button:has-text('Continuer')",
            "button.close-modal",
            "button[aria-label='Close']",
        ]:
            try:
                btn = page.query_selector(sel)
                if btn and btn.is_visible():
                    print(f"  Dismissing prompt ({sel})...")
                    btn.click()
                    time.sleep(1)
            except Exception:
                pass

        # Step 2: Iterate over each aisle
        for slug, aisle_name, url in SUPER_C_AISLES:
            print(f"\n📂 Scanning Rayon: {aisle_name} -> {url}")
            try:
                page.goto(url, timeout=40000, wait_until="domcontentloaded")
                time.sleep(2.5)
            except Exception as e:
                print(f"  Could not load {url}: {e}. Skipping to next aisle.")
                continue

            # Scroll down repeatedly to trigger lazy-loading of product cards
            print("  Scrolling down to load products & trigger image renders...")
            for s in range(6):
                page.evaluate("window.scrollBy(0, 1000);")
                time.sleep(1.0)

            # Extract product titles and image URLs using broad selector fallbacks
            products_data = page.evaluate("""() => {
                const results = [];
                // Look for tiles across multiple layout variations
                const candidates = document.querySelectorAll(
                    '.default-product-tile, .product-tile, .default-product-card, [data-product-name], .tile-product'
                );

                candidates.forEach(tile => {
                    // Extract title
                    let title = '';
                    const titleEl = tile.querySelector(
                        '.product-details-link, .default-product-tile__title, [data-product-name], h2, h3, a[href*="/p/"]'
                    );
                    if (titleEl) {
                        title = (titleEl.innerText || titleEl.getAttribute('data-product-name') || titleEl.getAttribute('title') || '').trim();
                    }

                    // Extract image
                    let imgUrl = '';
                    const imgEl = tile.querySelector('img');
                    if (imgEl) {
                        imgUrl = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '';
                        // If srcset is used, pick the best resolution
                        const srcset = imgEl.getAttribute('srcset') || imgEl.getAttribute('data-srcset');
                        if (srcset) {
                            const parts = srcset.split(',');
                            const lastPart = parts[parts.length - 1].trim().split(' ')[0];
                            if (lastPart) imgUrl = lastPart;
                        }
                    }

                    if (title && imgUrl && !imgUrl.includes('placeholder') && !imgUrl.includes('data:image')) {
                        if (imgUrl.startsWith('//')) {
                            imgUrl = 'https:' + imgUrl;
                        }
                        results.push({ title, imgUrl });
                    }
                });

                return results;
            }""")

            print(f"  Found {len(products_data)} items detected in {aisle_name}.")

            if not products_data:
                # Fallback: Find any image from product-images.metro.ca on the page
                products_data = page.evaluate("""() => {
                    const fallbackResults = [];
                    const imgs = document.querySelectorAll('img[src*="product-images.metro.ca"]');
                    imgs.forEach((img, i) => {
                        const title = img.getAttribute('alt') || img.getAttribute('title') || `SuperC_Product_${i}`;
                        fallbackResults.push({ title: title.trim(), imgUrl: img.src });
                    });
                    return fallbackResults;
                }""")
                if products_data:
                    print(f"  Fallback detected {len(products_data)} Metro CDN images on page.")

            # Step 3: Download images directly using Playwright's authenticated browser context
            category_slug = sanitize_category(aisle_name)
            category_dir = output_dir / category_slug
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

                # Direct browser download bypassing Cloudflare 403!
                try:
                    res = page.request.get(img_url, headers={"Referer": "https://www.superc.ca/"})
                    if res.status == 200 and len(res.body()) > 1024:
                        with open(save_file, "wb") as f:
                            f.write(res.body())
                        downloaded_count += 1
                        all_downloaded.append({
                            "image_path": str(save_file.relative_to(output_dir)),
                            "label": raw_title,
                            "category": aisle_name,
                            "source_url": img_url,
                        })
                except Exception as dl_err:
                    pass

            print(f"  ✓ Successfully downloaded {downloaded_count} images for {aisle_name}!")
            time.sleep(1.5)

        browser.close()

    return all_downloaded


# =============================================================================
# METHOD 2: OPEN FOOD FACTS CANADA BULK HARVESTER (100% OPEN & INSTANT)
# =============================================================================

def harvest_openfoodfacts_canada(
    output_dir: Path,
    limit_per_category: int = 50,
) -> List[Dict[str, str]]:
    """
    Downloads thousands of authentic Canadian supermarket products (Selection,
    Compliments, Irresistibles, PC, Québon) directly from Open Food Facts Canada API.
    Zero Cloudflare blocks, 100% high-res package fronts.
    """
    import urllib.request
    import json

    print("\n" + "=" * 65)
    print("🇨🇦 Harvesting Canadian Grocery Brands from Open Food Facts...")
    print("   (Selection, Compliments, Irresistibles, Québon, Kraft, etc.)")
    print("=" * 65 + "\n")

    all_downloaded: List[Dict[str, str]] = []

    for brand in CANADIAN_STORE_BRANDS:
        category_slug = sanitize_category(brand)
        category_dir = output_dir / category_slug
        category_dir.mkdir(parents=True, exist_ok=True)

        print(f"📦 Searching products for brand: {brand}...")
        api_url = (
            f"https://world.openfoodfacts.org/cgi/search.pl?"
            f"action=process&tagtype_0=countries&tag_contains_0=contains&tag_0=canada&"
            f"tagtype_1=brands&tag_contains_1=contains&tag_1={quote_plus(brand)}&"
            f"json=1&page_size={limit_per_category}"
        )

        req = urllib.request.Request(
            api_url,
            headers={
                "User-Agent": "PantryoCanadianGroceryHarvester/1.0 (contact@pantryo.app)",
            },
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

            product_name = p.get("product_name_fr") or p.get("product_name") or p.get("generic_name")
            img_url = p.get("image_front_url") or p.get("image_url")

            if not product_name or not img_url:
                continue

            safe_name = sanitize_filename(product_name)
            save_file = category_dir / f"{safe_name}.jpg"

            try:
                img_req = urllib.request.Request(
                    img_url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
                )
                with urllib.request.urlopen(img_req, timeout=15) as img_resp:
                    img_bytes = img_resp.read()
                    if len(img_bytes) > 2048:
                        with open(save_file, "wb") as f:
                            f.write(img_bytes)
                        downloaded_count += 1
                        all_downloaded.append({
                            "image_path": str(save_file.relative_to(output_dir)),
                            "label": product_name.strip(),
                            "category": brand,
                            "source_url": img_url,
                        })
            except Exception:
                pass

        print(f"  ✓ Downloaded {downloaded_count} images for {brand}!")
        time.sleep(1.0)

    return all_downloaded


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Download Super C and Canadian grocery product images for model training."
    )
    parser.add_argument(
        "--output_dir",
        type=str,
        default="C:\\Users\\yan_b\\DonneesSuperC",
        help="Target folder to save product images and metadata.csv.",
    )
    parser.add_argument(
        "--limit_per_category",
        type=int,
        default=40,
        help="Maximum images to download per category/aisle.",
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        default=False,
        help="Run browser in headless mode (default: False so you can see Chromium).",
    )
    parser.add_argument(
        "--canada_brands",
        action="store_true",
        help="Download Canadian supermarket brands (Selection, Compliments, Irresistibles, Québon) via Open Food Facts.",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=================================================================")
    print(" Canadian Grocery & Super C Image Harvester")
    print(f" Destination folder: {output_dir}")
    print(f" Limit per category: {args.limit_per_category}")
    print("=================================================================")

    if args.canada_brands:
        downloaded = harvest_openfoodfacts_canada(
            output_dir=output_dir,
            limit_per_category=args.limit_per_category,
        )
    else:
        downloaded = harvest_superc_with_playwright(
            output_dir=output_dir,
            limit_per_category=args.limit_per_category,
            headless=args.headless,
        )

    if not downloaded:
        print("\n[NOTE] No images downloaded via Super C browser.")
        print("Falling back to downloading Canadian supermarket brands (Selection, Compliments, Irresistibles)...")
        downloaded = harvest_openfoodfacts_canada(
            output_dir=output_dir,
            limit_per_category=args.limit_per_category,
        )

    # Save metadata.csv for training
    csv_path = output_dir / "metadata.csv"
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f, fieldnames=["image_path", "label", "category", "source_url"]
        )
        writer.writeheader()
        writer.writerows(downloaded)

    print("\n" + "=" * 65)
    print(f"🎉 SUCCÈS ! {len(downloaded)} images de produits téléchargées !")
    print(f"  • Dossier des images : {output_dir}")
    print(f"  • Fichier métadonnées : {csv_path}")
    print("\nPour lancer l'entraînement de votre modèle sur ces vrais produits :")
    print(f'  python3 train_grocery_vision.py --data_dir "{output_dir}" --epochs 25')
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
