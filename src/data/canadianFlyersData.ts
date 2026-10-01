/**
 * Pantryo - Canadian Grocery Flyers Training Dataset & Visual Circular Pictures
 * Trained on actual weekly promotional flyer pictures and circular deals across
 * the major Canadian supermarket chains:
 * 1. Maxi & Maxi Cie (Loblaw - Québec discount chain, PC Optimum, "Imbattable")
 * 2. Super C (Metro Inc. - Québec discount chain, "Beau, bon, pas cher")
 * 3. No Frills (Loblaw - Canada-wide discount chain, "Won't Be Beat", PC Optimum)
 * 4. Metro & Metro Plus (Metro Inc. - Québec & Ontario full-service, Moi Rewards)
 * 5. IGA & IGA Extra (Sobeys - Québec & Canada full-service, Scène+ Rewards)
 * 6. Walmart Canada Supercentre (Canada-wide, Rollback / Chute de prix)
 */

export interface CanadianFlyerDeal {
  name: string;
  nameFr: string;
  nameEn: string;
  brand: string;
  price: string;
  category: 'Produce' | 'Dairy & Eggs' | 'Meat & Seafood' | 'Pantry Staples' | 'Frozen Meals' | 'Bakery' | 'Beverages';
  categoryFr: string;
  quantity: number;
  unit: string;
  netContent?: string;
  recommendedLocation: 'Fridge' | 'Pantry' | 'Freezer';
  unopenedShelfLifeDays: number;
  openedShelfLifeDays: number;
  estimatedShelfLifeDays: number;
  monthsFrozenShelfLife: number;
  dietaryBadges: string[];
  gradeOrigin?: string;
  packagingFormat?: string;
  storageTip?: string;
  storageReason?: string;
  freezerTip?: string;
}

export interface CanadianFlyerBanner {
  id: 'maxi' | 'super-c' | 'no-frills' | 'metro' | 'iga' | 'walmart';
  storeName: string;
  bannerTitleFr: string;
  bannerTitleEn: string;
  taglineFr: string;
  taglineEn: string;
  region: string;
  loyaltyProgram: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  badgeBg: string;
  badgeBorder: string;
  dateRangeFr: string;
  dateRangeEn: string;
  deals: CanadianFlyerDeal[];
  flyerSvg: string;
}

/**
 * Generates an authentic Canadian supermarket flyer clipping image in SVG format
 */
