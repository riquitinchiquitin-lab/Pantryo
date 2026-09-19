import React, { useState, useEffect } from 'react';
import {
  BookmarkCheck,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Refrigerator,
  Snowflake,
  Boxes,
  ShoppingBag,
  ListPlus,
  CheckCircle2,
  FolderHeart,
  Sparkles,
  ArrowRight,
  X,
  Layers,
  Copy,
} from 'lucide-react';
import { SavedGroceryList, SavedGroceryListItem } from '../types';
import { GroceryCartItem } from './GroceryListView';
import { FoodVisualBadge } from './FoodVisualBadge';
import { getFoodVisual } from '../utils/foodVisuals';
import { useLanguage, getLocationLocalizedName, getCategoryLocalizedName } from '../utils/i18n';

const STORAGE_KEY = 'kitchen_komrade_saved_grocery_lists_v1';

export const DEFAULT_SAVED_LISTS: SavedGroceryList[] = [
  {
    id: 'list_weekly_staples',
    name: 'Weekly Household Staples',
    description: 'Everyday recurring essentials for Yan & Kriz',
    categoryTag: 'Weekly Routine',
    itemCount: 6,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    items: [
      { name: 'Organic Whole Milk', quantity: 1, unit: 'gal', locationType: 'FRIDGE', category: 'Dairy & Eggs' },
      { name: 'Free-Range Eggs', quantity: 1, unit: 'dozen', locationType: 'FRIDGE', category: 'Dairy & Eggs' },
      { name: 'Sourdough Bread', quantity: 1, unit: 'loaf', locationType: 'PANTRY', category: 'Bakery' },
      { name: 'Hass Avocados', quantity: 3, unit: 'pcs', locationType: 'FRIDGE', category: 'Produce' },
      { name: 'Greek Yogurt', quantity: 2, unit: 'tub', locationType: 'FRIDGE', category: 'Dairy & Eggs' },
      { name: 'Extra Virgin Olive Oil', quantity: 1, unit: 'bottle', locationType: 'PANTRY', category: 'Pantry' },
    ],
  },
  {
    id: 'list_freezer_restock',
    name: 'Sub-Zero Bulk Restock',
    description: 'High-protein and frozen fruit staples for batch meal prep',
    categoryTag: 'Freezer Bulk',
    itemCount: 4,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    items: [
      { name: 'Wild Salmon Fillets', quantity: 2, unit: 'lbs', locationType: 'FREEZER', category: 'Seafood' },
      { name: 'Frozen Wild Blueberries', quantity: 1, unit: 'bag', locationType: 'FREEZER', category: 'Frozen Foods' },
      { name: 'Grass-Fed Ground Beef', quantity: 2, unit: 'packs', locationType: 'FREEZER', category: 'Meat & Poultry' },
      { name: 'Chicken Breasts', quantity: 3, unit: 'lbs', locationType: 'FREEZER', category: 'Meat & Poultry' },
    ],
  },
  {
    id: 'list_taco_night',
    name: 'Taco Fiesta Pack',
    description: 'Quick taco dinner supplies with fresh cilantro & lime',
    categoryTag: 'Meal Theme',
    itemCount: 5,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    items: [
      { name: 'Corn Tortillas', quantity: 1, unit: 'pack', locationType: 'PANTRY', category: 'Pantry' },
      { name: 'Fresh Cilantro', quantity: 1, unit: 'bunch', locationType: 'FRIDGE', category: 'Produce' },
      { name: 'Organic Limes', quantity: 4, unit: 'pcs', locationType: 'FRIDGE', category: 'Produce' },
      { name: 'Sharp Cheddar Cheese', quantity: 1, unit: 'block', locationType: 'FRIDGE', category: 'Dairy & Eggs' },
      { name: 'Organic Black Beans', quantity: 2, unit: 'cans', locationType: 'PANTRY', category: 'Pantry' },
    ],
  },
];

interface SavedListsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGroceryItems: GroceryCartItem[];
  onAddItemsToCurrentGrocery: (
    items: SavedGroceryListItem[],
    mode: 'MERGE' | 'REPLACE'
  ) => void;
  onSaveCurrentAsList: (name: string, categoryTag: string, description?: string) => void;
}

