import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Check, X, RefreshCw, Sparkles, Image as ImageIcon } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../utils/i18n';

interface ChangeAvatarModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onSaveAvatar: (newAvatarUrl: string) => void;
}

const PRESET_AVATARS = [
  {
    id: 'chef_1',
    labelEn: 'Executive Chef',
    labelFr: 'Chef Cuisinier',
    url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=250&q=80',
  },
  {
    id: 'baker_1',
    labelEn: 'Master Baker',
    labelFr: 'Boulanger Gourmet',
    url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=250&q=80',
  },
  {
    id: 'smile_man',
    labelEn: 'Casual Foodie',
    labelFr: 'Amateur Gourmand',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
  },
  {
    id: 'smile_woman',
    labelEn: 'Fresh Market Shopper',
    labelFr: 'Passionnée du Marché',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  },
  {
    id: 'friendly_culinary',
    labelEn: 'Home Cook',
    labelFr: 'Cuisinier Maison',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  },
  {
    id: 'organic_gardener',
    labelEn: 'Urban Gardener',
    labelFr: 'Jardinier Urbain',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  },
  {
    id: 'modern_host',
    labelEn: 'Brunch Host',
    labelFr: 'Hôte Convivial',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
  },
  {
    id: 'eco_chef',
    labelEn: 'Zero-Waste Enthusiast',
    labelFr: 'Passionné Anti-Gaspi',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  },
];

export const ChangeAvatarModal: React.FC<ChangeAvatarModalProps> = ({
  isOpen,
  user,
  onClose,
  onSaveAvatar,
}) => {
  const { lang } = useLanguage();
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user.avatarUrl || PRESET_AVATARS[0].url);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isCapturingCamera, setIsCapturingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (user.avatarUrl) {
      setSelectedAvatar(user.avatarUrl);
    }
  }, [user.avatarUrl, isOpen]);

  if (!isOpen) return null;

  // Handle local file upload (converts & compresses to 256x256 base64 Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(lang === 'FR' ? 'Veuillez sélectionner un fichier image valide' : 'Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Draw cropped center square
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            setSelectedAvatar(dataUrl);
          } else {
            setSelectedAvatar(reader.result as string);
          }
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
    // Reset input value so same file can be re-selected if desired
    e.target.value = '';
  };

  // Start live webcam capture
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 400 }, height: { ideal: 400 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCapturingCamera(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        lang === 'FR'
          ? 'Impossible d\'accéder à la caméra. Vérifiez les permissions de votre navigateur.'
          : 'Unable to access camera. Please check browser permissions.'
      );
    }
  };

  // Snap photo from webcam
  const snapPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 300, 300);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedAvatar(dataUrl);
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturingCamera(false);
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim().startsWith('http')) {
      setSelectedAvatar(customUrlInput.trim());
      setCustomUrlInput('');
    }
  };

  const handleSave = () => {
    stopCamera();
    onSaveAvatar(selectedAvatar);
    onClose();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#D5E1D2] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5EFE2] flex items-center justify-between bg-[#F8FAF7] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#1F3323]">
                {lang === 'FR' ? 'Changer la photo de profil' : 'Change Profile Picture'}
              </h3>
              <p className="text-[11px] text-[#69856C]">
                {user.name} ({user.role === 'ADMIN' ? 'Admin' : 'Member'})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Current Avatar Preview */}
          <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#F3F8F1] border border-[#D9E6D6]">
            <div className="relative">
              <img
                src={selectedAvatar}
                alt="Avatar preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-emerald-500/30"
              />
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-600 text-white shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
            <span className="text-xs font-bold text-[#233527]">
              {lang === 'FR' ? 'Aperçu de votre avatar' : 'Active Avatar Preview'}
            </span>
          </div>

          {/* Camera Capture Section */}
          {isCapturingCamera ? (
            <div className="p-3 rounded-2xl bg-black text-white space-y-2.5 flex flex-col items-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-48 h-48 rounded-full object-cover border-2 border-emerald-400"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={snapPhoto}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{lang === 'FR' ? 'Prendre la photo' : 'Capture Photo'}</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold cursor-pointer"
                >
                  {lang === 'FR' ? 'Annuler' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={startCamera}
                className="p-3 rounded-2xl border-2 border-dashed border-[#C5D8C2] hover:border-emerald-500 hover:bg-emerald-50/50 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold text-[#233527] cursor-pointer"
              >
                <Camera className="w-5 h-5 text-emerald-600" />
                <span>{lang === 'FR' ? 'Prendre une photo' : 'Take a Photo'}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl border-2 border-dashed border-[#C5D8C2] hover:border-emerald-500 hover:bg-emerald-50/50 flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold text-[#233527] cursor-pointer"
              >
                <Upload className="w-5 h-5 text-emerald-600" />
                <span>{lang === 'FR' ? 'Importer un fichier' : 'Upload File'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {cameraError && (
            <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {cameraError}
            </p>
          )}

          {/* Custom Image URL Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#556D58] uppercase tracking-wider block">
              {lang === 'FR' ? 'Ou coller une URL d’image web' : 'Or paste a web image URL'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#D5E1D2] focus:outline-emerald-600 focus:bg-white bg-[#F9FAF8]"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                disabled={!customUrlInput.trim().startsWith('http')}
                className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
              >
                {lang === 'FR' ? 'Appliquer' : 'Apply'}
              </button>
            </div>
          </div>

          {/* Preset Avatar Gallery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#556D58] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {lang === 'FR' ? 'Galerie d’avatars culinaires' : 'Culinary Avatars Gallery'}
              </span>
              <span className="text-[10px] text-[#7B947E]">
                {PRESET_AVATARS.length} {lang === 'FR' ? 'options' : 'options'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {PRESET_AVATARS.map((avatar) => {
                const isChosen = selectedAvatar === avatar.url;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar.url)}
                    className={`relative p-1 rounded-2xl border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      isChosen
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-[#E0EBDD] hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={avatar.url}
                      alt={lang === 'FR' ? avatar.labelFr : avatar.labelEn}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <span className="text-[9px] font-bold text-[#354C38] truncate w-full text-center px-0.5">
                      {lang === 'FR' ? avatar.labelFr : avatar.labelEn}
                    </span>
                    {isChosen && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#E5EFE2] bg-[#F8FAF7] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {lang === 'FR' ? 'Annuler' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-transform active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{lang === 'FR' ? 'Enregistrer l\'avatar' : 'Save Picture'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
