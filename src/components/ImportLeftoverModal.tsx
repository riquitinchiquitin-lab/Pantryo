import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Utensils,
  Refrigerator,
  Snowflake,
  Calendar,
  Clock,
  ShieldCheck,
  Check,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  Flame,
  ChefHat,
  ArrowRight,
  Search,
  Plus,
  Trash2,
  BookmarkCheck,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';
import { InventoryItem, User, PlannedMeal, StorageType } from '../types';
import {
  LEFTOVER_CATEGORIES,
  LeftoverCategory,
  SavedLeftoverTemplate,
  getSavedLeftoverTemplates,
  saveNewLeftoverTemplate,
  deleteSavedLeftoverTemplate,
  detectLeftoverCategory,
  calculateSmartExpiration,
} from '../utils/leftovers';

interface ImportLeftoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  plannedMeals: PlannedMeal[];
  initialMeal?: PlannedMeal | null;
  onLeftoversImported: (newItems: InventoryItem[]) => void;
  lang: 'EN' | 'FR';
}

interface SelectedItemConfig {
  quantity: number;
  unit: string;
  locationType: 'FRIDGE' | 'FREEZER';
  prepDaysAgo: number;
}

export const ImportLeftoverModal: React.FC<ImportLeftoverModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  plannedMeals,
  initialMeal,
  onLeftoversImported,
  lang,
}) => {
  // Tabs: 'saved' (reusable items catalog e.g. party/lechon/rice), 'tonight' (tonight's cooked meal), 'manual' (custom one-off)
  const [activeTab, setActiveTab] = useState<'saved' | 'tonight' | 'manual'>('saved');

  // Saved templates state
  const [templates, setTemplates] = useState<SavedLeftoverTemplate[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, SelectedItemConfig>>({});
  const [searchSavedQuery, setSearchSavedQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<'all' | 'party' | 'poultry_meat' | 'staples' | 'custom'>('all');
  const [isCreatingNewTemplate, setIsCreatingNewTemplate] = useState(false);
  const chipsScrollRef = useRef<HTMLDivElement>(null);

  const scrollChips = (direction: 'left' | 'right') => {
    if (chipsScrollRef.current) {
      const scrollAmount = 180;
      chipsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // New Template Form State
  const [newTmplName, setNewTmplName] = useState('');
  const [newTmplCat, setNewTmplCat] = useState('red_meat');
  const [newTmplLocation, setNewTmplLocation] = useState<'FRIDGE' | 'FREEZER'>('FRIDGE');
  const [newTmplQty, setNewTmplQty] = useState(2);
  const [newTmplUnit, setNewTmplUnit] = useState(lang === 'FR' ? 'portions' : 'servings');
  const [newTmplTag, setNewTmplTag] = useState('');

  // Tonight's Meal state
  const [tonightPrepDaysAgo, setTonightPrepDaysAgo] = useState(0);
  const [tonightLocation, setTonightLocation] = useState<'FRIDGE' | 'FREEZER'>('FRIDGE');
  const [tonightServings, setTonightServings] = useState(2);

  // Manual one-off form state
  const [manualName, setManualName] = useState('');
  const [manualCatId, setManualCatId] = useState('red_meat');
  const [manualLocation, setManualLocation] = useState<'FRIDGE' | 'FREEZER'>('FRIDGE');
  const [manualPrepDaysAgo, setManualPrepDaysAgo] = useState(0);
  const [manualQuantity, setManualQuantity] = useState(2);
  const [manualUnit, setManualUnit] = useState(lang === 'FR' ? 'portions' : 'servings');
  const [manualNotes, setManualNotes] = useState('');
  const [saveAsTemplateChecked, setSaveAsTemplateChecked] = useState(true);

  // Status state
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showStandardsModal, setShowStandardsModal] = useState(false);

  // Load templates on modal open
  useEffect(() => {
    if (isOpen) {
      setTemplates(getSavedLeftoverTemplates());
      setErrorMessage(null);

      // If initialMeal is passed, select the 'tonight' tab
      if (initialMeal) {
        setActiveTab('tonight');
      } else {
        setActiveTab('saved');
      }
    }
  }, [isOpen, initialMeal]);

  // Compute today's date formatted as YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter planned meals for tonight or recent days
  const tonightMeals = useMemo(() => {
    // Look for meals with today's date or active status
    const exactToday = plannedMeals.filter((m) => m.date === todayStr);
    if (exactToday.length > 0) return exactToday;

    // Otherwise show all planned meals or recent ones
    return plannedMeals.slice(0, 6);
  }, [plannedMeals, todayStr]);

  // Category for manual tab
  const activeManualCategory = useMemo(() => {
    return LEFTOVER_CATEGORIES.find((c) => c.id === manualCatId) || LEFTOVER_CATEGORIES[0];
  }, [manualCatId]);

  // Manual smart expiration
  const manualPrepDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - manualPrepDaysAgo);
    return d.toISOString().split('T')[0];
  }, [manualPrepDaysAgo]);

  const manualSmartExpiration = useMemo(() => {
    return calculateSmartExpiration(manualCatId, manualLocation, manualPrepDateStr);
  }, [manualCatId, manualLocation, manualPrepDateStr]);

  // Toggle selection of a saved template
  const handleToggleTemplate = (template: SavedLeftoverTemplate) => {
    setSelectedTemplates((prev) => {
      const copy = { ...prev };
      if (copy[template.id]) {
        delete copy[template.id];
      } else {
        copy[template.id] = {
          quantity: template.defaultQuantity || 2,
          unit: template.defaultUnit || (lang === 'FR' ? 'portions' : 'servings'),
          locationType: template.defaultLocation || 'FRIDGE',
          prepDaysAgo: 0,
        };
      }
      return copy;
    });
  };

  // Update config of a selected template
  const handleUpdateSelectedConfig = (
    templateId: string,
    updates: Partial<SelectedItemConfig>
  ) => {
    setSelectedTemplates((prev) => {
      if (!prev[templateId]) return prev;
      return {
        ...prev,
        [templateId]: {
          ...prev[templateId],
          ...updates,
        },
      };
    });
  };

  // Save a brand new reusable leftover template (e.g. from party or favorite family dish)
  const handleCreateTemplate = () => {
    if (!newTmplName.trim()) {
      setErrorMessage(
        lang === 'FR' ? 'Veuillez saisir le nom du plat.' : 'Please enter the dish name.'
      );
      return;
    }

    const created = saveNewLeftoverTemplate({
      nameEn: newTmplName.trim(),
      nameFr: newTmplName.trim(),
      categoryId: newTmplCat,
      defaultLocation: newTmplLocation,
      defaultQuantity: Number(newTmplQty) || 2,
      defaultUnit: newTmplUnit.trim() || 'portions',
      cuisineTag: newTmplTag.trim() || (lang === 'FR' ? '⭐ Personnalisé' : '⭐ Custom'),
    });

    setTemplates(getSavedLeftoverTemplates());

    // Auto-select the newly created template
    setSelectedTemplates((prev) => ({
      ...prev,
      [created.id]: {
        quantity: created.defaultQuantity,
        unit: created.defaultUnit,
        locationType: created.defaultLocation,
        prepDaysAgo: 0,
      },
    }));

    // Reset form
    setNewTmplName('');
    setNewTmplTag('');
    setIsCreatingNewTemplate(false);
  };

  // Delete a custom template
  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSavedLeftoverTemplate(id);
    setTemplates(getSavedLeftoverTemplates());
    setSelectedTemplates((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Submit all selected saved templates as leftovers to kitchen
  const handleSaveBatchSelectedLeftovers = async () => {
    const selectedIds = Object.keys(selectedTemplates);
    if (selectedIds.length === 0) return;

    setIsSaving(true);
    setErrorMessage(null);

    const itemsToCreate = selectedIds.map((tmplId) => {
      const tmpl = templates.find((t) => t.id === tmplId);
      const config = selectedTemplates[tmplId];
      const categoryId = tmpl ? tmpl.categoryId : 'red_meat';
      const category = LEFTOVER_CATEGORIES.find((c) => c.id === categoryId) || LEFTOVER_CATEGORIES[0];

      const prepDateObj = new Date();
      prepDateObj.setDate(prepDateObj.getDate() - config.prepDaysAgo);
      const prepDateStr = prepDateObj.toISOString().split('T')[0];

      const smartExp = calculateSmartExpiration(categoryId, config.locationType, prepDateStr);
      const locationName = config.locationType === 'FREEZER' ? 'Freezer' : 'Fridge';

      return {
        name: lang === 'FR' ? (tmpl?.nameFr || tmpl?.nameEn || 'Reste') : (tmpl?.nameEn || tmpl?.nameFr || 'Leftover'),
        quantity: Number(config.quantity) || 1,
        unit: config.unit || 'portions',
        locationName,
        locationType: config.locationType,
        categoryName: 'Deli & Prepared',
        expirationDate: smartExp.expirationIso,
        monthsFrozenShelfLife: config.locationType === 'FREEZER' ? category.freezerMonths : 6,
        notes: `${lang === 'FR' ? 'Norme Canada & UE :' : 'Health Canada & EU rule:'} ${smartExp.canadianRule} • ${smartExp.safeReheatTemp}`,
        addedById: currentUser.id,
        isLeftover: true,
        leftoverFoodType: lang === 'FR' ? category.nameFr : category.nameEn,
        leftoverSourceMeal: tmpl?.cuisineTag || (lang === 'FR' ? 'Plats enregistrés' : 'Saved leftover item'),
        prepDate: prepDateObj.toISOString(),
      };
    });

    try {
      const res = await fetch('/api/v1/inventory/bulk-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToCreate, userId: currentUser.id }),
      });

      if (!res.ok) {
        // Fallback: save one by one
        const createdItems: InventoryItem[] = [];
        for (const itemPayload of itemsToCreate) {
          const singleRes = await fetch('/api/v1/inventory/item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemPayload),
          });
          if (singleRes.ok) {
            const data = await singleRes.json();
            createdItems.push({
              ...data.item,
              isLeftover: true,
              leftoverFoodType: itemPayload.leftoverFoodType,
              leftoverSourceMeal: itemPayload.leftoverSourceMeal,
              prepDate: itemPayload.prepDate,
            });
          }
        }
        if (createdItems.length > 0) {
          onLeftoversImported(createdItems);
          onClose();
          return;
        }
        throw new Error('Failed to import leftovers');
      }

      const data = await res.json();
      const savedItems: InventoryItem[] = (data.items || []).map((it: any, idx: number) => ({
        ...it,
        isLeftover: true,
        leftoverFoodType: itemsToCreate[idx]?.leftoverFoodType,
        leftoverSourceMeal: itemsToCreate[idx]?.leftoverSourceMeal,
        prepDate: itemsToCreate[idx]?.prepDate,
      }));

      onLeftoversImported(savedItems);
      onClose();
    } catch (err: any) {
      console.error('Batch leftover import error:', err);
      setErrorMessage(err.message || 'Error saving leftovers');
    } finally {
      setIsSaving(false);
    }
  };

  // Convert tonight's meal into leftover
  const handleSaveTonightMeal = async (meal: PlannedMeal) => {
    setIsSaving(true);
    setErrorMessage(null);

    const detected = detectLeftoverCategory(
      meal.title,
      meal.ingredients?.map((i) => i.name) || []
    );

    const prepDateObj = new Date();
    prepDateObj.setDate(prepDateObj.getDate() - tonightPrepDaysAgo);
    const prepDateStr = prepDateObj.toISOString().split('T')[0];

    const smartExp = calculateSmartExpiration(detected.id, tonightLocation, prepDateStr);
    const locationName = tonightLocation === 'FREEZER' ? 'Freezer' : 'Fridge';

    const payload = {
      name: lang === 'FR' ? `Restes : ${meal.title}` : `Leftover: ${meal.title}`,
      quantity: Number(tonightServings) || 1,
      unit: lang === 'FR' ? 'portions' : 'servings',
      locationName,
      locationType: tonightLocation,
      categoryName: 'Deli & Prepared',
      expirationDate: smartExp.expirationIso,
      monthsFrozenShelfLife: tonightLocation === 'FREEZER' ? detected.freezerMonths : 6,
      notes: `${lang === 'FR' ? 'Souper préparé le' : 'Dinner cooked on'} ${meal.date}. ${smartExp.canadianRule}`,
      addedById: currentUser.id,
      isLeftover: true,
      leftoverFoodType: lang === 'FR' ? detected.nameFr : detected.nameEn,
      leftoverSourceMeal: meal.title,
      prepDate: prepDateObj.toISOString(),
    };

    try {
      const res = await fetch('/api/v1/inventory/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save leftover');
      }

      const data = await res.json();
      const savedItem: InventoryItem = {
        ...data.item,
        isLeftover: true,
        leftoverFoodType: payload.leftoverFoodType,
        leftoverSourceMeal: payload.leftoverSourceMeal,
        prepDate: payload.prepDate,
        locationName,
        locationType: tonightLocation,
      };

      onLeftoversImported([savedItem]);
      onClose();
    } catch (err: any) {
      console.error('Save tonight meal leftover error:', err);
      setErrorMessage(err.message || 'Error saving leftover');
    } finally {
      setIsSaving(false);
    }
  };

  // Save a custom one-off leftover
  const handleSaveManualLeftover = async () => {
    if (!manualName.trim()) {
      setErrorMessage(
        lang === 'FR' ? 'Veuillez saisir le nom du plat.' : 'Please enter the dish name.'
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    // If checked, save into templates for future 1-tap selection
    if (saveAsTemplateChecked) {
      saveNewLeftoverTemplate({
        nameEn: manualName.trim(),
        nameFr: manualName.trim(),
        categoryId: manualCatId,
        defaultLocation: manualLocation,
        defaultQuantity: Number(manualQuantity) || 2,
        defaultUnit: manualUnit.trim() || 'portions',
        cuisineTag: lang === 'FR' ? '⭐ Favoris enregistré' : '⭐ Saved Favorite',
      });
    }

    const locationName = manualLocation === 'FREEZER' ? 'Freezer' : 'Fridge';
    const payload = {
      name: manualName.trim(),
      quantity: Number(manualQuantity) || 1,
      unit: manualUnit.trim() || 'servings',
      locationName,
      locationType: manualLocation,
      categoryName: 'Deli & Prepared',
      expirationDate: manualSmartExpiration.expirationIso,
      monthsFrozenShelfLife:
        manualLocation === 'FREEZER' ? activeManualCategory.freezerMonths : 6,
      notes: manualNotes.trim()
        ? manualNotes.trim()
        : `${lang === 'FR' ? 'Consigne :' : 'Rule:'} ${manualSmartExpiration.canadianRule}`,
      addedById: currentUser.id,
      isLeftover: true,
      leftoverFoodType:
        lang === 'FR' ? activeManualCategory.nameFr : activeManualCategory.nameEn,
      prepDate: new Date(manualPrepDateStr).toISOString(),
    };

    try {
      const res = await fetch('/api/v1/inventory/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save leftover');
      }

      const data = await res.json();
      const savedItem: InventoryItem = {
        ...data.item,
        isLeftover: true,
        leftoverFoodType: payload.leftoverFoodType,
        prepDate: payload.prepDate,
        locationName,
        locationType: manualLocation,
      };

      onLeftoversImported([savedItem]);
      onClose();
    } catch (err: any) {
      console.error('Save manual leftover error:', err);
      setErrorMessage(err.message || 'Error saving leftover');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter templates based on search & tag filter
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const name = `${t.nameFr} ${t.nameEn} ${t.cuisineTag || ''}`.toLowerCase();
      const matchQuery = !searchSavedQuery.trim() || name.includes(searchSavedQuery.toLowerCase());
      if (!matchQuery) return false;

      if (tagFilter === 'party') {
        return (
          t.cuisineTag?.toLowerCase().includes('philippine') ||
          t.cuisineTag?.toLowerCase().includes('party') ||
          t.cuisineTag?.toLowerCase().includes('fête')
        );
      }
      if (tagFilter === 'poultry_meat') {
        return t.categoryId === 'red_meat' || t.categoryId === 'poultry';
      }
      if (tagFilter === 'staples') {
        return t.categoryId === 'rice_grains' || t.categoryId === 'pasta_noodles';
      }
      if (tagFilter === 'custom') {
        return Boolean(t.isCustom);
      }
      return true;
    });
  }, [templates, searchSavedQuery, tagFilter]);

  const selectedCount = Object.keys(selectedTemplates).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7EE] flex flex-col w-full h-full text-slate-800 animate-fade-in">
      <div
        id="import-leftovers-modal"
        className="flex flex-col w-full h-full max-w-5xl mx-auto overflow-hidden bg-white sm:my-3 sm:rounded-3xl sm:shadow-2xl sm:border sm:border-amber-200/80"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C25E00] text-white flex items-center justify-center shadow-xs shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-[#163321]">
                  {lang === 'FR' ? 'Restes & Plats Préparés' : 'Leftovers & Prepared Foods'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                  {lang === 'FR' ? '🇨🇦 Santé Canada & 🇪🇺 UE' : '🇨🇦 Health Canada & 🇪🇺 EU'}
                </span>
              </div>
              <p className="text-xs text-[#52745a]">
                {lang === 'FR'
                  ? 'Gestion rigoureuse de la péremption selon les normes canadiennes et européennes'
                  : 'Food safety shelf life based on Canadian (CFIA/MAPAQ) & European (EFSA) standards'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStandardsModal(!showStandardsModal)}
              className="px-2.5 py-1.5 rounded-xl border border-amber-300/80 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              title={lang === 'FR' ? 'Afficher ou masquer le guide des normes' : 'Show or hide safety standards guide'}
            >
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span className="hidden sm:inline">{lang === 'FR' ? 'Normes de conservation' : 'Conservation Standards'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-amber-200/50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Standards Explanatory Banner (Collapsible - shown only when shield icon clicked) */}
        {showStandardsModal && (
          <div className="bg-amber-50/95 border-b border-amber-200 px-5 py-3 text-xs text-amber-950 space-y-2 shrink-0 animate-fade-in">
            <div className="flex items-center justify-between font-black text-amber-900">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                {lang === 'FR'
                  ? 'Normes Officielles : Santé Canada (ACIA / MAPAQ) & Union Européenne (EFSA / ANSES)'
                  : 'Official Standards: Health Canada (CFIA / MAPAQ) & European Union (EFSA / ANSES)'}
              </span>
              <button
                onClick={() => setShowStandardsModal(false)}
                className="text-amber-700 hover:text-amber-900 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-relaxed">
              <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
                <span className="font-bold text-amber-900 block">
                  🍚 {lang === 'FR' ? 'Riz cuit & Féculents' : 'Cooked Rice & Starches'} :
                </span>
                {lang === 'FR'
                  ? '3 jours max au frigo (≤ 4°C). Refroidir sous 2h pour stopper la toxine Bacillus cereus.'
                  : '3 days max in fridge (≤ 4°C). Cool within 2h to prevent Bacillus cereus spores.'}
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
                <span className="font-bold text-amber-900 block">
                  🍗 {lang === 'FR' ? 'Porc, Lechon & Viandes' : 'Pork, Lechon & Meats'} :
                </span>
                {lang === 'FR'
                  ? '3 à 4 jours max au frigo. Réchauffer à cœur à au moins 74°C (165°F).'
                  : '3 to 4 days max in fridge. Reheat piping hot to at least 74°C (165°F).'}
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
                <span className="font-bold text-amber-900 block">
                  🐟 {lang === 'FR' ? 'Poissons & Fruits de mer' : 'Fish & Seafood'} :
                </span>
                {lang === 'FR'
                  ? 'Règle stricte européenne (EFSA) : 2 jours max (48h) en boîte fermée.'
                  : 'Strict European EFSA rule: 2 days max (48h) in sealed airtight container.'}
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-amber-200/60">
                <span className="font-bold text-amber-900 block">
                  ❄️ {lang === 'FR' ? 'Congélateur (≤ -18°C)' : 'Freezer (≤ -18°C)'} :
                </span>
                {lang === 'FR'
                  ? '2 à 4 mois pour les plats préparés afin de conserver saveur et sécurité.'
                  : '2 to 4 months for prepared meals for optimal safety and flavor.'}
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation - Evenly distributed */}
        <div className="grid grid-cols-2 border-b border-amber-100 px-4 pt-2 bg-[#FDFBF7] shrink-0 gap-2">
          {/* Tab 1: Saved Catalog & Party Dishes (Primary User Intent) */}
          <button
            id="tab-saved-leftovers"
            onClick={() => setActiveTab('saved')}
            className={`w-full py-2.5 px-3 rounded-t-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'saved'
                ? 'bg-white text-[#0D3B37] border-t-2 border-x-2 border-amber-300 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-amber-50/60'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">{lang === 'FR' ? 'Plats enregistrés & Fêtes' : 'Saved Items & Party Dishes'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold shrink-0">
              {templates.length}
            </span>
          </button>

          {/* Tab 2: From Tonight's Dinner */}
          <button
            id="tab-tonight-leftovers"
            onClick={() => setActiveTab('tonight')}
            className={`w-full py-2.5 px-3 rounded-t-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'tonight'
                ? 'bg-white text-[#0D3B37] border-t-2 border-x-2 border-amber-300 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-amber-50/60'
            }`}
          >
            <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="truncate">{lang === 'FR' ? 'Du souper de ce soir' : 'From Tonight’s Meal'}</span>
            {tonightMeals.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-900 font-bold shrink-0">
                {tonightMeals.length}
              </span>
            )}
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mx-5 mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: SAVED LEFTOVERS CATALOG & PARTY DISHES */}
        {activeTab === 'saved' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col space-y-4">
            {/* Top Bar: Search, Filters & Add New Button */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder={
                      lang === 'FR'
                        ? 'Ex: Lechon, riz jasmin, pancit, adobo...'
                        : 'e.g. Lechon, steamed rice, pancit, adobo...'
                    }
                    value={searchSavedQuery}
                    onChange={(e) => setSearchSavedQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-[#D5E1D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {searchSavedQuery && (
                    <button
                      onClick={() => setSearchSavedQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingNewTemplate(!isCreatingNewTemplate)}
                  className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs shrink-0 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? 'Nouveau type' : 'New Type'}</span>
                </button>
              </div>

              {/* Tag Filter Chips with responsive left/right scroll arrows */}
              <div className="relative flex items-center group/chips">
                <button
                  type="button"
                  onClick={() => scrollChips('left')}
                  aria-label="Scroll filter tags left"
                  className="shrink-0 p-1.5 mr-1 rounded-full bg-white hover:bg-amber-100 text-slate-600 hover:text-amber-800 border border-[#D5E1D2] shadow-2xs transition-all active:scale-90 z-10"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <div
                  ref={chipsScrollRef}
                  className="flex-1 flex items-center gap-1.5 overflow-x-auto scroll-smooth py-1 px-0.5 text-xs no-scrollbar select-none"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                  onWheel={(e) => {
                    if (chipsScrollRef.current && Math.abs(e.deltaX) === 0 && Math.abs(e.deltaY) > 0) {
                      chipsScrollRef.current.scrollLeft += e.deltaY;
                    }
                  }}
                >
                  <button
                    onClick={() => setTagFilter('all')}
                    className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-colors shrink-0 ${
                      tagFilter === 'all'
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lang === 'FR' ? 'Tous les types' : 'All Types'}
                  </button>
                  <button
                    onClick={() => setTagFilter('party')}
                    className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-colors shrink-0 ${
                      tagFilter === 'party'
                        ? 'bg-amber-700 text-white'
                        : 'bg-amber-100/70 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    🇵🇭 {lang === 'FR' ? 'Fête & Party (Lechon, Riz...)' : 'Party (Lechon, Rice...)'}
                  </button>
                  <button
                    onClick={() => setTagFilter('staples')}
                    className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-colors shrink-0 ${
                      tagFilter === 'staples'
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    🍚 {lang === 'FR' ? 'Riz & Pâtes' : 'Rice & Pasta'}
                  </button>
                  <button
                    onClick={() => setTagFilter('poultry_meat')}
                    className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-colors shrink-0 ${
                      tagFilter === 'poultry_meat'
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    🍗 {lang === 'FR' ? 'Viandes & Volailles' : 'Meats & Poultry'}
                  </button>
                  <button
                    onClick={() => setTagFilter('custom')}
                    className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-colors shrink-0 ${
                      tagFilter === 'custom'
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ⭐ {lang === 'FR' ? 'Mes créations' : 'My Custom'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => scrollChips('right')}
                  aria-label="Scroll filter tags right"
                  className="shrink-0 p-1.5 ml-1 rounded-full bg-white hover:bg-amber-100 text-slate-600 hover:text-amber-800 border border-[#D5E1D2] shadow-2xs transition-all active:scale-90 z-10"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* In-place creation form for a new reusable leftover type */}
            {isCreatingNewTemplate && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 text-xs space-y-3 animate-fade-in shadow-xs">
                <div className="flex items-center justify-between font-black text-amber-950">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    {lang === 'FR'
                      ? 'Enregistrer un nouveau type de reste pour les prochaines fois'
                      : 'Save a new leftover type for future selections'}
                  </span>
                  <button
                    onClick={() => setIsCreatingNewTemplate(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === 'FR' ? 'Nom du plat (ex: Sinigang, Kare-kare)' : 'Dish name (e.g. Sinigang, Kare-kare)'}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'FR' ? 'Ex: Kare-Kare au bœuf' : 'e.g. Beef Kare-Kare'}
                      value={newTmplName}
                      onChange={(e) => setNewTmplName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === 'FR' ? 'Catégorie d’aliment (Normes de salubrité)' : 'Food category (Safety standards)'}
                    </label>
                    <select
                      value={newTmplCat}
                      onChange={(e) => setNewTmplCat(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                    >
                      {LEFTOVER_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {lang === 'FR' ? cat.nameFr : cat.nameEn} ({cat.fridgeDays}j frigo)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === 'FR' ? 'Lieu de stockage' : 'Default storage'}
                    </label>
                    <select
                      value={newTmplLocation}
                      onChange={(e) => setNewTmplLocation(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl font-bold"
                    >
                      <option value="FRIDGE">{lang === 'FR' ? 'Réfrigérateur (≤ 4°C)' : 'Fridge (≤ 4°C)'}</option>
                      <option value="FREEZER">{lang === 'FR' ? 'Congélateur (≤ -18°C)' : 'Freezer (≤ -18°C)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === 'FR' ? 'Portions par défaut' : 'Default portions'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={newTmplQty}
                      onChange={(e) => setNewTmplQty(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === 'FR' ? 'Étiquette / Origine' : 'Tag / Origin'}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'FR' ? 'Ex: 🇵🇭 Fête philippine' : 'e.g. 🇵🇭 Party'}
                      value={newTmplTag}
                      onChange={(e) => setNewTmplTag(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNewTemplate(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold"
                  >
                    {lang === 'FR' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateTemplate}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{lang === 'FR' ? 'Enregistrer dans la liste' : 'Save to List'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Instruction helper */}
            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs flex items-center justify-between text-amber-950">
              <span className="flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  {lang === 'FR'
                    ? 'Cochez un ou plusieurs plats rapportés (ex: Lechon + Riz jasmin). Les dates de péremption Santé Canada & UE sont calculées automatiquement.'
                    : 'Check one or multiple dishes brought home (e.g. Lechon + Jasmine Rice). Canadian & EU expiry dates are auto-calculated.'}
                </span>
              </span>
            </div>

            {/* List of Saved Leftover Templates */}
            <div className="space-y-2.5">
              {filteredTemplates.map((template) => {
                const isSelected = Boolean(selectedTemplates[template.id]);
                const config = selectedTemplates[template.id];
                const category =
                  LEFTOVER_CATEGORIES.find((c) => c.id === template.categoryId) ||
                  LEFTOVER_CATEGORIES[0];

                // Compute expiration dynamically for this card
                const prepDate = new Date();
                if (config) {
                  prepDate.setDate(prepDate.getDate() - config.prepDaysAgo);
                }
                const prepDateStr = prepDate.toISOString().split('T')[0];
                const locationType = config ? config.locationType : template.defaultLocation;
                const smartExp = calculateSmartExpiration(template.categoryId, locationType, prepDateStr);

                return (
                  <div
                    key={template.id}
                    onClick={() => handleToggleTemplate(template)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-amber-50/50 border-amber-500 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-[#E5DFD0]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Checkbox */}
                        <div className="pt-0.5">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-amber-600 fill-amber-100" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300" />
                          )}
                        </div>

                        {/* Title & Tags */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-black text-[#0D3B37]">
                              {lang === 'FR' ? template.nameFr : template.nameEn}
                            </h4>
                            {template.cuisineTag && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                                {template.cuisineTag}
                              </span>
                            )}
                            {template.isCustom && (
                              <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-purple-100 text-purple-800">
                                {lang === 'FR' ? 'Personnalisé' : 'Custom'}
                              </span>
                            )}
                          </div>

                          {/* Regulatory Standards Rule */}
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#4E7058] flex-wrap">
                            <span className="font-bold flex items-center gap-1 text-emerald-800">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              {locationType === 'FREEZER'
                                ? `${category.freezerMonths} ${lang === 'FR' ? 'mois au congélateur' : 'months frozen'}`
                                : `${category.fridgeDays} ${lang === 'FR' ? 'jours max au frigo' : 'days max in fridge'}`}
                            </span>
                            <span>•</span>
                            <span className="text-slate-600 font-medium">
                              {lang === 'FR' ? smartExp.canadianRule : smartExp.guidelineEn}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delete icon for custom templates */}
                      {template.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTemplate(template.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title={lang === 'FR' ? 'Supprimer ce type' : 'Delete type'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Selected Item Quick Config Sub-bar */}
                    {isSelected && config && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 pt-3 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-white/80 p-2.5 rounded-xl border border-amber-100 animate-fade-in"
                      >
                        {/* Storage Location Toggle */}
                        <div className="flex items-center gap-1">
                          <label className="text-[11px] font-bold text-slate-600 shrink-0">
                            {lang === 'FR' ? 'Stockage :' : 'Storage:'}
                          </label>
                          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateSelectedConfig(template.id, { locationType: 'FRIDGE' })}
                              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                                config.locationType === 'FRIDGE'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <Refrigerator className="w-3 h-3" />
                              <span>{lang === 'FR' ? 'Frigo' : 'Fridge'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateSelectedConfig(template.id, { locationType: 'FREEZER' })}
                              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                                config.locationType === 'FREEZER'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <Snowflake className="w-3 h-3" />
                              <span>{lang === 'FR' ? 'Congélo' : 'Freezer'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-bold text-slate-600 shrink-0">
                            {lang === 'FR' ? 'Quantité :' : 'Qty:'}
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSelectedConfig(template.id, {
                                  quantity: Math.max(1, config.quantity - 1),
                                })
                              }
                              className="w-6 h-6 rounded-md bg-slate-200 hover:bg-slate-300 font-bold flex items-center justify-center text-slate-700"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-black text-xs text-[#0D3B37]">
                              {config.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSelectedConfig(template.id, {
                                  quantity: config.quantity + 1,
                                })
                              }
                              className="w-6 h-6 rounded-md bg-slate-200 hover:bg-slate-300 font-bold flex items-center justify-center text-slate-700"
                            >
                              +
                            </button>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {config.unit}
                            </span>
                          </div>
                        </div>

                        {/* Expiration date badge */}
                        <div className="flex items-center justify-between sm:justify-end text-[11px] text-emerald-900 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          <span>{lang === 'FR' ? 'Périme le :' : 'Expires:'}</span>
                          <span className="ml-1 text-emerald-800 font-black">
                            {new Date(smartExp.expirationDate).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredTemplates.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                  <p className="font-bold">
                    {lang === 'FR' ? 'Aucun type de reste trouvé.' : 'No leftover types found.'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {lang === 'FR'
                      ? 'Cliquez sur "+ Nouveau type" pour en ajouter un à votre catalogue réutilisable.'
                      : 'Click "+ New Type" to add one to your reusable selection list.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FROM TONIGHT'S DINNER */}
        {activeTab === 'tonight' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col space-y-4">
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-950 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                {lang === 'FR'
                  ? 'Plats cuisinés récemment dans votre plan de repas. Enregistrez les restes du souper en 1 clic.'
                  : 'Meals recently planned or cooked. Convert tonight’s dinner leftovers into inventory with 1 click.'}
              </span>
            </div>

            {/* Global Options for Tonight's Leftover */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'FR' ? 'Emplacement' : 'Location'}
                </label>
                <div className="flex rounded-lg bg-white p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTonightLocation('FRIDGE')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 ${
                      tonightLocation === 'FRIDGE'
                        ? 'bg-teal-700 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Refrigerator className="w-3 h-3" />
                    <span>{lang === 'FR' ? 'Frigo' : 'Fridge'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTonightLocation('FREEZER')}
                    className={`flex-1 py-1 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 ${
                      tonightLocation === 'FREEZER'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Snowflake className="w-3 h-3" />
                    <span>{lang === 'FR' ? 'Congélo' : 'Freezer'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'FR' ? 'Portions restantes' : 'Portions left'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={tonightServings}
                  onChange={(e) => setTonightServings(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {lang === 'FR' ? 'Cuisiné le' : 'Cooked when'}
                </label>
                <select
                  value={tonightPrepDaysAgo}
                  onChange={(e) => setTonightPrepDaysAgo(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold"
                >
                  <option value={0}>{lang === 'FR' ? 'Ce soir (Aujourd’hui)' : 'Tonight (Today)'}</option>
                  <option value={1}>{lang === 'FR' ? 'Hier' : 'Yesterday'}</option>
                  <option value={2}>{lang === 'FR' ? 'Il y a 2 jours' : '2 days ago'}</option>
                </select>
              </div>
            </div>

            {/* Planned Meals Cards */}
            <div className="space-y-3">
              {tonightMeals.map((meal) => {
                const detected = detectLeftoverCategory(
                  meal.title,
                  meal.ingredients?.map((i) => i.name) || []
                );

                const prepDate = new Date();
                prepDate.setDate(prepDate.getDate() - tonightPrepDaysAgo);
                const prepDateStr = prepDate.toISOString().split('T')[0];
                const smartExp = calculateSmartExpiration(detected.id, tonightLocation, prepDateStr);

                return (
                  <div
                    key={meal.id}
                    className="p-4 rounded-2xl bg-white border-2 border-[#E5DFD0] hover:border-teal-400 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                          {meal.date} • {meal.mealType}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">
                          {lang === 'FR' ? detected.nameFr : detected.nameEn}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-[#0D3B37] mt-1">{meal.title}</h4>
                      <p className="text-xs text-[#52745a] mt-0.5">
                        {lang === 'FR'
                          ? `Santé Canada & UE : Péremption dans ${smartExp.daysRemaining} jours (${new Date(smartExp.expirationDate).toLocaleDateString()})`
                          : `Canadian & EU safe rule: Expires in ${smartExp.daysRemaining} days (${new Date(smartExp.expirationDate).toLocaleDateString()})`}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveTonightMeal(meal)}
                      className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs shrink-0 active:scale-95 transition-all"
                    >
                      <Utensils className="w-3.5 h-3.5 text-teal-200" />
                      <span>{lang === 'FR' ? 'Enregistrer restes' : 'Save Leftovers'}</span>
                    </button>
                  </div>
                );
              })}

              {tonightMeals.length === 0 && (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  <p className="font-bold">
                    {lang === 'FR'
                      ? 'Aucun plat planifié pour ce soir.'
                      : 'No planned meals scheduled for tonight.'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {lang === 'FR'
                      ? 'Utilisez l’onglet "Plats enregistrés" ou "Autre plat unique".'
                      : 'Use the "Saved Items" tab or "Custom Dish" tab.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM ONE-OFF DISH */}
        {activeTab === 'manual' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col space-y-4 text-xs">
            {/* Dish Name */}
            <div>
              <label className="block text-xs font-bold text-[#1F3323] mb-1">
                {lang === 'FR' ? 'Nom du plat cuisiné / restes' : 'Dish name / leftover item'}
              </label>
              <input
                type="text"
                placeholder={
                  lang === 'FR'
                    ? 'Ex: Lechon au porc croustillant, Riz jasmin sauté...'
                    : 'e.g. Crispy Lechon, Steamed Jasmine Rice...'
                }
                value={manualName}
                onChange={(e) => {
                  setManualName(e.target.value);
                  if (e.target.value.trim().length >= 3) {
                    const detected = detectLeftoverCategory(e.target.value);
                    setManualCatId(detected.id);
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#D5E1D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
              />
            </div>

            {/* Food Safety Category */}
            <div>
              <label className="block text-xs font-bold text-[#1F3323] mb-1">
                {lang === 'FR'
                  ? 'Catégorie d’aliment (Règles Santé Canada & UE)'
                  : 'Food Category (Canadian & EU Safety Standards)'}
              </label>
              <select
                value={manualCatId}
                onChange={(e) => setManualCatId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#D5E1D2] rounded-xl font-bold"
              >
                {LEFTOVER_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {lang === 'FR' ? cat.nameFr : cat.nameEn} (
                    {manualLocation === 'FREEZER'
                      ? `${cat.freezerMonths} mois congelé`
                      : `${cat.fridgeDays}j frigo`}
                    )
                  </option>
                ))}
              </select>
            </div>

            {/* Location & Prep Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1F3323] mb-1">
                  {lang === 'FR' ? 'Lieu de stockage' : 'Storage location'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualLocation('FRIDGE')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      manualLocation === 'FRIDGE'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Refrigerator className="w-4 h-4" />
                    <span>{lang === 'FR' ? 'Réfrigérateur (≤ 4°C)' : 'Fridge (≤ 4°C)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setManualLocation('FREEZER')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      manualLocation === 'FREEZER'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Snowflake className="w-4 h-4" />
                    <span>{lang === 'FR' ? 'Congélateur (≤ -18°C)' : 'Freezer (≤ -18°C)'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F3323] mb-1">
                  {lang === 'FR' ? 'Date de préparation / Fête' : 'Cooked / Party date'}
                </label>
                <select
                  value={manualPrepDaysAgo}
                  onChange={(e) => setManualPrepDaysAgo(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#D5E1D2] rounded-xl font-bold"
                >
                  <option value={0}>{lang === 'FR' ? 'Aujourd’hui (Fraîchement cuisiné / fête)' : 'Today (Freshly cooked / party)'}</option>
                  <option value={1}>{lang === 'FR' ? 'Hier' : 'Yesterday'}</option>
                  <option value={2}>{lang === 'FR' ? 'Il y a 2 jours' : '2 days ago'}</option>
                  <option value={3}>{lang === 'FR' ? 'Il y a 3 jours (Attention limite riz)' : '3 days ago (Rice limit warning)'}</option>
                </select>
              </div>
            </div>

            {/* Quantity and unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1F3323] mb-1">
                  {lang === 'FR' ? 'Quantité' : 'Quantity'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={manualQuantity}
                  onChange={(e) => setManualQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#D5E1D2] rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F3323] mb-1">
                  {lang === 'FR' ? 'Unité' : 'Unit'}
                </label>
                <input
                  type="text"
                  value={manualUnit}
                  onChange={(e) => setManualUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#D5E1D2] rounded-xl"
                />
              </div>
            </div>

            {/* Smart Expiration Result Box */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1.5">
              <div className="flex items-center justify-between font-black text-amber-950">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {lang === 'FR' ? 'Date de péremption calculée' : 'Smart Expiration Computed'}
                </span>
                <span className="text-sm font-black text-emerald-800">
                  {new Date(manualSmartExpiration.expirationDate).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-[11px] text-[#4E7058]">
                {manualSmartExpiration.canadianRule} • {manualSmartExpiration.europeanRule}
              </p>
              <p className="text-[10px] text-amber-800 font-bold">
                {lang === 'FR' ? 'Consigne de réchauffage :' : 'Safe reheat:'} {manualSmartExpiration.safeReheatTemp}
              </p>
            </div>

            {/* Save as Reusable Template Checkbox */}
            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveAsTemplateChecked}
                onChange={(e) => setSaveAsTemplateChecked(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded-md border-slate-300"
              />
              <span className="text-xs font-bold text-slate-700">
                {lang === 'FR'
                  ? '⭐ Enregistrer ce type de restes dans mes favoris pour la prochaine fois'
                  : '⭐ Save this leftover type into my saved list for future 1-tap selection'}
              </span>
            </label>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-amber-100 flex items-center justify-between bg-[#FDFBF7] shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors"
          >
            {lang === 'FR' ? 'Quitter' : 'Exit'}
          </button>

          {/* Action button depends on active tab */}
          {activeTab === 'saved' && (
            <button
              id="confirm-batch-leftovers-btn"
              onClick={handleSaveBatchSelectedLeftovers}
              disabled={isSaving || selectedCount === 0}
              className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>
                {selectedCount > 0
                  ? lang === 'FR'
                    ? `Ajouter ${selectedCount} plat(s) de restes à la cuisine`
                    : `Add ${selectedCount} leftover dish(es) to Kitchen`
                  : lang === 'FR'
                  ? 'Sélectionnez des plats ci-dessus'
                  : 'Select dishes above'}
              </span>
            </button>
          )}

          {activeTab === 'manual' && (
            <button
              id="save-manual-leftover-btn"
              onClick={handleSaveManualLeftover}
              disabled={isSaving || !manualName.trim()}
              className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>
                {manualLocation === 'FREEZER'
                  ? lang === 'FR'
                    ? 'Congeler ce reste'
                    : 'Freeze Leftover'
                  : lang === 'FR'
                  ? 'Placer au réfrigérateur'
                  : 'Store in Fridge'}
              </span>
            </button>
          )}

          {activeTab === 'tonight' && (
            <div className="text-xs text-slate-500 font-medium">
              {lang === 'FR'
                ? 'Sélectionnez un plat ci-dessus pour l’ajouter'
                : 'Select a meal above to import'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
