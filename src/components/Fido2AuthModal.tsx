import React, { useState, useEffect } from 'react';
import {
  Key,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  X,
  AlertTriangle,
  Check,
  Cpu,
  RefreshCw,
  Copy,
  Download,
  LifeBuoy,
  Smartphone,
  QrCode,
  Lock,
} from 'lucide-react';
import { User } from '../types';
import { fido2Client, Fido2Status } from '../services/fido2Client';
import { useLanguage } from '../utils/i18n';

interface Fido2AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: User;
  mode: 'VERIFY' | 'ENROLL_MANDATORY';
  onSuccess: (updatedUser?: User) => void;
}

export const Fido2AuthModal: React.FC<Fido2AuthModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  mode,
  onSuccess,
}) => {
  const { lang } = useLanguage();
  const [fido2Status, setFido2Status] = useState<Fido2Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [keyNickname, setKeyNickname] = useState('');

  // Active sub-view:
  // In ENROLL mode: 'choose' | 'fido' | 'totp'
  // In VERIFY mode: 'fido' | 'totp' | 'recovery'
  const [enrollMethod, setEnrollMethod] = useState<'choose' | 'fido' | 'totp'>('choose');
  const [verifyMethod, setVerifyMethod] = useState<'fido' | 'totp' | 'recovery'>('fido');

  // 6-digit TOTP state
  const [totpSetupData, setTotpSetupData] = useState<{
    secret: string;
    otpAuthUri: string;
    currentSampleCode: string;
  } | null>(null);
  const [totpCodeInput, setTotpCodeInput] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Recovery Code state
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');

  // Enrollment success - recovery codes display
  const [generatedCodes, setGeneratedCodes] = useState<string[] | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);

  useEffect(() => {
    if (isOpen && targetUser) {
      setErrorMessage('');
      setSuccessMessage('');
      setRecoveryCodeInput('');
      setTotpCodeInput('');
      setTotpSetupData(null);
      setGeneratedCodes(null);
      setKeyNickname(
        lang === 'FR' ? `Clé de ${targetUser.name}` : `${targetUser.name}'s Key`
      );

      setLoading(true);
      fido2Client
        .getStatus(targetUser.id)
        .then((status) => {
          setFido2Status(status);
          // If verifying and user only has TOTP or has both, default accordingly
          if (status.totpEnabled && (!status.fido2Enabled || status.credentialsCount === 0)) {
            setVerifyMethod('totp');
          } else {
            setVerifyMethod('fido');
          }
          if (mode === 'ENROLL_MANDATORY') {
            setEnrollMethod('choose');
          }
        })
        .catch((err) => {
          setErrorMessage(err.message || 'Failed to load 2FA status');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, targetUser, lang, mode]);

  if (!isOpen || !targetUser) return null;

  // ==========================================
  // FIDO2 Authentication & Enrollment Handlers
  // ==========================================
  const handleAuthenticateFido = async (simulated: boolean = false) => {
    try {
      setActionLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      let result;
      if (simulated) {
        const credId = fido2Status?.credentials?.[0]?.id || 'sim_fido2_test';
        result = await fido2Client.simulateAuthenticate(targetUser.id, credId);
      } else {
        result = await fido2Client.authenticateKey(targetUser.id);
      }

      if (result.success && result.verified) {
        setSuccessMessage(
          lang === 'FR'
            ? 'Authentification FIDO2 réussie !'
            : 'FIDO2 Authentication successful!'
        );
        setTimeout(() => {
          onSuccess(result.user);
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (lang === 'FR'
            ? 'Échec de vérification FIDO2'
            : 'FIDO2 verification failed')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnrollKey = async (simulated: boolean = false) => {
    try {
      setActionLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const nickname =
        keyNickname.trim() ||
        (simulated
          ? lang === 'FR'
            ? 'Clé FIDO2 Virtuelle (Sandbox)'
            : 'Virtual FIDO2 Token (Sandbox)'
          : lang === 'FR'
          ? 'Clé FIDO2 / Passkey'
          : 'FIDO2 Key / Passkey');

      let result;
      if (simulated) {
        result = await fido2Client.simulateEnroll(targetUser.id, nickname);
      } else {
        result = await fido2Client.registerHardwareKey(targetUser.id, nickname);
      }

      if (result.success && result.verified) {
        setSuccessMessage(
          lang === 'FR'
            ? 'Clé FIDO2 enregistrée avec succès ! Votre compte est désormais sécurisé.'
            : 'FIDO2 Key enrolled successfully! Your account is now secure.'
        );

        if (result.recoveryCodes && result.recoveryCodes.length > 0) {
          setGeneratedCodes(result.recoveryCodes);
        } else {
          setTimeout(() => {
            onSuccess({
              ...targetUser,
              fido2Enabled: true,
              fido2Enforced: true,
              isCompliant: true,
            });
            onClose();
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (lang === 'FR'
            ? "Échec de l'enregistrement FIDO2"
            : 'FIDO2 registration failed')
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // TOTP (6 Digits) Handlers
  // ==========================================
  const handleStartTotpSetup = async () => {
    try {
      setActionLoading(true);
      setErrorMessage('');
      const data = await fido2Client.setupTotp(targetUser.id);
      setTotpSetupData({
        secret: data.secret,
        otpAuthUri: data.otpAuthUri,
        currentSampleCode: data.currentSampleCode,
      });
      setEnrollMethod('totp');
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible d’initialiser le 2ème facteur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpSetupData || !totpCodeInput.trim()) return;

    try {
      setActionLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const result = await fido2Client.confirmTotp(
        targetUser.id,
        totpSetupData.secret,
        totpCodeInput.trim()
      );

      if (result.success) {
        setSuccessMessage(
          lang === 'FR'
            ? '2ème facteur à 6 chiffres configuré et validé !'
            : '6-digit 2nd factor successfully configured and verified!'
        );

        if (result.recoveryCodes && result.recoveryCodes.length > 0) {
          setGeneratedCodes(result.recoveryCodes);
        } else {
          setTimeout(() => {
            onSuccess({
              ...targetUser,
              totpEnabled: true,
              fido2Enforced: true,
              isCompliant: true,
            });
            onClose();
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (lang === 'FR'
            ? 'Code à 6 chiffres invalide ou expiré'
            : 'Invalid or expired 6-digit code')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpCodeInput.trim()) return;

    try {
      setActionLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const result = await fido2Client.verifyTotp(
        targetUser.id,
        totpCodeInput.trim()
      );

      if (result.success && result.verified) {
        setSuccessMessage(
          lang === 'FR'
            ? 'Code à 6 chiffres validé avec succès !'
            : '6-digit code verified successfully!'
        );
        setTimeout(() => {
          onSuccess(result.user);
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (lang === 'FR'
            ? 'Code à 6 chiffres invalide'
            : 'Invalid 6-digit code')
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // Emergency Recovery Code Verification
  // ==========================================
  const handleVerifyRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCodeInput.trim()) return;

    try {
      setActionLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      const result = await fido2Client.verifyRecoveryCode(
        targetUser.id,
        recoveryCodeInput.trim()
      );

      if (result.success && result.verified) {
        setSuccessMessage(
          lang === 'FR'
            ? 'Code de secours validé avec succès !'
            : 'Recovery code verified successfully!'
        );
        setTimeout(() => {
          onSuccess(result.user);
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (lang === 'FR' ? 'Code de secours invalide' : 'Invalid recovery code')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyCodes = () => {
    if (!generatedCodes) return;
    navigator.clipboard.writeText(generatedCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadCodes = () => {
    if (!generatedCodes) return;
    const content =
      `# PANTRYO 2FA EMERGENCY RECOVERY CODES\n` +
      `# Account: ${targetUser.email} (${targetUser.name})\n` +
      `# Generated: ${new Date().toISOString()}\n` +
      `# Policy: All users must use 2-Factor Authentication\n` +
      `# Store these codes securely. Each code can be used exactly once.\n\n` +
      generatedCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      `\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pantryo-2fa-recovery-codes-${targetUser.name.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFinishEnrollment = () => {
    onSuccess({
      ...targetUser,
      fido2Enabled: enrollMethod === 'fido' || targetUser.fido2Enabled,
      totpEnabled: enrollMethod === 'totp' || targetUser.totpEnabled,
      fido2Enforced: true,
      isCompliant: true,
    });
    onClose();
  };

  const isMandatoryEnrollment =
    mode === 'ENROLL_MANDATORY' ||
    (!fido2Status?.fido2Enabled && !fido2Status?.totpEnabled);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#FAF7EE] text-[#133E3B] w-full max-w-md rounded-3xl border border-[#E0D9C8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#E8E2D5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-[#0D3B37]">
                  {isMandatoryEnrollment
                    ? lang === 'FR'
                      ? 'Configuration 2ème Facteur (2FA)'
                      : '2nd Factor (2FA) Setup'
                    : lang === 'FR'
                    ? 'Authentification à 2 Facteurs'
                    : 'Two-Factor Authentication'}
                </h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-teal-100 text-teal-800 border border-teal-200">
                  {lang === 'FR' ? '2FA OBLIGATOIRE' : '2FA REQUIRED'}
                </span>
              </div>
              <p className="text-[11px] text-[#527470]">
                {lang === 'FR'
                  ? `Profil : ${targetUser.name} (${targetUser.role})`
                  : `Profile: ${targetUser.name} (${targetUser.role})`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Policy Notice */}
        <div className="px-5 py-2.5 bg-amber-50/80 border-b border-amber-200/70 text-[11px] text-amber-900 flex items-center gap-2 shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            {lang === 'FR'
              ? 'Sécurité renforcée : vous pouvez utiliser soit une clé Passkey/FIDO2, soit un code à 6 chiffres.'
              : 'Security policy: You can use either a Passkey/FIDO2 key or a 6-digit authenticator code.'}
          </span>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* User Preview */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#E0D9C8]">
            <img
              src={
                targetUser.avatarUrl ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
              }
              alt={targetUser.name}
              className="w-11 h-11 rounded-full object-cover border border-[#D5CEBD] shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#0D3B37] truncate">
                  {targetUser.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {targetUser.role}
                </span>
              </div>
              <p className="text-xs text-[#527470] truncate">{targetUser.email}</p>
            </div>
          </div>

          {/* Status Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. RECOVERY CODES DISPLAY AFTER SUCCESSFUL SETUP */}
          {generatedCodes && generatedCodes.length > 0 ? (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <h4 className="font-bold text-xs text-emerald-950">
                    {lang === 'FR'
                      ? 'Codes de Secours Générés'
                      : 'Emergency Recovery Codes Generated'}
                  </h4>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  {lang === 'FR'
                    ? 'Conservez précieusement ces codes en lieu sûr. Ils vous permettront de déverrouiller votre compte en cas d’oubli de téléphone ou de perte de clé.'
                    : 'Store these codes in a safe place. If you lose your security key or phone, they allow you to unlock your profile.'}
                </p>

                <div className="p-3 rounded-xl bg-white border border-emerald-200 grid grid-cols-2 gap-1.5 font-mono text-[11px] text-slate-800">
                  {generatedCodes.map((code, idx) => (
                    <div key={idx} className="p-1 rounded-sm bg-slate-50 text-center font-bold">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyCodes}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-1 hover:bg-emerald-100/50 cursor-pointer"
                    >
                      {copiedCodes ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCodes ? (lang === 'FR' ? 'Copié !' : 'Copied!') : (lang === 'FR' ? 'Copier' : 'Copy')}</span>
                    </button>
                    <button
                      onClick={handleDownloadCodes}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center gap-1 hover:bg-emerald-100/50 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'FR' ? 'Télécharger' : 'Download'}</span>
                    </button>
                  </div>

                  <button
                    onClick={handleFinishEnrollment}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs cursor-pointer shadow-sm"
                  >
                    {lang === 'FR' ? 'Continuer' : 'Continue'}
                  </button>
                </div>
              </div>
            </div>
          ) : isMandatoryEnrollment ? (
            /* ======================================================== */
            /* MANDATORY ENROLLMENT VIEW (CHOOSE BETWEEN FIDO2 OR TOTP) */
            /* ======================================================== */
            <div className="space-y-4 animate-fade-in">
              {enrollMethod === 'choose' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? 'Choisissez votre méthode pour le deuxième facteur d’authentification :'
                      : 'Choose your preferred 2nd factor authentication method:'}
                  </p>

                  {/* Option A: 6-Digit Authenticator App (No Passkey required) */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E0D9C8] hover:border-teal-400 transition-all space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                          <Smartphone className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-[#0D3B37]">
                            {lang === 'FR'
                              ? 'Option 1 : Code à 6 Chiffres (TOTP)'
                              : 'Option 1: 6-Digit Code (TOTP)'}
                          </h4>
                          <span className="text-[10px] text-teal-800 font-semibold">
                            {lang === 'FR'
                              ? 'Idéal si vous n’avez pas de clé Passkey'
                              : 'Recommended if you have no Passkey'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#527470]">
                      {lang === 'FR'
                        ? 'Fonctionne avec Google Authenticator, Microsoft Authenticator, ou tout gestionnaire de mots de passe.'
                        : 'Works with Google Authenticator, Microsoft Authenticator, or any password manager.'}
                    </p>
                    <button
                      onClick={handleStartTotpSetup}
                      disabled={actionLoading}
                      className="w-full mt-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <QrCode className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {lang === 'FR'
                          ? 'Configurer avec Code à 6 Chiffres'
                          : 'Setup with 6-Digit Code'}
                      </span>
                    </button>
                  </div>

                  {/* Option B: Passkey / WebAuthn Hardware Key */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E0D9C8] hover:border-teal-400 transition-all space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-900 flex items-center justify-center font-bold">
                        <Key className="w-4 h-4 text-teal-800" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#0D3B37]">
                          {lang === 'FR'
                            ? 'Option 2 : Passkey / Clé de Sécurité FIDO2'
                            : 'Option 2: Passkey / FIDO2 Security Key'}
                        </h4>
                        <span className="text-[10px] text-[#527470]">
                          {lang === 'FR' ? 'Touch ID, YubiKey, Windows Hello' : 'Touch ID, YubiKey, Windows Hello'}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#527470]">
                      {lang === 'FR'
                        ? 'Clé matérielle biométrique ou physique connectée à votre appareil.'
                        : 'Biometric or physical hardware key connected to your device.'}
                    </p>
                    <button
                      onClick={() => setEnrollMethod('fido')}
                      className="w-full mt-1 py-2.5 rounded-xl bg-white hover:bg-teal-50 text-teal-900 border border-teal-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5 text-teal-700" />
                      <span>
                        {lang === 'FR'
                          ? 'Configurer Clé Passkey / FIDO2'
                          : 'Setup Passkey / FIDO2 Key'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-view: Enrolling FIDO2 Passkey */}
              {enrollMethod === 'fido' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E0D9C8] space-y-2">
                    <h4 className="font-bold text-xs text-[#0D3B37]">
                      {lang === 'FR' ? 'Enrôlement Clé de Sécurité' : 'Register Security Key'}
                    </h4>
                    <div>
                      <label className="block text-[11px] font-bold text-[#0D3B37] mb-1">
                        {lang === 'FR' ? 'Nom de la clé :' : 'Key nickname:'}
                      </label>
                      <input
                        type="text"
                        value={keyNickname}
                        onChange={(e) => setKeyNickname(e.target.value)}
                        placeholder="e.g. YubiKey 5C NFC / Touch ID"
                        className="w-full px-3 py-1.5 rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleEnrollKey(false)}
                      disabled={actionLoading}
                      className="w-full py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Key className="w-4 h-4" />
                      )}
                      <span>
                        {lang === 'FR'
                          ? 'Enregistrer Clé Physique (Touch ID / YubiKey)'
                          : 'Enroll Physical Key (Touch ID / YubiKey)'}
                      </span>
                    </button>

                    <button
                      onClick={() => handleEnrollKey(true)}
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-2xl bg-white hover:bg-teal-50 text-teal-900 border border-teal-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Cpu className="w-4 h-4 text-teal-700" />
                      <span>
                        {lang === 'FR'
                          ? 'Enregistrer Clé Virtuelle (Sandbox IFrame)'
                          : 'Enroll Virtual Key (Sandbox IFrame)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEnrollMethod('choose')}
                      className="w-full py-2 rounded-xl text-[11px] text-teal-800 font-bold hover:underline cursor-pointer"
                    >
                      {lang === 'FR'
                        ? '← Retour aux options (utiliser code 6 chiffres)'
                        : '← Back to options (use 6-digit code)'}
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-view: Enrolling TOTP 6-digit Code */}
              {enrollMethod === 'totp' && totpSetupData && (
                <form onSubmit={handleConfirmTotp} className="space-y-3 animate-fade-in">
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E0D9C8] space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-teal-700" />
                      <h4 className="font-bold text-xs text-[#0D3B37]">
                        {lang === 'FR'
                          ? '1. Ajoutez cette clé dans votre application'
                          : '1. Add this key to your authenticator app'}
                      </h4>
                    </div>

                    <p className="text-[11px] text-[#527470]">
                      {lang === 'FR'
                        ? 'Saisissez cette clé secrète dans votre application (Google Authenticator, Microsoft Authenticator, 1Password) :'
                        : 'Enter this secret key in your authenticator app:'}
                    </p>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7EE] border border-[#D5CEBD]">
                      <code className="font-mono text-xs font-bold text-teal-950 tracking-wider break-all select-all">
                        {totpSetupData.secret}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(totpSetupData.secret);
                          setCopiedSecret(true);
                          setTimeout(() => setCopiedSecret(false), 2000);
                        }}
                        className="ml-2 px-2 py-1 rounded bg-white border border-teal-200 text-teal-800 text-[10px] font-bold shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        {copiedSecret ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSecret ? 'Copié' : 'Copier'}</span>
                      </button>
                    </div>

                    {/* Instant Demo Helper Button */}
                    <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-[11px] text-teal-900 flex items-center justify-between">
                      <span>
                        {lang === 'FR' ? 'Code d’essai actuel :' : 'Current test code:'}{' '}
                        <strong className="font-mono">{totpSetupData.currentSampleCode}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setTotpCodeInput(totpSetupData.currentSampleCode)}
                        className="px-2 py-0.5 rounded bg-teal-800 text-white text-[10px] font-bold cursor-pointer hover:bg-teal-900"
                      >
                        {lang === 'FR' ? 'Insérer le code' : 'Insert code'}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#E0D9C8] space-y-2">
                    <label className="block text-[11px] font-bold text-[#0D3B37]">
                      {lang === 'FR'
                        ? '2. Entrez le code à 6 chiffres affiché :'
                        : '2. Enter the displayed 6-digit code:'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={totpCodeInput}
                      onChange={(e) => setTotpCodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] text-center font-mono font-black text-lg tracking-widest text-[#0D3B37] focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEnrollMethod('choose')}
                      className="flex-1 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                    >
                      {lang === 'FR' ? 'Retour' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading || totpCodeInput.length !== 6}
                      className="flex-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                    >
                      {actionLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>{lang === 'FR' ? 'Activer le 2FA' : 'Activate 2FA'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ======================================================== */
            /* VERIFICATION VIEW (USER ALREADY HAS 2FA CONFIGURED)     */
            /* ======================================================== */
            <div className="space-y-4 animate-fade-in">
              {/* Method Switcher Tabs if both or alternatives exist */}
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold text-slate-700">
                <button
                  type="button"
                  onClick={() => setVerifyMethod('fido')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    verifyMethod === 'fido'
                      ? 'bg-white text-teal-900 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Passkey</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyMethod('totp')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    verifyMethod === 'totp'
                      ? 'bg-white text-teal-900 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? 'Code 6 Chiffres' : '6-Digit Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVerifyMethod('recovery')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    verifyMethod === 'recovery'
                      ? 'bg-white text-amber-900 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? 'Secours' : 'Recovery'}</span>
                </button>
              </div>

              {/* TAB 1: PASSKEY / HARDWARE KEY */}
              {verifyMethod === 'fido' && (
                <div className="p-4 rounded-2xl bg-white border border-[#E0D9C8] text-center space-y-3 animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mx-auto animate-pulse">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#0D3B37]">
                      {lang === 'FR'
                        ? 'Vérification Passkey / FIDO2'
                        : 'Passkey / FIDO2 Verification'}
                    </h4>
                    <p className="text-[11px] text-[#527470] mt-1">
                      {lang === 'FR'
                        ? 'Touchez votre clé physique de sécurité ou utilisez la validation Sandbox.'
                        : 'Touch your physical security key or use the Sandbox authenticator.'}
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => handleAuthenticateFido(false)}
                      disabled={actionLoading}
                      className="w-full py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Fingerprint className="w-4 h-4" />
                      )}
                      <span>
                        {lang === 'FR'
                          ? 'Toucher la Clé Physique (WebAuthn)'
                          : 'Touch Hardware Key (WebAuthn)'}
                      </span>
                    </button>

                    <button
                      onClick={() => handleAuthenticateFido(true)}
                      disabled={actionLoading}
                      className="w-full py-2.5 rounded-2xl bg-white hover:bg-teal-50 text-teal-900 border border-teal-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                    >
                      <Cpu className="w-4 h-4 text-teal-700" />
                      <span>
                        {lang === 'FR'
                          ? 'Valider Clé Virtuelle (Sandbox)'
                          : 'Validate Virtual Key (Sandbox)'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: 6-DIGIT CODE (TOTP) */}
              {verifyMethod === 'totp' && (
                <form
                  onSubmit={handleVerifyTotp}
                  className="p-4 rounded-2xl bg-white border border-[#E0D9C8] space-y-3 animate-fade-in"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-teal-700" />
                    <h4 className="font-bold text-xs text-[#0D3B37]">
                      {lang === 'FR'
                        ? 'Entrez le code à 6 chiffres'
                        : 'Enter the 6-Digit Code'}
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#527470]">
                    {lang === 'FR'
                      ? 'Consultez votre application d’authentification (Google Authenticator, etc.) et saisissez le code temporaire à 6 chiffres.'
                      : 'Check your authenticator app and enter the temporary 6-digit code.'}
                  </p>

                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={totpCodeInput}
                      onChange={(e) => setTotpCodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] text-center font-mono font-black text-xl tracking-widest text-[#0D3B37] focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading || totpCodeInput.length !== 6}
                    className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {actionLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{lang === 'FR' ? 'Valider le code' : 'Verify code'}</span>
                  </button>
                </form>
              )}

              {/* TAB 3: EMERGENCY RECOVERY CODE */}
              {verifyMethod === 'recovery' && (
                <form
                  onSubmit={handleVerifyRecoveryCode}
                  className="p-4 rounded-2xl bg-white border border-[#E0D9C8] space-y-3 animate-fade-in"
                >
                  <div className="flex items-center gap-2">
                    <LifeBuoy className="w-4 h-4 text-amber-700" />
                    <h4 className="font-bold text-xs text-[#0D3B37]">
                      {lang === 'FR'
                        ? 'Code de Secours à Usage Unique'
                        : 'Single-Use Emergency Recovery Code'}
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#527470]">
                    {lang === 'FR'
                      ? 'Entrez l’un de vos codes de secours générés lors de la configuration du 2ème facteur.'
                      : 'Enter one of your emergency recovery codes.'}
                  </p>

                  <div>
                    <input
                      type="text"
                      required
                      value={recoveryCodeInput}
                      onChange={(e) => setRecoveryCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. A1B2-C3D4"
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] text-center font-mono font-bold tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading || !recoveryCodeInput.trim()}
                    className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {actionLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{lang === 'FR' ? 'Valider le secours' : 'Verify recovery'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
