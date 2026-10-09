import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Camera, Upload, Check, X, RefreshCw, Sparkles, Image as ImageIcon, Search } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../utils/i18n';

interface ChangeAvatarModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onSaveAvatar: (newAvatarUrl: string) => void;
}

export interface AvatarOption {
  id: string;
  labelEn: string;
  labelFr: string;
  url: string;
  tagEn?: string;
  tagFr?: string;
  badgeColor?: string;
  category?: 'chef' | 'savory' | 'bakery' | 'treats';
}

export const CARTOON_AVATARS: AvatarOption[] = [
  // Chefs & Critics (5)
  {
    id: 'chef_cat',
    labelEn: 'Chef Cat',
    labelFr: 'Chef Minou',
    url: '/avatars/chef-cat.svg',
    tagEn: 'Master Chef',
    tagFr: 'Grand Chef',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    category: 'chef',
  },
  {
    id: 'gourmet_fox',
    labelEn: 'Gourmet Fox',
    labelFr: 'Renard Gourmet',
    url: '/avatars/gourmet-fox.svg',
    tagEn: 'Food Critic',
    tagFr: 'Critique Gastronome',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    category: 'chef',
  },
  {
    id: 'chef_penguin',
    labelEn: 'Pingu Chef',
    labelFr: 'Pingouin Cuisto',
    url: '/avatars/chef-penguin.svg',
    tagEn: 'Pastry Chef',
    tagFr: 'Chef Pâtissier',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    category: 'chef',
  },
  {
    id: 'chef_hamster',
    labelEn: 'Chef Hamster',
    labelFr: 'Hamster Fromage',
    url: '/avatars/chef-hamster.svg',
    tagEn: 'Cheese Lover',
    tagFr: 'Amateur Fromage',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    category: 'chef',
  },
  {
    id: 'ninja_broccoli',
    labelEn: 'Ninja Broccoli',
    labelFr: 'Ninja Brocoli',
    url: '/avatars/ninja-broccoli.svg',
    tagEn: 'Kitchen Defender',
    tagFr: 'Héros Cuistot',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    category: 'chef',
  },

  // Savory & Main Dishes (10)
  {
    id: 'sunny_egg',
    labelEn: 'Sunny Egg',
    labelFr: 'Œuf Solaire',
    url: '/avatars/sunny-egg.svg',
    tagEn: 'Breakfast Champ',
    tagFr: 'Brunch Gourmand',
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    category: 'savory',
  },
  {
    id: 'taco_turtle',
    labelEn: 'Taco Turtle',
    labelFr: 'Tortue Taco',
    url: '/avatars/taco-turtle.svg',
    tagEn: 'Fiesta Chef',
    tagFr: 'Chef Fiesta',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    category: 'savory',
  },
  {
    id: 'pizza_raccoon',
    labelEn: 'Pizza Raccoon',
    labelFr: 'Raton Pizza',
    url: '/avatars/pizza-raccoon.svg',
    tagEn: 'Slice Lover',
    tagFr: 'Fan de Pizza',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
    category: 'savory',
  },
  {
    id: 'ramen_otter',
    labelEn: 'Ramen Otter',
    labelFr: 'Loutre Ramen',
    url: '/avatars/ramen-otter.svg',
    tagEn: 'Noodle Master',
    tagFr: 'Maître Nouilles',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    category: 'savory',
  },
  {
    id: 'sushi_seal',
    labelEn: 'Sushi Seal',
    labelFr: 'Phoque Sushi',
    url: '/avatars/sushi-seal.svg',
    tagEn: 'Maki Artist',
    tagFr: 'Artiste Maki',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    category: 'savory',
  },
  {
    id: 'soup_duck',
    labelEn: 'Soup Duck',
    labelFr: 'Canard Marmite',
    url: '/avatars/soup-duck.svg',
    tagEn: 'Broth Specialist',
    tagFr: 'Mijoteur Gourmand',
    badgeColor: 'bg-lime-100 text-lime-800 border-lime-200',
    category: 'savory',
  },
  {
    id: 'spicy_dragon',
    labelEn: 'Spicy Dragon',
    labelFr: 'Dragon Pimenté',
    url: '/avatars/spicy-dragon.svg',
    tagEn: 'Chili Champion',
    tagFr: 'Roi du Piment',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    category: 'savory',
  },
  {
    id: 'cheesy_mouse',
    labelEn: 'Cheesy Mouse',
    labelFr: 'Souris Fromagère',
    url: '/avatars/cheesy-mouse.svg',
    tagEn: 'Fondue Master',
    tagFr: 'Expert Fondue',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    category: 'savory',
  },
  {
    id: 'dimsum_piggy',
    labelEn: 'Dim Sum Piggy',
    labelFr: 'Cochonnet Bao',
    url: '/avatars/dimsum-piggy.svg',
    tagEn: 'Dumpling King',
    tagFr: 'Roi du Bao',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
    category: 'savory',
  },
  {
    id: 'pasta_lion',
    labelEn: 'Pasta Lion',
    labelFr: 'Lion Pasta',
    url: '/avatars/pasta-lion.svg',
    tagEn: 'Al Dente Hero',
    tagFr: 'Héros Al Dente',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    category: 'savory',
  },

  // Bakery & Dough (5)
  {
    id: 'baker_bear',
    labelEn: 'Baker Bear',
    labelFr: 'Ours Boulanger',
    url: '/avatars/baker-bear.svg',
    tagEn: 'Croissant Master',
    tagFr: 'Maître Boulanger',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    category: 'bakery',
  },
  {
    id: 'cookie_dog',
    labelEn: 'Cookie Dog',
    labelFr: 'Toutou Biscuit',
    url: '/avatars/cookie-dog.svg',
    tagEn: 'Sweet Baker',
    tagFr: 'Pâtissier Croquant',
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    category: 'bakery',
  },
  {
    id: 'pancake_sloth',
    labelEn: 'Pancake Sloth',
    labelFr: 'Paresseux Pancake',
    url: '/avatars/pancake-sloth.svg',
    tagEn: 'Maple Syrup Fan',
    tagFr: 'Sirop d’Érable',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    category: 'bakery',
  },
  {
    id: 'waffle_hedgehog',
    labelEn: 'Waffle Hedgehog',
    labelFr: 'Hérisson Gaufre',
    url: '/avatars/waffle-hedgehog.svg',
    tagEn: 'Crispy Crunch',
    tagFr: 'Crousti Doré',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    category: 'bakery',
  },
  {
    id: 'pretzel_squirrel',
    labelEn: 'Pretzel Squirrel',
    labelFr: 'Écureuil Bretzel',
    url: '/avatars/pretzel-squirrel.svg',
    tagEn: 'Salt & Dough',
    tagFr: 'Doré & Croquant',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-200',
    category: 'bakery',
  },

  // Sweets, Drinks & Veggie (10)
  {
    id: 'happy_avocado',
    labelEn: 'Happy Avo',
    labelFr: 'Guaca-Cool',
    url: '/avatars/happy-avocado.svg',
    tagEn: 'Fresh & Green',
    tagFr: 'Frais & Bio',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    category: 'treats',
  },
  {
    id: 'veggie_bunny',
    labelEn: 'Veggie Bunny',
    labelFr: 'Lapin Maraîcher',
    url: '/avatars/veggie-bunny.svg',
    tagEn: 'Garden Fresh',
    tagFr: 'Potager Bio',
    badgeColor: 'bg-green-100 text-green-800 border-green-200',
    category: 'treats',
  },
  {
    id: 'boba_panda',
    labelEn: 'Boba Panda',
    labelFr: 'Panda Tablier',
    url: '/avatars/boba-panda.svg',
    tagEn: 'Sweet Delights',
    tagFr: 'Gourmandises',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
    category: 'treats',
  },
  {
    id: 'barista_koala',
    labelEn: 'Barista Koala',
    labelFr: 'Koala Barista',
    url: '/avatars/barista-koala.svg',
    tagEn: 'Coffee Artisan',
    tagFr: 'Artisan Café',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    category: 'treats',
  },
  {
    id: 'berry_deer',
    labelEn: 'Berry Deer',
    labelFr: 'Cerf Myrtille',
    url: '/avatars/berry-deer.svg',
    tagEn: 'Forest Berries',
    tagFr: 'Fruits des Bois',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    category: 'treats',
  },
  {
    id: 'honey_badger',
    labelEn: 'Honey Badger',
    labelFr: 'Blaireau Miel',
    url: '/avatars/honey-badger.svg',
    tagEn: 'Golden Nectar',
    tagFr: 'Nectar Sucré',
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    category: 'treats',
  },
  {
    id: 'cupcake_kitty',
    labelEn: 'Cupcake Kitty',
    labelFr: 'Minette Cupcake',
    url: '/avatars/cupcake-kitty.svg',
    tagEn: 'Frosting Star',
    tagFr: 'Étoile Glaçage',
    badgeColor: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    category: 'treats',
  },
  {
    id: 'mango_monkey',
    labelEn: 'Mango Monkey',
    labelFr: 'Singe Mangue',
    url: '/avatars/mango-monkey.svg',
    tagEn: 'Tropical Smoothie',
    tagFr: 'Délices Exotiques',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    category: 'treats',
  },
  {
    id: 'matcha_frog',
    labelEn: 'Matcha Frog',
    labelFr: 'Grenouille Matcha',
    url: '/avatars/matcha-frog.svg',
    tagEn: 'Zen Tea Master',
    tagFr: 'Maître Zen Thé',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    category: 'treats',
  },
  {
    id: 'donut_elephant',
    labelEn: 'Donut Elephant',
    labelFr: 'Éléphanteau Donut',
    url: '/avatars/donut-elephant.svg',
    tagEn: 'Sprinkles Magic',
    tagFr: 'Magie Glacée',
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
    category: 'treats',
  },
];

