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
} from 'lucide-react';
import { ScannedItemCandidate, InventoryItem } from '../types';
import { FoodVisualBadge } from './FoodVisualBadge';
import { useLanguage, getCategoryLocalizedName, getLocationLocalizedName } from '../utils/i18n';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: InventoryItem) => void;
  currentUser: { id: string; name: string };
  onOpenManualAdd?: () => void;
  initialMode?: 'snap' | 'receipt' | 'barcode' | 'upload' | 'presets' | 'recipe';
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
}

const SAMPLE_PRESETS = [
  {
    name: 'Produce & Dairy Cart',
    label: '🍓 Milk & Fresh Berries',
    items: [
      { name: 'Organic Whole Milk', category: 'Dairy & Eggs', quantity: 1, unit: 'carton (1 gal)', recommendedLocation: 'Fridge' as const, shelfLife: 7 },
      { name: 'Fresh Strawberries', category: 'Produce', quantity: 1, unit: 'clamshell (1 lb)', recommendedLocation: 'Fridge' as const, shelfLife: 4 },
    ],
  },
  {
    name: 'Pantry Cans',
    label: '🥫 Tomato Soup & Beans',
    items: [
      { name: 'Aylmer Tomato Soup', category: 'Pantry Staples', quantity: 2, unit: 'cans (284ml)', recommendedLocation: 'Pantry' as const, shelfLife: 365 },
      { name: 'Black Beans', category: 'Pantry Staples', quantity: 1, unit: 'can (540ml)', recommendedLocation: 'Pantry' as const, shelfLife: 365 },
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

  // Mode: 'photo' | 'receipt' | 'barcode' | 'recipe'
  const [activeMode, setActiveMode] = useState<'photo' | 'receipt' | 'barcode' | 'recipe'>('photo');

  // Background processing states
  const [activeJobsCount, setActiveJobsCount] = useState(0);
  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [latestToast, setLatestToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isTrayExpanded, setIsTrayExpanded] = useState(false);

  // Barcode / Receipt auxiliary inputs
  const [upcInput, setUpcInput] = useState('');
  const [isLookingUpUpc, setIsLookingUpUpc] = useState(false);
  const [upcError, setUpcError] = useState<string | null>(null);
  const [receiptText, setReceiptText] = useState('');
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Native hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Sync mode when opened
  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'receipt') {
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

    const chosenName =
      lang === 'FR'
        ? (candidate as any).nameFr || candidate.name
        : (candidate as any).nameEn || candidate.name;

    const payload = {
      name: chosenName,
      quantity: candidate.quantity || 1,
      unit: candidate.unit || 'pcs',
      locationName: candidate.recommendedLocation || 'Fridge',
      categoryName: candidate.category || 'Produce',
      expirationDate: exp,
      monthsFrozenShelfLife: candidate.monthsFrozenShelfLife || 6,
      notes,
      barcode: candidate.barcode || null,
      addedById: currentUser.id,
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

  // Process a single photo in the background without blocking the UI
  const processPhotoInBackground = async (compressedDataUrl: string, isReceipt = false) => {
    setActiveJobsCount((prev) => prev + 1);
    showToast(
      lang === 'FR'
        ? '⚡ Photo en cours de lecture en arrière-plan...'
        : '⚡ Reading photo in background...',
      'info',
      8000
    );

    try {
      const endpoint = isReceipt ? '/api/v1/inventory/scan-receipt-photo' : '/api/v1/inventory/scan';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressedDataUrl,
          mimeType: 'image/jpeg',
          language: lang,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Analysis failed');
      }

      const items: ScannedItemCandidate[] = data.items || [];
      if (items.length === 0) {
        showToast(
          lang === 'FR'
            ? 'Aucun aliment reconnu sur cette photo. Prenez-en une autre !'
            : 'No food items detected in that picture. Try another angle!',
          'error'
        );
        return;
      }

      // Automatically save each recognized item to the database in the background!
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
            notes: savedItem.notes ?? undefined,
            addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        } catch (err) {
          console.warn('Failed saving candidate:', itemCandidate.name, err);
        }
      }

      if (addedThisBatch.length > 0) {
        setSessionItems((prev) => [...addedThisBatch, ...prev]);
        const namesSummary = addedThisBatch.map((i) => i.name).join(', ');
        showToast(
          lang === 'FR'
            ? `✓ Ajouté en arrière-plan : ${namesSummary}`
            : `✓ Added in background: ${namesSummary}`,
          'success',
          5000
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
      const isReceipt = activeMode === 'receipt';
      const isRecipe = activeMode === 'recipe';
      const compressed = await compressFile(file, isReceipt || isRecipe ? 2000 : 1600);
      if (compressed) {
        if (isRecipe) {
          processRecipeInBackground(compressed);
        } else {
          processPhotoInBackground(compressed, isReceipt);
        }
      }
    }
  };

  // Barcode Lookup handler
  const handleLookupUpc = async (codeToLookup?: string) => {
    const code = (codeToLookup || upcInput).trim().replace(/[^0-9]/g, '');
    if (!code || code.length < 6) {
      setUpcError(lang === 'FR' ? 'Entrez un code-barres valide (8 à 14 chiffres).' : 'Enter a valid 8-14 digit UPC or EAN code.');
      return;
    }

    setIsLookingUpUpc(true);
    setUpcError(null);

    try {
      const res = await fetch(`/api/v1/inventory/barcode/${code}?language=${lang}`);
      const data = await res.json();
      if (!res.ok || !data.success || !data.item) {
        throw new Error(data.error || 'Barcode could not be found.');
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
        addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessionItems((prev) => [sessionEntry, ...prev]);
      setUpcInput('');
      showToast(
        lang === 'FR'
          ? `✓ Code-barres ajouté : ${savedItem.name}`
          : `✓ Added barcode item: ${savedItem.name}`,
        'success'
      );
    } catch (err: any) {
      setUpcError(err.message || 'Failed to lookup barcode.');
    } finally {
      setIsLookingUpUpc(false);
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
        const savedItem = await saveCandidateToInventory({
          name: pItem.name,
          category: pItem.category,
          quantity: pItem.quantity,
          unit: pItem.unit,
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

        {/* Mode Selector (Subtle, secondary switch) */}
        <div className="px-5 pt-2 pb-1 shrink-0 flex items-center justify-between">
          <div className="inline-flex p-1 bg-[#EBE5D6] rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveMode('photo')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                activeMode === 'photo'
                  ? 'bg-white text-[#0D3B37] shadow-xs'
                  : 'text-[#607464] hover:text-[#0D3B37]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{lang === 'FR' ? 'Photo d’aliments' : 'Food Photos'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('receipt')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                activeMode === 'receipt'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-[#607464] hover:text-amber-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>{lang === 'FR' ? 'Reçu' : 'Receipt'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('barcode')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                activeMode === 'barcode'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-[#607464] hover:text-blue-900'
              }`}
            >
              <Barcode className="w-3.5 h-3.5 text-blue-700" />
              <span>{lang === 'FR' ? 'Code-barres' : 'Barcode'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('recipe');
                setTimeout(() => cameraInputRef.current?.click(), 100);
              }}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                activeMode === 'recipe'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-[#607464] hover:text-emerald-900'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'FR' ? 'Recette' : 'Recipe'}</span>
            </button>
          </div>

          {sessionItems.length > 0 && (
            <span className="text-xs font-extrabold text-[#0D3B37]">
              {sessionItems.length} {lang === 'FR' ? 'ajouté(s)' : 'added'}
            </span>
          )}
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
                      : (lang === 'FR' ? 'Appuyez pour photographier' : 'Tap to take a picture')}
                  </p>
                  <p className="text-xs text-[#527470] max-w-sm mx-auto">
                    {activeMode === 'recipe'
                      ? (lang === 'FR'
                        ? 'L’IA et l’OCR numérisent la recette et l’enregistrent directement dans vos Idées Repas.'
                        : 'AI & OCR will digitize the recipe and save it directly to your kitchen recipe collection.')
                      : (lang === 'FR'
                        ? 'Prenez une photo, puis une autre : les aliments s’enregistrent automatiquement en arrière-plan sans bloquer l’écran.'
                        : 'Snap one picture, then another: foods are recognized and saved automatically in the background.')}
                  </p>
                </div>
              </div>

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
                      <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 animate-fade-in">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FoodVisualBadge itemName={item.name} categoryName={item.categoryName} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#0D3B37] truncate">{item.name}</p>
                            <p className="text-[10px] text-[#527470]">
                              {item.quantity} {item.unit} • {getLocationLocalizedName(item.locationName, lang)} • {item.addedAt}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                          {lang === 'FR' ? '✓ Ajouté' : '✓ Added'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

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

          {/* BARCODE MODE */}
          {activeMode === 'barcode' && (
            <div className="p-5 rounded-3xl bg-white border border-[#D5E1D2] space-y-3 shadow-xs text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center">
                <Barcode className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black text-[#0D3B37]">
                  {lang === 'FR' ? 'Scanner ou Entrer un Code-barres' : 'Scan or Enter Barcode'}
                </p>
                <p className="text-[11px] text-[#527470]">
                  {lang === 'FR'
                    ? 'Prenez le code en photo ou tapez les chiffres pour l’ajouter automatiquement.'
                    : 'Snap barcode photo or enter digits to add instantly in the background.'}
                </p>
              </div>

              <div className="flex justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-2 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? 'Photo du Code-barres' : 'Snap Barcode Photo'}</span>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookupUpc();
                }}
                className="space-y-2 pt-2 text-left"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={upcInput}
                    onChange={(e) => setUpcInput(e.target.value)}
                    placeholder="e.g. 011110816850"
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold bg-[#FAF7EE] border border-[#D5E1D2] rounded-xl focus:border-blue-600 focus:outline-none text-[#0D3B37]"
                  />
                  <button
                    type="submit"
                    disabled={isLookingUpUpc || !upcInput.trim()}
                    className="px-4 py-2 rounded-xl bg-[#0D3B37] hover:bg-[#072421] disabled:opacity-50 text-white text-xs font-bold transition-all"
                  >
                    {isLookingUpUpc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>{lang === 'FR' ? 'Ajouter' : 'Add'}</span>}
                  </button>
                </div>
                {upcError && <p className="text-[11px] text-rose-600 font-medium">{upcError}</p>}
              </form>
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
