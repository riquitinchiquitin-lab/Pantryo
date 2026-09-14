import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Check,
  Trash2,
  Sparkles,
  CheckCircle2,
  Refrigerator,
  Snowflake,
  Boxes,
  ArrowRight,
  ShoppingBag,
  Store,
  ChevronDown,
  RotateCcw,
  Sparkle,
  BookmarkCheck,
  BookmarkPlus,
  Layers,
  Bookmark,
} from 'lucide-react';
import { InventoryItem, StorageType, SavedGroceryListItem } from '../types';
import { FoodVisualBadge } from './FoodVisualBadge';
import { getFoodVisual } from '../utils/foodVisuals';
import { SavedListsModal } from './SavedListsModal';

export interface GroceryCartItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  locationType: 'FRIDGE' | 'FREEZER' | 'PANTRY';
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
      locationType: 'FRIDGE' | 'FREEZER' | 'PANTRY';
      categoryName: string;
      imageUrl?: string;
      notes?: string;
    }>
  ) => Promise<boolean>;
  groceryItems: GroceryCartItem[];
  onUpdateGroceryItems: React.Dispatch<React.SetStateAction<GroceryCartItem[]>>;
  onSwitchToInventory?: () => void;
}

export const GroceryListView: React.FC<GroceryListViewProps> = ({
  expiringItems,
  currentUser,
  onStockItemsToKitchen,
  groceryItems,
  onUpdateGroceryItems,
  onSwitchToInventory,
}) => {
  const [filterView, setFilterView] = useState<'ALL' | 'TO_BUY' | 'IN_CART'>('ALL');
  const [inputName, setInputName] = useState('');
  const [inputCategory, setInputCategory] = useState('Produce');
  const [inputLocation, setInputLocation] = useState<'FRIDGE' | 'FREEZER' | 'PANTRY'>('FRIDGE');
  const [inputQty, setInputQty] = useState(1);
  const [inputUnit, setInputUnit] = useState('pcs');
  const [addDirectlyToCart, setAddDirectlyToCart] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isStocking, setIsStocking] = useState(false);
  const [stockSuccessMessage, setStockSuccessMessage] = useState<string | null>(null);
  const [isSavedListsOpen, setIsSavedListsOpen] = useState(false);

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
          locationType: item.locationType,
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
              locationType: item.locationType || result[existingIdx].locationType,
            };
          } else {
            const visual = getFoodVisual(item.name);
            result.unshift({
              id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: item.name,
              category: item.category || visual.badgeLabel,
              quantity: item.quantity,
              unit: item.unit,
              locationType: item.locationType,
              inCart: false,
            });
          }
        });
        return result;
      });
    }

    setStockSuccessMessage(`🛒 Loaded ${itemsToAdd.length} items from saved list to your grocery run!`);
    setTimeout(() => setStockSuccessMessage(null), 3500);
  };

  const handleSaveCurrentAsList = (name: string, categoryTag: string, description?: string) => {
    setStockSuccessMessage(`✓ Template "${name}" saved to your Saved Lists!`);
    setTimeout(() => setStockSuccessMessage(null), 3500);
  };

  // Toggle item in/out of physical shopping cart
  const toggleCart = (id: string) => {
    onUpdateGroceryItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, inCart: !i.inCart } : i))
    );
  };

  // Cycle destination location between FRIDGE -> FREEZER -> PANTRY
  const cycleLocation = (id: string) => {
    const cycleMap: Record<'FRIDGE' | 'FREEZER' | 'PANTRY', 'FRIDGE' | 'FREEZER' | 'PANTRY'> = {
      FRIDGE: 'FREEZER',
      FREEZER: 'PANTRY',
      PANTRY: 'FRIDGE',
    };
    onUpdateGroceryItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, locationType: cycleMap[i.locationType] } : i))
    );
  };

  const setSpecificLocation = (id: string, loc: 'FRIDGE' | 'FREEZER' | 'PANTRY') => {
    onUpdateGroceryItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, locationType: loc } : i))
    );
  };

  const removeItem = (id: string) => {
    onUpdateGroceryItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    // Smart auto-detect location based on category if default fridge
    let detectedLoc = inputLocation;
    const nameLower = inputName.toLowerCase();
    if (nameLower.includes('frozen') || nameLower.includes('ice cream') || nameLower.includes('beef') || nameLower.includes('salmon')) {
      detectedLoc = 'FREEZER';
    } else if (nameLower.includes('flour') || nameLower.includes('oil') || nameLower.includes('pasta') || nameLower.includes('canned') || nameLower.includes('beans') || nameLower.includes('rice') || nameLower.includes('spice')) {
      detectedLoc = 'PANTRY';
    }

    const visual = getFoodVisual(inputName.trim());

    const newItem: GroceryCartItem = {
      id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: inputName.trim(),
      category: visual.badgeLabel,
      quantity: inputQty,
      unit: inputUnit,
      locationType: detectedLoc,
      inCart: addDirectlyToCart,
    };

    onUpdateGroceryItems((prev) => [newItem, ...prev]);
    setInputName('');
    setInputQty(1);
  };

  const inCartItems = groceryItems.filter((i) => i.inCart);
  const toBuyItems = groceryItems.filter((i) => !i.inCart);

  const displayedItems =
    filterView === 'IN_CART'
      ? inCartItems
      : filterView === 'TO_BUY'
      ? toBuyItems
      : groceryItems;

  const cartFridgeCount = inCartItems.filter((i) => i.locationType === 'FRIDGE').length;
  const cartFreezerCount = inCartItems.filter((i) => i.locationType === 'FREEZER').length;
  const cartPantryCount = inCartItems.filter((i) => i.locationType === 'PANTRY').length;

  // Handle final checkout and stocking into Kitchen Inventory
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
          locationType: item.locationType,
          categoryName: item.category || visual.badgeLabel,
          imageUrl: item.imageUrl || visual.defaultImage,
          notes: `Purchased during grocery run by ${currentUser.name}`,
        };
      });

      const success = await onStockItemsToKitchen(payload);
      if (success) {
        // Remove shopped items from grocery cart
        onUpdateGroceryItems((prev) => prev.filter((i) => !i.inCart));
        setIsStockModalOpen(false);
        setStockSuccessMessage(
          `Successfully stocked ${payload.length} items into your kitchen! (${cartFridgeCount} Fridge, ${cartFreezerCount} Freezer, ${cartPantryCount} Pantry)`
        );
        setTimeout(() => setStockSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error('Failed to transfer cart to kitchen:', err);
    } finally {
      setIsStocking(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-fade-in">
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
              className="px-2.5 py-1 bg-white text-teal-900 rounded-xl font-bold text-[11px] shrink-0 hover:bg-teal-50"
            >
              View Kitchen →
            </button>
          )}
        </div>
      )}

      {/* Header & In-Store Shopping Status */}
      <div className="p-4 rounded-3xl bg-white border border-[#E5DFD0] shadow-2xs space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-black tracking-wider text-[#527470]">
                Household Grocery Run
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            </div>
            <h2 className="text-base font-black tracking-tight text-[#0D3B37]">
              Store Shopping Cart
            </h2>
            <p className="text-xs text-[#527470]">
              Synced in real time between Yan & Kriz
            </p>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/70 text-teal-800 text-xs font-bold">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{inCartItems.length} in cart</span>
            </div>
            <p className="text-[11px] text-[#527470] mt-0.5">
              {toBuyItems.length} items left to find
            </p>
          </div>
        </div>

        {/* Shopping Progress Bar */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#133E3B]">
            <span>Shopping Cart Progress</span>
            <span>
              {groceryItems.length > 0
                ? Math.round((inCartItems.length / groceryItems.length) * 100)
                : 0}
              % Collected
            </span>
          </div>
          <div className="w-full h-2 bg-[#EAE5D8] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-600 to-teal-500 transition-all duration-300"
              style={{
                width: `${
                  groceryItems.length > 0
                    ? (inCartItems.length / groceryItems.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Location Destination Legend with Distinct Icons */}
        <div className="pt-2 border-t border-[#F2ECE0] flex items-center justify-between text-[10px] font-bold text-[#527470]">
          <span className="text-[#6A8884] uppercase tracking-wider">Destination Zones:</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
              <Refrigerator className="w-3 h-3 text-teal-700" />
              Fridge ({cartFridgeCount})
            </span>
            <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
              <Snowflake className="w-3 h-3 text-blue-500" />
              Freezer ({cartFreezerCount})
            </span>
            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              <Boxes className="w-3 h-3 text-amber-600" />
              Pantry ({cartPantryCount})
            </span>
          </div>
        </div>
      </div>

      {/* SAVED LISTS & REUSABLE TEMPLATES BAR */}
      <div className="p-2.5 rounded-2xl bg-white border border-[#E5DFD0] shadow-2xs flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsSavedListsOpen(true)}
          className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#F6FAF9] hover:bg-teal-50 border border-[#CDE3DF] text-[#0D3B37] text-xs font-black flex items-center justify-between transition-all active:scale-95 group"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <BookmarkCheck className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <span className="block text-xs font-black">Saved Grocery Lists</span>
              <span className="block text-[10px] font-medium text-[#527470]">
                Staples, meal kits & bulk restocks
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/70 text-[10px] font-black shrink-0">
            Open
          </span>
        </button>

        {groceryItems.length > 0 && (
          <button
            type="button"
            onClick={() => setIsSavedListsOpen(true)}
            title="Save your current grocery list as a reusable template"
            className="py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-teal-700" />
            <span>Save Run</span>
          </button>
        )}
      </div>

      {/* Auto-Restock Suggestion from Expiring Kitchen Items */}
      {expiringItems.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{expiringItems[0].name}</strong> is running low or expiring soon.
            </span>
          </div>
          <button
            onClick={() => {
              const item = expiringItems[0];
              const loc =
                item.locationType === 'FREEZER'
                  ? 'FREEZER'
                  : item.locationType === 'PANTRY'
                  ? 'PANTRY'
                  : 'FRIDGE';

              onUpdateGroceryItems((prev) => [
                ...prev,
                {
                  id: `g_${Date.now()}`,
                  name: item.name,
                  category: item.categoryName,
                  quantity: 1,
                  unit: item.unit,
                  locationType: loc,
                  inCart: false,
                  autoSuggested: true,
                },
              ]);
            }}
            className="px-2.5 py-1 bg-amber-200/70 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-[11px] transition-colors flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3 h-3" /> Add to List
          </button>
        </div>
      )}

      {/* Filter Tabs: All, To Buy, In Cart */}
      <div className="flex items-center justify-between gap-1 p-1 bg-white border border-[#D5E1D2] rounded-2xl shadow-2xs">
        <button
          onClick={() => setFilterView('ALL')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
            filterView === 'ALL'
              ? 'bg-[#233527] text-white shadow-xs'
              : 'text-[#5C715F] hover:bg-[#F2F7F1]'
          }`}
        >
          All ({groceryItems.length})
        </button>
        <button
          onClick={() => setFilterView('TO_BUY')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            filterView === 'TO_BUY'
              ? 'bg-amber-700 text-white shadow-xs'
              : 'text-[#5C715F] hover:bg-[#F2F7F1]'
          }`}
        >
          <span>To Find</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold">
            {toBuyItems.length}
          </span>
        </button>
        <button
          onClick={() => setFilterView('IN_CART')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            filterView === 'IN_CART'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-[#5C715F] hover:bg-[#F2F7F1]'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>In Cart</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold">
            {inCartItems.length}
          </span>
        </button>
      </div>

      {/* Add Item Form with Storage Destination Chooser */}
      <form
        onSubmit={addItem}
        className="p-3.5 rounded-3xl bg-white border border-[#D5E1D2] shadow-2xs space-y-2.5"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Add grocery item (e.g. Sourdough, Avocados, Ice Cream)..."
            className="flex-1 px-3.5 py-2 text-xs bg-[#F7FAF6] border border-[#D5E1D2] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {/* Location selector and in-cart toggle row */}
        <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-[#627C65] mr-1">Destination:</span>
            <button
              type="button"
              onClick={() => setInputLocation('FRIDGE')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                inputLocation === 'FRIDGE'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-[#F0F5EE] text-[#48634C] hover:bg-[#E3EDE0]'
              }`}
            >
              <Refrigerator className="w-3 h-3" />
              Fridge
            </button>
            <button
              type="button"
              onClick={() => setInputLocation('FREEZER')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                inputLocation === 'FREEZER'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-[#EFF5FA] text-[#34536E] hover:bg-[#E1EDF7]'
              }`}
            >
              <Snowflake className="w-3 h-3" />
              Freezer
            </button>
            <button
              type="button"
              onClick={() => setInputLocation('PANTRY')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                inputLocation === 'PANTRY'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-[#F9F5EC] text-[#5E4E30] hover:bg-[#F2EADB]'
              }`}
            >
              <Boxes className="w-3 h-3" />
              Pantry
            </button>
          </div>

          <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#4F6853] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={addDirectlyToCart}
              onChange={(e) => setAddDirectlyToCart(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>Put directly in Cart</span>
          </label>
        </div>
      </form>

      {/* Grocery Items List */}
      <div className="space-y-2.5">
        {displayedItems.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-[#D5E1D2] text-center text-[#69826C] space-y-1">
            <ShoppingCart className="w-8 h-8 mx-auto text-[#8FA592] opacity-60 mb-2" />
            <p className="text-xs font-bold text-[#233527]">
              {filterView === 'IN_CART'
                ? 'Your cart is empty'
                : filterView === 'TO_BUY'
                ? 'Everything is already in your cart!'
                : 'No grocery items on list'}
            </p>
            <p className="text-[11px]">
              {filterView === 'IN_CART'
                ? 'Tap the cart button on any item to mark it as picked up in the store.'
                : 'Add groceries above or load from your saved lists.'}
            </p>
            {filterView !== 'IN_CART' && (
              <button
                type="button"
                onClick={() => setIsSavedListsOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs active:scale-95"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Load a Saved List</span>
              </button>
            )}
          </div>
        ) : (
          displayedItems.map((item) => {
            const visual = getFoodVisual(item.name);
            const isFridge = item.locationType === 'FRIDGE';
            const isFreezer = item.locationType === 'FREEZER';
            const isPantry = item.locationType === 'PANTRY';

            return (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between group ${
                  item.inCart
                    ? 'bg-[#F2F8F1] border-emerald-300/80 shadow-2xs'
                    : 'bg-white border-[#D5E1D2] shadow-2xs hover:border-[#B8CEB5]'
                }`}
              >
                {/* Left: Cart Toggle Button & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Cart Action Button */}
                  <button
                    onClick={() => toggleCart(item.id)}
                    title={item.inCart ? 'Remove from Cart' : 'Place into Cart'}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all shrink-0 active:scale-90 ${
                      item.inCart
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                        : 'border-[#CBD9C8] hover:border-emerald-500 bg-[#F7FAF6] text-[#69816C]'
                    }`}
                  >
                    {item.inCart ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <ShoppingCart className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  <FoodVisualBadge
                    itemName={item.name}
                    categoryName={item.category || visual.badgeLabel}
                    size="sm"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-bold truncate ${
                          item.inCart ? 'text-[#1F3523]' : 'text-[#233527]'
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.inCart && (
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider shrink-0">
                          In Cart
                        </span>
                      )}
                    </div>

                    {/* Metadata & Interactive Destination Badge */}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#EDF3EC] text-[#39503D]">
                        {item.quantity} {item.unit}
                      </span>

                      {/* Destination Pill with Icon (Click to cycle destination) */}
                      <button
                        onClick={() => cycleLocation(item.id)}
                        title="Click to switch destination (Fridge / Freezer / Pantry)"
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all active:scale-95 ${
                          isFridge
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : isFreezer
                            ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {isFridge && <Refrigerator className="w-2.5 h-2.5 text-emerald-600" />}
                        {isFreezer && <Snowflake className="w-2.5 h-2.5 text-blue-500" />}
                        {isPantry && <Boxes className="w-2.5 h-2.5 text-amber-600" />}
                        <span>
                          {isFridge ? 'To Fridge' : isFreezer ? 'To Freezer' : 'To Pantry'}
                        </span>
                      </button>

                      {item.autoSuggested && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-semibold">
                          Restock
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick actions */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {groceryItems.length > 0 && (
          <div className="pt-2 px-1 flex items-center justify-between text-[11px] text-[#556D58]">
            <span>{groceryItems.length} total list {groceryItems.length === 1 ? 'item' : 'items'}</span>
            <button
              type="button"
              onClick={() => setIsSavedListsOpen(true)}
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline active:scale-95 transition-all"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Save run as template</span>
            </button>
          </div>
        )}
      </div>

      {/* STICKY BOTTOM CHECKOUT / STOCK TO KITCHEN BAR */}
      {inCartItems.length > 0 && (
        <div className="fixed bottom-20 inset-x-0 px-4 max-w-[420px] mx-auto z-30 pointer-events-auto">
          <div className="p-3.5 rounded-3xl bg-[#1E3022] text-white shadow-xl border border-emerald-600/40 backdrop-blur-md flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center font-black">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black tracking-tight">
                  {inCartItems.length} {inCartItems.length === 1 ? 'Item' : 'Items'} in Cart
                </p>
                <div className="flex items-center gap-2 text-[10px] text-emerald-200 font-bold">
                  {cartFridgeCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Refrigerator className="w-2.5 h-2.5" /> {cartFridgeCount} Fridge
                    </span>
                  )}
                  {cartFreezerCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Snowflake className="w-2.5 h-2.5" /> {cartFreezerCount} Freezer
                    </span>
                  )}
                  {cartPantryCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Boxes className="w-2.5 h-2.5" /> {cartPantryCount} Pantry
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsStockModalOpen(true)}
              className="py-2 px-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
            >
              <span>Stock Kitchen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION & STORAGE ASSIGNMENT MODAL */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-[#D5E1D2] shadow-2xl p-4 space-y-3.5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[#EEF4ED]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <ShoppingBag className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1E3022]">Stock to Kitchen</h3>
                  <p className="text-[11px] text-[#556D58]">
                    Review target compartments before adding
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStockModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* List of Cart items with location selector toggles */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-60 scrollbar-thin">
              {inCartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-2xl bg-[#F6FAF5] border border-[#E1EDE0] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#233527]">{item.name}</span>
                    <span className="text-[11px] font-bold text-[#556D58]">
                      {item.quantity} {item.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#69826D] font-bold">Zone:</span>
                    <button
                      onClick={() => setSpecificLocation(item.id, 'FRIDGE')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        item.locationType === 'FRIDGE'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white border border-[#CBD9C8] text-[#344D38]'
                      }`}
                    >
                      <Refrigerator className="w-2.5 h-2.5" />
                      Fridge
                    </button>
                    <button
                      onClick={() => setSpecificLocation(item.id, 'FREEZER')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        item.locationType === 'FREEZER'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white border border-[#CBD9C8] text-[#344D38]'
                      }`}
                    >
                      <Snowflake className="w-2.5 h-2.5" />
                      Freezer
                    </button>
                    <button
                      onClick={() => setSpecificLocation(item.id, 'PANTRY')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        item.locationType === 'PANTRY'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-white border border-[#CBD9C8] text-[#344D38]'
                      }`}
                    >
                      <Boxes className="w-2.5 h-2.5" />
                      Pantry
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Destination Summary */}
            <div className="p-3 rounded-2xl bg-[#EAF2E7] border border-[#CADCC6] text-xs space-y-1">
              <p className="font-bold text-[#203624] flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-700" />
                Transferring {inCartItems.length} items to Kitchen:
              </p>
              <div className="flex items-center gap-3 text-[11px] text-[#425B45]">
                <span className="flex items-center gap-1">
                  <Refrigerator className="w-3 h-3 text-emerald-600" /> {cartFridgeCount} in Fridge
                </span>
                <span className="flex items-center gap-1">
                  <Snowflake className="w-3 h-3 text-blue-600" /> {cartFreezerCount} in Freezer
                </span>
                <span className="flex items-center gap-1">
                  <Boxes className="w-3 h-3 text-amber-700" /> {cartPantryCount} in Pantry
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-[#EEF4ED]">
              <button
                type="button"
                onClick={() => setIsStockModalOpen(false)}
                disabled={isStocking}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-[#556D58] hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStockKitchen}
                disabled={isStocking}
                className="flex-2 py-2.5 px-4 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 transition-all active:scale-95"
              >
                {isStocking ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Adding to Kitchen...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Add to Kitchen</span>
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
      />
    </div>
  );
};