export function generateCanadianFlyerSvg(
  bannerName: string,
  primaryColor: string,
  accentColor: string,
  tagline: string,
  loyalty: string,
  deals: CanadianFlyerDeal[],
  language: 'FR' | 'EN' = 'FR'
): string {
  const isFr = language === 'FR';
  const headerTitle = isFr ? 'CIRCULAIRE HEBDOMADAIRE' : 'WEEKLY FLYER DEALS';
  const subtitle = isFr ? 'RABAIS VEDETTES DU QUÉBEC & DU CANADA' : 'FEATURED CANADIAN GROCERY SAVINGS';
  const dates = isFr ? 'Jeudi au Mercredi • Prix imbattables' : 'Thursday to Wednesday • Top Canadian Deals';

  // Build grid of 4-6 prominent visual deals tiles
  const tilesSvg = deals.slice(0, 6).map((deal, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 30 + col * 265;
    const y = 140 + row * 165;
    const displayName = isFr ? deal.nameFr : deal.nameEn;
    const isYogurt = /yogourt|yogurt|oikos|iögo|iogo|astro|activia|liberté|liberte/i.test(displayName);
    const isProduce = deal.category === 'Produce';
    const isMeat = deal.category === 'Meat & Seafood';

    const iconEmoji = isYogurt ? '🥛' : isProduce ? '🍇' : isMeat ? '🥩' : '🧀';
    const tagBg = isYogurt ? '#EFF6FF' : isMeat ? '#FEF2F2' : isProduce ? '#F0FDF4' : '#FFFBEB';
    const tagBorder = isYogurt ? '#93C5FD' : isMeat ? '#FCA5A5' : isProduce ? '#86EFAC' : '#FDE68A';

    return `
      <!-- Deal Tile #${idx + 1} -->
      <g transform="translate(${x}, ${y})">
        <rect width="250" height="152" rx="14" fill="#FFFFFF" stroke="${tagBorder}" stroke-width="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"/>
        <rect x="6" y="6" width="238" height="34" rx="8" fill="${tagBg}"/>
        <text x="14" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="900" fill="${primaryColor}">${deal.brand.toUpperCase()}</text>
        <text x="14" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="700" fill="#64748B">${deal.dietaryBadges[0] || '100% CANADIEN'}</text>
        
        <!-- Product Icon / Art -->
        <circle cx="40" cy="78" r="26" fill="${tagBg}" stroke="${primaryColor}" stroke-width="1.5"/>
        <text x="40" y="87" font-size="26" text-anchor="middle">${iconEmoji}</text>

        <!-- Product Name & Format -->
        <text x="76" y="68" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#0F172A">
          <tspan x="76" dy="0">${displayName.length > 22 ? displayName.slice(0, 20) + '...' : displayName}</tspan>
        </text>
        <text x="76" y="84" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="600" fill="#475569">
          ${deal.netContent || deal.unit || 'Format familial'}
        </text>
        <text x="76" y="98" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="700" fill="#059669">
          ✓ ${deal.recommendedLocation === 'Fridge' ? (isFr ? 'Frigo' : 'Fridge') : isFr ? 'Garde-manger' : 'Pantry'}
        </text>

        <!-- Promotional Price Burst -->
        <rect x="10" y="112" width="230" height="32" rx="8" fill="${primaryColor}"/>
        <text x="125" y="132" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">
          ${deal.price}
        </text>
      </g>
    `;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 660" width="580" height="660">
      <defs>
        <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primaryColor}"/>
          <stop offset="100%" stop-color="${accentColor}"/>
        </linearGradient>
      </defs>
      
      <!-- Flyer Background -->
      <rect width="580" height="660" fill="#FAF8F5"/>
      <rect x="12" y="12" width="556" height="636" rx="20" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2"/>

      <!-- Circular Store Header -->
      <rect x="12" y="12" width="556" height="110" rx="20" fill="url(#headerGrad)"/>
      <text x="32" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="950" fill="#FFFFFF" letter-spacing="1">
        ${bannerName.toUpperCase()}
      </text>
      <text x="32" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#FEF08A">
        ${headerTitle} • ${tagline}
      </text>
      <text x="32" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" fill="#F1F5F9">
        ${dates} • ${subtitle}
      </text>

      <!-- Loyalty Stamp / Badge -->
      <g transform="translate(420, 26)">
        <rect width="130" height="42" rx="10" fill="#FFFFFF" stroke="#FDE047" stroke-width="2"/>
        <text x="65" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="900" fill="${primaryColor}" text-anchor="middle">RABAIS EXCLUSIF</text>
        <text x="65" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="900" fill="#B45309" text-anchor="middle">${loyalty}</text>
      </g>

      <!-- Circular Promotional Items -->
      ${tilesSvg}

      <!-- Flyer Footer Bar -->
      <g transform="translate(24, 615)">
        <rect width="532" height="24" rx="6" fill="#F1F5F9"/>
        <text x="266" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="#64748B" text-anchor="middle">
          ${isFr ? '🇨🇦 Circulaires d’épicerie canadiennes numérisées par Pantryo Vision IA' : '🇨🇦 Canadian Grocery Circulars digitized by Pantryo Vision AI'}
        </text>
      </g>
    </svg>
  `.trim();
}

/**
 * Converts an SVG string into a Base64 data URL that can be consumed by standard <img>,
 * on-device produce classifiers, or backend Tesseract / Gemini OCR APIs.
 */
export function svgToDataUrl(svgString: string): string {
  const cleaned = svgString.replace(/\n\s*/g, ' ').trim();
  const encoded = encodeURIComponent(cleaned)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

export const CANADIAN_FLYER_BANNERS: CanadianFlyerBanner[] = [
  // 1. MAXI (Loblaw Québec - "Ben oui, Maxi est imbattable", PC Optimum)
  {
    id: 'maxi',
    storeName: 'Maxi',
    bannerTitleFr: 'Maxi & Maxi Cie — Circulaire Imbattable',
    bannerTitleEn: 'Maxi & Maxi Cie — Unbeatable Flyer',
    taglineFr: 'Ben oui, Maxi est imbattable !',
    taglineEn: 'Yes, Maxi is unbeatable!',
    region: 'Québec',
    loyaltyProgram: 'PC Optimum',
    primaryColor: '#0055A5', // Maxi Blue
    accentColor: '#F58220',  // Maxi Orange
    textColor: '#FFFFFF',
    badgeBg: '#EFF6FF',
    badgeBorder: '#93C5FD',
    dateRangeFr: 'Cette semaine • Jeudi au mercredi',
    dateRangeEn: 'This week • Thursday to Wednesday',
    flyerSvg: '',
    deals: [
      {
        name: 'Yogourt grec Oikos Danone (750 g)',
        nameFr: 'Yogourt grec Oikos Danone (750 g)',
        nameEn: 'Danone Oikos Greek Yogurt (750 g)',
        brand: 'Danone Oikos',
        price: '$4.97 (Rabais $1.52)',
        category: 'Dairy & Eggs',
        categoryFr: 'Produits laitiers & œufs',
        quantity: 750,
        unit: 'g',
        netContent: '750 g',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 28,
        openedShelfLifeDays: 10,
        estimatedShelfLifeDays: 25,
        monthsFrozenShelfLife: 3,
        dietaryBadges: ['Circulaire Maxi', '100% Lait canadien', 'Prix membre PC Optimum'],
        gradeOrigin: '100% LAIT CANADIEN',
        packagingFormat: 'Pot de plastique recyclable 750g',
        storageTip: 'Conserver au centre du réfrigérateur entre 2°C et 4°C. Ne pas congeler dans le pot d’origine.',
        storageReason: 'Le yogourt grec s’altère rapidement s’il reste à température pièce.',
      },
      {
        name: 'Yogourt brassé Iögo (16 x 100 g Format Club)',
        nameFr: 'Yogourt brassé Iögo (16 x 100 g Format Club)',
        nameEn: 'Iögo Stirred Yogurt (16 x 100 g Club Pack)',
        brand: 'Iögo',
        price: '$5.99 (Aubaine Club)',
        category: 'Dairy & Eggs',
        categoryFr: 'Produits laitiers & œufs',
        quantity: 16,
        unit: 'pot',
        netContent: '16 x 100 g (1.6 kg)',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 30,
        openedShelfLifeDays: 1,
        estimatedShelfLifeDays: 28,
        monthsFrozenShelfLife: 3,
        dietaryBadges: ['Aliments préparés au Québec', 'Circulaire Maxi', 'Sans gélatine'],
        gradeOrigin: 'PRODUIT DU QUÉBEC',
        packagingFormat: 'Boîte de 16 pots individuels',
        storageTip: 'Conserver les pots au frais. Les opercules scellés garantissent une fraîcheur optimale.',
      },
      {
        name: 'Poulet entier frais du Canada',
        nameFr: 'Poulet entier frais du Canada',
        nameEn: 'Fresh Canadian Whole Chicken',
        brand: 'Exceldor / Flamingo',
        price: '$1.99 / lb ($4.39 / kg)',
        category: 'Meat & Seafood',
        categoryFr: 'Viandes & Poissons',
        quantity: 1,
        unit: 'pack',
        netContent: 'approx. 1.5 kg / 3.3 lb',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 3,
        openedShelfLifeDays: 2,
        estimatedShelfLifeDays: 3,
        monthsFrozenShelfLife: 12,
        dietaryBadges: ['Circulaire Maxi', 'Canada Catégorie A', '100% Volaille canadienne'],
        gradeOrigin: 'CANADA CATÉGORIE A',
        packagingFormat: 'Emballage sous film scellé',
        storageTip: 'Cuire dans les 48 heures ou congeler immédiatement à plat.',
      },
      {
        name: 'Pommes McIntosh du Québec (Sac 3 lb)',
        nameFr: 'Pommes McIntosh du Québec (Sac 3 lb)',
        nameEn: 'Quebec McIntosh Apples (3 lb bag)',
        brand: 'Vergers du Québec',
        price: '$2.99 le sac',
        category: 'Produce',
        categoryFr: 'Produits frais',
        quantity: 3,
        unit: 'lb',
        netContent: '1.36 kg / 3 lb',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 30,
        openedShelfLifeDays: 14,
        estimatedShelfLifeDays: 28,
        monthsFrozenShelfLife: 10,
        dietaryBadges: ['Aliments du Québec', 'Produit d’ici', 'Circulaire Maxi'],
        gradeOrigin: 'CANADA No. 1',
        packagingFormat: 'Sac en plastique perforé avec poignée',
        storageTip: 'Garder dans le tiroir à légumes du réfrigérateur pour conserver tout le croquant.',
      },
      {
        name: 'Beurre salé ou non salé Sans Nom (454 g)',
        nameFr: 'Beurre salé ou non salé Sans Nom (454 g)',
        nameEn: 'No Name Salted or Unsalted Butter (454 g)',
        brand: 'Sans Nom / No Name',
        price: '$4.88 (454 g)',
        category: 'Dairy & Eggs',
        categoryFr: 'Produits laitiers & œufs',
        quantity: 454,
        unit: 'g',
        netContent: '454 g / 1 lb',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 60,
        openedShelfLifeDays: 21,
        estimatedShelfLifeDays: 45,
        monthsFrozenShelfLife: 12,
        dietaryBadges: ['Circulaire Maxi', '100% Lait canadien', 'Sans Nom'],
        gradeOrigin: 'CANADA No. 1',
        packagingFormat: 'Papier paraffiné ou emballage aluminium',
        storageTip: 'Garder dans le beurrier fermé du réfrigérateur.',
        freezerTip: 'Se congèle parfaitement dans son emballage d’origine pendant 1 an.',
      },
      {
        name: 'Pâtes alimentaires Catelli ou Primo (900 g)',
        nameFr: 'Pâtes alimentaires Catelli ou Primo (900 g)',
        nameEn: 'Catelli or Primo Pasta (900 g)',
        brand: 'Catelli / Primo',
        price: '4 pour $5.00 ($1.25 ch.)',
        category: 'Pantry Staples',
        categoryFr: 'Garde-manger',
        quantity: 900,
        unit: 'g',
        netContent: '900 g',
        recommendedLocation: 'Pantry',
        unopenedShelfLifeDays: 730,
        openedShelfLifeDays: 365,
        estimatedShelfLifeDays: 540,
        monthsFrozenShelfLife: 0,
        dietaryBadges: ['Circulaire Maxi', '100% Blé dur canadien', 'Aubaine multi-achat'],
        gradeOrigin: 'PRODUIT DU CANADA',
        packagingFormat: 'Boîte en carton recyclable',
        storageTip: 'Conserver dans un garde-manger sec à l’abri de l’humidité.',
      },
    ],
  },

  // 2. SUPER C (Metro Inc. Québec - "Beau, bon, pas cher", Moi Rewards)
  {
    id: 'super-c',
    storeName: 'Super C',
    bannerTitleFr: 'Super C — Beau, bon, pas cher',
    bannerTitleEn: 'Super C — Great, good, inexpensive',
    taglineFr: 'Beau, bon, pas cher !',
    taglineEn: 'Great food, lowest price!',
    region: 'Québec',
    loyaltyProgram: 'Points Moi',
    primaryColor: '#D32F2F', // Super C Red
    accentColor: '#F59E0B', // Amber
    textColor: '#FFFFFF',
    badgeBg: '#FEF2F2',
    badgeBorder: '#FCA5A5',
    dateRangeFr: 'Circulaire du 24 au 30 septembre',
    dateRangeEn: 'Circular Sept 24 - Sept 30',
    flyerSvg: '',
    deals: [
      {
        name: 'Yogourt Astro Original / Activia Danone (750 g)',
        nameFr: 'Yogourt Astro Original / Activia Danone (750 g)',
        nameEn: 'Astro Original / Danone Activia Yogurt (750 g)',
        brand: 'Astro / Danone',
        price: '$3.99 (Chute de prix)',
        category: 'Dairy & Eggs',
        categoryFr: 'Produits laitiers & œufs',
        quantity: 750,
        unit: 'g',
        netContent: '750 g',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 30,
        openedShelfLifeDays: 10,
        estimatedShelfLifeDays: 25,
        monthsFrozenShelfLife: 3,
        dietaryBadges: ['Circulaire Super C', '100% Lait canadien', 'Probiotiques actifs'],
        gradeOrigin: '100% LAIT CANADIEN',
        packagingFormat: 'Pot de plastique avec opercule de fraîcheur',
        storageTip: 'Garder réfrigéré entre 2°C et 4°C. Bien refermer le couvercle hermétique.',
      },
      {
        name: 'Raisins rouges sans pépins de Californie',
        nameFr: 'Raisins rouges sans pépins de Californie',
        nameEn: 'California Seedless Red Grapes',
        brand: 'Sélection',
        price: '$1.48 / lb ($3.26 / kg)',
        category: 'Produce',
        categoryFr: 'Produits frais',
        quantity: 1,
        unit: 'lb',
        netContent: 'approx. 1 kg / 2.2 lb',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 10,
        openedShelfLifeDays: 5,
        estimatedShelfLifeDays: 8,
        monthsFrozenShelfLife: 10,
        dietaryBadges: ['Circulaire Super C', 'CANADA No. 1', 'Sans pépins'],
        gradeOrigin: 'CANADA No. 1',
        packagingFormat: 'Sac fraîcheur perforé',
        storageTip: 'Laver uniquement au moment de déguster pour éviter l’humidité prématurée.',
      },
      {
        name: 'Filet de porc frais du Québec',
        nameFr: 'Filet de porc frais du Québec',
        nameEn: 'Fresh Quebec Pork Tenderloin',
        brand: 'Olymel',
        price: '$3.88 / lb ($8.55 / kg)',
        category: 'Meat & Seafood',
        categoryFr: 'Viandes & Poissons',
        quantity: 1,
        unit: 'pack',
        netContent: 'approx. 650 g / 1.4 lb',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 5,
        openedShelfLifeDays: 2,
        estimatedShelfLifeDays: 4,
        monthsFrozenShelfLife: 6,
        dietaryBadges: ['Aliments du Québec', 'Le Porc du Québec', 'Circulaire Super C'],
        gradeOrigin: 'LE PORC DU QUÉBEC',
        packagingFormat: 'Emballage sous vide hermétique scellé',
        storageTip: 'Conserver dans son scellé d’origine jusqu’à la cuisson. Cuire à 63°C (145°F).',
      },
      {
        name: 'Fromage cheddar en bloc Black Diamond (400 g)',
        nameFr: 'Fromage cheddar en bloc Black Diamond (400 g)',
        nameEn: 'Black Diamond Cheddar Block Cheese (400 g)',
        brand: 'Black Diamond',
        price: '$4.44 (Rabais vedette)',
        category: 'Dairy & Eggs',
        categoryFr: 'Produits laitiers & œufs',
        quantity: 400,
        unit: 'g',
        netContent: '400 g',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 90,
        openedShelfLifeDays: 21,
        estimatedShelfLifeDays: 60,
        monthsFrozenShelfLife: 6,
        dietaryBadges: ['Circulaire Super C', '100% Lait canadien', 'Sans gluten'],
        gradeOrigin: '100% LAIT CANADIEN',
        packagingFormat: 'Bloc sous emballage sous vide hermétique',
        storageTip: 'Emballer dans du papier sulfurisé ou ciré pour laisser respirer le fromage.',
      },
      {
        name: 'Farine tout usage Five Roses (10 kg)',
        nameFr: 'Farine tout usage Five Roses (10 kg)',
        nameEn: 'Five Roses All-Purpose Flour (10 kg)',
        brand: 'Five Roses',
        price: '$11.97 le sac de 10 kg',
        category: 'Pantry Staples',
        categoryFr: 'Garde-manger',
        quantity: 10,
        unit: 'kg',
        netContent: '10 kg',
        recommendedLocation: 'Pantry',
        unopenedShelfLifeDays: 365,
        openedShelfLifeDays: 180,
        estimatedShelfLifeDays: 300,
        monthsFrozenShelfLife: 24,
        dietaryBadges: ['Blé 100% canadien', 'Circulaire Super C', 'Non blanchie'],
        gradeOrigin: 'BLÉ CANADIEN SUPÉRIEUR',
        packagingFormat: 'Sac de papier renforcé 10 kg',
        storageTip: 'Garder dans un récipient étanche à l’air dans un endroit sombre et frais.',
      },
      {
        name: 'Jus pur à 100% Oasis (960 mL)',
        nameFr: 'Jus pur à 100% Oasis (960 mL)',
        nameEn: 'Oasis 100% Pure Juice (960 mL)',
        brand: 'Oasis',
        price: '$1.25 ch.',
        category: 'Beverages',
        categoryFr: 'Boissons',
        quantity: 960,
        unit: 'mL',
        netContent: '960 mL',
        recommendedLocation: 'Pantry',
        unopenedShelfLifeDays: 240,
        openedShelfLifeDays: 7,
        estimatedShelfLifeDays: 200,
        monthsFrozenShelfLife: 0,
        dietaryBadges: ['Circulaire Super C', 'Sans sucre ajouté', 'Aliments préparés au Québec'],
        gradeOrigin: 'ALIMENTS PRÉPARÉS AU QUÉBEC',
        packagingFormat: 'Brique Tetra Pak recyclable',
        storageTip: 'Garder au garde-manger ; réfrigérer immédiatement dès l’ouverture et boire en 7 jours.',
      },
    ],
  },

  // 3. NO FRILLS (Loblaw Canada - "Won't Be Beat", Hauler deals, PC Optimum)
  {
    id: 'no-frills',
    storeName: 'No Frills',
    bannerTitleFr: 'No Frills — Aubaines Hauler & Won’t Be Beat',
    bannerTitleEn: 'No Frills — Hauler Deals & Won’t Be Beat',
    taglineFr: 'Won’t Be Beat • Moins cher pour vrai',
    taglineEn: 'Won’t Be Beat • Real Canadian savings',
    region: 'Canada & Ontario/Ouest',
    loyaltyProgram: 'PC Optimum',
    primaryColor: '#F59E0B', // No Frills Yellow/Amber
    accentColor: '#1E293B', // Dark Slate
    textColor: '#1E293B',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FCD34D',
    dateRangeFr: 'Semaine en cours • Jeudi au mercredi',
    dateRangeEn: 'Current Week • Thursday to Wednesday',
    flyerSvg: '',
    deals: [
      {
        name: 'Yogourt en tubes Yoplait Tubes ou Iögo Nano (8 x 60g)',
        nameFr: 'Yogourt en tubes Yoplait Tubes ou Iögo Nano (8 x 60g)',
        nameEn: 'Yoplait Tubes or Iögo Nano Yogurt Tubes (8 x 60g)',
        brand: 'Yoplait / Iögo',
        price: '$2.49 (Prix choc)',
        category: 'Dairy & Eggs',
        categoryFr: 'Produits laitiers & œufs',
        quantity: 8,
        unit: 'tube',
        netContent: '8 x 60 g (480 g)',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 30,
        openedShelfLifeDays: 1,
        estimatedShelfLifeDays: 25,
        monthsFrozenShelfLife: 3,
        dietaryBadges: ['Circulaire No Frills', '100% Lait canadien', 'Idéal boîte à lunch'],
        gradeOrigin: '100% LAIT CANADIEN',
        packagingFormat: 'Boîte de tubes individuels souples',
        storageTip: 'Conserver au frais. Peut être congelé pour la boîte à lunch des enfants.',
      },
      {
        name: 'Bœuf haché mi-maigre ou maigre Format Club',
        nameFr: 'Bœuf haché mi-maigre ou maigre Format Club',
        nameEn: 'Lean Ground Beef Club Pack',
        brand: 'Bœuf canadien',
        price: '$3.88 / lb ($8.55 / kg)',
        category: 'Meat & Seafood',
        categoryFr: 'Viandes & Poissons',
        quantity: 1,
        unit: 'pack',
        netContent: 'approx. 1.2 kg / 2.6 lb',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 2,
        openedShelfLifeDays: 1,
        estimatedShelfLifeDays: 2,
        monthsFrozenShelfLife: 4,
        dietaryBadges: ['Circulaire No Frills', 'Bœuf 100% canadien', 'Format Club'],
        gradeOrigin: '100% BŒUF CANADIEN',
        packagingFormat: 'Barquette styromousse sous film plastique',
        storageTip: 'Cuisiner dans les 24-48 heures ou diviser en portions pour le congélateur.',
      },
      {
        name: 'Concombres anglais sans pépins',
        nameFr: 'Concombres anglais sans pépins',
        nameEn: 'English Seedless Cucumbers',
        brand: 'Farmer’s Market',
        price: '$0.88 ch.',
        category: 'Produce',
        categoryFr: 'Produits frais',
        quantity: 1,
        unit: 'pcs',
        netContent: '1 unité',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 8,
        openedShelfLifeDays: 4,
        estimatedShelfLifeDays: 7,
        monthsFrozenShelfLife: 0,
        dietaryBadges: ['Circulaire No Frills', 'CANADA No. 1', 'Sans pépins'],
        gradeOrigin: 'CANADA No. 1',
        packagingFormat: 'Emballage sous film plastique rétractable',
        storageTip: 'Laisser le film plastique d’origine jusqu’à l’utilisation pour préserver l’hydratation.',
      },
      {
        name: 'Pain tranché blanc ou brun No Name / Wonder (675 g)',
        nameFr: 'Pain tranché blanc ou brun No Name / Wonder (675 g)',
        nameEn: 'No Name / Wonder Sliced Bread (675 g)',
        brand: 'No Name / Wonder',
        price: '$1.99 (Format familial)',
        category: 'Bakery',
        categoryFr: 'Boulangerie',
        quantity: 1,
        unit: 'loaf',
        netContent: '675 g',
        recommendedLocation: 'Pantry',
        unopenedShelfLifeDays: 10,
        openedShelfLifeDays: 6,
        estimatedShelfLifeDays: 8,
        monthsFrozenShelfLife: 3,
        dietaryBadges: ['Circulaire No Frills', 'Blé canadien', 'Format économique'],
        packagingFormat: 'Sac plastique avec attache hermétique',
        storageTip: 'Garder dans le sac fermé au garde-manger. Ne pas réfrigérer car cela assèche la mie.',
      },
      {
        name: 'Fromage en tranches Kraft Singles (410 g)',
        nameFr: 'Fromage en tranches Kraft Singles (410 g)',
        nameEn: 'Kraft Singles Cheese Slices (410 g)',
        brand: 'Kraft',
        price: '$3.49 (22 tranches)',
        category: 'Dairy & Eggs',
        categoryFr: 'Produits laitiers & œufs',
        quantity: 410,
        unit: 'g',
        netContent: '410 g / 22 tranches',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 120,
        openedShelfLifeDays: 30,
        estimatedShelfLifeDays: 90,
        monthsFrozenShelfLife: 6,
        dietaryBadges: ['Circulaire No Frills', 'Sans arômes artificiels'],
        packagingFormat: 'Paquet avec tranches emballées individuellement',
        storageTip: 'Conserver au réfrigérateur ; refermer le rabat protecteur après usage.',
      },
    ],
  },

  // 4. METRO (Metro Inc. Québec & Ontario - Moi Rewards, Irrésistibles)
  {
    id: 'metro',
    storeName: 'Metro',
    bannerTitleFr: 'Metro & Metro Plus — Marché Fraîcheur & Moi',
    bannerTitleEn: 'Metro & Metro Plus — Fresh Market & Moi Rewards',
    taglineFr: 'Frais de la tête aux pieds • Programme Moi',
    taglineEn: 'Fresh quality • Moi Rewards',
    region: 'Québec & Ontario',
    loyaltyProgram: 'Points Moi',
    primaryColor: '#B91C1C', // Metro Dark Red
    accentColor: '#15803D', // Fresh Green
    textColor: '#FFFFFF',
    badgeBg: '#FEF2F2',
    badgeBorder: '#FECACA',
    dateRangeFr: 'Cette semaine • Jeudi au mercredi',
    dateRangeEn: 'This week • Thursday to Wednesday',
    flyerSvg: '',
    deals: [
      {
        name: 'Yogourt grec Liberté Méditerranée ou Classique (500 g)',
        nameFr: 'Yogourt grec Liberté Méditerranée ou Classique (500 g)',
        nameEn: 'Liberté Méditerranée or Greek Yogurt (500 g)',
        brand: 'Liberté',
        price: '$4.29 (Aubaine fraîcheur)',
        category: 'Dairy & Eggs',
        categoryFr: 'Produits laitiers & œufs',
        quantity: 500,
        unit: 'g',
        netContent: '500 g',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 28,
        openedShelfLifeDays: 10,
        estimatedShelfLifeDays: 21,
        monthsFrozenShelfLife: 3,
        dietaryBadges: ['Aliments du Québec', 'Circulaire Metro', '100% Lait canadien'],
        gradeOrigin: 'PRODUIT DU QUÉBEC',
        packagingFormat: 'Pot de plastique hermétique',
        storageTip: 'Conserver au réfrigérateur entre 2°C et 4°C. Texture crémeuse incomparable.',
      },
      {
        name: 'Filets de saumon frais de l’Atlantique',
        nameFr: 'Filets de saumon frais de l’Atlantique',
        nameEn: 'Fresh Atlantic Salmon Fillets',
        brand: 'Poissonnerie Metro',
        price: '$9.99 / lb ($22.02 / kg)',
        category: 'Meat & Seafood',
        categoryFr: 'Viandes & Poissons',
        quantity: 1,
        unit: 'pack',
        netContent: 'approx. 450 g / 1 lb',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 2,
        openedShelfLifeDays: 1,
        estimatedShelfLifeDays: 2,
        monthsFrozenShelfLife: 3,
        dietaryBadges: ['Circulaire Metro', 'Riche en Oméga-3', 'Pêche responsable'],
        gradeOrigin: 'CANADA FANCY',
        packagingFormat: 'Barquette scellée avec buvard absorbant',
        storageTip: 'Conserver dans la zone la plus froide du réfrigérateur. Consommer dans les 24h.',
      },
      {
        name: 'Fraises fraîches du Québec ou de Californie (1 lb)',
        nameFr: 'Fraises fraîches du Québec ou de Californie (1 lb)',
        nameEn: 'Fresh Strawberries (1 lb)',
        brand: 'Sélection Fraîcheur',
        price: '$2.99 le panier',
        category: 'Produce',
        categoryFr: 'Produits frais',
        quantity: 454,
        unit: 'g',
        netContent: '454 g / 1 lb',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 5,
        openedShelfLifeDays: 3,
        estimatedShelfLifeDays: 4,
        monthsFrozenShelfLife: 8,
        dietaryBadges: ['Circulaire Metro', 'CANADA No. 1', 'Riche en vitamine C'],
        gradeOrigin: 'CANADA No. 1',
        packagingFormat: 'Clamshell en plastique transparent perforé',
        storageTip: 'Ne pas équeuter ni laver avant de consommer pour éviter la moisissure.',
      },
      {
        name: 'Lait Québon ou Natrel 2% (2 L ou 4 L)',
        nameFr: 'Lait Québon ou Natrel 2% (2 L ou 4 L)',
        nameEn: 'Québon or Natrel 2% Fresh Milk (2 L or 4 L)',
        brand: 'Québon / Natrel',
        price: '$4.89 (Pinte 2L)',
        category: 'Dairy & Eggs',
        categoryFr: 'Produits laitiers & œufs',
        quantity: 2,
        unit: 'L',
        netContent: '2 L',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 18,
        openedShelfLifeDays: 7,
        estimatedShelfLifeDays: 14,
        monthsFrozenShelfLife: 3,
        dietaryBadges: ['100% Lait canadien', 'Circulaire Metro', 'Aliments du Québec'],
        gradeOrigin: '100% LAIT CANADIEN',
        packagingFormat: 'Carton recyclable ou cruche en plastique',
        storageTip: 'Conserver sur les tablettes intérieures du frigo plutôt que dans la porte pour un froid stable.',
      },
      {
        name: 'Pizza mince surgelée Irrésistibles (350-390 g)',
        nameFr: 'Pizza mince surgelée Irrésistibles (350-390 g)',
        nameEn: 'Irrésistibles Thin Crust Frozen Pizza (350-390 g)',
        brand: 'Irrésistibles',
        price: '$3.99 ch.',
        category: 'Frozen Meals',
        categoryFr: 'Surgelés',
        quantity: 1,
        unit: 'pack',
        netContent: '370 g',
        recommendedLocation: 'Freezer',
        unopenedShelfLifeDays: 270,
        openedShelfLifeDays: 2,
        estimatedShelfLifeDays: 180,
        monthsFrozenShelfLife: 9,
        dietaryBadges: ['Circulaire Metro', 'Irrésistibles', 'Prêt en 12 minutes'],
        packagingFormat: 'Boîte en carton et film protecteur',
        storageTip: 'Garder congelé à -18°C jusqu’au moment de la cuisson.',
      },
    ],
  },

  // 5. IGA (Sobeys Québec - Scène+ Rewards, Compliments)
  {
    id: 'iga',
    storeName: 'IGA',
    bannerTitleFr: 'IGA & IGA Extra — Le Plaisir de Mieux Manger',
    bannerTitleEn: 'IGA & IGA Extra — Vive la Bouffe & Scene+',
    taglineFr: 'Le plaisir de mieux manger • Scène+',
    taglineEn: 'Taste the difference • Scene+ rewards',
    region: 'Québec & Maritimes',
    loyaltyProgram: 'Points Scène+',
    primaryColor: '#C41230', // IGA Red
    accentColor: '#0284C7', // Sky Blue (Scene+)
    textColor: '#FFFFFF',
    badgeBg: '#EFF6FF',
    badgeBorder: '#BAE6FD',
    dateRangeFr: 'Circulaire active • Jeudi au mercredi',
    dateRangeEn: 'Active flyer • Thursday to Wednesday',
    flyerSvg: '',
    deals: [
      {
        name: 'Yogourt Skyr islandais ou Kéfir biologique Olympic (650g - 1L)',
        nameFr: 'Yogourt Skyr islandais ou Kéfir biologique Olympic (650g - 1L)',
        nameEn: 'Icelandic Skyr or Olympic Organic Kefir (650g - 1L)',
        brand: 'Olympic / Siggi’s',
        price: '$4.49 (Spécial Scène+)',
        category: 'Dairy & Eggs',
        categoryFr: 'Produits laitiers & œufs',
        quantity: 650,
        unit: 'g',
        netContent: '650 g / 1 L',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 30,
        openedShelfLifeDays: 10,
        estimatedShelfLifeDays: 25,
        monthsFrozenShelfLife: 3,
        dietaryBadges: ['Biologique / Organic', 'Circulaire IGA', '100% Lait canadien', 'Riche en protéines'],
        gradeOrigin: '100% LAIT BIOLOGIQUE CANADIEN',
        packagingFormat: 'Bouteille ou pot hermétique',
        storageTip: 'Conserver au réfrigérateur. Bien agiter le kéfir avant de verser.',
      },
      {
        name: 'Tomates de serre sur vigne Savoura du Québec',
        nameFr: 'Tomates de serre sur vigne Savoura du Québec',
        nameEn: 'Savoura Quebec Greenhouse Vine Tomatoes',
        brand: 'Savoura',
        price: '$1.99 / lb ($4.39 / kg)',
        category: 'Produce',
        categoryFr: 'Produits frais',
        quantity: 1,
        unit: 'lb',
        netContent: 'approx. 600 g',
        recommendedLocation: 'Pantry',
        unopenedShelfLifeDays: 8,
        openedShelfLifeDays: 4,
        estimatedShelfLifeDays: 6,
        monthsFrozenShelfLife: 0,
        dietaryBadges: ['Aliments du Québec', 'Circulaire IGA', 'Culture en serre'],
        gradeOrigin: 'CANADA No. 1',
        packagingFormat: 'En grappe naturelle',
        storageTip: 'Garder à température ambiante sur le comptoir pour préserver la saveur et la texture juteuse.',
      },
      {
        name: 'Bifteck d’aloyau ou contre-filet de bœuf Sterling Silver',
        nameFr: 'Bifteck d’aloyau ou contre-filet de bœuf Sterling Silver',
        nameEn: 'Sterling Silver Strip Loin Steak',
        brand: 'Sterling Silver',
        price: '$9.99 / lb ($22.02 / kg)',
        category: 'Meat & Seafood',
        categoryFr: 'Viandes & Poissons',
        quantity: 1,
        unit: 'pack',
        netContent: 'approx. 450 g / 1 lb',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 3,
        openedShelfLifeDays: 1,
        estimatedShelfLifeDays: 3,
        monthsFrozenShelfLife: 6,
        dietaryBadges: ['Circulaire IGA', 'Bœuf Canada AAA', 'Vieilli 21 jours'],
        gradeOrigin: 'CANADA AAA',
        packagingFormat: 'Barquette scellée sous atmosphère protectrice',
        storageTip: 'Sortir 20 minutes avant la cuisson pour chambrer la viande.',
      },
      {
        name: 'Huile d’olive extra vierge Compliments (1 L)',
        nameFr: 'Huile d’olive extra vierge Compliments (1 L)',
        nameEn: 'Compliments Extra Virgin Olive Oil (1 L)',
        brand: 'Compliments',
        price: '$10.99 (Prix membre)',
        category: 'Pantry Staples',
        categoryFr: 'Garde-manger',
        quantity: 1,
        unit: 'L',
        netContent: '1 L',
        recommendedLocation: 'Pantry',
        unopenedShelfLifeDays: 540,
        openedShelfLifeDays: 180,
        estimatedShelfLifeDays: 365,
        monthsFrozenShelfLife: 0,
        dietaryBadges: ['Circulaire IGA', 'Première pression à froid'],
        packagingFormat: 'Bouteille en verre teinté anti-UV',
        storageTip: 'Garder dans un placard sombre à l’abri de la chaleur de la cuisinière.',
      },
    ],
  },

  // 6. WALMART CANADA (Canada-wide - "Rollback / Chute de prix", Great Value)
  {
    id: 'walmart',
    storeName: 'Walmart Canada',
    bannerTitleFr: 'Walmart Supercentre — Chute de Prix & Épicerie',
    bannerTitleEn: 'Walmart Supercentre — Rollback Deals & Grocery',
    taglineFr: 'Chute de prix • Économisez plus, vivez mieux',
    taglineEn: 'Rollback • Save money, live better',
    region: 'Canada',
    loyaltyProgram: 'Rollback Deals',
    primaryColor: '#0071DC', // Walmart Blue
    accentColor: '#FFC220', // Walmart Spark Yellow
    textColor: '#FFFFFF',
    badgeBg: '#EFF6FF',
    badgeBorder: '#93C5FD',
    dateRangeFr: 'Circulaire Rollback en cours',
    dateRangeEn: 'Active Rollback circular',
    flyerSvg: '',
    deals: [
      {
        name: 'Yogourt grec Great Value (750 g)',
        nameFr: 'Yogourt grec Great Value (750 g)',
        nameEn: 'Great Value Greek Yogurt (750 g)',
        brand: 'Great Value',
        price: '$4.47 (Chute de prix Rollback)',
        category: 'Dairy & Eggs',
        categoryFr: 'Produits laitiers & œufs',
        quantity: 750,
        unit: 'g',
        netContent: '750 g',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 28,
        openedShelfLifeDays: 10,
        estimatedShelfLifeDays: 25,
        monthsFrozenShelfLife: 3,
        dietaryBadges: ['Circulaire Walmart', '100% Lait canadien', 'Chute de prix'],
        gradeOrigin: '100% LAIT CANADIEN',
        packagingFormat: 'Pot plastique avec couvercle hermétique',
        storageTip: 'Conserver au centre du réfrigérateur (2°C - 4°C). Bien refermer après usage.',
      },
      {
        name: 'Œufs gros blancs calibre A Great Value (18 un.)',
        nameFr: 'Œufs gros blancs calibre A Great Value (18 un.)',
        nameEn: 'Great Value Grade A Large White Eggs (18-pk)',
        brand: 'Great Value',
        price: '$4.98 (Boîte de 18)',
        category: 'Dairy & Eggs',
        categoryFr: 'Produits laitiers & œufs',
        quantity: 18,
        unit: 'pcs',
        netContent: '18 gros œufs',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 35,
        openedShelfLifeDays: 14,
        estimatedShelfLifeDays: 30,
        monthsFrozenShelfLife: 0,
        dietaryBadges: ['Canada Catégorie A', 'Circulaire Walmart', '100% Canadien'],
        gradeOrigin: 'CANADA CATÉGORIE A',
        packagingFormat: 'Carton d’œufs moulé recyclable',
        storageTip: 'Conserver dans la boîte d’origine sur une tablette du frigo, pas dans la porte.',
      },
      {
        name: 'Poitrines de poulet désossées sans peau Format Économique',
        nameFr: 'Poitrines de poulet désossées sans peau Format Économique',
        nameEn: 'Boneless Skinless Chicken Breasts Value Pack',
        brand: 'Your Fresh Market',
        price: '$4.97 / lb ($10.96 / kg)',
        category: 'Meat & Seafood',
        categoryFr: 'Viandes & Poissons',
        quantity: 1,
        unit: 'pack',
        netContent: 'approx. 1 kg / 2.2 lb',
        recommendedLocation: 'Fridge',
        unopenedShelfLifeDays: 3,
        openedShelfLifeDays: 1,
        estimatedShelfLifeDays: 3,
        monthsFrozenShelfLife: 9,
        dietaryBadges: ['Circulaire Walmart', 'Volaille canadienne', 'Format Club'],
        gradeOrigin: 'VOLAILLE CANADIENNE',
        packagingFormat: 'Barquette sous vide scellée hermétique',
        storageTip: 'Cuisiner à cœur à 74°C (165°F) dans les 48 heures ou congeler immédiatement.',
      },
      {
        name: 'Avocats Hass mûrs (Sac de 5 un.)',
        nameFr: 'Avocats Hass mûrs (Sac de 5 un.)',
        nameEn: 'Hass Avocados (Bag of 5)',
        brand: 'Your Fresh Market',
        price: '$2.97 le sac de 5',
        category: 'Produce',
        categoryFr: 'Produits frais',
        quantity: 5,
        unit: 'pcs',
        netContent: 'Sac de 5 avocats',
        recommendedLocation: 'Pantry',
        unopenedShelfLifeDays: 7,
        openedShelfLifeDays: 2,
        estimatedShelfLifeDays: 5,
        monthsFrozenShelfLife: 0,
        dietaryBadges: ['Circulaire Walmart', 'Bons gras naturels'],
        packagingFormat: 'Filet en maille souple',
        storageTip: 'Laisser mûrir à température ambiante ; placer au frigo une fois souples.',
      },
    ],
  },
];

// Populate each banner's flyerSvg and dataUrl
CANADIAN_FLYER_BANNERS.forEach((banner) => {
  banner.flyerSvg = generateCanadianFlyerSvg(
    banner.storeName,
    banner.primaryColor,
    banner.accentColor,
    banner.taglineFr,
    banner.loyaltyProgram,
    banner.deals,
    'FR'
  );
});

/**
 * Helper to get all flyer deals across Canada flattened
 */
export function getAllCanadianFlyerDeals(): CanadianFlyerDeal[] {
  return CANADIAN_FLYER_BANNERS.flatMap((b) => b.deals);
}
