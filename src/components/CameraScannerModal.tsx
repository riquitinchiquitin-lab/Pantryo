import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  Plus,
  FileText,
  Barcode,
  Search,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Trash2,
  Sparkle,
  ArrowRight,
  ChefHat,
  ShoppingBag,
  Tag,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { ScannedItemCandidate, InventoryItem } from '../types';
import { FoodVisualBadge } from './FoodVisualBadge';
import { useLanguage, getCategoryLocalizedName, getLocationLocalizedName } from '../utils/i18n';
import {
  classifyProduceOnDevice,
  ProduceClassificationResult,
  PRODUCE_MAPPING,
} from '../services/onDeviceProduceVision';
import {
  CANADIAN_FLYER_BANNERS,
  CanadianFlyerBanner,
  svgToDataUrl,
} from '../data/canadianFlyersData';
import {
  getBilingualNames,
  translateFoodItem,
  getItemDisplayName,
  formatLocalizedQuantityUnit,
  getLocalizedBadge,
  getLocalizedPackaging,
  getLocalizedStorageTip,
  getLocalizedOrigin,
  isTextFrench,
} from '../utils/foodTranslator';

/**
 * Optical Barcode Detector helper
 * Attempts native BarcodeDetector API in modern mobile/desktop browsers
 */
async function detectBarcodeFromImage(dataUrl: string): Promise<string | null> {
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
      });
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      const detected = await barcodeDetector.detect(img);
      if (detected && detected.length > 0 && detected[0].rawValue) {
        return detected[0].rawValue.replace(/[^0-9]/g, '');
      }
    } catch (e) {
      console.warn('BarcodeDetector error:', e);
    }
  }
  return null;
}

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: InventoryItem) => void;
  currentUser: { id: string; name: string };
  onOpenManualAdd?: () => void;
  initialMode?: 'snap' | 'flyer' | 'receipt' | 'barcode' | 'upload' | 'presets' | 'recipe' | 'produce';
}

interface SessionItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  locationName: string;
  categoryName: string;
  notes?: string;
  addedAt: string;
  brand?: string;
  price?: string;
  gradeOrigin?: string;
  packagingFormat?: string;
  dietaryBadges?: string[];
  netContent?: string;
  unopenedLocation?: string;
  openedLocation?: string;
  unopenedShelfLifeDays?: number;
  openedShelfLifeDays?: number;
  estimatedShelfLifeDays?: number;
  storageTip?: string;
  freezerTip?: string;
  storageReason?: string;
  imageUrl?: string;
  confidence?: number;
  identifiedMethod?: string;
  identifiedMethodLabel?: string;
}

interface SamplePresetItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  recommendedLocation: 'Fridge' | 'Pantry' | 'Freezer';
  shelfLife: number;
  price?: string;
  nameFr?: string;
  nameEn?: string;
}

