import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  ArrowRight,
  ShieldCheck,
  Snowflake,
  Refrigerator,
  Boxes,
  Plus,
  Edit2,
  CheckCheck,
} from 'lucide-react';
import { ScannedItemCandidate, ScanResponse } from '../types';
import { FoodVisualBadge } from './FoodVisualBadge';
import { PantryoLogo } from './PantryoLogo';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: any) => void;
  currentUser: { id: string; name: string };
  onOpenManualAdd?: () => void;
}

const SAMPLE_PRESETS = [
  {
    name: 'Produce & Dairy Cart',
    description: 'Fresh Strawberries, Oat Milk & Greek Yogurt',
    label: '🍓 Milk & Berries',
    mockItems: [
      {
        name: 'Organic Whole Milk',
        category: 'Dairy & Eggs',
        quantity: 1,
        unit: 'carton (1 gal)',
        recommendedLocation: 'Fridge' as const,
        storageReason: 'Must maintain 35°F - 38°F to prevent souring.',
        estimatedShelfLifeDays: 7,
        monthsFrozenShelfLife: 3,
        confidence: 0.98,
        storageTip: 'Store on middle shelf; avoid refrigerator door.',
      },
      {
        name: 'Fresh Strawberries',
        category: 'Produce',
        quantity: 1,
        unit: 'clamshell (1 lb)',
        recommendedLocation: 'Fridge' as const,
        storageReason: 'High moisture and mold risk at room temperature.',
        estimatedShelfLifeDays: 4,
        monthsFrozenShelfLife: 10,
        confidence: 0.95,
        storageTip: 'Do not wash until immediately before eating.',
      },
    ],
  },
  {
    name: 'Freezer Protein Haul',
    description: 'Ground Beef & Salmon Fillets',
    label: '🥩 Beef & Salmon',
    mockItems: [
      {
        name: 'Grass-Fed Ground Beef 85/15',
        category: 'Meat & Seafood',
        quantity: 2,
        unit: 'lbs',
        recommendedLocation: 'Freezer' as const,
        storageReason: 'Keeps nutrient integrity and halts bacterial growth at 0°F.',
        estimatedShelfLifeDays: 2,
        monthsFrozenShelfLife: 6,
        confidence: 0.97,
        storageTip: 'Wrap tightly or vacuum seal to prevent freezer burn.',
      },
      {
        name: 'Wild Atlantic Salmon Fillet',
        category: 'Meat & Seafood',
        quantity: 1.5,
        unit: 'lbs',
        recommendedLocation: 'Freezer' as const,
        storageReason: 'Fish oil oxidizes rapidly; freeze at 0°F if not cooking within 24h.',
        estimatedShelfLifeDays: 2,
        monthsFrozenShelfLife: 4,
        confidence: 0.94,
        storageTip: 'Defrost in refrigerator 12 hours before searing.',
      },
    ],
  },
];

