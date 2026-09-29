import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
  FileText,
  X,
  LogOut,
  Info,
} from 'lucide-react';
import { InventoryItem, User, PlannedMeal, StorageType } from '../types';
import { FoodVisualBadge } from './FoodVisualBadge';
import { InventoryListItem } from './InventoryListItem';
import { getFoodVisual, ALL_FOOD_CATEGORIES, ALL_SUB_CATEGORIES, ALL_MEAT_SEAFOOD_SUBCATEGORIES } from '../utils/foodVisuals';
import { deductRecipeFromInventory } from '../utils/recipeCooker';
import { CameraScannerModal } from './CameraScannerModal';
import { AddEditItemModal } from './AddEditItemModal';
import { ImportLeftoverModal } from './ImportLeftoverModal';
import { GroceryListView, GroceryCartItem } from './GroceryListView';
import { CookingIdeasView } from './CookingIdeasView';
import { FamilySyncView } from './FamilySyncView';
import { MealPlannerView } from './MealPlannerView';
import { PantryoLogo } from './PantryoLogo';
import { ScrollableRow } from './ScrollableRow';
import { AdminManagementModal } from './AdminManagementModal';
import { AdminRestrictedModal } from './AdminRestrictedModal';
import { LoginSplash } from './LoginSplash';
import { ChangeAvatarModal } from './ChangeAvatarModal';
import { AddRecipeModal } from './AddRecipeModal';
import { isAppInstalledOrStandalone } from '../utils/installStatus';
import {
  useLanguage,
  LanguageSwitcher,
  getCategoryLocalizedName,
  getSubcategoryLocalizedName,
  getLocationLocalizedName,
} from '../utils/i18n';

const INITIAL_GROCERY_ITEMS: GroceryCartItem[] = [];

const LOCAL_STORAGE_MEMBERS_KEY = 'kitchen_komrade_household_members';
const LOCAL_STORAGE_ACTIVE_USER_ID = 'pantryo_active_user_id';

// Default household members for Pantryo
const DEFAULT_MEMBERS: User[] = [
  {
    id: 'usr_yan',
    name: 'Yan',
    email: 'yjsboily@gmail.com',
    role: 'ADMIN',
    avatarUrl: '/avatars/chef-cat.svg',
    fido2Enabled: false,
    fido2Enforced: false,
    isCompliant: true,
    requiresEnrollment: false,
    mustChangePassword: false,
    mustSetupProfile: false,
    isDefaultAdmin: false,
  },
  {
    id: 'usr_kriz',
    name: 'Kriz',
    email: 'kriz@home.local',
    role: 'MEMBER',
    avatarUrl: '/avatars/av-female-1.svg',
    fido2Enabled: false,
    fido2Enforced: false,
    isCompliant: true,
    requiresEnrollment: false,
    mustChangePassword: false,
    mustSetupProfile: false,
    isDefaultAdmin: false,
  },
];

function getStoredMembers(): User[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed reading household members from localStorage:', e);
  }
  return DEFAULT_MEMBERS;
}

