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
import { ActiveCookingBar } from './ActiveCookingBar';
import { GuidedCookingModal } from './GuidedCookingModal';
import { useCookingSession } from '../contexts/CookingSessionContext';
import { isAppInstalledOrStandalone } from '../utils/installStatus';
import {
  useLanguage,
  LanguageSwitcher,
  getCategoryLocalizedName,
  getSubcategoryLocalizedName,
  getLocationLocalizedName,
} from '../utils/i18n';
import { getItemDisplayName, formatLocalizedQuantityUnit } from '../utils/foodTranslator';

const INITIAL_GROCERY_ITEMS: GroceryCartItem[] = [];

const LOCAL_STORAGE_MEMBERS_KEY = 'kitchen_komrade_household_members';
const LOCAL_STORAGE_ACTIVE_USER_ID = 'pantryo_active_user_id';

// Default household members for Pantryo (Initial install: Administrator only)
const DEFAULT_MEMBERS: User[] = [
  {
    id: 'usr_admin',
    name: 'Admin',
    email: 'admin@example.com',
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
];

function getStoredMembers(): User[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MEMBERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Clean out any invalid members
        const cleaned = parsed.filter((u: any) => u && u.id);
        if (cleaned.length > 0) {
          return cleaned;
        }
      }
    }
  } catch (e) {
    console.error('Failed reading household members from localStorage:', e);
  }
  return DEFAULT_MEMBERS;
}

