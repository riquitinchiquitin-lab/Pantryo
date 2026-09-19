import React, { useState, useEffect } from 'react';
import {
  Home,
  ShoppingCart,
  Camera,
  ChefHat,
  Users,
  AlertTriangle,
  Snowflake,
  Refrigerator,
  Box,
  Boxes,
  ShoppingBag,
  Flame,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Trash2,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Check,
  Apple,
  Milk,
  Beef,
  Wheat,
  Package,
  Layers,
  LayoutGrid,
  List,
  Leaf,
  TrendingUp,
  Clock,
  Download,
  Edit2,
  Edit3,
  CheckCheck,
  Barcode,
  CalendarDays,
  Utensils,
} from 'lucide-react';
import { InventoryItem, User, PlannedMeal } from '../types';
import { FoodVisualBadge } from './FoodVisualBadge';
import { getFoodVisual, ALL_FOOD_CATEGORIES, ALL_SUB_CATEGORIES, ALL_MEAT_SEAFOOD_SUBCATEGORIES } from '../utils/foodVisuals';
import { CameraScannerModal } from './CameraScannerModal';
import { AddEditItemModal } from './AddEditItemModal';
import { GroceryListView, GroceryCartItem } from './GroceryListView';
import { CookingIdeasView } from './CookingIdeasView';
import { FamilySyncView } from './FamilySyncView';
import { MealPlannerView } from './MealPlannerView';
import { PantryoLogo } from './PantryoLogo';
import {
  useLanguage,
  LanguageSwitcher,
  getCategoryLocalizedName,
  getSubcategoryLocalizedName,
  getLocationLocalizedName,
} from '../utils/i18n';

const INITIAL_GROCERY_ITEMS: GroceryCartItem[] = [
  {
    id: 'g_1',
    name: 'Fresh Organic Eggs',
    category: 'Dairy & Eggs',
    quantity: 1,
    unit: 'dozen',
    locationType: 'FRIDGE',
    inCart: true,
  },
  {
    id: 'g_2',
    name: 'Frozen Wild Blueberries',
    category: 'Frozen Foods',
    quantity: 1,
    unit: 'bag',
    locationType: 'FREEZER',
    inCart: true,
  },
  {
    id: 'g_3',
    name: 'Extra Virgin Olive Oil',
    category: 'Pantry Staples',
    quantity: 1,
    unit: 'bottle',
    locationType: 'PANTRY',
    inCart: false,
  },
  {
    id: 'g_4',
    name: 'Almond Flour',
    category: 'Bakery',
    quantity: 1,
    unit: 'bag',
    locationType: 'PANTRY',
    inCart: false,
  },
];

const MOCK_MEMBERS: User[] = [
  {
    id: 'usr_yan',
    name: 'Yan',
    email: 'yan@example.com',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 'usr_kriz',
    name: 'Kriz',
    email: 'kriz@example.com',
    role: 'MEMBER',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  },
];

