import React, { useState } from 'react';
import {
  X,
  Clipboard,
  Sparkles,
  Check,
  CheckCircle2,
  Trash2,
  RefreshCw,
  ShoppingCart,
  Refrigerator,
  Boxes,
  Snowflake,
  AlertCircle,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { InventoryItem } from '../types';
import { useLanguage, getLocationLocalizedName, getCategoryLocalizedName } from '../utils/i18n';
import { FoodItemImage } from '../utils/foodIllustrations';
import { getItemDisplayName } from '../utils/foodTranslator';

interface ParsedReceiptItem {
  id: string;
  selected: boolean;
  name: string;
  nameFr?: string;
  nameEn?: string;
  category: string;
  quantity: number;
  unit: string;
  price?: string;
  brand?: string;
  recommendedLocation: 'FRIDGE' | 'FREEZER' | 'PANTRY' | 'SPICE_RACK';
  shelfLifeDays: number;
  storageTip?: string;
}

interface PasteReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; name: string } | null;
  onItemsAdded: (newItems: InventoryItem[]) => void;
}

const SAMPLE_EMAIL_RECEIPTS = [
  {
    store: 'Maxi (Courriel / Email)',
    text: `MAXI & CIE #0881
BOUL. CREMAZIE, MONTREAL QC
COMMANDE EN LIGNE / COURRIEL #MX-892147

1 OIKOS YOGOURT GREC 750G 0%     $4.97 FP
1 POULET ENTIER FRAIS DU CANADA   $8.45 FP
2 BROCOLI COURONNE DU QUEBEC      $3.98 FP
1 POMMES MCINTOSH SAC 3LB         $2.99 FP
1 SANS NOM BEURRE SALE 454G       $4.88 FP
2 PATES ALIMENTAIRES CATELLI 900G $2.50 FP
1 OEUFS GROS BLANCS 12 UN         $3.89 FP

SOUS-TOTAL: $31.66
TPS/TVH (5%): $0.00
TVQ (9.975%): $0.00
TOTAL: $31.66
PAIEMENT: INTERAC COMPTANT
MERCI D'AVOIR MAGASINÉ CHEZ MAXI`,
  },
  {
    store: 'Costco Wholesale (E-Receipt)',
    text: `COSTCO WHOLESALE #541
MONTREAL QC
MEMBRE: 111892019482
TRANSACTION: 890422 (E-RECEIPT)

114890 ORG MILK 2% 3X1L           $9.89 E
542019 KS CHICKEN BREAST 2KG     $28.50 E
882910 KIRKLAND MAPLE SYRUP 1L   $14.99 E
332014 RASPBERRIES FRESH 340G     $5.99 E
991204 SPINACH ORGANIC 454G       $4.49 E
120489 CHEDDAR AGED 900G         $11.99 E

SUBTOTAL: $75.85
TAX: $0.00
TOTAL: $75.85
VISA AUTH: 098412`,
  },
  {
    store: 'Super C (Facture électronique)',
    text: `SUPER C (METRO INC.)
BEAU, BON, PAS CHER
COMMANDE SAISIE METRO.CA #SC-440192

FILET DE PORC FRAIS DU QUEBEC   $7.76
YOGOURT ASTRO ORIGINAL 750G     $3.99
RAISINS ROUGES SANS PEPINS 1LB  $1.48
FARINE FIVE ROSES 10KG         $11.97
FROMAGE CHEDDAR BLACK DIAMOND   $4.44
JUS PUR 100% OASIS 960ML        $1.25

SOUS TOTAL: $30.89
TPS (5%): $0.00
TVQ (9.975%): $0.00
TOTAL PAYE: $30.89
POINTS MOI ACCUMULES: 30`,
  },
  {
    store: 'Walmart Canada (Pickup Order)',
    text: `WALMART CANADA STORE #3019
ORDER CONFIRMATION #WMT-77401992
DELIVERED / PICKED UP

GREAT VALUE 100% CANADIAN MILK 4L $5.48
GREAT VALUE LARGE EGGS 18PK       $4.98
BONELESS SKINLESS CHICKEN BREAST  $12.00
FRESH HASS AVOCADOS 5PK           $2.97
DEMPSTERS WHOLE WHEAT BREAD 675G  $3.27
GREAT VALUE GREEK YOGURT 750G     $4.47

ORDER TOTAL: $33.17
PAID WITH MASTERCARD ****4921
THANK YOU FOR SHOPPING AT WALMART`,
  },
];

