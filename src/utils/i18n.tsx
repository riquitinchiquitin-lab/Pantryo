import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';

export const LOCAL_STORAGE_LANG_KEY = 'pantryo_language_pref';

export const translations = {
  EN: {
    // Top Navigation & Branding
    app_name: 'Pantryo',
    kitchen_name: 'The Yan & Kriz Kitchen',
    nav_inventory: 'Inventory',
    nav_meals: 'Meal Planner',
    nav_grocery: 'Grocery Cart',
    nav_cooking: 'Cooking',
    nav_family: 'Family',
    install_btn: 'Install',
    install_tooltip: 'Install Pantryo App on your phone',

    // Mobile Bottom Nav
    bottom_home: 'Home',
    bottom_meals: 'Meals',
    bottom_grocery: 'Grocery',
    bottom_cooking: 'Cooking',
    bottom_family: 'Family',

    // Pulse & Bento Stats
    bento_pulse_title: 'Bento Kitchen Pulse',
    bento_pulse_subtitle: '96% Zero-Waste Efficiency',
    live_sync: 'Live Sync',
    fridge_label: 'Fridge',
    freezer_label: 'Freezer',
    pantry_label: 'Pantry',
    items_count: '{count} items',
    rescue_label: 'Rescue',
    rescue_soon: '{count} soon',
    day_left: '{count} day left',
    days_left: '{count} days left',
    all_fresh_safe: 'All fresh & safe',
    deep_freeze_label: 'Deep Freeze',
    items_stored: '{count} items stored',
    defrost_ready: 'Defrost ready',

    // Search & Add Bar
    search_placeholder: 'Search food, produce, meats...',
    quick_add_btn: '+ Add',
    quick_add_tooltip: 'Add food item manually',

    // Categories & Subcategories
    browse_by_category: 'Browse by Category',
    types_count: '({count} types)',
    clear_filter: 'Clear Filter',
    all_categories: 'All',
    meat_cuts_title: '🥩 Meat Cuts, Seafood & Subcategories',
    visual_cuts_count: '({count} visual cuts)',
    reset_cut_filter: 'Reset Cut Filter',
    all_cuts: 'All Cuts',

    // Location Tabs & Bento switcher
    all_zones: 'All Zones',
    grid_mode_title: 'Bento Grid Mode',
    list_mode_title: 'Bento List Mode',

    // Inventory Item Card & Bento
    click_to_edit: 'Click to edit item',
    defrost_to_fridge: 'Defrost to Fridge',
    defrosting: 'Defrosting...',
    safe_in_freezer: 'Safe in Freezer',
    frozen_months: 'Frozen {count} mos',
    add_to_grocery: '+ Grocery',
    edit_action: 'Edit',
    delete_action: 'Delete',
    confirm_delete: 'Are you sure you want to delete this item?',
    loading_inventory: 'Loading household inventory...',
    no_items_match: 'No items match this filter',
    no_items_hint: "Try selecting 'All' or use the SNAP & ADD button below to scan groceries with Gemini Flash Vision!",

    // Floating Action Buttons
    floating_add_item: 'ADD ITEM',
    floating_snap_add: 'SNAP & ADD!',
    floating_manual_tooltip: 'Add item manually',
    floating_snap_tooltip: 'Scan item with camera',

    // Common Locations
    loc_fridge: 'Fridge',
    loc_freezer: 'Freezer',
    loc_pantry: 'Pantry',

    // Add / Edit Modal
    modal_add_title: 'Add New Food Item',
    modal_edit_title: 'Edit Food Item',
    modal_add_subtitle: 'Enter details for your fridge, freezer, or pantry.',
    field_name: 'Item Name *',
    field_name_placeholder: 'e.g., Organic Honeycrisp Apples, Ribeye Steak...',
    field_location: 'Storage Location',
    field_category: 'Food Category',
    field_meat_cut: 'Specific Cut or Variety (Optional)',
    field_meat_cut_placeholder: 'Select a visual cut...',
    field_quantity: 'Quantity',
    field_unit: 'Unit',
    field_expiration: 'Expiration Date',
    quick_presets: 'Quick Presets:',
    preset_3_days: '+3 Days',
    preset_1_week: '+1 Week',
    preset_2_weeks: '+2 Weeks',
    preset_1_month: '+1 Month',
    preset_6_months: '+6 Months (Freezer)',
    field_image_url: 'Photo / Image URL (Optional)',
    field_image_placeholder: 'https://images.unsplash.com/...',
    field_notes: 'Notes / Storage Details (Optional)',
    field_notes_placeholder: 'e.g., Opened on Tuesday, bottom crisper drawer...',
    btn_cancel: 'Cancel',
    btn_save_changes: 'Save Changes',
    btn_add_to_inventory: 'Add to Inventory',
    btn_saving: 'Saving...',
    btn_delete_item: 'Delete Item',

    // Camera & Scanner Modal
    scanner_title: 'AI Camera & Smart Scanner',
    scanner_subtitle: 'Instant food recognition, barcode scanning & expiry detection with Gemini Flash',
    tab_snap: 'Smart Snap (AI)',
    tab_barcode: 'Barcode (UPC)',
    tab_upload: 'Upload Photo',
    tab_presets: 'Quick Demo',
    btn_take_photo: 'Take Photo',
    btn_retake: 'Retake',
    btn_upload_image: 'Choose Image',
    btn_scan_now: 'Scan with Gemini AI',
    scanning_in_progress: 'Analyzing items with Gemini Vision...',
    looking_up_upc: 'Looking up barcode...',
    detected_items_title: 'Detected Items ({count})',
    btn_select_all: 'Select All',
    btn_add_selected: 'Add Selected ({count}) to Inventory',
    btn_adding: 'Adding items...',
    scan_empty: 'No items detected. Try taking a clearer picture with good lighting.',
    manual_upc_label: 'Enter Barcode Number:',
    manual_upc_btn: 'Lookup Barcode',
    or_manual_add: 'Or add food manually',

    // Grocery List View
    grocery_title: 'Grocery Shopping List',
    grocery_subtitle: 'Real-time collaborative shopping cart for your kitchen',
    btn_saved_lists: 'Saved Lists & Packs',
    btn_stock_kitchen: 'Stock Checked into Kitchen',
    filter_all: 'All',
    filter_to_buy: 'To Buy',
    filter_in_cart: 'In Cart',
    input_item_name: 'Item name to buy...',
    btn_add_grocery: 'Add Item',
    quick_add_directly_to_cart: 'Put directly in cart',
    in_cart_badge: 'In Cart',
    mark_in_cart: 'Mark as collected',
    empty_grocery: 'Your grocery cart is empty!',
    empty_grocery_hint: 'Add ingredients from your recipe ideas, meal plans, or routine grocery templates.',
    clear_in_cart_btn: 'Clear Checked Items',

    // Stock Kitchen Modal
    stock_modal_title: 'Stock Cart Items into Kitchen',
    stock_modal_subtitle: 'Move purchased grocery items into your Fridge, Freezer, or Pantry with auto-calculated shelf life.',
    stock_confirm_btn: 'Confirm & Stock into Kitchen',
    stock_success_toast: 'Successfully moved {count} items to your kitchen inventory!',

    // Saved Lists Modal
    saved_lists_title: 'Saved Grocery Lists & Routine Packs',
    saved_lists_subtitle: 'Quickly restock your kitchen with curated routine packs and custom saved lists',
    save_current_as_list: '+ Save Current Cart as New List',
    tab_routine_packs: 'Curated Routine Packs',
    tab_my_lists: 'My Custom Lists',
    btn_add_to_cart: 'Add to Cart',
    btn_replace_cart: 'Replace Cart',
    list_saved_toast: 'Saved current cart as "{name}"!',

    // Meal Planner View
    meal_planner_title: 'Meal Planner & Calendar',
    meal_planner_subtitle: 'Plan your weekly meals, balance nutrition, and rescue expiring groceries',
    view_week: 'Week',
    view_month: 'Month',
    btn_today: 'Today',
    btn_prev: 'Prev',
    btn_next: 'Next',
    slot_breakfast: 'Breakfast',
    slot_lunch: 'Lunch',
    slot_dinner: 'Dinner',
    slot_snack: 'Snack',
    btn_add_meal: '+ Add Meal',
    btn_mark_cooked: 'Mark as Cooked',
    badge_cooked: 'Cooked',
    missing_ingredients: 'Missing Ingredients:',
    btn_push_to_grocery: 'Add to Grocery List',
    modal_plan_meal: 'Plan a Meal',
    modal_edit_meal: 'Edit Meal',
    field_meal_title: 'Meal Title',
    field_meal_type: 'Meal Slot',
    field_date: 'Date',
    field_servings: 'Servings',
    field_prep_time: 'Prep Time (mins)',
    field_ingredients: 'Ingredients (one per line)',
    field_ingredients_placeholder: 'e.g.,\n2 Chicken Breasts\n1 cup Jasmine Rice\n1 Broccoli Crown',
    btn_save_meal: 'Save Meal',

    // Family Sync View
    family_title: 'Household & Family Sync',
    family_subtitle: 'Real-time collaborative access for all household members',
    household_name: 'Household: The Yan & Kriz Kitchen',
    invite_code_label: 'Household Invite Code:',
    btn_copy_code: 'Copy Link',
    code_copied: 'Copied!',
    household_members: 'Household Members ({count})',
    active_profile: 'Active Profile',
    btn_switch_profile: 'Switch Profile',
    role_admin: 'Admin',
    role_member: 'Member',
    role_guest: 'Guest',

    // Install Guidance Modal (iOS / Android)
    install_modal_title: 'Install Pantryo Web App',
    install_modal_subtitle: 'Add directly to your iPhone or Android home screen',
    install_step_iphone_title: 'On iPhone (Safari):',
    install_step_iphone_desc: 'Tap the Share button (square with arrow), scroll down and tap "Add to Home Screen".',
    install_step_android_title: 'On Android (Chrome) or PC:',
    install_step_android_desc: 'Tap the menu ⋮ in your browser and select "Install App" or "Add to Home Screen".',
    btn_got_it: 'Got It!',

    // Units
    unit_pcs: 'pcs',
    unit_pack: 'pack',
    unit_carton: 'carton',
    unit_bottle: 'bottle',
    unit_can: 'can',
    unit_box: 'box',
    unit_lbs: 'lbs',
    unit_kg: 'kg',
    unit_g: 'g',
    unit_oz: 'oz',
  },

  FR: {
    // Top Navigation & Branding
    app_name: 'Pantryo',
    kitchen_name: 'La Cuisine de Yan & Kriz',
    nav_inventory: 'Inventaire',
    nav_meals: 'Planificateur',
    nav_grocery: 'Épicerie',
    nav_cooking: 'Recettes',
    nav_family: 'Famille',
    install_btn: 'Installer',
    install_tooltip: "Installer l'application Pantryo sur votre téléphone",

    // Mobile Bottom Nav
    bottom_home: 'Accueil',
    bottom_meals: 'Repas',
    bottom_grocery: 'Épicerie',
    bottom_cooking: 'Recettes',
    bottom_family: 'Famille',

    // Pulse & Bento Stats
    bento_pulse_title: 'Pouls Bento Cuisine',
    bento_pulse_subtitle: '96% Efficacité Zéro-Gaspillage',
    live_sync: 'En Direct',
    fridge_label: 'Frigo',
    freezer_label: 'Congélateur',
    pantry_label: 'Garde-manger',
    items_count: '{count} aliments',
    rescue_label: 'Anti-Gaspillage',
    rescue_soon: '{count} bientôt',
    day_left: '{count} jour restant',
    days_left: '{count} jours restants',
    all_fresh_safe: 'Tout est frais & sûr',
    deep_freeze_label: 'Grand Froid',
    items_stored: '{count} articles stockés',
    defrost_ready: 'Prêt à décongeler',

    // Search & Add Bar
    search_placeholder: 'Rechercher aliments, viandes, légumes...',
    quick_add_btn: '+ Ajouter',
    quick_add_tooltip: 'Ajouter un aliment manuellement',

    // Categories & Subcategories
    browse_by_category: 'Parcourir par Catégorie',
    types_count: '({count} catégories)',
    clear_filter: 'Effacer le filtre',
    all_categories: 'Tous',
    meat_cuts_title: '🥩 Coupes de Viande, Poissons & Sous-catégories',
    visual_cuts_count: '({count} coupes illustrées)',
    reset_cut_filter: 'Réinitialiser les coupes',
    all_cuts: 'Toutes les coupes',

    // Location Tabs & Bento switcher
    all_zones: 'Toutes les zones',
    grid_mode_title: 'Mode Grille Bento',
    list_mode_title: 'Mode Liste',

    // Inventory Item Card & Bento
    click_to_edit: "Cliquer pour modifier l'aliment",
    defrost_to_fridge: 'Décongeler vers frigo',
    defrosting: 'Décongélation...',
    safe_in_freezer: 'Sûr au congélateur',
    frozen_months: 'Congelé {count} mois',
    add_to_grocery: '+ Épicerie',
    edit_action: 'Modifier',
    delete_action: 'Supprimer',
    confirm_delete: 'Voulez-vous vraiment supprimer cet aliment ?',
    loading_inventory: "Chargement de l'inventaire...",
    no_items_match: 'Aucun article ne correspond à ce filtre',
    no_items_hint: "Essayez de sélectionner 'Tous' ou utilisez le bouton SCANNER & AJOUTER ci-dessous pour numériser avec Gemini Flash Vision !",

    // Floating Action Buttons
    floating_add_item: 'AJOUTER',
    floating_snap_add: 'SCANNER & AJOUTER !',
    floating_manual_tooltip: 'Ajouter un aliment manuellement',
    floating_snap_tooltip: 'Scanner avec la caméra',

    // Common Locations
    loc_fridge: 'Réfrigérateur',
    loc_freezer: 'Congélateur',
    loc_pantry: 'Garde-manger',

    // Add / Edit Modal
    modal_add_title: 'Ajouter un Aliment',
    modal_edit_title: "Modifier l'Aliment",
    modal_add_subtitle: 'Entrez les détails pour votre réfrigérateur, congélateur ou garde-manger.',
    field_name: "Nom de l'aliment *",
    field_name_placeholder: 'ex. Pommes Honeycrisp bio, Bifteck de faux-filet...',
    field_location: 'Lieu de stockage',
    field_category: 'Catégorie alimentaire',
    field_meat_cut: 'Coupe ou Variété spécifique (Facultatif)',
    field_meat_cut_placeholder: 'Sélectionner une coupe...',
    field_quantity: 'Quantité',
    field_unit: 'Unité',
    field_expiration: 'Date de péremption',
    quick_presets: 'Raccourcis rapides :',
    preset_3_days: '+3 Jours',
    preset_1_week: '+1 Semaine',
    preset_2_weeks: '+2 Semaines',
    preset_1_month: '+1 Mois',
    preset_6_months: '+6 Mois (Congélateur)',
    field_image_url: "URL de l'image (Facultatif)",
    field_image_placeholder: 'https://images.unsplash.com/...',
    field_notes: 'Notes / Détails de conservation (Facultatif)',
    field_notes_placeholder: "ex. Ouvert mardi, bac à légumes du bas...",
    btn_cancel: 'Annuler',
    btn_save_changes: 'Enregistrer',
    btn_add_to_inventory: "Ajouter à l'inventaire",
    btn_saving: 'Enregistrement...',
    btn_delete_item: "Supprimer l'aliment",

    // Camera & Scanner Modal
    scanner_title: 'Caméra IA & Scanner Intelligent',
    scanner_subtitle: 'Reconnaissance instantanée des aliments, code-barres et dates avec Gemini Flash',
    tab_snap: 'Photo IA (Intelligente)',
    tab_barcode: 'Code-barres (UPC)',
    tab_upload: 'Téléverser Photo',
    tab_presets: 'Exemples Rapides',
    btn_take_photo: 'Prendre une photo',
    btn_retake: 'Reprendre',
    btn_upload_image: 'Choisir une image',
    btn_scan_now: 'Scanner avec Gemini IA',
    scanning_in_progress: "Analyse des aliments avec Gemini Vision...",
    looking_up_upc: 'Recherche du code-barres...',
    detected_items_title: 'Aliments détectés ({count})',
    btn_select_all: 'Tout sélectionner',
    btn_add_selected: 'Ajouter la sélection ({count})',
    btn_adding: 'Ajout en cours...',
    scan_empty: 'Aucun aliment détecté. Prenez une photo plus claire avec un bon éclairage.',
    manual_upc_label: 'Numéro de code-barres :',
    manual_upc_btn: 'Rechercher le code',
    or_manual_add: 'Ou ajouter manuellement',

    // Grocery List View
    grocery_title: "Liste d'Épicerie",
    grocery_subtitle: 'Panier collaboratif en temps réel pour votre cuisine',
    btn_saved_lists: 'Listes Types & Modèles',
    btn_stock_kitchen: 'Ranger le panier en cuisine',
    filter_all: 'Tous',
    filter_to_buy: 'À acheter',
    filter_in_cart: 'Dans le panier',
    input_item_name: 'Article à acheter...',
    btn_add_grocery: 'Ajouter',
    quick_add_directly_to_cart: 'Mettre directement au panier',
    in_cart_badge: 'Au panier',
    mark_in_cart: 'Marquer comme pris',
    empty_grocery: "Votre panier d'épicerie est vide !",
    empty_grocery_hint: 'Ajoutez des ingrédients depuis vos recettes, vos repas planifiés ou vos listes types.',
    clear_in_cart_btn: 'Vider les articles pris',

    // Stock Kitchen Modal
    stock_modal_title: 'Ranger les courses en cuisine',
    stock_modal_subtitle: 'Déplacez vos articles achetés vers le frigo, congélateur ou garde-manger avec calcul automatique de conservation.',
    stock_confirm_btn: 'Confirmer & Ranger en Cuisine',
    stock_success_toast: '{count} articles rangés avec succès dans votre cuisine !',

    // Saved Lists Modal
    saved_lists_title: 'Listes Types & Paniers Fréquents',
    saved_lists_subtitle: 'Remplissez rapidement votre épicerie grâce aux modèles préétablis et à vos listes enregistrées',
    save_current_as_list: '+ Enregistrer le panier comme nouvelle liste',
    tab_routine_packs: 'Paniers Essentiels Types',
    tab_my_lists: 'Mes Listes Personnalisées',
    btn_add_to_cart: 'Ajouter au Panier',
    btn_replace_cart: 'Remplacer le Panier',
    list_saved_toast: 'Panier enregistré sous "{name}" !',

    // Meal Planner View
    meal_planner_title: 'Planificateur de Repas & Calendrier',
    meal_planner_subtitle: 'Planifiez vos repas de la semaine, équilibrez vos menus et sauvez les aliments qui périment',
    view_week: 'Semaine',
    view_month: 'Mois',
    btn_today: "Aujourd'hui",
    btn_prev: 'Précédent',
    btn_next: 'Suivant',
    slot_breakfast: 'Déjeuner',
    slot_lunch: 'Dîner',
    slot_dinner: 'Souper',
    slot_snack: 'Collation',
    btn_add_meal: '+ Ajouter un repas',
    btn_mark_cooked: 'Marquer comme cuisiné',
    badge_cooked: 'Cuisiné',
    missing_ingredients: 'Ingrédients manquants :',
    btn_push_to_grocery: "Ajouter à l'épicerie",
    modal_plan_meal: 'Planifier un Repas',
    modal_edit_meal: 'Modifier le Repas',
    field_meal_title: 'Titre du repas',
    field_meal_type: 'Type de repas',
    field_date: 'Date',
    field_servings: 'Portions',
    field_prep_time: 'Temps de prép. (min)',
    field_ingredients: 'Ingrédients (un par ligne)',
    field_ingredients_placeholder: 'ex.,\n2 Poitrines de poulet\n1 tasse de Riz au jasmin\n1 Tête de brocoli',
    btn_save_meal: 'Enregistrer le repas',

    // Family Sync View
    family_title: 'Foyer & Synchronisation Familiale',
    family_subtitle: 'Accès collaboratif en temps réel pour tous les membres du foyer',
    household_name: 'Foyer : La Cuisine de Yan & Kriz',
    invite_code_label: "Code d'invitation du foyer :",
    btn_copy_code: "Copier le lien",
    code_copied: 'Copié !',
    household_members: 'Membres du Foyer ({count})',
    active_profile: 'Profil Actif',
    btn_switch_profile: 'Changer de profil',
    role_admin: 'Administrateur',
    role_member: 'Membre',
    role_guest: 'Invité',

    // Install Guidance Modal (iOS / Android)
    install_modal_title: "Installer l'application Pantryo",
    install_modal_subtitle: "Ajoutez directement à l'écran d'accueil de votre iPhone ou Android",
    install_step_iphone_title: 'Sur iPhone (Safari) :',
    install_step_iphone_desc: "Touchez l'icône Partager (carré avec flèche vers le haut), faites défiler et touchez « Sur l'écran d'accueil ».",
    install_step_android_title: 'Sur Android (Chrome) ou PC :',
    install_step_android_desc: "Touchez le menu ⋮ dans la barre du navigateur et sélectionnez « Installer l'application » ou « Ajouter à l'écran d'accueil ».",
    btn_got_it: 'Compris !',

    // Units
    unit_pcs: 'unités',
    unit_pack: 'paquet',
    unit_carton: 'carton',
    unit_bottle: 'bouteille',
    unit_can: 'boîte/can',
    unit_box: 'boîte',
    unit_lbs: 'lbs',
    unit_kg: 'kg',
    unit_g: 'g',
    unit_oz: 'oz',
  },
};

