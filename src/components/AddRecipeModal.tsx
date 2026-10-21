import React, { useState, useEffect } from 'react';
import { Youtube } from './icons/Youtube';
import {
  X,
  Sparkles,
  FileText,
  Camera,
  Upload,
  Clock,
  Flame,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  ChefHat,
  AlertCircle,
  Play,
  RotateCcw,
  Layers,
  Globe,
  Languages,
  Link as LinkIcon,
  SlidersHorizontal,
  BookmarkPlus,
  Compass,
  Eye,
  Video,
  RefreshCw,
  Pencil,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Lock,
  Unlock,
  Zap,
} from 'lucide-react';
import { RicardoRecipe } from '../data/ricardoRecipes';
import { useLanguage } from '../utils/i18n';
import { useAlertToast } from '../contexts/AlertToastContext';
import {
  ensureBilingualRecipe,
  getRecipeDisplayTitle,
  getRecipeDisplayDescription,
  getRecipeDisplayInstructions,
  getItemDisplayName,
  translateFoodItem,
} from '../utils/foodTranslator';
import {
  RecipeWebsiteSource,
  getStoredRecipeWebsites,
  saveStoredRecipeWebsites,
} from '../data/recipeWebsites';
import {
  estimateRecipeNutrition,
  recalculateDynamicNutrition,
  estimateIngredientNutrition,
} from '../services/nutritionEngine';

export interface RecipeIngredient {
  id: string;
  amount: string; // e.g. "1", "1/2", "250"
  unit: string; // e.g. "cup", "tsp", "ml", "to_taste", "unit"
  name: string; // e.g. "Huile d'olive"
  storage: string; // e.g. "pantry", "fridge", "freezer", "spices"
  nameFr?: string;
  nameEn?: string;
  category?: string;
  locationType?: 'FRIDGE' | 'FREEZER' | 'PANTRY' | 'SPICE_RACK';
  inKitchenItemName?: string;
  estimatedKcal?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
}

export function parseAmountAndUnit(rawAmount: string = ''): { amount: string; unit: string } {
  const str = (rawAmount || '').trim();
  if (!str) return { amount: '1', unit: 'unit' };

  const lower = str.toLowerCase();

  // Check for to_taste / au goût
  if (
    lower.includes('au goût') ||
    lower.includes('au gout') ||
    lower.includes('to taste') ||
    lower.includes('as needed') ||
    lower === '—' ||
    lower === '-'
  ) {
    return { amount: '', unit: 'to_taste' };
  }

  // Regex to match leading number or fraction (e.g. 1, 1.5, 1/2, 2 1/2, 250)
  const numMatch = str.match(/^([0-9]+(?:\.[0-9]+)?(?:\s*[\/\-]\s*[0-9]+)?|\d+\/\d+|\d+)\s*(.*)$/);

  if (!numMatch) {
    return { amount: str, unit: 'unit' };
  }

  const detectedAmount = numMatch[1].trim();
  const rest = (numMatch[2] || '').trim().toLowerCase();

  if (!rest) {
    return { amount: detectedAmount, unit: 'unit' };
  }

  if (/^(c\.?\s*à\s*t(?:hé)?|c\.?à\.?t|cuill(?:è|e)re?s?\s*à\s*thé|tsp|teaspoon(?:s)?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'tsp' };
  }
  if (/^(c\.?\s*à\s*s(?:oupe)?|c\.?à\.?s|cuill(?:è|e)re?s?\s*à\s*soupe|tbsp|tablespoon(?:s)?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'tbsp' };
  }
  if (/^(tasse(?:s)?|cup(?:s)?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'cup' };
  }
  if (/^(pincée(?:s)?|pincee(?:s)?|pinch(?:es)?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'pinch' };
  }
  if (/^(ml|millilitre(?:s)?|milliliter(?:s)?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'ml' };
  }
  if (/^(l|litre(?:s)?|liter(?:s)?)\b/i.test(rest)) {
    return { amount: detectedAmount, unit: 'l' };
  }
  if (/^(kg|kilogramme(?:s)?|kilogram(?:s)?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'kg' };
  }
  if (/^(g|gramme(?:s)?|gram(?:s)?)\b/i.test(rest)) {
    return { amount: detectedAmount, unit: 'g' };
  }
  if (/^(fl\s*oz|fluid\s*ounce(?:s)?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'fl_oz' };
  }
  if (/^(oz|ounce(?:s)?|once(?:s)?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'oz' };
  }
  if (/^(lb(?:s)?|pound(?:s)?|livre(?:s)?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'lb' };
  }
  if (/^(gousse(?:s)?|clove(?:s)?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'clove' };
  }
  if (/^(tranche(?:s)?|slice(?:s)?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'slice' };
  }
  if (/^(bo[îi]te(?:s)?|conserve(?:s)?|can(?:s)?|tin(?:s)?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'can' };
  }
  if (/^(botte(?:s)?|bunch(?:es)?|bundle(?:s)?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'bunch' };
  }
  if (/^(sachet(?:s)?|paquet(?:s)?|packet(?:s)?|pouch(?:es)?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'packet' };
  }
  if (/^(pi[èe]ce(?:s)?|piece(?:s)?|morceau(?:x)?|pcs?\.?)/i.test(rest)) {
    return { amount: detectedAmount, unit: 'piece' };
  }

  return { amount: detectedAmount, unit: 'unit' };
}

export function normalizeStorage(
  storage?: string,
  locationType?: string,
  name?: string
): { storage: string; locationType: 'FRIDGE' | 'FREEZER' | 'PANTRY' | 'SPICE_RACK' } {
  const s = (storage || '').toLowerCase().trim();
  if (s === 'spices' || s === 'épices' || s === 'epices' || locationType === 'SPICE_RACK') {
    return { storage: 'spices', locationType: 'SPICE_RACK' };
  }
  if (s === 'freezer' || s === 'congélateur' || s === 'congelateur' || locationType === 'FREEZER') {
    return { storage: 'freezer', locationType: 'FREEZER' };
  }
  if (s === 'fridge' || s === 'frigo' || locationType === 'FRIDGE') {
    return { storage: 'fridge', locationType: 'FRIDGE' };
  }
  if (s === 'pantry' || s === 'garde-manger' || locationType === 'PANTRY') {
    return { storage: 'pantry', locationType: 'PANTRY' };
  }
  const n = (name || '').toLowerCase();
  if (
    /sel|poivre|paprika|curry|cumin|origan|thym|cannelle|épice|muscade|spices|pepper|salt|cinnamon|oregano|thyme|chili|clove|paminta|laurel/i.test(
      n
    )
  ) {
    return { storage: 'spices', locationType: 'SPICE_RACK' };
  }
  return { storage: 'pantry', locationType: 'PANTRY' };
}

