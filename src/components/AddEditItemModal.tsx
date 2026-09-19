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
} from 'lucide-react';
import { InventoryItem, User, StorageType } from '../types';
import { ALL_FOOD_CATEGORIES, ALL_SUB_CATEGORIES, ALL_MEAT_SEAFOOD_SUBCATEGORIES } from '../utils/foodVisuals';
import { useLanguage, getCategoryLocalizedName, getSubcategoryLocalizedName } from '../utils/i18n';

interface AddEditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: InventoryItem | null;
  currentUser: User;
  onSaved: (item: InventoryItem, isNew: boolean) => void;
  onDeleted?: (itemId: string) => void;
}

const COMMON_UNITS = [
  'pcs',
  'pack',
  'carton',
  'bottle',
  'can',
  'box',
  'lbs',
  'kg',
  'g',
  'oz',
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
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pcs');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleLocationChange = (newLoc: 'FRIDGE' | 'FREEZER' | 'PANTRY') => {
    setLocationType(newLoc);
    // If setting a new item and user hasn't typed custom date, auto-adjust default date
    if (!isEditing) {
      setExpirationDate(getDefaultExpiration(newLoc));
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

    const locationName = locationType === 'FREEZER' ? 'Freezer' : locationType === 'PANTRY' ? 'Pantry' : 'Fridge';
    const payload = {
      name: name.trim(),
      imageUrl: imageUrl.trim() || undefined,
      quantity: Number(quantity) || 1,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#FAF7EE] border border-[#E0D9C8] rounded-3xl shadow-2xl p-5 sm:p-6 text-[#133E3B]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
              {isEditing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0D3B37]">
                {isEditing
                  ? (lang === 'FR' ? `Modifier « ${itemToEdit?.name} »` : `Edit "${itemToEdit?.name}"`)
                  : (lang === 'FR' ? 'Ajouter un aliment à la cuisine' : 'Add New Item to Kitchen')}
              </h2>
              <p className="text-xs text-[#527470]">
                {isEditing
                  ? (lang === 'FR' ? 'Modifier quantité, compartiment ou péremption' : 'Modify quantity, location, or expiration')
                  : (lang === 'FR' ? 'Saisie manuelle directe sans numérisation' : 'Direct manual entry without scanning')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E0D9C8] text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
            <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
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
            </div>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0D3B37] mb-1">
                {lang === 'FR' ? 'Quantité' : 'Quantity'}
              </label>
              <div className="flex items-center bg-white border border-[#D5E1D2] rounded-2xl overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(0.5, Number((q - 0.5).toFixed(1))))}
                  className="px-3 py-2 text-slate-500 hover:bg-slate-100 font-black text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                  className="w-full text-center py-2 text-sm font-bold text-[#133E3B] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Number((q + 0.5).toFixed(1)))}
                  className="px-3 py-2 text-slate-500 hover:bg-slate-100 font-black text-sm"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0D3B37] mb-1">
                {lang === 'FR' ? 'Unité' : 'Unit'}
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={lang === 'FR' ? 'unités, paquet, kg...' : 'pcs, pack, lbs...'}
                  className="w-full px-3 py-2 rounded-2xl bg-white border border-[#D5E1D2] text-sm font-medium text-[#133E3B] focus:outline-none focus:ring-2 focus:ring-teal-600 shadow-2xs"
                />
              </div>
              <div className="flex gap-1 mt-1 overflow-x-auto pb-0.5 scrollbar-none">
                {(lang === 'FR' ? ['unités', 'paquet', 'boîte', 'bouteille', 'kg', 'g', 'lbs'] : COMMON_UNITS.slice(0, 5)).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EAE3D4] text-[#4F6C68] hover:bg-[#DFD6C5]"
                  >
                    {u}
                  </button>
                ))}
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

