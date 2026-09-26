export type StorageType = 'FRIDGE' | 'PANTRY' | 'FREEZER' | 'CELLAR' | 'SPICE_RACK';

export type Language = 'EN' | 'FR';

export interface Fido2CredentialInfo {
  id: string;
  friendlyName: string;
  counter: number;
  deviceType?: string;
  backedUp?: boolean;
  transports?: string[];
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'GUEST';
  avatarUrl?: string;
  fido2Enabled?: boolean;
  fido2Enforced?: boolean;
  isCompliant?: boolean;
  requiresEnrollment?: boolean;
  mustChangePassword?: boolean;
  mustSetupProfile?: boolean;
  isDefaultAdmin?: boolean;
  fido2Credentials?: Fido2CredentialInfo[];
  recoveryCodesRemaining?: number;
  totpEnabled?: boolean;
}

export interface Fido2PolicyInfo {
  allUsersRequired: boolean;
  enforced: boolean;
  totalUsers: number;
  compliantUsers: number;
  nonCompliantUsers: number;
  users?: User[];
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
  isLeftover?: boolean;
  leftoverFoodType?: string;
  leftoverSourceMeal?: string;
  prepDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScannedItemCandidate {
  name: string;
  nameFr?: string;
  nameEn?: string;
  brand?: string;
  price?: string;
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
  storeName?: string;
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
  lastModifiedBy?: string;
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

export interface SmartMealSuggestionIngredient {
  name: string;
  nameFr?: string;
  amount?: string;
  inStock: boolean;
  category?: string;
}

export interface SmartMealSuggestion {
  id: string;
  title: string;
  titleFr?: string;
  source: string;
  sourceUrl?: string;
  imageUrl?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
  difficulty?: 'Easy' | 'Medium' | 'Advanced' | string;
  difficultyFr?: string;
  zeroWasteReason: string;
  rescuedIngredients: string[];
  matchPercentage: number;
  ingredients: SmartMealSuggestionIngredient[];
  instructionsEn?: string[];
  instructionsFr?: string[];
  tags?: string[];
  mealType?: MealType;
  suitableMealTypes?: MealType[];
  isWebSearch?: boolean;
  isFromMyRecipes?: boolean;
}

export interface RecipeWebsiteSource {
  id: string;
  name: string;
  url: string;
  domain: string;
  language: 'FR' | 'EN' | 'BOTH';
  enabled: boolean;
  isCustom?: boolean;
  favicon?: string;
  description?: string;
  descriptionFr?: string;
}

export interface DatabaseStats {
  status: string;
  databaseEngine?: string;
  sqlite?: {
    engine?: string;
    cipher?: string;
    isEncrypted?: boolean;
    storageFile?: string;
    fileSizeKb?: number;
    pageCount?: number;
    pageSize?: number;
    journalMode?: string;
    sqliteVersion?: string;
    installationId?: string;
    tableCounts?: Record<string, number>;
  };
  encryption: {
    algorithm: string;
    cipher?: string;
    atRest: boolean;
    authenticated: boolean;
    pageLevelEncrypted?: boolean;
    keyDerivation: string;
    storageLocation: string;
    fileSizeKb: number;
    installationId?: string;
  };
  twoFactor?: {
    standard: string;
    passkeysSupported: boolean;
    hardwareKeysSupported: boolean;
    recoveryCodesSupported: boolean;
    activeEnrolledUsers: number;
  };
  counts: {
    items: number;
    plannedMeals: number;
    customRecipes: number;
    groceryItems: number;
    savedLists: number;
    users: number;
    locations: number;
    categories: number;
  };
  household: {
    id: string;
    name: string;
    inviteCode: string;
  };
  lastBackupAt: string | null;
  lastRestoreAt: string | null;
  serverTime: string;
}

export interface DatabaseBackupPackage {
  metadata: {
    app: string;
    schemaVersion: string;
    exportedAt: string;
    isEncrypted: boolean;
    algorithm?: string;
    checksum: string;
    recordCounts: {
      items: number;
      plannedMeals: number;
      customRecipes: number;
      groceryItems: number;
      savedLists: number;
      users: number;
    };
  };
  payload: any;
}


