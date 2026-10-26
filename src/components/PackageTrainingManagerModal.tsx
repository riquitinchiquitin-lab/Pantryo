import React, { useState } from 'react';
import {
  X,
  Search,
  Plus,
  Trash2,
  Download,
  Upload,
  Globe,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  Tag,
  BookOpen,
} from 'lucide-react';
import {
  GLOBAL_PACKAGE_CATALOG,
  GlobalPackageItem,
  PackageRegion,
  ContainerType,
  getRegionBadge,
  getContainerTypeInfo,
} from '../services/globalPackageCatalog';
import {
  getTrainedPackages,
  deleteTrainedPackage,
  TrainedPackage,
  exportTrainingData,
  importTrainingData,
} from '../services/packageTrainingService';
import { TeachPackageModal } from './TeachPackageModal';
import { useLanguage } from '../utils/i18n';

interface PackageTrainingManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTeachModal?: () => void;
}

export const PackageTrainingManagerModal: React.FC<PackageTrainingManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { lang } = useLanguage();
  const isFr = lang === 'FR';

  const [activeTab, setActiveTab] = useState<'custom' | 'catalog'>('custom');
  const [selectedRegion, setSelectedRegion] = useState<PackageRegion | 'ALL'>('ALL');
  const [selectedContainer, setSelectedContainer] = useState<ContainerType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTeachModalOpen, setIsTeachModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<TrainedPackage | undefined>(undefined);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Trigger re-render after modifications
  const [, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  if (!isOpen) return null;

  const customPackages = getTrainedPackages();

  const handleDelete = (id: string, name: string) => {
    if (confirm(isFr ? `Supprimer la mémorisation pour "${name}" ?` : `Delete memory for "${name}"?`)) {
      deleteTrainedPackage(id);
      refresh();
      showStatus(isFr ? 'Paquet supprimé.' : 'Package deleted.');
    }
  };

  const handleEdit = (pkg: TrainedPackage) => {
    setEditingPackage(pkg);
    setIsTeachModalOpen(true);
  };

  const handleExport = () => {
    const json = exportTrainingData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pantryo_packages_training_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus(isFr ? 'Données d\'entraînement exportées.' : 'Training data exported.');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const result = importTrainingData(content);
        if (result.success) {
          refresh();
          showStatus(isFr ? `${result.importedCount} paquets importés avec succès !` : `${result.importedCount} packages imported successfully!`);
        } else {
          alert(isFr ? 'Échec de l\'importation du fichier.' : 'Failed to import file.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Filter items
  const query = searchQuery.toLowerCase().trim();

  const filteredCustom = customPackages.filter((p) => {
    const matchesRegion = selectedRegion === 'ALL' || p.region === selectedRegion;
    const matchesContainer = selectedContainer === 'ALL' || p.containerType === selectedContainer;
    const matchesSearch = !query ||
      p.brand.toLowerCase().includes(query) ||
      p.nameFr.toLowerCase().includes(query) ||
      p.nameEn.toLowerCase().includes(query) ||
      (p.originalScript && p.originalScript.toLowerCase().includes(query)) ||
      (p.romanization && p.romanization.toLowerCase().includes(query)) ||
      p.keywords.some((k) => k.toLowerCase().includes(query));
    return matchesRegion && matchesContainer && matchesSearch;
  });

  const filteredCatalog = GLOBAL_PACKAGE_CATALOG.filter((p) => {
    const matchesRegion = selectedRegion === 'ALL' || p.region === selectedRegion;
    const matchesContainer = selectedContainer === 'ALL' || p.containerType === selectedContainer;
    const matchesSearch = !query ||
      p.brand.toLowerCase().includes(query) ||
      p.nameFr.toLowerCase().includes(query) ||
      p.nameEn.toLowerCase().includes(query) ||
      (p.originalScript && p.originalScript.toLowerCase().includes(query)) ||
      (p.romanization && p.romanization.toLowerCase().includes(query)) ||
      p.keywords.some((k) => k.toLowerCase().includes(query));
    return matchesRegion && matchesContainer && matchesSearch;
  });

  const regions: { id: PackageRegion | 'ALL'; label: string; flag: string }[] = [
    { id: 'ALL', label: isFr ? 'Toutes les régions' : 'All Regions', flag: '🌐' },
    { id: 'NORTH_AMERICA', label: isFr ? 'Amérique du Nord' : 'North America', flag: '🇨🇦 / 🇺🇸' },
    { id: 'SOUTH_AMERICA', label: isFr ? 'Amérique du Sud' : 'South America', flag: '🌎' },
    { id: 'CHINA', label: isFr ? 'Chine' : 'China', flag: '🇨🇳' },
    { id: 'JAPAN', label: isFr ? 'Japon' : 'Japan', flag: '🇯🇵' },
    { id: 'PHILIPPINES', label: isFr ? 'Philippines' : 'Philippines', flag: '🇵🇭' },
  ];

  const containerFilters: { id: ContainerType | 'ALL'; label: string; icon: string }[] = [
    { id: 'ALL', label: isFr ? 'Tous' : 'All', icon: '📦' },
    { id: 'CAN', label: isFr ? 'Boîtes' : 'Cans', icon: '🥫' },
    { id: 'BOX', label: isFr ? 'Cartons' : 'Boxes', icon: '📦' },
    { id: 'BAG', label: isFr ? 'Sacs' : 'Bags', icon: '🛍️' },
    { id: 'JAR', label: isFr ? 'Bocaux' : 'Jars', icon: '🫙' },
    { id: 'CARTON', label: isFr ? 'Briques' : 'Cartons', icon: '🧃' },
    { id: 'BOTTLE', label: isFr ? 'Bouteilles' : 'Bottles', icon: '🍾' },
    { id: 'TUB', label: isFr ? 'Pots' : 'Tubs', icon: '🥣' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-900/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl">
              🥫
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                {isFr ? 'Catalogue & Entraînement des emballages' : 'Package Catalog & AI Training'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {isFr
                  ? 'Reconnaissance des boîtes, sacs, conserves, bocaux avec traduction automatique'
                  : 'Recognition of boxes, bags, cans, jars with automatic translation'}
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

        {/* Status Toast */}
        {statusMessage && (
          <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Tab & Action Toolbar */}
        <div className="px-6 py-3 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'custom'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isFr ? 'Mes paquets entraînés' : 'My Trained Packages'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                {customPackages.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isFr ? 'Base mondiale pré-entraînée' : 'Pretrained Global DB'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                {GLOBAL_PACKAGE_CATALOG.length}
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setEditingPackage(undefined);
                setIsTeachModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isFr ? 'Enseigner un paquet' : 'Teach Package'}</span>
            </button>

            {activeTab === 'custom' && customPackages.length > 0 && (
              <button
                onClick={handleExport}
                title={isFr ? 'Exporter mes paquets' : 'Export packages'}
                className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            <label
              title={isFr ? 'Importer un fichier JSON' : 'Import JSON file'}
              className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-6 py-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isFr ? "Rechercher par marque, nom, idéogrammes (老干妈, キユーピー) ou format..." : "Search by brand, name, native script (老干妈, キユーピー) or format..."}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Region Filter */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 max-w-full">
              {regions.map((reg) => (
                <button
                  key={reg.id}
                  onClick={() => setSelectedRegion(reg.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg transition-all whitespace-nowrap flex items-center space-x-1 ${
                    selectedRegion === reg.id
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold'
                      : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
                  }`}
                >
                  <span>{reg.flag}</span>
                  <span>{reg.label}</span>
                </button>
              ))}
            </div>

            {/* Container Shape Filter */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 max-w-full">
              {containerFilters.map((cnt) => (
                <button
                  key={cnt.id}
                  onClick={() => setSelectedContainer(cnt.id)}
                  className={`text-[11px] px-2 py-1 rounded-lg transition-all whitespace-nowrap flex items-center space-x-1 ${
                    selectedContainer === cnt.id
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500 font-semibold'
                      : 'bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  <span>{cnt.icon}</span>
                  <span>{cnt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'custom' ? (
            filteredCustom.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-3xl mx-auto">
                  🎓
                </div>
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
                  {isFr ? 'Aucun paquet personnalisé mémorisé' : 'No Custom Packages Trained Yet'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                  {isFr
                    ? 'Quand vous scannez un article dans le scanner caméra, cliquez sur "Enseigner ce paquet" pour enregistrer sa forme (conserve, bocal, sachet, boîte) et sa marque dans votre mémoire locale.'
                    : 'When you scan an item in the camera scanner, tap "Teach Package" to record its shape (can, jar, pouch, box) and brand in your local memory.'}
                </p>
                <button
                  onClick={() => setIsTeachModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isFr ? 'Enseigner mon premier paquet' : 'Teach My First Package'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredCustom.map((item) => (
                  <PackageCard
                    key={item.id}
                    item={item}
                    isFr={isFr}
                    isCustom={true}
                    onDelete={() => handleDelete(item.id, isFr ? item.nameFr : item.nameEn)}
                    onEdit={() => handleEdit(item)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredCatalog.map((item) => (
                <PackageCard
                  key={item.id}
                  item={item}
                  isFr={isFr}
                  isCustom={false}
                  onTeachFromThis={() => {
                    setEditingPackage({
                      ...item,
                      dateTrained: new Date().toISOString(),
                      timesRecognized: 0,
                    });
                    setIsTeachModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Teach Package Modal */}
      {isTeachModalOpen && (
        <TeachPackageModal
          isOpen={isTeachModalOpen}
          onClose={() => {
            setIsTeachModalOpen(false);
            setEditingPackage(undefined);
          }}
          onSaved={() => {
            refresh();
            showStatus(isFr ? 'Paquet enregistré avec succès dans la mémoire.' : 'Package saved to memory.');
          }}
          initialData={editingPackage}
        />
      )}
    </div>
  );
};

interface PackageCardProps {
  item: GlobalPackageItem | TrainedPackage;
  isFr: boolean;
  isCustom: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onTeachFromThis?: () => void;
}

const PackageCard: React.FC<PackageCardProps> = ({
  item,
  isFr,
  isCustom,
  onDelete,
  onEdit,
  onTeachFromThis,
}) => {
  const containerInfo = getContainerTypeInfo(item.containerType, isFr ? 'FR' : 'EN');
  const regionInfo = getRegionBadge(item.region, isFr ? 'FR' : 'EN');

  return (
    <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 hover:border-amber-400 dark:hover:border-amber-600 transition-all flex flex-col justify-between space-y-3 shadow-xs">
      <div className="flex items-start justify-between space-x-3">
        <div className="flex items-start space-x-3 min-w-0">
          <div className="text-2xl p-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0">
            {containerInfo.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 text-[11px] text-stone-500">
              <span>{regionInfo.flag}</span>
              <span className="font-medium text-amber-700 dark:text-amber-400">
                {containerInfo.label} • {item.standardNetQuantity}
              </span>
            </div>
            <h4 className="text-sm font-bold text-stone-900 dark:text-white truncate mt-0.5">
              {item.brand ? `${item.brand} ` : ''}{isFr ? item.nameFr : item.nameEn}
            </h4>
            {(item.originalScript || item.romanization) && (
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {item.originalScript} {item.romanization ? `• ${item.romanization}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1 shrink-0">
          {isCustom && onEdit && (
            <button
              onClick={onEdit}
              title={isFr ? 'Modifier' : 'Edit'}
              className="p-1.5 text-stone-400 hover:text-amber-600 rounded-lg transition-colors"
            >
              ✏️
            </button>
          )}
          {isCustom && onDelete && (
            <button
              onClick={onDelete}
              title={isFr ? 'Supprimer' : 'Delete'}
              className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {!isCustom && onTeachFromThis && (
            <button
              onClick={onTeachFromThis}
              title={isFr ? 'Copier & personnaliser' : 'Copy & customize'}
              className="p-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              + {isFr ? 'Personnaliser' : 'Customize'}
            </button>
          )}
        </div>
      </div>

      {/* Meta Footer */}
      <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500">
        <div className="flex items-center space-x-2">
          <span>📍 {item.defaultLocation}</span>
          <span>•</span>
          <span>⏳ ~{item.shelfLifeDays} {isFr ? 'jours' : 'days'}</span>
        </div>
        {isCustom && 'timesRecognized' in item && (
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            ✨ {item.timesRecognized} {isFr ? 'scans reconnus' : 'scans matched'}
          </span>
        )}
      </div>
    </div>
  );
};
