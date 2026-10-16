import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Server,
  Terminal,
  Cpu,
  Shield,
  Sparkles,
  Globe,
  ExternalLink,
  Download,
  BookOpen,
  ArrowRight,
  Layers,
  FileText,
  Key,
  HardDrive,
  RefreshCw,
  Zap,
  CheckCircle2,
  Box,
  Smartphone,
  Refrigerator,
  UtensilsCrossed,
  ScanLine,
} from 'lucide-react';
import { PantryoLogo } from './PantryoLogo';
import { useLanguage, LanguageSwitcher } from '../utils/i18n';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'features' | 'proxmox' | 'linux' | 'cloudflare' | 'security';
}

export function DocumentationModal({
  isOpen,
  onClose,
  initialTab = 'features',
}: DocumentationModalProps) {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'features' | 'proxmox' | 'linux' | 'cloudflare' | 'security'>(initialTab);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedLinuxDistro, setSelectedLinuxDistro] = useState<'rpi' | 'debian_ubuntu' | 'dietpi' | 'fedora' | 'arch'>('rpi');
  const [selectedProxy, setSelectedProxy] = useState<'cloudflare' | 'caddy' | 'nginx' | 'npm' | 'traefik'>('cloudflare');

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'http://localhost:3000';

  const copyToClipboard = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.warn('Failed to copy command:', err);
    }
  };

  const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/riquitinchiquitin-lab/Pantryo/main';
  const proxmoxCurlCommand = `bash -c "$(curl -fsSL ${GITHUB_RAW_BASE}/install-proxmox.sh)"`;
  const linuxCurlCommand = `curl -fsSL ${GITHUB_RAW_BASE}/install.sh | sudo bash`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in overflow-hidden">
      <div className="bg-[#FAF7EE] text-[#133E3B] w-full max-w-5xl max-h-[92vh] rounded-3xl border border-[#E0D9C8] shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Top Header Bar */}
        <div className="px-5 py-4 bg-white border-b border-[#E0D9C8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <PantryoLogo size={34} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-[#0D3B37] tracking-tight">
                  {lang === 'FR' ? 'Centre de Documentation & Auto-Hébergement' : 'Documentation & Self-Hosting Hub'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
                  v2.4 LTS
                </span>
              </div>
              <p className="text-xs text-[#527470]">
                {lang === 'FR'
                  ? 'Guide complet Proxmox VE, Raspberry Pi, Linux, Cloudflare & Spécifications'
                  : 'Complete runbook for Proxmox VE, Raspberry Pi, Linux, Cloudflare & Specs'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer active:scale-95"
              title={lang === 'FR' ? 'Fermer' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 py-2.5 bg-[#F2EDE1] border-b border-[#E0D9C8] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('features')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'features'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-[#3B5B56] hover:bg-white/80 hover:text-[#0D3B37]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'FR' ? '✨ Fonctionnalités' : '✨ Features Tour'}</span>
          </button>

          <button
            onClick={() => setActiveTab('proxmox')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'proxmox'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-[#3B5B56] hover:bg-white/80 hover:text-[#0D3B37]'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-orange-400" />
            <span>{lang === 'FR' ? '📦 Proxmox VE (LXC)' : '📦 Proxmox VE (LXC)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('linux')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'linux'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-[#3B5B56] hover:bg-white/80 hover:text-[#0D3B37]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-red-500" />
            <span>{lang === 'FR' ? '🍓 Raspberry Pi & Linux' : '🍓 Raspberry Pi & Linux'}</span>
          </button>

          <button
            onClick={() => setActiveTab('cloudflare')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'cloudflare'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-[#3B5B56] hover:bg-white/80 hover:text-[#0D3B37]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>{lang === 'FR' ? '🌐 Reverse Proxies (5 Choix)' : '🌐 Reverse Proxies (5 Options)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-[#3B5B56] hover:bg-white/80 hover:text-[#0D3B37]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>{lang === 'FR' ? '🛡️ Sécurité & Specs' : '🛡️ Security & Specs'}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: FEATURES TOUR */}
          {activeTab === 'features' && (
            <div className="space-y-6 animate-fade-in">
              {/* Hero Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-900 to-[#0A2E2A] text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 max-w-2xl space-y-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30">
                    {lang === 'FR' ? 'Système Culinaire Souverain' : 'Sovereign Kitchen OS'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-teal-50">
                    {lang === 'FR'
                      ? 'L’OS de cuisine autonome, anti-gaspillage et ultra-léger'
                      : 'The autonomous, zero-waste, ultra-lightweight kitchen OS'}
                  </h3>
                  <p className="text-xs sm:text-sm text-teal-200/90 leading-relaxed">
                    {lang === 'FR'
                      ? 'Conçu pour tourner sur votre propre matériel (Proxmox VE, Raspberry Pi, mini PC) sans dépendance cloud, avec IA visuelle locale, chiffrement AES 256 bits et synchronisation familiale instantanée.'
                      : 'Engineered to run on your own hardware (Proxmox VE, Raspberry Pi, mini PC) without cloud surveillance, featuring local AI vision, 256-bit AES encryption, and real-time household sync.'}
                  </p>
                </div>
              </div>

              {/* 5 Feature Highlight Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. AI Vision */}
                <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <ScanLine className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#0D3B37]">
                    {lang === 'FR' ? '1. Scanner IA Visuel & OCR de Reçus' : '1. On-Device AI Vision & Receipt OCR'}
                  </h4>
                  <p className="text-xs text-[#527470] leading-relaxed">
                    {lang === 'FR'
                      ? 'Modèle de vision MobileNetV2 (399 classes de fruits, légumes et produits frais) s’exécutant en local dans le navigateur en <80 ms, combiné à un OCR de tickets de caisse avec catégorisation automatique.'
                      : 'Client-side MobileNetV2 neural vision (399 produce classes) running in under 80 ms, combined with multi-line grocery receipt OCR and automatic shelf-life categorization.'}
                  </p>
                  <div className="pt-2 border-t border-[#F0EBE0] flex items-center justify-between text-[11px] font-bold text-amber-800">
                    <span>399 classes</span>
                    <span>100% Hors-Ligne</span>
                  </div>
                </div>

                {/* 2. Inventory Zones */}
                <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                    <Refrigerator className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#0D3B37]">
                    {lang === 'FR' ? '2. Inventaire 4 Zones & Gestion FIFO' : '2. 4-Zone Inventory & FIFO Tracking'}
                  </h4>
                  <p className="text-xs text-[#527470] leading-relaxed">
                    {lang === 'FR'
                      ? 'Gestion granulaire : Frigo, Garde-manger, Congélateur et Épices. Compte à rebours de péremption visuel (frais, alerte, critique) et politique de consommation Premier Entré, Premier Sorti.'
                      : 'Granular tracking across Fridge, Pantry, Freezer, and Spice Rack. Visual expiration countdowns (fresh, warning, critical) and First-In First-Out rotation to eliminate spoilage.'}
                  </p>
                  <div className="pt-2 border-t border-[#F0EBE0] flex items-center justify-between text-[11px] font-bold text-teal-800">
                    <span>Frigo · Cellier · Congélo · Épices</span>
                    <span>Zéro Gâchis</span>
                  </div>
                </div>

                {/* 3. Culinary Engine */}
                <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#0D3B37]">
                    {lang === 'FR' ? '3. Moteur Culinaire & Anti-Gaspillage' : '3. Zero-Waste Culinary & Meal Engine'}
                  </h4>
                  <p className="text-xs text-[#527470] leading-relaxed">
                    {lang === 'FR'
                      ? 'Génération de recettes intelligentes priorisant les aliments proches de la date limite. Détection des ingrédients manquants avec transfert instantané vers la liste de courses.'
                      : 'Expiring-first recipe matcher that prioritizes rescuing foods before they spoil. Automatically detects missing ingredients and adds them straight to your grocery checklist.'}
                  </p>
                  <div className="pt-2 border-t border-[#F0EBE0] flex items-center justify-between text-[11px] font-bold text-emerald-800">
                    <span>Priorité Dates Courtes</span>
                    <span>Mode Cuisine Pas-à-Pas</span>
                  </div>
                </div>

                {/* 4. Security & Encryption */}
                <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-800 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#0D3B37]">
                    {lang === 'FR' ? '4. Chiffrement AES-256 & FIDO2 Passkeys' : '4. 256-Bit AES SQLCipher & Passkeys'}
                  </h4>
                  <p className="text-xs text-[#527470] leading-relaxed">
                    {lang === 'FR'
                      ? 'Base de données SQLite chiffrée au repos avec SQLCipher AES-256. Clés FIDO2 WebAuthn (Touch ID, Face ID, Windows Hello, YubiKey) et dérivation Argon2id sans mots de passe en clair.'
                      : 'Embedded SQLite database encrypted at rest with 256-bit AES SQLCipher. Passwordless FIDO2 WebAuthn Passkeys (Touch ID, Face ID, YubiKey) with Argon2id memory-hard key derivation.'}
                  </p>
                  <div className="pt-2 border-t border-[#F0EBE0] flex items-center justify-between text-[11px] font-bold text-indigo-800">
                    <span>SQLCipher AES-256</span>
                    <span>FIDO2 / WebAuthn</span>
                  </div>
                </div>
              </div>

              {/* Homelab Spec Summary */}
              <div className="p-5 rounded-2xl bg-[#EFE9DA] border border-[#DCD3C0] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Server className="w-8 h-8 text-teal-800 shrink-0" />
                  <div>
                    <h5 className="font-extrabold text-sm text-[#0D3B37]">
                      {lang === 'FR' ? 'Empreinte Mémoire Record : ~140 Mo de RAM' : 'Ultra-Low Footprint: ~140 MB RAM'}
                    </h5>
                    <p className="text-xs text-[#527470]">
                      {lang === 'FR'
                        ? 'Aucun service lourd (pas de cluster Postgres/Redis requis). Parfait pour Proxmox LXC ou Raspberry Pi.'
                        : 'Zero heavy dependencies (no Postgres or Redis cluster needed). Runs flawlessly on single-board computers.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('proxmox')}
                  className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition-transform active:scale-95 shadow-xs cursor-pointer"
                >
                  <span>{lang === 'FR' ? 'Voir le Guide Proxmox' : 'View Proxmox Guide'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PROXMOX VE LXC GUIDE */}
          {activeTab === 'proxmox' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Box */}
              <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0D3B37]">
                        {lang === 'FR' ? 'Déploiement Automatisé Proxmox VE (Conteneur LXC)' : 'Automated Proxmox VE LXC Deployment'}
                      </h4>
                      <p className="text-[11px] text-[#527470]">
                        {lang === 'FR' ? 'Testé et validé sur Proxmox VE 7.x et 8.x' : 'Tested and validated on Proxmox VE 7.x and 8.x'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {lang === 'FR' ? '1 LIGNE DE COMMANDE' : '1-LINE INSTALL'}
                  </span>
                </div>

                <p className="text-xs text-[#3A5D57] leading-relaxed">
                  {lang === 'FR'
                    ? 'Le script d’installation officiel crée automatiquement un conteneur Debian 12 Bookworm non-privilégié, alloue la mémoire optimale, configure Node.js 22 LTS, génère les clés de chiffrement et active le démarrage automatique systemd.'
                    : 'The official installer automatically provisions an unprivileged Debian 12 Bookworm LXC container, allocates optimal RAM, sets up Node.js 22 LTS, generates random encryption secrets, and configures systemd auto-start on boot.'}
                </p>
              </div>

              {/* 1-Click Proxmox Shell Command */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-[#0D3B37] flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-orange-600" />
                    <span>{lang === 'FR' ? 'Commande à coller dans le Shell de votre nœud PVE' : 'Command to paste into your PVE Node Shell'}</span>
                  </label>
                  <span className="text-[11px] text-[#527470]">
                    {lang === 'FR' ? 'Copier en 1 clic' : '1-click copy'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-slate-700 font-mono text-xs text-emerald-400 flex items-center justify-between gap-3 shadow-md">
                  <div className="overflow-x-auto select-all pr-2 whitespace-nowrap">
                    {proxmoxCurlCommand}
                  </div>
                  <button
                    onClick={() => copyToClipboard(proxmoxCurlCommand, 'proxmox-curl')}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    {copiedId === 'proxmox-curl' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-200 stroke-[3]" />
                        <span>{lang === 'FR' ? 'Copié !' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{lang === 'FR' ? 'Copier' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sizing Recommendations Card */}
              <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-4">
                <h5 className="font-extrabold text-xs uppercase tracking-wider text-[#0D3B37]">
                  {lang === 'FR' ? 'Spécifications Conseillées pour le Conteneur LXC' : 'Recommended LXC Container Sizing'}
                </h5>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#FAF7EE] border border-[#E5DFD0]">
                    <span className="text-[10px] uppercase font-bold text-[#527470] block">vCPU</span>
                    <span className="text-base font-black text-[#0D3B37]">1 à 2 Cores</span>
                    <span className="text-[10px] text-[#527470] block">Économe</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF7EE] border border-[#E5DFD0]">
                    <span className="text-[10px] uppercase font-bold text-[#527470] block">RAM</span>
                    <span className="text-base font-black text-[#0D3B37]">512 Mo à 1 Go</span>
                    <span className="text-[10px] text-emerald-700 font-bold block">140 Mo actifs</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF7EE] border border-[#E5DFD0]">
                    <span className="text-[10px] uppercase font-bold text-[#527470] block">Disque</span>
                    <span className="text-base font-black text-[#0D3B37]">4 Go</span>
                    <span className="text-[10px] text-[#527470] block">Debian 12 + Node</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF7EE] border border-[#E5DFD0]">
                    <span className="text-[10px] uppercase font-bold text-[#527470] block">Sécurité</span>
                    <span className="text-base font-black text-teal-800">Non-Privilégié</span>
                    <span className="text-[10px] text-teal-700 font-bold block">Unprivileged 1</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#3A5D57]">
                  <p className="font-bold text-[#0D3B37]">
                    {lang === 'FR' ? 'Étapes pas-à-pas :' : 'Step-by-step procedure:'}
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1">
                    <li>{lang === 'FR' ? 'Connectez-vous à votre interface Proxmox VE (port 8006).' : 'Log in to your Proxmox VE web UI (port 8006).'}</li>
                    <li>{lang === 'FR' ? 'Ouvrez le Shell du serveur hôte.' : 'Open your PVE node shell.'}</li>
                    <li>{lang === 'FR' ? 'Collez la commande ci-dessus et appuyez sur Entrée.' : 'Paste the one-line command above and press Enter.'}</li>
                    <li>{lang === 'FR' ? 'Définissez le mot de passe root du conteneur (interactif ou Entrée pour auto-génération sécurisée 20 caractères).' : 'Set the container root password (interactive prompt or press Enter for auto-generated 20-character secure password).'}</li>
                    <li>{lang === 'FR' ? 'Sélectionnez votre Reverse Proxy parmi les 5 options intégrées (Cloudflare, Caddy, Nginx, NPM, Traefik).' : 'Choose your Reverse Proxy from the 5 built-in options (Cloudflare, Caddy, Nginx, NPM, Traefik).'}</li>
                    <li>{lang === 'FR' ? 'Accédez directement à Pantryo sur http://IP_DU_CONTENEUR:3000.' : 'Access Pantryo immediately at http://LXC_CONTAINER_IP:3000.'}</li>
                  </ol>
                </div>

                {/* Default Passwords & Password Manager Integration Card */}
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                    <Key className="w-4 h-4 text-amber-700" />
                    <span>{lang === 'FR' ? '🔐 Où sont les mots de passe par défaut ? (Zéro Valeur par Défaut)' : '🔐 Where are the default passwords? (Zero Default Passwords)'}</span>
                  </div>
                  <p className="text-xs text-amber-900/90 leading-relaxed">
                    {lang === 'FR'
                      ? 'Par sécurité et conformité NIST SP 800-63B, aucun mot de passe par défaut (ex: admin/admin ou root/root) n’existe dans Pantryo. Lors de la création du conteneur Proxmox, vous pouvez saisir votre mot de passe ou appuyer sur Entrée pour en générer un aléatoire de 20 caractères, puis le copier dans votre gestionnaire de mots de passe (Bitwarden, 1Password, KeePass).'
                      : 'For homelab security and NIST SP 800-63B compliance, Pantryo has NO static default passwords (no admin/admin or root/root). During Proxmox container creation, you can enter your own or press Enter to auto-generate a 20-character random password ready to save into your password manager (Bitwarden, 1Password, KeePass).'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-[#0F172A]">
                    <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                      <span className="font-bold text-teal-800 block">Root Conteneur LXC:</span>
                      <span>Invite interactive / 20 car. aléatoire</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-amber-200">
                      <span className="font-bold text-teal-800 block">Clé SQLCipher 256 bits:</span>
                      <span>64 hex auto-générés (AES-256-GCM)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LINUX & RASPBERRY PI */}
          {activeTab === 'linux' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Box */}
              <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-bold">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0D3B37]">
                        {lang === 'FR' ? 'Installateur Universel Linux & Raspberry Pi' : 'Universal Linux & Raspberry Pi Installer'}
                      </h4>
                      <p className="text-[11px] text-[#527470]">
                        {lang === 'FR'
                          ? 'Optimisé pour Raspberry Pi OS, DietPi, Armbian, Ubuntu, Debian, Fedora & Arch'
                          : 'Tuned for Raspberry Pi OS, DietPi, Armbian, Ubuntu, Debian, Fedora & Arch'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-800 border border-red-300">
                    ARM64 · ARM32 · x86_64
                  </span>
                </div>

                <p className="text-xs text-[#3A5D57] leading-relaxed">
                  {lang === 'FR'
                    ? 'Le script d’installation détecte automatiquement l’architecture CPU, installe Node.js 22 LTS, configure un fichier swap de 1 Go sur les cartes à faible RAM (RPi 3B+, Zero 2W) pour éviter tout crash mémoire, et installe le service systemd auto-démarrant.'
                    : 'The universal installer detects CPU architecture, installs Node.js 22 LTS, automatically configures a 1 GB swapfile on low-memory SBCs (RPi 3B+, Zero 2W) to prevent out-of-memory crashes, and sets up a systemd auto-restart service.'}
                </p>
              </div>

              {/* 1-Click Linux Terminal Command */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-[#0D3B37] flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-red-600" />
                    <span>{lang === 'FR' ? 'Commande terminal (SSH sur Raspberry Pi ou serveur Linux)' : 'Terminal command (SSH on Raspberry Pi or Linux server)'}</span>
                  </label>
                  <span className="text-[11px] text-[#527470]">
                    {lang === 'FR' ? 'Copier en 1 clic' : '1-click copy'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-slate-700 font-mono text-xs text-emerald-400 flex items-center justify-between gap-3 shadow-md">
                  <div className="overflow-x-auto select-all pr-2 whitespace-nowrap">
                    {linuxCurlCommand}
                  </div>
                  <button
                    onClick={() => copyToClipboard(linuxCurlCommand, 'linux-curl')}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    {copiedId === 'linux-curl' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-200 stroke-[3]" />
                        <span>{lang === 'FR' ? 'Copié !' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{lang === 'FR' ? 'Copier' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Distro-Specific Details Switcher */}
              <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h5 className="font-extrabold text-xs uppercase tracking-wider text-[#0D3B37]">
                    {lang === 'FR' ? 'Notes par Distribution & Matériel' : 'Distribution & Hardware Profiles'}
                  </h5>
                  <div className="flex p-0.5 rounded-xl bg-[#FAF7EE] border border-[#E0D9C8]">
                    <button
                      onClick={() => setSelectedLinuxDistro('rpi')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedLinuxDistro === 'rpi' ? 'bg-teal-700 text-white shadow-2xs' : 'text-[#527470]'
                      }`}
                    >
                      Raspberry Pi
                    </button>
                    <button
                      onClick={() => setSelectedLinuxDistro('debian_ubuntu')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedLinuxDistro === 'debian_ubuntu' ? 'bg-teal-700 text-white shadow-2xs' : 'text-[#527470]'
                      }`}
                    >
                      Debian / Ubuntu
                    </button>
                    <button
                      onClick={() => setSelectedLinuxDistro('dietpi')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedLinuxDistro === 'dietpi' ? 'bg-teal-700 text-white shadow-2xs' : 'text-[#527470]'
                      }`}
                    >
                      DietPi / Armbian
                    </button>
                    <button
                      onClick={() => setSelectedLinuxDistro('fedora')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedLinuxDistro === 'fedora' ? 'bg-teal-700 text-white shadow-2xs' : 'text-[#527470]'
                      }`}
                    >
                      Fedora / RHEL
                    </button>
                  </div>
                </div>

                {selectedLinuxDistro === 'rpi' && (
                  <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#E5DFD0] space-y-2 text-xs text-[#3A5D57]">
                    <p className="font-bold text-[#0D3B37]">
                      {lang === 'FR' ? 'Optimisation Raspberry Pi 3B+, 4, 5 & Zero 2W :' : 'Raspberry Pi 3B+, 4, 5 & Zero 2W Tuning:'}
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      <li>{lang === 'FR' ? 'Sur les modèles 1 Go ou 512 Mo de RAM, un swapfile de 1 Go est configuré automatiquement pour absorber les builds.' : 'On 1GB or 512MB RAM models, a 1GB swapfile is created automatically to cushion build operations.'}</li>
                      <li>{lang === 'FR' ? 'Compatible avec les écrans tactiles 7" officiels ou HDMI en mode plein écran (kiosque Chromium).' : 'Compatible with official 7" touchscreens or HDMI touch displays in Chromium kiosk mode.'}</li>
                      <li>{lang === 'FR' ? 'Consommation électrique minimale (~3W à 6W).' : 'Ultra-low power draw (~3W to 6W idle).'}</li>
                    </ul>
                  </div>
                )}

                {selectedLinuxDistro === 'debian_ubuntu' && (
                  <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#E5DFD0] space-y-2 text-xs text-[#3A5D57]">
                    <p className="font-bold text-[#0D3B37]">
                      {lang === 'FR' ? 'Debian 11/12 & Ubuntu 20.04/22.04/24.04 LTS :' : 'Debian 11/12 & Ubuntu 20.04/22.04/24.04 LTS:'}
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      <li>{lang === 'FR' ? 'Utilise le dépôt officiel NodeSource 22.x LTS et systemd natif.' : 'Uses official NodeSource 22.x LTS repository and native systemd.'}</li>
                      <li>{lang === 'FR' ? 'Gestion du pare-feu UFW automatique (port 3000 ouvert si configuré).' : 'UFW firewall compatibility (port 3000 allowed when configured).'}</li>
                    </ul>
                  </div>
                )}

                {selectedLinuxDistro === 'dietpi' && (
                  <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#E5DFD0] space-y-2 text-xs text-[#3A5D57]">
                    <p className="font-bold text-[#0D3B37]">
                      {lang === 'FR' ? 'DietPi & Armbian :' : 'DietPi & Armbian:'}
                    </p>
                    <p>
                      {lang === 'FR'
                        ? 'Idéal pour maximiser la RAM libre sur cartes Orange Pi, NanoPi ou Raspberry Pi allégé. Empreinte au démarrage <110 Mo de RAM.'
                        : 'Perfect for squeezing maximum free RAM on Orange Pi, NanoPi, or stripped SBCs. Under 110MB RAM at boot.'}
                    </p>
                  </div>
                )}

                {selectedLinuxDistro === 'fedora' && (
                  <div className="p-4 rounded-xl bg-[#FAF7EE] border border-[#E5DFD0] space-y-2 text-xs text-[#3A5D57]">
                    <p className="font-bold text-[#0D3B37]">
                      {lang === 'FR' ? 'Fedora, Rocky Linux & AlmaLinux :' : 'Fedora, Rocky Linux & AlmaLinux:'}
                    </p>
                    <p>
                      {lang === 'FR'
                        ? 'Support de `dnf`, gestion SELinux en mode permissif pour le service Node.js et ouverture firewalld automatique.'
                        : 'Supports `dnf`, handles SELinux context for the Node.js unit, and opens firewalld zone automatically.'}
                    </p>
                  </div>
                )}

                {/* Service commands */}
                <div className="pt-2 border-t border-[#F0EBE0] flex items-center justify-between text-xs text-[#527470] flex-wrap gap-2">
                  <span><code>sudo systemctl status pantryo</code></span>
                  <span><code>sudo systemctl restart pantryo</code></span>
                  <span><code>sudo journalctl -u pantryo -f</code></span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLOUDFLARE & DOMAINS */}
          {activeTab === 'cloudflare' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Box */}
              <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0D3B37]">
                        {lang === 'FR' ? 'Accès Distant : Tunnel Cloudflare ou Reverse Proxy' : 'Remote Access: Cloudflare Tunnel or Reverse Proxy'}
                      </h4>
                      <p className="text-[11px] text-[#527470]">
                        {lang === 'FR' ? 'Accédez à votre cuisine depuis le supermarché en toute sécurité' : 'Access your pantry safely from the grocery store'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                    HTTPS / SSL GRATUIT
                  </span>
                </div>

                <p className="text-xs text-[#3A5D57] leading-relaxed">
                  {lang === 'FR'
                    ? 'Vous pouvez exposer Pantryo à votre famille sans jamais ouvrir de port sur votre box Internet grâce à un tunnel Cloudflare Zero Trust, ou utiliser votre propre nom de domaine avec Caddy ou Nginx.'
                    : 'Expose Pantryo to your family without opening router ports using a Cloudflare Zero Trust Tunnel, or point your custom domain via Caddy or Nginx with automatic Let’s Encrypt certificates.'}
                </p>
              </div>

              {/* 5-Option Reverse Proxy Switcher */}
              <div className="flex p-1 rounded-2xl bg-[#EFE9DA] border border-[#DCD3C0] gap-1 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setSelectedProxy('cloudflare')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedProxy === 'cloudflare'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-[#3B5B56] hover:bg-white/60'
                  }`}
                >
                  ⚡ Cloudflare Tunnel
                </button>
                <button
                  onClick={() => setSelectedProxy('caddy')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedProxy === 'caddy'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-[#3B5B56] hover:bg-white/60'
                  }`}
                >
                  🔒 Caddy (Auto HTTPS)
                </button>
                <button
                  onClick={() => setSelectedProxy('nginx')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedProxy === 'nginx'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-[#3B5B56] hover:bg-white/60'
                  }`}
                >
                  🛡️ Nginx & Certbot
                </button>
                <button
                  onClick={() => setSelectedProxy('npm')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedProxy === 'npm'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-[#3B5B56] hover:bg-white/60'
                  }`}
                >
                  🖥️ NPM (GUI)
                </button>
                <button
                  onClick={() => setSelectedProxy('traefik')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedProxy === 'traefik'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-[#3B5B56] hover:bg-white/60'
                  }`}
                >
                  🚦 Traefik v2/v3
                </button>
              </div>

              {/* Option 1: Cloudflare Tunnel */}
              {selectedProxy === 'cloudflare' && (
                <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h5 className="font-extrabold text-xs uppercase tracking-wider text-[#0D3B37] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>{lang === 'FR' ? 'Cloudflare Zero Trust Tunnel (Recommandé)' : 'Cloudflare Zero Trust Tunnel (Recommended)'}</span>
                    </h5>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {lang === 'FR' ? 'Zéro Port Ouvert' : 'Zero Open Ports'}
                    </span>
                  </div>

                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? '1. Créez un compte gratuit sur Cloudflare et ajoutez votre domaine. Dans Zero Trust > Access > Tunnels, créez un tunnel nommé "pantryo".'
                      : '1. Create a free Cloudflare account, add your domain, and under Zero Trust > Access > Tunnels create a tunnel named "pantryo".'}
                  </p>

                  <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-700 font-mono text-[11px] text-emerald-400 space-y-1 relative group">
                    <button
                      onClick={() => copyToClipboard('sudo cloudflared service install <YOUR_TOKEN>', 'cf-install')}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-600 text-white font-sans text-[10px] font-bold flex items-center gap-1"
                    >
                      {copiedId === 'cf-install' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'cf-install' ? 'Copié' : 'Copy'}</span>
                    </button>
                    <div className="text-slate-400"># Installez le démon cloudflared sur votre serveur :</div>
                    <div>curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg &gt;/dev/null</div>
                    <div>sudo cloudflared service install &lt;YOUR_TOKEN&gt;</div>
                  </div>

                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? '2. Pointez votre sous-domaine (ex: pantry.votredomaine.com) vers le service local HTTP localhost:3000.'
                      : '2. Route your subdomain (e.g. pantry.yourdomain.com) to local service HTTP localhost:3000.'}
                  </p>
                </div>
              )}

              {/* Option 2: Caddy */}
              {selectedProxy === 'caddy' && (
                <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h5 className="font-extrabold text-xs uppercase tracking-wider text-[#0D3B37]">
                      {lang === 'FR' ? 'Caddyfile (HTTPS Automatique Let’s Encrypt / ZeroSSL)' : 'Caddyfile (Automatic HTTPS via Let’s Encrypt)'}
                    </h5>
                    <button
                      onClick={() => copyToClipboard(`pantry.yourdomain.com {\n    reverse_proxy 127.0.0.1:3000\n    encode gzip zstd\n}`, 'caddy-copy')}
                      className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-[10px] font-bold flex items-center gap-1"
                    >
                      {copiedId === 'caddy-copy' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'caddy-copy' ? 'Copié' : 'Copy'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? 'Fichier /etc/caddy/Caddyfile - Caddy gère automatiquement l’obtention et le renouvellement des certificats SSL :'
                      : 'File /etc/caddy/Caddyfile - Caddy automatically issues and renews Let’s Encrypt certificates without cron jobs:'}
                  </p>

                  <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-700 font-mono text-[11px] text-emerald-400">
                    <pre className="whitespace-pre-wrap">{`pantry.yourdomain.com {
    reverse_proxy 127.0.0.1:3000
    encode gzip zstd
}`}</pre>
                  </div>
                </div>
              )}

              {/* Option 3: Nginx & Certbot */}
              {selectedProxy === 'nginx' && (
                <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h5 className="font-extrabold text-xs uppercase tracking-wider text-[#0D3B37]">
                      {lang === 'FR' ? 'Nginx & Let’s Encrypt Certbot' : 'Nginx & Let’s Encrypt Certbot'}
                    </h5>
                    <button
                      onClick={() => copyToClipboard(`server {\n    listen 80;\n    server_name pantry.yourdomain.com;\n    client_max_body_size 50M;\n    location / {\n        proxy_pass http://127.0.0.1:3000;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade $http_upgrade;\n        proxy_set_header Connection "upgrade";\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n}`, 'nginx-copy')}
                      className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-[10px] font-bold flex items-center gap-1"
                    >
                      {copiedId === 'nginx-copy' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'nginx-copy' ? 'Copié' : 'Copy'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? 'Configuration /etc/nginx/sites-available/pantryo (Support WebSockets + streaming receipt OCR inclus) :'
                      : 'File /etc/nginx/sites-available/pantryo (with WebSockets & receipt streaming support):'}
                  </p>

                  <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-700 font-mono text-[11px] text-emerald-400">
                    <pre className="whitespace-pre-wrap">{`server {
    listen 80;
    server_name pantry.yourdomain.com;
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`}</pre>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#FAF7EE] border border-[#E5DFD0] text-xs font-mono text-[#0D3B37]">
                    sudo certbot --nginx -d pantry.yourdomain.com
                  </div>
                </div>
              )}

              {/* Option 4: NPM GUI */}
              {selectedProxy === 'npm' && (
                <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3 animate-fade-in">
                  <h5 className="font-extrabold text-xs uppercase tracking-wider text-[#0D3B37]">
                    {lang === 'FR' ? 'Nginx Proxy Manager (Interface Web NPM)' : 'Nginx Proxy Manager (NPM Web GUI)'}
                  </h5>

                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? 'Dans l’interface graphique Nginx Proxy Manager (port 81) :'
                      : 'In your Nginx Proxy Manager dashboard (port 81):'}
                  </p>

                  <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-700 font-mono text-[11px] text-emerald-400 space-y-1">
                    <div>1. Proxy Hosts &gt; Add Proxy Host</div>
                    <div>2. Domain Names: pantry.yourdomain.com</div>
                    <div>3. Forward Hostname / IP: &lt;IP_DU_CONTENEUR_OU_SERVEUR&gt;</div>
                    <div>4. Forward Port: 3000</div>
                    <div>5. Cocher: "Block Common Exploits" et "Websockets Support" (ON)</div>
                    <div>6. Onglet SSL: Cocher "Request a new SSL Certificate", "Force SSL", "HTTP/2 Support"</div>
                  </div>
                </div>
              )}

              {/* Option 5: Traefik v2 / v3 */}
              {selectedProxy === 'traefik' && (
                <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h5 className="font-extrabold text-xs uppercase tracking-wider text-[#0D3B37]">
                      {lang === 'FR' ? 'Configuration Dynamique Traefik v2 / v3' : 'Traefik v2 / v3 Dynamic Provider'}
                    </h5>
                    <button
                      onClick={() => copyToClipboard(`http:\n  routers:\n    pantryo-secure:\n      rule: "Host(\`pantry.yourdomain.com\`)"\n      entryPoints:\n        - websecure\n      service: pantryo-service\n      tls:\n        certResolver: myresolver\n  services:\n    pantryo-service:\n      loadBalancer:\n        servers:\n          - url: "http://127.0.0.1:3000"`, 'traefik-copy')}
                      className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-[10px] font-bold flex items-center gap-1"
                    >
                      {copiedId === 'traefik-copy' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'traefik-copy' ? 'Copié' : 'Copy'}</span>
                    </button>
                  </div>

                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? 'Fichier /etc/traefik/dynamic/pantryo.yml :'
                      : 'File /etc/traefik/dynamic/pantryo.yml :'}
                  </p>

                  <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-700 font-mono text-[11px] text-emerald-400">
                    <pre className="whitespace-pre-wrap">{`http:
  routers:
    pantryo-secure:
      rule: "Host(\`pantry.yourdomain.com\`)"
      entryPoints:
        - websecure
      service: pantryo-service
      tls:
        certResolver: myresolver
  services:
    pantryo-service:
      loadBalancer:
        servers:
          - url: "http://127.0.0.1:3000"`}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SECURITY & ARCHITECTURE SPECS */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Box */}
              <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0D3B37]">
                        {lang === 'FR' ? 'Architecture Sécurisée & Confidentialité Totale' : 'Security Architecture & Total Privacy'}
                      </h4>
                      <p className="text-[11px] text-[#527470]">
                        {lang === 'FR' ? 'Zéro télémétrie, chiffrement au repos et conformité FIDO2' : 'Zero telemetry, at-rest encryption & FIDO2 compliance'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    SQLCIPHER AES-256
                  </span>
                </div>

                <p className="text-xs text-[#3A5D57] leading-relaxed">
                  {lang === 'FR'
                    ? 'Pantryo est conçu selon le principe de la souveraineté numérique. Vos reçus, vos habitudes d’achat et vos inventaires ne quittent jamais votre infrastructure.'
                    : 'Pantryo is engineered according to digital sovereignty principles. Your receipts, dietary habits, and pantry logs never leave your private infrastructure.'}
                </p>
              </div>

              {/* Security Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-white border border-[#E0D9C8] space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                    <Key className="w-4 h-4" />
                    <span>{lang === 'FR' ? 'Chiffrement SQLCipher 256 bits' : 'SQLCipher 256-Bit Encryption'}</span>
                  </div>
                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? 'Toute la base SQLite est chiffrée avec AES-GCM 256 bits. Une copie du fichier sur disque est totalement illisible sans la clé.'
                      : 'The entire SQLite database file is encrypted at rest using 256-bit AES-GCM. Physical disk copies are unreadable.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E0D9C8] space-y-2">
                  <div className="flex items-center gap-2 text-indigo-800 font-extrabold text-xs">
                    <Smartphone className="w-4 h-4" />
                    <span>{lang === 'FR' ? 'Passkeys Biométriques FIDO2' : 'FIDO2 Biometric Passkeys'}</span>
                  </div>
                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? 'Déverrouillez instantanément votre profil avec Touch ID, Face ID, Windows Hello ou clé YubiKey.'
                      : 'Unlock profiles instantly using Touch ID, Face ID, Windows Hello, or physical YubiKey hardware.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E0D9C8] space-y-2">
                  <div className="flex items-center gap-2 text-teal-800 font-extrabold text-xs">
                    <HardDrive className="w-4 h-4" />
                    <span>{lang === 'FR' ? 'Sauvegardes Chiffrées' : 'Encrypted Snapshots'}</span>
                  </div>
                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? 'Exportez et restaurez vos données en un clic avec chiffrement par mot de passe depuis la console Admin.'
                      : 'Export and restore snapshots in 1-click with custom passphrase encryption right from the Admin Console.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#E0D9C8] space-y-2">
                  <div className="flex items-center gap-2 text-blue-800 font-extrabold text-xs">
                    <RefreshCw className="w-4 h-4" />
                    <span>{lang === 'FR' ? 'PWA Hors-Ligne & Cache' : 'Offline-First PWA'}</span>
                  </div>
                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? 'Consultez votre inventaire dans le sous-sol du supermarché sans réseau grâce au Service Worker.'
                      : 'Check pantry items in grocery store basements with zero cellular signal via Service Worker caching.'}
                  </p>
                </div>
              </div>

              {/* GitHub Files Direct Access Card */}
              <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3">
                <h5 className="font-extrabold text-xs uppercase tracking-wider text-[#0D3B37] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-700" />
                  <span>{lang === 'FR' ? 'Fichiers de Documentation du Dépôt' : 'Repository Documentation Files'}</span>
                </h5>
                <p className="text-xs text-[#527470]">
                  {lang === 'FR'
                    ? 'Ces guides complets sont également inclus à la racine de votre installation pour GitHub et votre wiki :'
                    : 'These complete runbooks are also included at the root of your installation for GitHub and wikis:'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <a
                    href="/README.md"
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-[#FAF7EE] hover:bg-teal-50 border border-[#E5DFD0] hover:border-teal-300 text-xs font-bold text-[#0D3B37] flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-teal-700" />
                      <span>README.md</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>

                  <a
                    href="/INSTALLATION.md"
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-[#FAF7EE] hover:bg-teal-50 border border-[#E5DFD0] hover:border-teal-300 text-xs font-bold text-[#0D3B37] flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-orange-600" />
                      <span>INSTALLATION.md</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>

                  <a
                    href="/FEATURES.md"
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-[#FAF7EE] hover:bg-teal-50 border border-[#E5DFD0] hover:border-teal-300 text-xs font-bold text-[#0D3B37] flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>FEATURES.md</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-5 py-3.5 bg-white border-t border-[#E0D9C8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#527470]">
            <Server className="w-4 h-4 text-teal-700" />
            <span className="font-medium">
              {lang === 'FR' ? 'Pantryo — Système Culinaire & Homelab Décentralisé' : 'Pantryo — Sovereign Culinary & Homelab OS'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs transition-transform active:scale-95 shadow-2xs cursor-pointer"
          >
            {lang === 'FR' ? 'Fermer le Guide' : 'Close Guide'}
          </button>
        </div>
      </div>
    </div>
  );
}
