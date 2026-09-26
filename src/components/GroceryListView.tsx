import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  BookmarkCheck,
  BookmarkPlus,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { InventoryItem, SavedGroceryListItem, StorageType } from '../types';
import { FoodVisualBadge } from './FoodVisualBadge';
import { getFoodVisual } from '../utils/foodVisuals';
import { SavedListsModal } from './SavedListsModal';
import { useLanguage } from '../utils/i18n';

export interface GroceryCartItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  locationType: StorageType;
  inCart: boolean;
  autoSuggested?: boolean;
  notes?: string;
  imageUrl?: string;
}

interface GroceryListViewProps {
  expiringItems: InventoryItem[];
  currentUser: { id: string; name: string };
  onStockItemsToKitchen: (
    itemsToAdd: Array<{
      name: string;
      quantity: number;
      unit: string;
      locationType: StorageType;
      categoryName: string;
      imageUrl?: string;
      notes?: string;
    }>
  ) => Promise<boolean>;
  groceryItems: GroceryCartItem[];
  onUpdateGroceryItems: React.Dispatch<React.SetStateAction<GroceryCartItem[]>>;
  onSwitchToInventory?: () => void;
  onOpenReceiptScanner?: () => void;
}

// Smart automatic location assignment for background kitchen stocking
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

