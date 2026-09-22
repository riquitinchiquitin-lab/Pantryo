import { RecipeWebsiteSource } from '../types';

export type { RecipeWebsiteSource };

export const LOCAL_STORAGE_RECIPE_WEBSITES = 'pantryo_recipe_websites_pref';

export const DEFAULT_RECIPE_WEBSITES: RecipeWebsiteSource[] = [
  {
    id: 'site_ricardo',
    name: 'Ricardo Cuisine',
    url: 'https://www.ricardocuisine.com',
    domain: 'ricardocuisine.com',
    language: 'BOTH',
    enabled: true,
    description: 'Premier Canadian culinary institution with balanced family-friendly recipes.',
    descriptionFr: 'Référence culinaire québécoise et canadienne aux recettes équilibrées.',
  },
  {
    id: 'site_marmiton',
    name: 'Marmiton',
    url: 'https://www.marmiton.org',
    domain: 'marmiton.org',
    language: 'FR',
    enabled: true,
    description: 'The largest French community recipe portal with hundreds of thousands of dishes.',
    descriptionFr: 'Le plus grand portail français de recettes créatives et familiales.',
  },
  {
    id: 'site_750g',
    name: '750g',
    url: 'https://www.750g.com',
    domain: '750g.com',
    language: 'FR',
    enabled: true,
    description: 'Famous French chef and community-curated daily meal ideas and tutorials.',
    descriptionFr: 'Idées de repas quotidiennes créées par des chefs et passionnés.',
  },
  {
    id: 'site_cuisineaz',
    name: 'Cuisine AZ',
    url: 'https://www.cuisineaz.com',
    domain: 'cuisineaz.com',
    language: 'FR',
    enabled: true,
    description: 'Practical French everyday cooking with seasonal tips and quick budget meals.',
    descriptionFr: 'Recettes simples, rapides et économiques pour le quotidien.',
  },
  {
    id: 'site_troisfoisparjour',
    name: 'Trois Fois Par Jour',
    url: 'https://www.troisfoisparjour.com',
    domain: 'troisfoisparjour.com',
    language: 'BOTH',
    enabled: true,
    description: 'Marilou’s celebrated healthy, modern aesthetic cooking from Montreal.',
    descriptionFr: 'Cuisine moderne, réconfortante et soignée signée Marilou.',
  },
  {
    id: 'site_seriouseats',
    name: 'Serious Eats',
    url: 'https://www.seriouseats.com',
    domain: 'seriouseats.com',
    language: 'EN',
    enabled: true,
    description: 'Culinary science, foolproof technique, and meticulously tested comfort classics.',
    descriptionFr: 'Science culinaire, techniques éprouvées et recettes ultra-testées.',
  },
  {
    id: 'site_allrecipes',
    name: 'Allrecipes',
    url: 'https://www.allrecipes.com',
    domain: 'allrecipes.com',
    language: 'EN',
    enabled: true,
    description: 'World’s largest community recipe sharing network with genuine home cook reviews.',
    descriptionFr: 'Grand réseau communautaire mondial de recettes maison commentées.',
  },
  {
    id: 'site_bbcgoodfood',
    name: 'BBC Good Food',
    url: 'https://www.bbcgoodfood.com',
    domain: 'bbcgoodfood.com',
    language: 'EN',
    enabled: true,
    description: 'Triple-tested British and international recipes with nutrition info.',
    descriptionFr: 'Recettes internationales testées avec informations nutritionnelles complètes.',
  },
  {
    id: 'site_budgetbytes',
    name: 'Budget Bytes',
    url: 'https://www.budgetbytes.com',
    domain: 'budgetbytes.com',
    language: 'EN',
    enabled: true,
    description: 'Delicious, smart zero-waste cooking designed for maximum flavor on a budget.',
    descriptionFr: 'Cuisine astucieuse, économique et anti-gaspillage pleine de saveurs.',
  },
  {
    id: 'site_nytcooking',
    name: 'NYT Cooking',
    url: 'https://cooking.nytimes.com',
    domain: 'cooking.nytimes.com',
    language: 'EN',
    enabled: false,
    description: 'Premium curated restaurant-quality recipes from the New York Times.',
    descriptionFr: 'Recettes haut de gamme et guides culinaires du New York Times.',
  },
  {
    id: 'site_chefclub',
    name: 'Chefclub',
    url: 'https://www.chefclub.tv',
    domain: 'chefclub.tv',
    language: 'BOTH',
    enabled: false,
    description: 'Fun, viral and highly visual twist recipes for entertaining.',
    descriptionFr: 'Recettes ludiques, créatives et visuelles à partager.',
  },
];

export function getStoredRecipeWebsites(): RecipeWebsiteSource[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_RECIPE_WEBSITES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load recipe websites from localStorage', e);
  }
  return DEFAULT_RECIPE_WEBSITES;
}

export function saveStoredRecipeWebsites(sites: RecipeWebsiteSource[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_RECIPE_WEBSITES, JSON.stringify(sites));
  } catch (e) {
    console.warn('Failed to save recipe websites to localStorage', e);
  }
}
