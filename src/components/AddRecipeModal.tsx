import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Youtube,
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
} from 'lucide-react';
import { RicardoRecipe, RecipeIngredient } from '../data/ricardoRecipes';

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeSaved: (recipe: RicardoRecipe) => void;
  lang?: 'EN' | 'FR';
}

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({
  isOpen,
  onClose,
  onRecipeSaved,
  lang = 'EN',
}) => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'text' | 'photo'>('youtube');

  // Input states
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeNotes, setYoutubeNotes] = useState('');
  const [recipeText, setRecipeText] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState('image/jpeg');

  // Processing state
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Review & Edit state after AI has parsed
  const [parsedRecipe, setParsedRecipe] = useState<RicardoRecipe | null>(null);

  if (!isOpen) return null;

  // Extract YouTube ID helper for preview
  const extractYtId = (url: string) => {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
    );
    return match ? match[1] : null;
  };

  const detectedYtId = extractYtId(youtubeUrl);

  // Sample data loaders for instant 1-click test
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
    // Elegant base64 recipe card placeholder with visual styling
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

  // Run AI Parse
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
            ? 'Extraction des ingrédients & mesures...'
            : 'Extracting ingredients, units & measurements...'
        );
      }, 700);

      setTimeout(() => {
        setParsingStep(
          lang === 'FR'
            ? 'Attribution des zones de stockage (Frigo, Congélateur, Garde-manger)...'
            : 'Mapping kitchen storage zones (Fridge, Freezer, Pantry)...'
        );
      }, 1400);

      let payload: any = {
        mode: activeTab,
        language: lang,
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
    } catch (err: any) {
      console.error('AI Parse failed:', err);
      setErrorMsg(err.message || 'Error communicating with AI service');
    } finally {
      setIsParsing(false);
      setParsingStep('');
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
      onRecipeSaved(saved);
      onClose();
    } catch (err) {
      console.error('Failed to save recipe to backend:', err);
      onRecipeSaved(parsedRecipe);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
      <div className="w-full max-w-lg bg-[#F8FAF6] rounded-3xl shadow-2xl border border-[#D5E1D2] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#E1EDE0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1E3022]">
                {lang === 'FR' ? 'Ajouter une Recette avec IA' : 'Add Recipe with AI'}
              </h3>
              <p className="text-[11px] text-[#556D58]">
                {lang === 'FR'
                  ? 'YouTube, texte ou photo : l’IA s’occupe du reste'
                  : 'Paste YouTube, text, or snap photo & AI does the rest'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* If NOT yet parsed, show source selectors and inputs */}
          {!parsedRecipe ? (
            <>
              {/* Source Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white border border-[#D5E1D2] rounded-2xl shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('youtube');
                    setErrorMsg(null);
                  }}
                  className={`py-2 px-1.5 rounded-xl font-extrabold flex flex-col items-center gap-1 transition-all ${
                    activeTab === 'youtube'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Youtube className="w-4 h-4" />
                  <span className="text-[10px] tracking-tight">YouTube</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('text');
                    setErrorMsg(null);
                  }}
                  className={`py-2 px-1.5 rounded-xl font-extrabold flex flex-col items-center gap-1 transition-all ${
                    activeTab === 'text'
                      ? 'bg-[#233527] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-[10px] tracking-tight">
                    {lang === 'FR' ? 'Texte / Notes' : 'Personal Text'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('photo');
                    setErrorMsg(null);
                  }}
                  className={`py-2 px-1.5 rounded-xl font-extrabold flex flex-col items-center gap-1 transition-all ${
                    activeTab === 'photo'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] tracking-tight">
                    {lang === 'FR' ? 'Photo / Scan' : 'Photo / Scan'}
                  </span>
                </button>
              </div>

              {/* TAB 1: YOUTUBE */}
              {activeTab === 'youtube' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-[#1E3022]">
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
                    <div className="absolute left-3 top-2.5 text-rose-600">
                      <Youtube className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-[#D5E1D2] rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-800 font-medium"
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
                      className="w-full p-2.5 bg-white border border-[#D5E1D2] rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: TEXT */}
              {activeTab === 'text' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-[#1E3022]">
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
                    className="w-full p-3 bg-white border border-[#D5E1D2] rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800 font-mono leading-relaxed"
                  />
                  <p className="text-[10px] text-[#647C67]">
                    {lang === 'FR'
                      ? "Conseil : Vous pouvez coller du texte brut depuis un message, un site web ou vos notes personnelles. L'IA structure automatiquement les ingrédients et le rangement."
                      : 'Tip: You can paste messy or unformatted text from notes, text messages, or blogs. Gemini will standardize measurements and storage zones.'}
                  </p>
                </div>
              )}

              {/* TAB 3: PHOTO / SCAN */}
              {activeTab === 'photo' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-[#1E3022]">
                      {lang === 'FR'
                        ? 'Photo d’un livre de cuisine ou fiche recette'
                        : 'Cookbook Page or Recipe Card Photo'}
                    </label>
                    <button
                      type="button"
                      onClick={loadSamplePhoto}
                      className="text-[10px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{lang === 'FR' ? 'Photo d’exemple' : 'Load Sample Photo'}</span>
                    </button>
                  </div>

                  {photoBase64 ? (
                    <div className="relative rounded-2xl overflow-hidden border border-[#D5E1D2] bg-slate-100 group">
                      <img
                        src={photoBase64}
                        alt="Recipe capture"
                        className="w-full max-h-48 object-contain bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotoBase64(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-xl text-xs transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{lang === 'FR' ? 'Changer' : 'Change'}</span>
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[#CADBC7] hover:border-emerald-600 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 bg-white cursor-pointer transition-colors text-center">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="font-extrabold text-xs text-[#1E3022]">
                        {lang === 'FR' ? 'Cliquez pour téléverser une photo' : 'Upload or Drag Recipe Photo'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        PNG, JPG, WebP (Cookbook page, handwritten card, packaging)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Error Callout */}
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-fade-in font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Loading State Animation */}
              {isParsing && (
                <div className="p-4 rounded-2xl bg-[#EAF2E8] border border-[#CADBC7] space-y-2 text-center animate-fade-in">
                  <div className="flex items-center justify-center gap-2 text-emerald-800 font-extrabold text-xs">
                    <Sparkles className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>{parsingStep}</span>
                  </div>
                  <div className="w-full bg-white/70 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 animate-pulse rounded-full w-3/4 mx-auto" />
                  </div>
                  <p className="text-[10px] text-[#556D58]">
                    Powered by Google Gemini 3.8 Flash
                  </p>
                </div>
              )}
            </>
          ) : (
            /* REVIEW & EDIT STEP ONCE PARSED BY AI */
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-extrabold">
                    {lang === 'FR' ? 'Recette analysée avec succès par l’IA !' : 'Recipe parsed successfully by AI!'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setParsedRecipe(null)}
                  className="text-[10px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === 'FR' ? 'Recommencer' : 'Edit Input'}</span>
                </button>
              </div>

              {/* Recipe Image & Title Card */}
              <div className="rounded-2xl border border-[#D5E1D2] bg-white overflow-hidden shadow-2xs space-y-3">
                {parsedRecipe.imageUrl && (
                  <div className="h-32 w-full relative bg-slate-100">
                    <img
                      src={parsedRecipe.imageUrl}
                      alt={parsedRecipe.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[9px] font-black tracking-wider uppercase backdrop-blur-xs">
                      {parsedRecipe.source}
                    </span>
                  </div>
                )}

                <div className="p-3 space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {lang === 'FR' ? 'Titre de la recette' : 'Recipe Title'}
                    </label>
                    <input
                      type="text"
                      value={lang === 'FR' ? parsedRecipe.titleFr : parsedRecipe.title}
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
                      className="w-full font-black text-sm text-[#1E3022] border-b border-[#D5E1D2] pb-1 focus:outline-none focus:border-emerald-600 bg-transparent"
                    />
                  </div>

                  <p className="text-[11px] text-[#556D58] leading-relaxed italic">
                    "{lang === 'FR' ? parsedRecipe.descriptionFr : parsedRecipe.descriptionEn}"
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-[#556D58] pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-600" /> {parsedRecipe.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-500" /> {parsedRecipe.calories}
                    </span>
                    <span className="font-bold text-[#233527]">
                      {parsedRecipe.servings}
                    </span>
                  </div>
                </div>
              </div>

              {/* Structured Ingredients Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-[#1E3022] uppercase tracking-wider">
                    {lang === 'FR' ? 'Ingrédients Détectés' : 'Parsed Ingredients'} ({parsedRecipe.ingredients.length})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {lang === 'FR' ? 'Zones de rangement attribuées' : 'Auto-zoned for your kitchen'}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {parsedRecipe.ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-white border border-[#D5E1D2] text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[#1E3022] truncate">
                          {lang === 'FR' && ing.nameFr ? ing.nameFr : ing.name}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
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
                <span className="text-[11px] font-black text-[#1E3022] uppercase tracking-wider">
                  {lang === 'FR' ? 'Étapes de préparation' : 'Cooking Instructions'} (
                  {lang === 'FR'
                    ? parsedRecipe.instructionsFr.length
                    : parsedRecipe.instructionsEn.length}
                  )
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                  {(lang === 'FR'
                    ? parsedRecipe.instructionsFr
                    : parsedRecipe.instructionsEn
                  ).map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-white border border-[#D5E1D2] text-[#334D37] flex items-start gap-2"
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
        <div className="p-4 bg-white border-t border-[#E1EDE0] flex items-center justify-between gap-3 shrink-0">
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
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {isParsing
                  ? lang === 'FR'
                    ? 'Analyse en cours...'
                    : 'Parsing with AI...'
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
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>
                {lang === 'FR'
                  ? 'Enregistrer dans ma cuisine'
                  : 'Save Recipe to My Kitchen'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