interface MobileSimulatorProps {
  mode?: 'webapp' | 'frame';
  onInstall?: () => void;
  isInstalled?: boolean;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  mode = 'webapp',
  onInstall,
  isInstalled = false,
}) => {
  const { t, lang } = useLanguage();
  const [activeNav, setActiveNav] = useState<'home' | 'meals' | 'grocery' | 'cooking' | 'sync'>('home');
  const [filterLocation, setFilterLocation] = useState<'ALL' | 'FRIDGE' | 'PANTRY' | 'FREEZER' | 'EXPIRING'>('ALL');
  const [selectedFoodType, setSelectedFoodType] = useState<string | 'ALL'>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<User>(MOCK_MEMBERS[0]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [defrostingId, setDefrostingId] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [bentoViewMode, setBentoViewMode] = useState<'grid' | 'list'>('grid');
  const [groceryItems, setGroceryItems] = useState<GroceryCartItem[]>(INITIAL_GROCERY_ITEMS);

  // Stock items from the Grocery Shopping Cart into Kitchen Inventory
  const handleStockItemsToKitchen = async (
    itemsToAdd: Array<{
      name: string;
      quantity: number;
      unit: string;
      locationType: 'FRIDGE' | 'FREEZER' | 'PANTRY';
      categoryName: string;
      imageUrl?: string;
      notes?: string;
    }>
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/v1/inventory/bulk-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToAdd,
          userId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchInventory();
        setBannerNotice(
          lang === 'FR'
            ? `🛒 ${data.addedCount} articles rangés dans votre cuisine !`
            : `🛒 Stocked ${data.addedCount} items into your kitchen!`
        );
        setTimeout(() => setBannerNotice(null), 4000);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to stock grocery cart items:', err);
      return false;
    }
  };

  // Add an item from inventory to grocery shopping list / cart
  const handleAddItemToGroceryCart = (item: InventoryItem) => {
    const targetLoc =
      item.locationType === 'FREEZER'
        ? 'FREEZER'
        : item.locationType === 'PANTRY'
        ? 'PANTRY'
        : 'FRIDGE';

    setGroceryItems((prev) => [
      {
        id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: item.name,
        category: item.categoryName,
        quantity: 1,
        unit: item.unit,
        locationType: targetLoc,
        inCart: true,
        notes:
          lang === 'FR'
            ? `Réapprovisionnement demandé par ${currentUser.name}`
            : `Restock requested by ${currentUser.name}`,
      },
      ...prev,
    ]);
    setBannerNotice(
      lang === 'FR'
        ? `🛒 "${item.name}" ajouté à votre panier de courses !`
        : `🛒 Added "${item.name}" to your grocery cart!`
    );
    setTimeout(() => setBannerNotice(null), 3000);
  };

  // Fetch initial household inventory from backend API
  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/inventory/household/hh_yan_kriz_01');
      const data = await res.json();
      if (data.success && data.allItems) {
        setItems(data.allItems);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch planned meals for household
  const fetchPlannedMeals = async () => {
    try {
      const res = await fetch('/api/v1/inventory/household/hh_yan_kriz_01/meals');
      const data = await res.json();
      if (data.success && data.meals) {
        setPlannedMeals(data.meals);
      }
    } catch (err) {
      console.error('Failed to load planned meals:', err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchPlannedMeals();
  }, []);

  const handleAddMeal = async (mealData: Omit<PlannedMeal, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/v1/inventory/household/hh_yan_kriz_01/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealData),
      });
      const data = await res.json();
      if (data.success && data.meal) {
        setPlannedMeals((prev) => [...prev, data.meal]);
        setBannerNotice(
          lang === 'FR'
            ? `📅 Repas planifié "${data.meal.title}" !`
            : `📅 Planned meal "${data.meal.title}"!`
        );
        setTimeout(() => setBannerNotice(null), 3000);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Add meal failed:', err);
      return false;
    }
  };

  const handleUpdateMeal = async (mealId: string, updates: Partial<PlannedMeal>) => {
    try {
      const res = await fetch(`/api/v1/inventory/meals/${mealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.meal) {
        setPlannedMeals((prev) => prev.map((m) => (m.id === mealId ? data.meal : m)));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Update meal failed:', err);
      return false;
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    try {
      const res = await fetch(`/api/v1/inventory/meals/${mealId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setPlannedMeals((prev) => prev.filter((m) => m.id !== mealId));
        setBannerNotice(lang === 'FR' ? 'Repas retiré du calendrier' : 'Meal removed from calendar');
        setTimeout(() => setBannerNotice(null), 3000);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Delete meal failed:', err);
      return false;
    }
  };

  const handleItemAdded = (newItem: InventoryItem) => {
    setItems((prev) => [newItem, ...prev]);
    fetchInventory();
    setBannerNotice(
      lang === 'FR'
        ? `Ajouté "${newItem.name}" à l'inventaire !`
        : `Added "${newItem.name}" to inventory!`
    );
    setTimeout(() => setBannerNotice(null), 3000);
  };

  const handleOpenAddModal = () => {
    setItemToEdit(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setItemToEdit(item);
    setIsAddEditModalOpen(true);
  };

  const handleItemSaved = (savedItem: InventoryItem, isNew: boolean) => {
    if (isNew) {
      setItems((prev) => [savedItem, ...prev]);
      setBannerNotice(
        lang === 'FR'
          ? `Ajouté "${savedItem.name}" à l'inventaire !`
          : `Added "${savedItem.name}" to inventory!`
      );
    } else {
      setItems((prev) => prev.map((item) => (item.id === savedItem.id ? savedItem : item)));
      setBannerNotice(
        lang === 'FR' ? `Mis à jour "${savedItem.name}" !` : `Updated "${savedItem.name}"!`
      );
    }
    setTimeout(() => setBannerNotice(null), 3000);
    fetchInventory();
  };

  const handleDeleteItem = async (itemId: string, itemName?: string) => {
    const confirmMsg =
      lang === 'FR'
        ? `Retirer "${itemName || 'cet article'}" de votre cuisine ?`
        : `Remove "${itemName || 'this item'}" from your kitchen?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      const res = await fetch(`/api/v1/inventory/item/${encodeURIComponent(itemId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        setBannerNotice(
          lang === 'FR'
            ? `"${itemName || 'Article'}" retiré de l'inventaire.`
            : `Removed "${itemName || 'Item'}" from inventory.`
        );
        setTimeout(() => setBannerNotice(null), 3000);
      }
    } catch (err) {
      console.error('Delete item failed:', err);
    }
  };

  const handleConsumeItem = async (item: InventoryItem) => {
    try {
      const res = await fetch(`/api/v1/inventory/item/${encodeURIComponent(item.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CONSUMED',
          userId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setBannerNotice(
          lang === 'FR'
            ? `Marqué "${item.name}" comme consommé !`
            : `Marked "${item.name}" as consumed!`
        );
        setTimeout(() => setBannerNotice(null), 3000);
      }
    } catch (err) {
      console.error('Consume item failed:', err);
    }
  };

  // Perform Defrost API call
  const handleDefrost = async (item: InventoryItem) => {
    setDefrostingId(item.id);
    try {
      const res = await fetch(`/api/v1/inventory/item/${item.id}/defrost`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await res.json();
      if (data.success) {
        setBannerNotice(
          lang === 'FR'
            ? `❄️➡️🧊 "${item.name}" décongelé ! Déplacé au frigo avec compte à rebours de 3 jours.`
            : `❄️➡️🧊 Defrosted "${item.name}"! Moved to Fridge with 3-day countdown.`
        );
        setTimeout(() => setBannerNotice(null), 4000);
        fetchInventory();
      }
    } catch (err) {
      console.error('Defrost failed:', err);
    } finally {
      setDefrostingId(null);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.categoryName && item.categoryName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Location filter
    if (filterLocation === 'EXPIRING') {
      if (!item.isExpiringSoon && (item.daysUntilExpiration === null || item.daysUntilExpiration > 3)) {
        return false;
      }
    } else if (filterLocation !== 'ALL' && item.locationType !== filterLocation) {
      return false;
    }

    // Food Type filter
    if (selectedFoodType !== 'ALL') {
      const cat = (item.categoryName || '').toLowerCase();
      const sel = selectedFoodType.toLowerCase();
      const itemName = (item.name || '').toLowerCase();
      if (!cat.includes(sel) && !sel.includes(cat) && !itemName.includes(sel)) {
        return false;
      }
    }

    // Subcategory (Specific Cuts & Types) filter
    if (selectedSubCategory !== 'ALL') {
      const itemName = (item.name || '').toLowerCase();
      const sub = selectedSubCategory.toLowerCase();
      if (!itemName.includes(sub) && !sub.includes(itemName)) {
        return false;
      }
    }

    return true;
  });

  const expiringItems = items.filter((i) => i.isExpiringSoon || (i.daysUntilExpiration !== null && i.daysUntilExpiration <= 3));
  const fridgeCount = items.filter((i) => i.locationType === 'FRIDGE').length;
  const pantryCount = items.filter((i) => i.locationType === 'PANTRY').length;
  const freezerCount = items.filter((i) => i.locationType === 'FREEZER').length;

  return (
    <div className="relative w-full max-w-7xl mx-auto text-[#133E3B] select-none flex flex-col min-h-screen sm:min-h-[850px] sm:rounded-3xl border-0 sm:border sm:border-[#E5DFD0] sm:shadow-lg bg-[#FAF7EE] overflow-hidden">
      {/* App Top Bar */}
      <div className="px-5 pt-3 pb-3 bg-[#FAF7EE] border-b border-[#E8E2D5]">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Logo & Kitchen Name */}
          <div className="flex items-center gap-2.5">
            <PantryoLogo size={38} />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black tracking-tight text-[#0D3B37]">Pantryo</h1>
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-[#527470] font-medium">
                {lang === 'FR' ? 'La Cuisine de Yan & Kriz' : 'The Yan & Kriz Kitchen'}
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Navigation Bar (automatically shown on md screens and up) */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-white/90 rounded-2xl border border-[#E0D9C8] shadow-2xs">
            <button
              onClick={() => setActiveNav('home')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeNav === 'home'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-[#527470] hover:text-[#0D3B37] hover:bg-[#F2ECE0]'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t('nav_inventory')}</span>
            </button>
            <button
              onClick={() => setActiveNav('meals')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeNav === 'meals'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-[#527470] hover:text-[#0D3B37] hover:bg-[#F2ECE0]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('nav_meals')}</span>
              {plannedMeals.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-black">
                  {plannedMeals.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveNav('grocery')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeNav === 'grocery'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-[#527470] hover:text-[#0D3B37] hover:bg-[#F2ECE0]'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{t('nav_grocery')}</span>
              {groceryItems.filter((i) => i.inCart).length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-900 font-black">
                  {groceryItems.filter((i) => i.inCart).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveNav('cooking')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeNav === 'cooking'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-[#527470] hover:text-[#0D3B37] hover:bg-[#F2ECE0]'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>{t('nav_cooking')}</span>
            </button>
            <button
              onClick={() => setActiveNav('sync')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeNav === 'sync'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-[#527470] hover:text-[#0D3B37] hover:bg-[#F2ECE0]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t('nav_family')}</span>
            </button>
          </div>

          {/* Top Actions: Language Switcher + Install + User Pill */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            {!isInstalled && onInstall && (
              <button
                onClick={onInstall}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0E766E] hover:bg-[#0B5C56] text-white text-xs font-bold shadow-2xs transition-all active:scale-95"
                title={t('install_tooltip')}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('install_btn')}</span>
              </button>
            )}

            <button
              onClick={() => setActiveNav('sync')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/95 border border-[#E0D9C8] shadow-2xs hover:bg-white transition-colors"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="text-xs font-bold text-[#0D3B37]">{currentUser.name}</span>
            </button>
          </div>
        </div>

        {/* Global Notice Toast */}
        {bannerNotice && (
          <div className="mt-2 py-2 px-3 rounded-2xl bg-teal-700 text-white text-xs font-semibold shadow-md flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span className="truncate">{bannerNotice}</span>
          </div>
        )}
      </div>

      {/* Main Scrollable View */}
      <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 pt-2 pb-28 md:pb-14 space-y-4">
        {/* VIEW: HOME INVENTORY */}
        {activeNav === 'home' && (
          <>
            {/* HERO BENTO BOX DASHBOARD */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Bento Tile 1 (Span 2): Kitchen Bento Pulse & Zone Breakdown */}
              <div className="col-span-2 lg:col-span-2 p-3.5 rounded-3xl bg-white border border-[#E5DFD0] shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-2xl bg-teal-50 text-teal-800 border border-teal-100 flex items-center justify-center shadow-xs">
                      <Leaf className="w-4 h-4 text-teal-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-black tracking-wider text-[#527470]">
                          {t('bento_pulse_title')}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                      </div>
                      <h3 className="text-xs font-black text-[#0D3B37]">
                        {lang === 'FR' ? '96% Efficacité Zéro-Gaspillage' : '96% Zero-Waste Efficiency'}
                      </h3>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
                    {t('live_sync')}
                  </span>
                </div>

                {/* Storage Compartment Bento Pills */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-[#F2ECE0]">
                  <button
                    onClick={() => setFilterLocation('FRIDGE')}
                    className={`p-2 rounded-2xl text-left border transition-all ${
                      filterLocation === 'FRIDGE'
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-[#F7FAF9] border-[#E0ECE8] text-[#244E49] hover:bg-[#EBF3F1]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold">{t('fridge_label')}</span>
                      <Refrigerator className="w-3.5 h-3.5 opacity-90" />
                    </div>
                    <p className="text-xs font-extrabold mt-0.5">
                      {fridgeCount} {lang === 'FR' ? 'articles' : 'items'}
                    </p>
                  </button>

                  <button
                    onClick={() => setFilterLocation('FREEZER')}
                    className={`p-2 rounded-2xl text-left border transition-all ${
                      filterLocation === 'FREEZER'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-[#F0F6FA] border-[#D7E6F2] text-[#244563] hover:bg-[#E4F0F9]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold">{t('freezer_label')}</span>
                      <Snowflake className="w-3.5 h-3.5 opacity-90" />
                    </div>
                    <p className="text-xs font-extrabold mt-0.5">
                      {freezerCount} {lang === 'FR' ? 'articles' : 'items'}
                    </p>
                  </button>

                  <button
                    onClick={() => setFilterLocation('PANTRY')}
                    className={`p-2 rounded-2xl text-left border transition-all ${
                      filterLocation === 'PANTRY'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-[#FAF6EE] border-[#EFE5D0] text-[#544122] hover:bg-[#F5EDDC]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold">{t('pantry_label')}</span>
                      <Boxes className="w-3.5 h-3.5 opacity-90" />
                    </div>
                    <p className="text-xs font-extrabold mt-0.5">
                      {pantryCount} {lang === 'FR' ? 'articles' : 'items'}
                    </p>
                  </button>
                </div>
              </div>

              {/* Bento Tile 2 (1 Col): Urgent Rescue Compartment */}
              <div
                onClick={() => setFilterLocation('EXPIRING')}
                className={`p-3 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                  expiringItems.length > 0
                    ? 'bg-gradient-to-b from-rose-50 to-amber-50/40 border-rose-200 hover:border-rose-300 shadow-2xs'
                    : 'bg-white border-[#D5E1D2] shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-rose-950">{t('rescue_label')}</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-200/70 text-rose-800">
                    {expiringItems.length} {lang === 'FR' ? 'bientôt' : 'soon'}
                  </span>
                </div>
                {expiringItems.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-bold text-[#203222] truncate">{expiringItems[0]?.name}</p>
                    <p className="text-[10px] text-rose-700 font-semibold flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {expiringItems[0]?.daysUntilExpiration}{' '}
                      {lang === 'FR' ? 'j restant' : 'day left'}
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />{' '}
                    {lang === 'FR' ? 'Tout est frais & sain' : 'All fresh & safe'}
                  </div>
                )}
              </div>

              {/* Bento Tile 3 (1 Col): Sub-Zero Deep Freeze Compartment */}
              <div
                onClick={() => setFilterLocation('FREEZER')}
                className="p-3 rounded-3xl bg-gradient-to-b from-blue-50/70 to-white border border-blue-200/80 hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Snowflake className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-blue-950">{t('deep_freeze_label')}</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    -18°C
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-bold text-[#1F3323]">
                    {freezerCount} {lang === 'FR' ? 'articles stockés' : 'items stored'}
                  </p>
                  <p className="text-[10px] text-blue-700 font-semibold flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500" />{' '}
                    {lang === 'FR' ? 'Prêt à décongeler' : 'Defrost ready'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search Input & Quick Add Item Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-white border border-[#D5E1D2] rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-600/30 text-slate-800 placeholder-slate-400 shadow-2xs"
                />
              </div>
              <button
                id="quick-add-item-btn"
                onClick={handleOpenAddModal}
                className="py-2 px-3 rounded-2xl bg-[#0E766E] hover:bg-[#0B5C56] text-white font-bold text-xs flex items-center gap-1 shadow-2xs shrink-0 transition-all active:scale-95"
                title={t('quick_add_tooltip')}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'FR' ? '+ Ajouter' : '+ Add'}</span>
              </button>
            </div>

            {/* Food Type Category Quick Chips (Pictures from the Web) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1 text-[11px] font-bold text-[#556D58]">
                <span className="flex items-center gap-1.5">
                  <span>{t('browse_by_category')}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({ALL_FOOD_CATEGORIES.length} {lang === 'FR' ? 'types' : 'types'})
                  </span>
                </span>
                {selectedFoodType !== 'ALL' && (
                  <button
                    onClick={() => setSelectedFoodType('ALL')}
                    className="text-emerald-700 hover:underline font-semibold text-[11px]"
                  >
                    {t('clear_filter')}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                <button
                  onClick={() => setSelectedFoodType('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                    selectedFoodType === 'ALL'
                      ? 'bg-[#233527] text-white shadow-xs'
                      : 'bg-white border border-[#D5E1D2] text-[#4F6553] hover:bg-[#EAF1E8]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {t('all_categories')}
                </button>
                {ALL_FOOD_CATEGORIES.map((cat) => {
                  const isSelected = selectedFoodType === cat.filterKey || selectedFoodType === cat.name;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedFoodType(isSelected ? 'ALL' : cat.filterKey)}
                      className={`pl-1 pr-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 border ${
                        isSelected
                          ? `${cat.bgColor} ${cat.textColor} ${cat.borderColor} ring-2 ring-emerald-600/30 shadow-xs scale-102`
                          : 'bg-white border-[#D5E1D2] text-[#334D37] hover:bg-[#F2F7F1]'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-black/10 shadow-2xs">
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>{getCategoryLocalizedName(cat.name, lang)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specific Cuts & Subcategories with Web Photography */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1 text-[11px] font-bold text-[#556D58]">
                <span className="flex items-center gap-1.5">
                  <span className="text-xs">
                    {lang === 'FR' ? '🥩 Découpes, Poissons & Sous-catégories' : '🥩 Meat Cuts, Seafood & Subcategories'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({ALL_SUB_CATEGORIES.length} {lang === 'FR' ? 'découpes' : 'visual cuts'})
                  </span>
                </span>
                {selectedSubCategory !== 'ALL' && (
                  <button
                    onClick={() => setSelectedSubCategory('ALL')}
                    className="text-emerald-700 hover:underline font-semibold text-[11px]"
                  >
                    {lang === 'FR' ? 'Réinitialiser découpe' : 'Reset Cut Filter'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                <button
                  onClick={() => setSelectedSubCategory('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    selectedSubCategory === 'ALL'
                      ? 'bg-[#0D3B37] text-white shadow-xs'
                      : 'bg-white border border-[#D5E1D2] text-[#4F6553] hover:bg-[#EAF1E8]'
                  }`}
                >
                  {lang === 'FR' ? 'Toutes découpes' : 'All Cuts'}
                </button>
                {ALL_SUB_CATEGORIES.map((sub) => {
                  const isSelected =
                    selectedSubCategory.toLowerCase() === sub.name.toLowerCase() ||
                    selectedSubCategory.toLowerCase() === sub.badgeLabel.toLowerCase();
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubCategory(isSelected ? 'ALL' : sub.name)}
                      className={`pl-1.5 pr-3 py-1 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all shrink-0 border ${
                        isSelected
                          ? `${sub.bgColor} ${sub.textColor} ${sub.borderColor} ring-2 ring-emerald-600/40 shadow-xs scale-102`
                          : 'bg-white border-[#D5E1D2] text-[#334D37] hover:bg-[#F2F7F1]'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-black/10 shadow-2xs">
                        <img
                          src={sub.imageUrl}
                          alt={sub.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="leading-tight text-[11px]">
                        {getSubcategoryLocalizedName(sub.badgeLabel || sub.name, lang)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Storage Location Pills & Bento View Switcher */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1 min-w-0">
                <button
                  onClick={() => setFilterLocation('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    filterLocation === 'ALL'
                      ? 'bg-[#233527] text-white shadow-xs'
                      : 'bg-white border border-[#D5E1D2] text-[#4F6553] hover:bg-[#EAF1E8]'
                  }`}
                >
                  {lang === 'FR' ? `Toutes zones (${items.length})` : `All Zones (${items.length})`}
                </button>
                <button
                  onClick={() => setFilterLocation('FRIDGE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
                    filterLocation === 'FRIDGE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-[#D5E1D2] text-[#4F6553] hover:bg-[#EAF1E8]'
                  }`}
                >
                  <Refrigerator className="w-3 h-3" />
                  {lang === 'FR' ? `Frigo (${fridgeCount})` : `Fridge (${fridgeCount})`}
                </button>
                <button
                  onClick={() => setFilterLocation('PANTRY')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
                    filterLocation === 'PANTRY'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white border border-[#D5E1D2] text-[#4F6553] hover:bg-[#EAF1E8]'
                  }`}
                >
                  <Boxes className="w-3 h-3" />
                  {lang === 'FR' ? `Garde-manger (${pantryCount})` : `Pantry (${pantryCount})`}
                </button>
                <button
                  onClick={() => setFilterLocation('FREEZER')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
                    filterLocation === 'FREEZER'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-[#D5E1D2] text-[#4F6553] hover:bg-[#EAF1E8]'
                  }`}
                >
                  <Snowflake className="w-3 h-3" />
                  {lang === 'FR' ? `Congélateur (${freezerCount})` : `Freezer (${freezerCount})`}
                </button>
                <button
                  onClick={() => setFilterLocation('EXPIRING')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
                    filterLocation === 'EXPIRING'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {lang === 'FR' ? `Bientôt (${expiringItems.length})` : `Soon (${expiringItems.length})`}
                </button>
              </div>

              {/* Bento Layout Switcher (Grid vs List) */}
              <div className="flex items-center gap-0.5 p-1 bg-white border border-[#D5E1D2] rounded-xl shrink-0 shadow-2xs">
                <button
                  onClick={() => setBentoViewMode('grid')}
                  title={lang === 'FR' ? 'Mode Grille Bento' : 'Bento Grid Mode'}
                  className={`p-1.5 rounded-lg transition-all ${
                    bentoViewMode === 'grid'
                      ? 'bg-[#233527] text-white shadow-xs'
                      : 'text-[#5C715F] hover:text-[#233527]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setBentoViewMode('list')}
                  title={lang === 'FR' ? 'Mode Liste Bento' : 'Bento List Mode'}
                  className={`p-1.5 rounded-lg transition-all ${
                    bentoViewMode === 'list'
                      ? 'bg-[#233527] text-white shadow-xs'
                      : 'text-[#5C715F] hover:text-[#233527]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inventory Items Grid or List */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-[#556D58]">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-2" />
                <span className="text-xs">
                  {lang === 'FR' ? "Chargement de l'inventaire du foyer..." : 'Loading household inventory...'}
                </span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center text-[#5D7360] bg-white rounded-3xl border border-[#D5E1D2] p-6 space-y-2">
                <Box className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-[#233527]">
                  {lang === 'FR' ? 'Aucun article ne correspond à ce filtre' : 'No items match this filter'}
                </p>
                <p className="text-xs">
                  {lang === 'FR'
                    ? "Essayez de sélectionner 'Tout' ou utilisez le bouton 'SCANNER & AJOUTER !' ci-dessous pour scanner avec l'IA Gemini !"
                    : "Try selecting 'All' or use the SNAP & ADD button below to scan groceries with Gemini Flash Vision!"}
                </p>
              </div>
            ) : bentoViewMode === 'grid' ? (
              /* BENTO BOX GRID MODE (Responsive tactile compartments) */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredItems.map((item) => {
                  const isFreezer = item.locationType === 'FREEZER';
                  const daysLeft = item.daysUntilExpiration;
                  const isSoon = item.isExpiringSoon || (daysLeft !== null && daysLeft <= 3);
                  const visual = getFoodVisual(item.name, item.categoryName);
                  const CategoryIcon = visual.icon;

                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-3xl bg-white border border-[#D5E1D2] shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
                    >
                      {/* Top Bento Image Frame with corner badges */}
                      <div
                        onClick={() => handleOpenEditModal(item)}
                        className="relative w-full h-24 rounded-2xl overflow-hidden bg-slate-100 mb-2 border border-[#E7EFE6] cursor-pointer"
                        title="Click to edit item"
                      >
                        <img
                          src={item.imageUrl || visual.defaultImage}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Top-left Category Icon Pill */}
                        <div
                          className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-lg text-[9px] font-extrabold flex items-center gap-1 backdrop-blur-md shadow-2xs border ${visual.bgColor} ${visual.textColor} ${visual.borderColor}`}
                        >
                          <CategoryIcon className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[60px]">
                            {getCategoryLocalizedName(item.categoryName, lang)}
                          </span>
                        </div>
                        {/* Top-right Location Pill */}
                        <div
                          className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-lg text-[9px] font-extrabold flex items-center gap-0.5 backdrop-blur-md shadow-2xs border ${
                            isFreezer
                              ? 'bg-blue-600/90 text-white border-blue-400'
                              : item.locationType === 'PANTRY'
                              ? 'bg-amber-600/90 text-white border-amber-400'
                              : 'bg-emerald-600/90 text-white border-emerald-500'
                          }`}
                        >
                          {isFreezer ? (
                            <Snowflake className="w-2.5 h-2.5" />
                          ) : item.locationType === 'PANTRY' ? (
                            <Boxes className="w-2.5 h-2.5" />
                          ) : (
                            <Refrigerator className="w-2.5 h-2.5" />
                          )}
                          <span>{getLocationLocalizedName(item.locationName, lang)}</span>
                        </div>
                        {/* Quantity Pill on bottom-left */}
                        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-black/65 backdrop-blur-md text-white">
                          {item.quantity} {item.unit}
                        </div>
                      </div>

                      {/* Middle Bento Title & Status */}
                      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                        <h3
                          onClick={() => handleOpenEditModal(item)}
                          className="font-bold text-xs text-[#1F3323] leading-tight line-clamp-2 cursor-pointer hover:text-teal-700 transition-colors"
                          title={lang === 'FR' ? "Cliquer pour modifier l'article" : "Click to edit item"}
                        >
                          {item.name}
                        </h3>

                        {isFreezer ? (
                          /* Freezer duration */
                          <div className="p-1.5 rounded-xl bg-[#F0F5FA] border border-[#D6E3EF] text-[10px] space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-[#2A4763]">
                              <span>
                                {item.monthsFrozen ?? 2.5}
                                {lang === 'FR' ? ' m congelé' : 'm frozen'}
                              </span>
                              <span className="text-[#5A7794] text-[9px]">
                                {item.monthsFrozenShelfLife ?? 6}
                                {lang === 'FR' ? ' m max' : 'm'}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-blue-200/60 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  (item.frozenPercentage ?? 50) >= 80 ? 'bg-amber-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(100, item.frozenPercentage ?? 50)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          /* Days left */
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 ${
                                isSoon
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-[#EDF3EC] text-[#39503D]'
                              }`}
                            >
                              <Calendar className="w-2.5 h-2.5" />
                              {daysLeft !== null
                                ? daysLeft <= 0
                                  ? lang === 'FR' ? "Aujourd'hui" : 'Today'
                                  : lang === 'FR' ? `${daysLeft}j restants` : `${daysLeft}d left`
                                : lang === 'FR' ? 'Pas de date' : 'No date'}
                            </span>

                            {item.barcode && (
                              <span
                                className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-1 py-0.5 rounded flex items-center gap-0.5 shrink-0"
                                title={`UPC: ${item.barcode}`}
                              >
                                <Barcode className="w-2.5 h-2.5 text-blue-600" />
                                {item.barcode.slice(-4)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom Bento Row: Attribution & Complete Actions */}
                      <div className="pt-2 mt-2 border-t border-[#EEF4ED] flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <img
                            src={item.addedByAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                            alt={item.addedByName}
                            className="w-4 h-4 rounded-full object-cover shrink-0"
                          />
                          <span className="text-[10px] font-bold text-[#556D58] truncate max-w-[36px]">
                            {item.addedByName || 'Yan'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAddItemToGroceryCart(item)}
                            title={t('add_to_cart_tooltip')}
                            className="p-1 bg-[#EEF4EC] hover:bg-emerald-100 text-[#355239] rounded-lg text-[9px] font-bold flex items-center transition-all active:scale-95"
                          >
                            <ShoppingCart className="w-2.5 h-2.5 text-emerald-700" />
                          </button>

                          {isFreezer && (
                            <button
                              onClick={() => handleDefrost(item)}
                              disabled={defrostingId === item.id}
                              title={t('defrost_tooltip')}
                              className="py-0.5 px-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-bold flex items-center gap-0.5 shadow-2xs active:scale-95 transition-all"
                            >
                              <Flame className="w-2.5 h-2.5 text-amber-300" />
                              <span className="text-[8px]">
                                {defrostingId === item.id ? '...' : (lang === 'FR' ? 'Décongeler' : 'Defrost')}
                              </span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title={t('edit_item_tooltip')}
                            className="p-1 bg-[#F2ECE0] hover:bg-teal-100 text-teal-800 rounded-lg text-[9px] font-bold flex items-center transition-all active:scale-95"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                          </button>

                          <button
                            onClick={() => handleConsumeItem(item)}
                            title={t('mark_consumed_tooltip')}
                            className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-bold flex items-center transition-all active:scale-95"
                          >
                            <Check className="w-2.5 h-2.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            title={t('delete_item_tooltip')}
                            className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[9px] font-bold flex items-center transition-all active:scale-95"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* BENTO BOX LIST / SLAB MODE */
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const isFreezer = item.locationType === 'FREEZER';
                  const daysLeft = item.daysUntilExpiration;
                  const isSoon = item.isExpiringSoon || (daysLeft !== null && daysLeft <= 3);
                  const visual = getFoodVisual(item.name, item.categoryName);
                  const CategoryIcon = visual.icon;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-3xl bg-white border border-[#D5E1D2] shadow-2xs hover:shadow-sm transition-all space-y-2.5"
                    >
                      {/* Top Row: Food Image/Icon + Title + Category & Location */}
                      <div className="flex items-start gap-3">
                        {/* Food Type Image & Icon Badge */}
                        <div
                          onClick={() => handleOpenEditModal(item)}
                          className="cursor-pointer"
                          title="Click to edit item"
                        >
                          <FoodVisualBadge
                            itemName={item.name}
                            categoryName={item.categoryName}
                            imageUrl={item.imageUrl}
                            size="md"
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h3
                              onClick={() => handleOpenEditModal(item)}
                              className="font-bold text-sm text-[#1F3323] truncate cursor-pointer hover:text-teal-700 transition-colors"
                              title={lang === 'FR' ? "Cliquer pour modifier l'article" : "Click to edit item"}
                            >
                              {item.name}
                            </h3>

                            {/* Storage Location Badge */}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                                isFreezer
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                  : item.locationType === 'PANTRY'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              }`}
                            >
                              {isFreezer ? (
                                <Snowflake className="w-2.5 h-2.5" />
                              ) : item.locationType === 'PANTRY' ? (
                                <Boxes className="w-2.5 h-2.5" />
                              ) : (
                                <Refrigerator className="w-2.5 h-2.5" />
                              )}
                              {getLocationLocalizedName(item.locationName, lang)}
                            </span>
                          </div>

                          {/* Food Type & Quantity Pill */}
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#EDF3EC] text-[#344837]">
                              {item.quantity} {item.unit}
                            </span>

                            {/* Food Category Tag with Icon */}
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${visual.bgColor} ${visual.textColor} ${visual.borderColor}`}
                            >
                              <CategoryIcon className="w-3 h-3" />
                              {getCategoryLocalizedName(item.categoryName, lang)}
                            </span>

                            {item.barcode && (
                              <span
                                className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-1.5 py-0.5 rounded-md flex items-center gap-1"
                                title={`UPC: ${item.barcode}`}
                              >
                                <Barcode className="w-3 h-3 text-blue-600" />
                                {item.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expiration or Freezer Metric Section */}
                      {isFreezer ? (
                        /* Freezer Duration Tracking (Months Frozen vs Shelf-Life) */
                        <div className="p-2.5 rounded-2xl bg-[#F0F5FA] border border-[#D6E3EF] space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-[#2A4763] flex items-center gap-1">
                              <Snowflake className="w-3 h-3 text-blue-500" />
                              {lang === 'FR'
                                ? `Congelé depuis ${item.monthsFrozen ?? 2.5} mois`
                                : `Frozen ${item.monthsFrozen ?? 2.5} mos`}
                            </span>
                            <span className="text-[#5A7794]">
                              {lang === 'FR'
                                ? `Max ${item.monthsFrozenShelfLife ?? 6} mois conseillé`
                                : `Max ${item.monthsFrozenShelfLife ?? 6} mos safe`}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-blue-200/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                (item.frozenPercentage ?? 50) >= 80 ? 'bg-amber-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(100, item.frozenPercentage ?? 50)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        /* Chilled / Pantry Shelf-Life Alert */
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 ${
                              isSoon
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-[#EDF3EC] text-[#39503D]'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {daysLeft !== null
                              ? daysLeft <= 0
                                ? lang === 'FR' ? "Expiré aujourd'hui" : 'Expired today'
                                : lang === 'FR'
                                ? `Expire dans ${daysLeft} jour${daysLeft === 1 ? '' : 's'}`
                                : `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
                              : lang === 'FR' ? 'Aucune date définie' : 'No expiration set'}
                          </span>

                          {item.notes && (
                            <span className="text-[11px] text-[#697F6C] truncate max-w-[170px] italic">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bottom Row: Household Attribution Badge ("by Yan" / "by Kriz") & Actions */}
                      <div className="pt-2 border-t border-[#EEF4ED] flex items-center justify-between">
                        {/* Attribution Badge */}
                        <div className="flex items-center gap-1.5">
                          <img
                            src={item.addedByAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                            alt={item.addedByName}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="text-[11px] font-bold text-[#556D58]">
                            {lang === 'FR' ? 'par' : 'by'} {item.addedByName || 'Yan'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAddItemToGroceryCart(item)}
                            title={t('add_to_cart_tooltip')}
                            className="py-1 px-2 bg-[#EEF4EC] hover:bg-emerald-100 text-[#355239] rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                          >
                            <ShoppingCart className="w-3 h-3 text-emerald-700" />
                            <span>{lang === 'FR' ? '+Panier' : '+Cart'}</span>
                          </button>

                          {/* Defrost Button for Freezer items */}
                          {isFreezer && (
                            <button
                              onClick={() => handleDefrost(item)}
                              disabled={defrostingId === item.id}
                              title={t('defrost_tooltip')}
                              className="py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95"
                            >
                              <Flame className="w-3 h-3 text-amber-300" />
                              <span>
                                {defrostingId === item.id
                                  ? '...'
                                  : lang === 'FR'
                                  ? 'Décongeler'
                                  : 'Defrost'}
                              </span>
                            </button>
                          )}

                          {/* Edit Item */}
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title={t('edit_item_tooltip')}
                            className="py-1 px-2 bg-[#F2ECE0] hover:bg-teal-100 text-teal-800 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{lang === 'FR' ? 'Modifier' : 'Edit'}</span>
                          </button>

                          {/* Mark Consumed */}
                          <button
                            onClick={() => handleConsumeItem(item)}
                            title={t('mark_consumed_tooltip')}
                            className="py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[11px] font-bold flex items-center gap-0.5 transition-all active:scale-95"
                          >
                            <Check className="w-3 h-3" />
                          </button>

                          {/* Delete Item */}
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            title={t('delete_item_tooltip')}
                            className="py-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-bold flex items-center gap-0.5 transition-all active:scale-95"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* VIEW: GROCERY LIST */}
        {activeNav === 'grocery' && (
          <GroceryListView
            expiringItems={expiringItems}
            currentUser={currentUser}
            onStockItemsToKitchen={handleStockItemsToKitchen}
            groceryItems={groceryItems}
            onUpdateGroceryItems={setGroceryItems}
            onSwitchToInventory={() => setActiveNav('home')}
          />
        )}

        {/* VIEW: MEAL PLANNER & CALENDAR */}
        {activeNav === 'meals' && (
          <MealPlannerView
            householdId="hh_yan_kriz_01"
            items={items}
            plannedMeals={plannedMeals}
            onAddMeal={handleAddMeal}
            onUpdateMeal={handleUpdateMeal}
            onDeleteMeal={handleDeleteMeal}
            onAddIngredientsToGrocery={(ingredients) => {
              ingredients.forEach((ing) => {
                setGroceryItems((prev) => [
                  {
                    id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    name: ing.name,
                    category: ing.category || 'Pantry Staples',
                    quantity: ing.quantity || 1,
                    unit: ing.unit || 'item',
                    locationType: 'FRIDGE',
                    inCart: true,
                    notes: lang === 'FR' ? 'Du plan de repas' : 'From Meal Plan',
                  },
                  ...prev,
                ]);
              });
              setBannerNotice(
                lang === 'FR'
                  ? `🛒 ${ingredients.length} ingrédients ajoutés à votre panier !`
                  : `🛒 Added ${ingredients.length} ingredients to your grocery cart!`
              );
              setTimeout(() => setBannerNotice(null), 3500);
            }}
            onOpenRecipes={() => setActiveNav('cooking')}
          />
        )}

        {/* VIEW: COOKING IDEAS */}
        {activeNav === 'cooking' && (
          <CookingIdeasView
            items={items}
            onAddMissingToGrocery={(missing) => {
              setGroceryItems((prev) => [
                {
                  id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  name: missing.name,
                  category: missing.category || 'Produce',
                  quantity: missing.quantity || 1,
                  unit: missing.unit || 'item',
                  locationType: missing.locationType || 'FRIDGE',
                  inCart: false,
                  notes: missing.recipeTitle
                    ? lang === 'FR'
                      ? `Pour : ${missing.recipeTitle}`
                      : `For: ${missing.recipeTitle}`
                    : undefined,
                },
                ...prev,
              ]);
              setBannerNotice(
                lang === 'FR'
                  ? `🛒 "${missing.name}" ajouté à votre liste de courses !`
                  : `🛒 Added "${missing.name}" to your grocery list!`
              );
              setTimeout(() => setBannerNotice(null), 3000);
            }}
          />
        )}

        {/* VIEW: FAMILY SYNC */}
        {activeNav === 'sync' && (
          <FamilySyncView
            currentUser={currentUser}
            onSwitchUser={setCurrentUser}
            members={MOCK_MEMBERS}
          />
        )}
      </div>

      {/* Floating Action Buttons ("+ ADD ITEM" and "SNAP & ADD!") - Screen size responsive */}
      <div className="fixed sm:absolute bottom-20 md:bottom-6 inset-x-0 md:inset-x-auto md:right-8 flex justify-center md:justify-end items-center pointer-events-none z-30">
        <div className="flex items-center gap-2 pointer-events-auto bg-[#0A3834]/95 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-teal-500/40">
          <button
            id="floating-manual-add-btn"
            onClick={handleOpenAddModal}
            className="px-3.5 py-2.5 rounded-full bg-teal-800 hover:bg-teal-700 text-white font-extrabold text-[11px] tracking-wider flex items-center gap-1.5 shadow-xs hover:scale-105 active:scale-95 transition-all"
            title={t('quick_add_tooltip')}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'FR' ? '+ AJOUTER' : '+ ADD ITEM'}</span>
          </button>
          <button
            id="floating-snap-add-btn"
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 rounded-full bg-[#0E766E] hover:bg-[#0B5C56] text-white font-extrabold text-[11px] tracking-wider flex items-center gap-1.5 shadow-xs hover:scale-105 active:scale-95 transition-all"
            title={lang === 'FR' ? "Scanner l'article avec la caméra" : "Scan item with camera"}
          >
            <Camera className="w-3.5 h-3.5 text-teal-300" />
            <span>{lang === 'FR' ? 'SCANNER & AJOUTER !' : 'SNAP & ADD!'}</span>
          </button>
        </div>
      </div>

      {/* Mobile-Only Bottom Navigation Bar (automatically hidden on tablet/desktop screens md and up) */}
      <div className="fixed sm:absolute bottom-0 inset-x-0 h-16 bg-[#FAF7EE]/95 backdrop-blur-md border-t border-[#E5DFD0] px-3 flex md:hidden items-center justify-around z-20">
        <button
          onClick={() => setActiveNav('home')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
            activeNav === 'home' ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>{t('nav_inventory')}</span>
        </button>

        <button
          onClick={() => setActiveNav('meals')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors relative ${
            activeNav === 'meals' ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <CalendarDays className="w-4 h-4" />
            {plannedMeals.length > 0 && (
              <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                {plannedMeals.length}
              </span>
            )}
          </div>
          <span>{t('nav_meals')}</span>
        </button>

        <button
          onClick={() => setActiveNav('grocery')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors relative ${
            activeNav === 'grocery' ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-4 h-4" />
            {groceryItems.filter((i) => i.inCart).length > 0 && (
              <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 bg-teal-700 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                {groceryItems.filter((i) => i.inCart).length}
              </span>
            )}
          </div>
          <span>{t('nav_grocery')}</span>
        </button>

        <button
          onClick={() => setActiveNav('cooking')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
            activeNav === 'cooking' ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>{t('nav_cooking')}</span>
        </button>

        <button
          onClick={() => setActiveNav('sync')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors ${
            activeNav === 'sync' ? 'text-teal-700' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('nav_family')}</span>
        </button>
      </div>

      {/* Vision Scanner Modal */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onItemAdded={handleItemAdded}
        currentUser={currentUser}
        onOpenManualAdd={handleOpenAddModal}
      />

      {/* Manual Add & Edit Item Modal */}
      <AddEditItemModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setItemToEdit(null);
        }}
        itemToEdit={itemToEdit}
        currentUser={currentUser}
        onSaved={handleItemSaved}
        onDeleted={(itemId) => {
          setItems((prev) => prev.filter((i) => i.id !== itemId));
          setBannerNotice(lang === 'FR' ? "Article supprimé de l'inventaire." : 'Item deleted from inventory.');
          setTimeout(() => setBannerNotice(null), 3000);
        }}
      />
    </div>
  );
};