function getInitialActiveUser(members: User[]): User {
  try {
    const savedId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_USER_ID);
    if (savedId) {
      const found = members.find((m) => m.id === savedId);
      if (found) return found;
    }
  } catch (e) {
    console.error('Failed reading active user from localStorage:', e);
  }
  return members[0] || DEFAULT_MEMBERS[0];
}

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
  const isInstalledEffective = Boolean(isInstalled || isAppInstalledOrStandalone());

  // Direct camera input for recipe scanning (triggers native camera app immediately)
  const directRecipeCamInputRef = useRef<HTMLInputElement | null>(null);
  const [isRecipeAddModalOpen, setIsRecipeAddModalOpen] = useState(false);
  const [recipeScanPhoto, setRecipeScanPhoto] = useState<string | null>(null);

  const handleOpenRecipeCameraScan = () => {
    setIsAddMenuOpen(false);
    setRecipeScanPhoto(null);
    if (directRecipeCamInputRef.current) {
      directRecipeCamInputRef.current.click();
    } else {
      setIsRecipeAddModalOpen(true);
    }
  };

  const handleRecipePhotoCaptured = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 2000;
        let { width, height } = img;
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
        const compressed = ctx
          ? (() => {
              ctx.drawImage(img, 0, 0, width, height);
              return canvas.toDataURL('image/jpeg', 0.9);
            })()
          : dataUrl;

        setRecipeScanPhoto(compressed);
        setIsRecipeAddModalOpen(true);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const [activeNav, setActiveNav] = useState<'home' | 'meals' | 'grocery' | 'cooking' | 'sync'>('home');
  const [filterLocation, setFilterLocation] = useState<'ALL' | 'FRIDGE' | 'PANTRY' | 'FREEZER' | 'EXPIRING'>('ALL');
  const [selectedFoodType, setSelectedFoodType] = useState<string | 'ALL'>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [householdMembers, setHouseholdMembers] = useState<User[]>(getStoredMembers);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const list = getStoredMembers();
    return getInitialActiveUser(list);
  });

  // When installed, preserve household session and ensure seamless continuity
  useEffect(() => {
    if (isInstalledEffective) {
      try {
        localStorage.setItem('pantryo_pwa_installed', 'true');
        const active = currentUser || householdMembers[0] || DEFAULT_MEMBERS[0];
        if (active) {
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_ID, active.id);
          if (!currentUser) {
            setCurrentUser(active);
          }
        }
      } catch (e) {
        console.warn('Error saving installed state:', e);
      }
    }
  }, [isInstalledEffective, currentUser, householdMembers]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_ID, user.id);
    } catch (e) {
      console.error('Failed saving active user:', e);
    }
    setBannerNotice(
      lang === 'FR'
        ? `Bienvenue, ${user.name} !`
        : `Welcome back, ${user.name}!`
    );
    setTimeout(() => setBannerNotice(null), 3000);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_USER_ID);
      localStorage.removeItem('pantryo_auth_token');
    } catch (e) {
      console.error('Failed clearing active user:', e);
    }
  };

  const handleUpdateMember = (updatedUser: User) => {
    setHouseholdMembers((prev) => {
      const updatedList = prev.map((m) => (m.id === updatedUser.id ? updatedUser : m));
      try {
        localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(updatedList));
      } catch (e) {
        console.error('Failed saving members to localStorage:', e);
      }
      return updatedList;
    });

    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }

    // Persist avatar or user changes to server if avatarUrl is provided
    if (updatedUser.avatarUrl) {
      fetch(`/api/v1/admin/users/${encodeURIComponent(updatedUser.id)}/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: updatedUser.avatarUrl }),
      }).catch((err) => {
        console.warn('Could not persist avatar to server:', err);
      });
    }
  };
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInitialMode, setScannerInitialMode] = useState<'snap' | 'receipt' | 'barcode' | 'upload' | 'presets'>('snap');
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminRestrictedOpen, setIsAdminRestrictedOpen] = useState(false);
  const [isImportLeftoverOpen, setIsImportLeftoverOpen] = useState(false);
  const [selectedMealForLeftover, setSelectedMealForLeftover] = useState<PlannedMeal | null>(null);
  const [filterLeftoversOnly, setFilterLeftoversOnly] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);
  const [defrostingId, setDefrostingId] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [bentoViewMode, setBentoViewMode] = useState<'grid' | 'list'>('list');
  const [isBentoCompact, setIsBentoCompact] = useState<boolean>(true);
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

  // Kitchen Name State (customizable in app or .env)
  const [kitchenName, setKitchenName] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('kitchen_komrade_kitchen_name');
      if (stored) return stored;
    } catch (_) {}
    return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KITCHEN_NAME) || 'The Yan & Kriz Kitchen';
  });
  // Multi-Selection State & Actions
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkConsuming, setIsBulkConsuming] = useState(false);

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const visibleIds = filteredItems.map((i) => i.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedItemIds.has(id));
    if (allSelected) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(visibleIds));
    }
  };

  const handleDeselectAll = () => {
    setSelectedItemIds(new Set());
  };

  const handleBulkConsume = async () => {
    if (selectedItemIds.size === 0) return;
    setIsBulkConsuming(true);
    const idsArray = Array.from(selectedItemIds);
    try {
      const res = await fetch('/api/v1/inventory/bulk-consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIds: idsArray,
          userId: currentUser?.id || 'usr_yan',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => !selectedItemIds.has(i.id)));
        setBannerNotice(
          lang === 'FR'
            ? `✨ ${idsArray.length} article(s) marqué(s) comme utilisé(s) / consommé(s) !`
            : `✨ Marked ${idsArray.length} item(s) as used/consumed!`
        );
        setTimeout(() => setBannerNotice(null), 3500);
        setSelectedItemIds(new Set());
      }
    } catch (err) {
      console.error('Bulk consume failed:', err);
    } finally {
      setIsBulkConsuming(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItemIds.size === 0) return;
    setIsBulkDeleting(true);
    const idsArray = Array.from(selectedItemIds);
    try {
      const res = await fetch('/api/v1/inventory/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemIds: idsArray,
          userId: currentUser?.id || 'usr_yan',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => !selectedItemIds.has(i.id)));
        setBannerNotice(
          lang === 'FR'
            ? `🗑️ ${idsArray.length} article(s) retiré(s) de l'inventaire.`
            : `🗑️ Removed ${idsArray.length} item(s) from inventory.`
        );
        setTimeout(() => setBannerNotice(null), 3500);
        setSelectedItemIds(new Set());
        setShowBulkDeleteConfirm(false);
      }
    } catch (err) {
      console.error('Bulk delete failed:', err);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    try {
      const res = await fetch(`/api/v1/admin/users/${encodeURIComponent(userToDelete.id)}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': currentUser?.role || 'ADMIN',
          'x-user-id': currentUser?.id || 'usr_yan',
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete user');
      }

      const data = await res.json();
      const updatedMembers = data.users || householdMembers.filter((m) => m.id !== userToDelete.id);
      setHouseholdMembers(updatedMembers);
      try {
        localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(updatedMembers));
      } catch (_) {}

      // If active user was deleted, switch to next admin/member
      if (currentUser?.id === userToDelete.id) {
        const nextUser = updatedMembers.find((m: User) => m.role === 'ADMIN') || updatedMembers[0] || DEFAULT_MEMBERS[0];
        setCurrentUser(nextUser);
        try {
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_ID, nextUser.id);
        } catch (_) {}
      }

      setBannerNotice(
        lang === 'FR'
          ? `Membre "${userToDelete.name}" supprimé avec succès.`
          : `Member "${userToDelete.name}" successfully deleted.`
      );
      setTimeout(() => setBannerNotice(null), 3500);
    } catch (e: any) {
      console.error('Error deleting user:', e);
      setBannerNotice(`❌ ${e.message}`);
      setTimeout(() => setBannerNotice(null), 4000);
    }
  };

  const handleCookMealAndDeduct = async (meal: PlannedMeal) => {
    const willBeCooked = !meal.isCooked;
    await handleUpdateMeal(meal.id, { isCooked: willBeCooked });

    if (willBeCooked && meal.ingredients && meal.ingredients.length > 0) {
      const outcome = deductRecipeFromInventory(
        meal.ingredients,
        items,
        meal.title
      );

      for (const update of outcome.itemsToUpdate) {
        fetch(`/api/v1/inventory/item/${encodeURIComponent(update.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantity: update.quantity,
            unit: update.unit,
            notes: update.notes,
            userId: currentUser?.id || 'usr_yan',
          }),
        }).catch((e) => console.warn('Item partial update failed:', e));
      }

      for (const deleteId of outcome.itemsToDelete) {
        fetch(`/api/v1/inventory/item/${encodeURIComponent(deleteId)}`, {
          method: 'DELETE',
        }).catch((e) => console.warn('Item deletion failed:', e));
      }

      setItems(outcome.updatedInventory);

      if (outcome.deductions.length > 0) {
        const deductionSummary = outcome.deductions
          .map((d) =>
            d.wasFullyDepleted
              ? `${d.inventoryItemName} (${lang === 'FR' ? 'épuisé' : 'depleted'})`
              : `${d.inventoryItemName} (${d.remainingQuantity} ${d.remainingUnit} ${lang === 'FR' ? 'restant' : 'left'})`
          )
          .join(', ');

        setBannerNotice(
          lang === 'FR'
            ? `🍳 Recette cuisinée ! Ingrédients déduits : ${deductionSummary}`
            : `🍳 Recipe cooked! Ingredients deducted: ${deductionSummary}`
        );
      } else {
        setBannerNotice(
          lang === 'FR'
            ? `🎉 Repas "${meal.title}" marqué cuisiné !`
            : `🎉 Meal "${meal.title}" marked cooked!`
        );
      }
      setTimeout(() => setBannerNotice(null), 5000);
    } else {
      setBannerNotice(
        willBeCooked
          ? (lang === 'FR' ? '🎉 Repas marqué cuisiné !' : '🎉 Meal marked cooked!')
          : (lang === 'FR' ? 'Marqué comme prévu' : 'Marked as planned')
      );
      setTimeout(() => setBannerNotice(null), 3000);
    }
  };

  const handleCookRecipeDirectly = async (recipe: {
    title: string;
    ingredients: Array<{ name: string; amount?: string; nameFr?: string; quantity?: number; unit?: string }>;
  }) => {
    const outcome = deductRecipeFromInventory(
      recipe.ingredients,
      items,
      recipe.title
    );

    for (const update of outcome.itemsToUpdate) {
      fetch(`/api/v1/inventory/item/${encodeURIComponent(update.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: update.quantity,
          unit: update.unit,
          notes: update.notes,
          userId: currentUser?.id || 'usr_yan',
        }),
      }).catch((e) => console.warn('Item partial update failed:', e));
    }

    for (const deleteId of outcome.itemsToDelete) {
      fetch(`/api/v1/inventory/item/${encodeURIComponent(deleteId)}`, {
        method: 'DELETE',
      }).catch((e) => console.warn('Item deletion failed:', e));
    }

    setItems(outcome.updatedInventory);

    if (outcome.deductions.length > 0) {
      const deductionSummary = outcome.deductions
        .map((d) =>
          d.wasFullyDepleted
            ? `${d.inventoryItemName} (${lang === 'FR' ? 'épuisé' : 'depleted'})`
            : `${d.inventoryItemName} (${d.remainingQuantity} ${d.remainingUnit} ${lang === 'FR' ? 'restant' : 'left'})`
        )
        .join(', ');

      setBannerNotice(
        lang === 'FR'
          ? `🍳 Cuisiné avec succès ! Ingrédients déduits : ${deductionSummary}`
          : `🍳 Successfully cooked! Ingredients deducted: ${deductionSummary}`
      );
    } else {
      setBannerNotice(
        lang === 'FR'
          ? `🍳 Cuisiné ! Aucun ingrédient de votre cuisine n'a été déduit.`
          : `🍳 Cooked! No matching kitchen ingredients to deduct.`
      );
    }
    setTimeout(() => setBannerNotice(null), 5000);
  };

  const toggleExpandItem = (id: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  const [groceryItems, setGroceryItems] = useState<GroceryCartItem[]>(INITIAL_GROCERY_ITEMS);

  // Stock items from the Grocery Shopping Cart into Kitchen Inventory
  const handleStockItemsToKitchen = async (
    itemsToAdd: Array<{
      name: string;
      quantity: number;
      unit: string;
      locationType: StorageType;
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
          userId: currentUser?.id || 'default-user',
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
            ? `Réapprovisionnement demandé par ${currentUser?.name || 'Yan'}`
            : `Restock requested by ${currentUser?.name || 'Yan'}`,
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
      const res = await fetch('/api/v1/inventory/household/hh_yan_kriz_01', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          if (data.allItems) {
            setItems(data.allItems);
          }
          if (data.household?.name) {
            setKitchenName(data.household.name);
            try {
              localStorage.setItem('kitchen_komrade_kitchen_name', data.household.name);
            } catch (_) {}
          }
        }
      }
    } catch (err) {
      console.warn('Note: Inventory using local initial state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch planned meals for household
  const fetchPlannedMeals = async () => {
    try {
      const res = await fetch('/api/v1/inventory/household/hh_yan_kriz_01/meals', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.meals) {
          setPlannedMeals(data.meals);
        }
      }
    } catch (err) {
      console.warn('Note: Planned meals using local initial state:', err);
    }
  };

  // Fetch household users from server
  const fetchHouseholdMembers = async () => {
    try {
      const res = await fetch('/api/v1/admin/users');
      if (res.ok) {
        const users = await res.json();
        if (Array.isArray(users) && users.length > 0) {
          setHouseholdMembers(users);
          try {
            localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(users));
          } catch (e) {}
          // If current user is updated, sync it
          if (currentUser) {
            const found = users.find((u: User) => u.id === currentUser.id);
            if (found) setCurrentUser(found);
          }
        }
      }
    } catch (e) {
      console.warn('Failed fetching users from server:', e);
    }
  };

  useEffect(() => {
    fetchHouseholdMembers();
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
          userId: currentUser?.id || 'default-user',
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
        body: JSON.stringify({ userId: currentUser?.id || 'default-user' }),
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

    // Leftovers only filter
    if (filterLeftoversOnly && !item.isLeftover) {
      return false;
    }

    return true;
  });

  const expiringItems = items.filter((i) => i.isExpiringSoon || (i.daysUntilExpiration !== null && i.daysUntilExpiration <= 3));
  const fridgeCount = items.filter((i) => i.locationType === 'FRIDGE').length;
  const pantryCount = items.filter((i) => i.locationType === 'PANTRY').length;
  const freezerCount = items.filter((i) => i.locationType === 'FREEZER').length;
  const leftoversCount = items.filter((i) => i.isLeftover).length;

  if (!currentUser) {
    return (
      <LoginSplash
        onLoginSuccess={handleLogin}
        householdMembers={householdMembers}
        onMembersUpdated={(updatedList) => {
          setHouseholdMembers(updatedList);
          try {
            localStorage.setItem(LOCAL_STORAGE_MEMBERS_KEY, JSON.stringify(updatedList));
          } catch (e) {}
        }}
        isInstalled={isInstalledEffective}
      />
    );
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto text-[#133E3B] flex flex-col min-h-screen sm:min-h-[850px] sm:rounded-3xl border-0 sm:border sm:border-[#E5DFD0] sm:shadow-lg bg-[#FAF7EE] overflow-hidden">
      {/* App Top Bar - Ultra-compact, spacious on tablet and desktop, zero overlapping or text-wrapping */}
      <div className="px-3 sm:px-5 py-1.5 sm:py-2.5 pt-[max(0.5rem,env(safe-area-inset-top,0px))] bg-[#FAF7EE] border-b border-[#E8E2D5] shrink-0">
        <div className="flex items-center justify-between gap-2 lg:gap-4 max-w-7xl mx-auto w-full">
          {/* 1. Left: Logo (Admin Console Trigger) & Kitchen Name Customizer */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="btn-pantryo-admin-management"
              onClick={() => {
                if (currentUser.role === 'ADMIN') {
                  setIsAdminModalOpen(true);
                } else {
                  setIsAdminRestrictedOpen(true);
                }
              }}
              className="flex items-center gap-1.5 sm:gap-2 shrink-0 hover:opacity-90 active:scale-98 transition-all cursor-pointer p-1 -m-1 rounded-2xl hover:bg-[#F2ECE0]/60 group text-left"
              title={
                currentUser.role === 'ADMIN'
                  ? lang === 'FR'
                    ? 'Ouvrir la Console d’Administration & Sauvegarde (Admin)'
                    : 'Open App & Database Administration (Admin)'
                  : lang === 'FR'
                  ? 'Console Pantryo (Accès Administrateur requis)'
                  : 'Pantryo Console (Admin Access Required)'
              }
            >
              <div className="shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
                <PantryoLogo size={28} />
              </div>
              <div className="shrink-0">
                <div className="flex items-center gap-1">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-[#0D3B37] leading-none whitespace-nowrap">
                    Pantryo
                  </h1>
                  {currentUser.role === 'ADMIN' ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span className="hidden xs:inline">Admin</span>
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse shrink-0" />
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* 2. Center: Navigation Bar (shown on md+ screens, centered, zero wrapping, responsive labels) */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-0.5 lg:gap-1 p-1 bg-white/95 rounded-2xl border border-[#E0D9C8] shadow-2xs shrink-0">
            {/* Inventory */}
            <button
              onClick={() => setActiveNav('home')}
              title={t('nav_inventory')}
              className={`px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                activeNav === 'home'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-[#527470] hover:text-[#0D3B37] hover:bg-[#F2ECE0]'
              }`}
            >
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span className={activeNav === 'home' ? 'inline' : 'hidden lg:inline'}>
                {t('nav_inventory')}
              </span>
            </button>

            {/* Meals */}
            <button
              onClick={() => setActiveNav('meals')}
              title={t('nav_meals')}
              className={`px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                activeNav === 'meals'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-[#527470] hover:text-[#0D3B37] hover:bg-[#F2ECE0]'
              }`}
            >
              <CalendarDays className={`w-3.5 h-3.5 shrink-0 ${activeNav === 'meals' ? 'text-white' : 'text-indigo-500'}`} />
              <span className={activeNav === 'meals' ? 'inline' : 'hidden lg:inline'}>
                {lang === 'FR' ? 'Repas' : 'Meals'}
              </span>
              {plannedMeals.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black shrink-0 ${
                  activeNav === 'meals' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {plannedMeals.length}
                </span>
              )}
            </button>

            {/* Grocery */}
            <button
              onClick={() => setActiveNav('grocery')}
              title={t('nav_grocery')}
              className={`px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                activeNav === 'grocery'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-[#527470] hover:text-[#0D3B37] hover:bg-[#F2ECE0]'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              <span className={activeNav === 'grocery' ? 'inline' : 'hidden lg:inline'}>
                {lang === 'FR' ? 'Épicerie' : 'Grocery'}
              </span>
              {groceryItems.filter((i) => i.inCart).length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black shrink-0 ${
                  activeNav === 'grocery' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-900'
                }`}>
                  {groceryItems.filter((i) => i.inCart).length}
                </span>
              )}
            </button>

            {/* Cooking */}
            <button
              onClick={() => setActiveNav('cooking')}
              title={t('nav_cooking')}
              className={`px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                activeNav === 'cooking'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-[#527470] hover:text-[#0D3B37] hover:bg-[#F2ECE0]'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 shrink-0" />
              <span className={activeNav === 'cooking' ? 'inline' : 'hidden lg:inline'}>
                {t('nav_cooking')}
              </span>
            </button>

            {/* Family */}
            <button
              onClick={() => setActiveNav('sync')}
              title={t('nav_family')}
              className={`px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                activeNav === 'sync'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-[#527470] hover:text-[#0D3B37] hover:bg-[#F2ECE0]'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className={activeNav === 'sync' ? 'inline' : 'hidden lg:inline'}>
                {t('nav_family')}
              </span>
            </button>
          </nav>

          {/* 3. Right: Top Actions (Quick Add + Language + Install + User, strictly shrink-0) */}
          <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
            {/* Quick Add Button on tablet and desktop */}
            <button
              type="button"
              onClick={() => setIsAddMenuOpen(true)}
              className="hidden md:flex items-center gap-1 p-1.5 lg:px-2.5 lg:py-1.5 rounded-xl bg-gradient-to-r from-[#0D3B37] to-[#0E766E] hover:from-[#092926] hover:to-[#0B5C56] text-white text-xs font-bold shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
              title={lang === 'FR' ? 'Ajouter un aliment' : 'Add food item'}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden lg:inline">{lang === 'FR' ? 'Ajout' : 'Add'}</span>
            </button>

            {/* Unified Single Language Toggle (e.g. FR when in English, EN when in French) */}
            <LanguageSwitcher />

            {/* Install Button */}
            {!isInstalledEffective && onInstall && (
              <button
                type="button"
                onClick={onInstall}
                className="px-2.5 py-1.5 rounded-xl bg-[#0E766E] hover:bg-[#0B5C56] text-white text-xs font-bold shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
                title={t('install_tooltip')}
              >
                <Download className="w-3.5 h-3.5 text-teal-200" />
                <span className="font-bold text-[11px] sm:text-xs">{t('install_btn')}</span>
              </button>
            )}

            {/* User Pill: Clicking opens Family & Profile */}
            <div className={`flex items-center gap-1 border rounded-xl p-1 lg:px-2 lg:py-1 shadow-2xs shrink-0 transition-colors ${
              activeNav === 'sync' ? 'bg-teal-700 border-teal-800 text-white' : 'bg-white/95 border-[#E0D9C8] text-[#0D3B37]'
            }`}>
              <button
                type="button"
                onClick={() => setActiveNav(activeNav === 'sync' ? 'home' : 'sync')}
                className="relative group/avatar cursor-pointer shrink-0"
                title={lang === 'FR' ? 'Famille & Profil' : 'Family & Profile'}
              >
                <img
                  src={currentUser.avatarUrl || '/avatars/chef-cat.svg'}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover shrink-0 border border-teal-600/30 group-hover/avatar:opacity-80 transition-opacity"
                />
              </button>
              <button
                type="button"
                onClick={() => setActiveNav(activeNav === 'sync' ? 'home' : 'sync')}
                className={`text-xs font-bold transition-colors cursor-pointer px-1 flex items-center gap-1 ${
                  activeNav === 'sync' ? 'text-white' : 'text-[#0D3B37] hover:text-teal-800'
                }`}
                title={currentUser.name}
              >
                <span className="truncate max-w-[70px] sm:max-w-[110px]">{currentUser.name}</span>
                <Users className="w-3 h-3 opacity-70 hidden sm:inline" />
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl border border-[#E0D9C8] bg-white/80 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-[#527470] shadow-2xs transition-colors shrink-0 cursor-pointer"
              title={lang === 'FR' ? 'Déconnexion' : 'Log out'}
            >
              <LogOut className="w-4 h-4" />
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
      <div className="flex-1 overflow-y-auto px-3 sm:px-5 pt-1.5 pb-32 md:pb-12 space-y-2.5 sm:space-y-3.5">
        {/* VIEW: HOME INVENTORY */}
        {activeNav === 'home' && (
          <>
            {/* HERO BENTO BOX DASHBOARD - Space maximized for mobile & tablet */}
            {isBentoCompact ? (
              <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-[#E5DFD0] shadow-2xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-800 border border-teal-100 flex items-center justify-center shrink-0">
                      <Leaf className="w-3.5 h-3.5 text-teal-700" />
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs font-black text-[#0D3B37] truncate">
                        {lang === 'FR' ? '96% Zéro-Gaspillage' : '96% Zero-Waste'}
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                        {t('live_sync')}
                      </span>
                    </div>
                  </div>

                  {/* Toggle to view detailed tiles */}
                  <button
                    type="button"
                    onClick={() => setIsBentoCompact(false)}
                    className="px-2.5 py-1 rounded-xl bg-[#F7FAF9] border border-[#D5E1D2] hover:bg-[#EBF3F1] text-[11px] font-bold text-[#0D3B37] flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
                    title={lang === 'FR' ? 'Afficher les cartes détaillées' : 'Show detailed bento cards'}
                  >
                    <span>{lang === 'FR' ? 'Détails' : 'Details'}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Compact Location Quick Pills */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterLocation(filterLocation === 'FRIDGE' ? 'ALL' : 'FRIDGE')}
                    className={`py-1.5 px-1.5 sm:px-2 rounded-xl text-center border transition-all cursor-pointer ${
                      filterLocation === 'FRIDGE'
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-[#F7FAF9] border-[#E0ECE8] text-[#244E49] hover:bg-[#EBF3F1]'
                    }`}
                  >
                    <span className="text-[10px] font-semibold block opacity-85 truncate">
                      {lang === 'FR' ? 'Frigo' : 'Fridge'}
                    </span>
                    <span className="text-xs font-black block leading-tight">{fridgeCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterLocation(filterLocation === 'FREEZER' ? 'ALL' : 'FREEZER')}
                    className={`py-1.5 px-1.5 sm:px-2 rounded-xl text-center border transition-all cursor-pointer ${
                      filterLocation === 'FREEZER'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-[#F0F6FA] border-[#D7E6F2] text-[#244563] hover:bg-[#E4F0F9]'
                    }`}
                  >
                    <span className="text-[10px] font-semibold block opacity-85 truncate">
                      {lang === 'FR' ? 'Congélo' : 'Freezer'}
                    </span>
                    <span className="text-xs font-black block leading-tight">{freezerCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterLocation(filterLocation === 'PANTRY' ? 'ALL' : 'PANTRY')}
                    className={`py-1.5 px-1.5 sm:px-2 rounded-xl text-center border transition-all cursor-pointer ${
                      filterLocation === 'PANTRY'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-[#FAF6EE] border-[#EFE5D0] text-[#544122] hover:bg-[#F5EDDC]'
                    }`}
                  >
                    <span className="text-[10px] font-semibold block opacity-85 truncate">
                      {lang === 'FR' ? 'Garde-m.' : 'Pantry'}
                    </span>
                    <span className="text-xs font-black block leading-tight">{pantryCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterLocation(filterLocation === 'EXPIRING' ? 'ALL' : 'EXPIRING')}
                    className={`py-1.5 px-1.5 sm:px-2 rounded-xl text-center border transition-all cursor-pointer ${
                      filterLocation === 'EXPIRING'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : expiringItems.length > 0
                        ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                        : 'bg-white border-[#E0D9C8] text-[#527470]'
                    }`}
                  >
                    <span className="text-[10px] font-semibold block opacity-85 truncate">
                      {lang === 'FR' ? 'Bientôt' : 'Soon'}
                    </span>
                    <span className="text-xs font-black block leading-tight">{expiringItems.length}</span>
                  </button>
                </div>

                {/* 1-Line Urgent Rescue strip if items expiring */}
                {expiringItems.length > 0 && (
                  <div
                    onClick={() => setFilterLocation('EXPIRING')}
                    className="p-1.5 px-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-900 flex items-center justify-between text-[11px] font-medium cursor-pointer hover:bg-rose-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="font-bold text-rose-800 shrink-0">
                        {expiringItems.length} {lang === 'FR' ? 'à sauver :' : 'to rescue:'}
                      </span>
                      <span className="truncate">{expiringItems[0]?.name}</span>
                      <span className="text-[10px] text-rose-700 font-bold shrink-0">
                        ({expiringItems[0]?.daysUntilExpiration} {lang === 'FR' ? 'j' : 'd'})
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-700 shrink-0 ml-1">→</span>
                  </div>
                )}
              </div>
            ) : (
              /* DETAILED BENTO BOX DASHBOARD (EXPANDED VIEW) */
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#527470]">
                    {t('bento_pulse_title')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBentoCompact(true)}
                    className="px-2.5 py-1 rounded-xl bg-white border border-[#D5E1D2] hover:bg-[#F2ECE0] text-[11px] font-bold text-[#0D3B37] flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                    title={lang === 'FR' ? 'Mode compact pour maximiser l’espace' : 'Compact mode to maximize space'}
                  >
                    <span>{lang === 'FR' ? 'Réduire' : 'Compact'}</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {/* Bento Tile 1 (Span 2): Kitchen Bento Pulse & Zone Breakdown */}
                  <div className="col-span-2 lg:col-span-2 p-3 rounded-2xl bg-white border border-[#E5DFD0] shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-800 border border-teal-100 flex items-center justify-center shadow-xs">
                          <Leaf className="w-3.5 h-3.5 text-teal-700" />
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
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-[#F2ECE0]">
                      <button
                        type="button"
                        onClick={() => setFilterLocation(filterLocation === 'FRIDGE' ? 'ALL' : 'FRIDGE')}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
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
                        type="button"
                        onClick={() => setFilterLocation(filterLocation === 'FREEZER' ? 'ALL' : 'FREEZER')}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
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
                        type="button"
                        onClick={() => setFilterLocation(filterLocation === 'PANTRY' ? 'ALL' : 'PANTRY')}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
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
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      expiringItems.length > 0
                        ? 'bg-gradient-to-b from-rose-50 to-amber-50/40 border-rose-200 hover:border-rose-300 shadow-2xs'
                        : 'bg-white border-[#D5E1D2] shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
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
                    className="p-3 rounded-2xl bg-gradient-to-b from-blue-50/70 to-white border border-blue-200/80 hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
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
              </div>
            )}

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
                <span className="flex items-center gap-2 flex-wrap">
                  <span>{t('browse_by_category')}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({ALL_FOOD_CATEGORIES.length} {lang === 'FR' ? 'types' : 'types'})
                  </span>
                  {leftoversCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterLeftoversOnly(!filterLeftoversOnly)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all border flex items-center gap-1 cursor-pointer ${
                        filterLeftoversOnly
                          ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                          : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                      }`}
                      title={lang === 'FR' ? 'Filtrer uniquement les restes' : 'Filter leftovers only'}
                    >
                      <span>🍲</span>
                      <span>{lang === 'FR' ? 'Restes' : 'Leftovers'} ({leftoversCount})</span>
                      {filterLeftoversOnly && <X className="w-2.5 h-2.5 ml-0.5" />}
                    </button>
                  )}
                </span>
                {(selectedFoodType !== 'ALL' || filterLeftoversOnly) && (
                  <button
                    onClick={() => {
                      setSelectedFoodType('ALL');
                      setFilterLeftoversOnly(false);
                    }}
                    className="text-emerald-700 hover:underline font-semibold text-[11px]"
                  >
                    {t('clear_filter')}
                  </button>
                )}
              </div>

              <ScrollableRow className="pb-1.5">
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
              </ScrollableRow>
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

              <ScrollableRow className="pb-1.5">
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
              </ScrollableRow>
            </div>

            {/* Storage Location Pills & Bento View Switcher */}
            <div className="flex items-center justify-between gap-2">
              <ScrollableRow containerClassName="flex-1 min-w-0" className="pb-1">
                <button
                  onClick={() => setFilterLocation('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    filterLocation === 'ALL'
                      ? 'bg-[#233527] text-white shadow-xs'
                      : 'bg-white border border-[#D5E1D2] text-[#4F6553] hover:bg-[#EAF1E8]'
                  }`}
                >
                  {lang === 'FR' ? `Toutes zones (${items.length})` : `All Zones (${items.length})`}
                </button>
                <button
                  onClick={() => setFilterLocation('FRIDGE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all shrink-0 ${
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all shrink-0 ${
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all shrink-0 ${
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all shrink-0 ${
                    filterLocation === 'EXPIRING'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {lang === 'FR' ? `Bientôt (${expiringItems.length})` : `Soon (${expiringItems.length})`}
                </button>
              </ScrollableRow>

              {/* Multi-selection toggle & Bento Layout Switcher */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                    selectedItemIds.size > 0
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white border-[#D5E1D2] text-[#4F6553] hover:bg-[#EAF1E8]'
                  }`}
                  title={
                    filteredItems.length > 0 && filteredItems.every((i) => selectedItemIds.has(i.id))
                      ? (lang === 'FR' ? 'Tout désélectionner' : 'Deselect All')
                      : (lang === 'FR' ? 'Tout sélectionner' : 'Select All')
                  }
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">
                    {selectedItemIds.size > 0
                      ? `(${selectedItemIds.size})`
                      : lang === 'FR'
                      ? 'Sélectionner'
                      : 'Select'}
                  </span>
                </button>

                <div className="flex items-center gap-0.5 p-1 bg-white border border-[#D5E1D2] rounded-xl shadow-2xs">
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
                      className={`p-2.5 rounded-3xl bg-white transition-all flex flex-col justify-between group relative border ${
                        selectedItemIds.has(item.id)
                          ? 'border-teal-600 ring-2 ring-teal-600/40 shadow-sm bg-teal-50/10'
                          : 'border-[#D5E1D2] shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      {/* Top Bento Image Frame with corner badges */}
                      <div
                        onClick={() => handleOpenEditModal(item)}
                        className="relative w-full h-24 rounded-2xl overflow-hidden bg-slate-100 mb-2 border border-[#E7EFE6] cursor-pointer"
                        title="Click to edit item"
                      >
                        {/* Multi-selection Checkbox button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectItem(item.id);
                          }}
                          className={`absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                            selectedItemIds.has(item.id)
                              ? 'bg-teal-700 border-teal-700 text-white'
                              : 'bg-white/90 backdrop-blur-xs border-slate-300 hover:border-teal-600 text-transparent hover:text-slate-400'
                          }`}
                          title={
                            lang === 'FR'
                              ? selectedItemIds.has(item.id)
                                ? 'Désélectionner'
                                : 'Sélectionner'
                              : selectedItemIds.has(item.id)
                              ? 'Deselect'
                              : 'Select'
                          }
                        >
                          <Check
                            className={`w-3.5 h-3.5 stroke-[3] ${
                              selectedItemIds.has(item.id)
                                ? 'text-white'
                                : 'opacity-0 hover:opacity-50 text-slate-600'
                            }`}
                          />
                        </button>
                        <img
                          src={item.imageUrl || visual.defaultImage}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Top-left Category Icon Pill (offset right from checkbox) */}
                        <div
                          className={`absolute top-1.5 left-9 px-1.5 py-0.5 rounded-lg text-[9px] font-extrabold flex items-center gap-1 backdrop-blur-md shadow-2xs border ${visual.bgColor} ${visual.textColor} ${visual.borderColor}`}
                        >
                          <CategoryIcon className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[55px]">
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
                            src={item.addedByAvatar || '/avatars/chef-cat.svg'}
                            alt={item.addedByName}
                            referrerPolicy="no-referrer"
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
              /* BENTO BOX LIST / SLAB MODE (Compact rows expandable on click) */
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <InventoryListItem
                    key={item.id}
                    item={item}
                    isExpanded={expandedItemIds.has(item.id)}
                    onToggleExpand={() => toggleExpandItem(item.id)}
                    isSelected={selectedItemIds.has(item.id)}
                    onToggleSelect={() => toggleSelectItem(item.id)}
                    onConsume={handleConsumeItem}
                    onDelete={handleDeleteItem}
                    onEdit={handleOpenEditModal}
                    onAddToCart={handleAddItemToGroceryCart}
                    onDefrost={handleDefrost}
                    isDefrosting={defrostingId === item.id}
                    lang={lang}
                  />
                ))}
              </div>
            )}

            {/* FLOATING BATCH ACTION BAR (When items are selected) */}
            {selectedItemIds.size > 0 && (
              <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg bg-teal-950/95 backdrop-blur-md text-white rounded-2xl px-4 py-3 shadow-2xl border border-teal-700 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedItemIds.size}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate">
                      {lang === 'FR'
                        ? `${selectedItemIds.size} article(s) sélectionné(s)`
                        : `${selectedItemIds.size} item(s) selected`}
                    </p>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[10px] text-teal-300 hover:text-white underline cursor-pointer truncate block text-left"
                    >
                      {filteredItems.length > 0 && filteredItems.every((i) => selectedItemIds.has(i.id))
                        ? (lang === 'FR' ? 'Tout désélectionner' : 'Deselect all')
                        : (lang === 'FR' ? `Tout sélectionner (${filteredItems.length})` : `Select all (${filteredItems.length})`)}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Bulk Use / Consume */}
                  <button
                    type="button"
                    onClick={handleBulkConsume}
                    disabled={isBulkConsuming}
                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer disabled:opacity-50"
                    title={lang === 'FR' ? 'Marquer comme utilisé / consommé' : 'Mark as used / consumed'}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{isBulkConsuming ? '...' : (lang === 'FR' ? 'Utiliser' : 'Use')}</span>
                  </button>

                  {/* Bulk Delete */}
                  <button
                    type="button"
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    disabled={isBulkDeleting}
                    className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-xs cursor-pointer disabled:opacity-50"
                    title={lang === 'FR' ? 'Supprimer de l’inventaire' : 'Delete from inventory'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isBulkDeleting ? '...' : (lang === 'FR' ? 'Supprimer' : 'Delete')}</span>
                  </button>

                  {/* Cancel / Deselect */}
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="p-1.5 rounded-xl bg-teal-900 hover:bg-teal-800 text-teal-200 hover:text-white transition-colors cursor-pointer"
                    title={lang === 'FR' ? 'Annuler' : 'Cancel'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
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
            onOpenReceiptScanner={() => {
              setScannerInitialMode('receipt');
              setIsScannerOpen(true);
            }}
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
            onCookMeal={handleCookMealAndDeduct}
            onAddIngredientsToGrocery={(ingredients) => {
              ingredients.forEach((ing) => {
                setGroceryItems((prev) => [
                  {
                    id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    name: ing.name,
                    category: ing.category || 'Pantry Staples',
                    quantity: ing.quantity || 1,
                    unit: ing.unit || 'pcs',
                    locationType: 'FRIDGE',
                    inCart: false,
                    notes: lang === 'FR' ? 'Du plan de repas' : 'From Meal Plan',
                  },
                  ...prev,
                ]);
              });
              setBannerNotice(
                lang === 'FR'
                  ? `🛒 ${ingredients.length} ingrédients ajoutés à votre liste d'épicerie !`
                  : `🛒 Added ${ingredients.length} ingredients to your grocery list!`
              );
              setTimeout(() => setBannerNotice(null), 3500);
            }}
            onNavigateToGrocery={() => setActiveNav('grocery')}
            onOpenRecipes={() => setActiveNav('cooking')}
          />
        )}

        {/* VIEW: COOKING IDEAS */}
        {activeNav === 'cooking' && (
          <CookingIdeasView
            items={items}
            onPlanMeal={handleAddMeal}
            onNavigateToMealPlanner={() => setActiveNav('meals')}
            onCookRecipe={handleCookRecipeDirectly}
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
            members={householdMembers}
            onUpdateMember={handleUpdateMember}
            onLogout={handleLogout}
            onInstall={onInstall}
            isInstalled={isInstalledEffective}
            kitchenName={kitchenName}
            onDeleteMember={handleDeleteUser}
            onOpenAdmin={() => {
              if (currentUser.role === 'ADMIN') {
                setIsAdminModalOpen(true);
              } else {
                setIsAdminRestrictedOpen(true);
              }
            }}
          />
        )}
      </div>

      {/* Quick Add Action Menu (Full Screen with Exit Button) */}
      {isAddMenuOpen && (
        <div className="fixed inset-0 z-50 bg-[#FAF7EE] flex flex-col w-full h-full overflow-hidden text-[#133E3B] animate-fade-in">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-[#E8E2D5] flex items-center justify-between bg-white/90 backdrop-blur-xs shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center shadow-xs">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-[#0D3B37] leading-tight">
                  {lang === 'FR' ? 'Ajouter à la cuisine' : 'Add to Kitchen'}
                </h2>
                <p className="text-[11px] text-[#527470]">
                  {lang === 'FR' ? 'Choisissez le mode d’ajout souhaité' : 'Choose how you want to add items'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddMenuOpen(false)}
              className="px-3.5 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              title={lang === 'FR' ? 'Quitter' : 'Exit'}
            >
              <X className="w-4 h-4" />
              <span>{lang === 'FR' ? 'Quitter' : 'Exit'}</span>
            </button>
          </div>

          {/* Options in Full-Screen View */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 max-w-lg mx-auto w-full flex flex-col justify-center space-y-4">
            {/* Option 1: Manual Add */}
            <button
              type="button"
              onClick={() => {
                setIsAddMenuOpen(false);
                handleOpenAddModal();
              }}
              className="w-full p-4 rounded-3xl bg-white hover:bg-[#F6F2E8] border-2 border-[#E5DFD0] hover:border-teal-400 flex items-center gap-4 text-left transition-all active:scale-[0.98] shadow-xs group"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-700 group-hover:bg-teal-800 text-white flex items-center justify-center shadow-xs shrink-0 transition-colors">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-[#0D3B37]">
                  {lang === 'FR' ? 'Saisie manuelle' : 'Manual Add'}
                </p>
                <p className="text-xs text-[#527470]">
                  {lang === 'FR' ? 'Entrez le nom, la quantité, le lieu de stockage et la date' : 'Name, quantity, compartment, and expiry date'}
                </p>
              </div>
            </button>

            {/* Option 2: Camera Photo Scan */}
            <button
              type="button"
              onClick={() => {
                setIsAddMenuOpen(false);
                setScannerInitialMode('snap');
                setIsScannerOpen(true);
              }}
              className="w-full p-4 rounded-3xl bg-white hover:bg-[#F6F2E8] border-2 border-[#E5DFD0] hover:border-teal-400 flex items-center gap-4 text-left transition-all active:scale-[0.98] shadow-xs group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0E766E] group-hover:bg-[#0B5C56] text-white flex items-center justify-center shadow-xs shrink-0 transition-colors">
                <Camera className="w-6 h-6 text-teal-200" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-[#0D3B37]">
                  {lang === 'FR' ? 'Scanner un aliment par photo' : 'Scan Item (Camera)'}
                </p>
                <p className="text-xs text-[#527470]">
                  {lang === 'FR' ? 'Prenez des photos en rafale, l’ajout continue en arrière-plan' : 'Continuous background scanning as you take pictures'}
                </p>
              </div>
            </button>

            {/* Option 3: Receipt Scan */}
            <button
              type="button"
              onClick={() => {
                setIsAddMenuOpen(false);
                setScannerInitialMode('receipt');
                setIsScannerOpen(true);
              }}
              className="w-full p-4 rounded-3xl bg-white hover:bg-[#F6F2E8] border-2 border-[#E5DFD0] hover:border-amber-400 flex items-center gap-4 text-left transition-all active:scale-[0.98] shadow-xs group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-600 group-hover:bg-amber-700 text-white flex items-center justify-center shadow-xs shrink-0 transition-colors">
                <FileText className="w-6 h-6 text-amber-200" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-[#0D3B37]">
                  {lang === 'FR' ? 'Scanner un reçu d’épicerie' : 'Scan Grocery Receipt'}
                </p>
                <p className="text-xs text-[#527470]">
                  {lang === 'FR' ? 'Numérisez votre facture Maxi, IGA, Métro ou Costco' : 'OCR scan for Maxi, IGA, Metro, Costco receipt'}
                </p>
              </div>
            </button>

            {/* Option 4: Scan Written Recipe (Camera / OCR) */}
            <button
              type="button"
              onClick={handleOpenRecipeCameraScan}
              className="w-full p-4 rounded-3xl bg-white hover:bg-[#F6F2E8] border-2 border-[#E5DFD0] hover:border-emerald-500 flex items-center gap-4 text-left transition-all active:scale-[0.98] shadow-xs group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-700 group-hover:bg-emerald-800 text-white flex items-center justify-center shadow-xs shrink-0 transition-colors">
                <ChefHat className="w-6 h-6 text-emerald-100" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-[#0D3B37]">
                  {lang === 'FR' ? 'Scanner une recette écrite' : 'Scan Written Recipe'}
                </p>
                <p className="text-xs text-[#527470]">
                  {lang === 'FR'
                    ? 'Prenez en photo une fiche manuscrite ou un livre de cuisine'
                    : 'Photograph a handwritten card or cookbook page'}
                </p>
              </div>
            </button>

            {/* Option 4: Leftovers & Prepared Foods (Health Canada & European Standards) */}
            <button
              type="button"
              id="add-kitchen-leftovers-option"
              onClick={() => {
                setIsAddMenuOpen(false);
                setSelectedMealForLeftover(null);
                setIsImportLeftoverOpen(true);
              }}
              className="w-full p-4 rounded-3xl bg-white hover:bg-[#FDF7ED] border-2 border-[#E5DFD0] hover:border-amber-500 flex items-center gap-4 text-left transition-all active:scale-[0.98] shadow-xs group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#C25E00] group-hover:bg-[#A34E00] text-white flex items-center justify-center shadow-xs shrink-0 transition-colors">
                <Utensils className="w-6 h-6 text-amber-100" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-extrabold text-[#0D3B37]">
                    {lang === 'FR' ? 'Restes & Plats préparés' : 'Leftovers & Prepared Foods'}
                  </p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                    {lang === 'FR' ? '🇨🇦 Canada & 🇪🇺 UE' : '🇨🇦 Canada & 🇪🇺 EU'}
                  </span>
                </div>
                <p className="text-xs text-[#527470] mt-0.5">
                  {lang === 'FR'
                    ? 'Souper de ce soir, fête philippine (lechon, riz...), ou plats enregistrés'
                    : 'Tonight’s dinner, Filipino party (lechon, rice...), or saved items'}
                </p>
              </div>
            </button>

            {/* Option 5: Family & Profile Settings */}
            <button
              type="button"
              onClick={() => {
                setIsAddMenuOpen(false);
                setActiveNav('sync');
              }}
              className="w-full p-4 rounded-3xl bg-white hover:bg-[#F2ECE0] border-2 border-[#E5DFD0] hover:border-teal-500 flex items-center gap-4 text-left transition-all active:scale-[0.98] shadow-xs group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-800 group-hover:bg-teal-900 text-white flex items-center justify-center shadow-xs shrink-0 transition-colors">
                <Users className="w-6 h-6 text-teal-200" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-[#0D3B37]">
                  {lang === 'FR' ? 'Famille, Profil & Rôles' : 'Family, Profile & Roles'}
                </p>
                <p className="text-xs text-[#527470]">
                  {lang === 'FR' ? 'Changer d\'utilisateur, journal d\'audit et sécurité' : 'Switch household members, audit log & security'}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar with Perfectly Centered Raised Add Button (2 tabs left, 2 tabs right) */}
      <nav
        aria-label="Bottom Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 bg-[#FAF7EE]/95 backdrop-blur-md border-t border-[#E5DFD0] pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] px-2 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      >
        <div className="w-full max-w-lg mx-auto flex items-end justify-between">
          {/* Tab 1: Inventory (Left 1) */}
          <button
            type="button"
            onClick={() => {
              setIsAddMenuOpen(false);
              setActiveNav('home');
            }}
            className={`min-w-0 flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
              activeNav === 'home' ? 'text-[#0D3B37]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${activeNav === 'home' ? 'bg-teal-100/80 text-[#0D3B37]' : ''}`}>
              <Home className="w-5 h-5 shrink-0" />
            </div>
            <span className={`text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-full text-center ${
              activeNav === 'home' ? 'font-black text-[#0D3B37]' : 'font-semibold text-slate-400'
            }`}>
              {t('bottom_home')}
            </span>
          </button>

          {/* Tab 2: Meals (Left 2) */}
          <button
            type="button"
            onClick={() => {
              setIsAddMenuOpen(false);
              setActiveNav('meals');
            }}
            className={`min-w-0 flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
              activeNav === 'meals' ? 'text-[#0D3B37]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className="relative">
              <div className={`p-1 rounded-xl transition-colors ${activeNav === 'meals' ? 'bg-teal-100/80 text-[#0D3B37]' : ''}`}>
                <CalendarDays className="w-5 h-5 shrink-0" />
              </div>
              {plannedMeals.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                  {plannedMeals.length}
                </span>
              )}
            </div>
            <span className={`text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-full text-center ${
              activeNav === 'meals' ? 'font-black text-[#0D3B37]' : 'font-semibold text-slate-400'
            }`}>
              {t('bottom_meals')}
            </span>
          </button>

          {/* EXACT CENTER: Integrated Raised Add Button with + icon */}
          <div className="flex flex-col items-center justify-center px-2 shrink-0 relative">
            <button
              id="bottom-center-add-btn"
              type="button"
              onClick={() => setIsAddMenuOpen((prev) => !prev)}
              className={`w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-[#0D3B37] via-[#0E766E] to-teal-500 text-white flex items-center justify-center shadow-lg border-[3.5px] border-[#FAF7EE] active:scale-90 transition-all duration-300 hover:scale-105 cursor-pointer ${
                isAddMenuOpen ? 'rotate-45 scale-105 ring-4 ring-teal-500/40' : ''
              }`}
              aria-label={lang === 'FR' ? 'Ajouter un aliment' : 'Add Item'}
              title={lang === 'FR' ? 'Ajouter un aliment' : 'Add Item'}
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
            <span className="text-[10px] font-black text-[#0D3B37] mt-0.5 tracking-tight leading-tight">
              {lang === 'FR' ? 'Ajout' : 'Add'}
            </span>
          </div>

          {/* Tab 3: Grocery (Right 1) */}
          <button
            type="button"
            onClick={() => {
              setIsAddMenuOpen(false);
              setActiveNav('grocery');
            }}
            className={`min-w-0 flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
              activeNav === 'grocery' ? 'text-[#0D3B37]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className="relative">
              <div className={`p-1 rounded-xl transition-colors ${activeNav === 'grocery' ? 'bg-teal-100/80 text-[#0D3B37]' : ''}`}>
                <ShoppingCart className="w-5 h-5 shrink-0" />
              </div>
              {groceryItems.filter((i) => i.inCart).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-700 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                  {groceryItems.filter((i) => i.inCart).length}
                </span>
              )}
            </div>
            <span className={`text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-full text-center ${
              activeNav === 'grocery' ? 'font-black text-[#0D3B37]' : 'font-semibold text-slate-400'
            }`}>
              {t('bottom_grocery')}
            </span>
          </button>

          {/* Tab 4: Cooking Ideas (Right 2) */}
          <button
            type="button"
            onClick={() => {
              setIsAddMenuOpen(false);
              setActiveNav('cooking');
            }}
            className={`min-w-0 flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
              activeNav === 'cooking' ? 'text-[#0D3B37]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl transition-colors ${activeNav === 'cooking' ? 'bg-teal-100/80 text-[#0D3B37]' : ''}`}>
              <ChefHat className="w-5 h-5 shrink-0" />
            </div>
            <span className={`text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-full text-center ${
              activeNav === 'cooking' ? 'font-black text-[#0D3B37]' : 'font-semibold text-slate-400'
            }`}>
              {t('bottom_cooking')}
            </span>
          </button>
        </div>
      </nav>

      {/* Vision Scanner Modal */}
      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onItemAdded={handleItemAdded}
        currentUser={currentUser}
        onOpenManualAdd={handleOpenAddModal}
        initialMode={scannerInitialMode}
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

      {/* Import Leftovers Modal with Smart Expiration */}
      <ImportLeftoverModal
        isOpen={isImportLeftoverOpen}
        onClose={() => {
          setIsImportLeftoverOpen(false);
          setSelectedMealForLeftover(null);
        }}
        currentUser={currentUser}
        plannedMeals={plannedMeals}
        initialMeal={selectedMealForLeftover}
        lang={lang}
        onLeftoversImported={(newItems) => {
          setItems((prev) => {
            const newIds = new Set(newItems.map((i) => i.id));
            return [...newItems, ...prev.filter((i) => !newIds.has(i.id))];
          });
          const count = newItems.length;
          const names = newItems.map((i) => i.name).slice(0, 2).join(', ');
          const more = count > 2 ? ` (+${count - 2})` : '';
          setBannerNotice(
            lang === 'FR'
              ? `🍲 ${count} plat(s) de restes (${names}${more}) ajouté(s) à la cuisine ! Normes Santé Canada & UE appliquées.`
              : `🍲 ${count} leftover dish(es) (${names}${more}) added to Kitchen! Canadian & EU safety standards applied.`
          );
          setTimeout(() => setBannerNotice(null), 5500);
        }}
      />

      {/* Admin App & Database Management Modal */}
      <AdminManagementModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          fetchInventory();
        }}
        currentUser={currentUser}
        onUserChange={(newUser) => {
          setCurrentUser(newUser);
          setBannerNotice(
            lang === 'FR'
              ? `Session basculée sur ${newUser.name} (${newUser.role})`
              : `Switched active session to ${newUser.name} (${newUser.role})`
          );
          setTimeout(() => setBannerNotice(null), 3500);
        }}
        onDatabaseRestored={async () => {
          await fetchInventory();
          setBannerNotice(
            lang === 'FR'
              ? 'Base de données restaurée et synchronisée avec succès !'
              : 'Database restored and synchronized successfully!'
          );
          setTimeout(() => setBannerNotice(null), 4000);
        }}
      />

      {/* Admin Restricted Notice Modal */}
      <AdminRestrictedModal
        isOpen={isAdminRestrictedOpen}
        onClose={() => setIsAdminRestrictedOpen(false)}
        currentUser={currentUser}
        adminUser={householdMembers.find((m) => m.role === 'ADMIN') || householdMembers[0]}
        isInstalled={isInstalledEffective}
        onSwitchToAdmin={() => {
          const admin = householdMembers.find((m) => m.role === 'ADMIN') || householdMembers[0];
          setCurrentUser(admin);
          setIsAdminRestrictedOpen(false);
          setIsAdminModalOpen(true);
          setBannerNotice(
            lang === 'FR'
              ? `Connecté en tant qu’administrateur (${admin.name})`
              : `Logged in as administrator (${admin.name})`
          );
          setTimeout(() => setBannerNotice(null), 3500);
        }}
      />

      {/* Direct User Avatar Change Modal */}
      {isAvatarModalOpen && currentUser && (
        <ChangeAvatarModal
          isOpen={isAvatarModalOpen}
          user={currentUser}
          onClose={() => setIsAvatarModalOpen(false)}
          onSaveAvatar={(newAvatarUrl) => {
            const updatedUser: User = {
              ...currentUser,
              avatarUrl: newAvatarUrl,
            };
            handleUpdateMember(updatedUser);
            setIsAvatarModalOpen(false);
            setBannerNotice(
              lang === 'FR'
                ? 'Photo de profil mise à jour avec succès !'
                : 'Profile picture updated successfully!'
            );
            setTimeout(() => setBannerNotice(null), 3500);
          }}
        />
      )}

      {/* Dedicated native camera input for recipe scanning */}
      <input
        type="file"
        ref={directRecipeCamInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleRecipePhotoCaptured}
        className="hidden"
      />

      {/* Full-screen Recipe Review & Save Modal from Camera Scanner */}
      <AddRecipeModal
        isOpen={isRecipeAddModalOpen}
        onClose={() => {
          setIsRecipeAddModalOpen(false);
          setRecipeScanPhoto(null);
        }}
        onRecipeSaved={(newRecipe) => {
          setIsRecipeAddModalOpen(false);
          setRecipeScanPhoto(null);
          setActiveNav('cooking');
          setBannerNotice(
            lang === 'FR'
              ? `✓ Recette enregistrée : ${newRecipe.titleFr || newRecipe.title}`
              : `✓ Recipe saved: ${newRecipe.title}`
          );
          setTimeout(() => setBannerNotice(null), 4000);
        }}
        lang={lang}
        initialTab="photo"
        initialPhotoBase64={recipeScanPhoto}
      />

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#D5E1D2] max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {lang === 'FR'
                    ? `Supprimer ${selectedItemIds.size} article(s) ?`
                    : `Delete ${selectedItemIds.size} item(s)?`}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'FR'
                    ? 'Cette action retirera ces articles de votre inventaire.'
                    : 'This action will permanently remove these items from your inventory.'}
                </p>
              </div>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              {items
                .filter((item) => selectedItemIds.has(item.id))
                .map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-slate-700 py-0.5">
                    <span className="truncate font-semibold">{item.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                {lang === 'FR' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition-colors active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBulkDeleting ? '...' : (lang === 'FR' ? 'Confirmer' : 'Delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