export function normalizeRecipeIngredient(ing: any, idx: number = 0): RecipeIngredient {
  const parsed = parseAmountAndUnit(ing.amount);
  const unit = ing.unit || parsed.unit || 'unit';
  const amount = unit === 'to_taste' ? '' : (ing.amount && ing.unit ? ing.amount : parsed.amount || '1');
  const { storage, locationType } = normalizeStorage(ing.storage, ing.locationType, ing.name || ing.nameFr);

  let rawName = (ing.name || ing.nameEn || ing.nameFr || '').trim();
  let rawNameFr = (ing.nameFr || '').trim();
  let rawNameEn = (ing.nameEn || ing.name || '').trim();

  // Strip accidental duplicated leading amounts or units if present in name string
  const leadingNoiseRegex = /^(\d+\s*[\/\-]\s*\d+|\d+(?:\.\d+)?|\d+)\s*(?:tbsp|tsp|cup|g|kg|ml|l|lb|oz|clove|slice|can|bunch|packet|piece|c\.?\s*à\s*s|c\.?\s*à\s*t|tasse|gousse|bo[îi]te|morceau|pincée)?\s*(?:of\s+|de\s+|d['’]\s*)?/i;
  rawName = rawName.replace(leadingNoiseRegex, '').trim();
  rawNameFr = rawNameFr.replace(leadingNoiseRegex, '').trim();
  rawNameEn = rawNameEn.replace(leadingNoiseRegex, '').trim();

  if (!rawNameFr && rawNameEn) {
    rawNameFr = translateFoodItem(rawNameEn, 'FR');
  }

  return {
    id: ing.id || `ing-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    amount,
    unit,
    name: rawName || rawNameEn || ing.name || '',
    nameFr: rawNameFr || ing.nameFr || '',
    nameEn: rawNameEn || ing.nameEn || '',
    storage,
    locationType,
    category: ing.category || 'Pantry Staples',
    inKitchenItemName: ing.inKitchenItemName,
    estimatedKcal: ing.estimatedKcal,
    proteinGrams: ing.proteinGrams,
    carbsGrams: ing.carbsGrams,
    fatGrams: ing.fatGrams,
  };
}

export function normalizeRecipe(recipe: any, activeLang: 'EN' | 'FR' = 'FR'): RicardoRecipe | null {
  if (!recipe) return null;
  const bilingual = ensureBilingualRecipe(recipe, activeLang);
  return {
    ...bilingual,
    ingredients: (bilingual.ingredients || []).map((ing: any, idx: number) =>
      normalizeRecipeIngredient(ing, idx)
    ),
  };
}

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeSaved: (recipe: RicardoRecipe) => void;
  lang?: 'EN' | 'FR';
  initialTab?: 'url' | 'youtube' | 'text' | 'photo';
  autoOpenCam?: boolean;
  initialPhotoBase64?: string | null;
  recipeToEdit?: RicardoRecipe | null;
}

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({
  isOpen,
  onClose,
  onRecipeSaved,
  lang: propLang,
  initialTab = 'url',
  autoOpenCam = false,
  initialPhotoBase64 = null,
  recipeToEdit = null,
}) => {
  const { lang: globalLang } = useLanguage();
  const lang = propLang || globalLang;
  const { confirmAction, showToast } = useAlertToast();

  // Tabs: url, youtube, text, photo
  const [activeTab, setActiveTab] = useState<'url' | 'youtube' | 'text' | 'photo'>(initialTab);

  // Input states
  const [webUrl, setWebUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeNotes, setYoutubeNotes] = useState('');
  const [recipeText, setRecipeText] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState('image/jpeg');

  // Camera & Live Viewfinder refs & states
  const cameraAppInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Auto-translate preference on import (defaults to true)
  const [autoTranslateOnImport, setAutoTranslateOnImport] = useState(true);

  // Stored recipe websites management
  const [storedWebsites, setStoredWebsites] = useState<RecipeWebsiteSource[]>([]);
  const [showWebsiteManager, setShowWebsiteManager] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');

  // Live website content discovery states
  const [isInspectingWebsite, setIsInspectingWebsite] = useState(false);
  const [inspectedSiteName, setInspectedSiteName] = useState<string | null>(null);
  const [discoveredWebsiteRecipes, setDiscoveredWebsiteRecipes] = useState<any[]>([]);
  const [inspectionNotice, setInspectionNotice] = useState<string | null>(null);
  const [importingDiscoveredId, setImportingDiscoveredId] = useState<string | null>(null);

  // Processing states
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Review & Edit state after AI has parsed or when editing existing recipe
  const [parsedRecipe, setParsedRecipe] = useState<RicardoRecipe | null>(() => {
    return recipeToEdit ? normalizeRecipe(recipeToEdit, lang) : null;
  });

  // Synchronize when editing an existing recipe
  useEffect(() => {
    if (recipeToEdit && isOpen) {
      setParsedRecipe(normalizeRecipe(recipeToEdit, lang));
    } else if (!isOpen && !recipeToEdit) {
      setParsedRecipe(null);
    }
  }, [recipeToEdit, isOpen, lang]);

  // Helper methods for editing ingredients
  const handleAddIngredient = () => {
    setParsedRecipe((prev) => {
      if (!prev) return null;
      const newIng: RecipeIngredient = {
        id: `ing-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: '',
        nameFr: '',
        amount: '1',
        unit: 'unit',
        storage: 'pantry',
        locationType: 'PANTRY',
        category: 'Pantry Staples',
        estimatedKcal: 80,
      };
      const copy = [...(prev.ingredients || []), newIng];
      let nextCal = prev.calories;
      let nextPerServing = prev.caloriesPerServing;
      let nextTotalCal = prev.totalCalories;
      let nextMacros = prev.macrosPerServing;
      let nextMethod = prev.calculationMethod || 'DYNAMIC_AGGREGATED';

      if (prev.calculationMethod !== 'MANUAL_OVERRIDE') {
        const servingsNum = parseInt(prev.servings?.replace(/\D/g, '') || '4', 10) || 4;
        const dyn = recalculateDynamicNutrition(copy, servingsNum);
        nextCal = `${dyn.caloriesPerServing} kcal`;
        nextPerServing = dyn.caloriesPerServing;
        nextTotalCal = dyn.totalCalories;
        nextMacros = dyn.macrosPerServing;
        nextMethod = 'DYNAMIC_AGGREGATED';
      }

      return {
        ...prev,
        ingredients: copy,
        calories: nextCal,
        caloriesPerServing: nextPerServing,
        totalCalories: nextTotalCal,
        macrosPerServing: nextMacros,
        calculationMethod: nextMethod,
      };
    });
  };

  const handleUpdateIngredient = (index: number, updates: Partial<RecipeIngredient>) => {
    setParsedRecipe((prev) => {
      if (!prev) return null;
      const copy = [...(prev.ingredients || [])];
      if (!copy[index]) return prev;
      const merged = { ...copy[index], ...updates };
      const nut = estimateIngredientNutrition(merged.name, merged.amount || 1, merged.unit || 'g');
      merged.estimatedKcal = nut.estimatedKcal;
      merged.proteinGrams = nut.proteinGrams;
      merged.carbsGrams = nut.carbsGrams;
      merged.fatGrams = nut.fatGrams;
      copy[index] = merged;

      let nextCal = prev.calories;
      let nextPerServing = prev.caloriesPerServing;
      let nextTotalCal = prev.totalCalories;
      let nextMacros = prev.macrosPerServing;
      let nextMethod = prev.calculationMethod || 'DYNAMIC_AGGREGATED';

      if (prev.calculationMethod !== 'MANUAL_OVERRIDE') {
        const servingsNum = parseInt(prev.servings?.replace(/\D/g, '') || '4', 10) || 4;
        const dyn = recalculateDynamicNutrition(copy, servingsNum);
        nextCal = `${dyn.caloriesPerServing} kcal`;
        nextPerServing = dyn.caloriesPerServing;
        nextTotalCal = dyn.totalCalories;
        nextMacros = dyn.macrosPerServing;
        nextMethod = 'DYNAMIC_AGGREGATED';
      }

      return {
        ...prev,
        ingredients: copy,
        calories: nextCal,
        caloriesPerServing: nextPerServing,
        totalCalories: nextTotalCal,
        macrosPerServing: nextMacros,
        calculationMethod: nextMethod,
      };
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setParsedRecipe((prev) => {
      if (!prev) return null;
      const copy = (prev.ingredients || []).filter((_, i) => i !== index);
      let nextCal = prev.calories;
      let nextPerServing = prev.caloriesPerServing;
      let nextTotalCal = prev.totalCalories;
      let nextMacros = prev.macrosPerServing;
      let nextMethod = prev.calculationMethod || 'DYNAMIC_AGGREGATED';

      if (prev.calculationMethod !== 'MANUAL_OVERRIDE') {
        const servingsNum = parseInt(prev.servings?.replace(/\D/g, '') || '4', 10) || 4;
        const dyn = recalculateDynamicNutrition(copy, servingsNum);
        nextCal = `${dyn.caloriesPerServing} kcal`;
        nextPerServing = dyn.caloriesPerServing;
        nextTotalCal = dyn.totalCalories;
        nextMacros = dyn.macrosPerServing;
        nextMethod = 'DYNAMIC_AGGREGATED';
      }

      return {
        ...prev,
        ingredients: copy,
        calories: nextCal,
        caloriesPerServing: nextPerServing,
        totalCalories: nextTotalCal,
        macrosPerServing: nextMacros,
        calculationMethod: nextMethod,
      };
    });
  };

  // Helper methods for editing instruction steps
  const handleAddInstructionStep = () => {
    setParsedRecipe((prev) => {
      if (!prev) return null;
      const isFr = lang === 'FR';
      if (isFr) {
        const cur = prev.instructionsFr && prev.instructionsFr.length > 0 ? prev.instructionsFr : (prev.instructionsEn || []);
        return { ...prev, instructionsFr: [...cur, ''] };
      } else {
        const cur = prev.instructionsEn && prev.instructionsEn.length > 0 ? prev.instructionsEn : (prev.instructionsFr || []);
        return { ...prev, instructionsEn: [...cur, ''] };
      }
    });
  };

  const handleUpdateInstructionStep = (index: number, value: string) => {
    setParsedRecipe((prev) => {
      if (!prev) return null;
      const isFr = lang === 'FR';
      if (isFr) {
        const copy = [...(prev.instructionsFr && prev.instructionsFr.length > 0 ? prev.instructionsFr : prev.instructionsEn || [])];
        copy[index] = value;
        return { ...prev, instructionsFr: copy };
      } else {
        const copy = [...(prev.instructionsEn && prev.instructionsEn.length > 0 ? prev.instructionsEn : prev.instructionsFr || [])];
        copy[index] = value;
        return { ...prev, instructionsEn: copy };
      }
    });
  };

  const handleRemoveInstructionStep = (index: number) => {
    setParsedRecipe((prev) => {
      if (!prev) return null;
      const isFr = lang === 'FR';
      if (isFr) {
        const copy = (prev.instructionsFr && prev.instructionsFr.length > 0 ? prev.instructionsFr : prev.instructionsEn || []).filter((_, i) => i !== index);
        return { ...prev, instructionsFr: copy };
      } else {
        const copy = (prev.instructionsEn && prev.instructionsEn.length > 0 ? prev.instructionsEn : prev.instructionsFr || []).filter((_, i) => i !== index);
        return { ...prev, instructionsEn: copy };
      }
    });
  };

  const handleMoveInstructionStep = (index: number, direction: 'up' | 'down') => {
    setParsedRecipe((prev) => {
      if (!prev) return null;
      const isFr = lang === 'FR';
      const steps = [...(isFr ? (prev.instructionsFr && prev.instructionsFr.length > 0 ? prev.instructionsFr : prev.instructionsEn || []) : (prev.instructionsEn && prev.instructionsEn.length > 0 ? prev.instructionsEn : prev.instructionsFr || []))];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= steps.length) return prev;
      const temp = steps[index];
      steps[index] = steps[targetIdx];
      steps[targetIdx] = temp;
      return isFr ? { ...prev, instructionsFr: steps } : { ...prev, instructionsEn: steps };
    });
  };

  // Stop live camera stream cleanly
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsLiveCameraActive(false);
  };

  // Start live in-app camera viewfinder
  const startLiveCamera = async (facing: 'environment' | 'user' = cameraFacingMode) => {
    setCameraError(null);
    stopLiveCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraFacingMode(facing);
      setIsLiveCameraActive(true);
    } catch (err: any) {
      console.error('Live camera error:', err);
      setCameraError(
        lang === 'FR'
          ? "Impossible d'accéder au flux vidéo direct. Utilisez le bouton 'Ouvrir l'application Caméra' natif ci-dessous."
          : "Could not access live camera stream. Please use the native 'Open Camera App' button below."
      );
      setIsLiveCameraActive(false);
    }
  };

  // Toggle front/back camera
  const toggleFacingMode = () => {
    const nextFacing = cameraFacingMode === 'environment' ? 'user' : 'environment';
    startLiveCamera(nextFacing);
  };

  // Snap photo from in-app live camera viewfinder
  // Function to execute photo parsing immediately
  const triggerPhotoImport = async (base64Data: string) => {
    setIsParsing(true);
    setParsedRecipe(null);
    setParsingStep(
      lang === 'FR'
        ? 'Numérisation OCR & extraction IA de votre fiche recette...'
        : 'Running OCR & AI extraction on your recipe card...'
    );
    setErrorMsg(null);
    try {
      const res = await fetch('/api/v1/recipes/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'photo',
          language: lang,
          imageBase64: base64Data,
          mimeType: 'image/jpeg',
          autoTranslate: autoTranslateOnImport,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse recipe photo');
      }

      setParsedRecipe(normalizeRecipe(data.recipe));
    } catch (err: any) {
      console.error('AI Parse/Import failed:', err);
      setErrorMsg(err.message || 'Error communicating with AI service');
    } finally {
      setIsParsing(false);
      setParsingStep('');
    }
  };

  // Snap photo from in-app live camera viewfinder
  const captureLiveSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUri = canvas.toDataURL('image/jpeg', 0.9);
      setPhotoBase64(dataUri);
      setPhotoMimeType('image/jpeg');
      setErrorMsg(null);
      triggerPhotoImport(dataUri);
    }
    stopLiveCamera();
  };

  // Handle files selected from native camera input or gallery
  const handlePhotoPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset value so snapping the same angle again triggers onChange
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const maxDim = 1600;
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
        const compressedUri = ctx
          ? (() => {
              ctx.drawImage(img, 0, 0, width, height);
              return canvas.toDataURL('image/jpeg', 0.9);
            })()
          : (event.target?.result as string);

        setPhotoBase64(compressedUri);
        setPhotoMimeType('image/jpeg');
        setErrorMsg(null);
        triggerPhotoImport(compressedUri);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Stop camera when closing modal or switching tabs
  useEffect(() => {
    if (!isOpen || activeTab !== 'photo') {
      stopLiveCamera();
    }
  }, [isOpen, activeTab]);

  // Load recipe websites on mount or open and sync initial tab
  useEffect(() => {
    if (isOpen) {
      setStoredWebsites(getStoredRecipeWebsites());
      if (recipeToEdit) {
        setParsedRecipe(normalizeRecipe(recipeToEdit, lang));
        setPhotoBase64(null);
        setErrorMsg(null);
      } else if (initialPhotoBase64) {
        setPhotoBase64(initialPhotoBase64);
        setActiveTab('photo');
        setParsedRecipe(null);
        triggerPhotoImport(initialPhotoBase64);
      } else if (initialTab) {
        setActiveTab(initialTab);
        setParsedRecipe(null);
      }
    } else {
      setParsedRecipe(null);
      setPhotoBase64(null);
      setErrorMsg(null);
      setParsingStep('');
      setIsParsing(false);
    }
  }, [isOpen, initialTab, initialPhotoBase64, recipeToEdit, lang]);

  // If autoOpenCam is enabled and no photo has been provided yet, open camera shutter
  useEffect(() => {
    if (isOpen && activeTab === 'photo' && autoOpenCam && !photoBase64 && !initialPhotoBase64) {
      const timer = setTimeout(() => {
        cameraAppInputRef.current?.click();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, autoOpenCam, photoBase64, initialPhotoBase64]);

  if (!isOpen) return null;

  // Extract YouTube ID helper for preview
  const extractYtId = (url: string) => {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
    );
    return match ? match[1] : null;
  };

  const detectedYtId = extractYtId(youtubeUrl);

  // Handle adding a custom recipe website
  const handleAddCustomWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim() || !newSiteUrl.trim()) return;

    let cleanUrl = newSiteUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let domain = cleanUrl;
    try {
      domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
    } catch {
      // keep fallback
    }

    const newSite: RecipeWebsiteSource = {
      id: `custom_${Date.now()}`,
      name: newSiteName.trim(),
      url: cleanUrl,
      domain,
      language: lang === 'FR' ? 'FR' : 'BOTH',
      enabled: true,
      description: 'Custom recipe website added by user.',
      descriptionFr: 'Site de recettes personnalisé ajouté par l’utilisateur.',
    };

    const updated = [newSite, ...storedWebsites];
    setStoredWebsites(updated);
    saveStoredRecipeWebsites(updated);
    setNewSiteName('');
    setNewSiteUrl('');

    // Automatically inspect the newly added website to discover recipes immediately!
    handleLookIntoWebsite(cleanUrl, newSite.name);
  };

  // Look through content and extract live recipes from a website
  const handleLookIntoWebsite = async (targetUrlOrDomain: string, siteName?: string) => {
    if (!targetUrlOrDomain.trim()) return;
    setIsInspectingWebsite(true);
    setErrorMsg(null);
    const displayName =
      siteName ||
      targetUrlOrDomain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];
    setInspectedSiteName(displayName);
    setInspectionNotice(
      lang === 'FR'
        ? `Exploration en direct des recettes de ${displayName}...`
        : `Looking through recipes published on ${displayName}...`
    );

    try {
      const res = await fetch('/api/v1/recipes/look-into-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrlOrDomain.trim(),
          language: lang,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.recipes) && data.recipes.length > 0) {
        setDiscoveredWebsiteRecipes(data.recipes);
        setInspectionNotice(
          lang === 'FR'
            ? `✅ ${data.recipes.length} recettes extraites de ${displayName}. Choisissez-en une ci-dessous !`
            : `✅ ${data.recipes.length} recipes discovered on ${displayName}. Pick one below to import!`
        );
      } else {
        setDiscoveredWebsiteRecipes([]);
        setInspectionNotice(
          lang === 'FR'
            ? `Aucune recette directe n’a pu être extraite de ce site pour l’instant.`
            : `No direct recipes could be extracted from this site at this time.`
        );
      }
    } catch (err: any) {
      console.error('Look into website failed:', err);
      setInspectionNotice(
        lang === 'FR'
          ? `Erreur lors de l’analyse du contenu du site.`
          : `Error inspecting website content.`
      );
    } finally {
      setIsInspectingWebsite(false);
    }
  };

  // Convert a discovered website recipe directly into parsed recipe with full link-parsing mechanics & bilingual steps
  const handleSelectDiscoveredRecipe = async (recipe: any) => {
    const recipeUniqueId = recipe.id || recipe.title;
    setImportingDiscoveredId(recipeUniqueId);
    setIsParsing(true);
    setErrorMsg(null);
    setParsingStep(
      lang === 'FR'
        ? `Connexion à ${recipe.source || 'la source culinaire'}...`
        : `Connecting to ${recipe.source || 'culinary source'}...`
    );

    const stepTimer1 = setTimeout(() => {
      setParsingStep(
        lang === 'FR'
          ? 'Extraction des ingrédients et étapes bilingues...'
          : 'Extracting ingredients & bilingual cooking steps...'
      );
    }, 700);

    const stepTimer2 = setTimeout(() => {
      setParsingStep(
        lang === 'FR'
          ? 'Zonage garde-manger et préparation de la fiche...'
          : 'Mapping kitchen storage zones and preparing review...'
      );
    }, 1400);

    try {
      const sourceUrl = recipe.sourceUrl || recipe.ricardoUrlFr || recipe.ricardoUrlEn || '';
      const hasValidUrl = typeof sourceUrl === 'string' && sourceUrl.startsWith('http');

      let importedRecipeData: any = null;

      if (hasValidUrl) {
        try {
          const res = await fetch('/api/v1/recipes/import-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: sourceUrl.trim(),
              language: lang,
              autoTranslate: autoTranslateOnImport,
              fallbackRecipe: recipe,
            }),
          });
          const data = await res.json();
          if (res.ok && data.success && data.recipe) {
            importedRecipeData = data.recipe;
          }
        } catch (fetchErr) {
          console.warn('URL scraper error for discovered recipe, synthesizing steps:', fetchErr);
        }
      }

      // Check existing bilingual steps
      const existingStepsEn = Array.isArray(importedRecipeData?.instructionsEn) && importedRecipeData.instructionsEn.length > 0
        ? importedRecipeData.instructionsEn
        : (Array.isArray(recipe.instructionsEn) && recipe.instructionsEn.length > 0 ? recipe.instructionsEn : []);
      const existingStepsFr = Array.isArray(importedRecipeData?.instructionsFr) && importedRecipeData.instructionsFr.length > 0
        ? importedRecipeData.instructionsFr
        : (Array.isArray(recipe.instructionsFr) && recipe.instructionsFr.length > 0 ? recipe.instructionsFr : []);

      let finalStepsEn = existingStepsEn;
      let finalStepsFr = existingStepsFr;

      // If either instruction language is missing or empty, synthesize via backend
      if (finalStepsEn.length === 0 || finalStepsFr.length === 0) {
        try {
          const synthRes = await fetch('/api/v1/recipes/synthesize-steps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: recipe.title,
              titleFr: recipe.titleFr,
              ingredients: recipe.ingredients || [],
              sourceUrl: recipe.sourceUrl,
              language: lang,
              description: recipe.descriptionEn || recipe.zeroWasteReason,
            }),
          });
          const synthData = await synthRes.json();
          if (synthData.success) {
            finalStepsEn = synthData.instructionsEn || finalStepsEn;
            finalStepsFr = synthData.instructionsFr || finalStepsFr;
          }
        } catch (synthErr) {
          console.warn('Step synthesis request error:', synthErr);
        }
      }

      const rawIngredients = importedRecipeData?.ingredients || recipe.ingredients || [];
      const normalizedIngredients = rawIngredients.map((ing: any, idx: number) =>
        normalizeRecipeIngredient(ing, idx)
      );

      const mapped: RicardoRecipe = {
        id: recipe.id || `custom_${Date.now()}`,
        title: importedRecipeData?.title || recipe.title || 'Imported Recipe',
        titleFr: importedRecipeData?.titleFr || recipe.titleFr || recipe.title || 'Recette Importée',
        titleEn: importedRecipeData?.titleEn || recipe.title || 'Imported Recipe',
        ricardoUrlEn: sourceUrl,
        ricardoUrlFr: sourceUrl,
        imageUrl: (importedRecipeData?.imageUrl || recipe.imageUrl || '').trim(),
        time: importedRecipeData?.time || recipe.totalTime || recipe.cookTime || '30 mins',
        prepTime: importedRecipeData?.prepTime || recipe.prepTime || '15 mins',
        cookTime: importedRecipeData?.cookTime || recipe.cookTime || '20 mins',
        servings: importedRecipeData?.servings || recipe.servings || '4 servings',
        difficulty: (importedRecipeData?.difficulty || recipe.difficulty || 'Easy') as any,
        difficultyFr: importedRecipeData?.difficultyFr || recipe.difficultyFr || 'Facile',
        calories: importedRecipeData?.calories || '450 kcal',
        source: importedRecipeData?.source || recipe.source || inspectedSiteName || 'Web',
        isRicardoOfficial: false,
        isCustom: true,
        descriptionEn: importedRecipeData?.descriptionEn || recipe.descriptionEn || recipe.zeroWasteReason || '',
        descriptionFr: importedRecipeData?.descriptionFr || recipe.descriptionFr || recipe.zeroWasteReason || '',
        tags: importedRecipeData?.tags || recipe.tags || ['Web Recipe', 'Anti-Gaspillage'],
        suggestedPantryNeeds: recipe.suggestedPantryNeeds || [],
        ingredients: normalizedIngredients,
        instructionsEn: finalStepsEn,
        instructionsFr: finalStepsFr,
        createdAt: new Date().toISOString(),
      };

      setParsedRecipe(normalizeRecipe(mapped, lang));
      setDiscoveredWebsiteRecipes([]);
      setInspectedSiteName(null);
      setInspectionNotice(null);
    } catch (err: any) {
      console.error('Failed to import discovered recipe:', err);
      setErrorMsg(err.message || 'Error importing recipe');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsParsing(false);
      setImportingDiscoveredId(null);
      setParsingStep('');
    }
  };

  const handleToggleWebsite = (id: string) => {
    const updated = storedWebsites.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setStoredWebsites(updated);
    saveStoredRecipeWebsites(updated);
  };

  const handleDeleteCustomWebsite = (id: string) => {
    const updated = storedWebsites.filter((s) => s.id !== id);
    setStoredWebsites(updated);
    saveStoredRecipeWebsites(updated);
  };

  // Sample data loaders for instant 1-click test
  const loadSampleWebUrl = (url: string) => {
    setWebUrl(url);
    setErrorMsg(null);
  };

  const loadSampleYoutube = () => {
    setYoutubeUrl('https://www.youtube.com/watch?v=17XjG6x5g2I');
    setYoutubeNotes(
      'Crispy Garlic Butter Steak Bites with golden skillet potatoes. Ingredients: 1.5 lbs steak cubes, baby yellow potatoes, unsalted butter, 4 cloves garlic, fresh rosemary and parsley, olive oil.'
    );
    setErrorMsg(null);
  };

  const loadSampleText = () => {
    setRecipeText(
      `Grandma's Creamy Tuscan Chicken
Prep Time: 10 minutes
Cook Time: 20 minutes
Servings: 4

Ingredients:
- 4 boneless skinless chicken breasts (approx 600g)
- 1 cup heavy cream or whole milk
- 2 cups fresh baby spinach
- 1/2 cup sun-dried tomatoes, sliced
- 4 cloves garlic, minced
- 2 tbsp olive oil
- 1/2 cup grated parmesan cheese
- 1 tsp Italian seasoning (oregano, basil)
- Salt and fresh cracked black pepper

Instructions:
1. Season chicken breasts generously on both sides with Italian seasoning, salt, and black pepper.
2. Heat olive oil in a large skillet over medium-high heat. Sear chicken for 5-6 minutes per side until golden brown and cooked through (165°F). Remove and set aside.
3. In the same pan, sauté minced garlic for 1 minute until fragrant. Add sun-dried tomatoes and fresh spinach; cook for 2 minutes until wilted.
4. Pour in heavy cream and bring to a gentle simmer. Stir in grated parmesan cheese until the sauce is velvety and smooth.
5. Return seared chicken breasts to the skillet and spoon rich Tuscan garlic sauce over the top. Simmer 2 minutes and serve warm with pasta or crusty bread!`
    );
    setErrorMsg(null);
  };

  const loadSamplePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFDF9';
      ctx.fillRect(0, 0, 600, 400);
      ctx.fillStyle = '#1E3022';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText("Mom's Classic French Onion Soup", 40, 60);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#4B5563';
      ctx.fillText("Ingredients: 4 large yellow onions sliced, 3 tbsp butter,", 40, 110);
      ctx.fillText("2 tbsp flour, 4 cups rich beef broth, 1 cup Gruyère cheese,", 40, 140);
      ctx.fillText("4 thick slices baguette or sourdough, fresh thyme sprigs.", 40, 170);
      ctx.fillText("Directions: Caramelize onions slowly in butter for 35 mins.", 40, 220);
      ctx.fillText("Add flour and broth, simmer 20 mins. Top with toasted bread", 40, 250);
      ctx.fillText("and grated cheese, broil until bubbling and golden brown.", 40, 280);
      const dataUri = canvas.toDataURL('image/jpeg');
      setPhotoBase64(dataUri);
      setPhotoMimeType('image/jpeg');
      setErrorMsg(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoBase64(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Run AI Parse / Import
  const handleAIParse = async () => {
    setErrorMsg(null);
    setIsParsing(true);
    setParsingStep(
      lang === 'FR'
        ? "Connexion à l'IA culinaire Gemini..."
        : 'Connecting to Gemini Culinary AI...'
    );

    try {
      setTimeout(() => {
        setParsingStep(
          lang === 'FR'
            ? 'Extraction des ingrédients, mesures & étapes...'
            : 'Extracting ingredients, measurements & steps...'
        );
      }, 700);

      setTimeout(() => {
        setParsingStep(
          lang === 'FR'
            ? autoTranslateOnImport
              ? 'Traduction automatique et attribution des zones de stockage...'
              : 'Attribution des zones de stockage (Frigo, Congélateur, Garde-manger)...'
            : autoTranslateOnImport
            ? 'Automatic translation & kitchen storage zoning...'
            : 'Mapping kitchen storage zones (Fridge, Freezer, Pantry)...'
        );
      }, 1500);

      if (activeTab === 'url') {
        if (!webUrl.trim()) {
          throw new Error(
            lang === 'FR'
              ? 'Veuillez saisir ou coller l’adresse URL d’une recette.'
              : 'Please enter or paste a recipe web URL.'
          );
        }

        const res = await fetch('/api/v1/recipes/import-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: webUrl.trim(),
            language: lang,
            autoTranslate: autoTranslateOnImport,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to import recipe from URL');
        }

        setParsedRecipe(normalizeRecipe(data.recipe, lang));
      } else {
        // Fallback or other tabs (youtube, text, photo)
        let payload: any = {
          mode: activeTab,
          language: lang,
          autoTranslate: autoTranslateOnImport,
        };

        if (activeTab === 'youtube') {
          if (!youtubeUrl && !youtubeNotes) {
            throw new Error('Please enter a YouTube video URL or recipe notes.');
          }
          payload.youtubeUrl = youtubeUrl;
          payload.text = youtubeNotes || youtubeUrl;
        } else if (activeTab === 'text') {
          if (!recipeText.trim()) {
            throw new Error('Please enter or paste your recipe text.');
          }
          payload.text = recipeText;
        } else if (activeTab === 'photo') {
          if (!photoBase64) {
            throw new Error('Please upload or snap a photo of a recipe.');
          }
          payload.imageBase64 = photoBase64;
          payload.mimeType = photoMimeType;
        }

        const res = await fetch('/api/v1/recipes/ai-parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to parse recipe');
        }

        setParsedRecipe(normalizeRecipe(data.recipe, lang));
      }
    } catch (err: any) {
      console.error('AI Parse/Import failed:', err);
      setErrorMsg(err.message || 'Error communicating with AI service');
    } finally {
      setIsParsing(false);
      setParsingStep('');
    }
  };

  // Instant on-demand translation of the parsed recipe
  const handleTranslateRecipe = async (targetLang: 'EN' | 'FR') => {
    if (!parsedRecipe) return;
    setIsTranslating(true);
    try {
      const res = await fetch('/api/v1/recipes/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe: parsedRecipe,
          targetLanguage: targetLang,
        }),
      });

      const data = await res.json();
      if (data.success && data.recipe) {
        setParsedRecipe(normalizeRecipe(data.recipe, targetLang));
      } else {
        setParsedRecipe((prev) => (prev ? normalizeRecipe(prev, targetLang) : null));
      }
    } catch (err: any) {
      console.warn('Backend translation failed, using local deterministic translation:', err);
      setParsedRecipe((prev) => (prev ? normalizeRecipe(prev, targetLang) : null));
    } finally {
      setIsTranslating(false);
    }
  };

  // Save reviewed recipe to backend and trigger parent callback
  const handleConfirmSave = async () => {
    if (!parsedRecipe) return;

    const recipeId = parsedRecipe.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const recipeToPersist: RicardoRecipe = {
      ...parsedRecipe,
      id: recipeId,
      isCustom: true,
      updatedAt: new Date().toISOString(),
      createdAt: parsedRecipe.createdAt || new Date().toISOString(),
      ingredients: (parsedRecipe.ingredients || []).map((ing, idx) =>
        normalizeRecipeIngredient(ing, idx)
      ),
    };

    try {
      const isExisting = Boolean(recipeToEdit || (parsedRecipe.id && !parsedRecipe.id.startsWith('temp_')));
      const endpoint = isExisting
        ? `/api/v1/recipes/custom/${recipeId}`
        : '/api/v1/recipes/custom';
      const method = isExisting ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeToPersist),
      });
      const data = await res.json();
      const saved = data.success && data.recipe ? data.recipe : recipeToPersist;
      setParsedRecipe(null);
      setPhotoBase64(null);
      onRecipeSaved(saved);
      onClose();
    } catch (err) {
      console.error('Failed to save recipe to backend:', err);
      const fallback = recipeToPersist;
      setParsedRecipe(null);
      setPhotoBase64(null);
      onRecipeSaved(fallback);
      onClose();
    }
  };

  return (
    <div
      id="add-recipe-fullscreen-view"
      className="fixed inset-0 z-50 bg-[var(--md-sys-color-surface)] flex flex-col w-full h-full overflow-hidden text-[var(--md-sys-color-on-surface)] animate-fade-in"
    >
      {/* Top Header Bar - M3 Styling */}
      <header className="px-4 sm:px-6 py-3.5 bg-[var(--md-sys-color-surface-container-high)] border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between shrink-0 shadow-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs">
            {recipeToEdit ? <Pencil className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--md-sys-color-on-surface)]">
              {recipeToEdit
                ? lang === 'FR'
                  ? 'Modifier la Recette'
                  : 'Edit Recipe'
                : lang === 'FR'
                ? 'Importer ou Ajouter une Recette'
                : 'Import or Add a Recipe'}
            </h2>
            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
              {recipeToEdit
                ? lang === 'FR'
                  ? 'Personnalisez le titre, les portions, les ingrédients et les étapes'
                  : 'Customize title, servings, ingredients, and instructions'
                : lang === 'FR'
                ? 'Sites web de recettes, YouTube, texte ou photo avec traduction automatique'
                : 'Web recipe sites, YouTube, text notes, or photo OCR with auto-translation'}
            </p>
          </div>
        </div>

        {/* Prominent Exit Button */}
        <button
          id="btn-exit-add-recipe"
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-full bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-[var(--md-sys-color-outline-variant)] shadow-none shrink-0 cursor-pointer"
          title={lang === 'FR' ? 'Quitter' : 'Exit'}
        >
          <X className="w-4 h-4" />
          <span>{lang === 'FR' ? 'Quitter' : 'Exit'}</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl mx-auto w-full">
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* If NOT yet parsed, show source selectors and inputs */}
        {!parsedRecipe ? (
          <div className="space-y-4">
            {/* Source Tabs: URL, YouTube, Text, Photo - M3 Segmented Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-full">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('url');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'url'
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs">
                  {lang === 'FR' ? 'Lien Web / URL' : 'Web Recipe URL'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('youtube');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'youtube'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <Youtube className="w-4 h-4" />
                <span className="text-xs">YouTube</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('text');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'text'
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="text-xs">
                  {lang === 'FR' ? 'Texte / Notes' : 'Personal Text'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('photo');
                  setErrorMsg(null);
                }}
                className={`py-2 px-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'photo'
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span className="text-xs">
                  {lang === 'FR' ? 'Photo / Scan' : 'Photo / Scan'}
                </span>
              </button>
            </div>

            {/* Global Auto-Translation Toggle for any source */}
            <div className="p-3 bg-white border border-[#D5E1D2] rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                  <Languages className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1E3022] truncate">
                    {lang === 'FR'
                      ? 'Traduction automatique en Français à l’importation'
                      : 'Automatic translation into English on import'}
                  </p>
                  <p className="text-[11px] text-[#556D58]">
                    {lang === 'FR'
                      ? 'Traduit automatiquement le titre, les ingrédients, unités et étapes'
                      : 'Automatically translates recipe title, ingredients, units and cooking steps'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoTranslateOnImport}
                  onChange={(e) => setAutoTranslateOnImport(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-700"></div>
              </label>
            </div>

            {/* TAB 1: WEB RECIPE URL */}
            {activeTab === 'url' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 bg-white border border-[#D5E1D2] rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-[#1E3022] flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-teal-700" />
                      <span>{lang === 'FR' ? 'Adresse URL de la recette' : 'Recipe Web Page URL'}</span>
                    </label>
                    <span className="text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full font-bold">
                      {lang === 'FR' ? 'Tout site web accepté' : 'Any website supported'}
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3.5 top-3 text-teal-700">
                      <Globe className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      value={webUrl}
                      onChange={(e) => setWebUrl(e.target.value)}
                      placeholder="https://www.ricardocuisine.com/... or https://www.marmiton.org/..."
                      className="w-full pl-10 pr-10 py-2.5 bg-[#FAFBF9] border border-[#D5E1D2] rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800 font-medium"
                    />
                    {webUrl && (
                      <button
                        type="button"
                        onClick={() => setWebUrl('')}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Quick 1-click sample URLs */}
                  <div className="pt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {lang === 'FR' ? 'Tester avec un exemple rapide :' : 'Test with a 1-click sample:'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          loadSampleWebUrl(
                            'https://www.ricardocuisine.com/en/recipes/4512-apple-and-maple-syrup-pork-roast'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-[10px] font-black transition-colors"
                      >
                        🍁 Ricardo (Rôti porc érable)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          loadSampleWebUrl(
                            'https://panlasangpinoy.com/killer-pork-sinigang/'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-[10px] font-black transition-colors"
                      >
                        🇵🇭 Panlasang Pinoy (Sinigang)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          loadSampleWebUrl(
                            'https://www.kawalingpinoy.com/pork-adobo/'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-[10px] font-black transition-colors"
                      >
                        🇵🇭 Kawaling Pinoy (Adobo)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          loadSampleWebUrl(
                            'https://www.foxyfolksy.com/pork-sinigang/'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-[10px] font-black transition-colors"
                      >
                        🇵🇭 Foxy Folksy (Sinigang)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          loadSampleWebUrl(
                            'https://www.marmiton.org/recettes/recette_poulet-au-curry-et-lait-de-coco_22345.aspx'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#EBF3EA] hover:bg-[#DCEBD9] text-[#1E3022] text-[10px] font-bold transition-colors"
                      >
                        🇫🇷 Marmiton (Poulet Curry)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          loadSampleWebUrl(
                            'https://www.allrecipes.com/recipe/213742/meatball-nirvana/'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#EBF3EA] hover:bg-[#DCEBD9] text-[#1E3022] text-[10px] font-bold transition-colors"
                      >
                        Allrecipes (Meatballs)
                      </button>
                    </div>
                  </div>

                  {/* Actions for URL: Parse single recipe or Look into whole site */}
                  <div className="pt-2 border-t border-[#E1EDE0] flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleLookIntoWebsite(webUrl)}
                      disabled={!webUrl.trim() || isInspectingWebsite}
                      className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50"
                    >
                      <Compass className={`w-3.5 h-3.5 text-teal-700 ${isInspectingWebsite ? 'animate-spin' : ''}`} />
                      <span>{lang === 'FR' ? 'Explorer le contenu du site' : 'Look into website content'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAIParse}
                      disabled={!webUrl.trim() || isParsing}
                      className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{lang === 'FR' ? 'Extraire cette recette' : 'Parse single recipe'}</span>
                    </button>
                  </div>
                </div>

                {/* Discovered Recipes from Website Content */}
                {inspectionNotice && (
                  <div className="p-4 bg-[#F5FAF4] border border-[#CDE3CB] rounded-2xl space-y-3 animate-fade-in shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Compass className={`w-4 h-4 text-teal-700 ${isInspectingWebsite ? 'animate-spin' : ''}`} />
                        <span className="text-xs font-black text-[#1E3022]">{inspectionNotice}</span>
                      </div>
                      {discoveredWebsiteRecipes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setDiscoveredWebsiteRecipes([]);
                            setInspectionNotice(null);
                          }}
                          className="text-[11px] font-bold text-teal-700 hover:underline"
                        >
                          {lang === 'FR' ? 'Fermer' : 'Dismiss'}
                        </button>
                      )}
                    </div>

                    {discoveredWebsiteRecipes.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {discoveredWebsiteRecipes.map((rec, idx) => (
                          <div
                            key={rec.id || idx}
                            className="p-3 bg-white border border-[#D5E1D2] rounded-xl flex items-start gap-3 shadow-2xs hover:border-teal-500 transition-all group"
                          >
                            {rec.imageUrl && (
                              <img
                                src={rec.imageUrl}
                                alt={rec.title}
                                className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-100"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-[#1E3022] truncate" title={rec.title}>
                                {lang === 'FR' && rec.titleFr ? rec.titleFr : rec.title}
                              </h5>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {rec.totalTime || rec.cookTime || '25 mins'}
                                </span>
                                {rec.difficulty && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 font-medium text-[10px]">
                                    {lang === 'FR' && rec.difficultyFr ? rec.difficultyFr : rec.difficulty}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                disabled={isParsing}
                                onClick={() => handleSelectDiscoveredRecipe(rec)}
                                className="mt-2.5 px-3 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {importingDiscoveredId === (rec.id || rec.title) ? (
                                  <Sparkles className="w-3 h-3 animate-spin text-teal-200" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                <span>
                                  {importingDiscoveredId === (rec.id || rec.title)
                                    ? (lang === 'FR' ? 'Importation...' : 'Importing...')
                                    : (lang === 'FR' ? 'Importer cette recette' : 'Import recipe')}
                                </span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Recipe Websites Preference & Custom Sources Section */}
                <div className="p-4 bg-white border border-[#D5E1D2] rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-teal-700" />
                      <h4 className="text-xs font-black text-[#1E3022]">
                        {lang === 'FR' ? 'Mes Sites de Recettes Préférés' : 'Preferred Recipe Websites'}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowWebsiteManager(!showWebsiteManager)}
                      className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>
                        {showWebsiteManager
                          ? lang === 'FR'
                            ? 'Fermer la gestion'
                            : 'Close Manager'
                          : lang === 'FR'
                          ? 'Gérer / Ajouter un site'
                          : 'Manage / Add Site'}
                      </span>
                    </button>
                  </div>

                  <p className="text-[11px] text-[#556D58]">
                    {lang === 'FR'
                      ? 'Cliquez sur l’icône d’œil pour explorer directement les recettes de n’importe quel site.'
                      : 'Click the eye icon to look directly through the content of any website.'}
                  </p>

                  {/* Active websites pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {storedWebsites.map((site) => (
                      <div
                        key={site.id}
                        className={`px-2 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all ${
                          site.enabled
                            ? 'bg-teal-50 border-teal-300 text-teal-900'
                            : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleWebsite(site.id)}
                          className="flex items-center gap-1.5"
                          title={site.enabled ? (lang === 'FR' ? 'Désactiver' : 'Disable') : (lang === 'FR' ? 'Activer' : 'Enable')}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${site.enabled ? 'bg-teal-600' : 'bg-slate-300'}`} />
                          <span>{site.name}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLookIntoWebsite(site.url, site.name);
                          }}
                          title={lang === 'FR' ? `Explorer le contenu de ${site.name}` : `Look through ${site.name} content`}
                          className="p-1 rounded-md bg-white hover:bg-teal-100 text-teal-700 hover:text-teal-900 transition-colors shadow-2xs"
                        >
                          <Eye className="w-2.5 h-2.5" />
                        </button>
                        {site.id.startsWith('custom_') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomWebsite(site.id);
                            }}
                            className="text-rose-500 hover:text-rose-700 p-0.5"
                            title={lang === 'FR' ? 'Supprimer' : 'Delete'}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Website Manager (Add custom website) */}
                  {showWebsiteManager && (
                    <div className="pt-3 border-t border-[#E1EDE0] space-y-3 animate-fade-in">
                      <form onSubmit={handleAddCustomWebsite} className="space-y-2">
                        <label className="text-[11px] font-black text-[#1E3022]">
                          {lang === 'FR' ? 'Ajouter un autre site de recettes :' : 'Add another recipe website:'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={newSiteName}
                            onChange={(e) => setNewSiteName(e.target.value)}
                            placeholder={lang === 'FR' ? 'Nom (ex: Sally Baking, Trois Fois Par Jour)' : 'Name (e.g. Sally Baking, Food52)'}
                            className="p-2 bg-[#FAFBF9] border border-[#D5E1D2] rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            required
                          />
                          <input
                            type="text"
                            value={newSiteUrl}
                            onChange={(e) => setNewSiteUrl(e.target.value)}
                            placeholder="https://sallysbakingaddiction.com"
                            className="p-2 bg-[#FAFBF9] border border-[#D5E1D2] rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black flex items-center gap-1.5 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{lang === 'FR' ? 'Ajouter ce site' : 'Save Website'}</span>
                        </button>
                      </form>

                      {/* Manage custom list with delete options */}
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {storedWebsites
                          .filter((s) => s.id.startsWith('custom_'))
                          .map((custom) => (
                            <div
                              key={custom.id}
                              className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-800">{custom.name}</span>
                                <span className="text-[10px] text-slate-400 ml-2">{custom.domain}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomWebsite(custom.id)}
                                className="text-rose-500 hover:text-rose-700 p-1"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: YOUTUBE */}
            {activeTab === 'youtube' && (
              <div className="space-y-3 animate-fade-in p-4 bg-white border border-[#D5E1D2] rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#1E3022]">
                    {lang === 'FR' ? 'Lien de la vidéo YouTube' : 'YouTube Video Link'}
                  </label>
                  <button
                    type="button"
                    onClick={loadSampleYoutube}
                    className="text-[10px] font-bold text-rose-700 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{lang === 'FR' ? 'Exemple 1-clic' : 'Load Sample Link'}</span>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute left-3.5 top-2.5 text-rose-600">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                    className="w-full pl-10 pr-3 py-2 bg-[#FAFBF9] border border-[#D5E1D2] rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-800 font-medium"
                  />
                </div>

                {/* YouTube Thumbnail preview if detected */}
                {detectedYtId && (
                  <div className="relative rounded-2xl overflow-hidden border border-[#D5E1D2] bg-black/5 shadow-2xs group">
                    <img
                      src={`https://img.youtube.com/vi/${detectedYtId}/hqdefault.jpg`}
                      alt="YouTube preview"
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white p-1.5 rounded-xl text-[10px] font-bold flex items-center justify-between">
                      <span>Video ID: {detectedYtId}</span>
                      <span className="text-emerald-400">✓ Video Identified</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#556D58]">
                    {lang === 'FR'
                      ? 'Notes additionnelles ou description de la vidéo (optionnel) :'
                      : 'Additional notes or pasted video description (optional):'}
                  </label>
                  <textarea
                    rows={3}
                    value={youtubeNotes}
                    onChange={(e) => setYoutubeNotes(e.target.value)}
                    placeholder={
                      lang === 'FR'
                        ? 'Collez la description ou des ingrédients spécifiques...'
                        : 'Paste video description or key ingredients mentioned by the creator...'
                    }
                    className="w-full p-2.5 bg-[#FAFBF9] border border-[#D5E1D2] rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: TEXT */}
            {activeTab === 'text' && (
              <div className="space-y-3 animate-fade-in p-4 bg-white border border-[#D5E1D2] rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#1E3022]">
                    {lang === 'FR'
                      ? 'Collez le texte de votre recette'
                      : 'Paste Recipe Text or Notes'}
                  </label>
                  <button
                    type="button"
                    onClick={loadSampleText}
                    className="text-[10px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{lang === 'FR' ? 'Exemple de recette' : 'Load Sample Recipe'}</span>
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={recipeText}
                  onChange={(e) => setRecipeText(e.target.value)}
                  placeholder={
                    lang === 'FR'
                      ? "Nom de la recette, temps, portions, liste d'ingrédients avec quantités et étapes de cuisson..."
                      : 'Recipe name, ingredients with amounts, prep time, servings, and step-by-step cooking directions...'
                  }
                  className="w-full p-3 bg-[#FAFBF9] border border-[#D5E1D2] rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800 font-mono leading-relaxed"
                />
                <p className="text-[10px] text-[#647C67]">
                  {lang === 'FR'
                    ? "Conseil : Vous pouvez coller du texte brut depuis un message ou vos notes. L'IA structure automatiquement les ingrédients, mesures et le rangement."
                    : 'Tip: You can paste messy or unformatted text from notes or messages. Gemini will standardize measurements and storage zones.'}
                </p>
              </div>
            )}

            {/* TAB 4: PHOTO / SCAN */}
            {activeTab === 'photo' && (
              <div className="space-y-3 animate-fade-in p-4 bg-white border border-[#D5E1D2] rounded-2xl shadow-2xs">
                {/* Hidden native camera and gallery inputs */}
                <input
                  type="file"
                  ref={cameraAppInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoPicked}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={galleryInputRef}
                  accept="image/*"
                  onChange={handlePhotoPicked}
                  className="hidden"
                />

                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#1E3022] flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span>
                      {lang === 'FR'
                        ? 'Photo d’un livre de cuisine ou fiche recette manuscrite'
                        : 'Cookbook Page or Handwritten Recipe Card'}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={loadSamplePhoto}
                    className="text-[10px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{lang === 'FR' ? 'Fiche exemple' : 'Load Sample Card'}</span>
                  </button>
                </div>

                {cameraError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* 1. Live Camera Viewfinder State */}
                {isLiveCameraActive ? (
                  <div className="space-y-3 p-3 bg-slate-950 rounded-2xl border-2 border-emerald-500 shadow-md text-white text-center">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{lang === 'FR' ? 'Caméra active' : 'Live Camera'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleFacingMode}
                          className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title={lang === 'FR' ? 'Changer de caméra' : 'Flip camera'}
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{lang === 'FR' ? 'Changer' : 'Flip'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopLiveCamera}
                          className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                          title={lang === 'FR' ? 'Fermer caméra' : 'Close camera'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* Framing guides overlay */}
                      <div className="absolute inset-4 border-2 border-emerald-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                        <div className="flex justify-between">
                          <span className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                          <span className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                        </div>
                        <p className="text-[10px] text-white/90 bg-black/60 px-2.5 py-1 rounded-full mx-auto backdrop-blur-xs font-bold">
                          {lang === 'FR' ? 'Cadrez la fiche de recette ici' : 'Frame recipe card here'}
                        </p>
                        <div className="flex justify-between">
                          <span className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                          <span className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                        </div>
                      </div>
                    </div>

                    {/* Shutter Button */}
                    <div className="flex items-center justify-center pt-1">
                      <button
                        type="button"
                        onClick={captureLiveSnapshot}
                        className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                      >
                        <Camera className="w-4 h-4 stroke-[2.5]" />
                        <span>{lang === 'FR' ? 'Prendre la photo' : 'Capture Recipe Photo'}</span>
                      </button>
                    </div>
                  </div>
                ) : photoBase64 ? (
                  /* 2. Photo Captured / Loaded Preview */
                  <div className="p-4 border-2 border-dashed border-emerald-300 rounded-2xl bg-[#F8FAF6] text-center space-y-3">
                    <div className="h-48 max-w-sm mx-auto rounded-xl overflow-hidden border border-[#D5E1D2] bg-white shadow-xs relative">
                      <img
                        src={photoBase64}
                        alt="Recipe capture"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-2 pt-1 max-w-sm mx-auto">
                      <button
                        type="button"
                        onClick={() => triggerPhotoImport(photoBase64)}
                        disabled={isParsing}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>
                          {lang === 'FR'
                            ? 'Numériser la recette avec l’IA & OCR'
                            : 'Digitize Recipe with AI & OCR'}
                        </span>
                      </button>

                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoBase64(null);
                            setErrorMsg(null);
                          }}
                          className="text-xs text-rose-600 hover:underline font-bold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{lang === 'FR' ? 'Changer / Reprendre la photo' : 'Retake / Choose another photo'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 3. Action Hub for Snapping Written Recipes */
                  <div className="space-y-3 py-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Native Camera App Launcher */}
                      <button
                        type="button"
                        onClick={() => cameraAppInputRef.current?.click()}
                        className="p-5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white flex flex-col items-center text-center gap-2 shadow-sm transition-all active:scale-[0.98] group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Camera className="w-6 h-6 text-white stroke-[2.5]" />
                        </div>
                        <span className="text-xs font-black">
                          {lang === 'FR' ? 'Ouvrir l’application Caméra' : 'Open Camera App'}
                        </span>
                        <span className="text-[11px] text-emerald-100 opacity-90 leading-tight">
                          {lang === 'FR'
                            ? 'Déclenche l’appareil photo natif de votre téléphone'
                            : 'Directly launches your phone’s camera shutter'}
                        </span>
                      </button>

                      {/* Live In-App Viewfinder */}
                      <button
                        type="button"
                        onClick={() => startLiveCamera('environment')}
                        className="p-5 rounded-2xl bg-[#1E3022] hover:bg-black text-white flex flex-col items-center text-center gap-2 shadow-sm transition-all active:scale-[0.98] group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Video className="w-6 h-6 text-teal-200 stroke-[2.2]" />
                        </div>
                        <span className="text-xs font-black">
                          {lang === 'FR' ? 'Viseur Caméra en direct' : 'Live Camera Viewfinder'}
                        </span>
                        <span className="text-[11px] text-slate-300 opacity-90 leading-tight">
                          {lang === 'FR'
                            ? 'Affichage vidéo à l’écran avec guide de cadrage'
                            : 'Interactive on-screen viewfinder with alignment frame'}
                        </span>
                      </button>
                    </div>

                    {/* Gallery or File Picker fallback */}
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#CADBC7] hover:border-emerald-600 bg-white text-[#1E3022] text-xs font-bold transition-all shadow-2xs hover:bg-[#F8FAF6] cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{lang === 'FR' ? 'Choisir une photo dans la galerie / fichiers' : 'Pick photo from gallery / files'}</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F0EBE0]/80 text-[#527470] text-[11px] text-center leading-relaxed">
                      {lang === 'FR'
                        ? '✨ L’IA et l’OCR analysent vos photos de fiches manuscrites ou de livres de cuisine pour extraire automatiquement le titre, les ingrédients et les instructions.'
                        : '✨ AI & OCR scan your handwritten recipe cards and cookbook pages to automatically extract title, ingredients, and step-by-step instructions.'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading State Animation */}
            {isParsing && (
              <div className="p-5 rounded-2xl bg-[#EAF2E8] border border-[#CADBC7] space-y-2 text-center animate-fade-in shadow-2xs">
                <div className="flex items-center justify-center gap-2 text-emerald-800 font-black text-xs">
                  <Sparkles className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>{parsingStep}</span>
                </div>
                <div className="w-full bg-white/70 h-2 rounded-full overflow-hidden max-w-md mx-auto">
                  <div className="h-full bg-emerald-600 animate-pulse rounded-full w-3/4 mx-auto" />
                </div>
                <p className="text-[10px] text-[#556D58]">
                  Powered by Google Gemini Flash
                </p>
              </div>
            )}
          </div>
        ) : (
          /* REVIEW & FULL EDIT STEP ONCE PARSED OR WHEN EDITING SAVED RECIPE */
          <div className="space-y-4 animate-fade-in">
            {/* Status & Mode Banner */}
            {recipeToEdit ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-600 shrink-0 stroke-[2.5]" />
                  <span className="font-extrabold">
                    {lang === 'FR'
                      ? 'Mode modification : personnalisez les détails, ingrédients et étapes de votre recette :'
                      : 'Edit mode: customize title, ingredients, and step-by-step instructions:'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[11px] font-bold text-amber-800 hover:underline shrink-0"
                >
                  {lang === 'FR' ? 'Annuler' : 'Cancel'}
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                  <span className="font-extrabold">
                    {lang === 'FR'
                      ? 'Recette numérisée ! Vous pouvez modifier tous les champs, ingrédients et étapes ci-dessous :'
                      : 'Recipe parsed! You can customize any field, ingredients, or instructions below:'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await confirmAction({
                      title: lang === 'FR' ? 'Changer de source ?' : 'Change Source?',
                      message:
                        lang === 'FR'
                          ? 'Voulez-vous réinitialiser et saisir une nouvelle source de recette ?'
                          : 'Do you want to discard this and enter a new recipe source?',
                      confirmLabel: lang === 'FR' ? 'Réinitialiser' : 'Discard',
                      cancelLabel: lang === 'FR' ? 'Annuler' : 'Cancel',
                      variant: 'warning',
                    });
                    if (confirmed) {
                      setParsedRecipe(null);
                    }
                  }}
                  className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === 'FR' ? 'Changer de source' : 'Change Source'}</span>
                </button>
              </div>
            )}

            {/* General Recipe Information Card */}
            <div className="rounded-2xl border border-[#D5E1D2] bg-white overflow-hidden shadow-2xs space-y-4">
              {/* Recipe Image Banner Preview & Image URL Field */}
              {parsedRecipe.imageUrl ? (
                <div className="h-44 w-full relative bg-slate-100 group">
                  <img
                    src={parsedRecipe.imageUrl}
                    alt={parsedRecipe.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-black tracking-wider uppercase backdrop-blur-xs">
                    {parsedRecipe.source || (lang === 'FR' ? 'Recette Personnelle' : 'Personal Recipe')}
                  </span>
                  {parsedRecipe.ricardoUrlEn && (
                    <a
                      href={lang === 'FR' && parsedRecipe.ricardoUrlFr ? parsedRecipe.ricardoUrlFr : parsedRecipe.ricardoUrlEn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-white/90 text-slate-800 text-[10px] font-bold flex items-center gap-1 hover:bg-white shadow-xs"
                    >
                      <span>{lang === 'FR' ? 'Lien source' : 'Source link'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="text-[11px] opacity-90 drop-shadow-xs truncate">
                      {getRecipeDisplayTitle(parsedRecipe, lang)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setParsedRecipe((prev) => (prev ? { ...prev, imageUrl: '' } : null))}
                      className="px-2 py-0.5 rounded bg-black/60 hover:bg-red-600 text-white text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      {lang === 'FR' ? 'Changer l’image' : 'Change Image'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#F8FAF6] border-b border-[#E1EDE0] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-[#D5E1D2] flex items-center justify-center text-slate-400 shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      {lang === 'FR' ? 'URL de l’image de la recette (optionnel)' : 'Recipe Image URL (optional)'}
                    </label>
                    <input
                      type="url"
                      value={parsedRecipe.imageUrl || ''}
                      onChange={(e) => setParsedRecipe((prev) => (prev ? { ...prev, imageUrl: e.target.value } : null))}
                      placeholder="https://example.com/recipe-photo.jpg"
                      className="w-full text-xs text-[#1E3022] font-mono bg-white border border-[#D5E1D2] rounded-lg px-2.5 py-1.5 mt-1 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              )}

              <div className="p-4 sm:p-5 space-y-4">
                {/* On-Demand Translation Control Bar */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#E1EDE0]">
                  <div className="flex items-center gap-1.5 text-xs text-[#556D58]">
                    <Languages className="w-4 h-4 text-teal-700" />
                    <span className="font-bold">
                      {lang === 'FR' ? 'Traduction automatique :' : 'Auto-translate:'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isTranslating}
                      onClick={() => handleTranslateRecipe('FR')}
                      className="px-3 py-1 rounded-xl text-xs font-black border border-[#D5E1D2] bg-white hover:bg-teal-50 text-teal-900 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      {isTranslating ? '...' : '🇫🇷 Traduire en Français'}
                    </button>
                    <button
                      type="button"
                      disabled={isTranslating}
                      onClick={() => handleTranslateRecipe('EN')}
                      className="px-3 py-1 rounded-xl text-xs font-black border border-[#D5E1D2] bg-white hover:bg-teal-50 text-teal-900 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      {isTranslating ? '...' : '🇬🇧 Translate to English'}
                    </button>
                  </div>
                </div>

                {/* Bilingual Recipe Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-[#1E3022] uppercase tracking-wider flex items-center gap-1.5">
                      <span>{lang === 'FR' ? 'Titre de la recette (Bilingue)' : 'Recipe Title (Bilingual)'} *</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold">
                        {lang === 'FR' ? '🇫🇷 FR & 🇬🇧 EN' : '🇬🇧 EN & 🇫🇷 FR'}
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {lang === 'FR' ? 'Traduction automatique intégrée' : 'Auto-translated fields'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        🇫🇷 {lang === 'FR' ? 'Titre en Français' : 'French Title'}
                      </label>
                      <input
                        type="text"
                        value={parsedRecipe.titleFr || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setParsedRecipe((prev) => (prev ? {
                            ...prev,
                            titleFr: val,
                            title: lang === 'FR' ? (val || prev.title) : prev.title,
                          } : null));
                        }}
                        placeholder="Ex: Rôti de porc aux pommes et sirop d'érable"
                        className="w-full font-bold text-sm text-[#1E3022] border border-[#CADBC7] rounded-xl px-3 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 bg-[#FAFBF9]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">
                        🇬🇧 {lang === 'FR' ? 'Titre en Anglais' : 'English Title'}
                      </label>
                      <input
                        type="text"
                        value={parsedRecipe.titleEn || (parsedRecipe.title !== parsedRecipe.titleFr ? parsedRecipe.title : '') || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setParsedRecipe((prev) => (prev ? {
                            ...prev,
                            titleEn: val,
                            title: lang === 'EN' ? val : (prev.titleFr || val),
                          } : null));
                        }}
                        placeholder="e.g. Apple and Maple Syrup Pork Roast"
                        className="w-full font-bold text-sm text-[#1E3022] border border-[#CADBC7] rounded-xl px-3 py-2 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 bg-[#FAFBF9]"
                      />
                    </div>
                  </div>
                </div>

                {/* Bilingual Recipe Description & Chef Notes */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-[#1E3022] uppercase tracking-wider">
                      {lang === 'FR' ? 'Description & Notes de cuisine' : 'Description & Chef Notes'}
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {lang === 'FR' ? 'Description bilingue' : 'Bilingual summary'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">🇫🇷 Français</label>
                      <textarea
                        rows={2}
                        value={parsedRecipe.descriptionFr || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setParsedRecipe((prev) => (prev ? { ...prev, descriptionFr: val } : null));
                        }}
                        placeholder="Description ou astuces en français..."
                        className="w-full text-xs text-[#334D37] leading-relaxed border border-[#CADBC7] rounded-xl p-2.5 focus:outline-none focus:border-teal-600 bg-[#FAFBF9] resize-y"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">🇬🇧 English</label>
                      <textarea
                        rows={2}
                        value={parsedRecipe.descriptionEn || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setParsedRecipe((prev) => (prev ? { ...prev, descriptionEn: val } : null));
                        }}
                        placeholder="Description or notes in English..."
                        className="w-full text-xs text-[#334D37] leading-relaxed border border-[#CADBC7] rounded-xl p-2.5 focus:outline-none focus:border-teal-600 bg-[#FAFBF9] resize-y"
                      />
                    </div>
                  </div>
                </div>

                {/* Key Recipe Metrics Grid: Time, Servings, Calories, Difficulty */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {/* Servings */}
                  <div className="p-2.5 rounded-xl border border-[#D5E1D2] bg-[#FAFBF9] space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">
                      {lang === 'FR' ? 'Portions' : 'Servings'}
                    </label>
                    <input
                      type="text"
                      value={parsedRecipe.servings || ''}
                      onChange={(e) => setParsedRecipe((prev) => (prev ? { ...prev, servings: e.target.value } : null))}
                      placeholder="4 portions"
                      className="w-full text-xs font-black text-[#1E3022] bg-white border border-slate-200 rounded-lg px-2 py-1 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  {/* Total Time */}
                  <div className="p-2.5 rounded-xl border border-[#D5E1D2] bg-[#FAFBF9] space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>{lang === 'FR' ? 'Temps total' : 'Total Time'}</span>
                    </label>
                    <input
                      type="text"
                      value={parsedRecipe.time || ''}
                      onChange={(e) => setParsedRecipe((prev) => (prev ? { ...prev, time: e.target.value } : null))}
                      placeholder="35 min"
                      className="w-full text-xs font-black text-[#1E3022] bg-white border border-slate-200 rounded-lg px-2 py-1 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  {/* Calories */}
                  <div className="p-2.5 rounded-xl border border-[#D5E1D2] bg-[#FAFBF9] space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-500" />
                      <span>{lang === 'FR' ? 'Calories' : 'Calories'}</span>
                    </label>
                    <input
                      type="text"
                      value={parsedRecipe.calories || ''}
                      onChange={(e) => setParsedRecipe((prev) => (prev ? { ...prev, calories: e.target.value } : null))}
                      placeholder="450 kcal"
                      className="w-full text-xs font-black text-[#1E3022] bg-white border border-slate-200 rounded-lg px-2 py-1 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  {/* Difficulty */}
                  <div className="p-2.5 rounded-xl border border-[#D5E1D2] bg-[#FAFBF9] space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">
                      {lang === 'FR' ? 'Difficulté' : 'Difficulty'}
                    </label>
                    <select
                      value={parsedRecipe.difficulty || 'Easy'}
                      onChange={(e) => {
                        const val = e.target.value as 'Easy' | 'Medium' | 'Advanced';
                        const frMap = { Easy: 'Facile', Medium: 'Moyen', Advanced: 'Avancé' } as const;
                        setParsedRecipe((prev) => (prev ? { ...prev, difficulty: val, difficultyFr: frMap[val] } : null));
                      }}
                      className="w-full text-xs font-black text-[#1E3022] bg-white border border-slate-200 rounded-lg px-2 py-1 focus:border-emerald-600 focus:outline-none cursor-pointer"
                    >
                      <option value="Easy">{lang === 'FR' ? 'Facile' : 'Easy'}</option>
                      <option value="Medium">{lang === 'FR' ? 'Moyen' : 'Medium'}</option>
                      <option value="Advanced">{lang === 'FR' ? 'Avancé' : 'Advanced'}</option>
                    </select>
                  </div>
                </div>

                {/* Nutritional Engine Section (Methods A, B, C) */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7EE]/60 border border-[#E5DFD0] text-[#0D3B37] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0D3B37]">
                        {lang === 'FR' ? 'Moteur Nutritionnel (Calories & Macros)' : 'Nutritional Engine (Calories & Macros)'}
                      </span>
                    </div>

                    {/* Method Selector: A (AI), B (Dynamic), C (Manual) */}
                    <div className="inline-flex rounded-xl border border-[#E5DFD0] bg-white p-0.5 text-[11px] font-bold shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          const servingsNum = parseInt(parsedRecipe.servings?.replace(/\D/g, '') || '4', 10) || 4;
                          const est = estimateRecipeNutrition(parsedRecipe.title || 'Recipe', parsedRecipe.ingredients, servingsNum);
                          setParsedRecipe((prev) => prev ? {
                            ...prev,
                            calories: `${est.caloriesPerServing} kcal`,
                            caloriesPerServing: est.caloriesPerServing,
                            totalCalories: est.totalCalories,
                            macrosPerServing: est.macrosPerServing,
                            calculationMethod: 'AI_ESTIMATED',
                            nutrition: est,
                          } : null);
                        }}
                        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                          parsedRecipe.calculationMethod === 'AI_ESTIMATED' || !parsedRecipe.calculationMethod
                            ? 'bg-purple-50 text-purple-900 border border-purple-200 font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-black'
                        }`}
                        title="Method A: AI Auto-Estimation"
                      >
                        ✨ {lang === 'FR' ? 'Méthode A (IA)' : 'Method A (AI)'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const servingsNum = parseInt(parsedRecipe.servings?.replace(/\D/g, '') || '4', 10) || 4;
                          const dyn = recalculateDynamicNutrition(parsedRecipe.ingredients, servingsNum);
                          setParsedRecipe((prev) => prev ? {
                            ...prev,
                            calories: `${dyn.caloriesPerServing} kcal`,
                            caloriesPerServing: dyn.caloriesPerServing,
                            totalCalories: dyn.totalCalories,
                            macrosPerServing: dyn.macrosPerServing,
                            calculationMethod: 'DYNAMIC_AGGREGATED',
                            nutrition: dyn,
                          } : null);
                        }}
                        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                          parsedRecipe.calculationMethod === 'DYNAMIC_AGGREGATED'
                            ? 'bg-teal-50 text-teal-900 border border-teal-200 font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-black'
                        }`}
                        title="Method B: Dynamic Aggregation"
                      >
                        ⚙️ {lang === 'FR' ? 'Méthode B (Dynamique)' : 'Method B (Dynamic)'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const isManual = parsedRecipe.calculationMethod === 'MANUAL_OVERRIDE';
                          setParsedRecipe((prev) => prev ? {
                            ...prev,
                            calculationMethod: isManual ? 'DYNAMIC_AGGREGATED' : 'MANUAL_OVERRIDE',
                          } : null);
                        }}
                        className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                          parsedRecipe.calculationMethod === 'MANUAL_OVERRIDE'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200 font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-black'
                        }`}
                        title="Method C: Manual Override"
                      >
                        {parsedRecipe.calculationMethod === 'MANUAL_OVERRIDE' ? (
                          <Lock className="w-2.5 h-2.5 text-amber-700" />
                        ) : (
                          <Unlock className="w-2.5 h-2.5" />
                        )}
                        <span>{lang === 'FR' ? 'Méthode C (Manuel)' : 'Method C (Manual)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Calories Inputs */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#0D3B37] flex items-center justify-between">
                        <span>{lang === 'FR' ? 'Calories / portion :' : 'Calories / serving:'}</span>
                        {parsedRecipe.calculationMethod === 'MANUAL_OVERRIDE' && (
                          <span className="text-[9px] text-amber-800 font-mono font-bold">🔒 Locked</span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={parsedRecipe.caloriesPerServing || parseInt((parsedRecipe.calories || '400').replace(/\D/g, ''), 10) || 400}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            const s = parseInt((parsedRecipe.servings || '4').replace(/\D/g, ''), 10) || 4;
                            setParsedRecipe((prev) => prev ? {
                              ...prev,
                              calories: `${val} kcal`,
                              caloriesPerServing: val,
                              totalCalories: val * s,
                              calculationMethod: 'MANUAL_OVERRIDE',
                            } : null);
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#D5CDBC] font-mono text-sm font-bold text-[#0D3B37] focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400">kcal</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#0D3B37]">
                        {lang === 'FR' ? 'Total plat (kcal) :' : 'Total dish calories:'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={parsedRecipe.totalCalories || ((parsedRecipe.caloriesPerServing || 400) * (parseInt((parsedRecipe.servings || '4').replace(/\D/g, ''), 10) || 4))}
                          onChange={(e) => {
                            const total = Number(e.target.value) || 0;
                            const s = parseInt((parsedRecipe.servings || '4').replace(/\D/g, ''), 10) || 4;
                            const perS = Math.round(total / Math.max(1, s));
                            setParsedRecipe((prev) => prev ? {
                              ...prev,
                              calories: `${perS} kcal`,
                              caloriesPerServing: perS,
                              totalCalories: total,
                              calculationMethod: 'MANUAL_OVERRIDE',
                            } : null);
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-white border border-[#D5CDBC] font-mono text-sm font-bold text-[#0D3B37] focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                        />
                        <span className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-400">kcal</span>
                      </div>
                    </div>
                  </div>

                  {/* Macro Inputs (Protein, Carbs, Fat) */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#0D3B37] block">
                      {lang === 'FR' ? 'Macronutriments par portion :' : 'Macronutrients per serving:'}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Protein */}
                      <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 space-y-1 shadow-2xs">
                        <label className="text-[10px] font-bold uppercase text-sky-900 block">
                          {lang === 'FR' ? 'Protéines' : 'Protein'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={parsedRecipe.macrosPerServing?.proteinGrams ?? 28}
                            onChange={(e) => {
                              const p = Number(e.target.value) || 0;
                              setParsedRecipe((prev) => prev ? {
                                ...prev,
                                calculationMethod: 'MANUAL_OVERRIDE',
                                macrosPerServing: {
                                  proteinGrams: p,
                                  carbsGrams: prev.macrosPerServing?.carbsGrams ?? 40,
                                  fatGrams: prev.macrosPerServing?.fatGrams ?? 14,
                                },
                              } : null);
                            }}
                            className="w-full px-2 py-1 rounded-lg bg-white border border-sky-200 text-xs font-mono font-bold text-sky-950 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                          />
                          <span className="absolute right-2 top-1 text-[10px] font-bold text-slate-400">g</span>
                        </div>
                      </div>

                      {/* Carbs */}
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 space-y-1 shadow-2xs">
                        <label className="text-[10px] font-bold uppercase text-amber-900 block">
                          {lang === 'FR' ? 'Glucides' : 'Carbs'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={parsedRecipe.macrosPerServing?.carbsGrams ?? 42}
                            onChange={(e) => {
                              const c = Number(e.target.value) || 0;
                              setParsedRecipe((prev) => prev ? {
                                ...prev,
                                calculationMethod: 'MANUAL_OVERRIDE',
                                macrosPerServing: {
                                  proteinGrams: prev.macrosPerServing?.proteinGrams ?? 28,
                                  carbsGrams: c,
                                  fatGrams: prev.macrosPerServing?.fatGrams ?? 14,
                                },
                              } : null);
                            }}
                            className="w-full px-2 py-1 rounded-lg bg-white border border-amber-200 text-xs font-mono font-bold text-amber-950 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                          />
                          <span className="absolute right-2 top-1 text-[10px] font-bold text-slate-400">g</span>
                        </div>
                      </div>

                      {/* Fat */}
                      <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 space-y-1 shadow-2xs">
                        <label className="text-[10px] font-bold uppercase text-rose-900 block">
                          {lang === 'FR' ? 'Lipides' : 'Fat'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={parsedRecipe.macrosPerServing?.fatGrams ?? 15}
                            onChange={(e) => {
                              const f = Number(e.target.value) || 0;
                              setParsedRecipe((prev) => prev ? {
                                ...prev,
                                calculationMethod: 'MANUAL_OVERRIDE',
                                macrosPerServing: {
                                  proteinGrams: prev.macrosPerServing?.proteinGrams ?? 28,
                                  carbsGrams: prev.macrosPerServing?.carbsGrams ?? 42,
                                  fatGrams: f,
                                },
                              } : null);
                            }}
                            className="w-full px-2 py-1 rounded-lg bg-white border border-rose-200 text-xs font-mono font-bold text-rose-950 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                          />
                          <span className="absolute right-2 top-1 text-[10px] font-bold text-slate-400">g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OCR extracted raw text preview (if scanned from photo) */}
                {parsedRecipe.rawOcrText && (
                  <div className="p-3 rounded-xl bg-[#F8FAF6] border border-[#CADBC7] text-xs space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-[#1E3022] flex items-center gap-1.5 text-[11px]">
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{lang === 'FR' ? 'Texte extrait de la photo :' : 'Text extracted from photo:'}</span>
                      </p>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        OCR / Vision
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475C4B] line-clamp-3 whitespace-pre-wrap font-mono bg-white p-2 rounded-lg border border-[#D5E1D2]">
                      {parsedRecipe.rawOcrText}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* INGREDIENTS EDITOR CARD */}
            <div className="rounded-2xl border border-[#D5E1D2] bg-white p-4 sm:p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[#E1EDE0]">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#1E3022] uppercase tracking-wider flex items-center gap-1.5">
                    <span>{lang === 'FR' ? 'Ingrédients de la recette' : 'Recipe Ingredients'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black">
                      {parsedRecipe.ingredients.length}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {lang === 'FR' ? 'Modifiez les quantités, unités, noms et zones de rangement' : 'Adjust amounts, kitchen units, ingredient names, and storage zones'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{lang === 'FR' ? 'Ajouter un ingrédient' : 'Add Ingredient'}</span>
                </button>
              </div>

              {parsedRecipe.ingredients.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-[#D5E1D2] rounded-xl space-y-2 bg-[#F8FAF6]">
                  <p className="text-xs text-slate-500 font-bold">
                    {lang === 'FR' ? 'Aucun ingrédient pour le moment.' : 'No ingredients added yet.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{lang === 'FR' ? 'Ajouter le premier ingrédient' : 'Add First Ingredient'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {/* Table Column Titles for Desktop / Large Screens */}
                  <div className="hidden md:flex items-center gap-2 px-2.5 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none">
                    <span className="w-6 text-center shrink-0">#</span>
                    <span className="w-20 shrink-0 text-center">{lang === 'FR' ? 'Quantité' : 'Amount'}</span>
                    <span className="w-36 shrink-0">{lang === 'FR' ? 'Unité' : 'Unit'}</span>
                    <span className="flex-1 min-w-[140px]">{lang === 'FR' ? "Nom de l'ingrédient" : 'Ingredient name'}</span>
                    <span className="w-40 shrink-0">{lang === 'FR' ? 'Zone de rangement' : 'Storage zone'}</span>
                    <span className="w-7 text-center shrink-0"></span>
                  </div>

                  <div className="overflow-x-auto pb-1">
                    <div className="min-w-[620px] md:min-w-0 space-y-2">
                      {parsedRecipe.ingredients.map((ing, idx) => {
                        const isToTaste = ing.unit === 'to_taste';
                        const activeStorage =
                          ing.storage ||
                          (ing.locationType === 'FREEZER'
                            ? 'freezer'
                            : ing.locationType === 'PANTRY'
                            ? 'pantry'
                            : 'fridge');

                        return (
                          <div
                            key={ing.id || idx}
                            className="p-2 sm:p-2.5 rounded-xl bg-[#FAFBF9] border border-[#D5E1D2] flex items-center gap-2 shadow-2xs hover:border-emerald-400 transition-all group"
                          >
                            {/* [ # ] Index Badge on the far left */}
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center shrink-0 select-none shadow-2xs">
                              {idx + 1}
                            </span>

                            {/* [ Quantité ] Text/Number input supporting fractions & decimals */}
                            <div className="w-16 sm:w-20 shrink-0">
                              <input
                                type="text"
                                disabled={isToTaste}
                                value={isToTaste ? '' : (ing.amount || '')}
                                onChange={(e) => handleUpdateIngredient(idx, { amount: e.target.value })}
                                placeholder={isToTaste ? '—' : (lang === 'FR' ? 'ex. 1' : 'e.g. 1')}
                                className="w-full text-xs font-bold text-slate-700 border border-slate-200 rounded-lg px-2 py-1.5 focus:border-emerald-600 focus:outline-none bg-white text-center disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                                title={lang === 'FR' ? 'Quantité (ex. 1, 1/2, 1.5, 250)' : 'Amount (e.g. 1, 1/2, 1.5, 250)'}
                              />
                            </div>

                            {/* [ Sélecteur d'unité ] Kitchen Unit Selector with optgroup */}
                            <div className="w-32 sm:w-36 shrink-0">
                              <select
                                value={ing.unit || 'unit'}
                                onChange={(e) => {
                                  const newUnit = e.target.value;
                                  handleUpdateIngredient(idx, {
                                    unit: newUnit,
                                    amount:
                                      newUnit === 'to_taste'
                                        ? ''
                                        : ing.amount && ing.amount !== '—'
                                        ? ing.amount
                                        : '1',
                                  });
                                }}
                                className="w-full text-[11px] sm:text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-2 py-1.5 focus:border-emerald-600 focus:outline-none bg-white cursor-pointer transition-colors"
                              >
                                <optgroup label={lang === 'FR' ? 'Général' : 'General'}>
                                  <option value="unit">
                                    {lang === 'FR' ? 'Sans unité (unité entière)' : 'No unit (whole unit)'}
                                  </option>
                                </optgroup>
                                <optgroup label={lang === 'FR' ? 'Mesures culinaires' : 'Culinary measures'}>
                                  <option value="tsp">{lang === 'FR' ? 'c. à thé (c.à.t / tsp)' : 'tsp (teaspoon)'}</option>
                                  <option value="tbsp">{lang === 'FR' ? 'c. à soupe (c.à.s / tbsp)' : 'tbsp (tablespoon)'}</option>
                                  <option value="cup">{lang === 'FR' ? 'tasse (cup)' : 'cup'}</option>
                                  <option value="pinch">{lang === 'FR' ? 'pincée' : 'pinch'}</option>
                                </optgroup>
                                <optgroup label={lang === 'FR' ? 'Système métrique' : 'Metric system'}>
                                  <option value="ml">ml</option>
                                  <option value="l">L</option>
                                  <option value="g">g</option>
                                  <option value="kg">kg</option>
                                </optgroup>
                                <optgroup label={lang === 'FR' ? 'Système impérial / US' : 'Imperial / US system'}>
                                  <option value="oz">oz</option>
                                  <option value="fl_oz">fl oz</option>
                                  <option value="lb">lb</option>
                                </optgroup>
                                <optgroup label={lang === 'FR' ? 'Spécifique & Approximations' : 'Specific & Approximations'}>
                                  <option value="to_taste">
                                    {lang === 'FR' ? 'Au goût (to taste)' : 'To taste (au goût)'}
                                  </option>
                                  <option value="clove">{lang === 'FR' ? 'gousse' : 'clove'}</option>
                                  <option value="slice">{lang === 'FR' ? 'tranche' : 'slice'}</option>
                                  <option value="can">{lang === 'FR' ? 'boîte / conserve' : 'can / tin'}</option>
                                  <option value="bunch">{lang === 'FR' ? 'botte / bouquet' : 'bunch / bundle'}</option>
                                  <option value="packet">{lang === 'FR' ? 'sachet / paquet' : 'packet / pouch'}</option>
                                  <option value="piece">{lang === 'FR' ? 'pièce / morceau' : 'piece / pc'}</option>
                                </optgroup>
                              </select>
                            </div>

                            {/* [ Nom de l'ingrédient ] Free text input with bilingual subtitle preview */}
                            <div className="flex-1 min-w-[130px] space-y-0.5">
                              <input
                                type="text"
                                value={lang === 'FR' ? (ing.nameFr || getItemDisplayName(ing, 'FR')) : (ing.name || ing.nameEn || getItemDisplayName(ing, 'EN'))}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateIngredient(
                                    idx,
                                    lang === 'FR'
                                      ? { nameFr: val, name: ing.name || val }
                                      : { name: val, nameFr: ing.nameFr || val }
                                  );
                                }}
                                placeholder={
                                  lang === 'FR'
                                    ? "ex. Huile d'olive, Sel, Farine..."
                                    : 'e.g. Olive oil, Salt, Flour...'
                                }
                                className="w-full font-bold text-xs text-[#1E3022] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-600 focus:outline-none bg-white placeholder:font-normal placeholder:text-slate-400 transition-colors"
                              />
                              {(() => {
                                const displaySub = lang === 'FR' ? (ing.nameEn || ing.name) : ing.nameFr;
                                const activeMain = lang === 'FR' ? (ing.nameFr || getItemDisplayName(ing, 'FR')) : (ing.name || ing.nameEn);
                                if (displaySub && activeMain && displaySub.toLowerCase() !== activeMain.toLowerCase()) {
                                  return (
                                    <p className="text-[10px] text-slate-400 px-1 truncate font-medium">
                                      <span className="font-bold text-slate-500">{lang === 'FR' ? 'EN:' : 'FR:'}</span>{' '}
                                      {displaySub}
                                    </p>
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            {/* [ Zone de rangement ] Retained styled dropdown for kitchen locations */}
                            <div className="w-32 sm:w-40 shrink-0">
                              <select
                                value={activeStorage}
                                onChange={(e) => {
                                  const newStorage = e.target.value;
                                  const locType: 'FRIDGE' | 'FREEZER' | 'PANTRY' | 'SPICE_RACK' =
                                    newStorage === 'freezer'
                                      ? 'FREEZER'
                                      : newStorage === 'fridge'
                                      ? 'FRIDGE'
                                      : newStorage === 'spices'
                                      ? 'SPICE_RACK'
                                      : 'PANTRY';
                                  handleUpdateIngredient(idx, {
                                    storage: newStorage,
                                    locationType: locType,
                                  });
                                }}
                                className={`w-full text-[10px] sm:text-xs font-black px-2 py-1.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors ${
                                  activeStorage === 'freezer'
                                    ? 'bg-blue-50 text-blue-900 border-blue-200'
                                    : activeStorage === 'spices'
                                    ? 'bg-purple-50 text-purple-900 border-purple-200'
                                    : activeStorage === 'pantry'
                                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                }`}
                              >
                                <option value="pantry">🥫 {lang === 'FR' ? 'Garde-manger' : 'Pantry'}</option>
                                <option value="fridge">❄️ {lang === 'FR' ? 'Frigo' : 'Fridge'}</option>
                                <option value="freezer">🧊 {lang === 'FR' ? 'Congélateur' : 'Freezer'}</option>
                                <option value="spices">🧂 {lang === 'FR' ? 'Épices' : 'Spices'}</option>
                              </select>
                            </div>

                            {/* [ Supprimer ] Icon button (Trash icon) to remove row */}
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(idx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                              title={lang === 'FR' ? 'Supprimer cet ingrédient' : 'Remove ingredient'}
                              aria-label={lang === 'FR' ? 'Supprimer cet ingrédient' : 'Remove ingredient'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* INSTRUCTIONS & STEPS EDITOR CARD */}
            <div className="rounded-2xl border border-[#D5E1D2] bg-white p-4 sm:p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[#E1EDE0]">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#1E3022] uppercase tracking-wider flex items-center gap-1.5">
                    <span>{lang === 'FR' ? 'Étapes de préparation' : 'Cooking Instructions'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 text-[10px] font-black">
                      {(lang === 'FR' && parsedRecipe.instructionsFr?.length ? parsedRecipe.instructionsFr.length : parsedRecipe.instructionsEn?.length) || 0}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {lang === 'FR' ? 'Réorganisez, ajoutez ou peaufinez chaque étape de la recette' : 'Reorder, add, or refine each step of the recipe'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddInstructionStep}
                  className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{lang === 'FR' ? '+ Ajouter une étape' : '+ Add Step'}</span>
                </button>
              </div>

              {((lang === 'FR' && parsedRecipe.instructionsFr && parsedRecipe.instructionsFr.length > 0
                ? parsedRecipe.instructionsFr
                : parsedRecipe.instructionsEn || []
              ).length === 0) ? (
                <div className="p-6 text-center border-2 border-dashed border-[#D5E1D2] rounded-xl space-y-2 bg-[#F8FAF6]">
                  <p className="text-xs text-slate-500 font-bold">
                    {lang === 'FR' ? 'Aucune étape de préparation enregistrée.' : 'No cooking steps recorded yet.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleAddInstructionStep}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-700 text-white text-xs font-black inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'FR' ? 'Ajouter la première étape' : 'Add First Step'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {(lang === 'FR' && parsedRecipe.instructionsFr && parsedRecipe.instructionsFr.length > 0
                    ? parsedRecipe.instructionsFr
                    : parsedRecipe.instructionsEn || []
                  ).map((step, idx, arr) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#FAFBF9] border border-[#D5E1D2] flex items-start gap-2.5 shadow-2xs hover:border-teal-400 transition-all group"
                    >
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-900 font-black text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveInstructionStep(idx, 'up')}
                          className="p-0.5 text-slate-400 hover:text-teal-700 disabled:opacity-20 cursor-pointer"
                          title={lang === 'FR' ? 'Déplacer vers le haut' : 'Move up'}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === arr.length - 1}
                          onClick={() => handleMoveInstructionStep(idx, 'down')}
                          className="p-0.5 text-slate-400 hover:text-teal-700 disabled:opacity-20 cursor-pointer"
                          title={lang === 'FR' ? 'Déplacer vers le bas' : 'Move down'}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={step}
                        onChange={(e) => handleUpdateInstructionStep(idx, e.target.value)}
                        placeholder={lang === 'FR' ? `Instructions pour l'étape ${idx + 1}...` : `Instructions for step ${idx + 1}...`}
                        className="flex-1 text-xs text-[#223825] leading-relaxed border border-slate-200 rounded-xl p-2.5 focus:border-teal-600 focus:outline-none bg-white resize-y shadow-2xs"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveInstructionStep(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 mt-1 cursor-pointer"
                        title={lang === 'FR' ? 'Supprimer cette étape' : 'Remove step'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <footer className="p-4 bg-white border-t border-[#E1EDE0] flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {lang === 'FR' ? 'Annuler' : 'Cancel'}
        </button>

        {!parsedRecipe ? (
          <button
            type="button"
            onClick={handleAIParse}
            disabled={isParsing}
            className="px-5 py-2.5 rounded-xl bg-[#1E3022] hover:bg-black text-white text-xs font-black flex items-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>
              {isParsing
                ? lang === 'FR'
                  ? 'Importation & analyse en cours...'
                  : 'Importing & parsing...'
                : activeTab === 'url'
                ? lang === 'FR'
                  ? 'Importer depuis le Web'
                  : 'Import Recipe from Web'
                : lang === 'FR'
                ? 'Analyser avec l’IA Gemini'
                : 'AI Parse Recipe with Gemini'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConfirmSave}
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {recipeToEdit
                ? lang === 'FR'
                  ? 'Enregistrer les modifications'
                  : 'Save Changes'
                : lang === 'FR'
                ? 'Enregistrer dans ma cuisine'
                : 'Save Recipe to My Kitchen'}
            </span>
          </button>
        )}
      </footer>
    </div>
  );
};
