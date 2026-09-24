import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  X,
  Crown,
  Key,
  Fingerprint,
  Cpu,
  ShieldCheck,
  LifeBuoy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../utils/i18n';
import { fido2Client, Fido2Status } from '../services/fido2Client';
import { canUseSandboxBypass } from '../utils/installStatus';

interface AdminRestrictedModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  adminUser?: User;
  onSwitchToAdmin: () => void;
  isInstalled?: boolean;
}

export const AdminRestrictedModal: React.FC<AdminRestrictedModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  adminUser,
  onSwitchToAdmin,
  isInstalled = false,
}) => {
  const { lang } = useLanguage();
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [fido2Status, setFido2Status] = useState<Fido2Status | null>(null);

  const targetAdminId = adminUser?.id || 'usr_yan';

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      setAdminPassword('');
      setRecoveryCode('');
      setUseRecoveryCode(false);

      // Check if target admin has FIDO2 enabled
      fido2Client
        .getStatus(targetAdminId)
        .then((status) => setFido2Status(status))
        .catch(() => setFido2Status(null));
    }
  }, [isOpen, targetAdminId]);

  if (!isOpen) return null;

  // 1. Standard FIDO2 WebAuthn Verification
  const handleFido2Verification = async (simulated: boolean = false) => {
    try {
      setIsAuthenticating(true);
      setErrorMessage('');
      setSuccessMessage('');

      let result;
      if (simulated) {
        if (!canUseSandboxBypass(isInstalled)) {
          setErrorMessage(
            lang === 'FR'
              ? 'Le contournement en sandbox est interdit sur une application installée. Veuillez utiliser votre clé de sécurité physique ou un code de secours.'
              : 'Sandbox testing bypass is disabled in installed mode. Please use your physical security key or emergency recovery code.'
          );
          setIsAuthenticating(false);
          return;
        }
        const credId = fido2Status?.credentials?.[0]?.id || 'sim_fido2_test';
        result = await fido2Client.simulateAuthenticate(targetAdminId, credId);
      } else {
        result = await fido2Client.authenticateKey(targetAdminId);
      }

      if (result.success && result.verified) {
        setSuccessMessage(
          lang === 'FR'
            ? 'Clé FIDO2 vérifiée avec succès !'
            : 'FIDO2 Security Key verified successfully!'
        );
        setTimeout(() => {
          onSwitchToAdmin();
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (lang === 'FR'
            ? 'Échec de vérification de la clé FIDO2'
            : 'FIDO2 key verification failed')
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 2. Recovery Code Verification
  const handleRecoveryCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode) return;

    try {
      setIsAuthenticating(true);
      setErrorMessage('');

      const result = await fido2Client.verifyRecoveryCode(
        targetAdminId,
        recoveryCode.trim()
      );

      if (result.success && result.verified) {
        setSuccessMessage(
          lang === 'FR'
            ? 'Code de secours validé !'
            : 'Recovery code verified!'
        );
        setTimeout(() => {
          onSwitchToAdmin();
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (lang === 'FR' ? 'Code de secours invalide' : 'Invalid recovery code')
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 3. Password Login Fallback
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) return;

    try {
      setIsAuthenticating(true);
      setErrorMessage('');

      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUser?.email || 'yan@example.com',
          password: adminPassword,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          lang === 'FR'
            ? 'Impossible de joindre le service d’authentification. Veuillez réessayer.'
            : 'Unable to connect to authentication service. Please retry in a moment.'
        );
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid admin credentials');
      }

      // If server responds that 2FA is required:
      if (data.requires2FA) {
        setErrorMessage(
          lang === 'FR'
            ? 'Ce compte est protégé par 2FA FIDO2. Veuillez insérer et toucher votre clé de sécurité ci-dessous.'
            : 'This account is protected by FIDO2 2FA. Please verify with your security key below.'
        );
        return;
      }

      onSwitchToAdmin();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.message ||
        (lang === 'FR'
          ? 'Mot de passe administrateur incorrect'
          : 'Incorrect administrator password')
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const hasFido2 = Boolean(fido2Status?.fido2Enabled && fido2Status.credentialsCount > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#FAF7EE] text-[#133E3B] w-full max-w-md rounded-3xl border border-[#E0D9C8] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#E8E2D5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-[#0D3B37]">
              {lang === 'FR'
                ? 'Accès Administrateur & Sécurité FIDO2'
                : 'Admin Privileges & FIDO2 Security'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold">
              {lang === 'FR'
                ? 'Console Pantryo Réservée aux Administrateurs'
                : 'Pantryo Console is Admin-Only'}
            </p>
            <p className="text-amber-800">
              {lang === 'FR'
                ? `Vous êtes actuellement connecté en tant que ${currentUser.name} (Membre). L’accès aux fonctionnalités chiffrées nécessite une authentification administrateur.`
                : `You are currently logged in as ${currentUser.name} (Member). Accessing encrypted database operations requires administrator authorization.`}
            </p>
          </div>

          {/* Admin Identity Card */}
          <div className="p-4 rounded-2xl bg-white border border-[#E0D9C8] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={
                  adminUser?.avatarUrl ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                }
                alt="Admin"
                className="w-9 h-9 rounded-full object-cover border border-[#D5CEBD]"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-[#0D3B37]">
                    {adminUser?.name || 'Yan'}
                  </span>
                  <Crown className="w-3 h-3 text-amber-600" />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#527470]">
                  <span>{lang === 'FR' ? 'Administrateur' : 'Administrator'}</span>
                  {hasFido2 && (
                    <span className="px-1.5 py-0.2 rounded-sm bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                      2FA FIDO2
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (hasFido2 && fido2Status?.fido2Enforced) {
                  handleFido2Verification(false);
                } else if (canUseSandboxBypass(isInstalled)) {
                  onSwitchToAdmin();
                  onClose();
                } else {
                  setErrorMessage(
                    lang === 'FR'
                      ? 'Veuillez saisir le mot de passe administrateur ci-dessous pour confirmer votre identité.'
                      : 'Please enter the administrator password below to verify your identity.'
                  );
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-xs cursor-pointer"
            >
              <span>{lang === 'FR' ? 'Basculer' : 'Switch'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* FIDO2 Hardware 2FA Prompt */}
          {hasFido2 && (
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs space-y-3">
              <div className="flex items-center gap-2 text-teal-950 font-bold">
                <Fingerprint className="w-4 h-4 text-teal-800" />
                <span>
                  {lang === 'FR'
                    ? 'Vérification Clé de Sécurité FIDO2 Requise'
                    : 'FIDO2 Security Key Challenge Required'}
                </span>
              </div>
              <p className="text-[11px] text-teal-800">
                {lang === 'FR'
                  ? 'Touchez votre YubiKey, utilisez Touch ID / Face ID ou votre Passkey pour confirmer votre identité.'
                  : 'Touch your YubiKey, use Touch ID / Face ID, or your Passkey to verify your identity.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleFido2Verification(false)}
                  disabled={isAuthenticating}
                  className="flex-1 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? 'Vérifier Clé FIDO2' : 'Verify FIDO2 Key'}</span>
                </button>

                {canUseSandboxBypass(isInstalled) && (
                  <button
                    type="button"
                    onClick={() => handleFido2Verification(true)}
                    disabled={isAuthenticating}
                    title={lang === 'FR' ? 'Test instantané en sandbox' : 'Instant test in sandbox'}
                    className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    <Cpu className="w-3.5 h-3.5 text-amber-700" />
                    <span>{lang === 'FR' ? 'Test Sandbox' : 'Sandbox Test'}</span>
                  </button>
                )}
              </div>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setUseRecoveryCode(!useRecoveryCode)}
                  className="text-[11px] text-teal-800 hover:underline cursor-pointer"
                >
                  {useRecoveryCode
                    ? lang === 'FR'
                      ? 'Utiliser la clé matérielle'
                      : 'Use hardware key'
                    : lang === 'FR'
                    ? 'Clé indisponible ? Utiliser un code de secours'
                    : 'Key unavailable? Use emergency recovery code'}
                </button>
              </div>
            </div>
          )}

          {/* Recovery Code Input */}
          {useRecoveryCode && (
            <form onSubmit={handleRecoveryCodeSubmit} className="p-4 rounded-2xl bg-white border border-[#D5CEBD] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0D3B37]">
                <LifeBuoy className="w-3.5 h-3.5 text-teal-700" />
                <span>{lang === 'FR' ? 'Code de Secours 2FA' : '2FA Recovery Code'}</span>
              </div>
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                placeholder="Ex: A4K9-7M2P"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] font-mono tracking-wider text-[#0D3B37] focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
              <button
                type="submit"
                disabled={isAuthenticating || !recoveryCode}
                className="w-full py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                {lang === 'FR' ? 'Valider le code de secours' : 'Redeem Recovery Code'}
              </button>
            </form>
          )}

          {/* Password Login Fallback */}
          {(!hasFido2 || !fido2Status?.fido2Enforced) && (
            <form onSubmit={handlePasswordLogin} className="space-y-3 pt-1">
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder={
                    lang === 'FR'
                      ? 'Mot de passe ou phrase de passe admin'
                      : 'Admin password or passphrase'
                  }
                  className="w-full pl-3 pr-24 py-2 text-xs rounded-xl bg-white border border-[#D5CEBD] focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono text-[#0D3B37]"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer transition-colors"
                    title={showPassword ? (lang === 'FR' ? 'Masquer' : 'Hide') : (lang === 'FR' ? 'Afficher' : 'View')}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5 text-teal-700" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text) setAdminPassword(text);
                      } catch {}
                    }}
                    className="px-2 py-0.5 text-[10px] rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium cursor-pointer transition-colors"
                    title="Coller depuis le gestionnaire (NIST autorisé)"
                  >
                    {lang === 'FR' ? 'Coller' : 'Paste'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating || !adminPassword}
                className="w-full py-2 rounded-xl bg-[#FAF7EE] hover:bg-[#EFEAE0] text-[#0D3B37] font-bold text-xs border border-[#D5CEBD] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Key className="w-3.5 h-3.5 text-teal-700" />
                <span>
                  {lang === 'FR'
                    ? 'Déverrouiller avec le mot de passe'
                    : 'Unlock with Password'}
                </span>
              </button>
            </form>
          )}

          {/* Status & Error Messages */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