export const CameraScannerModal: React.FC<CameraScannerModalProps> = ({
  isOpen,
  onClose,
  onItemAdded,
  currentUser,
  onOpenManualAdd,
}) => {
  const [activeMode, setActiveMode] = useState<'snap' | 'upload' | 'presets'>('snap');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<ScannedItemCandidate[]>([]);
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());

  // Hidden native file inputs (one for direct camera capture, one for gallery file picking)
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setImagePreview(null);
      setScanResult(null);
      setErrorMessage(null);
      setSelectedCandidates([]);
      setAddedNames(new Set());
      setActiveMode('snap');
    }
  }, [isOpen]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      triggerAiScan(dataUrl);
    };
    reader.readAsDataURL(file);
    // Reset file input value so selecting the same photo triggers onChange again
    e.target.value = '';
  };

  const triggerAiScan = async (base64Img: string) => {
    setIsScanning(true);
    setErrorMessage(null);
    setScanResult(null);
    setAddedNames(new Set());

    try {
      const response = await fetch('/api/v1/inventory/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Img,
          mimeType: 'image/jpeg',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to process vision scan');
      }

      setScanResult(data);
      setSelectedCandidates(data.items || []);
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(err.message || 'Error communicating with Gemini Vision service.');
    } finally {
      setIsScanning(false);
    }
  };

  const loadPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    // Generate an illustrative canvas image representation
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#E8EFE6';
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = '#2C3E30';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Pantryo: ${preset.name}`, 200, 140);
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = '#5A6F5E';
      ctx.fillText(preset.description, 200, 175);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImagePreview(dataUrl);
      triggerAiScan(dataUrl);
    }
  };

  const handleConfirmSingleItem = async (candidate: ScannedItemCandidate) => {
    try {
      const days = candidate.estimatedShelfLifeDays || 7;
      const exp = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      const payload = {
        name: candidate.name,
        quantity: candidate.quantity,
        unit: candidate.unit,
        locationName: candidate.recommendedLocation,
        categoryName: candidate.category,
        expirationDate: exp,
        monthsFrozenShelfLife: candidate.monthsFrozenShelfLife || 6,
        notes: candidate.storageTip || candidate.storageReason || '',
        addedById: currentUser.id,
      };

      const res = await fetch('/api/v1/inventory/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to save item');
      }

      onItemAdded(resData.item);
      setAddedNames((prev) => new Set([...prev, candidate.name]));
    } catch (err: any) {
      alert(`Error saving item: ${err.message}`);
    }
  };

  const handleAddAllCandidates = async () => {
    if (selectedCandidates.length === 0) return;
    setIsAddingAll(true);

    const itemsToAdd = selectedCandidates.map((c) => ({
      name: c.name,
      quantity: c.quantity,
      unit: c.unit,
      locationType: (c.recommendedLocation.toUpperCase() as 'FRIDGE' | 'FREEZER' | 'PANTRY') || 'FRIDGE',
      categoryName: c.category,
      notes: c.storageTip || c.storageReason || 'Added via Gemini Vision Scan',
    }));

    try {
      const res = await fetch('/api/v1/inventory/bulk-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToAdd,
          userId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        selectedCandidates.forEach((c) => onItemAdded(c));
        setAddedNames(new Set(selectedCandidates.map((c) => c.name)));
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      alert(`Error saving items: ${err.message}`);
    } finally {
      setIsAddingAll(false);
    }
  };

  const updateCandidateField = (index: number, field: keyof ScannedItemCandidate, value: any) => {
    setSelectedCandidates((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      {/* Hidden file inputs for direct native camera and gallery file upload */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileSelected}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileSelected}
        accept="image/*"
        className="hidden"
      />

      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#FAF7EE] border border-[#E0D9C8] rounded-3xl shadow-2xl p-5 sm:p-6 text-[#133E3B]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E2D5]">
          <div className="flex items-center gap-3">
            <PantryoLogo size={38} />
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-[#0D3B37]">
                SNAP & ADD! Vision Scanner
              </h2>
              <p className="text-xs text-[#527470]">Powered by Google Gemini Flash Multimodal Vision</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E0D9C8] text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Switcher Tabs */}
        {!imagePreview && (
          <div className="grid grid-cols-3 gap-2 p-1.5 my-3.5 bg-[#EDF3EC] rounded-2xl">
            <button
              onClick={() => setActiveMode('snap')}
              className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'snap' ? 'bg-white text-[#0D3B37] shadow-2xs' : 'text-[#607464] hover:text-[#0D3B37]'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Camera Snap
            </button>
            <button
              onClick={() => setActiveMode('upload')}
              className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'upload' ? 'bg-white text-[#0D3B37] shadow-2xs' : 'text-[#607464] hover:text-[#0D3B37]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Photo / Files
            </button>
            <button
              onClick={() => setActiveMode('presets')}
              className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                activeMode === 'presets' ? 'bg-white text-[#0D3B37] shadow-2xs' : 'text-[#607464] hover:text-[#0D3B37]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Demo Presets
            </button>
          </div>
        )}

        {/* Camera Snap Mode (Native camera shutter via capture="environment") */}
        {activeMode === 'snap' && !imagePreview && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D5E1D2] text-center space-y-4 shadow-2xs">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center shadow-xs">
              <Camera className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-sm sm:text-base text-[#0D3B37]">
                Take Photo with Your Camera
              </h3>
              <p className="text-xs text-[#527470] max-w-sm mx-auto">
                Opens your phone or device's native camera immediately. Works over local network, Proxmox, and mobile browsers.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="py-3 px-6 rounded-2xl bg-[#0E766E] hover:bg-[#0B5C56] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Grocery Photo</span>
              </button>

              <button
                onClick={() => galleryInputRef.current?.click()}
                className="py-3 px-5 rounded-2xl bg-[#FAF7EE] hover:bg-[#F2ECE0] text-[#0D3B37] font-bold text-xs sm:text-sm border border-[#D5E1D2] flex items-center justify-center gap-2 transition-all"
              >
                <Upload className="w-4 h-4 text-teal-700" />
                <span>Pick from Gallery</span>
              </button>
            </div>

            {onOpenManualAdd && (
              <div className="pt-2 border-t border-[#F2ECE0]">
                <button
                  onClick={() => {
                    onClose();
                    onOpenManualAdd();
                  }}
                  className="text-xs font-bold text-teal-800 hover:text-teal-900 underline underline-offset-2"
                >
                  Or enter food item manually with keyboard &gt;
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload Mode */}
        {activeMode === 'upload' && !imagePreview && (
          <div
            onClick={() => galleryInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 sm:p-10 border-2 border-dashed border-[#B8CEB4] hover:border-teal-600 bg-white hover:bg-teal-50/40 rounded-3xl cursor-pointer transition-all group text-center space-y-3 shadow-2xs"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-50 group-hover:bg-teal-100 text-teal-800 flex items-center justify-center transition-colors">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-[#0D3B37]">Click or drag food photo here</p>
              <p className="text-xs text-[#527470] mt-1 max-w-xs mx-auto">
                Upload photos of grocery receipts, open fridge shelves, or food packages (JPG, PNG, WebP)
              </p>
            </div>
            <button
              type="button"
              className="py-2 px-4 rounded-xl bg-teal-700 text-white text-xs font-bold shadow-2xs"
            >
              Browse Files
            </button>
          </div>
        )}

        {/* Presets Mode */}
        {activeMode === 'presets' && !imagePreview && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#527470]">
              Test Gemini Multimodal Vision inference instantly with sample kitchen cart hauls:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => loadPreset(p)}
                  className="flex flex-col text-left p-4 rounded-2xl border border-[#D5E1D2] bg-white hover:border-teal-600 hover:shadow-xs transition-all group"
                >
                  <span className="text-sm font-extrabold text-[#0D3B37] group-hover:text-teal-800">
                    {p.label}
                  </span>
                  <span className="text-xs text-[#527470] mt-1 line-clamp-2">{p.description}</span>
                  <div className="mt-3 flex items-center text-xs font-bold text-teal-700 gap-1">
                    Scan Preset <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Image Preview & Scanning Spinner */}
        {imagePreview && (
          <div className="my-3 relative rounded-2xl overflow-hidden bg-slate-900 border border-[#D5E1D2] max-h-48 flex items-center justify-center">
            <img src={imagePreview} alt="Captured food" className="w-full h-48 object-contain" />
            <button
              onClick={() => {
                setImagePreview(null);
                setScanResult(null);
                setSelectedCandidates([]);
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
              title="Change photo"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {isScanning && (
          <div className="my-4 p-6 rounded-3xl bg-white border border-[#D5E1D2] flex flex-col items-center text-center shadow-xs">
            <div className="w-10 h-10 rounded-full border-3 border-teal-200 border-t-teal-700 animate-spin mb-3" />
            <p className="font-extrabold text-[#0D3B37] text-sm">Gemini Flash Vision Analyzing Groceries...</p>
            <p className="text-xs text-[#527470] max-w-sm mt-1">
              Identifying ingredients, shelf-life duration, and optimal fridge vs. freezer placement.
            </p>
          </div>
        )}

        {/* Error Notification with Friendly Recovery */}
        {errorMessage && (
          <div className="my-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
            <div className="space-y-2 flex-1">
              <p className="font-bold">Scan Notice</p>
              <p>{errorMessage}</p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setErrorMessage(null);
                  }}
                  className="py-1 px-2.5 bg-white border border-rose-300 rounded-lg text-[11px] font-bold text-rose-800 hover:bg-rose-100"
                >
                  Try Again
                </button>
                {onOpenManualAdd && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenManualAdd();
                    }}
                    className="py-1 px-2.5 bg-rose-700 text-white rounded-lg text-[11px] font-bold hover:bg-rose-800"
                  >
                    Enter Item Manually
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scan Results & Candidate Cards */}
        {scanResult && selectedCandidates.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-black text-[#0D3B37]">
                  Detected Items ({selectedCandidates.length})
                </h3>
              </div>
              <button
                onClick={handleAddAllCandidates}
                disabled={isAddingAll}
                className="py-1.5 px-3 rounded-xl bg-[#0E766E] hover:bg-[#0B5C56] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{isAddingAll ? 'Adding All...' : `Add All (${selectedCandidates.length})`}</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {selectedCandidates.map((candidate, idx) => {
                const isAdded = addedNames.has(candidate.name);

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl bg-white border transition-all ${
                      isAdded ? 'border-emerald-300 bg-emerald-50/40' : 'border-[#D5E1D2] hover:border-teal-500 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <FoodVisualBadge
                          itemName={candidate.name}
                          categoryName={candidate.category}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={candidate.name}
                            onChange={(e) => updateCandidateField(idx, 'name', e.target.value)}
                            className="font-bold text-xs text-[#0D3B37] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-600 focus:outline-none w-full"
                          />
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold text-[#527470]">
                              {candidate.quantity} {candidate.unit}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">
                              {candidate.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Storage Location Selector */}
                      <select
                        value={candidate.recommendedLocation}
                        onChange={(e) =>
                          updateCandidateField(idx, 'recommendedLocation', e.target.value as any)
                        }
                        className="text-[10px] font-bold px-2 py-1 rounded-xl bg-[#FAF7EE] border border-[#D5E1D2] text-[#0D3B37] focus:outline-none"
                      >
                        <option value="Fridge">Fridge</option>
                        <option value="Freezer">Freezer</option>
                        <option value="Pantry">Pantry</option>
                      </select>
                    </div>

                    <div className="mt-2 text-[10px] text-[#527470] bg-[#FAF7EE] p-2 rounded-xl flex items-center justify-between">
                      <span>Shelf Life: ~{candidate.estimatedShelfLifeDays}d (or {candidate.monthsFrozenShelfLife}m frozen)</span>
                      <button
                        onClick={() => handleConfirmSingleItem(candidate)}
                        disabled={isAdded}
                        className={`py-1 px-2.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                          isAdded
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-[#0E766E] hover:bg-[#0B5C56] text-white shadow-2xs'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-between items-center text-xs text-[#527470]">
              <button
                onClick={() => {
                  setImagePreview(null);
                  setScanResult(null);
                }}
                className="flex items-center gap-1 text-teal-800 font-bold hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Scan another photo
              </button>
              <button
                onClick={onClose}
                className="py-1.5 px-4 bg-[#EDF3EC] hover:bg-[#E2ECE0] text-[#0D3B37] font-bold rounded-xl transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