const PRESET_AVATARS = CARTOON_AVATARS;

export const ChangeAvatarModal: React.FC<ChangeAvatarModalProps> = ({
  isOpen,
  user,
  onClose,
  onSaveAvatar,
}) => {
  const { lang } = useLanguage();
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user.avatarUrl || CARTOON_AVATARS[0].url);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isCapturingCamera, setIsCapturingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'chef' | 'savory' | 'bakery' | 'treats'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (user.avatarUrl) {
      setSelectedAvatar(user.avatarUrl);
    }
  }, [user.avatarUrl, isOpen]);

  const filteredAvatars = useMemo(() => {
    return CARTOON_AVATARS.filter((avatar) => {
      if (selectedCategory !== 'all' && avatar.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const en = (avatar.labelEn || '').toLowerCase();
        const fr = (avatar.labelFr || '').toLowerCase();
        const tagEn = (avatar.tagEn || '').toLowerCase();
        const tagFr = (avatar.tagFr || '').toLowerCase();
        return en.includes(q) || fr.includes(q) || tagEn.includes(q) || tagFr.includes(q);
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  // Handle local file upload (converts & compresses to 256x256 base64 Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError(lang === 'FR' ? 'Veuillez sélectionner un fichier image valide' : 'Please select a valid image file');
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
            <div className="relative group">
              <img
                src={selectedAvatar}
                alt="Avatar preview"
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-emerald-500/30 transition-transform group-hover:scale-105"
              />
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-600 text-white shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-[#233527] block">
                {lang === 'FR' ? 'Aperçu de votre avatar' : 'Active Avatar Preview'}
              </span>
              {CARTOON_AVATARS.some((c) => c.url === selectedAvatar) && (
                <span className="inline-block mt-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ✨ {lang === 'FR' ? 'Avatar Cartoon Créatif' : 'Cartoon Avatar'}
                </span>
              )}
            </div>
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
                placeholder="https://example.com/avatar.png"
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

          {/* Upload Error feedback */}
          {uploadError && (
            <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {uploadError}
            </p>
          )}

          {/* Preset Avatar Gallery */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#556D58] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {lang === 'FR' ? 'Choisir un avatar de cuisine' : 'Select a Kitchen Avatar'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#557559] bg-[#E8F3E5] px-2 py-0.5 rounded-full">
                  {filteredAvatars.length} / {CARTOON_AVATARS.length} {lang === 'FR' ? 'personnages' : 'avatars'}
                </span>
              </div>
            </div>

            {/* Category tabs & Search filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {(
                  [
                    { key: 'all', labelEn: 'All (30)', labelFr: 'Tous (30)' },
                    { key: 'chef', labelEn: 'Chefs', labelFr: 'Chefs & Cuistots' },
                    { key: 'savory', labelEn: 'Savory', labelFr: 'Plats & Saveurs' },
                    { key: 'bakery', labelEn: 'Bakery', labelFr: 'Boulangerie' },
                    { key: 'treats', labelEn: 'Sweets & Drinks', labelFr: 'Douceurs & Boissons' },
                  ] as const
                ).map((cat) => {
                  const isActive = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-[#F2F7F0] text-[#47654B] hover:bg-[#E5EFE2]'
                      }`}
                    >
                      {lang === 'FR' ? cat.labelFr : cat.labelEn}
                    </button>
                  );
                })}
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'FR'
                      ? 'Rechercher un personnage (ex: chat, pizza, dragon, cookie)...'
                      : 'Search character (e.g. cat, pizza, dragon, cookie)...'
                  }
                  className="w-full pl-8 pr-8 py-1.5 rounded-xl border border-[#D5E1D2] bg-white text-xs text-[#1F3323] focus:outline-emerald-600"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Avatars Grid */}
            {filteredAvatars.length === 0 ? (
              <div className="text-center py-8 bg-[#FAFBF9] rounded-2xl border border-dashed border-[#DFE7DD]">
                <p className="text-xs text-[#527470] font-medium">
                  {lang === 'FR' ? 'Aucun avatar correspondant trouvé.' : 'No matching avatars found.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-2 text-xs font-bold text-emerald-700 underline cursor-pointer"
                >
                  {lang === 'FR' ? 'Afficher tous les 30 avatars' : 'Show all 30 avatars'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredAvatars.map((avatar) => {
                  const isChosen = selectedAvatar === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.url)}
                      className={`relative p-2 rounded-2xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer group text-left ${
                        isChosen
                          ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/30 shadow-sm'
                          : 'border-[#E0EBDD] bg-white hover:border-emerald-300 hover:bg-[#F7FAF6] hover:shadow-xs'
                      }`}
                    >
                      <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-xs group-hover:scale-105 transition-transform bg-[#F9FAF8]">
                        <img
                          src={avatar.url}
                          alt={lang === 'FR' ? avatar.labelFr : avatar.labelEn}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="w-full text-center">
                        <span className="text-[10px] font-black text-[#1F3323] truncate block leading-tight">
                          {lang === 'FR' ? avatar.labelFr : avatar.labelEn}
                        </span>
                        {avatar.badgeColor && (
                          <span
                            className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded-md border mt-0.5 max-w-full truncate ${avatar.badgeColor}`}
                          >
                            {lang === 'FR' ? avatar.tagFr : avatar.tagEn}
                          </span>
                        )}
                      </div>

                      {isChosen && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
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
