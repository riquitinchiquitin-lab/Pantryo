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
} from 'lucide-react';
import { RicardoRecipe, RecipeIngredient } from '../data/ricardoRecipes';
import { useLanguage } from '../utils/i18n';
import {
  RecipeWebsiteSource,
  getStoredRecipeWebsites,
  saveStoredRecipeWebsites,
} from '../data/recipeWebsites';

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeSaved: (recipe: RicardoRecipe) => void;
  lang?: 'EN' | 'FR';
  initialTab?: 'url' | 'youtube' | 'text' | 'photo';
  autoOpenCam?: boolean;
  initialPhotoBase64?: string | null;
}

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({
  isOpen,
  onClose,
  onRecipeSaved,
  lang: propLang,
  initialTab = 'url',
  autoOpenCam = false,
  initialPhotoBase64 = null,
}) => {
  const { lang: globalLang } = useLanguage();
  const lang = propLang || globalLang;

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

  // Processing states
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Review & Edit state after AI has parsed
  const [parsedRecipe, setParsedRecipe] = useState<RicardoRecipe | null>(null);

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

      setParsedRecipe(data.recipe);
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
      if (initialPhotoBase64) {
        setPhotoBase64(initialPhotoBase64);
        setActiveTab('photo');
        setParsedRecipe(null);
        triggerPhotoImport(initialPhotoBase64);
      } else if (initialTab) {
        setActiveTab(initialTab);
        if (initialTab !== 'photo') {
          setParsedRecipe(null);
        }
      }
    } else {
      setParsedRecipe(null);
      setPhotoBase64(null);
      setErrorMsg(null);
      setParsingStep('');
      setIsParsing(false);
    }
  }, [isOpen, initialTab, initialPhotoBase64]);

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

  // Convert a discovered website recipe directly into parsed recipe for 1-click import
  const handleSelectDiscoveredRecipe = (recipe: any) => {
    const mapped: RicardoRecipe = {
      id: recipe.id || `custom_${Date.now()}`,
      title: recipe.title || 'Imported Recipe',
      titleFr: recipe.titleFr || recipe.title || 'Recette Importée',
      ricardoUrlEn: recipe.sourceUrl || '',
      ricardoUrlFr: recipe.sourceUrl || '',
      imageUrl:
        recipe.imageUrl ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      time: recipe.totalTime || recipe.cookTime || '30 mins',
      prepTime: recipe.prepTime || '15 mins',
      cookTime: recipe.cookTime || '20 mins',
      servings: recipe.servings || '4 servings',
      difficulty: (recipe.difficulty as any) || 'Easy',
      difficultyFr: recipe.difficultyFr || 'Facile',
      calories: '450 kcal',
      source: recipe.source || inspectedSiteName || 'Web',
      isRicardoOfficial: false,
      isCustom: true,
      descriptionEn: recipe.descriptionEn || recipe.zeroWasteReason || '',
      descriptionFr: recipe.descriptionFr || recipe.zeroWasteReason || '',
      tags: recipe.tags || ['Web Recipe', 'Anti-Gaspillage'],
      suggestedPantryNeeds: recipe.suggestedPantryNeeds || [],
      ingredients: (recipe.ingredients || []).map((ing: any) => ({
        name: ing.name,
        nameFr: ing.nameFr || ing.name,
        amount: ing.amount || '1 portion',
        category: ing.category || 'Pantry Staples',
        locationType: ing.locationType || 'FRIDGE',
      })),
      instructionsEn: recipe.instructionsEn || [],
      instructionsFr: recipe.instructionsFr || [],
      createdAt: new Date().toISOString(),
    };
    setParsedRecipe(mapped);
    setDiscoveredWebsiteRecipes([]);
    setInspectedSiteName(null);
    setInspectionNotice(null);
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

        setParsedRecipe(data.recipe);
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

        setParsedRecipe(data.recipe);
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
        setParsedRecipe(data.recipe);
      }
    } catch (err: any) {
      console.error('Translation failed:', err);
      setErrorMsg(err.message || 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  // Save reviewed recipe to backend and trigger parent callback
  const handleConfirmSave = async () => {
    if (!parsedRecipe) return;

    try {
      const res = await fetch('/api/v1/recipes/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedRecipe),
      });
      const data = await res.json();
      const saved = data.success ? data.recipe : parsedRecipe;
      setParsedRecipe(null);
      setPhotoBase64(null);
      onRecipeSaved(saved);
      onClose();
    } catch (err) {
      console.error('Failed to save recipe to backend:', err);
      const fallback = parsedRecipe;
      setParsedRecipe(null);
      setPhotoBase64(null);
      onRecipeSaved(fallback);
      onClose();
    }
  };

  return (
    <div
      id="add-recipe-fullscreen-view"
      className="fixed inset-0 z-50 bg-[#F8FAF6] flex flex-col w-full h-full overflow-hidden text-[#133E3B] animate-fade-in"
    >
      {/* Top Header Bar */}
      <header className="px-4 sm:px-6 py-3.5 bg-white border-b border-[#E1EDE0] flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1E3022]">
              {lang === 'FR' ? 'Importer ou Ajouter une Recette' : 'Import or Add a Recipe'}
            </h2>
            <p className="text-[11px] text-[#556D58]">
              {lang === 'FR'
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
          className="px-4 py-2 rounded-full bg-[#EFEAE0] hover:bg-[#E2DBCB] text-[#133E3B] font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 border border-[#D5CDBC] shadow-2xs shrink-0"
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
            {/* Source Tabs: URL, YouTube, Text, Photo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-white border border-[#D5E1D2] rounded-2xl shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('url');
                  setErrorMsg(null);
                }}
                className={`py-2.5 px-2 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'url'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
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
                className={`py-2.5 px-2 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'youtube'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
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
                className={`py-2.5 px-2 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'text'
                    ? 'bg-[#233527] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
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
                className={`py-2.5 px-2 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'photo'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
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
                            'https://www.ricardocuisine.com/recettes/5993-soupe-a-l-oignon-gratinée'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#EBF3EA] hover:bg-[#DCEBD9] text-[#1E3022] text-[10px] font-bold transition-colors"
                      >
                        Ricardo (Soupe à l'oignon)
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
                        Marmiton (Poulet Curry)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          loadSampleWebUrl(
                            'https://www.seriouseats.com/easy-pan-pizza-recipe'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-[#EBF3EA] hover:bg-[#DCEBD9] text-[#1E3022] text-[10px] font-bold transition-colors"
                      >
                        Serious Eats (Pan Pizza)
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
                                onClick={() => handleSelectDiscoveredRecipe(rec)}
                                className="mt-2.5 px-3 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                <span>{lang === 'FR' ? 'Importer cette recette' : 'Import recipe'}</span>
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
          /* REVIEW & EDIT STEP ONCE PARSED BY AI */
          <div className="space-y-4 animate-fade-in">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                <span className="font-extrabold">
                  {lang === 'FR'
                    ? 'Recette importée avec succès ! Vérifiez les détails :'
                    : 'Recipe imported successfully! Review details:'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setParsedRecipe(null)}
                className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'FR' ? 'Modifier la source' : 'Edit Input'}</span>
              </button>
            </div>

            {/* Recipe Image & Title Card */}
            <div className="rounded-2xl border border-[#D5E1D2] bg-white overflow-hidden shadow-2xs space-y-3">
              {parsedRecipe.imageUrl && (
                <div className="h-36 w-full relative bg-slate-100">
                  <img
                    src={parsedRecipe.imageUrl}
                    alt={parsedRecipe.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[9px] font-black tracking-wider uppercase backdrop-blur-xs">
                    {parsedRecipe.source}
                  </span>
                  {parsedRecipe.ricardoUrlEn && (
                    <a
                      href={parsedRecipe.ricardoUrlEn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-white/90 text-slate-800 text-[10px] font-bold flex items-center gap-1 hover:bg-white"
                    >
                      <span>{lang === 'FR' ? 'Source web' : 'Web page'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              <div className="p-4 space-y-3">
                {/* On-Demand Translation Control Bar */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#E1EDE0]">
                  <div className="flex items-center gap-1.5 text-xs text-[#556D58]">
                    <Languages className="w-4 h-4 text-teal-700" />
                    <span className="font-bold">
                      {lang === 'FR' ? 'Langue de la recette :' : 'Recipe Language:'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isTranslating}
                      onClick={() => handleTranslateRecipe('FR')}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-black border border-[#D5E1D2] bg-white hover:bg-teal-50 text-teal-900 transition-colors disabled:opacity-50"
                    >
                      {isTranslating ? '...' : '🇫🇷 Traduire en Français'}
                    </button>
                    <button
                      type="button"
                      disabled={isTranslating}
                      onClick={() => handleTranslateRecipe('EN')}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-black border border-[#D5E1D2] bg-white hover:bg-teal-50 text-teal-900 transition-colors disabled:opacity-50"
                    >
                      {isTranslating ? '...' : '🇬🇧 Translate to English'}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {lang === 'FR' ? 'Titre de la recette' : 'Recipe Title'}
                  </label>
                  <input
                    type="text"
                    value={lang === 'FR' && parsedRecipe.titleFr ? parsedRecipe.titleFr : parsedRecipe.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setParsedRecipe((prev) =>
                        prev
                          ? lang === 'FR'
                            ? { ...prev, titleFr: val }
                            : { ...prev, title: val }
                          : null
                      );
                    }}
                    className="w-full font-black text-base text-[#1E3022] border-b border-[#D5E1D2] pb-1 focus:outline-none focus:border-emerald-600 bg-transparent"
                  />
                </div>

                <p className="text-xs text-[#556D58] leading-relaxed italic">
                  "{lang === 'FR' && parsedRecipe.descriptionFr ? parsedRecipe.descriptionFr : parsedRecipe.descriptionEn}"
                </p>

                <div className="flex items-center gap-3 text-xs text-[#556D58] pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> {parsedRecipe.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" /> {parsedRecipe.calories}
                  </span>
                  <span className="font-bold text-[#233527]">
                    {parsedRecipe.servings}
                  </span>
                </div>

                {parsedRecipe.rawOcrText && (
                  <div className="mt-3 p-3 rounded-xl bg-[#F8FAF6] border border-[#CADBC7] text-xs space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-[#1E3022] flex items-center gap-1.5 text-[11px]">
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{lang === 'FR' ? 'Texte extrait de la photo :' : 'Text extracted from photo:'}</span>
                      </p>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        OCR / Vision
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475C4B] line-clamp-4 whitespace-pre-wrap font-mono bg-white p-2 rounded-lg border border-[#D5E1D2]">
                      {parsedRecipe.rawOcrText}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Structured Ingredients Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#1E3022] uppercase tracking-wider">
                  {lang === 'FR' ? 'Ingrédients Détectés' : 'Parsed Ingredients'} ({parsedRecipe.ingredients.length})
                </span>
                <span className="text-[10px] text-slate-500">
                  {lang === 'FR' ? 'Zones de rangement attribuées' : 'Auto-zoned for your kitchen'}
                </span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {parsedRecipe.ingredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white border border-[#D5E1D2] text-xs flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-[#1E3022] truncate">
                        {lang === 'FR' && ing.nameFr ? ing.nameFr : ing.name}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        ({ing.amount})
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-md border shrink-0 ${
                        ing.locationType === 'FREEZER'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : ing.locationType === 'PANTRY'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {ing.locationType || 'FRIDGE'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions Preview */}
            <div className="space-y-2">
              <span className="text-xs font-black text-[#1E3022] uppercase tracking-wider">
                {lang === 'FR' ? 'Étapes de préparation' : 'Cooking Instructions'} (
                {lang === 'FR' && parsedRecipe.instructionsFr?.length
                  ? parsedRecipe.instructionsFr.length
                  : parsedRecipe.instructionsEn?.length || 0}
                )
              </span>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {(lang === 'FR' && parsedRecipe.instructionsFr?.length
                  ? parsedRecipe.instructionsFr
                  : parsedRecipe.instructionsEn || []
                ).map((step, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white border border-[#D5E1D2] text-xs text-[#334D37] flex items-start gap-2 shadow-2xs"
                  >
                    <span className="font-black text-emerald-700 shrink-0">{idx + 1}.</span>
                    <p className="leading-snug flex-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <footer className="p-4 bg-white border-t border-[#E1EDE0] flex items-center justify-between gap-3 shrink-0 shadow-2xs">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {lang === 'FR' ? 'Annuler' : 'Cancel'}
        </button>

        {!parsedRecipe ? (
          <button
            type="button"
            onClick={handleAIParse}
            disabled={isParsing}
            className="px-5 py-2.5 rounded-xl bg-[#1E3022] hover:bg-black text-white text-xs font-black flex items-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
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
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black flex items-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>
              {lang === 'FR'
                ? 'Enregistrer dans ma cuisine'
                : 'Save Recipe to My Kitchen'}
            </span>
          </button>
        )}
      </footer>
    </div>
  );
};
