/**
 * Package Training & Custom Recognition Memory Service
 * 
 * Allows users to train the app on custom packages, boxes, bags, cans, jars, and cartons
 * while seamlessly falling back to the 5-region preloaded global catalog (North America,
 * South America, China, Japan, Philippines).
 */

import {
  ContainerType,
  PackageRegion,
  GlobalPackageItem,
  GLOBAL_PACKAGE_CATALOG,
  findGlobalPackageByTokens,
  getRegionBadge,
  getContainerTypeInfo,
  normalizePackageText,
} from './globalPackageCatalog';

export interface TrainedPackage {
  id: string;
  region: PackageRegion;
  brand: string;
  nameFr: string;
  nameEn: string;
  originalScript?: string;
  romanization?: string;
  containerType: ContainerType;
  standardNetQuantity: string;
  category: string;
  categoryEn: string;
  defaultLocation: 'Pantry' | 'Fridge' | 'Freezer';
  shelfLifeDays: number;
  monthsFrozenShelfLife?: number;
  keywords: string[];
  barcode?: string;
  samplePhoto?: string;
  dateTrained: string;
  timesRecognized: number;
  notes?: string;
}

export interface PackageMatchResult {
  matched: boolean;
  sourceMethod: 'custom_trained' | 'global_catalog' | 'multimodal_vision';
  sourceLabel: string;
  confidence: number;
  id?: string;
  region: PackageRegion;
  regionBadge: { flag: string; label: string };
  containerType: ContainerType;
  containerBadge: { icon: string; label: string; short: string };
  brand: string;
  name: string;
  nameFr: string;
  nameEn: string;
  originalScript?: string;
  romanization?: string;
  displaySubtitle?: string; // e.g. "老干妈 香辣脆油辣椒 • Lǎo Gān Mā" or "Harina P.A.N. Blanca"
  standardNetQuantity: string;
  category: string;
  categoryEn: string;
  defaultLocation: 'Pantry' | 'Fridge' | 'Freezer';
  shelfLifeDays: number;
  monthsFrozenShelfLife: number;
  storageTip?: string;
  barcode?: string;
}

const STORAGE_KEY = 'pantryo_custom_packages_v1';

/**
 * Retrieves all user-trained packages from localStorage
 */
export function getTrainedPackages(): TrainedPackage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[PackageTrainingService] Error reading custom training memory:', err);
    return [];
  }
}

/**
 * Saves or updates a custom trained package in localStorage
 */