export type TranslationKey = keyof typeof translations.EN;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'EN',
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LANG_KEY);
      if (saved === 'FR' || saved === 'EN') {
        return saved;
      }
      // Auto-detect browser language if french
      if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('fr')) {
        return 'FR';
      }
    } catch {
      // ignore
    }
    return 'EN';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(LOCAL_STORAGE_LANG_KEY, newLang);
    } catch {
      // ignore
    }
  };

  const toggleLang = () => {
    setLang(lang === 'EN' ? 'FR' : 'EN');
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = translations[lang] || translations.EN;
    let str = dict[key] || translations.EN[key] || (key as string);
    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        str = str.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Category translation helper
 */
const CATEGORY_NAMES_FR: Record<string, string> = {
  Produce: 'Fruits & Légumes',
  Dairy: 'Produits Laitiers & Œufs',
  'Dairy & Eggs': 'Produits Laitiers & Œufs',
  Meat: 'Viandes & Poissons',
  'Meat & Seafood': 'Viandes & Poissons',
  'Meat & Poultry': 'Viandes & Volailles',
  Bakery: 'Boulangerie',
  Pantry: 'Garde-manger & Épicerie',
  'Pantry Staples': 'Garde-manger & Épicerie',
  Frozen: 'Surgelés & Plats Congelés',
  'Frozen Meals': 'Surgelés & Plats Congelés',
  Beverages: 'Boissons',
  Snacks: 'Collations & Friandises',
  Condiments: 'Condiments & Sauces',
  Spices: 'Épices & Assaisonnements',
};

export const getCategoryLocalizedName = (catName: string, lang: Language): string => {
  if (lang === 'FR') {
    return CATEGORY_NAMES_FR[catName] || catName;
  }
  return catName;
};

/**
 * Subcategory cuts translation helper
 */
const SUBCATEGORY_NAMES_FR: Record<string, string> = {
  'Beef Steaks & Prime Cuts': 'Biftecks & Coupes de Bœuf',
  'Prime Beef': 'Bœuf de Premier Choix',
  'Ground Beef & Minced Meat': 'Bœuf Haché & Viandes Hachées',
  'Ground Beef': 'Bœuf Haché',
  'Chicken Breasts & Cutlets': 'Poitrines de Poulet & Escalopes',
  'Chicken Breasts': 'Poitrines de Poulet',
  'Chicken Thighs & Drumsticks': 'Cuisses & Pilons de Poulet',
  'Chicken Thighs': 'Cuisses de Poulet',
  'Whole Chicken & Roaster': 'Poulet Entier à Rôtir',
  'Whole Chicken': 'Poulet Entier',
  'Pork Chops & Tenderloin': 'Côtelettes & Filet de Porc',
  'Pork Chops': 'Côtelettes de Porc',
  'Bacon & Cured Pork': 'Bacon & Lardons Fumés',
  'Smoked Bacon': 'Bacon Fumé',
  'Sausages & Bratwurst': 'Saucisses & Merguez',
  'Fresh Sausages': 'Saucisses Fraîches',
  'Lamb Chops & Leg of Lamb': "Côtelettes & Gigot d'Agneau",
  'Lamb Cuts': "Coupes d'Agneau",
  'Fresh Salmon Fillets': 'Filets de Saumon Frais',
  'Fresh Salmon': 'Saumon Frais',
  'Smoked Salmon & Lox': 'Saumon Fumé & Gravlax',
  'Smoked Lox': 'Saumon Fumé',
  'White Fish Fillets (Cod, Halibut, Tilapia)': 'Filets de Poisson Blanc (Morue, Flétan)',
  'White Fish': 'Poisson Blanc',
  'Ahi Tuna & Steaks': 'Thon Ahi & Steaks',
  'Ahi Tuna': 'Thon Ahi',
  'Shrimp & Prawns': 'Crevettes & Gambas',
  'Scallops & Shellfish': 'Pétoncles & Coquillages',
  'Sea Scallops': 'Pétoncles Frais',
};

export const getSubcategoryLocalizedName = (subName: string, lang: Language): string => {
  if (lang === 'FR') {
    return SUBCATEGORY_NAMES_FR[subName] || subName;
  }
  return subName;
};

/**
 * Storage location localized labels
 */
export const getLocationLocalizedName = (
  loc: 'FRIDGE' | 'FREEZER' | 'PANTRY' | string,
  lang: Language
): string => {
  if (lang === 'FR') {
    if (loc === 'FRIDGE') return 'Frigo';
    if (loc === 'FREEZER') return 'Congélateur';
    if (loc === 'PANTRY') return 'Garde-manger';
    return loc;
  }
  if (loc === 'FRIDGE') return 'Fridge';
  if (loc === 'FREEZER') return 'Freezer';
  if (loc === 'PANTRY') return 'Pantry';
  return loc;
};

/**
 * Compact Language Switcher Button Component
 */
export const LanguageSwitcher: React.FC<{
  className?: string;
  compact?: boolean;
}> = ({ className = '', compact = false }) => {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-xl p-0.5 bg-white/95 border border-[#E0D9C8] shadow-2xs text-xs font-black ${className}`}
      role="group"
      aria-label="Language selection"
    >
      <button
        type="button"
        onClick={() => setLang('EN')}
        className={`px-2 py-1 rounded-lg transition-all ${
          lang === 'EN'
            ? 'bg-teal-700 text-white shadow-2xs scale-102'
            : 'text-[#527470] hover:text-[#0D3B37] hover:bg-[#F2ECE0]'
        }`}
        title="Switch to English"
      >
        <span>EN</span>
      </button>
      <button
        type="button"
        onClick={() => setLang('FR')}
        className={`px-2 py-1 rounded-lg transition-all ${
          lang === 'FR'
            ? 'bg-teal-700 text-white shadow-2xs scale-102'
            : 'text-[#527470] hover:text-[#0D3B37] hover:bg-[#F2ECE0]'
        }`}
        title="Passer en français"
      >
        <span>FR</span>
      </button>
    </div>
  );
};