function getInitialActiveUser(members: User[]): User | null {
  try {
    const savedId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_USER_ID);
    const token = localStorage.getItem('pantryo_auth_token');
    if (savedId && token) {
      const found = members.find((m) => m.id === savedId);
      if (found) return found;
    }
  } catch (e) {
    console.error('Failed reading active user from localStorage:', e);
  }
  return null;
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

  // Global Cooking Session & Background Timer
  const {
    activeRecipe: sessionActiveRecipe,
    isOpen: isSessionCookingOpen,
    minimizeCooking,
    exitCooking,
    handlers: sessionHandlers,
  } = useCookingSession();

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
  const [filterLocation, setFilterLocation] = useState<'ALL' | 'FRIDGE' | 'PANTRY' | 'FREEZER' | 'SPICE_RACK' | 'EXPIRING'>('ALL');
  const [modalDefaultLocation, setModalDefaultLocation] = useState<'FRIDGE' | 'FREEZER' | 'PANTRY' | 'SPICE_RACK' | undefined>(undefined);
  const [selectedFoodType, setSelectedFoodType] = useState<string | 'ALL'>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [householdMembers, setHouseholdMembers] = useState<User[]>(getStoredMembers);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const list = getStoredMembers();
    return getInitialActiveUser(list);
  });

  // When installed, preserve household session only if user is actively authenticated
  useEffect(() => {
    if (isInstalledEffective && currentUser) {
      try {
        localStorage.setItem('pantryo_pwa_installed', 'true');
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER_ID, currentUser.id);
      } catch (e) {
        console.warn('Error saving installed state:', e);
      }
    }
  }, [isInstalledEffective, currentUser]);

  // Validate active session token against server on initial mount
  useEffect(() => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('pantryo_auth_token') : null;
    const savedId = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_ACTIVE_USER_ID) : null;

    if (token && savedId) {
      fetch('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-auth-token': token,
        },
      })
        .then((res) => {
          if (!res.ok) {
            console.warn('[Pantryo Auth] Saved session token invalid or expired. Prompting sign in.');
            localStorage.removeItem(LOCAL_STORAGE_ACTIVE_USER_ID);
            localStorage.removeItem('pantryo_auth_token');
            setCurrentUser(null);
          } else {
            res.json().then((data) => {
              if (data?.user) {
                setCurrentUser((prev) => (prev ? { ...prev, ...data.user } : data.user));
              }
            });
          }
        })
        .catch((err) => {
          console.warn('[Pantryo Auth] Offline session check note:', err);
        });
    } else if (!token && currentUser) {
      setCurrentUser(null);
    }
  }, []);

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
  const [scannerInitialMode, setScannerInitialMode] = useState<'snap' | 'receipt' | 'barcode' | 'upload' | 'presets' | 'produce' | 'flyer'>('snap');
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminModalInitialTab, setAdminModalInitialTab] = useState<'backup' | 'users' | 'security' | 'settings'>('backup');
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
      if (stored && (stored.includes('Yan') || stored.includes('Kriz'))) {
        localStorage.removeItem('kitchen_komrade_kitchen_name');
      } else if (stored) {
        return stored;
      }
    } catch (_) {}
    return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_KITCHEN_NAME) || 'Your Kitchen';
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
          userId: currentUser?.id || 'usr_admin',
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
          userId: currentUser?.id || 'usr_admin',
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
          'x-user-id': currentUser?.id || 'usr_admin',
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
            userId: currentUser?.id || 'usr_admin',
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
          userId: currentUser?.id || 'usr_admin',
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
    return outcome;
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
            ? `Réapprovisionnement demandé par ${currentUser?.name || 'Admin'}`
            : `Restock requested by ${currentUser?.name || 'Admin'}`,
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
      const res = await fetch('/api/v1/inventory/household/hh_pantryo_main', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          if (data.allItems) {
            setItems(data.allItems);
          }
          if (data.household?.name) {
            const cleanKitchen =
              data.household.name.includes('Yan') || data.household.name.includes('Kriz')
                ? 'Your Kitchen'
                : data.household.name;
            setKitchenName(cleanKitchen);
            try {
              localStorage.setItem('kitchen_komrade_kitchen_name', cleanKitchen);
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
      const res = await fetch('/api/v1/inventory/household/hh_pantryo_main/meals', {
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
      const res = await fetch('/api/v1/inventory/household/hh_pantryo_main/meals', {
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

  const handleOpenAddModal = (prefLoc?: 'FRIDGE' | 'FREEZER' | 'PANTRY' | 'SPICE_RACK' | React.MouseEvent) => {
    setItemToEdit(null);
    const isExplicitLoc =
      typeof prefLoc === 'string' && ['FRIDGE', 'FREEZER', 'PANTRY', 'SPICE_RACK'].includes(prefLoc);
    const targetLoc = isExplicitLoc
      ? (prefLoc as 'FRIDGE' | 'FREEZER' | 'PANTRY' | 'SPICE_RACK')
      : filterLocation === 'SPICE_RACK'
      ? 'SPICE_RACK'
      : filterLocation === 'FREEZER'
      ? 'FREEZER'
      : filterLocation === 'PANTRY'
      ? 'PANTRY'
      : filterLocation === 'FRIDGE'
      ? 'FRIDGE'
      : undefined;
    setModalDefaultLocation(targetLoc);
    setIsAddEditModalOpen(true);
  };

  const handleQuickAddSpiceToInventory = async (spiceEn: string, spiceFr: string) => {
    if (!currentUser) return;
    const chosenName = lang === 'FR' ? spiceFr : spiceEn;
    const twoYearsFromNow = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const payload = {
      name: chosenName,
      nameFr: spiceFr,
      nameEn: spiceEn,
      quantity: 1,
      unit: 'pot',
      locationName: 'Spice Rack',
      locationType: 'SPICE_RACK' as StorageType,
      categoryName: 'Spices & Seasonings',
      expirationDate: twoYearsFromNow,
      notes: lang === 'FR' ? 'Ajouté depuis la section Épices' : 'Added from Spices section',
    };

    try {
      const res = await fetch('/api/v1/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('pantryo_auth_token') || ''}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.item) {
          setItems((prev) => [data.item, ...prev]);
          setBannerNotice(
            lang === 'FR'
              ? `🧂 "${chosenName}" ajouté à votre armoire à épices !`
              : `🧂 Added "${chosenName}" to your spice rack!`
          );
          setTimeout(() => setBannerNotice(null), 3000);
        }
      }
    } catch (err) {
      console.error('Failed to quick add spice:', err);
    }
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
    } else if (filterLocation === 'SPICE_RACK') {
      const isSpiceLoc = item.locationType === 'SPICE_RACK';
      const isSpiceCat = (item.categoryName || '').toLowerCase().includes('spice') || (item.categoryName || '').toLowerCase().includes('épice');
      if (!isSpiceLoc && !isSpiceCat) {
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
  const spiceCount = items.filter(
    (i) => i.locationType === 'SPICE_RACK' || (i.categoryName || '').toLowerCase().includes('spice') || (i.categoryName || '').toLowerCase().includes('épice')
  ).length;
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
    <div className="relative w-full max-w-7xl mx-auto text-[var(--md-sys-color-on-surface)] flex flex-col min-h-screen sm:min-h-[850px] sm:rounded-[28px] border-0 sm:border border-[var(--md-sys-color-outline-variant)] shadow-none bg-[var(--md-sys-color-surface)] overflow-hidden">
      {/* M3 Top App Bar */}
      <header className="sticky top-0 z-30 px-3 sm:px-5 py-2.5 pt-[max(0.6rem,env(safe-area-inset-top,0px))] bg-[var(--md-sys-color-surface-container-high)]/95 backdrop-blur-md border-b border-[var(--md-sys-color-outline-variant)]/60 shadow-none shrink-0">
        <div className="flex items-center justify-between gap-2 lg:gap-4 max-w-7xl mx-auto w-full">
          {/* 1. Left: Bold Wordmark & Admin Console Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-pantryo-admin-management"
              onClick={() => {
                if (currentUser.role === 'ADMIN') {
                  setIsAdminModalOpen(true);
                } else {
                  setIsAdminRestrictedOpen(true);
                }
              }}
              className="flex items-center gap-2.5 shrink-0 hover:bg-[var(--md-sys-color-surface-container-highest)] p-1.5 -m-1 rounded-2xl transition-all cursor-pointer group text-left"
              title={
                currentUser.role === 'ADMIN'
                  ? lang === 'FR'
                    ? 'Ouvrir la Console d’Administration (Admin)'
                    : 'Open App Administration (Admin)'
                  : lang === 'FR'
                  ? 'Console Pantryo (Accès Administrateur)'
                  : 'Pantryo Console (Admin Access)'
              }
            >
              <div className="shrink-0 flex items-center justify-center">
                <PantryoLogo size={28} />
              </div>
              <div className="shrink-0 flex flex-col items-start justify-center">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--md-sys-color-on-surface)] leading-tight whitespace-nowrap">
                  Pantryo
                </h1>
                {currentUser.role === 'ADMIN' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] mt-0.5 leading-tight">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>Admin</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] mt-0.5 leading-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] shrink-0" />
                    <span>{currentUser.role === 'GUEST' ? (lang === 'FR' ? 'Invité' : 'Guest') : (lang === 'FR' ? 'Membre' : 'Member')}</span>
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* 2. Center: M3 Main Navigation Bar with Pill Indicators (Visible on Desktop) */}
          <nav aria-label="Main Navigation" className="hidden xl:flex items-center p-1 bg-[var(--md-sys-color-surface-container)] rounded-full border border-[var(--md-sys-color-outline-variant)]/60 shrink min-w-0 gap-1 shadow-none">
            {/* Inventory */}
            <button
              onClick={() => setActiveNav('home')}
              title={t('nav_inventory')}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                activeNav === 'home'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] font-medium'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>{t('nav_inventory')}</span>
            </button>

            {/* Meals */}
            <button
              onClick={() => setActiveNav('meals')}
              title={t('nav_meals')}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                activeNav === 'meals'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] font-medium'
              }`}
            >
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span>{lang === 'FR' ? 'Repas' : 'Meals'}</span>
              {plannedMeals.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                  activeNav === 'meals' ? 'bg-[var(--md-sys-color-primary)] text-white' : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
                }`}>
                  {plannedMeals.length}
                </span>
              )}
            </button>

            {/* Center: M3 Add Button */}
            <button
              type="button"
              id="top-nav-center-add-btn"
              onClick={() => setIsAddMenuOpen((prev) => !prev)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer bg-[var(--md-sys-color-primary)] hover:brightness-105 text-[var(--md-sys-color-on-primary)] shadow-xs active:scale-95 group"
              title={lang === 'FR' ? 'Ajouter (Menu Mobile Rapide)' : 'Add (Mobile Quick Menu)'}
            >
              <Plus className="w-4 h-4 stroke-[2.5] group-hover:rotate-90 transition-transform" />
              <span>{lang === 'FR' ? 'Ajouter' : 'Add'}</span>
            </button>

            {/* Grocery */}
            <button
              onClick={() => setActiveNav('grocery')}
              title={t('nav_grocery')}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                activeNav === 'grocery'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] font-medium'
              }`}
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>{lang === 'FR' ? 'Épicerie' : 'Grocery'}</span>
              {groceryItems.filter((i) => i.inCart).length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                  activeNav === 'grocery' ? 'bg-[var(--md-sys-color-primary)] text-white' : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
                }`}>
                  {groceryItems.filter((i) => i.inCart).length}
                </span>
              )}
            </button>

            {/* Cooking */}
            <button
              onClick={() => setActiveNav('cooking')}
              title={t('nav_cooking')}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                activeNav === 'cooking'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] font-medium'
              }`}
            >
              <ChefHat className="w-4 h-4 shrink-0" />
              <span>{t('nav_cooking')}</span>
            </button>

            {/* Family */}
            <button
              onClick={() => setActiveNav('sync')}
              title={t('nav_family')}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                activeNav === 'sync'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] font-medium'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>{t('nav_family')}</span>
            </button>
          </nav>

          {/* 3. Right: Action Bar & User Profile (Guaranteed never cut off) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
            {/* Unified Single Language Toggle */}
            <div className="shrink-0">
              <LanguageSwitcher />
            </div>

            {/* Install Button (Compact icon on small screens, expanded on wider screens) */}
            {!isInstalledEffective && onInstall && (
              <button
                type="button"
                onClick={onInstall}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                title={t('install_tooltip')}
              >
                <Download className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="font-bold text-[11px] sm:text-xs hidden md:inline">{t('install_btn')}</span>
              </button>
            )}

            {/* Family & Profile User Button - Just a circle on mobile mode so it never goes off screen */}
            <button
              type="button"
              id="header-family-profile-btn"
              onClick={() => setActiveNav(activeNav === 'sync' ? 'home' : 'sync')}
              className={`flex items-center gap-1.5 rounded-full sm:rounded-2xl p-0.5 sm:px-2.5 sm:py-1 shrink-0 transition-all border shadow-2xs cursor-pointer ${
                activeNav === 'sync'
                  ? 'bg-teal-700 text-white border-teal-800 ring-2 ring-teal-400/50 shadow-2xs'
                  : 'bg-white border-[#E5DFD0] text-[#0D3B37] hover:bg-[#FAF7EE]'
              }`}
              title={lang === 'FR' ? `Famille & Profil (${currentUser.name})` : `Family & Profile (${currentUser.name})`}
              aria-label={lang === 'FR' ? `Profil de ${currentUser.name}` : `${currentUser.name}'s Profile`}
            >
              <div className="relative shrink-0 w-7 h-7 sm:w-6 sm:h-6 rounded-full overflow-hidden">
                <img
                  src={currentUser.avatarUrl || '/avatars/chef-cat.svg'}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover border border-black/10"
                />
                <span className={`sm:hidden absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                  activeNav === 'sync' ? 'bg-teal-300' : 'bg-emerald-500'
                }`} />
              </div>
              <Users className={`hidden sm:inline w-3.5 h-3.5 shrink-0 ${activeNav === 'sync' ? 'text-teal-200' : 'text-teal-700'}`} />
              <span className={`hidden sm:inline text-xs font-bold transition-colors truncate max-w-[85px] md:max-w-[105px] lg:max-w-[130px] ${
                activeNav === 'sync' ? 'text-white' : 'text-[#0D3B37]'
              }`}>
                {currentUser.name}
              </span>
            </button>

            {/* Logout Button (Guaranteed visible in mobile & desktop) */}
            <button
              type="button"
              id="header-logout-btn"
              onClick={handleLogout}
              className="w-8 h-8 rounded-full sm:rounded-xl border border-[#E5DFD0] bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-500 transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-2xs active:scale-95"
              title={lang === 'FR' ? 'Déconnexion' : 'Log out'}
              aria-label={lang === 'FR' ? 'Déconnexion' : 'Log out'}
            >
              <LogOut className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

        {/* Global Notice */}
        {bannerNotice && (
          <div className="mt-2 py-1.5 px-3 rounded-xl bg-teal-50 text-teal-900 border border-teal-200 text-xs font-bold flex items-center gap-2 shadow-2xs animate-fade-in">
            <Check className="w-4 h-4 text-teal-600 shrink-0 stroke-[3]" />
            <span className="truncate">{bannerNotice}</span>
          </div>
        )}
      </header>

      {/* Main Scrollable View */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-5 pt-1.5 pb-28 xl:pb-16 space-y-2.5 sm:space-y-3.5">
        {/* VIEW: HOME INVENTORY */}
        {activeNav === 'home' && (
          <>
            {/* 4 EQUAL METRIC BOXES AT THE TOP - M3 Surface Containers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Box 1: Fridge */}
              <button
                type="button"
                onClick={() => setFilterLocation(filterLocation === 'FRIDGE' ? 'ALL' : 'FRIDGE')}
                className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                  filterLocation === 'FRIDGE'
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)] shadow-xs'
                    : 'bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{lang === 'FR' ? 'Frigo' : 'Fridge'}</span>
                  <Refrigerator className={`w-4 h-4 shrink-0 ${filterLocation === 'FRIDGE' ? 'text-[var(--md-sys-color-primary)]' : 'text-[var(--md-sys-color-secondary)]'}`} />
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{fridgeCount}</span>
                  <span className={`text-[10px] font-medium ${filterLocation === 'FRIDGE' ? 'text-[var(--md-sys-color-on-primary-container)]' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}>
                    {lang === 'FR' ? 'articles' : 'items'}
                  </span>
                </div>
              </button>

              {/* Box 2: Freezer */}
              <button
                type="button"
                onClick={() => setFilterLocation(filterLocation === 'FREEZER' ? 'ALL' : 'FREEZER')}
                className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                  filterLocation === 'FREEZER'
                    ? 'bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)] border-[var(--md-sys-color-tertiary)] shadow-xs'
                    : 'bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{lang === 'FR' ? 'Congélateur' : 'Freezer'}</span>
                  <Snowflake className={`w-4 h-4 shrink-0 ${filterLocation === 'FREEZER' ? 'text-[var(--md-sys-color-tertiary)]' : 'text-[var(--md-sys-color-secondary)]'}`} />
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{freezerCount}</span>
                  <span className={`text-[10px] font-medium ${filterLocation === 'FREEZER' ? 'text-[var(--md-sys-color-on-tertiary-container)]' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}>
                    {lang === 'FR' ? 'articles' : 'items'}
                  </span>
                </div>
              </button>

              {/* Box 3: Pantry */}
              <button
                type="button"
                onClick={() => setFilterLocation(filterLocation === 'PANTRY' ? 'ALL' : 'PANTRY')}
                className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                  filterLocation === 'PANTRY'
                    ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-xs'
                    : 'bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{lang === 'FR' ? 'Garde-manger' : 'Pantry'}</span>
                  <Boxes className={`w-4 h-4 shrink-0 ${filterLocation === 'PANTRY' ? 'text-amber-800' : 'text-amber-600'}`} />
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{pantryCount}</span>
                  <span className={`text-[10px] font-medium ${filterLocation === 'PANTRY' ? 'text-amber-900' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}>
                    {lang === 'FR' ? 'articles' : 'items'}
                  </span>
                </div>
              </button>

              {/* Box 4: Urgent / Bientôt expiré */}
              <button
                type="button"
                onClick={() => setFilterLocation(filterLocation === 'EXPIRING' ? 'ALL' : 'EXPIRING')}
                className={`p-3 rounded-[16px] border text-left transition-all cursor-pointer ${
                  filterLocation === 'EXPIRING'
                    ? 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] border-[var(--md-sys-color-error)] shadow-xs'
                    : expiringItems.length > 0
                    ? 'bg-[var(--md-sys-color-error-container)]/50 border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error-container)]'
                    : 'bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)] hover:border-slate-300 text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{lang === 'FR' ? 'Bientôt expiré' : 'Expiring Soon'}</span>
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${filterLocation === 'EXPIRING' ? 'text-[var(--md-sys-color-error)]' : 'text-rose-600'}`} />
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{expiringItems.length}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    expiringItems.length > 0 ? 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]' : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]'
                  }`}>
                    {expiringItems.length > 0 ? (lang === 'FR' ? 'Alerte' : 'Alert') : (lang === 'FR' ? 'Sûr' : 'Safe')}
                  </span>
                </div>
              </button>
            </div>

            {/* M3 Search Bar & Quick Add Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--md-sys-color-outline)]" />
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary-container)] focus:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-outline)] shadow-none transition-all"
                />
              </div>
              <button
                id="quick-add-item-btn"
                onClick={handleOpenAddModal}
                className="m3-btn-filled py-2 px-4 rounded-full font-medium text-xs flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer shadow-xs"
                title={t('quick_add_tooltip')}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{lang === 'FR' ? '+ Ajouter' : '+ Add'}</span>
              </button>
            </div>

            {/* Storage Zones Quick Filter Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#0D3B37]">
                <span className="flex items-center gap-2">
                  <span className="uppercase tracking-wider text-[11px] text-[#527470]">{lang === 'FR' ? 'Zones de stockage :' : 'Storage Zones:'}</span>
                  {filterLocation !== 'ALL' && (
                    <button
                      onClick={() => setFilterLocation('ALL')}
                      className="text-xs font-bold underline cursor-pointer text-teal-700"
                    >
                      {lang === 'FR' ? 'Afficher tout' : 'Show All'}
                    </button>
                  )}
                </span>
                {/* Multi-selection toggle & View Switcher */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
                      selectedItemIds.size > 0
                        ? 'bg-teal-700 text-white border-teal-800'
                        : 'bg-white hover:bg-[#F5F2E8] border-[#E5DFD0] text-[#527470]'
                    }`}
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

                  <div className="flex items-center p-0.5 bg-white border border-[#E5DFD0] rounded-xl shadow-2xs">
                    <button
                      onClick={() => setBentoViewMode('list')}
                      title={lang === 'FR' ? 'Mode Liste' : 'List Mode'}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        bentoViewMode === 'list'
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setBentoViewMode('grid')}
                      title={lang === 'FR' ? 'Mode Grille' : 'Grid Mode'}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        bentoViewMode === 'grid'
                          ? 'bg-teal-700 text-white shadow-2xs'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Horizontal Strip for Storage Locations */}
              <ScrollableRow containerClassName="w-full" className="pb-1 gap-1.5">
                <button
                  onClick={() => setFilterLocation('ALL')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer shadow-2xs ${
                    filterLocation === 'ALL'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white border border-[#E5DFD0] text-[#527470] hover:text-[#0D3B37] hover:bg-[#F5F2E8]'
                  }`}
                >
                  {lang === 'FR' ? `Tous (${items.length})` : `All (${items.length})`}
                </button>
                <button
                  onClick={() => setFilterLocation('FRIDGE')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs ${
                    filterLocation === 'FRIDGE'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white border border-[#E5DFD0] text-[#527470] hover:text-[#0D3B37] hover:bg-[#F5F2E8]'
                  }`}
                >
                  <Refrigerator className="w-3 h-3" />
                  {lang === 'FR' ? `Frigo (${fridgeCount})` : `Fridge (${fridgeCount})`}
                </button>
                <button
                  onClick={() => setFilterLocation('PANTRY')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs ${
                    filterLocation === 'PANTRY'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-white border border-[#E5DFD0] text-[#527470] hover:text-[#0D3B37] hover:bg-[#F5F2E8]'
                  }`}
                >
                  <Boxes className="w-3 h-3" />
                  {lang === 'FR' ? `Garde-manger (${pantryCount})` : `Pantry (${pantryCount})`}
                </button>
                <button
                  onClick={() => setFilterLocation('FREEZER')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs ${
                    filterLocation === 'FREEZER'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-white border border-[#E5DFD0] text-[#527470] hover:text-[#0D3B37] hover:bg-[#F5F2E8]'
                  }`}
                >
                  <Snowflake className="w-3 h-3" />
                  {lang === 'FR' ? `Congélateur (${freezerCount})` : `Freezer (${freezerCount})`}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterLocation(filterLocation === 'SPICE_RACK' ? 'ALL' : 'SPICE_RACK')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs ${
                    filterLocation === 'SPICE_RACK'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white border border-[#E5DFD0] text-[#527470] hover:text-[#0D3B37] hover:bg-[#F5F2E8]'
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  {lang === 'FR' ? `Épices (${spiceCount})` : `Spices (${spiceCount})`}
                </button>
                <button
                  onClick={() => setFilterLocation('EXPIRING')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs ${
                    filterLocation === 'EXPIRING'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : expiringItems.length > 0
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-white border border-[#E5DFD0] text-[#527470] hover:text-[#0D3B37] hover:bg-[#F5F2E8]'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {lang === 'FR' ? `Bientôt (${expiringItems.length})` : `Expiring (${expiringItems.length})`}
                </button>
              </ScrollableRow>
            </div>

            {/* Food Type Category Quick Chips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#0D3B37]">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="uppercase tracking-wider text-[11px] text-[#527470]">{t('browse_by_category')}</span>
                  {leftoversCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterLeftoversOnly(!filterLeftoversOnly)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-all ${
                        filterLeftoversOnly
                          ? 'bg-amber-700 text-white border-amber-800'
                          : 'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200'
                      }`}
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
                    className="text-rose-600 hover:underline font-bold text-xs"
                  >
                    {t('clear_filter')}
                  </button>
                )}
              </div>

              <ScrollableRow className="pb-1 gap-1.5">
                <button
                  onClick={() => setSelectedFoodType('ALL')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs ${
                    selectedFoodType === 'ALL'
                      ? 'bg-teal-700 text-white'
                      : 'bg-white border border-[#E5DFD0] text-[#527470] hover:text-[#0D3B37] hover:bg-[#F5F2E8]'
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
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-2xs ${
                        isSelected
                          ? 'bg-teal-700 text-white'
                          : 'bg-white border border-[#E5DFD0] text-[#527470] hover:text-[#0D3B37] hover:bg-[#F5F2E8]'
                      }`}
                    >
                      <cat.icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{getCategoryLocalizedName(cat.name, lang)}</span>
                    </button>
                  );
                })}
              </ScrollableRow>
            </div>

            {/* DEDICATED SPICES & SEASONINGS SECTION BANNER & CONTROLS */}
            {filterLocation === 'SPICE_RACK' && (
              <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-br from-orange-50 via-[#FFF9F0] to-amber-50 border border-[#FED7AA] space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-black text-orange-950">
                          {lang === 'FR' ? 'Armoire à Épices & Assaisonnements' : 'Spice Rack & Seasonings'}
                        </h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-200 text-orange-800">
                          {spiceCount} {lang === 'FR' ? 'articles' : 'items'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7A4019] mt-0.5">
                        {lang === 'FR'
                          ? 'Conservation longue durée (1 à 3 ans) • Épices moulues, herbes séchées, sels gourmets & arômes'
                          : 'Long shelf-life essentials (1-3 yrs) • Ground spices, whole seeds, dried herbs & gourmet salts'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAddModal('SPICE_RACK')}
                    className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'FR' ? '+ Ajouter une épice' : '+ Add Spice'}</span>
                  </button>
                </div>

                {/* Subcategory Filter Pills within Spices */}
                <div className="pt-2 border-t border-orange-200/70">
                  <div className="flex items-center justify-between text-[11px] font-bold text-orange-900 mb-1.5">
                    <span>{lang === 'FR' ? 'Sous-catégories d’épices :' : 'Spice Subcategories:'}</span>
                    {selectedSubCategory !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => setSelectedSubCategory('ALL')}
                        className="text-orange-700 hover:underline font-semibold text-[10px]"
                      >
                        {lang === 'FR' ? 'Toutes' : 'All'}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: 'ALL', labelEn: 'All Spices', labelFr: 'Toutes les épices', icon: '🧂' },
                      { key: 'Ground Spices', labelEn: 'Ground Spices', labelFr: 'Épices Moulues', icon: '🏺' },
                      { key: 'Whole Spices', labelEn: 'Whole Spices', labelFr: 'Épices Entières', icon: '✨' },
                      { key: 'Dried Herbs', labelEn: 'Dried Herbs', labelFr: 'Herbes Séchées', icon: '🌿' },
                      { key: 'Seasoning Blends & Salts', labelEn: 'Blends & Salts', labelFr: 'Mélanges & Sels', icon: '🧂' },
                      { key: 'Extracts & Baking Aromatics', labelEn: 'Extracts', labelFr: 'Extraits & Arômes', icon: '🪵' },
                    ].map((sub) => {
                      const isSelected = selectedSubCategory === sub.key || (sub.key === 'ALL' && selectedSubCategory === 'ALL');
                      return (
                        <button
                          key={sub.key}
                          type="button"
                          onClick={() => setSelectedSubCategory(sub.key)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                            isSelected
                              ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                              : 'bg-white border-orange-200 text-orange-950 hover:bg-orange-100/60'
                          }`}
                        >
                          <span>{sub.icon}</span>
                          <span>{lang === 'FR' ? sub.labelFr : sub.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1-Tap Quick-Add Spice Essentials Bar */}
                <div className="pt-2 border-t border-orange-200/70">
                  <div className="flex items-center justify-between text-[11px] font-bold text-orange-900 mb-1.5">
                    <span className="flex items-center gap-1">
                      <span>{lang === 'FR' ? 'Ranger un indispensable en 1 clic :' : 'Quick-stock kitchen essentials:'}</span>
                      <span className="text-[10px] text-orange-600 font-normal">
                        ({lang === 'FR' ? 'Conservation 2 ans garantie' : '2-year shelf-life'})
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { en: 'Fine Sea Salt', fr: 'Sel de mer fin', icon: '🧂' },
                      { en: 'Black Pepper', fr: 'Poivre noir moulu', icon: '🌶️' },
                      { en: 'Smoked Paprika', fr: 'Paprika fumé', icon: '🏺' },
                      { en: 'Ground Cumin', fr: 'Cumin moulu', icon: '🍂' },
                      { en: 'Dried Oregano', fr: 'Origan séché', icon: '🌿' },
                      { en: 'Garlic Powder', fr: 'Ail en poudre', icon: '🧄' },
                      { en: 'Ground Cinnamon', fr: 'Cannelle moulue', icon: '🪵' },
                      { en: 'Curry Powder', fr: 'Poudre de curry', icon: '🍛' },
                      { en: 'Herbes de Provence', fr: 'Herbes de Provence', icon: '🌱' },
                      { en: 'Onion Powder', fr: 'Oignon en poudre', icon: '🧅' },
                    ].map((sp) => (
                      <button
                        key={sp.en}
                        type="button"
                        onClick={() => handleQuickAddSpiceToInventory(sp.en, sp.fr)}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white/90 hover:bg-white border border-orange-200 hover:border-orange-400 text-orange-950 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title={lang === 'FR' ? `Ajouter ${sp.fr} à l'inventaire` : `Add ${sp.en} to inventory`}
                      >
                        <span>{sp.icon}</span>
                        <span>{lang === 'FR' ? sp.fr : sp.en}</span>
                        <Plus className="w-3 h-3 text-orange-600 ml-0.5" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* CFIA / MAPAQ Food Safety Recommendation Card */}
                <div className="p-2.5 rounded-2xl bg-amber-100/60 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2">
                  <span className="text-sm">💡</span>
                  <div>
                    <span className="font-bold">
                      {lang === 'FR' ? 'Norme ACIA / MAPAQ & EFSA :' : 'CFIA / MAPAQ & EFSA Standard:'}{' '}
                    </span>
                    <span>
                      {lang === 'FR'
                        ? 'Les épices moulues conservent toute leur puissance aromatique pendant 1 à 2 ans, et les épices entières 3 à 4 ans au sec et à l’obscurité. Évitez de saupoudrer au-dessus des casseroles fumantes.'
                        : 'Ground spices retain optimal aromatic flavor for 1-2 years, and whole spices for 3-4 years in a cool, dark, dry spice rack. Avoid shaking jars directly over steaming pots.'}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
                  {filterLocation === 'SPICE_RACK'
                    ? lang === 'FR'
                      ? 'Votre armoire à épices est vide'
                      : 'Your spice rack is empty'
                    : lang === 'FR'
                    ? 'Aucun article ne correspond à ce filtre'
                    : 'No items match this filter'}
                </p>
                <p className="text-xs">
                  {filterLocation === 'SPICE_RACK'
                    ? lang === 'FR'
                      ? 'Cliquez sur l’un des indispensables ci-dessus pour ranger du sel, poivre ou paprika en 1 clic !'
                      : 'Click any of the kitchen essentials above to stock salt, pepper, or paprika in 1-tap!'
                    : lang === 'FR'
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
                        title={lang === 'FR' ? "Cliquer pour modifier l'aliment" : "Click to edit item"}
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
                        {item.imageUrl && !item.imageUrl.includes('unsplash.com') ? (
                          <img
                            src={item.imageUrl}
                            alt={getItemDisplayName(item, lang)}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className={`w-full h-full flex flex-col items-center justify-center ${visual.bgColor} ${visual.textColor} transition-colors select-none`}>
                            <CategoryIcon className="w-10 h-10 stroke-[1.6]" />
                            <span className="text-[10px] font-bold mt-1.5 opacity-80 max-w-[90%] truncate text-center">
                              {getCategoryLocalizedName(item.categoryName, lang)}
                            </span>
                          </div>
                        )}
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
                          {formatLocalizedQuantityUnit(item.quantity, item.unit, lang)}
                        </div>
                      </div>

                      {/* Middle Bento Title & Status */}
                      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                        <h3
                          onClick={() => handleOpenEditModal(item)}
                          className="font-bold text-xs text-[#1F3323] leading-tight line-clamp-2 cursor-pointer hover:text-teal-700 transition-colors"
                          title={lang === 'FR' ? "Cliquer pour modifier l'article" : "Click to edit item"}
                        >
                          {getItemDisplayName(item, lang)}
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
                            {item.addedByName || (lang === 'FR' ? 'Membre' : 'Member')}
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
            householdId="hh_pantryo_main"
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
            onOpenAdmin={(tab = 'backup') => {
              setAdminModalInitialTab(tab);
              if (currentUser.role === 'ADMIN') {
                setIsAdminModalOpen(true);
              } else {
                setIsAdminRestrictedOpen(true);
              }
            }}
          />
        )}
      </div>

      {/* Quick Add Action Menu (Functions like mobile phone on desktop, tablet & mobile) */}
      {isAddMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 md:p-6 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddMenuOpen(false);
          }}
        >
          <div className="w-full sm:max-w-lg bg-[var(--md-sys-color-surface-container-highest)] h-full sm:h-auto sm:max-h-[92vh] sm:rounded-[28px] shadow-2xl border-0 sm:border border-[var(--md-sys-color-outline-variant)] flex flex-col overflow-hidden text-[var(--md-sys-color-on-surface)]">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container-high)] backdrop-blur-xs shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[var(--md-sys-color-on-surface)] leading-tight">
                    {lang === 'FR' ? 'Ajouter à la cuisine' : 'Add to Kitchen'}
                  </h2>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    {lang === 'FR' ? 'Choisissez le mode d’ajout souhaité' : 'Choose how you want to add items'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddMenuOpen(false)}
                className="px-3.5 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-[var(--md-sys-color-outline-variant)]"
                title={lang === 'FR' ? 'Quitter' : 'Exit'}
              >
                <X className="w-4 h-4" />
                <span>{lang === 'FR' ? 'Quitter' : 'Exit'}</span>
              </button>
            </div>

            {/* Options in Responsive Modal View */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 max-w-lg mx-auto w-full flex flex-col justify-center space-y-3">
              {/* Option 1: Manual Add */}
              <button
                type="button"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  handleOpenAddModal();
                }}
                className="w-full p-3.5 sm:p-4 rounded-[16px] bg-[var(--md-sys-color-surface-container-lowest)] hover:bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] flex items-center gap-3.5 sm:gap-4 text-left transition-all active:scale-[0.98] group cursor-pointer"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[12px] bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs shrink-0 transition-colors">
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    {lang === 'FR' ? 'Saisie manuelle' : 'Manual Add'}
                  </p>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    {lang === 'FR' ? 'Entrez le nom, la quantité, le lieu de stockage et la date' : 'Name, quantity, compartment, and expiry date'}
                  </p>
                </div>
              </button>

              {/* Option 2: Smart Unified Camera Photo Scan (Produce, Grocery, Receipt) */}
              <button
                type="button"
                id="add-smart-camera-scan-btn"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  setScannerInitialMode('snap');
                  setIsScannerOpen(true);
                }}
                className="w-full p-3.5 sm:p-4 rounded-3xl bg-white hover:bg-teal-50/70 border-2 border-teal-600/30 hover:border-teal-500 flex items-center gap-3.5 sm:gap-4 text-left transition-all active:scale-[0.98] shadow-xs group cursor-pointer"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#0D3B37] via-[#0E766E] to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6 text-teal-100" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-[#0D3B37]">
                      {lang === 'FR' ? 'Photographier (Scanner Intelligent)' : 'Snap Photo (Smart Scanner)'}
                    </p>
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
                      Auto-IA
                    </span>
                  </div>
                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? 'Détecte automatiquement fruits, légumes, emballages, reçus et codes-barres'
                      : 'Auto-detects fresh produce, packaged foods, receipts, and barcodes'}
                  </p>
                </div>
              </button>

              {/* Option 3: Plan a Meal in Calendar (Planifier un repas) */}
              <button
                type="button"
                id="add-plan-meal-calendar-option"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  setActiveNav('meals');
                }}
                className="w-full p-3.5 sm:p-4 rounded-3xl bg-white hover:bg-teal-50/70 border-2 border-[#E5DFD0] hover:border-teal-500 flex items-center gap-3.5 sm:gap-4 text-left transition-all active:scale-[0.98] shadow-xs group cursor-pointer"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-800 group-hover:bg-teal-900 text-white flex items-center justify-center shadow-xs shrink-0 transition-colors">
                  <CalendarDays className="w-6 h-6 text-teal-100" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-[#0D3B37]">
                    {lang === 'FR' ? 'Planifier un repas dans l\'agenda' : 'Plan a Meal in Calendar'}
                  </p>
                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? 'Déjeuner, dîner, souper ou collation avec photos HD Ricardo'
                      : 'Breakfast, lunch, dinner, or snack with Ricardo HD pictures'}
                  </p>
                </div>
              </button>

              {/* Option 4: Scan Written Recipe (Camera / OCR) */}
              <button
                type="button"
                onClick={handleOpenRecipeCameraScan}
                className="w-full p-3.5 sm:p-4 rounded-3xl bg-white hover:bg-[#F6F2E8] border-2 border-[#E5DFD0] hover:border-emerald-500 flex items-center gap-3.5 sm:gap-4 text-left transition-all active:scale-[0.98] shadow-xs group cursor-pointer"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-700 group-hover:bg-emerald-800 text-white flex items-center justify-center shadow-xs shrink-0 transition-colors">
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

              {/* Option 5: Leftovers & Prepared Foods (Health Canada & European Standards) */}
              <button
                type="button"
                id="add-kitchen-leftovers-option"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  setSelectedMealForLeftover(null);
                  setIsImportLeftoverOpen(true);
                }}
                className="w-full p-3.5 sm:p-4 rounded-3xl bg-white hover:bg-[#FDF7ED] border-2 border-[#E5DFD0] hover:border-amber-500 flex items-center gap-3.5 sm:gap-4 text-left transition-all active:scale-[0.98] shadow-xs group cursor-pointer"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#C25E00] group-hover:bg-[#A34E00] text-white flex items-center justify-center shadow-xs shrink-0 transition-colors">
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

              {/* Option 6: Canadian Grocery Flyers (Maxi, Super C, No Frills, Metro, IGA, Walmart) */}
              <button
                type="button"
                id="add-canadian-flyers-option"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  setScannerInitialMode('flyer');
                  setIsScannerOpen(true);
                }}
                className="w-full p-3.5 sm:p-4 rounded-3xl bg-white hover:bg-rose-50/70 border-2 border-rose-600/30 hover:border-rose-500 flex items-center gap-3.5 sm:gap-4 text-left transition-all active:scale-[0.98] shadow-xs group cursor-pointer"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-rose-700 via-rose-600 to-amber-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-6 h-6 text-rose-100" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-[#0D3B37]">
                      {lang === 'FR' ? 'Circulaires d’épicerie canadiennes' : 'Canadian Grocery Flyers'}
                    </p>
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-100 text-rose-900 border border-rose-300">
                      🇨🇦 Photos & IA
                    </span>
                  </div>
                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? 'Maxi, Super C, No Frills, Metro, IGA, Walmart : photos de circulaires, yogourts et rabais $/lb'
                      : 'Maxi, Super C, No Frills, Metro, IGA, Walmart: flyer pictures, yogurts & $/lb deals'}
                  </p>
                </div>
              </button>

              {/* Option 7: Family & Profile Settings */}
              <button
                type="button"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  setActiveNav('sync');
                }}
                className="w-full p-3.5 sm:p-4 rounded-3xl bg-white hover:bg-[#F2ECE0] border-2 border-[#E5DFD0] hover:border-teal-500 flex items-center gap-3.5 sm:gap-4 text-left transition-all active:scale-[0.98] shadow-xs group cursor-pointer"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-800 group-hover:bg-teal-900 text-white flex items-center justify-center shadow-xs shrink-0 transition-colors">
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
        </div>
      )}

      {/* M3 Navigation Bar (Visible on Mobile & Tablet Mode) */}
      <nav
        aria-label="Bottom Navigation"
        className="xl:hidden fixed bottom-0 inset-x-0 h-20 bg-[var(--md-sys-color-surface-container)]/98 backdrop-blur-md border-t border-[var(--md-sys-color-outline-variant)]/40 shadow-none pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] px-2 z-30 flex items-center"
      >
        <div className="w-full max-w-lg md:max-w-2xl mx-auto flex items-center justify-around">
          {/* Destination 1: Kitchen / Inventory */}
          <button
            type="button"
            onClick={() => {
              setIsAddMenuOpen(false);
              setActiveNav('home');
            }}
            className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-all select-none"
          >
            <div
              className={`w-16 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                activeNav === 'home'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]/60'
              }`}
            >
              <Home className="w-5 h-5 shrink-0" />
            </div>
            <span
              className={`text-[11px] tracking-tight leading-none mt-1 truncate max-w-full text-center ${
                activeNav === 'home' ? 'font-bold text-[var(--md-sys-color-on-surface)]' : 'font-medium text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              {t('bottom_home')}
            </span>
          </button>

          {/* Destination 2: Meals */}
          <button
            type="button"
            onClick={() => {
              setIsAddMenuOpen(false);
              setActiveNav('meals');
            }}
            className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-all select-none"
          >
            <div className="relative">
              <div
                className={`w-16 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  activeNav === 'meals'
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]/60'
                }`}
              >
                <CalendarDays className="w-5 h-5 shrink-0" />
              </div>
              {plannedMeals.length > 0 && (
                <span className="absolute top-1 right-3 px-1 min-w-4 h-4 bg-[var(--md-sys-color-primary)] text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {plannedMeals.length}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] tracking-tight leading-none mt-1 truncate max-w-full text-center ${
                activeNav === 'meals' ? 'font-bold text-[var(--md-sys-color-on-surface)]' : 'font-medium text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              {t('bottom_meals')}
            </span>
          </button>

          {/* Destination 3: Grocery */}
          <button
            type="button"
            onClick={() => {
              setIsAddMenuOpen(false);
              setActiveNav('grocery');
            }}
            className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-all select-none"
          >
            <div className="relative">
              <div
                className={`w-16 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  activeNav === 'grocery'
                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]/60'
                }`}
              >
                <ShoppingCart className="w-5 h-5 shrink-0" />
              </div>
              {groceryItems.filter((i) => i.inCart).length > 0 && (
                <span className="absolute top-1 right-3 px-1 min-w-4 h-4 bg-[var(--md-sys-color-primary)] text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {groceryItems.filter((i) => i.inCart).length}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] tracking-tight leading-none mt-1 truncate max-w-full text-center ${
                activeNav === 'grocery' ? 'font-bold text-[var(--md-sys-color-on-surface)]' : 'font-medium text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              {t('bottom_grocery')}
            </span>
          </button>

          {/* Destination 4: Cooking Ideas */}
          <button
            type="button"
            onClick={() => {
              setIsAddMenuOpen(false);
              setActiveNav('cooking');
            }}
            className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-all select-none"
          >
            <div
              className={`w-16 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                activeNav === 'cooking'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]/60'
              }`}
            >
              <ChefHat className="w-5 h-5 shrink-0" />
            </div>
            <span
              className={`text-[11px] tracking-tight leading-none mt-1 truncate max-w-full text-center ${
                activeNav === 'cooking' ? 'font-bold text-[var(--md-sys-color-on-surface)]' : 'font-medium text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              {t('bottom_cooking')}
            </span>
          </button>

          {/* Destination 5: Family & Sync */}
          <button
            type="button"
            onClick={() => {
              setIsAddMenuOpen(false);
              setActiveNav('sync');
            }}
            className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition-all select-none"
          >
            <div
              className={`w-16 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                activeNav === 'sync'
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]/60'
              }`}
            >
              <Users className="w-5 h-5 shrink-0" />
            </div>
            <span
              className={`text-[11px] tracking-tight leading-none mt-1 truncate max-w-full text-center ${
                activeNav === 'sync' ? 'font-bold text-[var(--md-sys-color-on-surface)]' : 'font-medium text-[var(--md-sys-color-on-surface-variant)]'
              }`}
            >
              {lang === 'FR' ? 'Famille' : 'Family'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Floating M3 Extended FAB */}
      <div className="xl:hidden fixed bottom-24 right-4 z-40">
        <button
          type="button"
          id="mobile-floating-extended-fab"
          onClick={() => setIsAddMenuOpen((prev) => !prev)}
          className={`m3-extended-fab flex items-center gap-2 px-4 py-3 shadow-[var(--md-sys-elevation-2)] hover:shadow-[var(--md-sys-elevation-3)] active:scale-95 transition-all cursor-pointer font-medium text-xs ${
            isAddMenuOpen ? 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]' : ''
          }`}
          aria-label={lang === 'FR' ? 'Ajouter un aliment' : 'Add Item'}
          title={lang === 'FR' ? 'Ajouter un aliment' : 'Add Item'}
        >
          <Plus className={`w-5 h-5 stroke-[2.5] transition-transform ${isAddMenuOpen ? 'rotate-45' : ''}`} />
          <span>{lang === 'FR' ? 'Ajouter' : 'Add Item'}</span>
        </button>
      </div>

      {/* Desktop Floating M3 Extended FAB */}
      <div className="hidden xl:flex fixed bottom-8 right-8 z-40 items-center gap-2">
        <button
          type="button"
          id="desktop-floating-extended-fab"
          onClick={() => setIsAddMenuOpen((prev) => !prev)}
          className={`m3-extended-fab flex items-center gap-2.5 px-5 py-3.5 shadow-[var(--md-sys-elevation-2)] hover:shadow-[var(--md-sys-elevation-3)] active:scale-95 transition-all cursor-pointer font-medium text-sm ${
            isAddMenuOpen ? 'bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]' : ''
          }`}
          aria-label={lang === 'FR' ? 'Ajouter un aliment' : 'Add Item'}
          title={lang === 'FR' ? 'Ajouter un aliment' : 'Add Item'}
        >
          <Plus className={`w-5 h-5 stroke-[2.5] transition-transform ${isAddMenuOpen ? 'rotate-45' : ''}`} />
          <span>{lang === 'FR' ? 'Ajouter un aliment' : 'Add Item'}</span>
        </button>
      </div>

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
          setModalDefaultLocation(undefined);
        }}
        itemToEdit={itemToEdit}
        currentUser={currentUser}
        defaultLocationType={modalDefaultLocation}
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
          const names = newItems.map((i) => getItemDisplayName(i, lang)).slice(0, 2).join(', ');
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
        initialTab={adminModalInitialTab}
        onClose={() => {
          setIsAdminModalOpen(false);
          setAdminModalInitialTab('backup');
          fetchInventory();
        }}
        onNavigateToAppTab={(tab) => {
          setIsAdminModalOpen(false);
          setAdminModalInitialTab('backup');
          setActiveNav(tab);
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
          try {
            const pubRes = await fetch('/api/v1/auth/public-members');
            if (pubRes.ok) {
              const members = await pubRes.json();
              setHouseholdMembers(members);
              localStorage.setItem('kitchen_komrade_household_members', JSON.stringify(members));
            }
          } catch (_) {}
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
                    <span className="truncate font-semibold">{getItemDisplayName(item, lang)}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                      {formatLocalizedQuantityUnit(item.quantity, item.unit, lang)}
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

      {/* Floating Active Cooking Mini-Bar (persists across all pages while cooking in background) */}
      <ActiveCookingBar />

      {/* Full Screen Guided Cooking Modal (driven by global session) */}
      {sessionActiveRecipe && (
        <GuidedCookingModal
          isOpen={isSessionCookingOpen}
          onClose={exitCooking}
          onMinimize={minimizeCooking}
          recipe={sessionActiveRecipe}
          inventoryItems={items}
          onCookRecipe={sessionHandlers.onCookRecipe || handleCookRecipeDirectly}
          onAddMissingToGrocery={
            sessionHandlers.onAddMissingToGrocery ||
            ((missing) => {
              setGroceryItems((prev) => [
                {
                  id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  name: missing.name,
                  category: missing.category || 'Produce',
                  quantity: missing.quantity || 1,
                  unit: missing.unit || 'item',
                  locationType: 'FRIDGE',
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
            })
          }
          onRecipeCookedSuccessfully={sessionHandlers.onRecipeCookedSuccessfully}
        />
      )}
    </div>
  );
};
