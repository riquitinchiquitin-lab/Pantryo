import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Refrigerator,
  Snowflake,
  Boxes,
  Check,
  CheckCircle2,
  Tag,
  Hash,
  FileText,
  AlertTriangle,
  Scale,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { InventoryItem, User, StorageType } from '../types';
import { ALL_FOOD_CATEGORIES, ALL_SUB_CATEGORIES, ALL_MEAT_SEAFOOD_SUBCATEGORIES } from '../utils/foodVisuals';
import { useLanguage, getCategoryLocalizedName, getSubcategoryLocalizedName } from '../utils/i18n';
import { ScrollableRow } from './ScrollableRow';
import { estimateSmartShelfLife } from '../utils/smartExpirationRules';

interface AddEditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: InventoryItem | null;
  currentUser: User;
  onSaved: (item: InventoryItem, isNew: boolean) => void;
  onDeleted?: (itemId: string) => void;
}

export type UnitCategory = 'metric' | 'imperial' | 'container' | 'composite';

interface UnitPreset {
  val: string;
  label: string;
  category: UnitCategory;
}

const UNIT_PRESETS_EN: UnitPreset[] = [
  // Metric
  { val: 'g', label: 'g (grams)', category: 'metric' },
  { val: 'kg', label: 'kg', category: 'metric' },
  { val: 'mg', label: 'mg (milligrams)', category: 'metric' },
  { val: 'ml', label: 'ml', category: 'metric' },
  { val: 'L', label: 'L (liters)', category: 'metric' },
  { val: 'cl', label: 'cl', category: 'metric' },

  // Imperial
  { val: 'oz', label: 'oz (ounces)', category: 'imperial' },
  { val: 'lbs', label: 'lbs (pounds)', category: 'imperial' },
  { val: 'fl oz', label: 'fl oz', category: 'imperial' },
  { val: 'cup', label: 'cup', category: 'imperial' },
  { val: 'pt', label: 'pt (pint)', category: 'imperial' },
  { val: 'qt', label: 'qt (quart)', category: 'imperial' },
  { val: 'gal', label: 'gal (gallon)', category: 'imperial' },

  // Containers
  { val: 'pcs', label: 'pcs', category: 'container' },
  { val: 'pack', label: 'pack', category: 'container' },
  { val: 'can', label: 'can', category: 'container' },
  { val: 'bottle', label: 'bottle', category: 'container' },
  { val: 'box', label: 'box', category: 'container' },
  { val: 'bag', label: 'bag', category: 'container' },
  { val: 'carton', label: 'carton', category: 'container' },
  { val: 'slices', label: 'slices', category: 'container' },

  // Composite Packs (e.g. 2 Packs of 300mg of salami)
  { val: 'Packs of 300mg', label: 'Packs of 300mg', category: 'composite' },
  { val: 'pack (300mg)', label: 'pack (300mg)', category: 'composite' },
  { val: 'Packs of 300g', label: 'Packs of 300g', category: 'composite' },
  { val: 'pack (300g)', label: 'pack (300g)', category: 'composite' },
  { val: 'pack (400g)', label: 'pack (400g)', category: 'composite' },
  { val: 'pack (500g)', label: 'pack (500g)', category: 'composite' },
  { val: 'pack (8 oz)', label: 'pack (8 oz)', category: 'composite' },
  { val: 'pack (10 oz)', label: 'pack (10 oz)', category: 'composite' },
  { val: 'can (355ml)', label: 'can (355ml)', category: 'composite' },
  { val: 'bag (1 lb)', label: 'bag (1 lb)', category: 'composite' },
  { val: 'bottle (750ml)', label: 'bottle (750ml)', category: 'composite' },
];