interface SamplePreset {
  name: string;
  label: string;
  items: SamplePresetItem[];
}

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    name: 'Maxi Flyer Deals (Imbattable)',
    label: '🛒 Maxi — Yogourt Oikos, Iögo Club, Poulet & Beurre',
    items: [
      { name: 'Yogourt grec Oikos Danone (750 g)', category: 'Dairy & Eggs', quantity: 750, unit: 'g', recommendedLocation: 'Fridge' as const, shelfLife: 25, price: '$4.97' },
      { name: 'Yogourt brassé Iögo (16 x 100 g Format Club)', category: 'Dairy & Eggs', quantity: 16, unit: 'pot', recommendedLocation: 'Fridge' as const, shelfLife: 28, price: '$5.99' },
      { name: 'Poulet entier frais du Canada', category: 'Meat & Seafood', quantity: 1, unit: 'pack', recommendedLocation: 'Fridge' as const, shelfLife: 3, price: '$1.99 / lb ($4.39 / kg)' },
      { name: 'Pommes McIntosh du Québec (Sac 3 lb)', category: 'Produce', quantity: 3, unit: 'lb', recommendedLocation: 'Fridge' as const, shelfLife: 28, price: '$2.99' },
      { name: 'Beurre salé ou non salé Sans Nom (454 g)', category: 'Dairy & Eggs', quantity: 454, unit: 'g', recommendedLocation: 'Fridge' as const, shelfLife: 45, price: '$4.88' },
      { name: 'Pâtes alimentaires Catelli ou Primo (900 g)', category: 'Pantry Staples', quantity: 900, unit: 'g', recommendedLocation: 'Pantry' as const, shelfLife: 540, price: '4 pour $5.00' },
    ],
  },
  {
    name: 'Super C Flyer Deals (Beau, bon, pas cher)',
    label: '🛒 Super C — Yogourt Astro, Raisins, Porc & Cheddar',
    items: [
      { name: 'Yogourt Astro Original / Activia (750 g)', category: 'Dairy & Eggs', quantity: 750, unit: 'g', recommendedLocation: 'Fridge' as const, shelfLife: 25, price: '$3.99' },
      { name: 'Raisins rouges sans pépins', category: 'Produce', quantity: 1, unit: 'lb', recommendedLocation: 'Fridge' as const, shelfLife: 8, price: '$1.48 / lb ($3.26 / kg)' },
      { name: 'Filet de porc frais du Québec', category: 'Meat & Seafood', quantity: 1, unit: 'pack', recommendedLocation: 'Fridge' as const, shelfLife: 4, price: '$3.88 / lb ($8.55 / kg)' },
      { name: 'Fromage cheddar Black Diamond 400g', category: 'Dairy & Eggs', quantity: 400, unit: 'g', recommendedLocation: 'Fridge' as const, shelfLife: 60, price: '$4.44' },
      { name: 'Farine tout usage Five Roses 10kg', category: 'Pantry Staples', quantity: 10, unit: 'kg', recommendedLocation: 'Pantry' as const, shelfLife: 300, price: '$11.97' },
      { name: 'Jus pur à 100% Oasis 960 mL', category: 'Beverages', quantity: 960, unit: 'mL', recommendedLocation: 'Pantry' as const, shelfLife: 200, price: '$1.25' },
    ],
  },
  {
    name: 'No Frills Flyer Deals (Won’t Be Beat)',
    label: '🛒 No Frills — Yogourt Yoplait Tubes, Bœuf & Concombres',
    items: [
      { name: 'Yogourt en tubes Yoplait Tubes (8 x 60g)', category: 'Dairy & Eggs', quantity: 8, unit: 'tube', recommendedLocation: 'Fridge' as const, shelfLife: 25, price: '$2.49' },
      { name: 'Bœuf haché mi-maigre ou maigre Format Club', category: 'Meat & Seafood', quantity: 1, unit: 'pack', recommendedLocation: 'Fridge' as const, shelfLife: 2, price: '$3.88 / lb ($8.55 / kg)' },
      { name: 'Concombres anglais sans pépins', category: 'Produce', quantity: 1, unit: 'pcs', recommendedLocation: 'Fridge' as const, shelfLife: 7, price: '$0.88 ch.' },
      { name: 'Pain tranché blanc ou brun No Name (675 g)', category: 'Bakery', quantity: 1, unit: 'loaf', recommendedLocation: 'Pantry' as const, shelfLife: 8, price: '$1.99' },
      { name: 'Fromage en tranches Kraft Singles (410 g)', category: 'Dairy & Eggs', quantity: 410, unit: 'g', recommendedLocation: 'Fridge' as const, shelfLife: 90, price: '$3.49' },
    ],
  },
  {
    name: 'Metro Flyer Deals (Moi Rewards)',
    label: '🛒 Metro — Yogourt Liberté, Saumon frais & Fraises',
    items: [
      { name: 'Yogourt grec Liberté Méditerranée (500 g)', category: 'Dairy & Eggs', quantity: 500, unit: 'g', recommendedLocation: 'Fridge' as const, shelfLife: 21, price: '$4.29' },
      { name: 'Filets de saumon frais de l’Atlantique', category: 'Meat & Seafood', quantity: 1, unit: 'pack', recommendedLocation: 'Fridge' as const, shelfLife: 2, price: '$9.99 / lb ($22.02 / kg)' },
      { name: 'Fraises fraîches du Québec (1 lb)', category: 'Produce', quantity: 454, unit: 'g', recommendedLocation: 'Fridge' as const, shelfLife: 4, price: '$2.99' },
      { name: 'Lait Québon ou Natrel 2% (2 L)', category: 'Dairy & Eggs', quantity: 2, unit: 'L', recommendedLocation: 'Fridge' as const, shelfLife: 14, price: '$4.89' },
      { name: 'Pizza mince surgelée Irrésistibles (370 g)', category: 'Frozen Meals', quantity: 1, unit: 'pack', recommendedLocation: 'Freezer' as const, shelfLife: 180, price: '$3.99' },
    ],
  },
  {
    name: 'Walmart Canada Flyer Deals (Rollback)',
    label: '🛒 Walmart — Yogourt Great Value, Œufs 18 un. & Poulet',
    items: [
      { name: 'Yogourt grec Great Value (750 g)', category: 'Dairy & Eggs', quantity: 750, unit: 'g', recommendedLocation: 'Fridge' as const, shelfLife: 25, price: '$4.47' },
      { name: 'Œufs gros blancs calibre A Great Value (18 un.)', category: 'Dairy & Eggs', quantity: 18, unit: 'pcs', recommendedLocation: 'Fridge' as const, shelfLife: 30, price: '$4.98' },
      { name: 'Poitrines de poulet désossées sans peau', category: 'Meat & Seafood', quantity: 1, unit: 'pack', recommendedLocation: 'Fridge' as const, shelfLife: 3, price: '$4.97 / lb' },
      { name: 'Avocats Hass mûrs (Sac de 5 un.)', category: 'Produce', quantity: 5, unit: 'pcs', recommendedLocation: 'Pantry' as const, shelfLife: 5, price: '$2.97' },
    ],
  },
  {
    name: 'Fresh Vegetables & Produce',
    label: '🥦 Légumes Frais & Produits Maraîchers (Test IA)',
    items: [
      { name: 'Concombre anglais sans pépins', category: 'Produce', quantity: 1, unit: 'pcs', recommendedLocation: 'Fridge' as const, shelfLife: 8, price: '$0.99 ch.' },
      { name: 'Couronnes de brocoli du Québec', category: 'Produce', quantity: 1, unit: 'pcs', recommendedLocation: 'Fridge' as const, shelfLife: 6, price: '$0.99 ch.' },
      { name: 'Tomates de serre sur vigne', category: 'Produce', quantity: 1, unit: 'pack', recommendedLocation: 'Pantry' as const, shelfLife: 6, price: '$1.99 / lb' },
      { name: 'Poivrons doux 3 couleurs (Rouge/Jaune/Orange)', category: 'Produce', quantity: 3, unit: 'pcs', recommendedLocation: 'Fridge' as const, shelfLife: 10, price: '$2.99' },
      { name: 'Carottes fraîches du Québec (sac 3 lb)', category: 'Produce', quantity: 3, unit: 'lb', recommendedLocation: 'Fridge' as const, shelfLife: 25, price: '$2.49' },
      { name: 'Pommes de terre jaunes du Québec (sac 10 lb)', category: 'Produce', quantity: 10, unit: 'lb', recommendedLocation: 'Pantry' as const, shelfLife: 30, price: '$3.99' },
    ],
  },
  {
    name: 'Fresh Fruits & Tropical',
    label: '🥭 Mangue & Fruits Frais (Test IA)',
    items: [
      { name: 'Mangue fraîche (Tommy Atkins)', category: 'Produce', quantity: 1, unit: 'pcs', recommendedLocation: 'Pantry' as const, shelfLife: 7, price: '$1.49 ch.' },
      { name: 'Bananes jaunes fraîches', category: 'Produce', quantity: 1, unit: 'bunch', recommendedLocation: 'Pantry' as const, shelfLife: 5, price: '$0.79 / lb' },
      { name: 'Avocats Hass mûrs', category: 'Produce', quantity: 1, unit: 'pcs', recommendedLocation: 'Pantry' as const, shelfLife: 6, price: '$1.29 ch.' },
      { name: 'Pommes fraîches du Québec', category: 'Produce', quantity: 3, unit: 'lb', recommendedLocation: 'Fridge' as const, shelfLife: 28, price: '$3.99' },
      { name: 'Fraises fraîches du Québec', category: 'Produce', quantity: 454, unit: 'g', recommendedLocation: 'Fridge' as const, shelfLife: 4, price: '$3.49' },
    ],
  },
];

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onItemAdded,
  currentUser,
  onOpenManualAdd,
  initialMode = 'snap',
}) => {
  const { lang } = useLanguage();

  // Mode: 'photo' | 'produce' | 'flyer' | 'receipt' | 'barcode' | 'recipe'
  const [activeMode, setActiveMode] = useState<'photo' | 'produce' | 'flyer' | 'receipt' | 'barcode' | 'recipe'>('photo');

  // Background processing states
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [latestToast, setLatestToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isTrayExpanded, setIsTrayExpanded] = useState(false);

  // Produce Lens auxiliary inputs & live detections
  const [producePluInput, setProducePluInput] = useState('');
  const [detectedProduceResult, setDetectedProduceResult] = useState<ProduceClassificationResult | null>(null);

  // Barcode / Receipt auxiliary inputs
  const [upcInput, setUpcInput] = useState('');
  const [isLookingUpUpc, setIsLookingUpUpc] = useState(false);
  const [upcError, setUpcError] = useState<string | null>(null);
  const [receiptText, setReceiptText] = useState('');
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [selectedFlyerBannerId, setSelectedFlyerBannerId] = useState<'maxi' | 'super-c' | 'no-frills' | 'metro' | 'iga' | 'walmart'>('maxi');

  // Native hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Sync mode when opened
  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'produce') {
        setActiveMode('produce');
      } else if (initialMode === 'flyer') {
        setActiveMode('flyer');
      } else if (initialMode === 'receipt') {
        setActiveMode('receipt');
      } else if (initialMode === 'barcode') {
        setActiveMode('barcode');
      } else if (initialMode === 'recipe') {
        setActiveMode('recipe');
        setTimeout(() => cameraInputRef.current?.click(), 100);
      } else {
        setActiveMode('photo');
      }
      setLatestToast(null);
      setUpcInput('');
      setUpcError(null);
      setProducePluInput('');
      setDetectedProduceResult(null);
      setReceiptText('');
      setShowPresets(false);
    }
  }, [isOpen, initialMode]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info', duration = 4000) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setLatestToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setLatestToast(null);
    }, duration);
  };

  // Compress image client-side to keep uploads fast and light
  const compressFile = (file: File, maxDim = 1600): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
          } else {
            resolve(dataUrl);
          }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // State for inspecting extracted details & quick corrections
  const [inspectingItem, setInspectingItem] = useState<SessionItem | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customNameInput, setCustomNameInput] = useState('');

  // Canadian Food & PLU Database live search state
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [dbSearchResults, setDbSearchResults] = useState<any[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // Handle immediate item name and produce correction
  const handleCorrectItem = async (
    targetItem: SessionItem,
    newName: string,
    newCategory = 'Produce',
    newLocation = 'Pantry',
    newShelfLife = 7
  ) => {
    try {
      if (targetItem.id) {
        await fetch(`/api/v1/inventory/item/${targetItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName,
            categoryName: newCategory,
            locationName: newLocation,
            notes: `Corrigé manuellement : ${newName}`,
          }),
        });
      }

      const updated: SessionItem = {
        ...targetItem,
        name: newName,
        categoryName: newCategory,
        locationName: newLocation,
        unopenedLocation: newLocation,
        estimatedShelfLifeDays: newShelfLife,
      };

      setSessionItems((prev) => prev.map((it) => (it.id === targetItem.id ? updated : it)));
      if (inspectingItem && inspectingItem.id === targetItem.id) {
        setInspectingItem(updated);
      }
      setIsEditingName(false);
      setCustomNameInput('');
      showToast(
        lang === 'FR' ? `✓ Corrigé en : ${newName} (${newCategory})` : `✓ Corrected to: ${newName} (${newCategory})`,
        'success'
      );
    } catch (e) {
      console.warn('Failed to update item correction', e);
    }
  };

  // Save single candidate to backend API and notify parent
  const saveCandidateToInventory = async (candidate: ScannedItemCandidate): Promise<InventoryItem> => {
    const days = candidate.estimatedShelfLifeDays || 7;
    const exp = candidate.printedExpirationDate
      ? new Date(candidate.printedExpirationDate).toISOString()
      : candidate.suggestedExpirationDate
      ? new Date(candidate.suggestedExpirationDate).toISOString()
      : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const notes = [
      candidate.detectedText ? `OCR: "${candidate.detectedText}"` : null,
      candidate.price ? `Price: ${candidate.price}` : null,
      candidate.storageTip || candidate.storageReason,
    ]
      .filter(Boolean)
      .join(' • ') || (lang === 'FR' ? 'Ajouté par vision IA' : 'Added via Picture Vision');

    const biling = getBilingualNames(candidate.name, lang);
    let resolvedNameFr = (candidate as any).nameFr || biling.nameFr || candidate.name;
    let resolvedNameEn = (candidate as any).nameEn || biling.nameEn || candidate.name;

    if (resolvedNameEn && isTextFrench(resolvedNameEn)) {
      resolvedNameEn = translateFoodItem(resolvedNameEn, 'EN');
    }
    if (resolvedNameFr && !isTextFrench(resolvedNameFr)) {
      resolvedNameFr = translateFoodItem(resolvedNameFr, 'FR');
    }
    const chosenName = lang === 'FR' ? resolvedNameFr : resolvedNameEn;

    const payload = {
      name: chosenName,
      nameFr: resolvedNameFr,
      nameEn: resolvedNameEn,
      quantity: candidate.quantity || 1,
      unit: candidate.unit || 'pcs',
      locationName: candidate.recommendedLocation || 'Fridge',
      categoryName: candidate.category || 'Produce',
      expirationDate: exp,
      monthsFrozenShelfLife: candidate.monthsFrozenShelfLife || 6,
      notes,
      barcode: candidate.barcode || null,
      addedById: currentUser.id,
      brand: candidate.brand || null,
      gradeOrigin: candidate.gradeOrigin || null,
      packagingFormat: candidate.packagingFormat || null,
      dietaryBadges: candidate.dietaryBadges || null,
      netContent: candidate.netContent || null,
      unopenedLocation: candidate.unopenedLocation || null,
      openedLocation: candidate.openedLocation || null,
      unopenedShelfLifeDays: candidate.unopenedShelfLifeDays || null,
      openedShelfLifeDays: candidate.openedShelfLifeDays || null,
      storageTip: candidate.storageTip || null,
      freezerTip: candidate.freezerTip || null,
      storageReason: candidate.storageReason || null,
      imageUrl: candidate.imageUrl || null,
    };

    const res = await fetch('/api/v1/inventory/item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to save item');
    }

    return data.item;
  };

  // Universal Smart Auto-Camera: processes photo, filters noise, and chooses best method to ID
  const processPhotoInBackground = async (
    compressedDataUrl: string,
    isReceipt = false,
    isFlyer = false,
    isProduce = false
  ) => {
    setActiveJobsCount((prev) => prev + 1);
    showToast(
      lang === 'FR'
        ? '⚡ Analyse intelligente : détection du type d’aliment & sélection de la meilleure méthode...'
        : '⚡ Smart auto-scanning: detecting item type & choosing best method...',
      'info',
      8000
    );

    try {
      // 1. Parallel execution of Optical Barcode Detector, Produce Vision & Server Scan
      const barcodePromise = detectBarcodeFromImage(compressedDataUrl).catch(() => null);

      const onDevicePromise = (async () => {
        try {
          const img = new Image();
          img.src = compressedDataUrl;
          await new Promise((r) => { img.onload = r; img.onerror = r; });
          const result = await classifyProduceOnDevice(img, lang);
          if (result && result.isProduce) {
            setDetectedProduceResult(result);
          }
          return result;
        } catch (err) {
          console.warn('[ProduceVision] On-device produce scan error:', err);
          return null;
        }
      })();

      const endpoint = isFlyer
        ? '/api/v1/inventory/scan-flyer'
        : isReceipt
        ? '/api/v1/inventory/scan-receipt-photo'
        : isProduce
        ? '/api/v1/inventory/scan-produce'
        : '/api/v1/inventory/scan';

      const serverPromise = fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressedDataUrl,
          mimeType: 'image/jpeg',
          language: lang,
        }),
      })
        .then((r) => r.json())
        .catch((err) => {
          console.warn('[ServerScan] Scan error:', err);
          return { success: false, items: [] };
        });

      const [detectedBarcode, onDeviceVisionResult, serverData] = await Promise.all([
        barcodePromise,
        onDevicePromise,
        serverPromise,
      ]);

      let items: ScannedItemCandidate[] = [];
      let winningMethod: 'barcode' | 'produce' | 'receipt' | 'packaging' | 'flyer' = 'packaging';
      let winningMethodLabel = lang === 'FR' ? 'Aliment emballé canadien' : 'Canadian packaged grocery';

      // Arbitration Decision Matrix:
      // Priority 1: Optical Barcode detected and resolved via Canadian/Open DB
      if (detectedBarcode && detectedBarcode.length >= 8) {
        try {
          const barcodeRes = await fetch(`/api/v1/inventory/barcode/${detectedBarcode}?language=${lang}`);
          const barcodeData = await barcodeRes.json();
          if (barcodeData.success && barcodeData.item) {
            items = [barcodeData.item];
            winningMethod = 'barcode';
            winningMethodLabel = lang === 'FR'
              ? `Code-barres UPC #${detectedBarcode}`
              : `UPC Barcode #${detectedBarcode}`;
          }
        } catch (e) {
          console.warn('Barcode lookup failed:', e);
        }
      }

      // Priority 2: Receipt OCR (multiple receipt lines with prices & Quebec store names)
      if (
        items.length === 0 &&
        serverData &&
        serverData.identifiedMethod === 'receipt' &&
        Array.isArray(serverData.items) &&
        serverData.items.length > 0
      ) {
        items = serverData.items;
        winningMethod = 'receipt';
        winningMethodLabel = lang === 'FR'
          ? (serverData.summary?.split('(')[1]?.replace(')', '') || 'Reçu d’épicerie québécois')
          : 'Quebec grocery receipt';
      }

      // Priority 3: Server packaging, Canadian food database, and specialized Dairy/Yogurt detection
      if (items.length === 0 && serverData && Array.isArray(serverData.items) && serverData.items.length > 0) {
        // Special check: Is this yogurt or fresh dairy?
        const isYogurtOrDairy = serverData.items.some((it: ScannedItemCandidate) =>
          /(?:yogourt|yogurt|yaourt|yogur|oikos|iogo|iögo|astro|activia|liberte|liberté|kefir|skyr|chobani|danone)/i.test(
            `${it.name || ''} ${it.brand || ''} ${serverData.summary || ''}`
          )
        );

        if (isYogurtOrDairy) {
          items = serverData.items.map((it: ScannedItemCandidate) => {
            const isFr = lang === 'FR';
            return {
              ...it,
              category: isFr ? 'Produits laitiers & œufs' : 'Dairy & Eggs',
              recommendedLocation: 'Fridge',
              estimatedShelfLifeDays: it.estimatedShelfLifeDays || 25,
              unopenedShelfLifeDays: it.unopenedShelfLifeDays || 28,
              openedShelfLifeDays: it.openedShelfLifeDays || 10,
              monthsFrozenShelfLife: it.monthsFrozenShelfLife || 3,
              packagingFormat: it.packagingFormat || (isFr ? 'Pot de yogourt 650g - 750g' : 'Yogurt tub 650g - 750g'),
              storageTip: isFr
                ? 'Conserver au centre du réfrigérateur (2°C - 4°C). Bien refermer après ouverture.'
                : 'Keep in central fridge shelves (2°C - 4°C). Reseal tightly after opening.',
            };
          });
          winningMethod = 'packaging';
          winningMethodLabel = lang === 'FR' ? '✨ Yogourt & Produits laitiers' : '✨ Yogurt & Dairy';
        } else if (
          serverData.identifiedMethod === 'produce_plu' ||
          serverData.identifiedMethod === 'produce' ||
          serverData.source === 'gemini_produce_vision' ||
          serverData.source === 'plu_sticker' ||
          serverData.source === 'local_produce_model' ||
          serverData.source === 'produce_keyword'
        ) {
          items = serverData.items;
          winningMethod = 'produce';
          winningMethodLabel = lang === 'FR'
            ? (serverData.summary || 'Fruit ou légume frais')
            : (serverData.summary || 'Fresh produce');
        } else {
          items = serverData.items;
          winningMethod = serverData.identifiedMethod === 'flyer' ? 'flyer' : 'packaging';
          winningMethodLabel = serverData.identifiedMethod === 'flyer'
            ? (lang === 'FR' ? 'Rabais circulaire Super C' : 'Super C Flyer promo')
            : (lang === 'FR' ? 'Épicerie québécoise & canadienne' : 'Canadian grocery database');
        }
      }

      // Priority 4: Verified Optical PLU Sticker or High-Confidence Fresh Produce Vision
      if (items.length === 0) {
        const isVerifiedProduce = Boolean(
          onDeviceVisionResult &&
          onDeviceVisionResult.isProduce &&
          onDeviceVisionResult.item &&
          (onDeviceVisionResult.sourceMethod === 'plu_sticker' || onDeviceVisionResult.confidence >= 0.50)
        );

        if (isVerifiedProduce && onDeviceVisionResult && onDeviceVisionResult.item) {
          const prod = onDeviceVisionResult.item;
          items = [
            {
              name: prod.name,
              category: prod.categoryEn,
              quantity: 1,
              unit: 'pcs',
              recommendedLocation: prod.recommendedLocation,
              estimatedShelfLifeDays: prod.estimatedShelfLifeDays,
              monthsFrozenShelfLife: prod.monthsFrozenShelfLife,
              brand: prod.brand,
              gradeOrigin: prod.gradeOrigin,
              packagingFormat: prod.packagingFormat,
              dietaryBadges: prod.dietaryBadges,
              storageTip: prod.storageTip,
              storageReason: prod.storageReason,
              freezerTip: prod.freezerTip,
              confidence: onDeviceVisionResult.confidence,
              barcode: prod.pluCode,
            },
          ];
          winningMethod = 'produce';
          winningMethodLabel = lang === 'FR'
            ? `Fruit/Légume frais (PLU #${prod.pluCode || 'IFPS'})`
            : `Fresh Produce (PLU #${prod.pluCode || 'IFPS'})`;
        }
      }

      // Priority 5: Direct OCR text detection fallback for Yogurt if text contains yogurt keywords
      if (items.length === 0 && serverData && serverData.detectedText) {
        const ocrLower = (serverData.detectedText || '').toLowerCase();
        if (/(?:yogourt|yogurt|yaourt|oikos|iogo|iögo|astro|activia|liberte|liberté|chobani|danone)/i.test(ocrLower)) {
          const isFr = lang === 'FR';
          const isGreek = /grec|greek/i.test(ocrLower);
          const isOikos = /oikos/i.test(ocrLower);
          const isIogo = /iogo|iögo/i.test(ocrLower);

          const yogurtName = isOikos
            ? (isFr ? 'Yogourt grec Oikos (750 g)' : 'Oikos Greek Yogurt (750 g)')
            : isIogo
            ? (isFr ? 'Yogourt brassé Iögo (650 g)' : 'Iögo Stirred Yogurt (650 g)')
            : isGreek
            ? (isFr ? 'Yogourt grec nature' : 'Plain Greek Yogurt')
            : (isFr ? 'Yogourt frais' : 'Fresh Yogurt');

          items = [
            {
              name: yogurtName,
              category: isFr ? 'Produits laitiers & œufs' : 'Dairy & Eggs',
              quantity: 1,
              unit: 'pot',
              recommendedLocation: 'Fridge',
              estimatedShelfLifeDays: 25,
              unopenedShelfLifeDays: 28,
              openedShelfLifeDays: 10,
              monthsFrozenShelfLife: 3,
              brand: isOikos ? 'Oikos' : isIogo ? 'Iögo' : 'Produit laitier canadien',
              gradeOrigin: '100% LAIT CANADIEN',
              packagingFormat: isFr ? 'Pot en plastique recyclable' : 'Recyclable plastic tub',
              dietaryBadges: ['100% Lait canadien', 'Produits laitiers frais'],
              storageTip: isFr
                ? 'Conserver au réfrigérateur entre 2°C et 4°C. Bien refermer après usage.'
                : 'Keep refrigerated between 2°C and 4°C. Seal lid tightly.',
              confidence: 0.95,
            },
          ];
          winningMethod = 'packaging';
          winningMethodLabel = lang === 'FR' ? '✨ Yogourt & Produits laitiers' : '✨ Yogurt & Dairy';
        }
      }

      // Intelligent Quality Filter (filter out OCR noise)
      const filteredItems = items.filter((item) => {
        if (!item || !item.name) return false;
        const letters = item.name.replace(/[^a-zA-ZÀ-ÿ]/g, '');
        if (letters.length < 3) return false;
        if (
          /^(?:- - a|-  s a|Le  4  4 3|a ig  ès a|A es re ae EE  a 7200|d  BE AN Al a ee El  4 æ|ice y Fg  2x 8|REE LP|À 4 A 4 - ne té|oad poor|LM Na|War  - L A|aE pt)$/i.test(
            item.name.trim()
          )
        ) {
          return false;
        }
        return true;
      });

      if (filteredItems.length === 0) {
        showToast(
          lang === 'FR'
            ? 'Aucun aliment clair identifié. Rapprochez l’appareil ou prenez une photo sous un meilleur éclairage !'
            : 'No clear food identified. Move closer or take a picture with better lighting!',
          'info',
          6000
        );
        return;
      }

      // Automatically save each recognized item to the database in the background!
      const addedThisBatch: SessionItem[] = [];
      for (const itemCandidate of filteredItems) {
        try {
          itemCandidate.imageUrl = compressedDataUrl;
          const savedItem = await saveCandidateToInventory(itemCandidate);
          onItemAdded(savedItem);

          const sessionEntry: SessionItem = {
            id: savedItem.id,
            name: savedItem.name,
            quantity: savedItem.quantity,
            unit: savedItem.unit,
            locationName: itemCandidate.recommendedLocation || 'Fridge',
            categoryName: itemCandidate.category || 'Produce',
            notes: savedItem.notes ?? undefined,
            addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            brand: itemCandidate.brand,
            price: itemCandidate.price,
            gradeOrigin: itemCandidate.gradeOrigin,
            packagingFormat: itemCandidate.packagingFormat,
            dietaryBadges: itemCandidate.dietaryBadges,
            netContent: itemCandidate.netContent,
            unopenedLocation: itemCandidate.unopenedLocation,
            openedLocation: itemCandidate.openedLocation,
            unopenedShelfLifeDays: itemCandidate.unopenedShelfLifeDays,
            openedShelfLifeDays: itemCandidate.openedShelfLifeDays,
            estimatedShelfLifeDays: itemCandidate.estimatedShelfLifeDays,
            storageTip: itemCandidate.storageTip,
            freezerTip: itemCandidate.freezerTip,
            storageReason: itemCandidate.storageReason,
            imageUrl: compressedDataUrl,
            confidence: itemCandidate.confidence,
            identifiedMethod: winningMethod,
            identifiedMethodLabel: winningMethodLabel,
          };

          addedThisBatch.push(sessionEntry);
        } catch (err) {
          console.warn('Failed saving candidate:', itemCandidate.name, err);
        }
      }

      if (addedThisBatch.length > 0) {
        setSessionItems((prev) => [...addedThisBatch, ...prev]);
        setInspectingItem(addedThisBatch[0]);
        const namesSummary = addedThisBatch.map((i) => i.name).join(', ');
        showToast(
          lang === 'FR'
            ? `✓ [Auto-Détecté : ${winningMethodLabel}] ${namesSummary}`
            : `✓ [Auto-Detected: ${winningMethodLabel}] ${namesSummary}`,
          'success',
          6000
        );
      }
    } catch (err: any) {
      console.error('Background photo scan error:', err);
      showToast(
        lang === 'FR'
          ? `Erreur de numérisation : ${err.message || 'Impossible de lire la photo'}`
          : `Scan error: ${err.message || 'Failed to read photo'}`,
        'error'
      );
    } finally {
      setActiveJobsCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Process written recipe scan in background
  const processRecipeInBackground = async (compressedDataUrl: string) => {
    setActiveJobsCount((prev) => prev + 1);
    showToast(
      lang === 'FR'
        ? '⚡ Numérisation de la recette écrite (OCR / IA)...'
        : '⚡ Scanning written recipe (OCR / AI)...',
      'info',
      8000
    );

    try {
      const res = await fetch('/api/v1/recipes/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'photo',
          imageBase64: compressedDataUrl,
          mimeType: 'image/jpeg',
          language: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.recipe) {
        throw new Error(data.error || 'Failed to scan recipe');
      }

      const rec = data.recipe;

      // Sync with backend
      await fetch('/api/v1/recipes/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rec),
      }).catch((e) => console.warn('Could not sync recipe to server:', e));

      // Sync with localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('kitchen_komrade_custom_recipes') || '[]');
        const updated = [rec, ...stored.filter((r: any) => r.id !== rec.id)];
        localStorage.setItem('kitchen_komrade_custom_recipes', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }

      const displayTitle = lang === 'FR' && rec.titleFr ? rec.titleFr : rec.title;
      const sessionEntry: SessionItem = {
        id: rec.id,
        name: `📖 ${displayTitle}`,
        quantity: rec.ingredients?.length || 1,
        unit: lang === 'FR' ? 'ingrédients' : 'ingredients',
        locationName: 'Recipes',
        categoryName: 'Custom Recipe',
        notes: rec.instructionsEn?.[0] || '',
        addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessionItems((prev) => [sessionEntry, ...prev]);
      showToast(
        lang === 'FR'
          ? `✓ Recette enregistrée : ${displayTitle}`
          : `✓ Recipe digitized: ${displayTitle}`,
        'success',
        6000
      );
    } catch (err: any) {
      console.error('Recipe scan error:', err);
      showToast(
        lang === 'FR'
          ? `Erreur recette : ${err.message || 'Impossible de lire la photo'}`
          : `Recipe error: ${err.message || 'Failed to read photo'}`,
        'error',
        6000
      );
    } finally {
      setActiveJobsCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Handle files selected (Camera or Gallery)
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList: File[] = Array.from(e.target.files || []);
    if (fileList.length === 0) return;

    // Reset input so taking the exact same photo or file works immediately again
    e.target.value = '';

    // Process each photo in background
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const isFlyer = activeMode === 'flyer';
      const isReceipt = activeMode === 'receipt';
      const isRecipe = activeMode === 'recipe';
      const isProduce = activeMode === 'produce';
      const compressed = await compressFile(file, isFlyer || isReceipt || isRecipe ? 2000 : 1600);
      if (compressed) {
        if (isRecipe) {
          processRecipeInBackground(compressed);
        } else {
          processPhotoInBackground(compressed, isReceipt, isFlyer, isProduce);
        }
      }
    }
  };

  // Dedicated Produce PLU Lookup handler (Canadian IFPS PLU Database & CNF)
  const handleLookupProducePlu = async (pluToLookup?: string) => {
    const code = (pluToLookup || producePluInput).trim().replace(/[^0-9]/g, '');
    if (!code || code.length < 4) {
      showToast(
        lang === 'FR'
          ? 'Entrez un code PLU valide à 4 ou 5 chiffres (ex: 4051 pour la mangue, 4011 pour la banane).'
          : 'Enter a valid 4 or 5 digit PLU code (e.g. 4051 for mango, 4011 for banana).',
        'error'
      );
      return;
    }

    const isOrganic = code.length === 5 && code.startsWith('9');
    const baseCode = isOrganic ? code.slice(1) : code;

    let foundItem: any = null;
    for (const [key, info] of Object.entries(PRODUCE_MAPPING)) {
      if (info.pluCode === baseCode) {
        foundItem = { key, info };
        break;
      }
    }

    if (foundItem) {
      const { info } = foundItem;
      const name = isOrganic
        ? (lang === 'FR' ? `${info.nameFr} (Biologique)` : `${info.nameEn} (Organic)`)
        : (lang === 'FR' ? info.nameFr : info.nameEn);

      const candidate: ScannedItemCandidate = {
        name,
        category: 'Produce',
        quantity: 1,
        unit: 'pcs',
        barcode: code,
        recommendedLocation: info.location,
        estimatedShelfLifeDays: info.shelfLife,
        monthsFrozenShelfLife: 10,
        brand: isOrganic ? 'Certifié Biologique' : 'Produits frais',
        gradeOrigin: `Code PLU #${code} • ${lang === 'FR' ? info.originFr : info.originEn}`,
        packagingFormat: lang === 'FR' ? 'Fruit/légume frais en vrac' : 'Whole loose produce',
        dietaryBadges: ['Produits frais', `Code PLU #${code}`, ...(isOrganic ? ['Biologique'] : [])],
        storageTip: lang === 'FR' ? info.storageTipFr : info.storageTipEn,
        storageReason: lang === 'FR' ? `Code PLU #${code} (Norme canadienne IFPS)` : `PLU code #${code} (Canadian IFPS standard)`,
        freezerTip: lang === 'FR' ? info.freezerTipFr : info.freezerTipEn,
        confidence: 1.0,
      };

      try {
        const saved = await saveCandidateToInventory(candidate);
        onItemAdded(saved);
        setSessionItems((prev) => [
          {
            id: saved.id,
            name: saved.name,
            quantity: saved.quantity,
            unit: saved.unit,
            locationName: info.location,
            categoryName: 'Produce',
            barcode: code,
            storageTip: candidate.storageTip,
            storageReason: candidate.storageReason,
            freezerTip: candidate.freezerTip,
            estimatedShelfLifeDays: candidate.estimatedShelfLifeDays,
            gradeOrigin: candidate.gradeOrigin,
            dietaryBadges: candidate.dietaryBadges,
            confidence: 1.0,
            addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...prev,
        ]);
        showToast(
          lang === 'FR' ? `✓ Code PLU #${code} : ${name} ajouté !` : `✓ PLU #${code}: ${name} added!`,
          'success'
        );
        setProducePluInput('');
      } catch (err: any) {
        showToast(err.message || 'Error adding produce', 'error');
      }
    } else {
      // Query server if not found in client subset
      try {
        const res = await fetch('/api/v1/inventory/scan-produce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pluHint: code, language: lang }),
        });
        const d = await res.json();
        if (d.success && d.item) {
          const saved = await saveCandidateToInventory(d.item);
          onItemAdded(saved);
          setSessionItems((prev) => [
            {
              id: saved.id,
              name: saved.name,
              quantity: saved.quantity,
              unit: saved.unit,
              locationName: d.item.recommendedLocation,
              categoryName: 'Produce',
              barcode: code,
              storageTip: d.item.storageTip,
              storageReason: d.item.storageReason,
              freezerTip: d.item.freezerTip,
              estimatedShelfLifeDays: d.item.estimatedShelfLifeDays,
              gradeOrigin: d.item.gradeOrigin,
              dietaryBadges: d.item.dietaryBadges,
              confidence: 1.0,
              addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
            ...prev,
          ]);
          showToast(
            lang === 'FR' ? `✓ Code PLU #${code} : ${d.item.name} ajouté !` : `✓ PLU #${code}: ${d.item.name} added!`,
            'success'
          );
          setProducePluInput('');
          return;
        }
      } catch (e) {
        // ignore
      }

      showToast(
        lang === 'FR' ? `Code PLU #${code} introuvable.` : `PLU #${code} not found in database.`,
        'error'
      );
    }
  };

  // Unified Barcode & IFPS PLU Lookup handler
  const handleLookupUpc = async (codeToLookup?: string) => {
    const code = (codeToLookup || upcInput).trim().replace(/[^0-9]/g, '');
    if (!code || code.length < 4) {
      setUpcError(
        lang === 'FR'
          ? 'Entrez un code valide : PLU fruit/légume (4-5 chiffres) ou code-barres UPC/EAN (8-14 chiffres).'
          : 'Enter a valid code: 4-5 digit produce PLU or 8-14 digit UPC/EAN barcode.'
      );
      return;
    }

    setIsLookingUpUpc(true);
    setUpcError(null);

    try {
      const res = await fetch(`/api/v1/inventory/barcode/${code}?language=${lang}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.item) {
        throw new Error(data.error || 'Code could not be resolved in Canadian & Open databases.');
      }

      const itemCandidate = data.item;
      const savedItem = await saveCandidateToInventory(itemCandidate);
      onItemAdded(savedItem);

      const sessionEntry: SessionItem = {
        id: savedItem.id,
        name: savedItem.name,
        quantity: savedItem.quantity,
        unit: savedItem.unit,
        locationName: itemCandidate.recommendedLocation || 'Pantry',
        categoryName: itemCandidate.category || 'Pantry Staples',
        brand: itemCandidate.brand,
        gradeOrigin: itemCandidate.gradeOrigin,
        packagingFormat: itemCandidate.packagingFormat,
        dietaryBadges: itemCandidate.dietaryBadges,
        storageTip: itemCandidate.storageTip,
        freezerTip: itemCandidate.freezerTip,
        storageReason: itemCandidate.storageReason,
        addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessionItems((prev) => [sessionEntry, ...prev]);
      setInspectingItem(sessionEntry);
      setUpcInput('');
      const dbBadge = data.sourceLabel || (data.source === 'IFPS_PLU' ? '🏷️ IFPS PLU' : data.source === 'CANADIAN_NUTRIENT_FILE' ? '🍁 Fichier canadien' : '🇨🇦 Open Food Facts');
      showToast(
        lang === 'FR'
          ? `✓ ${dbBadge} : ${savedItem.name}`
          : `✓ ${dbBadge}: ${savedItem.name}`,
        'success'
      );
    } catch (err: any) {
      setUpcError(err.message || 'Failed to lookup barcode or PLU code.');
    } finally {
      setIsLookingUpUpc(false);
    }
  };

  // Live search in Canadian Nutrient File and IFPS database
  const handleSearchDb = async (q: string) => {
    setDbSearchQuery(q);
    if (!q.trim() || q.trim().length < 2) {
      setDbSearchResults([]);
      return;
    }
    setIsSearchingDb(true);
    try {
      const res = await fetch(`/api/v1/inventory/search-db?q=${encodeURIComponent(q.trim())}&language=${lang}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setDbSearchResults(data.results);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingDb(false);
    }
  };

  // Add item from Canadian DB search result
  const handleAddDbItem = async (candidate: any) => {
    try {
      const saved = await saveCandidateToInventory({
        name: candidate.name,
        category: candidate.categoryEn || candidate.category || 'Produce',
        quantity: 1,
        unit: 'pcs',
        recommendedLocation: candidate.location || 'Fridge',
        estimatedShelfLifeDays: candidate.shelfLifeDays || 14,
        monthsFrozenShelfLife: candidate.monthsFrozenShelfLife || 6,
        brand: candidate.brand,
        gradeOrigin: candidate.gradeOrigin,
        dietaryBadges: candidate.dietaryBadges,
        storageTip: candidate.storageTip,
        barcode: candidate.code || candidate.upc || null,
        storageReason: candidate.sourceLabel,
      });
      onItemAdded(saved);

      const sessionEntry: SessionItem = {
        id: saved.id,
        name: saved.name,
        quantity: saved.quantity,
        unit: saved.unit,
        locationName: candidate.location || 'Fridge',
        categoryName: candidate.categoryEn || candidate.category || 'Produce',
        brand: candidate.brand,
        gradeOrigin: candidate.gradeOrigin,
        dietaryBadges: candidate.dietaryBadges,
        storageTip: candidate.storageTip,
        addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessionItems((prev) => [sessionEntry, ...prev]);
      setInspectingItem(sessionEntry);
      setDbSearchQuery('');
      setDbSearchResults([]);
      showToast(
        lang === 'FR' ? `✓ Ajouté (${candidate.sourceLabel}) : ${saved.name}` : `✓ Added (${candidate.sourceLabel}): ${saved.name}`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Error adding item', 'error');
    }
  };

  // Receipt text parser handler
  const handleParseReceiptText = async () => {
    const raw = receiptText.trim();
    if (!raw) return;

    setIsParsingReceipt(true);
    showToast(
      lang === 'FR' ? '⚡ Analyse du reçu en cours...' : '⚡ Parsing receipt text...',
      'info'
    );

    try {
      const response = await fetch('/api/v1/inventory/scan-receipt-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptText: raw, language: lang }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse receipt text');
      }

      const items: ScannedItemCandidate[] = data.items || [];
      const addedThisBatch: SessionItem[] = [];

      for (const itemCandidate of items) {
        try {
          const savedItem = await saveCandidateToInventory(itemCandidate);
          onItemAdded(savedItem);
          addedThisBatch.push({
            id: savedItem.id,
            name: savedItem.name,
            quantity: savedItem.quantity,
            unit: savedItem.unit,
            locationName: itemCandidate.recommendedLocation || 'Fridge',
            categoryName: itemCandidate.category || 'Produce',
            addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        } catch (err) {
          console.warn('Failed saving receipt item:', itemCandidate.name, err);
        }
      }

      if (addedThisBatch.length > 0) {
        setSessionItems((prev) => [...addedThisBatch, ...prev]);
        setReceiptText('');
        showToast(
          lang === 'FR'
            ? `✓ ${addedThisBatch.length} articles du reçu ajoutés !`
            : `✓ Added ${addedThisBatch.length} receipt items!`,
          'success'
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to parse receipt text', 'error');
    } finally {
      setIsParsingReceipt(false);
    }
  };

  // Load sample preset directly
  const handleLoadPreset = async (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setShowPresets(false);
    showToast(lang === 'FR' ? `Ajout de l'exemple : ${preset.name}...` : `Adding preset haul: ${preset.name}...`, 'info');

    const addedThisBatch: SessionItem[] = [];
    for (const pItem of preset.items) {
      try {
        const itemPrice = (pItem as any).price;
        const savedItem = await saveCandidateToInventory({
          name: pItem.name,
          category: pItem.category,
          quantity: pItem.quantity,
          unit: pItem.unit,
          price: itemPrice,
          recommendedLocation: pItem.recommendedLocation,
          estimatedShelfLifeDays: pItem.shelfLife,
          monthsFrozenShelfLife: 6,
          storageReason: 'Added from test preset',
        });
        onItemAdded(savedItem);
        addedThisBatch.push({
          id: savedItem.id,
          name: savedItem.name,
          quantity: savedItem.quantity,
          unit: savedItem.unit,
          price: itemPrice,
          locationName: pItem.recommendedLocation,
          categoryName: pItem.category,
          addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } catch (e) {
        console.warn('Error loading preset item', e);
      }
    }

    if (addedThisBatch.length > 0) {
      setSessionItems((prev) => [...addedThisBatch, ...prev]);
      showToast(
        lang === 'FR'
          ? `✓ ${addedThisBatch.length} articles d'exemple ajoutés au stock !`
          : `✓ Added ${addedThisBatch.length} sample items to inventory!`,
        'success'
      );
    }
  };

  // Add all promotional flyer deals from a Canadian grocery banner
  const handleLoadFlyerBannerDeals = async (banner: CanadianFlyerBanner) => {
    showToast(
      lang === 'FR'
        ? `Ajout des ${banner.deals.length} rabais de la circulaire ${banner.storeName}...`
        : `Adding all ${banner.deals.length} deals from ${banner.storeName} flyer...`,
      'info'
    );

    const addedThisBatch: SessionItem[] = [];
    for (const deal of banner.deals) {
      try {
        const savedItem = await saveCandidateToInventory({
          name: lang === 'FR' ? deal.nameFr : deal.nameEn,
          nameFr: deal.nameFr,
          nameEn: deal.nameEn,
          brand: deal.brand,
          category: deal.category,
          quantity: deal.quantity,
          unit: deal.unit,
          netContent: deal.netContent,
          price: deal.price,
          recommendedLocation: deal.recommendedLocation,
          estimatedShelfLifeDays: deal.estimatedShelfLifeDays,
          unopenedShelfLifeDays: deal.unopenedShelfLifeDays,
          openedShelfLifeDays: deal.openedShelfLifeDays,
          monthsFrozenShelfLife: deal.monthsFrozenShelfLife,
          dietaryBadges: deal.dietaryBadges,
          gradeOrigin: deal.gradeOrigin,
          packagingFormat: deal.packagingFormat,
          storageTip: deal.storageTip,
          storageReason: deal.storageReason,
        });
        onItemAdded(savedItem);
        addedThisBatch.push({
          id: savedItem.id,
          name: savedItem.name,
          quantity: savedItem.quantity,
          unit: savedItem.unit,
          price: deal.price,
          locationName: deal.recommendedLocation,
          categoryName: deal.category,
          addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } catch (err) {
        console.warn('Failed saving flyer deal:', deal.name, err);
      }
    }

    if (addedThisBatch.length > 0) {
      setSessionItems((prev) => [...addedThisBatch, ...prev]);
      showToast(
        lang === 'FR'
          ? `✓ ${addedThisBatch.length} rabais ${banner.storeName} ajoutés à l’inventaire !`
          : `✓ Added ${addedThisBatch.length} ${banner.storeName} flyer deals to your pantry!`,
        'success'
      );
    }
  };

  // Test scanning a Canadian grocery flyer picture through the Smart Scanner AI pipeline
  const handleScanFlyerPicture = async (banner: CanadianFlyerBanner) => {
    const flyerDataUrl = svgToDataUrl(banner.flyerSvg);
    showToast(
      lang === 'FR'
        ? `⚡ Analyse de la circulaire ${banner.storeName} par vision IA...`
        : `⚡ Analyzing ${banner.storeName} flyer picture with AI Vision...`,
      'info',
      8000
    );
    await processPhotoInBackground(flyerDataUrl, false, true, false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7EE] flex flex-col w-full h-full overflow-hidden text-[#133E3B] animate-fade-in">
      {/* Hidden File Inputs for Native Camera Shutter & Gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFilesSelected}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFilesSelected}
        accept="image/*"
        multiple
        className="hidden"
      />

      <div className="relative w-full max-w-2xl mx-auto h-full flex flex-col overflow-hidden">
        {/* Top Header with explicit Exit button */}
        <div className="px-5 py-3.5 border-b border-[#E8E2D5] flex items-center justify-between bg-white/90 backdrop-blur-xs shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-[#0D3B37] leading-tight">
                {lang === 'FR' ? 'Ajout par Photo' : 'Add by Picture'}
              </h2>
              <p className="text-[11px] text-[#527470]">
                {lang === 'FR' ? 'Ajout continu en arrière-plan' : 'Continuous background scanning'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sessionItems.length > 0 && (
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                {lang === 'FR' ? `✓ ${sessionItems.length} ajoutés` : `✓ ${sessionItems.length} added`}
              </span>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              title={lang === 'FR' ? 'Quitter' : 'Exit'}
            >
              <X className="w-4 h-4" />
              <span>{lang === 'FR' ? 'Quitter' : 'Exit'}</span>
            </button>
          </div>
        </div>

        {/* Smart Auto-Detect Header (Zero button clutter - pure automated intelligence) */}
        <div className="px-5 pt-2 pb-1 shrink-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs font-black shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
              <span>{lang === 'FR' ? '✨ Filtre & Détection Automatique' : '✨ Auto-Detect & Smart Filter'}</span>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-semibold text-[#527470] truncate">
              {lang === 'FR'
                ? 'L’application filtre le bruit et choisit la meilleure méthode (yogourts, fruits, emballages, reçus, codes-barres)'
                : 'The app filters noise and chooses the best identification method'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {sessionItems.length > 0 && (
              <span className="text-xs font-extrabold text-[#0D3B37]">
                {sessionItems.length} {lang === 'FR' ? 'ajouté(s)' : 'added'}
              </span>
            )}
          </div>
        </div>

        {/* Live Status Pill (Continuous Background Activity) */}
        <div className="px-5 py-1.5 shrink-0">
          {latestToast ? (
            <div
              className={`p-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs animate-scale-in ${
                latestToast.type === 'success'
                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-950'
                  : latestToast.type === 'error'
                  ? 'bg-rose-100 border border-rose-300 text-rose-950'
                  : 'bg-teal-100/90 border border-teal-300 text-teal-950'
              }`}
            >
              {latestToast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : latestToast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 text-teal-700 animate-spin shrink-0" />
              )}
              <span className="truncate flex-1">{latestToast.message}</span>
            </div>
          ) : activeJobsCount > 0 ? (
            <div className="p-2.5 rounded-2xl bg-teal-100/90 border border-teal-300 text-teal-950 text-xs font-bold flex items-center gap-2 shadow-xs animate-pulse">
              <RefreshCw className="w-4 h-4 text-teal-700 animate-spin shrink-0" />
              <span className="flex-1">
                {lang === 'FR'
                  ? `Analyse en arrière-plan (${activeJobsCount} photo${activeJobsCount > 1 ? 's' : ''})... Continuez à photographier !`
                  : `Adding in background (${activeJobsCount} photo${activeJobsCount > 1 ? 's' : ''})... Keep snapping!`}
              </span>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-[#F0EBE0] text-[#527470] text-[11px] font-medium text-center">
              {lang === 'FR'
                ? '📸 Prenez des photos en continu. Vos aliments s’ajoutent en arrière-plan sans vous arrêter.'
                : '📸 Snap photos one after another. Items are saved in the background without interrupting you.'}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4">
          {/* PHOTO OR RECIPE MODE (Simplified & Continuous) */}
          {(activeMode === 'photo' || activeMode === 'recipe') && (
            <div className="flex flex-col items-center space-y-4">
              {/* Clean Camera Capture Shutter Card */}
              <div className="w-full relative rounded-3xl bg-white border-2 border-teal-700/20 hover:border-teal-600 p-6 flex flex-col items-center text-center transition-all shadow-xs">
                {/* Large Shutter Buttons */}
                <div className="flex items-center justify-center gap-6 my-2">
                  {/* Gallery/Library Option */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-14 h-14 rounded-2xl bg-[#FAF7EE] hover:bg-[#F2ECE0] border-2 border-[#D5E1D2] text-[#0D3B37] flex flex-col items-center justify-center gap-0.5 shadow-xs transition-transform active:scale-95"
                    title={lang === 'FR' ? 'Choisir des photos' : 'Pick from library'}
                  >
                    <Upload className="w-5 h-5 text-teal-800" />
                    <span className="text-[9px] font-extrabold text-[#527470]">
                      {lang === 'FR' ? 'Galerie' : 'Gallery'}
                    </span>
                  </button>

                  {/* Main Shutter Button */}
                  <button
                    id="scanner-continuous-shutter-btn"
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-22 h-22 rounded-full bg-gradient-to-tr from-[#0D3B37] via-[#0E766E] to-teal-500 text-white flex flex-col items-center justify-center shadow-xl border-4 border-[#FAF7EE] ring-4 ring-teal-600/30 hover:scale-105 active:scale-90 transition-all cursor-pointer"
                    title={lang === 'FR' ? 'Prendre une photo' : 'Take photo'}
                  >
                    {activeMode === 'recipe' ? (
                      <ChefHat className="w-9 h-9 stroke-[2.2]" />
                    ) : (
                      <Camera className="w-9 h-9 stroke-[2.2]" />
                    )}
                  </button>
                </div>

                <div className="space-y-1 mt-2">
                  <p className="text-sm font-extrabold text-[#0D3B37]">
                    {activeMode === 'recipe'
                      ? (lang === 'FR' ? 'Photographiez votre fiche ou page de recette' : 'Snap your written recipe card or cookbook')
                      : (lang === 'FR' ? 'Prendre une photo (Auto-Détection)' : 'Take a picture (Smart Auto-Detect)')}
                  </p>
                  <p className="text-xs text-[#527470] max-w-sm mx-auto">
                    {activeMode === 'recipe'
                      ? (lang === 'FR'
                        ? 'L’IA et l’OCR numérisent la recette et l’enregistrent directement dans vos Idées Repas.'
                        : 'AI & OCR will digitize the recipe and save it directly to your kitchen recipe collection.')
                      : (lang === 'FR'
                        ? 'Une seule photo suffit : l’application filtre le bruit et sélectionne automatiquement la meilleure méthode d’identification (fruits, légumes, codes-barres, reçus, épicerie).'
                        : 'Just snap a photo: the app filters out noise and automatically selects the best identification method (produce, barcodes, receipts, grocery).')}
                  </p>
                </div>
              </div>

              {/* EXTRACTED FOOD INTELLIGENCE CARD (Matches user table format) */}
              {inspectingItem && (
                <div className="w-full rounded-3xl border-2 border-teal-600/40 bg-white p-4 shadow-md space-y-3 animate-scale-in">
                  <div className="flex items-center justify-between border-b border-[#E8E1D5] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">✨</span>
                      <div>
                        <h3 className="text-xs font-black text-[#0D3B37] leading-tight">
                          {lang === 'FR' ? 'Attributs extraits de la photo' : 'Extracted Food Intelligence'}
                        </h3>
                        <p className="text-[10px] text-[#527470]">
                          {lang === 'FR' ? 'Vision IA & Analyse d’emballage' : 'AI Vision & Packaging Extraction'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectingItem(null)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      title={lang === 'FR' ? 'Fermer l’aperçu' : 'Close review'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Header preview with thumbnail & title */}
                  <div className="flex items-center gap-3 bg-[#FAF7EE] p-2.5 rounded-2xl border border-[#E8E1D5]">
                    {inspectingItem.imageUrl ? (
                      <img
                        src={inspectingItem.imageUrl}
                        alt={inspectingItem.name}
                        className="w-14 h-14 rounded-xl object-cover border border-[#D5E1D2] shrink-0 shadow-2xs"
                      />
                    ) : (
                      <div className="shrink-0">
                        <FoodVisualBadge
                          itemName={inspectingItem.name}
                          categoryName={inspectingItem.categoryName}
                          size="md"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-black text-sm text-[#0D3B37] truncate">
                          {getItemDisplayName(inspectingItem, lang)}
                        </h4>
                        {inspectingItem.identifiedMethodLabel && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs">
                            ✨ {inspectingItem.identifiedMethodLabel}
                          </span>
                        )}
                        {inspectingItem.brand && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-800 text-white shadow-2xs">
                            {inspectingItem.brand}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#527470] mt-0.5">
                        {formatLocalizedQuantityUnit(inspectingItem.quantity, inspectingItem.netContent || inspectingItem.unit, lang)} • {getLocationLocalizedName(inspectingItem.locationName, lang)}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Attributes Table */}
                  <div className="overflow-x-auto rounded-xl border border-[#E8E1D5]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#F2ECE0] text-[#0D3B37] text-[10px] uppercase tracking-wider">
                          <th className="py-1.5 px-3 font-extrabold w-1/3">
                            {lang === 'FR' ? 'Attribut' : 'Attribute'}
                          </th>
                          <th className="py-1.5 px-3 font-extrabold">
                            {lang === 'FR' ? 'Valeur extraite' : 'Extracted Value'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0EBE0] text-[11px] bg-white">
                        <tr>
                          <td className="py-2 px-3 font-bold text-[#527470]">
                            {lang === 'FR' ? 'Nom du produit' : 'Product Name'}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-extrabold text-sm text-[#0D3B37]">
                              {getItemDisplayName(inspectingItem, lang)}
                            </span>
                          </td>
                        </tr>

                        {inspectingItem.brand && (
                          <tr>
                            <td className="py-2 px-3 font-bold text-[#527470]">
                              {lang === 'FR' ? 'Marque' : 'Brand'}
                            </td>
                            <td className="py-2 px-3 font-bold text-teal-900">
                              {inspectingItem.brand}
                            </td>
                          </tr>
                        )}

                        {inspectingItem.price && (
                          <tr className="bg-amber-50/80">
                            <td className="py-2 px-3 font-bold text-amber-900">
                              {lang === 'FR' ? 'Prix rabais circulaire' : 'Flyer Deal Price'}
                            </td>
                            <td className="py-2 px-3 font-extrabold text-amber-950">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-200 text-amber-950 border border-amber-300 shadow-2xs">
                                💰 {inspectingItem.price}
                              </span>
                            </td>
                          </tr>
                        )}

                        {inspectingItem.gradeOrigin && (
                          <tr>
                            <td className="py-2 px-3 font-bold text-[#527470]">
                              {lang === 'FR' ? 'Grade / Origine' : 'Grade / Origin'}
                            </td>
                            <td className="py-2 px-3 font-medium text-[#1F3323]">
                              {getLocalizedOrigin(inspectingItem.gradeOrigin, lang)}
                            </td>
                          </tr>
                        )}

                        <tr>
                          <td className="py-2 px-3 font-bold text-[#527470]">
                            {lang === 'FR' ? 'Quantité / Volume net' : 'Net Quantity / Weight'}
                          </td>
                          <td className="py-2 px-3 font-extrabold text-[#0D3B37]">
                            {formatLocalizedQuantityUnit(inspectingItem.quantity, inspectingItem.netContent || inspectingItem.unit, lang)}
                          </td>
                        </tr>

                        {inspectingItem.packagingFormat && (
                          <tr>
                            <td className="py-2 px-3 font-bold text-[#527470]">
                              {lang === 'FR' ? 'Format d’emballage' : 'Packaging Format'}
                            </td>
                            <td className="py-2 px-3 font-medium text-[#1F3323]">
                              {getLocalizedPackaging(inspectingItem.packagingFormat, lang)}
                            </td>
                          </tr>
                        )}

                        {inspectingItem.dietaryBadges && inspectingItem.dietaryBadges.length > 0 && (
                          <tr>
                            <td className="py-2 px-3 font-bold text-[#527470]">
                              {lang === 'FR' ? 'Allégations / Badges' : 'Dietary / Features'}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1 flex-wrap">
                                {inspectingItem.dietaryBadges.map((badge, bIdx) => (
                                  <span
                                    key={bIdx}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300"
                                  >
                                    ✓ {getLocalizedBadge(badge, lang)}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}

                        <tr>
                          <td className="py-2 px-3 font-bold text-[#527470]">
                            {lang === 'FR' ? 'Catégorie' : 'Category'}
                          </td>
                          <td className="py-2 px-3 font-semibold text-[#1F3323]">
                            {getCategoryLocalizedName(inspectingItem.categoryName, lang)}
                          </td>
                        </tr>

                        {(inspectingItem.unopenedLocation || inspectingItem.openedLocation) && (
                          <tr>
                            <td className="py-2 px-3 font-bold text-[#527470]">
                              {lang === 'FR' ? 'Emplacement conseillé' : 'Recommended Location'}
                            </td>
                            <td className="py-2 px-3 space-y-0.5">
                              {inspectingItem.unopenedLocation && (
                                <p className="text-[11px] text-[#1F3323]">
                                  • <span className="font-bold">{lang === 'FR' ? 'Fermé :' : 'Unopened:'}</span> {getLocationLocalizedName(inspectingItem.unopenedLocation, lang)}
                                </p>
                              )}
                              {inspectingItem.openedLocation && (
                                <p className="text-[11px] text-[#1F3323]">
                                  • <span className="font-bold">{lang === 'FR' ? 'Après ouverture :' : 'After opening:'}</span> {getLocationLocalizedName(inspectingItem.openedLocation, lang)}
                                </p>
                              )}
                            </td>
                          </tr>
                        )}

                        {(inspectingItem.unopenedShelfLifeDays || inspectingItem.openedShelfLifeDays) && (
                          <tr>
                            <td className="py-2 px-3 font-bold text-[#527470]">
                              {lang === 'FR' ? 'Durée de conservation' : 'Estimated Shelf Life'}
                            </td>
                            <td className="py-2 px-3 space-y-0.5">
                              {inspectingItem.unopenedShelfLifeDays && (
                                <p className="text-[11px] text-[#1F3323]">
                                  • <span className="font-bold">{lang === 'FR' ? 'Fermé :' : 'Unopened:'}</span> {inspectingItem.unopenedShelfLifeDays} {lang === 'FR' ? 'jours' : 'days'}
                                </p>
                              )}
                              {inspectingItem.openedShelfLifeDays && (
                                <p className="text-[11px] text-[#1F3323]">
                                  • <span className="font-bold">{lang === 'FR' ? 'Après ouverture :' : 'After opening:'}</span> {inspectingItem.openedShelfLifeDays} {lang === 'FR' ? 'jours' : 'days'}
                                </p>
                              )}
                            </td>
                          </tr>
                        )}

                        {inspectingItem.freezerTip && (
                          <tr>
                            <td className="py-2 px-3 font-bold text-[#527470]">
                              {lang === 'FR' ? 'Conservation congélateur' : 'Freezer Shelf Life'}
                            </td>
                            <td className="py-2 px-3 font-medium text-blue-900">
                              {getLocalizedStorageTip(inspectingItem.freezerTip, lang)}
                            </td>
                          </tr>
                        )}

                        {inspectingItem.storageTip && (
                          <tr>
                            <td className="py-2 px-3 font-bold text-[#527470]">
                              {lang === 'FR' ? 'Conseil fraîcheur' : 'Storage Tip'}
                            </td>
                            <td className="py-2 px-3 text-[#1F3323] leading-relaxed">
                              {getLocalizedStorageTip(inspectingItem.storageTip, lang)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'FR' ? 'Enregistré dans le stock' : 'Saved to kitchen inventory'}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{lang === 'FR' ? 'Photo suivante' : 'Snap Next'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* LIVE FEED OF ADDED ITEMS (Always visible directly, no nested hidden drawer) */}
              <div className="w-full rounded-3xl border border-[#E0D9C8] bg-white overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-[#FAF7EE] border-b border-[#E8E2D5] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#0D3B37]">
                      {activeMode === 'recipe'
                        ? (lang === 'FR' ? 'Recettes & articles numérisés' : 'Digitized Recipes & Items')
                        : (lang === 'FR' ? 'Aliments ajoutés en arrière-plan' : 'Items Added in Background')}
                    </span>
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200">
                      {sessionItems.length}
                    </span>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const res = await fetch('/api/v1/inventory/cleanup-noise', { method: 'POST' });
                          const d = await res.json();
                          setSessionItems((prev) => prev.filter((i) => {
                            const letters = i.name.replace(/[^a-zA-ZÀ-ÿ]/g, '');
                            return letters.length >= 3 && !/^(?:- - a|-  s a|Le  4  4 3|a ig  ès a|A es re ae EE  a 7200|d  BE AN Al a ee El  4 æ|ice y Fg  2x 8|REE LP|À 4 A 4 - ne té|oad poor|LM Na|War  - L A|aE pt)$/i.test(i.name.trim());
                          }));
                          showToast(
                            lang === 'FR'
                              ? `✓ Nettoyage effectué (${d.cleanedCount || 0} éléments bruités retirés)`
                              : `✓ Cleaned up ${d.cleanedCount || 0} noise artifacts`,
                            'success'
                          );
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      title={lang === 'FR' ? 'Supprimer les artefacts de texte illisible' : 'Remove weird OCR noise artifacts'}
                    >
                      <span>🧹</span>
                      <span>{lang === 'FR' ? 'Purger bruit OCR' : 'Purge noise'}</span>
                    </button>
                  </div>

                  {activeJobsCount > 0 && (
                    <span className="text-[11px] font-bold text-teal-700 flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      {lang === 'FR' ? 'Analyse...' : 'Reading...'}
                    </span>
                  )}
                </div>

                <div className="p-3 divide-y divide-[#F0EBE0] max-h-64 overflow-y-auto">
                  {sessionItems.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 space-y-1">
                      <p className="text-xs font-medium">
                        {lang === 'FR'
                          ? 'Aucun aliment pour l’instant.'
                          : 'No items added yet.'}
                      </p>
                      <p className="text-[11px] text-[#527470]">
                        {lang === 'FR'
                          ? 'Prenez votre première photo ci-dessus !'
                          : 'Snap your first picture above to get started!'}
                      </p>
                    </div>
                  ) : (
                    sessionItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setInspectingItem(item)}
                        className="py-2.5 px-1.5 rounded-xl hover:bg-[#FAF7EE] flex items-center justify-between gap-3 animate-fade-in cursor-pointer transition-colors"
                        title={lang === 'FR' ? 'Cliquer pour voir la fiche d’extraction' : 'Click to inspect extracted attributes'}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-8 h-8 rounded-lg object-cover border border-[#D5E1D2] shrink-0"
                            />
                          ) : (
                            <FoodVisualBadge itemName={getItemDisplayName(item, lang)} categoryName={item.categoryName} size="sm" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-bold text-[#0D3B37] truncate">{getItemDisplayName(item, lang)}</p>
                              {item.identifiedMethodLabel && (
                                <span className="text-[9px] font-black text-emerald-950 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded-md">
                                  ✨ {item.identifiedMethodLabel}
                                </span>
                              )}
                              {item.name.replace(/[^a-zA-ZÀ-ÿ]/g, "").length < 3 && (
                                <span className="text-[9px] font-black text-amber-900 bg-amber-200 border border-amber-300 px-1.5 py-0.2 rounded-md animate-pulse">
                                  ⚠️ {lang === 'FR' ? 'À corriger (ex. Mangue)' : 'Needs fix (e.g. Mango)'}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#527470]">
                              {formatLocalizedQuantityUnit(item.quantity, item.netContent || item.unit, lang)} • {getLocationLocalizedName(item.locationName, lang)} • {item.addedAt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.price && (
                            <span className="text-[10px] font-black text-rose-900 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full shadow-2xs">
                              {item.price}
                            </span>
                          )}
                          {item.brand && (
                            <span className="hidden sm:inline-block text-[9px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-md truncate max-w-[100px]">
                              {item.brand}
                            </span>
                          )}
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                            {lang === 'FR' ? 'Détails / Corriger >' : 'Details / Edit >'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* OPEN-SOURCE PRODUCE LENS & FRUIT/VEGETABLE SCANNER */}
          {activeMode === 'produce' && (
            <div className="flex flex-col items-center space-y-4">
              {/* Specialized Produce Reticle & Shutter Card */}
              <div className="w-full relative rounded-3xl bg-white border-2 border-emerald-600/30 p-6 flex flex-col items-center text-center shadow-xs">
                {/* Header Tag */}
                <div className="flex items-center gap-2 mb-3 bg-emerald-50 text-emerald-950 border border-emerald-200 px-3 py-1 rounded-full text-xs font-black">
                  <span className="text-sm">🍎</span>
                  <span>{lang === 'FR' ? 'Viseur Fruits & Légumes (IA Locale MobileNet)' : 'Produce Lens (On-Device MobileNet)'}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-200/80 text-emerald-900">
                    100% Hors-Ligne
                  </span>
                </div>

                {/* Viewfinder Reticle Frame */}
                <div className="relative w-64 h-48 rounded-2xl bg-slate-950/5 border-2 border-dashed border-emerald-400/60 flex flex-col items-center justify-center p-4 my-2 overflow-hidden shadow-inner group">
                  {/* Glowing Viewfinder Brackets */}
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-3 border-l-3 border-emerald-600 rounded-tl-lg pointer-events-none" />
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-3 border-r-3 border-emerald-600 rounded-tr-lg pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-3 border-l-3 border-emerald-600 rounded-bl-lg pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-3 border-r-3 border-emerald-600 rounded-br-lg pointer-events-none" />

                  {/* Center PLU Sticker Target */}
                  <div className="w-20 h-20 rounded-full border border-emerald-500/50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-xs shadow-xs text-center p-1 pointer-events-none">
                    <span className="text-xl">🥭</span>
                    <span className="text-[9px] font-black text-emerald-900 leading-tight">
                      {lang === 'FR' ? 'Pastille PLU' : 'PLU Sticker'}
                    </span>
                  </div>

                  <p className="text-[10px] font-bold text-emerald-900/80 mt-2 text-center max-w-[200px]">
                    {lang === 'FR' ? 'Centrez le fruit ou son autocollant 4 chiffres' : 'Center produce or 4-digit sticker'}
                  </p>
                </div>

                {/* Shutter Controls */}
                <div className="flex items-center justify-center gap-6 my-2">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-14 h-14 rounded-2xl bg-[#FAF7EE] hover:bg-emerald-50 border-2 border-[#D5E1D2] hover:border-emerald-300 text-[#0D3B37] flex flex-col items-center justify-center gap-0.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                    title={lang === 'FR' ? 'Choisir une photo de fruit' : 'Upload produce photo'}
                  >
                    <Upload className="w-5 h-5 text-emerald-800" />
                    <span className="text-[9px] font-extrabold text-[#527470]">
                      {lang === 'FR' ? 'Galerie' : 'Gallery'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-22 h-22 rounded-full bg-gradient-to-tr from-emerald-800 via-emerald-600 to-teal-500 text-white flex flex-col items-center justify-center shadow-xl border-4 border-white ring-4 ring-emerald-600/30 hover:scale-105 active:scale-90 transition-all cursor-pointer"
                    title={lang === 'FR' ? 'Photographier le fruit/légume' : 'Snap produce'}
                  >
                    <Camera className="w-9 h-9 stroke-[2.2]" />
                  </button>
                </div>

                <div className="space-y-1 mt-1">
                  <p className="text-sm font-extrabold text-[#0D3B37]">
                    {lang === 'FR' ? 'Photographiez votre fruit ou légume frais' : 'Snap your fresh fruit or vegetable'}
                  </p>
                  <p className="text-xs text-[#527470] max-w-sm mx-auto">
                    {lang === 'FR'
                      ? 'Reconnaît les fruits tropicaux, légumes de serre, pommes du Québec et autocollants PLU (#4051, #4011, #4046...) sans envoyer d’image dans le cloud.'
                      : 'Recognizes tropical fruits, greenhouse veggies, Canadian apples, and PLU stickers (#4051, #4011, #4046...) without sending images to any cloud.'}
                  </p>
                </div>

                {/* Live Detected Produce Card (if recently identified via camera) */}
                {detectedProduceResult && detectedProduceResult.item && (
                  <div className="w-full mt-3 p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-left space-y-2 animate-scale-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">✨</span>
                        <span className="text-xs font-black text-emerald-950">
                          {lang === 'FR' ? 'Fruit / Légume identifié par l’IA' : 'Produce Identified by Vision'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                        {Math.round(detectedProduceResult.confidence * 100)}% {lang === 'FR' ? 'confiance' : 'confidence'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
                      <FoodVisualBadge
                        itemName={detectedProduceResult.item.name}
                        categoryName="Produce"
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-black text-emerald-950 truncate">
                            {detectedProduceResult.item.name}
                          </h4>
                          {detectedProduceResult.item.pluCode && (
                            <span className="text-[9px] font-black font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
                              PLU #{detectedProduceResult.item.pluCode}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#527470] mt-0.5">
                          {detectedProduceResult.item.recommendedLocation === 'Fridge'
                            ? (lang === 'FR' ? '❄️ Réfrigérateur (Bac à légumes)' : '❄️ Refrigerator Crisper')
                            : (lang === 'FR' ? '🧺 Garde-manger / Comptoir' : '🧺 Pantry / Countertop')}
                          {' • '}{detectedProduceResult.item.estimatedShelfLifeDays} {lang === 'FR' ? 'jours' : 'days'}
                        </p>
                      </div>
                    </div>

                    {/* Alternatives buttons if user scanned a similar produce */}
                    {detectedProduceResult.alternatives && detectedProduceResult.alternatives.length > 0 && (
                      <div className="pt-1 space-y-1">
                        <p className="text-[10px] font-bold text-emerald-900">
                          {lang === 'FR' ? 'Variétés alternatives proches :' : 'Close alternative varieties:'}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {detectedProduceResult.alternatives.map((alt, aIdx) => (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() => {
                                if (alt.pluCode) {
                                  handleLookupProducePlu(alt.pluCode);
                                }
                              }}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>{alt.name}</span>
                              {alt.pluCode && <span className="font-mono text-[9px] opacity-75">#{alt.pluCode}</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Instant PLU Code Lookup Form */}
                <div className="w-full mt-4 pt-3 border-t border-[#F0EBE0] text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-[#0D3B37] flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{lang === 'FR' ? 'Recherche par code PLU (4-5 chiffres)' : 'Lookup by PLU Code (4-5 digits)'}</span>
                    </label>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      IFPS Canada
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={producePluInput}
                      onChange={(e) => setProducePluInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLookupProducePlu()}
                      placeholder={lang === 'FR' ? 'Ex: 4051 (Mangue), 4011 (Banane)...' : 'Ex: 4051 (Mango), 4011 (Banana)...'}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-[#FAF7EE] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleLookupProducePlu()}
                      className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
                    >
                      {lang === 'FR' ? 'Identifier' : 'Identify'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CANADIAN GROCERY FLYERS TRAINING & VISION SCANNER SUITE */}
          {activeMode === 'flyer' && (() => {
            const currentBanner =
              CANADIAN_FLYER_BANNERS.find((b) => b.id === selectedFlyerBannerId) ||
              CANADIAN_FLYER_BANNERS[0];
            const isFr = lang === 'FR';

            return (
              <div className="flex flex-col items-center space-y-4 w-full">
                {/* Store Banner Selector Pills */}
                <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none px-1">
                  {CANADIAN_FLYER_BANNERS.map((banner) => {
                    const isSelected = banner.id === currentBanner.id;
                    return (
                      <button
                        key={banner.id}
                        type="button"
                        onClick={() => setSelectedFlyerBannerId(banner.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#0D3B37] text-white shadow-xs scale-102 ring-2 ring-teal-500/40'
                            : 'bg-white hover:bg-slate-50 text-[#0D3B37] border border-[#E0D9C8]'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: banner.primaryColor }} />
                        <span>{banner.storeName}</span>
                        {banner.loyaltyProgram && (
                          <span
                            className={`text-[9px] px-1 rounded font-bold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#527470]'
                            }`}
                          >
                            {banner.loyaltyProgram}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Main Flyer Card with Visual Picture Clipping */}
                <div
                  className="w-full relative rounded-3xl bg-white border-2 p-5 flex flex-col text-left shadow-xs transition-all"
                  style={{ borderColor: `${currentBanner.primaryColor}40` }}
                >
                  {/* Banner Header Info */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#F0EBE0] pb-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-black text-white shadow-2xs"
                          style={{ backgroundColor: currentBanner.primaryColor }}
                        >
                          {currentBanner.storeName}
                        </span>
                        <span className="text-xs font-extrabold text-[#0D3B37] truncate">
                          {isFr ? currentBanner.bannerTitleFr : currentBanner.bannerTitleEn}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#527470] mt-0.5">
                        {isFr ? currentBanner.taglineFr : currentBanner.taglineEn} • {isFr ? currentBanner.dateRangeFr : currentBanner.dateRangeEn}
                      </p>
                    </div>

                    <span
                      className="px-2 py-1 rounded-lg text-[10px] font-black shrink-0 border"
                      style={{
                        backgroundColor: currentBanner.badgeBg,
                        color: currentBanner.primaryColor,
                        borderColor: currentBanner.badgeBorder,
                      }}
                    >
                      {currentBanner.loyaltyProgram}
                    </span>
                  </div>

                  {/* Visual Flyer Picture Preview (SVG Clipping) */}
                  <div className="relative w-full rounded-2xl overflow-hidden border border-[#E8E1D5] bg-[#FAF8F5] mb-4 shadow-inner group">
                    <img
                      src={svgToDataUrl(currentBanner.flyerSvg)}
                      alt={`${currentBanner.storeName} Weekly Circular Flyer`}
                      className="w-full h-auto max-h-72 object-contain mx-auto transition-transform group-hover:scale-[1.01]"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span>🇨🇦 Photo de circulaire</span>
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {/* Action 1: Test AI Vision on this Flyer Picture */}
                    <button
                      type="button"
                      onClick={() => handleScanFlyerPicture(currentBanner)}
                      className="w-full py-2.5 px-3.5 rounded-xl text-white font-extrabold text-xs shadow-sm hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      style={{
                        backgroundColor: currentBanner.primaryColor,
                      }}
                      title={isFr ? 'Numériser cette image de circulaire avec l’IA' : 'Scan this flyer picture with AI Vision'}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {isFr ? '⚡ Tester l’analyse IA sur cette photo' : '⚡ Test AI Vision on this flyer'}
                      </span>
                    </button>

                    {/* Action 2: Add all deals directly */}
                    <button
                      type="button"
                      onClick={() => handleLoadFlyerBannerDeals(currentBanner)}
                      className="w-full py-2.5 px-3.5 rounded-xl font-extrabold text-xs border transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50"
                      style={{
                        color: currentBanner.primaryColor,
                        borderColor: currentBanner.primaryColor,
                        backgroundColor: currentBanner.badgeBg,
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isFr
                          ? `⚡ Ajouter les ${currentBanner.deals.length} rabais`
                          : `⚡ Add all ${currentBanner.deals.length} deals`}
                      </span>
                    </button>
                  </div>

                  {/* Shutter / Upload Bar (for scanning their own flyer photo) */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF7EE] border border-[#E8E1D5] mb-4">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-[#0D3B37]">
                        {isFr ? 'Vous avez votre propre circulaire ?' : 'Have your own paper flyer?'}
                      </p>
                      <p className="text-[10px] text-[#527470]">
                        {isFr ? 'Prenez-la en photo ou téléversez une capture :' : 'Snap a picture or upload a screenshot:'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-[#D5E1D2] text-[#0D3B37] text-xs font-bold flex items-center gap-1 shadow-2xs transition-transform active:scale-95 cursor-pointer"
                        title={isFr ? 'Importer capture' : 'Import image'}
                      >
                        <Upload className="w-3.5 h-3.5 text-teal-800" />
                        <span className="text-[10px]">{isFr ? 'Galerie' : 'Gallery'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-3 py-2 rounded-xl text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                        style={{ backgroundColor: currentBanner.primaryColor }}
                        title={isFr ? 'Photographier circulaire' : 'Snap flyer'}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span className="text-[10px]">{isFr ? 'Photo' : 'Camera'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Individual Deal Tiles Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#0D3B37] flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" style={{ color: currentBanner.primaryColor }} />
                        <span>
                          {isFr
                            ? `Rabais vedettes ${currentBanner.storeName} (${currentBanner.deals.length})`
                            : `Featured ${currentBanner.storeName} Deals (${currentBanner.deals.length})`}
                        </span>
                      </span>
                      <span className="text-[10px] text-[#527470]">
                        {isFr ? 'Cliquez pour ajouter au stock' : 'Tap to add to pantry'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentBanner.deals.map((deal, dIdx) => {
                        const displayName = isFr ? deal.nameFr : deal.nameEn;
                        const isYogurt = /yogourt|yogurt|oikos|iögo|iogo|astro|activia|liberté|liberte/i.test(displayName);

                        return (
                          <div
                            key={dIdx}
                            onClick={async () => {
                              const saved = await saveCandidateToInventory({
                                name: displayName,
                                nameFr: deal.nameFr,
                                nameEn: deal.nameEn,
                                brand: deal.brand,
                                category: deal.category,
                                quantity: deal.quantity,
                                unit: deal.unit,
                                netContent: deal.netContent,
                                price: deal.price,
                                recommendedLocation: deal.recommendedLocation,
                                estimatedShelfLifeDays: deal.estimatedShelfLifeDays,
                                unopenedShelfLifeDays: deal.unopenedShelfLifeDays,
                                openedShelfLifeDays: deal.openedShelfLifeDays,
                                monthsFrozenShelfLife: deal.monthsFrozenShelfLife,
                                dietaryBadges: deal.dietaryBadges,
                                gradeOrigin: deal.gradeOrigin,
                                packagingFormat: deal.packagingFormat,
                                storageTip: deal.storageTip,
                                storageReason: deal.storageReason,
                              });
                              onItemAdded(saved);
                              setSessionItems((prev) => [
                                {
                                  id: saved.id,
                                  name: saved.name,
                                  quantity: saved.quantity,
                                  unit: saved.unit,
                                  price: deal.price,
                                  locationName: deal.recommendedLocation,
                                  categoryName: deal.category,
                                  addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                },
                                ...prev,
                              ]);
                              showToast(
                                isFr ? `✓ Ajouté : ${displayName} (${deal.price})` : `✓ Added: ${displayName} (${deal.price})`,
                                'success'
                              );
                            }}
                            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-2xs ${
                              isYogurt
                                ? 'bg-blue-50/70 border-blue-200 hover:border-blue-400'
                                : 'bg-[#FAF7EE] border-[#E8E1D5] hover:border-slate-400'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9px] font-black uppercase text-[#527470]">
                                  {deal.brand}
                                </span>
                                {isYogurt && (
                                  <span className="text-[9px] font-black text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded">
                                    🥛 Yogourt
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-black text-[#0D3B37] truncate leading-tight mt-0.5">
                                {displayName}
                              </p>
                              <p className="text-[10px] text-[#527470] mt-0.5">
                                {deal.netContent || deal.unit} • {deal.category}
                              </p>
                            </div>

                            <div className="mt-2 flex items-center justify-between pt-1 border-t border-black/5">
                              <span
                                className="text-[11px] font-black px-2 py-0.5 rounded-md text-white shadow-2xs"
                                style={{ backgroundColor: currentBanner.primaryColor }}
                              >
                                {deal.price}
                              </span>
                              <span className="text-[11px] font-extrabold text-teal-800 hover:text-teal-950 flex items-center gap-0.5">
                                + {isFr ? 'Ajouter' : 'Add'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* RECEIPT MODE */}
          {activeMode === 'receipt' && (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full relative rounded-3xl bg-white border-2 border-amber-600/30 p-6 flex flex-col items-center text-center shadow-xs">
                <div className="flex items-center justify-center gap-6 my-2">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-14 h-14 rounded-2xl bg-[#FAF7EE] hover:bg-[#F2ECE0] border border-[#D5E1D2] text-[#0D3B37] flex flex-col items-center justify-center gap-0.5 shadow-xs transition-transform active:scale-95"
                  >
                    <Upload className="w-5 h-5 text-amber-700" />
                    <span className="text-[9px] font-extrabold text-[#527470]">
                      {lang === 'FR' ? 'Galerie' : 'Gallery'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-700 via-amber-600 to-yellow-500 text-white flex flex-col items-center justify-center shadow-xl border-4 border-[#FAF7EE] ring-4 ring-amber-500/30 hover:scale-105 active:scale-90 transition-all"
                  >
                    <FileText className="w-8 h-8 stroke-[2.2]" />
                  </button>
                </div>

                <div className="space-y-1 mt-2">
                  <p className="text-sm font-extrabold text-[#0D3B37]">
                    {lang === 'FR' ? 'Photographier le reçu d’épicerie' : 'Snap Grocery Receipt'}
                  </p>
                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? 'L’OCR lit les articles et les ajoute en arrière-plan.'
                      : 'OCR extracts items and saves them in the background.'}
                  </p>
                </div>

                {/* Paste receipt text */}
                <div className="w-full pt-4 mt-3 border-t border-[#F0EBE0] space-y-2 text-left">
                  <p className="text-[11px] font-bold text-[#0D3B37]">
                    {lang === 'FR' ? 'Ou coller le texte du reçu :' : 'Or paste receipt text:'}
                  </p>
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={receiptText}
                      onChange={(e) => setReceiptText(e.target.value)}
                      placeholder="Ex: 114890 ORG MILK 7.99&#10;POITRINES POULET 12.80"
                      className="flex-1 p-2 text-xs font-mono bg-[#FAF7EE] border border-[#D5E1D2] rounded-xl text-[#0D3B37] placeholder:text-slate-400 focus:outline-none focus:border-amber-600"
                    />
                    <button
                      type="button"
                      onClick={handleParseReceiptText}
                      disabled={isParsingReceipt || !receiptText.trim()}
                      className="px-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs shrink-0 transition-all"
                    >
                      {isParsingReceipt ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>{lang === 'FR' ? 'Ajouter' : 'Parse'}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BARCODE & CANADIAN GROCERY DB MODE */}
          {activeMode === 'barcode' && (
            <div className="p-5 rounded-3xl bg-white border border-[#D5E1D2] space-y-4 shadow-xs text-center">
              <div className="flex items-center justify-between gap-2 border-b border-[#F0EBE0] pb-3">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center shrink-0">
                    <Barcode className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#0D3B37]">
                      {lang === 'FR' ? 'Bases de Données d’Épicerie & Codes' : 'Grocery Databases & Barcodes'}
                    </p>
                    <p className="text-[10px] text-[#527470]">
                      {lang === 'FR'
                        ? 'Concentré sur les bases canadiennes et ouvertes'
                        : 'Focused on Canadian open food databases'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-1.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? 'Photo code' : 'Snap code'}</span>
                </button>
              </div>

              {/* Integrated Databases Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 py-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-900 border border-rose-200 flex items-center gap-1">
                  <span>🍁</span>
                  <span>{lang === 'FR' ? 'Fichier canadien (CNF)' : 'Canadian Nutrient File'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-1">
                  <span>🏷️</span>
                  <span>{lang === 'FR' ? 'Base PLU IFPS (Fruits & Légumes)' : 'IFPS PLU Produce'}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-900 border border-blue-200 flex items-center gap-1">
                  <span>🇨🇦</span>
                  <span>Open Food Facts (Canada)</span>
                </span>
              </div>

              {/* Barcode & PLU Code Direct Lookup Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookupUpc();
                }}
                className="space-y-1.5 text-left bg-[#FAF7EE] p-3 rounded-2xl border border-[#E8E2D5]"
              >
                <label className="text-[11px] font-bold text-[#0D3B37] flex items-center justify-between">
                  <span>{lang === 'FR' ? 'Code-barres UPC/EAN ou Code PLU fruit/légume :' : 'UPC/EAN Barcode or Produce PLU Code:'}</span>
                  <span className="text-[10px] text-teal-800 font-extrabold">{lang === 'FR' ? 'ex. 4051 (Mangue), 068700011039' : 'e.g. 4051 (Mango), 068700011039'}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={upcInput}
                    onChange={(e) => setUpcInput(e.target.value)}
                    placeholder={lang === 'FR' ? 'Tapez les 4 à 14 chiffres...' : 'Enter 4 to 14 digits...'}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold bg-white border border-[#D5E1D2] rounded-xl focus:border-blue-600 focus:outline-hidden text-[#0D3B37]"
                  />
                  <button
                    type="submit"
                    disabled={isLookingUpUpc || !upcInput.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white text-xs font-extrabold transition-all cursor-pointer shadow-xs"
                  >
                    {isLookingUpUpc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>{lang === 'FR' ? 'Résoudre' : 'Lookup'}</span>}
                  </button>
                </div>
                {upcError && <p className="text-[11px] text-rose-600 font-semibold">{upcError}</p>}
              </form>

              {/* Canadian Grocery Database Text Search */}
              <div className="space-y-2 text-left bg-white p-3 rounded-2xl border border-[#D5E1D2]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#0D3B37] flex items-center gap-1.5">
                    <span>🍁</span>
                    <span>{lang === 'FR' ? 'Recherche dans les BD canadiennes :' : 'Search Canadian Food DB:'}</span>
                  </span>
                  {isSearchingDb && (
                    <span className="text-[10px] font-bold text-teal-700 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      {lang === 'FR' ? 'Recherche...' : 'Searching...'}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={dbSearchQuery}
                    onChange={(e) => handleSearchDb(e.target.value)}
                    placeholder={lang === 'FR' ? 'Tapez un aliment canadien (ex: Lait, Mangue, Poulet, McIntosh, Beurre)...' : 'Type a Canadian staple (e.g. Milk, Mango, Chicken, McIntosh, Butter)...'}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7EE] border border-[#D5E1D2] rounded-xl focus:border-emerald-600 focus:outline-hidden text-[#0D3B37] placeholder:text-slate-400"
                  />
                  {dbSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setDbSearchQuery('');
                        setDbSearchResults([]);
                      }}
                      className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown List */}
                {dbSearchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1 divide-y divide-[#F0EBE0]">
                    {dbSearchResults.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleAddDbItem(item)}
                        className="p-2 rounded-xl hover:bg-[#FAF7EE] flex items-center justify-between gap-2 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-[#0D3B37] truncate">{item.name}</span>
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-rose-100 text-rose-900 border border-rose-200">
                              {item.source === 'CANADIAN_NUTRIENT_FILE' ? '🍁 CNF' : '🏷️ PLU'}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#527470] mt-0.5 truncate">
                            {item.brand && `${item.brand} • `}
                            {item.gradeOrigin || item.location}
                            {item.nutrition?.calories ? ` • ${item.nutrition.calories} kcal` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] shadow-2xs shrink-0 cursor-pointer"
                        >
                          + {lang === 'FR' ? 'Ajouter' : 'Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Canadian Staples & IFPS PLU Produce Chips */}
              <div className="space-y-1.5 text-left pt-1">
                <p className="text-xs font-extrabold text-[#0D3B37] flex items-center gap-1">
                  <span>⚡</span>
                  <span>{lang === 'FR' ? 'Ajout rapide — Produits canadiens & PLU vedettes :' : 'Quick Add — Canadian Staples & PLU Produce:'}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '🥭 Mangue Tommy Atkins (#4051)', code: '4051' },
                    { label: '🍌 Bananes fraîches (#4011)', code: '4011' },
                    { label: '🍎 Pommes McIntosh QC (#4152)', code: '4152' },
                    { label: '🍅 Tomates de serre QC (#4065)', code: '4065' },
                    { label: '🥒 Concombre anglais (#4062)', code: '4062' },
                    { label: '🥛 Lait 2% canadien (CNF)', code: '068700011039' },
                    { label: '🧈 Beurre Lactantia (CNF)', code: '055653670014' },
                    { label: '🧀 Fromage en grains (CNF)', code: '067000001018' },
                    { label: '🍗 Poitrine de poulet (CNF)', code: '060383182903' },
                    { label: '🍁 Sirop d’érable pur 100%', code: '062000123456' },
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleLookupUpc(preset.code)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#FAF7EE] hover:bg-blue-50 text-[#0D3B37] border border-[#D5E1D2] hover:border-blue-300 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer / Done Button */}
        <div className="p-4 border-t border-[#E8E2D5] bg-white/90 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0">
          {onOpenManualAdd ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenManualAdd();
              }}
              className="text-xs font-bold text-teal-800 hover:text-teal-900 underline underline-offset-2"
            >
              {lang === 'FR' ? 'Saisie manuelle >' : 'Manual keyboard add >'}
            </button>
          ) : (
            <div />
          )}

          <button
            id="scanner-done-footer-btn"
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-[#0E766E] hover:bg-[#0B5C56] text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>
              {sessionItems.length > 0
                ? lang === 'FR'
                  ? `Terminer (${sessionItems.length} article${sessionItems.length > 1 ? 's' : ''})`
                  : `Done (${sessionItems.length} item${sessionItems.length > 1 ? 's' : ''})`
                : lang === 'FR'
                ? 'Fermer'
                : 'Done'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
