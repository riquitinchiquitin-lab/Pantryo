import React, { useState, useEffect } from 'react';
import {
  BookmarkCheck,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  ListPlus,
  CheckCircle2,
  X,
  Layers,
  Edit2,
  Save,
  RotateCcw,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { SavedGroceryList, SavedGroceryListItem } from '../types';
import { GroceryCartItem } from './GroceryListView';
import { FoodVisualBadge } from './FoodVisualBadge';
import { getFoodVisual } from '../utils/foodVisuals';
import { useLanguage } from '../utils/i18n';

const STORAGE_KEY = 'kitchen_komrade_saved_grocery_lists_v1';

export const DEFAULT_SAVED_LISTS: SavedGroceryList[] = [
  {
    id: 'list_weekly_staples',
    name: 'Weekly Household Staples',
    description: 'Everyday recurring essentials for Yan & Kriz',
    categoryTag: 'Weekly Routine',
    itemCount: 6,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    lastModifiedBy: 'Yan',
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
    lastModifiedBy: 'Kriz',
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
    lastModifiedBy: 'Yan',
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
  initialTab?: 'saved' | 'saveCurrent';
  currentUser?: { id: string; name: string };
}

function inferLocation(name: string, category?: string): 'FRIDGE' | 'FREEZER' | 'PANTRY' {
  const n = (name + ' ' + (category || '')).toLowerCase();
  if (
    n.includes('frozen') ||
    n.includes('surgel') ||
    n.includes('glace') ||
    n.includes('ice cream') ||
    n.includes('congel')
  ) {
    return 'FREEZER';
  }
  if (
    n.includes('farine') ||
    n.includes('flour') ||
    n.includes('huile') ||
    n.includes('oil') ||
    n.includes('riz') ||
    n.includes('rice') ||
    n.includes('pâte') ||
    n.includes('pasta') ||
    n.includes('conserve') ||
    n.includes('canned') ||
    n.includes('épice') ||
    n.includes('spice') ||
    n.includes('sucre') ||
    n.includes('sugar') ||
    n.includes('café') ||
    n.includes('coffee') ||
    n.includes('thé') ||
    n.includes('tea') ||
    n.includes('céréale') ||
    n.includes('cereal') ||
    n.includes('biscuit') ||
    n.includes('chips') ||
    n.includes('pain') ||
    n.includes('bread') ||
    n.includes('sauce') ||
    n.includes('sel') ||
    n.includes('salt') ||
    n.includes('poivre')
  ) {
    return 'PANTRY';
  }
  return 'FRIDGE';
}

export const SavedListsModal: React.FC<SavedListsModalProps> = ({
  isOpen,
  onClose,
  currentGroceryItems,
  onAddItemsToCurrentGrocery,
  onSaveCurrentAsList,
  initialTab = 'saved',
  currentUser = { id: 'u_1', name: 'Yan' },
}) => {
  const { lang } = useLanguage();
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
  const [isSavingCurrent, setIsSavingCurrent] = useState(initialTab === 'saveCurrent');

  // Edit list state (any member can edit any list)
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editItems, setEditItems] = useState<SavedGroceryListItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('pcs');

  // Delete list state with in-UI confirmation (safe for iframes)
  const [deletingListId, setDeletingListId] = useState<string | null>(null);
  const [deletedListBackup, setDeletedListBackup] = useState<{ list: SavedGroceryList; index: number } | null>(null);

  // New list from current run state
  const [newListName, setNewListName] = useState('');
  const [newListTag, setNewListTag] = useState('Weekly Routine');
  const [newListDescription, setNewListDescription] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Sync initialTab when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSavingCurrent(initialTab === 'saveCurrent');
      setEditingListId(null);
      setDeletingListId(null);
    }
  }, [isOpen, initialTab]);

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
      setFeedbackNotice(
        lang === 'FR'
          ? 'Veuillez sélectionner au moins un article à ajouter.'
          : 'Please select at least one item to add.'
      );
      setTimeout(() => setFeedbackNotice(null), 3000);
      return;
    }

    onAddItemsToCurrentGrocery(itemsToAdd, mode);
    setFeedbackNotice(
      lang === 'FR'
        ? `✓ ${itemsToAdd.length} articles de "${list.name}" ajoutés à vos courses !`
        : `✓ Added ${itemsToAdd.length} items from "${list.name}" to your grocery run!`
    );
    setTimeout(() => {
      setFeedbackNotice(null);
      onClose();
    }, 1200);
  };

  // Save current grocery cart items as a new saved list template
  const handleSaveCurrentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    if (currentGroceryItems.length === 0) {
      setFeedbackNotice(
        lang === 'FR'
          ? 'Votre liste de courses est vide. Ajoutez des articles d’abord.'
          : 'Your current grocery list is empty. Add items first.'
      );
      setTimeout(() => setFeedbackNotice(null), 3000);
      return;
    }

    const itemsToSave: SavedGroceryListItem[] = currentGroceryItems.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      locationType: item.locationType || inferLocation(item.name, item.category),
      category: item.category,
    }));

    const newList: SavedGroceryList = {
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newListName.trim(),
      description: newListDescription.trim() || `Modèle de ${itemsToSave.length} articles`,
      categoryTag: newListTag,
      itemCount: itemsToSave.length,
      items: itemsToSave,
      createdAt: new Date().toISOString(),
      lastModifiedBy: currentUser.name,
    };

    setSavedLists((prev) => [newList, ...prev]);
    onSaveCurrentAsList(newListName.trim(), newListTag, newListDescription.trim());

    setNewListName('');
    setNewListDescription('');
    setIsSavingCurrent(false);
    setExpandedListId(newList.id);
    setFeedbackNotice(
      lang === 'FR'
        ? `✓ Modèle "${newList.name}" enregistré par ${currentUser.name} !`
        : `✓ Saved template "${newList.name}" by ${currentUser.name}!`
    );
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // --- EDIT LIST LOGIC (Any member can edit any list) ---
  const startEditingList = (list: SavedGroceryList) => {
    setEditingListId(list.id);
    setEditName(list.name);
    setEditTag(list.categoryTag || 'Weekly Routine');
    setEditDescription(list.description || '');
    setEditItems([...list.items]);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemUnit('pcs');
    setDeletingListId(null);
  };

  const cancelEditingList = () => {
    setEditingListId(null);
    setEditItems([]);
  };

  const handleAddItemToEditList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const visual = getFoodVisual(newItemName.trim());
    const newItem: SavedGroceryListItem = {
      name: newItemName.trim(),
      quantity: newItemQty > 0 ? newItemQty : 1,
      unit: newItemUnit.trim() || 'pcs',
      locationType: inferLocation(newItemName.trim(), visual.badgeLabel),
      category: visual.badgeLabel,
    };

    setEditItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemQty(1);
  };

  const handleRemoveItemFromEditList = (itemIdx: number) => {
    setEditItems((prev) => prev.filter((_, idx) => idx !== itemIdx));
  };

  const handleUpdateItemInEditList = (
    itemIdx: number,
    field: keyof SavedGroceryListItem,
    value: any
  ) => {
    setEditItems((prev) =>
      prev.map((it, idx) => (idx === itemIdx ? { ...it, [field]: value } : it))
    );
  };

  const handleSaveEditedList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListId || !editName.trim()) return;

    if (editItems.length === 0) {
      setFeedbackNotice(
        lang === 'FR'
          ? 'La liste doit contenir au moins un article.'
          : 'The list must contain at least one item.'
      );
      setTimeout(() => setFeedbackNotice(null), 3000);
      return;
    }

    setSavedLists((prev) =>
      prev.map((l) =>
        l.id === editingListId
          ? {
              ...l,
              name: editName.trim(),
              categoryTag: editTag,
              description: editDescription.trim(),
              items: editItems,
              itemCount: editItems.length,
              updatedAt: new Date().toISOString(),
              lastModifiedBy: currentUser.name,
            }
          : l
      )
    );

    // Reset selection cache for this list
    setSelectedItemIndices((prev) => ({
      ...prev,
      [editingListId]: new Set(Array.from({ length: editItems.length }, (_, i) => i)),
    }));

    setEditingListId(null);
    setFeedbackNotice(
      lang === 'FR'
        ? `✓ Liste "${editName.trim()}" modifiée avec succès par ${currentUser.name} !`
        : `✓ Saved list "${editName.trim()}" updated by ${currentUser.name}!`
    );
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Direct quick delete of single item from expanded list
  const handleQuickDeleteItem = (listId: string, itemIdx: number) => {
    setSavedLists((prev) =>
      prev.map((l) => {
        if (l.id !== listId) return l;
        const updated = l.items.filter((_, idx) => idx !== itemIdx);
        return {
          ...l,
          items: updated,
          itemCount: updated.length,
          updatedAt: new Date().toISOString(),
          lastModifiedBy: currentUser.name,
        };
      })
    );
    // clean up selection index
    setSelectedItemIndices((prev) => {
      const current = prev[listId];
      if (!current) return prev;
      const next = new Set<number>();
      Array.from(current).forEach((i: number) => {
        if (i < itemIdx) next.add(i);
        else if (i > itemIdx) next.add(i - 1);
      });
      return { ...prev, [listId]: next };
    });
  };

  // --- DELETE LIST LOGIC (In-UI Safe confirmation for any member) ---
  const handleConfirmDeleteList = (id: string) => {
    const listIndex = savedLists.findIndex((l) => l.id === id);
    const target = savedLists[listIndex];
    if (!target) return;

    // Save backup for immediate undo
    setDeletedListBackup({ list: target, index: listIndex });

    setSavedLists((prev) => prev.filter((l) => l.id !== id));
    setDeletingListId(null);
    if (expandedListId === id) setExpandedListId(null);
    if (editingListId === id) setEditingListId(null);

    setFeedbackNotice(
      lang === 'FR'
        ? `✓ Liste "${target.name}" supprimée par ${currentUser.name}.`
        : `✓ List "${target.name}" deleted by ${currentUser.name}.`
    );
    setTimeout(() => {
      setFeedbackNotice(null);
      setDeletedListBackup(null);
    }, 6000);
  };

  const handleUndoDelete = () => {
    if (!deletedListBackup) return;
    setSavedLists((prev) => {
      const copy = [...prev];
      copy.splice(deletedListBackup.index, 0, deletedListBackup.list);
      return copy;
    });
    setExpandedListId(deletedListBackup.list.id);
    setDeletedListBackup(null);
    setFeedbackNotice(
      lang === 'FR' ? '✓ Liste restaurée !' : '✓ List restored!'
    );
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F5F8F4] flex flex-col w-full h-full overflow-hidden text-[#133E3B] animate-fade-in">
      <div className="relative w-full max-w-2xl mx-auto h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-[#E1EDE0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black tracking-tight text-[#1E3022]">
                  {lang === 'FR' ? 'Listes de Courses Enregistrées' : 'Saved Grocery Lists'}
                </h3>
                <span className="px-1.5 py-0.2 rounded-md bg-teal-50 text-teal-800 border border-teal-200/60 text-[9px] font-bold flex items-center gap-0.5">
                  <UserCheck className="w-2.5 h-2.5 text-teal-600" />
                  <span>{currentUser.name}</span>
                </span>
              </div>
              <p className="text-[11px] text-[#556D58]">
                {lang === 'FR'
                  ? 'Modifiables et supprimables par tous les membres du foyer'
                  : 'Editable & deletable by any household member'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
            title={lang === 'FR' ? 'Quitter' : 'Exit'}
          >
            <X className="w-4 h-4" />
            <span>{lang === 'FR' ? 'Fermer' : 'Close'}</span>
          </button>
        </div>

        {/* Feedback Alert / Undo Toast */}
        {feedbackNotice && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-700 text-white text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span className="truncate">{feedbackNotice}</span>
            </div>
            {deletedListBackup && (
              <button
                type="button"
                onClick={handleUndoDelete}
                className="px-2.5 py-1 rounded-xl bg-white text-emerald-900 font-black text-[11px] flex items-center gap-1 hover:bg-emerald-50 shrink-0 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'FR' ? 'Annuler' : 'Undo'}</span>
              </button>
            )}
          </div>
        )}

        {/* Top Action Tabs: Browse Saved vs Save Current */}
        {!editingListId && (
          <div className="p-3 border-b border-[#EEF4ED] flex items-center gap-2 bg-white shrink-0">
            <button
              onClick={() => {
                setIsSavingCurrent(false);
                setDeletingListId(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
              onClick={() => {
                setIsSavingCurrent(true);
                setDeletingListId(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isSavingCurrent
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>{lang === 'FR' ? 'Enregistrer Liste Actuelle' : 'Save Current Run'}</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {/* EDIT LIST FORM (Appears when any member edits a saved list) */}
          {editingListId ? (
            <div className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#1E3022]">
                      {lang === 'FR' ? 'Modifier le Modèle de Liste' : 'Edit List Template'}
                    </h4>
                    <p className="text-[10px] text-[#556D58]">
                      {lang === 'FR'
                        ? `Modifications effectuées par ${currentUser.name}`
                        : `Editing as ${currentUser.name}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={cancelEditingList}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  title={lang === 'FR' ? 'Annuler' : 'Cancel'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Tag Inputs */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#4E6852] mb-1">
                    {lang === 'FR' ? 'Nom de la liste *' : 'List Name *'}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-[#F7FAF6] border border-[#D5E1D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-[#233527]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#4E6852] mb-1">
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
                        onClick={() => setEditTag(key)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          editTag === key
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-[#EEF4EC] text-[#4F6853] hover:bg-[#E2EDE0]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-[#4E6852] mb-1">
                    {lang === 'FR' ? 'Description' : 'Description'}
                  </label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder={
                      lang === 'FR' ? 'ex. Ingrédients clés du week-end...' : 'e.g. Weekend key ingredients...'
                    }
                    className="w-full px-3 py-1.5 text-xs bg-[#F7FAF6] border border-[#D5E1D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Items in Edit List */}
              <div className="space-y-2 pt-2 border-t border-[#EEF4ED]">
                <div className="flex items-center justify-between text-xs font-bold text-[#233527]">
                  <span>
                    {lang === 'FR' ? 'Articles du modèle :' : 'Template Items:'} ({editItems.length})
                  </span>
                  <span className="text-[10px] text-[#556D58]">
                    {lang === 'FR' ? 'Modifiez ou retirez des articles' : 'Edit or delete items'}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {editItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-[#F7FAF6] border border-[#D5E1D2] flex items-center justify-between gap-2"
                    >
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          handleUpdateItemInEditList(idx, 'name', e.target.value)
                        }
                        className="flex-1 px-2 py-1 text-xs bg-white border border-[#CBD9C8] rounded-lg font-bold text-[#233527]"
                      />

                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItemInEditList(
                              idx,
                              'quantity',
                              parseFloat(e.target.value) || 1
                            )
                          }
                          className="w-14 px-1.5 py-1 text-xs text-center font-bold bg-white border border-[#CBD9C8] rounded-lg"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) =>
                            handleUpdateItemInEditList(idx, 'unit', e.target.value)
                          }
                          className="w-16 px-1.5 py-1 text-xs text-center bg-white border border-[#CBD9C8] rounded-lg text-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveItemFromEditList(idx)}
                          className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={lang === 'FR' ? "Supprimer cet article" : 'Remove this item'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new item to this template */}
                <form
                  onSubmit={handleAddItemToEditList}
                  className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={
                      lang === 'FR' ? '+ Ajouter un article au modèle...' : '+ Add item to template...'
                    }
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg text-[#233527] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(parseFloat(e.target.value) || 1)}
                    className="w-14 px-1 py-1.5 text-xs text-center font-bold bg-white border border-emerald-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder={lang === 'FR' ? 'unité' : 'unit'}
                    className="w-16 px-1 py-1.5 text-xs text-center bg-white border border-emerald-200 rounded-lg text-slate-700"
                  />
                  <button
                    type="submit"
                    disabled={!newItemName.trim()}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Edit Actions: Cancel / Save */}
              <div className="pt-3 border-t border-[#EEF4ED] flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelEditingList}
                  className="flex-1 py-2 text-xs font-bold text-[#556D58] hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {lang === 'FR' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedList}
                  disabled={!editName.trim() || editItems.length === 0}
                  className="flex-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? 'Enregistrer les Modifications' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          ) : isSavingCurrent ? (
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
                      ? 'ex. Essentiels Hebdomadaires, Repas Rapides'
                      : 'e.g. Weekly Staples, Taco Fiesta'
                  }
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5E1D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-bold"
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
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
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
                      ? 'ex. Modèle de base pour le ravitaillement du lundi'
                      : 'e.g. Every Monday breakfast and dinner basics'
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5E1D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSavingCurrent(false)}
                  className="flex-1 py-2 text-xs font-bold text-[#556D58] hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {lang === 'FR' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim() || currentGroceryItems.length === 0}
                  className="flex-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
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
                      ? 'Enregistrez votre liste de courses terminée ou restaurez les modèles par défaut.'
                      : 'Save your completed shopping list or reset to default household templates.'}
                  </p>
                  <button
                    onClick={() => setSavedLists(DEFAULT_SAVED_LISTS)}
                    className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {lang === 'FR' ? 'Charger les Modèles par Défaut' : 'Load Default Templates'}
                  </button>
                </div>
              ) : (
                savedLists.map((list) => {
                  const isExpanded = expandedListId === list.id;
                  const isDeleting = deletingListId === list.id;
                  const total = list.items.length;
                  const selectedSet =
                    selectedItemIndices[list.id] ??
                    new Set(Array.from({ length: total }, (_, i) => i));
                  const selectedCount = selectedSet.size;

                  return (
                    <div
                      key={list.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isExpanded
                          ? 'bg-[#F9FCF8] border-emerald-400/80 shadow-md ring-1 ring-emerald-500/20'
                          : 'bg-white border-[#D5E1D2] shadow-2xs hover:border-[#B8CEB5]'
                      }`}
                    >
                      {/* IN-UI CONFIRM DELETE DIALOG (Safe for iframe, no blocked alerts) */}
                      {isDeleting ? (
                        <div className="p-3.5 bg-rose-50 border-b border-rose-200 text-rose-950 space-y-2 animate-fade-in">
                          <div className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-black text-rose-900">
                                {lang === 'FR'
                                  ? `Supprimer définitivement "${list.name}" ?`
                                  : `Permanently delete "${list.name}"?`}
                              </h5>
                              <p className="text-[11px] text-rose-800">
                                {lang === 'FR'
                                  ? 'Cette liste sera supprimée pour tous les membres du foyer.'
                                  : 'This list will be deleted for all household members.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setDeletingListId(null)}
                              className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                            >
                              {lang === 'FR' ? 'Annuler' : 'Cancel'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmDeleteList(list.id)}
                              className="flex-1 py-1.5 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{lang === 'FR' ? 'Confirmer Suppression' : 'Confirm Delete'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Standard List Header */
                        <div className="p-3.5 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className="cursor-pointer flex-1 min-w-0"
                              onClick={() =>
                                setExpandedListId(isExpanded ? null : list.id)
                              }
                            >
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-black text-[#1E3022] truncate">
                                  {list.name}
                                </h4>
                                {list.categoryTag && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider shrink-0">
                                    {list.categoryTag}
                                  </span>
                                )}
                              </div>
                              {list.description && (
                                <p className="text-[11px] text-[#556D58] mt-0.5 line-clamp-1">
                                  {list.description}
                                </p>
                              )}
                              {list.lastModifiedBy && (
                                <p className="text-[10px] text-[#69826D] mt-0.5 flex items-center gap-1">
                                  <span>
                                    {lang === 'FR' ? 'Modifié par' : 'Edited by'} <strong>{list.lastModifiedBy}</strong>
                                  </span>
                                </p>
                              )}
                            </div>

                            {/* Actions for any household member: Edit, Delete, Expand */}
                            <div className="flex items-center gap-1 shrink-0">
                              {/* EDIT LIST BUTTON */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingList(list);
                                }}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title={lang === 'FR' ? 'Modifier la liste (articles, nom, quantités)' : 'Edit list (items, name, quantities)'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* DELETE LIST BUTTON */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingListId(list.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title={lang === 'FR' ? 'Supprimer la liste' : 'Delete saved list'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {/* EXPAND / COLLAPSE */}
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedListId(isExpanded ? null : list.id)
                                }
                                className="p-1 text-[#556D58] hover:bg-[#EEF4EC] rounded-lg transition-colors cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-[#EDF4EB] text-[10px] font-bold text-[#556D58]">
                            <span className="font-extrabold text-[#233527]">
                              {total} {lang === 'FR' ? (total === 1 ? 'article' : 'articles') : (total === 1 ? 'item' : 'items')}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              {lang === 'FR' ? 'Prêt à charger pour les courses' : 'Ready for shopping'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Expanded Items & Add Actions */}
                      {isExpanded && !isDeleting && (
                        <div className="px-3.5 pb-3.5 pt-1 space-y-3 bg-[#F2F7F1]/50 border-t border-[#E1EDE0] animate-fade-in">
                          {/* Item Checklist selection controls */}
                          <div className="flex items-center justify-between text-[11px] text-[#556D58]">
                            <span className="font-bold">
                              {lang === 'FR'
                                ? `Sélectionner (${selectedCount}/${total}) :`
                                : `Select to add (${selectedCount}/${total}):`}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] font-bold">
                              <button
                                onClick={() => selectAllInList(list.id, total)}
                                className="text-emerald-700 hover:underline cursor-pointer"
                              >
                                {lang === 'FR' ? 'Tout cocher' : 'Select All'}
                              </button>
                              <span>•</span>
                              <button
                                onClick={() => deselectAllInList(list.id)}
                                className="text-slate-500 hover:underline cursor-pointer"
                              >
                                {lang === 'FR' ? 'Tout décocher' : 'Deselect All'}
                              </button>
                            </div>
                          </div>

                          {/* Items Checklist with quick item remove option */}
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                            {list.items.map((item, idx) => {
                              const isSelected = selectedSet.has(idx);
                              const visual = getFoodVisual(item.name);

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
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div
                                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                                        isSelected
                                          ? 'bg-emerald-600 border-emerald-600 text-white'
                                          : 'border-slate-300 bg-white'
                                      }`}
                                    >
                                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                    <FoodVisualBadge
                                      itemName={item.name}
                                      categoryName={item.category || visual.badgeLabel}
                                      size="sm"
                                    />
                                    <span className="font-bold text-[#233527] truncate">
                                      {item.name}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] text-[#556D58] font-bold px-1.5 py-0.2 rounded bg-[#EDF3EC]">
                                      {item.quantity} {item.unit}
                                    </span>
                                    {/* Quick delete single item */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickDeleteItem(list.id, idx);
                                      }}
                                      className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title={lang === 'FR' ? "Retirer de la liste" : 'Remove from list'}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Quick modify prompt */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => startEditingList(list)}
                              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>{lang === 'FR' ? 'Modifier cette liste (ajouter / renommer)' : 'Edit list (add items / rename)'}</span>
                            </button>
                          </div>

                          {/* Add Action Buttons */}
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              onClick={() => handleAddItems(list, 'MERGE')}
                              disabled={selectedCount === 0}
                              className="flex-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
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
                                handleAddItems(list, 'REPLACE');
                              }}
                              disabled={selectedCount === 0}
                              className="flex-1 py-2 px-2.5 bg-white hover:bg-slate-100 border border-[#CBD9C8] text-[#344D38] rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
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
        <div className="p-3 bg-[#F5F8F4] border-t border-[#E1EDE0] text-center text-[10px] text-[#69826D] shrink-0">
          {lang === 'FR'
            ? '💡 N’importe quel membre du foyer (Yan, Kriz) peut modifier les articles, les quantités ou supprimer un modèle.'
            : '💡 Any household member (Yan, Kriz) can edit items, change quantities, or delete any list template.'}
        </div>
      </div>
    </div>
  );
};
