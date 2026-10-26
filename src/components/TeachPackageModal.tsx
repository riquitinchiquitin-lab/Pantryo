import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Save,
  CheckCircle2,
  Package,
  Layers,
  MapPin,
  Calendar,
  Globe,
  Tag,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  ContainerType,
  PackageRegion,
  getRegionBadge,
  getContainerTypeInfo,
  METRIC_CONTAINER_STANDARDS,
} from '../services/globalPackageCatalog';
import {
  saveTrainedPackage,
  TrainedPackage,
} from '../services/packageTrainingService';
import { useLanguage } from '../utils/i18n';

interface TeachPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (pkg: TrainedPackage) => void;
  initialData?: {
    brand?: string;
    name?: string;
    nameFr?: string;
    nameEn?: string;
    originalScript?: string;
    romanization?: string;
    containerType?: ContainerType;
    netQuantity?: string;
    category?: string;
    location?: 'Pantry' | 'Fridge' | 'Freezer';
    shelfLifeDays?: number;
    keywords?: string[];
    samplePhoto?: string;
    region?: PackageRegion;
    barcode?: string;
  };
}

const REGION_OPTIONS: { id: PackageRegion; labelFr: string; labelEn: string; flag: string }[] = [
  { id: 'NORTH_AMERICA', labelFr: 'Amérique du Nord (Canada / USA)', labelEn: 'North America (Canada / USA)', flag: '🇨🇦 / 🇺🇸' },
  { id: 'SOUTH_AMERICA', labelFr: 'Amérique du Sud (Latino)', labelEn: 'South America (Latin)', flag: '🌎' },
  { id: 'CHINA', labelFr: 'Chine (Asiatique)', labelEn: 'China (Asian)', flag: '🇨🇳' },
  { id: 'JAPAN', labelFr: 'Japon', labelEn: 'Japan', flag: '🇯🇵' },
  { id: 'PHILIPPINES', labelFr: 'Philippines', labelEn: 'Philippines', flag: '🇵🇭' },
  { id: 'GLOBAL', labelFr: 'Autre / International', labelEn: 'Other / International', flag: '🌐' },
];

const CONTAINER_TYPES: ContainerType[] = ['CAN', 'BOX', 'BAG', 'JAR', 'CARTON', 'BOTTLE', 'TUB'];

const QUICK_BRANDS_BY_REGION: Record<PackageRegion, string[]> = {
  NORTH_AMERICA: ['President\'s Choice', 'Compliments', 'Selection', 'Habitant', 'St-Hubert', 'Campbell\'s', 'Heinz', 'Kraft', 'Barilla', 'Catelli', 'Quaker', 'Clover Leaf', 'Aylmer'],
  SOUTH_AMERICA: ['Goya', 'P.A.N.', 'San Ignacio', 'Taragüi', 'Yoki', 'Doña Isabel', 'Inca\'s Food', 'Havanna'],
  CHINA: ['Lee Kum Kee (李锦记)', 'Lao Gan Ma (老干妈)', 'Pearl River Bridge (珠江桥牌)', 'Hengshun (恒顺)', 'Pagoda (塔牌)'],
  JAPAN: ['Kikkoman (キッコーマン)', 'Kewpie (キユーピー)', 'S&B (エスビー)', 'Ajinomoto (味の素)', 'Marukome (マルコメ)', 'Nissin (日清)'],
  PHILIPPINES: ['Datu Puti', 'Mama Sita\'s', 'UFC', 'Silver Swan', 'Lucky Me!', 'Mang Tomas', 'Century Tuna', 'Aroy-D'],
  GLOBAL: ['Nestlé', 'Maggi', 'Knorr', 'Barilla', 'Danone'],
};