export const PasteReceiptModal: React.FC<PasteReceiptModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onItemsAdded,
}) => {
  const { lang } = useLanguage();
  const [receiptText, setReceiptText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedReceiptItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [isSaving, setIsSaving] = useState(false);
  const [detectedStore, setDetectedStore] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setReceiptText(text);
          setParseError(null);
        }
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e);
    }
  };

  const handleLoadSample = (sample: (typeof SAMPLE_EMAIL_RECEIPTS)[0]) => {
    setReceiptText(sample.text);
    setParseError(null);
  };

  const handleParse = async () => {
    const text = receiptText.trim();
    if (!text) {
      setParseError(
        lang === 'FR'
          ? 'Veuillez coller le texte de votre reçu avant d’analyser.'
          : 'Please paste your receipt text before analyzing.'
      );
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const res = await fetch('/api/v1/inventory/scan-receipt-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptText: text, language: lang }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse receipt text');
      }

      const rawItems = Array.isArray(data.items) ? data.items : [];
      if (rawItems.length === 0) {
        throw new Error(
          lang === 'FR'
            ? 'Aucun article alimentaire n’a été détecté dans ce texte de reçu.'
            : 'No grocery items were detected in this receipt text.'
        );
      }

      const items: ParsedReceiptItem[] = rawItems.map((it: any, idx: number) => {
        let loc: 'FRIDGE' | 'FREEZER' | 'PANTRY' | 'SPICE_RACK' = 'FRIDGE';
        const rec = (it.recommendedLocation || '').toUpperCase();
        if (rec.includes('FREEZER') || rec.includes('CONGEL')) loc = 'FREEZER';
        else if (rec.includes('PANTRY') || rec.includes('GARDE')) loc = 'PANTRY';
        else if (rec.includes('SPICE') || rec.includes('EPICE')) loc = 'SPICE_RACK';

        return {
          id: `receipt-item-${Date.now()}-${idx}`,
          selected: true,
          name: it.name || it.nameFr || it.nameEn || 'Aliment',
          nameFr: it.nameFr,
          nameEn: it.nameEn,
          category: it.category || 'Pantry Staples',
          quantity: typeof it.quantity === 'number' && it.quantity > 0 ? it.quantity : 1,
          unit: it.unit || 'pcs',
          price: it.price ? `$${typeof it.price === 'number' ? it.price.toFixed(2) : String(it.price).replace('$', '')}` : undefined,
          brand: it.brand,
          recommendedLocation: loc,
          shelfLifeDays: it.shelfLifeDays || it.estimatedShelfLifeDays || 14,
          storageTip: it.storageTip,
        };
      });

      setDetectedStore(data.storeName || null);
      setParsedItems(items);
      setStep('review');
    } catch (err: any) {
      console.error('Receipt parse error:', err);
      setParseError(err.message || 'Could not parse receipt text');
    } finally {
      setIsParsing(false);
    }
  };

  const toggleItemSelect = (id: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setParsedItems((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  const updateItemLocation = (id: string, loc: 'FRIDGE' | 'FREEZER' | 'PANTRY' | 'SPICE_RACK') => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, recommendedLocation: loc } : item))
    );
  };

  const updateItemCategory = (id: string, category: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, category } : item))
    );
  };

  const updateItemQuantity = (id: string, delta: number) => {
    setParsedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleSaveToInventory = async () => {
    const selected = parsedItems.filter((i) => i.selected);
    if (selected.length === 0) return;

    setIsSaving(true);
    const savedItems: InventoryItem[] = [];

    for (const item of selected) {
      try {
        const payload = {
          name: item.name,
          nameFr: item.nameFr,
          nameEn: item.nameEn,
          categoryName: item.category,
          quantity: item.quantity,
          unit: item.unit,
          locationType: item.recommendedLocation,
          locationName:
            item.recommendedLocation === 'FREEZER'
              ? 'Freezer'
              : item.recommendedLocation === 'PANTRY'
              ? 'Pantry'
              : item.recommendedLocation === 'SPICE_RACK'
              ? 'Spice Rack'
              : 'Fridge',
          daysUntilExpiration: item.shelfLifeDays,
          expirationDate: new Date(Date.now() + item.shelfLifeDays * 86400000).toISOString().split('T')[0],
          notes: item.price ? `Reçu: ${item.price}${item.brand ? ` (${item.brand})` : ''}` : undefined,
          addedBy: currentUser?.name || 'Chef',
          addedById: currentUser?.id || 'admin',
        };

        const res = await fetch('/api/v1/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const saved = await res.json();
          savedItems.push(saved);
        }
      } catch (e) {
        console.warn('Failed saving receipt item:', item.name, e);
      }
    }

    setIsSaving(false);
    if (savedItems.length > 0) {
      onItemsAdded(savedItems);
      onClose();
    }
  };

  const selectedCount = parsedItems.filter((i) => i.selected).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#D5E1D2] max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-[#0D3B37] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Clipboard className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {lang === 'FR' ? 'Coller un reçu de magasin ou courriel' : 'Paste Store / Email Receipt'}
              </h2>
              <p className="text-xs text-emerald-200">
                {lang === 'FR'
                  ? 'Costco, Walmart, Maxi, Super C, Metro, IGA (courriels & factures)'
                  : 'Costco, Walmart, Maxi, Super C, Metro, IGA (e-receipts & confirmation emails)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 'input' ? (
            <>
              {/* Instructions */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7EE] border border-[#E5DFD0] text-xs text-[#0D3B37] space-y-1.5">
                <p className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>
                    {lang === 'FR'
                      ? 'Copiez et collez le texte de votre confirmation de commande ou facture électronique :'
                      : 'Copy and paste the text from your order confirmation or electronic store receipt:'}
                  </span>
                </p>
                <p className="text-[11px] text-[#527470]">
                  {lang === 'FR'
                    ? 'Le moteur IA détecte automatiquement les noms de produits québécois/canadiens, quantités, prix et catégories.'
                    : 'The AI engine automatically identifies Canadian grocery items, quantities, prices, and optimal storage locations.'}
                </p>
              </div>

              {/* Paste Textarea & Paste from Clipboard */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-[#527470]">
                    {lang === 'FR' ? 'Texte du reçu' : 'Receipt Content'}
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1.5 cursor-pointer bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>{lang === 'FR' ? 'Coller du presse-papier' : 'Paste from Clipboard'}</span>
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={receiptText}
                  onChange={(e) => {
                    setReceiptText(e.target.value);
                    if (parseError) setParseError(null);
                  }}
                  placeholder={
                    lang === 'FR'
                      ? `Collez ici le texte de votre reçu (ou chargez un exemple ci-dessous)...\n\nExemple:\nMAXI & CIE #0881\n1 OIKOS YOGOURT GREC 750G $4.97\n2 BROCOLI DU QUEBEC $3.98\n1 BEURRE SANS NOM 454G $4.88`
                      : `Paste receipt text here (or load a sample below)...\n\nExample:\nCOSTCO WHOLESALE #541\n114890 ORG MILK 2% 3X1L $9.89\n542019 KS CHICKEN BREAST 2KG $28.50`
                  }
                  className="w-full p-3 font-mono text-xs rounded-2xl bg-white border border-[#D5E1D2] text-[#0D3B37] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                />
              </div>

              {/* Quick Sample Receipts */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#527470]">
                  {lang === 'FR' ? 'Exemples de reçus courriel prêts à tester :' : 'Sample E-Receipts to Test:'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SAMPLE_EMAIL_RECEIPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleLoadSample(sample)}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left text-xs font-semibold text-slate-800 transition-all cursor-pointer truncate"
                      title={sample.store}
                    >
                      <span className="truncate block">🧾 {sample.store}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Notice */}
              {parseError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{parseError}</span>
                </div>
              )}
            </>
          ) : (
            /* Review Step */
            <div className="space-y-4">
              {/* Step 2 Banner */}
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-xs font-bold text-emerald-950">
                    {lang === 'FR'
                      ? `✓ ${parsedItems.length} article(s) extrait(s)${detectedStore ? ` de ${detectedStore}` : ''} !`
                      : `✓ ${parsedItems.length} item(s) extracted${detectedStore ? ` from ${detectedStore}` : ''}!`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="font-bold text-teal-800 hover:underline"
                  >
                    {lang === 'FR' ? 'Tout cocher' : 'Select all'}
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="font-bold text-slate-600 hover:underline"
                  >
                    {lang === 'FR' ? 'Tout décocher' : 'Deselect all'}
                  </button>
                </div>
              </div>

              {/* Extracted items table / list */}
              <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
                {parsedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      item.selected
                        ? 'bg-white border-emerald-300 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleItemSelect(item.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          item.selected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {item.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      {/* Generic / Curated category visual picture */}
                      <FoodItemImage
                        name={item.name}
                        category={item.category}
                        size="sm"
                        className="shrink-0"
                      />

                      {/* Name & Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-extrabold text-xs text-slate-900 truncate">
                            {item.name}
                          </p>
                          {item.brand && (
                            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                              {item.brand}
                            </span>
                          )}
                          {item.price && (
                            <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                              {item.price}
                            </span>
                          )}
                        </div>

                        {/* Location picker */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px]">
                          <span className="text-slate-500 font-medium">
                            {lang === 'FR' ? 'Ranger dans :' : 'Store in:'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateItemLocation(item.id, 'FRIDGE')}
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all ${
                                item.recommendedLocation === 'FRIDGE'
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <Refrigerator className="w-2.5 h-2.5" />
                              <span>{lang === 'FR' ? 'Frigo' : 'Fridge'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateItemLocation(item.id, 'FREEZER')}
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all ${
                                item.recommendedLocation === 'FREEZER'
                                  ? 'bg-blue-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <Snowflake className="w-2.5 h-2.5" />
                              <span>{lang === 'FR' ? 'Congélateur' : 'Freezer'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateItemLocation(item.id, 'PANTRY')}
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all ${
                                item.recommendedLocation === 'PANTRY'
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <Boxes className="w-2.5 h-2.5" />
                              <span>{lang === 'FR' ? 'Garde-manger' : 'Pantry'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs min-w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#E5DFD0] flex items-center justify-between gap-3 shrink-0">
          {step === 'review' ? (
            <button
              type="button"
              onClick={() => setStep('input')}
              className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              {lang === 'FR' ? '← Modifier le texte' : '← Edit Text'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              {lang === 'FR' ? 'Annuler' : 'Cancel'}
            </button>
          )}

          {step === 'input' ? (
            <button
              type="button"
              onClick={handleParse}
              disabled={isParsing || !receiptText.trim()}
              className="py-2.5 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              {isParsing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{lang === 'FR' ? 'Analyse en cours...' : 'Parsing receipt...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{lang === 'FR' ? 'Analyser et extraire les articles' : 'Parse & Extract Items'}</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveToInventory}
              disabled={isSaving || selectedCount === 0}
              className="py-2.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{lang === 'FR' ? 'Enregistrement...' : 'Saving to kitchen...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {lang === 'FR'
                      ? `Ajouter ${selectedCount} article(s) à la cuisine`
                      : `Add ${selectedCount} item(s) to Kitchen`}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