const UNIT_PRESETS_FR: UnitPreset[] = [
  // Métrique
  { val: 'g', label: 'g (grammes)', category: 'metric' },
  { val: 'kg', label: 'kg', category: 'metric' },
  { val: 'mg', label: 'mg (milligrammes)', category: 'metric' },
  { val: 'ml', label: 'ml', category: 'metric' },
  { val: 'L', label: 'L (litres)', category: 'metric' },
  { val: 'cl', label: 'cl', category: 'metric' },

  // Impérial
  { val: 'oz', label: 'oz (onces)', category: 'imperial' },
  { val: 'lbs', label: 'lbs (livres)', category: 'imperial' },
  { val: 'fl oz', label: 'fl oz (onces liq.)', category: 'imperial' },
  { val: 'tasse', label: 'tasse (cup)', category: 'imperial' },
  { val: 'pinte', label: 'pinte (pt)', category: 'imperial' },
  { val: 'quart', label: 'quart (qt)', category: 'imperial' },
  { val: 'gal', label: 'gallon (gal)', category: 'imperial' },

  // Contenants
  { val: 'unités', label: 'unités', category: 'container' },
  { val: 'paquet', label: 'paquet', category: 'container' },
  { val: 'boîte', label: 'boîte', category: 'container' },
  { val: 'canette', label: 'canette', category: 'container' },
  { val: 'bouteille', label: 'bouteille', category: 'container' },
  { val: 'sac', label: 'sac', category: 'container' },
  { val: 'carton', label: 'carton', category: 'container' },
  { val: 'tranches', label: 'tranches', category: 'container' },

  // Emballages composites
  { val: 'paquets de 300mg', label: 'paquets de 300mg', category: 'composite' },
  { val: 'paquet (300mg)', label: 'paquet (300mg)', category: 'composite' },
  { val: 'paquets de 300g', label: 'paquets de 300g', category: 'composite' },
  { val: 'paquet (300g)', label: 'paquet (300g)', category: 'composite' },
  { val: 'paquet (400g)', label: 'paquet (400g)', category: 'composite' },
  { val: 'paquet (500g)', label: 'paquet (500g)', category: 'composite' },
  { val: 'paquet (8 oz)', label: 'paquet (8 oz)', category: 'composite' },
  { val: 'paquet (10 oz)', label: 'paquet (10 oz)', category: 'composite' },
  { val: 'canette (355ml)', label: 'canette (355ml)', category: 'composite' },
  { val: 'sac (1 lb)', label: 'sac (1 lb)', category: 'composite' },
  { val: 'bouteille (750ml)', label: 'bouteille (750ml)', category: 'composite' },
];