export const TeachPackageModal: React.FC<TeachPackageModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialData,
}) => {
  const { lang } = useLanguage();
  const isFr = lang === 'FR';

  const [region, setRegion] = useState<PackageRegion>(initialData?.region || 'NORTH_AMERICA');
  const [containerType, setContainerType] = useState<ContainerType>(initialData?.containerType || 'CAN');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [nameFr, setNameFr] = useState(initialData?.nameFr || initialData?.name || '');
  const [nameEn, setNameEn] = useState(initialData?.nameEn || initialData?.name || '');
  const [originalScript, setOriginalScript] = useState(initialData?.originalScript || '');
  const [romanization, setRomanization] = useState(initialData?.romanization || '');
  const [netQuantity, setNetQuantity] = useState(initialData?.netQuantity || '540 ml');
  const [category, setCategory] = useState(initialData?.category || 'Canned Goods');
  const [location, setLocation] = useState<'Pantry' | 'Fridge' | 'Freezer'>(initialData?.location || 'Pantry');
  const [shelfLifeDays, setShelfLifeDays] = useState(initialData?.shelfLifeDays || 365);
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords || []);
  const [barcode] = useState(initialData?.barcode || '');
  const [photoThumbnail] = useState(initialData?.samplePhoto || '');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (initialData) {
      if (initialData.region) setRegion(initialData.region);
      if (initialData.containerType) setContainerType(initialData.containerType);
      if (initialData.brand) setBrand(initialData.brand);
      if (initialData.nameFr) setNameFr(initialData.nameFr);
      if (initialData.nameEn) setNameEn(initialData.nameEn);
      if (initialData.originalScript) setOriginalScript(initialData.originalScript);
      if (initialData.romanization) setRomanization(initialData.romanization);
      if (initialData.netQuantity) setNetQuantity(initialData.netQuantity);
      if (initialData.category) setCategory(initialData.category);
      if (initialData.location) setLocation(initialData.location);
      if (initialData.shelfLifeDays) setShelfLifeDays(initialData.shelfLifeDays);
      if (initialData.keywords && initialData.keywords.length > 0) setKeywords(initialData.keywords);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setKeywords(keywords.filter((k) => k !== kwToRemove));
  };

  const handleSave = () => {
    if (!nameFr && !nameEn) return;

    const saved = saveTrainedPackage({
      region,
      brand: brand.trim(),
      nameFr: (nameFr || nameEn).trim(),
      nameEn: (nameEn || nameFr).trim(),
      originalScript: originalScript.trim() || undefined,
      romanization: romanization.trim() || undefined,
      containerType,
      standardNetQuantity: netQuantity.trim() || '1 un.',
      category: category.trim() || 'Pantry Staples',
      categoryEn: category.trim() || 'Pantry Staples',
      defaultLocation: location,
      shelfLifeDays: Number(shelfLifeDays) || 180,
      keywords,
      barcode: barcode || undefined,
      samplePhoto: photoThumbnail || undefined,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      if (onSaved) onSaved(saved);
      onClose();
    }, 700);
  };

  const quickStandards = METRIC_CONTAINER_STANDARDS.filter((s) => s.containerType === containerType);
  const containerInfo = getContainerTypeInfo(containerType, isFr ? 'FR' : 'EN');
  const regionInfo = getRegionBadge(region, isFr ? 'FR' : 'EN');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl">
              🎓
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                {isFr ? 'Enseigner un paquet à l\'IA' : 'Teach a Package to AI'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isFr
                  ? 'Mémorisez la forme, la marque, les écritures d\'origine et le format'
                  : 'Memorize container shape, brand, original scripts, and format'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Container Type Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              {isFr ? '1. Type d\'emballage / Contenant' : '1. Packaging / Container Type'}
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {CONTAINER_TYPES.map((type) => {
                const info = getContainerTypeInfo(type, isFr ? 'FR' : 'EN');
                const isSelected = containerType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setContainerType(type)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold shadow-sm'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    <span className="text-2xl mb-1">{info.icon}</span>
                    <span className="text-[11px] leading-tight line-clamp-1">{info.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Region Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
              {isFr ? '2. Région d\'origine culinaire' : '2. Culinary Region of Origin'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REGION_OPTIONS.map((reg) => (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => setRegion(reg.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs text-left transition-all ${
                    region === reg.id
                      ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold'
                      : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                  }`}
                >
                  <span className="text-base">{reg.flag}</span>
                  <span className="truncate">{isFr ? reg.labelFr : reg.labelEn}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Brand & Quick Brand Suggestions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {isFr ? '3. Marque du produit' : '3. Product Brand'}
              </label>
            </div>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={isFr ? "Ex: Compliments, Lee Kum Kee, Kikkoman, Goya..." : "e.g. Compliments, Lee Kum Kee, Kikkoman, Goya..."}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {/* Quick Brand Suggestions */}
            {QUICK_BRANDS_BY_REGION[region] && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_BRANDS_BY_REGION[region].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(b.split(' (')[0])}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    + {b}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 4: Product Names & Automatic Translation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                {isFr ? 'Nom traduit (Français)' : 'Translated Name (French)'}
              </label>
              <input
                type="text"
                value={nameFr}
                onChange={(e) => setNameFr(e.target.value)}
                placeholder="Ex: Sauce d'huître de qualité supérieure"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                {isFr ? 'Nom traduit (Anglais)' : 'Translated Name (English)'}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Premium Oyster Sauce"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Step 5: Original Foreign Script & Romanization (Mandatory for Asian / International) */}
          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <Globe className="w-4 h-4" />
              <span>{isFr ? 'Écriture d\'origine & Romanisation (Pinyin, Romaji, etc.)' : 'Original Script & Romanization (Pinyin, Romaji, etc.)'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                  {isFr ? 'Écriture native (Kanji, Hanzi, Tagalog, Espagnol)' : 'Native Script (Kanji, Hanzi, Tagalog, Spanish)'}
                </label>
                <input
                  type="text"
                  value={originalScript}
                  onChange={(e) => setOriginalScript(e.target.value)}
                  placeholder="Ex: 李锦记 旧庄特级蚝油 / キユーピー マヨネーズ"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-stone-500 dark:text-stone-400 mb-1">
                  {isFr ? 'Romanisation / Prononciation' : 'Romanization / Transliteration'}
                </label>
                <input
                  type="text"
                  value={romanization}
                  onChange={(e) => setRomanization(e.target.value)}
                  placeholder="Ex: Lǐ Jǐn Jì Háo Yóu / Kyūpī Mayonēzu"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Step 6: Format & Net Weight with Canadian Metric Standards */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
              {isFr ? 'Format & Quantité nette' : 'Format & Net Quantity'}
            </label>
            <input
              type="text"
              value={netQuantity}
              onChange={(e) => setNetQuantity(e.target.value)}
              placeholder="Ex: 540 ml, 796 ml, 454 g, 1 kg, 210 g"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {/* Quick standards chips */}
            {quickStandards.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] text-stone-400 self-center">{isFr ? 'Formats standards :' : 'Standards:'}</span>
                {quickStandards.map((std) => (
                  <button
                    key={std.volumeOrWeight}
                    type="button"
                    onClick={() => {
                      setNetQuantity(std.volumeOrWeight);
                      setShelfLifeDays(std.defaultShelfLifeDays);
                    }}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  >
                    {std.volumeOrWeight} ({isFr ? std.commonUsageFr.split(' ')[0] : std.commonUsageEn.split(' ')[0]})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 7: Location & Shelf Life */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                {isFr ? 'Emplacement recommandé' : 'Recommended Location'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Pantry', 'Fridge', 'Freezer'] as const).map((loc) => {
                  const label = loc === 'Pantry' ? (isFr ? 'Garde-manger' : 'Pantry') : loc === 'Fridge' ? (isFr ? 'Frigo' : 'Fridge') : (isFr ? 'Congélateur' : 'Freezer');
                  const icon = loc === 'Pantry' ? '🥫' : loc === 'Fridge' ? '❄️' : '🧊';
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={`flex flex-col items-center p-2 rounded-xl border text-xs transition-all ${
                        location === loc
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      <span className="text-base mb-0.5">{icon}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                {isFr ? 'Conservation non ouvert (Jours)' : 'Unopened Shelf Life (Days)'}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={shelfLifeDays}
                  onChange={(e) => setShelfLifeDays(parseInt(e.target.value) || 30)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-stone-500 whitespace-nowrap">
                  ≈ {Math.round(shelfLifeDays / 30)} {isFr ? 'mois' : 'months'}
                </span>
              </div>
            </div>
          </div>

          {/* Step 8: OCR Keywords Training */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
              {isFr ? 'Mots-clés de l\'étiquette (Détection OCR)' : 'Label Keywords (OCR Detection)'}
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                placeholder={isFr ? "Ajouter un mot visible sur le paquet..." : "Add a word visible on package..."}
                className="flex-1 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-100 rounded-xl text-xs font-medium transition-colors"
              >
                + {isFr ? 'Ajouter' : 'Add'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">
              {isFr ? 'Aperçu de la mémorisation :' : 'Memory Preview:'}
            </span>
            <div className="flex items-start space-x-3">
              <div className="text-3xl p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm">
                {containerInfo.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-stone-500">{regionInfo.flag}</span>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {containerInfo.label} • {netQuantity}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-white truncate">
                  {brand ? `${brand} ` : ''}{isFr ? (nameFr || 'Sans titre') : (nameEn || 'Untitled')}
                </h4>
                {(originalScript || romanization) && (
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                    {originalScript} {romanization ? `• ${romanization}` : ''}
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-1 text-[11px] text-stone-500">
                  <span>📍 {location}</span>
                  <span>•</span>
                  <span>⏳ ~{shelfLifeDays} {isFr ? 'jours' : 'days'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-900/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-medium transition-colors"
          >
            {isFr ? 'Annuler' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!nameFr && !nameEn}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md ${
              isSuccess
                ? 'bg-emerald-600 text-white'
                : !nameFr && !nameEn
                ? 'bg-stone-300 dark:bg-stone-700 text-stone-500 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-amber-600/20'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isFr ? 'Mémorisé avec succès !' : 'Learned successfully!'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isFr ? 'Enregistrer & Mémoriser' : 'Save & Learn Package'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