export function saveTrainedPackage(item: Omit<TrainedPackage, 'id' | 'dateTrained' | 'timesRecognized'> & { id?: string }): TrainedPackage {
  const current = getTrainedPackages();
  const id = item.id || `trained_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const existingIndex = current.findIndex((p) => p.id === id);

  const trained: TrainedPackage = {
    ...item,
    id,
    dateTrained: existingIndex >= 0 ? current[existingIndex].dateTrained : new Date().toISOString(),
    timesRecognized: existingIndex >= 0 ? current[existingIndex].timesRecognized : 0,
    keywords: Array.from(new Set([
      ...item.keywords,
      ...normalizePackageText(item.brand).split(' '),
      ...normalizePackageText(item.nameFr).split(' '),
      ...normalizePackageText(item.nameEn).split(' '),
      ...(item.romanization ? normalizePackageText(item.romanization).split(' ') : []),
    ])).filter((k) => k.length >= 2),
  };

  let updatedList: TrainedPackage[];
  if (existingIndex >= 0) {
    updatedList = [...current];
    updatedList[existingIndex] = trained;
  } else {
    updatedList = [trained, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.error('[PackageTrainingService] Failed to save trained package:', err);
  }

  return trained;
}

/**
 * Deletes a trained package by ID
 */
export function deleteTrainedPackage(id: string): boolean {
  const current = getTrainedPackages();
  const filtered = current.filter((p) => p.id !== id);
  if (filtered.length === current.length) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('[PackageTrainingService] Failed to delete trained package:', err);
    return false;
  }
}

/**
 * Increments the recognition counter for an item
 */
export function incrementRecognizedCount(id: string): void {
  const current = getTrainedPackages();
  const item = current.find((p) => p.id === id);
  if (item) {
    item.timesRecognized = (item.timesRecognized || 0) + 1;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (_) {}
  }
}

/**
 * Exports all custom trained packages as a JSON string
 */
export function exportTrainingData(): string {
  const items = getTrainedPackages();
  return JSON.stringify({
    version: '1.0',
    exportDate: new Date().toISOString(),
    count: items.length,
    packages: items,
  }, null, 2);
}

/**
 * Imports custom trained packages from a JSON string
 */
export function importTrainingData(jsonStr: string): { success: boolean; importedCount: number } {
  try {
    const data = JSON.parse(jsonStr);
    const packagesToImport: TrainedPackage[] = Array.isArray(data) ? data : data.packages;
    if (!Array.isArray(packagesToImport)) return { success: false, importedCount: 0 };

    const current = getTrainedPackages();
    const existingMap = new Map(current.map((p) => [p.id, p]));

    for (const pkg of packagesToImport) {
      if (pkg.nameFr || pkg.nameEn) {
        existingMap.set(pkg.id || `imported_${Date.now()}`, pkg);
      }
    }

    const merged = Array.from(existingMap.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return { success: true, importedCount: packagesToImport.length };
  } catch (e) {
    console.error('[PackageTrainingService] Import failed:', e);
    return { success: false, importedCount: 0 };
  }
}

/**
 * High-performance hybrid package matcher:
 * Priority 1: User's custom trained packages (personal memory)
 * Priority 2: Preloaded 5-region global catalog (North America, South America, China, Japan, Philippines)
 */
export function matchPackage(params: {
  rawText?: string;
  barcode?: string;
  lang?: 'FR' | 'EN';
}): PackageMatchResult | null {
  const { rawText = '', barcode, lang = 'FR' } = params;
  const isFr = lang === 'FR';

  // 1. Check custom trained memory by Barcode
  const customItems = getTrainedPackages();
  if (barcode && barcode.length >= 6) {
    const matchedCustom = customItems.find((p) => p.barcode && p.barcode.replace(/[^0-9]/g, '') === barcode.replace(/[^0-9]/g, ''));
    if (matchedCustom) {
      incrementRecognizedCount(matchedCustom.id);
      return formatResult(matchedCustom, 'custom_trained', 0.99, isFr);
    }
  }

  // 2. Check custom trained memory by Text / OCR Tokens
  if (rawText && rawText.trim().length >= 2) {
    const normalizedInput = normalizePackageText(rawText);
    const inputTokens = normalizedInput.split(' ').filter((t) => t.length >= 2);

    let bestCustom: TrainedPackage | null = null;
    let highestCustomScore = 0;

    for (const item of customItems) {
      let score = 0;
      const normBrand = normalizePackageText(item.brand);
      const normNameFr = normalizePackageText(item.nameFr);
      const normNameEn = normalizePackageText(item.nameEn);

      if (inputTokens.some((tok) => normBrand.includes(tok) && tok.length >= 3)) {
        score += 45;
      }

      for (const tok of inputTokens) {
        if (normNameFr.includes(tok)) score += 20;
        if (normNameEn.includes(tok)) score += 20;
        if (item.keywords.some((kw) => kw.includes(tok) || tok.includes(kw))) score += 12;
      }

      if (item.originalScript && rawText.includes(item.originalScript.slice(0, 3))) {
        score += 70;
      }

      if (item.romanization) {
        const normRom = normalizePackageText(item.romanization);
        if (inputTokens.some((tok) => normRom.includes(tok))) score += 25;
      }

      if (score > highestCustomScore && score >= 30) {
        highestCustomScore = score;
        bestCustom = item;
      }
    }

    if (bestCustom) {
      incrementRecognizedCount(bestCustom.id);
      return formatResult(bestCustom, 'custom_trained', 0.98, isFr);
    }
  }

  // 3. Fallback to Preloaded Global Catalog (5 Regions)
  if (rawText && rawText.trim().length >= 2) {
    const globalMatch = findGlobalPackageByTokens(rawText);
    if (globalMatch && globalMatch.score >= 25) {
      return formatResult(globalMatch.item, 'global_catalog', 0.94, isFr);
    }
  }

  return null;
}

/**
 * Formats match result into a rich, display-ready data object
 */
function formatResult(
  item: GlobalPackageItem | TrainedPackage,
  source: 'custom_trained' | 'global_catalog',
  confidence: number,
  isFr: boolean
): PackageMatchResult {
  const containerBadge = getContainerTypeInfo(item.containerType, isFr ? 'FR' : 'EN');
  const regionBadge = getRegionBadge(item.region, isFr ? 'FR' : 'EN');

  let displaySubtitle = '';
  if (item.originalScript && item.romanization) {
    displaySubtitle = `${item.originalScript} • ${item.romanization}`;
  } else if (item.originalScript) {
    displaySubtitle = item.originalScript;
  } else if (item.romanization) {
    displaySubtitle = item.romanization;
  } else if (item.brand) {
    displaySubtitle = item.brand;
  }

  const sourceLabel = source === 'custom_trained'
    ? (isFr ? '✨ Mémorisé dans vos paquets entraînés' : '✨ Custom trained package memory')
    : (isFr ? `Catalogue mondial (${regionBadge.label})` : `Global catalog (${regionBadge.label})`);

  return {
    matched: true,
    sourceMethod: source,
    sourceLabel,
    confidence,
    id: item.id,
    region: item.region,
    regionBadge,
    containerType: item.containerType,
    containerBadge,
    brand: item.brand,
    name: isFr ? item.nameFr : item.nameEn,
    nameFr: item.nameFr,
    nameEn: item.nameEn,
    originalScript: item.originalScript,
    romanization: item.romanization,
    displaySubtitle,
    standardNetQuantity: item.standardNetQuantity,
    category: isFr ? item.category : item.categoryEn,
    categoryEn: item.categoryEn,
    defaultLocation: item.defaultLocation,
    shelfLifeDays: item.shelfLifeDays,
    monthsFrozenShelfLife: item.monthsFrozenShelfLife || 6,
    storageTip: isFr
      ? (('storageTipFr' in item && item.storageTipFr) || ('storageTip' in item ? item.storageTip : undefined))
      : ('storageTip' in item ? item.storageTip : undefined),
    barcode: 'barcode' in item ? item.barcode : ('barcodes' in item && Array.isArray(item.barcodes) ? item.barcodes[0] : undefined),
  };
}