export const SavedListsModal: React.FC<SavedListsModalProps> = ({
  isOpen,
  onClose,
  currentGroceryItems,
  onAddItemsToCurrentGrocery,
  onSaveCurrentAsList,
}) => {
  const { t, lang } = useLanguage();
  const [savedLists, setSavedLists] = useState<SavedGroceryList[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return DEFAULT_SAVED_LISTS;
  });

  const [expandedListId, setExpandedListId] = useState<string | null>(
    DEFAULT_SAVED_LISTS[0]?.id || null
  );
  const [selectedItemIndices, setSelectedItemIndices] = useState<Record<string, Set<number>>>({});
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListTag, setNewListTag] = useState('Weekly Routine');
  const [newListDescription, setNewListDescription] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Sync saved lists to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedLists));
    } catch (e) {
      console.error('Failed to persist saved grocery lists:', e);
    }
  }, [savedLists]);

  if (!isOpen) return null;

  // Toggle selection of specific items in a saved list
  const toggleItemSelection = (listId: string, itemIdx: number, totalItems: number) => {
    setSelectedItemIndices((prev) => {
      const currentSet = new Set(prev[listId] ?? Array.from({ length: totalItems }, (_, i) => i));
      if (currentSet.has(itemIdx)) {
        currentSet.delete(itemIdx);
      } else {
        currentSet.add(itemIdx);
      }
      return { ...prev, [listId]: currentSet };
    });
  };

  const selectAllInList = (listId: string, totalItems: number) => {
    setSelectedItemIndices((prev) => ({
      ...prev,
      [listId]: new Set(Array.from({ length: totalItems }, (_, i) => i)),
    }));
  };

  const deselectAllInList = (listId: string) => {
    setSelectedItemIndices((prev) => ({
      ...prev,
      [listId]: new Set(),
    }));
  };

  // Add items from saved list to current grocery run
  const handleAddItems = (list: SavedGroceryList, mode: 'MERGE' | 'REPLACE') => {
    const selectedIndices =
      selectedItemIndices[list.id] ??
      new Set(Array.from({ length: list.items.length }, (_, i) => i));

    const itemsToAdd = list.items.filter((_, idx) => selectedIndices.has(idx));
    if (itemsToAdd.length === 0) {
      setFeedbackNotice('Please select at least one item to add.');
      setTimeout(() => setFeedbackNotice(null), 3000);
      return;
    }

    onAddItemsToCurrentGrocery(itemsToAdd, mode);
    setFeedbackNotice(
      `✓ Added ${itemsToAdd.length} items from "${list.name}" to your current grocery run!`
    );
    setTimeout(() => {
      setFeedbackNotice(null);
      onClose();
    }, 1500);
  };

  // Save current grocery cart items as a new saved list template
  const handleSaveCurrentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    if (currentGroceryItems.length === 0) {
      setFeedbackNotice('Your current grocery list is empty. Add items first.');
      setTimeout(() => setFeedbackNotice(null), 3000);
      return;
    }

    const itemsToSave: SavedGroceryListItem[] = currentGroceryItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      locationType: item.locationType,
      category: item.category,
    }));

    const newList: SavedGroceryList = {
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newListName.trim(),
      description: newListDescription.trim() || `Saved with ${itemsToSave.length} household items`,
      categoryTag: newListTag,
      itemCount: itemsToSave.length,
      items: itemsToSave,
      createdAt: new Date().toISOString(),
    };

    setSavedLists((prev) => [newList, ...prev]);
    onSaveCurrentAsList(newListName.trim(), newListTag, newListDescription.trim());

    setNewListName('');
    setNewListDescription('');
    setIsSavingCurrent(false);
    setExpandedListId(newList.id);
    setFeedbackNotice(`✓ Saved "${newList.name}" as a template!`);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleDeleteList = (id: string, name: string) => {
    if (window.confirm(`Delete the saved list "${name}"?`)) {
      setSavedLists((prev) => prev.filter((l) => l.id !== id));
      if (expandedListId === id) setExpandedListId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#D5E1D2] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#F5F8F4] border-b border-[#E1EDE0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-[#1E3022]">
                {lang === 'FR' ? 'Listes de Courses Enregistrées' : 'Saved Grocery Lists'}
              </h3>
              <p className="text-[11px] text-[#556D58]">
                {lang === 'FR'
                  ? 'Modèles réutilisables & réassorts récurrents'
                  : 'Reusable templates & recurring household restocks'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold border border-[#D5E1D2] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackNotice && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* Top Action Tabs: Save Current vs Browse Saved */}
        <div className="p-3 border-b border-[#EEF4ED] flex items-center gap-2 bg-white">
          <button
            onClick={() => setIsSavingCurrent(false)}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              !isSavingCurrent
                ? 'bg-[#233527] text-white shadow-2xs'
                : 'bg-[#F2F7F1] text-[#4F6553] hover:bg-[#EAF1E8]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              {lang === 'FR' ? 'Listes Enregistrées' : 'Saved Lists'} ({savedLists.length})
            </span>
          </button>

          <button
            onClick={() => setIsSavingCurrent(true)}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              isSavingCurrent
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <ListPlus className="w-3.5 h-3.5" />
            <span>{lang === 'FR' ? 'Enregistrer la Liste Actuelle' : 'Save Current Run'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {isSavingCurrent ? (
            /* SAVE CURRENT LIST FORM */
            <form onSubmit={handleSaveCurrentSubmit} className="space-y-3.5 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-[#F6FAF5] border border-[#DDEADC] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#1E3022] flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                    {lang === 'FR' ? 'Articles dans le panier actuel :' : 'Items in Current Grocery Run:'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    {currentGroceryItems.length} {lang === 'FR' ? 'articles' : 'items'}
                  </span>
                </div>

                {currentGroceryItems.length === 0 ? (
                  <p className="text-xs text-[#6B856E] italic">
                    {lang === 'FR'
                      ? 'Votre liste de courses est vide. Ajoutez des articles pour les enregistrer comme modèle.'
                      : 'Your current grocery cart is empty. Add items to your grocery list first to save them as a template.'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentGroceryItems.slice(0, 8).map((item) => (
                      <span
                        key={item.id}
                        className="px-2 py-0.5 rounded-lg bg-white border border-[#D5E1D2] text-[10px] font-bold text-[#324936]"
                      >
                        {item.name} ({item.quantity} {item.unit})
                      </span>
                    ))}
                    {currentGroceryItems.length > 8 && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                        +{currentGroceryItems.length - 8} {lang === 'FR' ? 'de plus' : 'more'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-[#4E6852]">
                  {lang === 'FR' ? 'Nom du Modèle / de la Liste *' : 'Template / List Name *'}
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder={
                    lang === 'FR'
                      ? 'ex. Essentiels Hebdomadaires, Réassort Surgelés'
                      : 'e.g. Weekly Pantry Staples, Costco Sub-Zero Run'
                  }
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5E1D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-[#4E6852]">
                  {lang === 'FR' ? 'Catégorie / Tag' : 'Category / Tag'}
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { key: 'Weekly Routine', label: lang === 'FR' ? 'Routine Hebdo' : 'Weekly Routine' },
                    { key: 'Freezer Bulk', label: lang === 'FR' ? 'Vrac Congélateur' : 'Freezer Bulk' },
                    { key: 'Meal Theme', label: lang === 'FR' ? 'Thème Repas' : 'Meal Theme' },
                    { key: 'Party', label: lang === 'FR' ? 'Fête / Apéro' : 'Party' },
                    { key: 'Custom', label: lang === 'FR' ? 'Personnalisé' : 'Custom' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewListTag(key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        newListTag === key
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-[#EEF4EC] text-[#4F6853] hover:bg-[#E2EDE0]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase tracking-wider text-[#4E6852]">
                  {lang === 'FR' ? 'Description (Optionnelle)' : 'Description (Optional)'}
                </label>
                <input
                  type="text"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder={
                    lang === 'FR'
                      ? 'ex. Indispensables du lundi pour le petit-déjeuner et dîner'
                      : 'e.g. Every Monday breakfast and dinner basics'
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5E1D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSavingCurrent(false)}
                  className="flex-1 py-2 text-xs font-bold text-[#556D58] hover:bg-slate-100 rounded-xl"
                >
                  {lang === 'FR' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim() || currentGroceryItems.length === 0}
                  className="flex-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? 'Enregistrer le Modèle' : 'Save Template'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* BROWSE SAVED LISTS */
            <div className="space-y-3">
              {savedLists.length === 0 ? (
                <div className="p-8 text-center text-[#69826C] bg-[#F7FAF6] rounded-2xl border border-[#D5E1D2] space-y-2">
                  <BookmarkCheck className="w-8 h-8 mx-auto text-emerald-400 opacity-70" />
                  <p className="text-xs font-bold text-[#233527]">
                    {lang === 'FR' ? 'Aucune liste enregistrée' : 'No saved lists yet'}
                  </p>
                  <p className="text-[11px]">
                    {lang === 'FR'
                      ? 'Enregistrez votre liste actuelle ou restaurez les modèles par défaut.'
                      : 'Save your current shopping list or reset to default household templates.'}
                  </p>
                  <button
                    onClick={() => setSavedLists(DEFAULT_SAVED_LISTS)}
                    className="mt-2 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                  >
                    {lang === 'FR' ? 'Charger les Modèles par Défaut' : 'Load Default Templates'}
                  </button>
                </div>
              ) : (
                savedLists.map((list) => {
                  const isExpanded = expandedListId === list.id;
                  const total = list.items.length;
                  const selectedSet =
                    selectedItemIndices[list.id] ??
                    new Set(Array.from({ length: total }, (_, i) => i));
                  const selectedCount = selectedSet.size;

                  const fridgeCount = list.items.filter((i) => i.locationType === 'FRIDGE').length;
                  const freezerCount = list.items.filter((i) => i.locationType === 'FREEZER').length;
                  const pantryCount = list.items.filter((i) => i.locationType === 'PANTRY').length;

                  return (
                    <div
                      key={list.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isExpanded
                          ? 'bg-[#F9FCF8] border-emerald-400/80 shadow-md ring-1 ring-emerald-500/20'
                          : 'bg-white border-[#D5E1D2] shadow-2xs hover:border-[#B8CEB5]'
                      }`}
                    >
                      {/* List Header Card */}
                      <div className="p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className="cursor-pointer flex-1"
                            onClick={() =>
                              setExpandedListId(isExpanded ? null : list.id)
                            }
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-black text-[#1E3022]">
                                {list.name}
                              </h4>
                              {list.categoryTag && (
                                <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                                  {list.categoryTag}
                                </span>
                              )}
                            </div>
                            {list.description && (
                              <p className="text-[11px] text-[#556D58] mt-0.5">
                                {list.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleDeleteList(list.id, list.name)}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title={lang === 'FR' ? 'Supprimer la liste enregistrée' : 'Delete saved list'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setExpandedListId(isExpanded ? null : list.id)
                              }
                              className="p-1 text-[#556D58] hover:bg-[#EEF4EC] rounded-lg transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Summary Badges: Fridge, Freezer, Pantry distribution */}
                        <div className="flex items-center justify-between pt-1 border-t border-[#EDF4EB] text-[10px] font-bold text-[#556D58]">
                          <span className="font-extrabold text-[#233527]">
                            {total} {lang === 'FR' ? 'Articles au total' : 'Items Total'}
                          </span>
                          <div className="flex items-center gap-2">
                            {fridgeCount > 0 && (
                              <span className="flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/50">
                                <Refrigerator className="w-2.5 h-2.5" /> {fridgeCount}
                              </span>
                            )}
                            {freezerCount > 0 && (
                              <span className="flex items-center gap-0.5 text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/50">
                                <Snowflake className="w-2.5 h-2.5" /> {freezerCount}
                              </span>
                            )}
                            {pantryCount > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/50">
                                <Boxes className="w-2.5 h-2.5" /> {pantryCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Items & Add Actions */}
                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-1 space-y-3 bg-[#F2F7F1]/50 border-t border-[#E1EDE0] animate-fade-in">
                          {/* Item Checklist selection controls */}
                          <div className="flex items-center justify-between text-[11px] text-[#556D58]">
                            <span className="font-bold">
                              {lang === 'FR'
                                ? `Sélectionner les articles (${selectedCount}/${total}) :`
                                : `Select items to add (${selectedCount}/${total}):`}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] font-bold">
                              <button
                                onClick={() => selectAllInList(list.id, total)}
                                className="text-emerald-700 hover:underline"
                              >
                                {lang === 'FR' ? 'Tout sélectionner' : 'Select All'}
                              </button>
                              <span>•</span>
                              <button
                                onClick={() => deselectAllInList(list.id)}
                                className="text-slate-500 hover:underline"
                              >
                                {lang === 'FR' ? 'Tout désélectionner' : 'Deselect All'}
                              </button>
                            </div>
                          </div>

                          {/* Items Checklist */}
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                            {list.items.map((item, idx) => {
                              const isSelected = selectedSet.has(idx);
                              const isFridge = item.locationType === 'FRIDGE';
                              const isFreezer = item.locationType === 'FREEZER';

                              return (
                                <div
                                  key={idx}
                                  onClick={() =>
                                    toggleItemSelection(list.id, idx, total)
                                  }
                                  className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-white border-emerald-300 shadow-2xs'
                                      : 'bg-white/60 border-slate-200 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div
                                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                        isSelected
                                          ? 'bg-emerald-600 border-emerald-600 text-white'
                                          : 'border-slate-300 bg-white'
                                      }`}
                                    >
                                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                    <FoodVisualBadge
                                      itemName={item.name}
                                      categoryName={item.category || 'Pantry'}
                                      size="sm"
                                    />
                                    <span className="font-bold text-[#233527] truncate">
                                      {item.name}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] text-[#556D58] font-bold">
                                      {item.quantity} {item.unit}
                                    </span>
                                    <span
                                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded flex items-center gap-0.5 ${
                                        isFridge
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : isFreezer
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {isFridge ? (
                                        <Refrigerator className="w-2.5 h-2.5" />
                                      ) : isFreezer ? (
                                        <Snowflake className="w-2.5 h-2.5" />
                                      ) : (
                                        <Boxes className="w-2.5 h-2.5" />
                                      )}
                                      {getLocationLocalizedName(item.locationType, lang)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Add Action Buttons */}
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              onClick={() => handleAddItems(list, 'MERGE')}
                              disabled={selectedCount === 0}
                              className="flex-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>
                                {lang === 'FR'
                                  ? `Ajouter ${selectedCount} aux courses`
                                  : `Add ${selectedCount} to Current Grocery`}
                              </span>
                            </button>

                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    lang === 'FR'
                                      ? `Remplacer la liste de courses actuelle avec les ${selectedCount} articles de "${list.name}" ?`
                                      : `Replace current grocery list with ${selectedCount} items from "${list.name}"?`
                                  )
                                ) {
                                  handleAddItems(list, 'REPLACE');
                                }
                              }}
                              disabled={selectedCount === 0}
                              className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-100 border border-[#CBD9C8] text-[#344D38] rounded-xl text-[11px] font-bold transition-all active:scale-95"
                              title={lang === 'FR' ? 'Remplace le panier actif avec cette liste' : 'Replaces active cart with this list'}
                            >
                              {lang === 'FR' ? 'Remplacer la Liste' : 'Replace List'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-[#F5F8F4] border-t border-[#E1EDE0] text-center text-[10px] text-[#69826D]">
          {lang === 'FR'
            ? '💡 Les listes enregistrées sont synchronisées entre les membres du foyer et prêtes pour chaque passage au magasin.'
            : '💡 Saved lists stay synced across household members and can be used on every grocery run.'}
        </div>
      </div>
    </div>
  );
};
