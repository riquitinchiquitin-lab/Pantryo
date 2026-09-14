import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Sparkles, Check, AlertCircle, RefreshCw, X, ArrowRight, ShieldCheck, Snowflake, Refrigerator, Boxes } from 'lucide-react';
import { ScannedItemCandidate, ScanResponse } from '../types';
import { FoodVisualBadge } from './FoodVisualBadge';
import { PantryoLogo } from './PantryoLogo';

interface CameraScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: any) => void;
  currentUser: { id: string; name: string };
}

// Preset test images with embedded sample base64/SVG or data URI for instant zero-friction demo testing
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
        storageTip: 'Store on the middle or bottom shelf; door shelves fluctuate too much.',
      },
      {
        name: 'Fresh Strawberries',
        category: 'Produce',
        quantity: 1,
        unit: 'clamshell (1 lb)',
        recommendedLocation: 'Fridge' as const,
        storageReason: 'High moisture and mold risk at room temperature.',
        estimatedShelfLifeDays: 3,
        monthsFrozenShelfLife: 10,
        confidence: 0.95,
        storageTip: 'Do not wash until immediately before consuming.',
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
        storageTip: 'Wrap tightly with freezer paper or vacuum seal to avoid freezer burn.',
      },
      {
        name: 'Wild Atlantic Salmon Fillet',
        category: 'Meat & Seafood',
        quantity: 1.5,
        unit: 'lbs',
        recommendedLocation: 'Freezer' as const,
        storageReason: 'Fish oil oxidizes rapidly; freeze at 0°F if not cooking in 24h.',
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
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'camera' | 'preset'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<ScannedItemCandidate[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Video / Webcam stream ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera when camera mode is selected
  useEffect(() => {
    if (isOpen && activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera device access declined or unavailable:', err);
      setErrorMessage('Camera access unavailable. You can upload an image file or use a preset.');
      setActiveMode('upload');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImagePreview(dataUrl);
      stopCamera();
      triggerAiScan(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      triggerAiScan(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const triggerAiScan = async (base64Img: string) => {
    setIsScanning(true);
    setErrorMessage(null);
    setScanResult(null);

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
        throw new Error(data.error || 'Failed to process vision scan');
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

  const handleConfirmItem = async (candidate: ScannedItemCandidate) => {
    setIsAdding(true);
    try {
      // Calculate target expiration
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
      // Remove from candidate list
      setSelectedCandidates((prev) => prev.filter((c) => c.name !== candidate.name));
    } catch (err: any) {
      alert(`Error saving item: ${err.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="camera-scanner-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        id="camera-scanner-modal-container"
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#FAF7EE] border border-[#E0D9C8] rounded-3xl shadow-2xl p-6 text-[#133E3B]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
          <div className="flex items-center gap-3">
            <PantryoLogo size={42} />
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#0D3B37]">SNAP & ADD! Vision Scanner</h2>
              <p className="text-xs text-[#527470]">Powered by Google Gemini Flash Vision API</p>
            </div>
          </div>
          <button
            id="close-scanner-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Switcher Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 my-4 bg-[#EDF3EC] rounded-2xl">
          <button
            id="tab-camera-mode"
            onClick={() => { setActiveMode('camera'); setImagePreview(null); setScanResult(null); }}
            className={`py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'camera' ? 'bg-white text-[#233527] shadow-sm' : 'text-[#607464] hover:text-[#233527]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live Camera
          </button>
          <button
            id="tab-upload-mode"
            onClick={() => { setActiveMode('upload'); stopCamera(); }}
            className={`py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'upload' ? 'bg-white text-[#233527] shadow-sm' : 'text-[#607464] hover:text-[#233527]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
          <button
            id="tab-preset-mode"
            onClick={() => { setActiveMode('preset'); stopCamera(); }}
            className={`py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'preset' ? 'bg-white text-[#233527] shadow-sm' : 'text-[#607464] hover:text-[#233527]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Kitchen Presets
          </button>
        </div>

        {/* Camera Feed Mode */}
        {activeMode === 'camera' && !imagePreview && (
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed border-[#A9C2A4]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none border-4 border-white/20 rounded-2xl flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-dashed border-white/60 rounded-2xl animate-pulse" />
            </div>
            <button
              id="snap-shutter-btn"
              onClick={capturePhotoFromCamera}
              className="absolute bottom-5 py-3 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Camera className="w-5 h-5" />
              Capture & Inspect
            </button>
          </div>
        )}

        {/* Upload File Mode */}
        {activeMode === 'upload' && !imagePreview && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#B8CEB4] hover:border-emerald-500 bg-[#F4F8F3] hover:bg-[#EDF5EC] rounded-2xl cursor-pointer transition-all group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <div className="w-14 h-14 mb-3 rounded-full bg-emerald-100 group-hover:bg-emerald-200 text-emerald-700 flex items-center justify-center transition-colors">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-semibold text-sm text-[#243728]">Click or drag & drop food photo</p>
            <p className="text-xs text-[#627765] mt-1">Accepts grocery receipts, open fridge photos, or product labels (PNG, JPG)</p>
          </div>
        )}

        {/* Preset Sample Mode */}
        {activeMode === 'preset' && !imagePreview && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#5D7060]">Choose a curated kitchen haul to test Gemini Flash Vision inference instantly:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => loadPreset(p)}
                  className="flex flex-col text-left p-4 rounded-2xl border border-[#D5E1D2] bg-white hover:border-emerald-500 hover:shadow-md transition-all group"
                >
                  <span className="text-sm font-bold text-[#233527] group-hover:text-emerald-700">{p.label}</span>
                  <span className="text-xs text-[#5D7060] mt-1 line-clamp-2">{p.description}</span>
                  <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600 gap-1">
                    Scan Preset <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scanning Spinner / State */}
        {isScanning && (
          <div className="my-6 p-6 rounded-2xl bg-white border border-[#D5E1D2] flex flex-col items-center text-center shadow-sm">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mb-3" />
            <p className="font-bold text-[#233527] text-sm">Gemini Flash Vision Analyzing Image...</p>
            <p className="text-xs text-[#5D7060] max-w-sm mt-1">
              Extracting food items, predicting shelf-life duration, and recommending fridge vs. freezer placement.
            </p>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="my-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Vision Scan Warning</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Scan Results & Auto-populated Fields */}
        {scanResult && selectedCandidates.length > 0 && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-[#233527]">
                  Detected Items ({selectedCandidates.length})
                </h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                Gemini Flash Vision Verified
              </span>
            </div>

            <div className="space-y-3">
              {selectedCandidates.map((candidate, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-[#D5E1D2] shadow-sm flex flex-col gap-3 transition-all hover:border-emerald-400"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <FoodVisualBadge
                        itemName={candidate.name}
                        categoryName={candidate.category}
                        size="sm"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-[#233527]">{candidate.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#EDF3EC] text-[#3D5241]">
                            {candidate.quantity} {candidate.unit}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium">
                            {candidate.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        candidate.recommendedLocation === 'Freezer'
                          ? 'bg-blue-100 text-blue-800'
                          : candidate.recommendedLocation === 'Pantry'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {candidate.recommendedLocation === 'Freezer' ? (
                        <Snowflake className="w-3 h-3 text-blue-600" />
                      ) : candidate.recommendedLocation === 'Pantry' ? (
                        <Boxes className="w-3 h-3 text-amber-700" />
                      ) : (
                        <Refrigerator className="w-3 h-3 text-emerald-700" />
                      )}
                      {candidate.recommendedLocation}
                    </span>
                  </div>

                  <div className="text-xs text-[#5D7060] bg-[#F7FAF6] p-2.5 rounded-xl border border-[#E4ECE1] space-y-1">
                    <p><strong className="text-[#324535]">Shelf Life:</strong> ~{candidate.estimatedShelfLifeDays} days (or {candidate.monthsFrozenShelfLife} mos frozen)</p>
                    {candidate.storageTip && (
                      <p className="text-[11px] italic text-[#546A58]">💡 Tip: {candidate.storageTip}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EEF3ED]">
                    <button
                      onClick={() => handleConfirmItem(candidate)}
                      disabled={isAdding}
                      className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Add to Inventory
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center text-xs text-[#5D7060]">
              <button
                onClick={() => { setImagePreview(null); setScanResult(null); }}
                className="flex items-center gap-1 text-[#4F6854] hover:text-[#233527] font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Scan another photo
              </button>
              <button
                onClick={onClose}
                className="py-1.5 px-4 bg-[#EDF3EC] hover:bg-[#E2ECE0] text-[#2C3E30] font-bold rounded-xl transition-all"
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