export const AddEditItemModal: React.FC<AddEditItemModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
  currentUser,
  onSaved,
  onDeleted,
}) => {
  const { t, lang } = useLanguage();
  const isEditing = Boolean(itemToEdit);

  // Helper to format date YYYY-MM-DD
  const formatDateForInput = (isoDate?: string | null) => {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const getDefaultExpiration = (location: 'FRIDGE' | 'FREEZER' | 'PANTRY') => {
    const days = location === 'PANTRY' ? 60 : location === 'FREEZER' ? 180 : 7;
    const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return target.toISOString().split('T')[0];
  };

  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [locationType, setLocationType] = useState<'FRIDGE' | 'FREEZER' | 'PANTRY'>('FRIDGE');
  const [categoryName, setCategoryName] = useState('Produce');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [unit, setUnit] = useState('pcs');
  const [unitCategory, setUnitCategory] = useState<UnitCategory>('metric');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Smart food safety expiration recommendation (CFIA/MAPAQ/EFSA standards)
  const smartRecommendation = React.useMemo(() => {
    if (!name.trim()) return null;
    return estimateSmartShelfLife(name, categoryName, locationType);
  }, [name, categoryName, locationType]);

  // Sync state when modal opens or itemToEdit changes
  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '');
      setImageUrl(itemToEdit.imageUrl || '');
      const loc = (itemToEdit.locationType as 'FRIDGE' | 'FREEZER' | 'PANTRY') || 'FRIDGE';
      setLocationType(loc === 'FREEZER' || loc === 'PANTRY' ? loc : 'FRIDGE');
      setCategoryName(itemToEdit.categoryName || 'Produce');
      setQuantity(itemToEdit.quantity || 1);
      setUnit(itemToEdit.unit || 'pcs');
      setExpirationDate(formatDateForInput(itemToEdit.expirationDate));
      setNotes(itemToEdit.notes || '');
    } else {
      setName('');
      setImageUrl('');
      setLocationType('FRIDGE');
      setCategoryName('Produce');
      setQuantity(1);
      setUnit('pcs');
      setExpirationDate(getDefaultExpiration('FRIDGE'));
      setNotes('');
    }
    setErrorMessage(null);
  }, [itemToEdit, isOpen]);

  // Quick preset dates
  const handleQuickDate = (days: number) => {
    const target = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setExpirationDate(target.toISOString().split('T')[0]);
  };

  const handleApplySmartRecommendation = () => {
    if (smartRecommendation) {
      setExpirationDate(smartRecommendation.suggestedDate);
      // Auto-suggest storage note if notes is currently empty
      if (!notes.trim()) {
        const tip = lang === 'FR' 
          ? smartRecommendation.matchedRule.storageRecommendationFr
          : smartRecommendation.matchedRule.storageRecommendationEn;
        setNotes(tip);
      }
    }
  };

  const handleLocationChange = (newLoc: 'FRIDGE' | 'FREEZER' | 'PANTRY') => {
    setLocationType(newLoc);
    // If setting a new item and user hasn't typed custom date, auto-adjust default date or smart suggestion
    if (!isEditing) {
      if (name.trim()) {
        const smart = estimateSmartShelfLife(name, categoryName, newLoc);
        setExpirationDate(smart.suggestedDate);
      } else {
        setExpirationDate(getDefaultExpiration(newLoc));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter an item name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const parsedQty = parseFloat(String(quantity));
    const safeQty = isNaN(parsedQty) || parsedQty <= 0 ? 1 : Number(parsedQty.toFixed(3));
    const locationName = locationType === 'FREEZER' ? 'Freezer' : locationType === 'PANTRY' ? 'Pantry' : 'Fridge';
    const payload = {
      name: name.trim(),
      imageUrl: imageUrl.trim() || undefined,
      quantity: safeQty,
      unit: unit.trim() || 'pcs',
      locationName,
      categoryName,
      expirationDate: expirationDate ? new Date(expirationDate).toISOString() : undefined,
      notes: notes.trim() || undefined,
      userId: currentUser.id,
    };

    try {
      if (isEditing && itemToEdit) {
        // PUT update
        const res = await fetch(`/api/v1/inventory/item/${encodeURIComponent(itemToEdit.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update item.');
        }

        // Construct enriched item
        const updatedEnriched: InventoryItem = {
          ...itemToEdit,
          ...data.item,
          name: payload.name,
          imageUrl: payload.imageUrl || itemToEdit.imageUrl,
          quantity: payload.quantity,
          unit: payload.unit,
          locationName,
          locationType,
          categoryName,
          notes: payload.notes || null,
          expirationDate: payload.expirationDate || null,
        };

        onSaved(updatedEnriched, false);
        onClose();
      } else {
        // POST create
        const res = await fetch('/api/v1/inventory/item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            addedById: currentUser.id,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to create item.');
        }

        const newEnriched: InventoryItem = {
          ...data.item,
          name: payload.name,
          quantity: payload.quantity,
          unit: payload.unit,
          locationName,
          locationType,
          categoryName,
          addedByName: currentUser.name,
          addedByAvatar: currentUser.avatarUrl,
          daysUntilExpiration: expirationDate
            ? Math.ceil((new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 7,
          isExpiringSoon: false,
          isExpired: false,
          monthsFrozen: locationType === 'FREEZER' ? 0.1 : null,
          monthsFrozenShelfLife: locationType === 'FREEZER' ? 6 : null,
          frozenPercentage: 0,
          isFreezerWarning: false,
        };

        onSaved(newEnriched, true);
        onClose();
      }
    } catch (err: any) {
      console.error('Save item failed:', err);
      setErrorMessage(err.message || 'Error saving item to server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToEdit || !onDeleted) return;
    const confirmMsg =
      lang === 'FR'
        ? `Voulez-vous vraiment retirer « ${itemToEdit.name} » de votre cuisine ?`
        : `Are you sure you want to remove "${itemToEdit.name}" from your kitchen?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/inventory/item/${encodeURIComponent(itemToEdit.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (lang === 'FR' ? "Échec de suppression de l'aliment." : 'Failed to delete item.'));
      }
      onDeleted(itemToEdit.id);
      onClose();
    } catch (err: any) {
      alert(`${lang === 'FR' ? 'Erreur lors de la suppression :' : 'Error removing item:'} ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7EE] flex flex-col w-full h-full overflow-hidden text-[#133E3B] animate-fade-in">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#E8E2D5] flex items-center justify-between bg-white/90 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
            {isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#0D3B37]">
              {isEditing
                ? (lang === 'FR' ? `Modifier « ${itemToEdit?.name} »` : `Edit "${itemToEdit?.name}"`)
                : (lang === 'FR' ? 'Ajouter un aliment à la cuisine' : 'Add New Item to Kitchen')}
            </h2>
            <p className="text-[11px] text-[#527470]">
              {isEditing
                ? (lang === 'FR' ? 'Modifier quantité, compartiment ou péremption' : 'Modify quantity, location, or expiration')
                : (lang === 'FR' ? 'Saisie manuelle directe sans numérisation' : 'Direct manual entry without scanning')}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
          title={lang === 'FR' ? 'Quitter' : 'Exit'}
        >
          <X className="w-4 h-4" />
          <span>{lang === 'FR' ? 'Quitter' : 'Exit'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full">
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold text-[#0D3B37] mb-1">
              {lang === 'FR' ? "Nom de l'aliment *" : 'Item Name *'}
            </label>
            <input
              type="text"
              required
              autoFocus={!isEditing}
              placeholder={lang === 'FR' ? 'ex. Pommes Honeycrisp bio, Bifteck de faux-filet...' : 'e.g. Organic Whole Milk, Greek Yogurt, Cheddar...'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#D5E1D2] text-sm font-medium text-[#133E3B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-2xs"
            />
          </div>

          {/* Storage Location Selector */}
          <div>
            <label className="block text-xs font-bold text-[#0D3B37] mb-1.5">
              {lang === 'FR' ? 'Compartiment de stockage' : 'Storage Compartment'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleLocationChange('FRIDGE')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  locationType === 'FRIDGE'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs ring-2 ring-teal-500/20'
                    : 'bg-white border-[#D5E1D2] text-[#2D4C46] hover:bg-teal-50/50'
                }`}
              >
                <Refrigerator className="w-4 h-4" />
                <span>{lang === 'FR' ? 'Frigo' : 'Fridge'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleLocationChange('FREEZER')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  locationType === 'FREEZER'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/20'
                    : 'bg-white border-[#D5E1D2] text-[#244563] hover:bg-blue-50/50'
                }`}
              >
                <Snowflake className="w-4 h-4" />
                <span>{lang === 'FR' ? 'Congélateur' : 'Freezer'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleLocationChange('PANTRY')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  locationType === 'PANTRY'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/20'
                    : 'bg-white border-[#D5E1D2] text-[#544122] hover:bg-amber-50/50'
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>{lang === 'FR' ? 'Garde-manger' : 'Pantry'}</span>
              </button>
            </div>
          </div>

          {/* Category Selector with Web Pictures */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#0D3B37]">
                {lang === 'FR' ? 'Catégorie alimentaire *' : 'Food Category *'}
              </label>
              <span className="text-[11px] text-[#527470]">
                {lang === 'FR' ? 'Sélectionnez pour les conseils' : 'Select best match for storage tips'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-white border border-[#D5E1D2] rounded-2xl">
              {ALL_FOOD_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryName(cat.name)}
                  className={`pl-1 pr-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                    categoryName === cat.name
                      ? 'bg-[#0E766E] text-white border-[#0E766E] shadow-2xs'
                      : 'bg-[#F2ECE0] border-[#E0D9C8] text-[#334D37] hover:bg-[#E5DDD0]'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-black/10">
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span>{getCategoryLocalizedName(cat.name, lang)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Specific Cuts & Subcategories (Meat, Fish & Specialty types) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#0D3B37]">
                {lang === 'FR' ? 'Coupe ou sous-catégorie spécifique' : 'Specific Cut or Subcategory'}
              </label>
              <span className="text-[11px] text-teal-800 font-medium">
                {lang === 'FR' ? 'Cliquer pour remplir photo et coupe' : 'Click to auto-fill photo & cut'}
              </span>
            </div>
            <ScrollableRow className="gap-2 pb-1.5 pt-0.5" gradientFrom="from-white" showChevrons={true}>
              {(categoryName.includes('Meat') || categoryName.includes('Seafood')
                ? ALL_MEAT_SEAFOOD_SUBCATEGORIES
                : ALL_SUB_CATEGORIES
              ).map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    if (!name.trim()) setName(sub.name);
                    setImageUrl(sub.imageUrl);
                    if (sub.parentCategoryId === 'cat_meat') {
                      setCategoryName('Meat & Seafood');
                    } else if (sub.parentCategoryId === 'cat_dairy') {
                      setCategoryName('Dairy & Eggs');
                    } else if (sub.parentCategoryId === 'cat_produce') {
                      setCategoryName('Produce');
                    } else if (sub.parentCategoryId === 'cat_bakery') {
                      setCategoryName('Bakery');
                    } else if (sub.parentCategoryId === 'cat_pantry') {
                      setCategoryName('Pantry Staples');
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-2 shrink-0 transition-all text-left ${
                    imageUrl === sub.imageUrl
                      ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                      : 'bg-white border-[#E0D9C8] hover:border-teal-500 text-[#133E3B] shadow-2xs'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-black/10 bg-slate-100">
                    <img
                      src={sub.imageUrl}
                      alt={sub.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold leading-tight truncate max-w-[130px]">
                      {getSubcategoryLocalizedName(sub.name, lang)}
                    </span>
                    <span className={`block text-[9px] ${imageUrl === sub.imageUrl ? 'text-teal-200' : 'text-[#627C65]'}`}>
                      {getSubcategoryLocalizedName(sub.badgeLabel || sub.name, lang)}
                    </span>
                  </div>
                </button>
              ))}
            </ScrollableRow>
          </div>

          {/* Quantity and Unit */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0D3B37] mb-1">
                  {lang === 'FR' ? 'Quantité' : 'Quantity'}
                </label>
                <div className="flex items-center bg-white border border-[#D5E1D2] rounded-2xl overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      const num = parseFloat(String(quantity)) || 1;
                      const step = num <= 1 ? 0.25 : (num % 1 === 0 ? 1 : 0.5);
                      const next = Math.max(0.1, Number((num - step).toFixed(2)));
                      setQuantity(next);
                    }}
                    className="px-3.5 py-2 text-slate-500 hover:bg-slate-100 font-black text-sm select-none cursor-pointer"
                    title={lang === 'FR' ? 'Diminuer la quantité' : 'Decrease quantity'}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onBlur={() => {
                      const num = parseFloat(String(quantity));
                      if (isNaN(num) || num <= 0) {
                        setQuantity(1);
                      } else {
                        setQuantity(Number(num.toFixed(3)));
                      }
                    }}
                    className="w-full text-center py-2 text-sm font-bold text-[#133E3B] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const num = parseFloat(String(quantity)) || 0;
                      const step = num < 1 ? 0.25 : (num % 1 === 0 ? 1 : 0.5);
                      const next = Number((num + step).toFixed(2));
                      setQuantity(next);
                    }}
                    className="px-3.5 py-2 text-slate-500 hover:bg-slate-100 font-black text-sm select-none cursor-pointer"
                    title={lang === 'FR' ? 'Augmenter la quantité' : 'Increase quantity'}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0D3B37] mb-1">
                  {lang === 'FR' ? 'Unité (Métrique, Impérial ou Pack)' : 'Unit (Metric, Imperial or Pack)'}
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder={
                      lang === 'FR'
                        ? 'ex: paquets de 300mg, pack (400g), kg, lbs...'
                        : 'e.g. Packs of 300mg, pack (400g), kg, lbs...'
                    }
                    className="w-full px-3 py-2 rounded-2xl bg-white border border-[#D5E1D2] text-sm font-medium text-[#133E3B] focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Unit Category Selector & Quick Chips */}
            <div className="bg-[#FAFDF9] border border-[#E3ECE1] rounded-xl p-2 space-y-1.5">
              <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#4F6C68]">
                  <Scale className="w-3 h-3 text-teal-600 shrink-0" />
                  <span className="shrink-0">{lang === 'FR' ? 'Système :' : 'System:'}</span>
                </div>
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: 'metric', labelEn: 'Metric (g, kg, mg, ml)', labelFr: 'Métrique (g, kg, mg, ml)' },
                      { id: 'imperial', labelEn: 'Imperial (oz, lbs, fl oz)', labelFr: 'Impérial (oz, lbs, tasse)' },
                      { id: 'composite', labelEn: 'Packs (300mg, 400g...)', labelFr: 'Packs (300mg, 400g...)' },
                      { id: 'container', labelEn: 'Containers', labelFr: 'Contenants' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setUnitCategory(cat.id)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                        unitCategory === cat.id
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'bg-[#ECE8DD] text-[#556F6B] hover:bg-[#E2DDD0]'
                      }`}
                    >
                      {lang === 'FR' ? cat.labelFr : cat.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Unit Chips based on Selected Category */}
              <div className="flex flex-wrap gap-1 pt-0.5 max-h-24 overflow-y-auto">
                {(lang === 'FR' ? UNIT_PRESETS_FR : UNIT_PRESETS_EN)
                  .filter((p) => p.category === unitCategory)
                  .map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setUnit(preset.val)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        unit.toLowerCase() === preset.val.toLowerCase()
                          ? 'bg-teal-600 text-white ring-1 ring-teal-700'
                          : 'bg-white border border-[#D5E1D2] text-[#3B5A55] hover:bg-teal-50 hover:border-teal-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
              </div>

              <div className="text-[10px] text-[#698B84] italic">
                {lang === 'FR'
                  ? '💡 Exemple : 2 paquets de 300mg de salami, 1.5 lbs de fromage, 500g, 400ml.'
                  : '💡 Example: 2 Packs of 300mg of salami, 1.5 lbs of cheese, 500g, 400ml.'}
              </div>
            </div>
          </div>

          {/* Expiration Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#0D3B37]">
                {lang === 'FR' ? 'Date de péremption' : 'Expiration Date'}
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleQuickDate(3)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 hover:bg-amber-200"
                >
                  {lang === 'FR' ? '+3j' : '+3d'}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(7)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-100 text-teal-900 hover:bg-teal-200"
                >
                  {lang === 'FR' ? '+1sem' : '+1w'}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(14)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                >
                  {lang === 'FR' ? '+2sem' : '+2w'}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(60)}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-900 hover:bg-blue-200"
                >
                  {lang === 'FR' ? '+2m' : '+2m'}
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#D5E1D2] text-sm font-medium text-[#133E3B] focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-2xs"
              />
            </div>

            {/* Smart Expiration Standards Recommendation (CFIA / MAPAQ / EFSA) */}
            {smartRecommendation && (
              <div className="mt-2 p-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-emerald-950 text-[11px]">
                          {lang === 'FR' ? 'Norme de conservation sûre' : 'Safe Storage Standard'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-900 font-black text-[9px]">
                          {smartRecommendation.matchedRule.foodSafetyAgency}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                        {lang === 'FR'
                          ? smartRecommendation.matchedRule.cfiaStandardFr
                          : smartRecommendation.matchedRule.cfiaStandardEn}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplySmartRecommendation}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black shrink-0 transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                      expirationDate === smartRecommendation.suggestedDate
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                    }`}
                    title={lang === 'FR' ? 'Appliquer cette recommandation' : 'Apply this standard suggestion'}
                  >
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>
                      {expirationDate === smartRecommendation.suggestedDate
                        ? (lang === 'FR' ? 'Appliqué' : 'Applied')
                        : (lang === 'FR' ? 'Suggérer' : 'Use Smart')}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-[#0D3B37] mb-1">
              {lang === 'FR' ? 'Notes / Conseils de conservation (Facultatif)' : 'Notes / Storage Tips (Optional)'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'FR' ? "ex. Étagère du milieu, ouvert mardi, biologique..." : "e.g. Keep on middle shelf, opened on Tuesday, organic..."}
              className="w-full px-3.5 py-2 rounded-2xl bg-white border border-[#D5E1D2] text-xs font-medium text-[#133E3B] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-2xs resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#E8E2D5] flex items-center justify-between gap-3">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="py-2.5 px-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200 shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'FR' ? 'Supprimer' : 'Delete'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold border border-[#D5E1D2] shadow-2xs"
              >
                {lang === 'FR' ? 'Annuler' : 'Cancel'}
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-5 rounded-2xl bg-[#0E766E] hover:bg-[#0B5C56] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (lang === 'FR' ? 'Enregistrement...' : 'Saving...')
                  : isEditing
                  ? (lang === 'FR' ? 'Enregistrer' : 'Save Changes')
                  : (lang === 'FR' ? 'Ajouter à la cuisine' : 'Add to Kitchen')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