export const GroceryListView: React.FC<GroceryListViewProps> = ({
  expiringItems,
  currentUser,
  onStockItemsToKitchen,
  groceryItems,
  onUpdateGroceryItems,
  onSwitchToInventory,
}) => {
  const { lang } = useLanguage();
  const [inputName, setInputName] = useState('');
  const [inputQty, setInputQty] = useState<number | string>(1);
  const [inputUnit, setInputUnit] = useState('pcs');
  const [isStocking, setIsStocking] = useState(false);
  const [stockSuccessMessage, setStockSuccessMessage] = useState<string | null>(null);
  const [isSavedListsOpen, setIsSavedListsOpen] = useState(false);
  const [savedListsInitialTab, setSavedListsInitialTab] = useState<'saved' | 'saveCurrent'>('saved');

  // Add items from saved template/list to active grocery run
  const handleAddItemsToCurrentGrocery = (
    itemsToAdd: SavedGroceryListItem[],
    mode: 'MERGE' | 'REPLACE'
  ) => {
    if (mode === 'REPLACE') {
      const newItems: GroceryCartItem[] = itemsToAdd.map((item) => {
        const visual = getFoodVisual(item.name);
        return {
          id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: item.name,
          category: item.category || visual.badgeLabel,
          quantity: item.quantity,
          unit: item.unit,
          locationType: item.locationType || inferLocation(item.name, item.category),
          inCart: false,
        };
      });
      onUpdateGroceryItems(newItems);
    } else {
      onUpdateGroceryItems((prev) => {
        const result = [...prev];
        itemsToAdd.forEach((item) => {
          const existingIdx = result.findIndex(
            (r) => r.name.trim().toLowerCase() === item.name.trim().toLowerCase()
          );
          if (existingIdx >= 0) {
            result[existingIdx] = {
              ...result[existingIdx],
              quantity: result[existingIdx].quantity + item.quantity,
            };
          } else {
            const visual = getFoodVisual(item.name);
            result.unshift({
              id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: item.name,
              category: item.category || visual.badgeLabel,
              quantity: item.quantity,
              unit: item.unit,
              locationType: item.locationType || inferLocation(item.name, item.category),
              inCart: false,
            });
          }
        });
        return result;
      });
    }

    setStockSuccessMessage(
      lang === 'FR'
        ? `🛒 ${itemsToAdd.length} articles chargés depuis la liste sauvegardée !`
        : `🛒 Loaded ${itemsToAdd.length} items from saved list to your grocery run!`
    );
    setTimeout(() => setStockSuccessMessage(null), 3500);
  };

  const handleSaveCurrentAsList = (name: string) => {
    setStockSuccessMessage(
      lang === 'FR'
        ? `✓ Liste "${name}" enregistrée dans vos modèles !`
        : `✓ Template "${name}" saved to your Saved Lists!`
    );
    setTimeout(() => setStockSuccessMessage(null), 3500);
  };

  // Toggle single item one by one (checked / in-cart)
  const toggleCart = (id: string) => {
    onUpdateGroceryItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, inCart: !i.inCart } : i))
    );
  };

  // Remove single item from list
  const removeItem = (id: string) => {
    onUpdateGroceryItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Simple Add Item
  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    const visual = getFoodVisual(inputName.trim());
    const detectedLoc = inferLocation(inputName.trim(), visual.badgeLabel);

    const parsedQty = parseFloat(String(inputQty));
    const safeQty = isNaN(parsedQty) || parsedQty <= 0 ? 1 : Number(parsedQty.toFixed(3));

    const newItem: GroceryCartItem = {
      id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: inputName.trim(),
      category: visual.badgeLabel,
      quantity: safeQty,
      unit: inputUnit.trim() || 'pcs',
      locationType: detectedLoc,
      inCart: false,
    };

    onUpdateGroceryItems((prev) => [newItem, ...prev]);
    setInputName('');
    setInputQty(1);
  };

  const inCartItems = groceryItems.filter((i) => i.inCart);
  const toBuyItems = groceryItems.filter((i) => !i.inCart);

  // Ready to stock appears ONLY when all listed items are checked
  const isListFullyCompleted = groceryItems.length > 0 && toBuyItems.length === 0;

  // Direct 1-Tap stock to kitchen inventory
  const handleConfirmStockKitchen = async () => {
    if (inCartItems.length === 0) return;
    setIsStocking(true);

    try {
      const payload = inCartItems.map((item) => {
        const visual = getFoodVisual(item.name);
        return {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          locationType: item.locationType || inferLocation(item.name, item.category),
          categoryName: item.category || visual.badgeLabel,
          imageUrl: item.imageUrl || visual.defaultImage,
          notes: `Acheté en magasin par ${currentUser.name}`,
        };
      });

      const success = await onStockItemsToKitchen(payload);
      if (success) {
        // Remove shopped items from grocery list
        onUpdateGroceryItems([]);
        setStockSuccessMessage(
          lang === 'FR'
            ? `✓ ${payload.length} article(s) rangé(s) directement dans votre cuisine !`
            : `✓ Successfully stocked ${payload.length} item(s) directly into your kitchen!`
        );
        setTimeout(() => setStockSuccessMessage(null), 4500);
      }
    } catch (err) {
      console.error('Failed to transfer cart to kitchen:', err);
    } finally {
      setIsStocking(false);
    }
  };

  // Quick uncheck all
  const handleUncheckAll = () => {
    onUpdateGroceryItems((prev) => prev.map((i) => ({ ...i, inCart: false })));
  };

  const completionPct =
    groceryItems.length > 0
      ? Math.round((inCartItems.length / groceryItems.length) * 100)
      : 0;

  return (
    <div className="space-y-3.5 pb-28 animate-fade-in">
      {/* Top Banner / Success Notice */}
      {stockSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-teal-700 text-white text-xs shadow-md flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-200 shrink-0" />
            <span className="font-semibold">{stockSuccessMessage}</span>
          </div>
          {onSwitchToInventory && (
            <button
              onClick={onSwitchToInventory}
              className="px-2.5 py-1 bg-white text-teal-900 rounded-xl font-bold text-[11px] shrink-0 hover:bg-teal-50 cursor-pointer"
            >
              {lang === 'FR' ? 'Voir la Cuisine →' : 'View Kitchen →'}
            </button>
          )}
        </div>
      )}

      {/* Header & Checklist Progress (Clean & Simple) */}
      <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white border border-[#E5DFD0] shadow-2xs space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-black tracking-wider text-[#527470]">
                {lang === 'FR' ? 'Courses du Foyer' : 'Household Shopping'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-[#0D3B37] truncate">
              {lang === 'FR' ? "Liste d'Épicerie" : 'Grocery Shopping List'}
            </h2>
            <p className="text-xs text-[#527470] truncate">
              {lang === 'FR' ? 'Synchronisée en direct entre Yan & Kriz' : 'Synced in real time between Yan & Kriz'}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-bold whitespace-nowrap">
              <Check className="w-3.5 h-3.5 text-teal-600 stroke-[3]" />
              <span>
                {inCartItems.length} / {groceryItems.length} {lang === 'FR' ? 'cochés' : 'checked'}
              </span>
            </div>
            {toBuyItems.length > 0 ? (
              <p className="text-[11px] text-[#527470] mt-0.5 whitespace-nowrap">
                {toBuyItems.length} {lang === 'FR' ? 'restants' : 'remaining'}
              </p>
            ) : groceryItems.length > 0 ? (
              <p className="text-[11px] text-emerald-700 font-bold mt-0.5 whitespace-nowrap">
                {lang === 'FR' ? '✓ Tout est coché !' : '✓ All checked!'}
              </p>
            ) : null}
          </div>
        </div>

        {/* Shopping Checklist Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#133E3B]">
            <span>{lang === 'FR' ? 'Progression des Courses' : 'Shopping Progress'}</span>
            <span className="text-teal-700">{completionPct}% {lang === 'FR' ? 'cochés' : 'checked'}</span>
          </div>
          <div className="w-full h-2 bg-[#EAE5D8] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-600 to-teal-500 transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* SAVED SHOPPING LISTS ACCESS */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white border border-[#E5DFD0] shadow-2xs">
        <button
          type="button"
          onClick={() => {
            setSavedListsInitialTab('saved');
            setIsSavedListsOpen(true);
          }}
          className="w-full py-2 px-3 rounded-xl bg-[#F6FAF9] hover:bg-teal-50 border border-[#CDE3DF] text-[#0D3B37] text-xs font-black flex items-center justify-between gap-2 transition-all active:scale-[0.99] group text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-black truncate">
                {lang === 'FR' ? 'Listes de Courses Enregistrées' : 'Saved Shopping Lists'}
              </span>
              <span className="block text-[10px] font-medium text-[#527470] truncate">
                {lang === 'FR' ? 'Charger des essentiels, kits repas ou modèles' : 'Load weekly staples, meal kits, or templates'}
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-white group-hover:bg-teal-100 text-teal-800 border border-teal-200/80 text-[10px] font-black shrink-0 shadow-2xs">
            {lang === 'FR' ? 'Ouvrir' : 'Open'}
          </span>
        </button>
      </div>

      {/* Auto-Restock Suggestion from Expiring Kitchen Items */}
      {expiringItems.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate">
              <strong>{expiringItems[0].name}</strong>{' '}
              {lang === 'FR' ? 'expire bientôt.' : 'is expiring soon.'}
            </span>
          </div>
          <button
            onClick={() => {
              const item = expiringItems[0];
              onUpdateGroceryItems((prev) => [
                ...prev,
                {
                  id: `g_${Date.now()}`,
                  name: item.name,
                  category: item.categoryName,
                  quantity: 1,
                  unit: item.unit,
                  locationType: item.locationType === 'FREEZER' ? 'FREEZER' : item.locationType === 'PANTRY' ? 'PANTRY' : 'FRIDGE',
                  inCart: false,
                  autoSuggested: true,
                },
              ]);
            }}
            className="px-2.5 py-1 bg-amber-200/70 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-[11px] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> {lang === 'FR' ? 'Ajouter' : 'Add'}
          </button>
        </div>
      )}

      {/* Simple Quick Add Form */}
      <form
        onSubmit={addItem}
        className="p-2.5 sm:p-3 rounded-2xl bg-white border border-[#D5E1D2] shadow-2xs flex items-center gap-2"
      >
        <input
          type="text"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          placeholder={
            lang === 'FR'
              ? 'Ajouter un article à la liste (ex. Pain, Pommes, Lait)...'
              : 'Add item to list (e.g. Sourdough, Apples, Milk)...'
          }
          className="flex-1 px-3 py-2 text-xs bg-[#F7FAF6] border border-[#D5E1D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
        />
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min="0.001"
            step="any"
            value={inputQty}
            onChange={(e) => setInputQty(e.target.value)}
            onBlur={() => {
              const num = parseFloat(String(inputQty));
              if (isNaN(num) || num <= 0) {
                setInputQty(1);
              } else {
                setInputQty(Number(num.toFixed(3)));
              }
            }}
            className="w-12 px-1 py-2 text-xs text-center font-bold bg-[#F7FAF6] border border-[#D5E1D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            title={lang === 'FR' ? 'Quantité' : 'Quantity'}
          />
          <input
            type="text"
            value={inputUnit}
            onChange={(e) => setInputUnit(e.target.value)}
            placeholder={lang === 'FR' ? 'unités' : 'unit'}
            className="w-16 px-1.5 py-2 text-xs bg-[#F7FAF6] border border-[#D5E1D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-center"
            title={lang === 'FR' ? 'Unité (ex. pack, kg, oz)' : 'Unit (e.g. pack, lbs, oz)'}
          />
          <button
            type="submit"
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'FR' ? 'Ajouter' : 'Add'}</span>
          </button>
        </div>
      </form>

      {/* Checklist of Items (Checked one by one - appears crossed when checked) */}
      <div className="space-y-2">
        {groceryItems.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-[#D5E1D2] text-center text-[#69826C] space-y-1.5">
            <ShoppingCart className="w-8 h-8 mx-auto text-[#8FA592] opacity-60 mb-1" />
            <p className="text-xs font-bold text-[#233527]">
              {lang === 'FR' ? 'Votre liste de courses est vide' : 'Your shopping list is empty'}
            </p>
            <p className="text-[11px]">
              {lang === 'FR'
                ? 'Ajoutez des articles ci-dessus ou chargez une de vos listes sauvegardées.'
                : 'Add groceries above or pick one of your saved shopping lists.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSavedListsInitialTab('saved');
                setIsSavedListsOpen(true);
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>{lang === 'FR' ? 'Charger une Liste de Courses' : 'Load a Shopping List'}</span>
            </button>
          </div>
        ) : (
          groceryItems.map((item) => {
            const visual = getFoodVisual(item.name);

            return (
              <div
                key={item.id}
                onClick={() => toggleCart(item.id)}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none group ${
                  item.inCart
                    ? 'bg-[#F4F8F3] border-[#CDE3CF] opacity-75 shadow-2xs'
                    : 'bg-white border-[#D5E1D2] shadow-2xs hover:border-emerald-400'
                }`}
              >
                {/* Left: Tactile Circular Checkbox & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Big Touch-Friendly Checkbox */}
                  <div
                    title={
                      item.inCart
                        ? (lang === 'FR' ? 'Décocher' : 'Uncheck')
                        : (lang === 'FR' ? 'Cocher (barrer)' : 'Check off (cross out)')
                    }
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-90 ${
                      item.inCart
                        ? 'bg-emerald-600 border-2 border-emerald-600 text-white shadow-2xs'
                        : 'border-2 border-[#CBD9C8] group-hover:border-emerald-500 bg-white'
                    }`}
                  >
                    {item.inCart && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />}
                  </div>

                  <div className={item.inCart ? 'opacity-60 grayscale-[30%]' : ''}>
                    <FoodVisualBadge
                      itemName={item.name}
                      categoryName={item.category || visual.badgeLabel}
                      size="sm"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-xs font-bold truncate transition-all ${
                          item.inCart
                            ? 'line-through text-slate-400 decoration-slate-400 decoration-2'
                            : 'text-[#233527]'
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded transition-all ${
                          item.inCart
                            ? 'bg-[#E3EDE1] text-slate-400 line-through'
                            : 'bg-[#EDF3EC] text-[#39503D]'
                        }`}
                      >
                        {item.quantity} {item.unit}
                      </span>
                      {item.autoSuggested && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-semibold">
                          {lang === 'FR' ? 'Réassort' : 'Restock'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                  className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                  title={lang === 'FR' ? 'Supprimer de la liste' : 'Remove from list'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}

        {groceryItems.length > 0 && (
          <div className="pt-2 px-1 flex items-center justify-between text-[11px] text-[#556D58]">
            <span>
              {groceryItems.length}{' '}
              {lang === 'FR'
                ? (groceryItems.length === 1 ? 'article au total' : 'articles au total')
                : (groceryItems.length === 1 ? 'total item' : 'total items')}
            </span>

            {inCartItems.length > 0 && (
              <button
                type="button"
                onClick={handleUncheckAll}
                className="text-[#69826D] hover:text-[#233527] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'FR' ? 'Tout décocher' : 'Uncheck all'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* READY TO STOCK & SAVE: APPEARS ONLY WHEN ALL LISTED ITEMS ARE CHECKED */}
      {isListFullyCompleted && (
        <div className="fixed bottom-20 inset-x-0 px-4 max-w-[440px] mx-auto z-30 pointer-events-auto animate-fade-in">
          <div className="p-3.5 rounded-2xl bg-[#1E3022] text-white shadow-xl border border-emerald-500/50 backdrop-blur-md flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 flex items-center justify-center font-black shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black tracking-tight truncate text-white">
                  {lang === 'FR' ? 'Tous les articles sont cochés !' : 'All items checked off!'}
                </p>
                <p className="text-[10px] text-emerald-300 truncate">
                  {lang === 'FR' ? 'Prêt à ranger en cuisine' : 'Ready to stock in kitchen'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Save list option once completed */}
              <button
                type="button"
                onClick={() => {
                  setSavedListsInitialTab('saveCurrent');
                  setIsSavedListsOpen(true);
                }}
                title={lang === 'FR' ? 'Enregistrer cette liste comme modèle' : 'Save as list template'}
                className="py-2 px-2.5 sm:px-3 bg-white/10 hover:bg-white/20 border border-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>{lang === 'FR' ? 'Enregistrer' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmStockKitchen}
                disabled={isStocking}
                className="py-2 px-3 sm:px-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isStocking ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{lang === 'FR' ? 'Rangement...' : 'Stocking...'}</span>
                  </>
                ) : (
                  <>
                    <span>{lang === 'FR' ? 'Ranger en Cuisine' : 'Ready to Stock'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVED LISTS & REUSABLE TEMPLATES MODAL */}
      <SavedListsModal
        isOpen={isSavedListsOpen}
        onClose={() => setIsSavedListsOpen(false)}
        currentGroceryItems={groceryItems}
        onAddItemsToCurrentGrocery={handleAddItemsToCurrentGrocery}
        onSaveCurrentAsList={handleSaveCurrentAsList}
        initialTab={savedListsInitialTab}
        currentUser={currentUser}
      />
    </div>
  );
};
