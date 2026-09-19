export type StorageType = 'FRIDGE' | 'PANTRY' | 'FREEZER' | 'CELLAR' | 'SPICE_RACK';

export type Language = 'EN' | 'FR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'GUEST';
  avatarUrl?: string;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  members: User[];
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  householdId: string;
  locationId: string;
  locationName: string;
  locationType: StorageType;
  categoryId?: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  addedById: string;
  addedByName: string;
  addedByAvatar?: string;
  status: 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'DISCARDED';
  expirationDate: string | null;
  daysUntilExpiration: number | null;
  isExpiringSoon: boolean;
  isExpired: boolean;
  frozenAt: string | null;
  monthsFrozen: number | null;
  monthsFrozenShelfLife: number | null;
  frozenPercentage: number | null;
  isFreezerWarning: boolean;
  defrostedAt?: string | null;
  notes?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScannedItemCandidate {
  name: string;
  brand?: string;
  barcode?: string;
  category: string;
  quantity: number;
  unit: string;
  recommendedLocation: 'Fridge' | 'Pantry' | 'Freezer';
  storageReason?: string;
  estimatedShelfLifeDays: number;
  monthsFrozenShelfLife: number;
  confidence?: number;
  storageTip?: string;
  suggestedExpirationDate?: string;
  detectedText?: string;
  printedExpirationDate?: string;
}

export interface ScanResponse {
  success: boolean;
  summary: string;
  itemsCount: number;
  items: ScannedItemCandidate[];
  demoMode?: boolean;
  scannedAt: string;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  details: {
    itemName?: string;
    location?: string;
    fromLocation?: string;
    toLocation?: string;
    newExpiration?: string;
    addedBy?: string;
    defrostedBy?: string;
  };
  itemId?: string;
  userId: string;
  householdId: string;
  createdAt: string;
}

export interface SavedGroceryListItem {
  name: string;
  quantity: number;
  unit: string;
  locationType: 'FRIDGE' | 'FREEZER' | 'PANTRY';
  category?: string;
}

export interface SavedGroceryList {
  id: string;
  name: string;
  description?: string;
  categoryTag?: string;
  itemCount: number;
  items: SavedGroceryListItem[];
  createdAt: string;
  updatedAt?: string;
}

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface PlannedMealIngredient {
  name: string;
  quantity?: number;
  unit?: string;
  inStock?: boolean;
  inventoryItemId?: string;
}

export interface PlannedMeal {
  id: string;
  householdId: string;
  title: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  recipeName?: string;
  recipeUrl?: string;
  imageUrl?: string;
  servings?: number;
  prepTimeMinutes?: number;
  notes?: string;
  isCooked: boolean;
  ingredients: PlannedMealIngredient[];
  createdAt: string;
  updatedAt: string;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

