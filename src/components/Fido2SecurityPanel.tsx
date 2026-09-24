import React, { useState, useEffect } from 'react';
import {
  Key,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  Copy,
  Download,
  Check,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Cpu,
  Laptop,
  Smartphone,
  QrCode,
  Sparkles,
  X,
} from 'lucide-react';
import { User, Fido2CredentialInfo, Fido2PolicyInfo } from '../types';
import { fido2Client, Fido2Status } from '../services/fido2Client';
import { useLanguage } from '../utils/i18n';
import { canUseSandboxBypass } from '../utils/installStatus';

interface Fido2SecurityPanelProps {
  user: User;
  onUserUpdated?: (updatedUser: User) => void;
  householdMembers?: User[];
}

export const Fido2SecurityPanel: React.FC<Fido2SecurityPanelProps> = ({
  user,
  onUserUpdated,
  householdMembers,
}) => {
  const { lang } = useLanguage();
  const [selectedUserId, setSelectedUserId] = useState<string>(user.id);
  const [policy, setPolicy] = useState<Fido2PolicyInfo | null>(null);
  const [fido2Status, setFido2Status] = useState<Fido2Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [keyNickname, setKeyNickname] = useState('');
  const [statusNotice, setStatusNotice] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Recovery Codes Modal
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryCodesList, setRecoveryCodesList] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // 6-digit TOTP state
  const [totpSetupData, setTotpSetupData] = useState<{
    secret: string;
    otpAuthUri: string;
    currentSampleCode: string;
  } | null>(null);
  const [totpCodeInput, setTotpCodeInput] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showTotpModal, setShowTotpModal] = useState(false);

  // In-UI Confirmation Modals (guaranteed to work in sandboxed iframes)
  const [keyToDelete, setKeyToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  // Environment Capabilities
  const [webAuthnSupport, setWebAuthnSupport] = useState<{
    supported: boolean;
    platformAuthenticator: boolean;
    isIframe: boolean;
  }>({ supported: true, platformAuthenticator: true, isIframe: false });

  // Load Status for target user
  const loadFido2Status = async (targetId: string = selectedUserId) => {
    try {
      setLoading(true);
      const [status, support, pol] = await Promise.all([
        fido2Client.getStatus(targetId),
        fido2Client.checkSupport(),
        fido2Client.getGlobalPolicy().catch(() => null),
      ]);
      setFido2Status(status);
      setWebAuthnSupport(support);
      if (pol) setPolicy(pol);
    } catch (err: any) {
      console.error('Failed to load FIDO2 status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFido2Status(selectedUserId);
  }, [selectedUserId]);

  // Handle Enrollment of Physical Security Key / Passkey
  const handleRegisterHardwareKey = async (simulated: boolean = false) => {
    const nickname =
      keyNickname.trim() ||
      (simulated
        ? lang === 'FR'
          ? 'Clé FIDO2 Virtuelle (Test Sandbox)'
          : 'Virtual FIDO2 Token (Sandbox)'
        : lang === 'FR'
        ? 'Clé FIDO2 Matérielle (YubiKey / Passkey)'
        : 'Hardware FIDO2 Key (YubiKey / Passkey)');

    try {
      setActionLoading(true);
      setStatusNotice(null);

      let result;
      if (simulated) {
        if (!canUseSandboxBypass()) {
          setStatusNotice({
            type: 'error',
            text:
              lang === 'FR'
                ? 'Le simulateur sandbox est désactivé sur une application installée. Veuillez utiliser une vraie clé Passkey ou code TOTP.'
                : 'Sandbox simulator is disabled in installed application mode. Please use a hardware Passkey or TOTP code.',
          });
          setActionLoading(false);
          return;
        }
        result = await fido2Client.simulateEnroll(selectedUserId, nickname);
      } else {
        result = await fido2Client.registerKey(selectedUserId, nickname);
      }

      if (result.success && result.verified) {
        setStatusNotice({
          type: 'success',
          text:
            lang === 'FR'
              ? `Clé de sécurité « ${nickname} » enregistrée avec succès sous le standard FIDO2 !`
              : `Security key "${nickname}" successfully registered under the FIDO2 standard!`,
        });
        setKeyNickname('');

        // If recovery codes were generated, show the modal
        if (result.recoveryCodes && result.recoveryCodes.length > 0) {
          setRecoveryCodesList(result.recoveryCodes);
          setShowRecoveryModal(true);
        }

        await loadFido2Status(selectedUserId);
        if (onUserUpdated && selectedUserId === user.id) {
          onUserUpdated({
            ...user,
            fido2Enabled: true,
            fido2Credentials: [
              ...(user.fido2Credentials || []),
              result.credential!,
            ],
          });
        }
      }
    } catch (err: any) {
      setStatusNotice({
        type: 'error',
        text: err.message || (lang === 'FR' ? "Échec de l'enregistrement FIDO2" : 'FIDO2 registration failed'),
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Test Verification Challenge
  const handleTestAuthentication = async (credentialId?: string) => {
    try {
      setActionLoading(true);
      setStatusNotice(null);

      let result;
      if (credentialId && credentialId.startsWith('sim_fido2_')) {
        result = await fido2Client.simulateAuthenticate(selectedUserId, credentialId);
      } else {
        result = await fido2Client.authenticateKey(selectedUserId);
      }

      if (result.success && result.verified) {
        setStatusNotice({
          type: 'success',
          text:
            lang === 'FR'
              ? 'Succès : Signature cryptographique FIDO2 validée avec succès par le serveur !'
              : 'Success: FIDO2 cryptographic signature verified successfully by the server!',
        });
        await loadFido2Status(selectedUserId);
      }
    } catch (err: any) {
      setStatusNotice({
        type: 'error',
        text:
          lang === 'FR'
            ? `Vérification échouée : ${err.message}`
            : `Verification failed: ${err.message}`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Credential Execution
  const executeDeleteCredential = async (credentialId: string, name: string) => {
    try {
      setActionLoading(true);
      setStatusNotice(null);
      await fido2Client.deleteCredential(selectedUserId, credentialId);
      setStatusNotice({
        type: 'info',
        text:
          lang === 'FR'
            ? `Clé FIDO2 « ${name} » supprimée avec succès.`
            : `FIDO2 key "${name}" removed successfully.`,
      });
      setKeyToDelete(null);
      await loadFido2Status(selectedUserId);
      if (onUserUpdated && selectedUserId === user.id) {
        const remaining = (user.fido2Credentials || []).filter((c) => c.id !== credentialId);
        onUserUpdated({
          ...user,
          fido2Enabled: remaining.length > 0,
          fido2Credentials: remaining,
        });
      }
    } catch (err: any) {
      setStatusNotice({
        type: 'error',
        text: err.message || (lang === 'FR' ? 'Erreur lors de la suppression' : 'Failed to delete key'),
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete All Credentials Execution
  const executeDeleteAllCredentials = async () => {
    try {
      setActionLoading(true);
      setStatusNotice(null);
      await fido2Client.deleteAllCredentials(selectedUserId);
      setStatusNotice({
        type: 'info',
        text:
          lang === 'FR'
            ? 'Toutes les clés FIDO2 ont été révoquées et le 2FA désactivé.'
            : 'All FIDO2 keys have been revoked and 2FA disabled.',
      });
      setShowDeleteAllModal(false);
      await loadFido2Status(selectedUserId);
      if (onUserUpdated && selectedUserId === user.id) {
        onUserUpdated({
          ...user,
          fido2Enabled: false,
          fido2Credentials: [],
        });
      }
    } catch (err: any) {
      setStatusNotice({
        type: 'error',
        text: err.message || (lang === 'FR' ? 'Erreur lors de la réinitialisation' : 'Failed to reset keys'),
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Start 6-digit TOTP Setup
  const handleStartTotpSetup = async () => {
    try {
      setActionLoading(true);
      setStatusNotice(null);
      const data = await fido2Client.setupTotp(selectedUserId);
      setTotpSetupData({
        secret: data.secret,
        otpAuthUri: data.otpAuthUri,
        currentSampleCode: data.currentSampleCode,
      });
      setTotpCodeInput('');
      setShowTotpModal(true);
    } catch (err: any) {
      setStatusNotice({
        type: 'error',
        text: err.message || 'Impossible de démarrer la configuration 2FA 6 chiffres',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm 6-digit TOTP Setup
  const handleConfirmTotpSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpSetupData || !totpCodeInput.trim()) return;

    try {
      setActionLoading(true);
      setStatusNotice(null);
      const result = await fido2Client.confirmTotp(
        selectedUserId,
        totpSetupData.secret,
        totpCodeInput.trim()
      );

      if (result.success) {
        setStatusNotice({
          type: 'success',
          text:
            lang === 'FR'
              ? '2ème facteur à 6 chiffres activé avec succès !'
              : '6-digit 2nd factor successfully activated!',
        });
        setShowTotpModal(false);
        setTotpSetupData(null);
        await loadFido2Status(selectedUserId);

        if (result.recoveryCodes && result.recoveryCodes.length > 0) {
          setRecoveryCodesList(result.recoveryCodes);
          setShowRecoveryModal(true);
        }

        if (onUserUpdated && selectedUserId === user.id) {
          onUserUpdated({
            ...user,
            totpEnabled: true,
            isCompliant: true,
          });
        }
      }
    } catch (err: any) {
      setStatusNotice({
        type: 'error',
        text: err.message || 'Code à 6 chiffres incorrect ou expiré',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Global FIDO2 Policy Enforcement
  const handleToggleGlobalPolicy = async (enforced: boolean = true) => {
    try {
      setActionLoading(true);
      await fido2Client.toggleGlobalEnforcement(enforced);
      setStatusNotice({
        type: 'success',
        text: enforced
          ? (lang === 'FR'
              ? 'Politique globale appliquée : FIDO2 est désormais strictement obligatoire pour TOUS les utilisateurs du foyer.'
              : 'Global policy applied: FIDO2 is now strictly required for ALL household users.')
          : (lang === 'FR'
              ? 'Politique globale assouplie.'
              : 'Global policy relaxed.'),
      });
      await loadFido2Status(selectedUserId);
    } catch (err: any) {
      setStatusNotice({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle User Enforcement
  const handleToggleEnforcement = async () => {
    if (!fido2Status) return;
    try {
      setActionLoading(true);
      const newEnforced = !fido2Status.fido2Enforced;
      await fido2Client.toggleEnforcement(selectedUserId, newEnforced);
      setStatusNotice({
        type: 'success',
        text: newEnforced
          ? lang === 'FR'
            ? 'La clé FIDO2 est maintenant strictement obligatoire.'
            : 'FIDO2 is now strictly required.'
          : lang === 'FR'
          ? 'Obligation assouplie.'
          : 'Enforcement relaxed.',
      });
      await loadFido2Status(selectedUserId);
    } catch (err: any) {
      setStatusNotice({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Regenerate Recovery Codes Execution
  const executeRegenerateCodes = async () => {
    try {
      setActionLoading(true);
      setShowRegenerateModal(false);
      const codes = await fido2Client.regenerateRecoveryCodes(selectedUserId);
      setRecoveryCodesList(codes);
      setShowRecoveryModal(true);
      await loadFido2Status(selectedUserId);
    } catch (err: any) {
      setStatusNotice({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyCodes = () => {
    if (recoveryCodesList.length === 0) return;
    navigator.clipboard.writeText(recoveryCodesList.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadCodes = () => {
    const content =
      `# PANTRYO 2FA EMERGENCY RECOVERY CODES\n` +
      `# Account: ${user.email} (${user.name})\n` +
      `# Generated: ${new Date().toISOString()}\n` +
      `# Store these codes securely. Each code can be used exactly once.\n\n` +
      recoveryCodesList.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      `\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pantryo-fido2-recovery-codes-${user.name.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Global Household FIDO2 Policy Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-900 to-[#0D3B37] text-white shadow-md border border-teal-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800/80 border border-teal-600/50 flex items-center justify-center text-teal-200 shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm tracking-wide">
                  {lang === 'FR'
                    ? 'POLITIQUE GLOBALE : FIDO2 OBLIGATOIRE POUR TOUS'
                    : 'GLOBAL POLICY: FIDO2 MANDATORY FOR ALL USERS'}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {lang === 'FR' ? 'ACTIF' : 'ENFORCED'}
                </span>
              </div>
              <p className="text-xs text-teal-200/90 mt-0.5">
                {lang === 'FR'
                  ? 'Tous les utilisateurs (Yan, Kriz et nouveaux membres) doivent détenir et utiliser une clé FIDO2 / Passkey.'
                  : 'All household users (Admins and Members) are required to register and use a FIDO2 Passkey / Key.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleToggleGlobalPolicy(true)}
              disabled={actionLoading}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>{lang === 'FR' ? 'Réappliquer pour Tous' : 'Re-enforce All'}</span>
            </button>
          </div>
        </div>

        {/* Household Compliance Summary Bar */}
        <div className="pt-2 border-t border-teal-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-teal-200">
              {lang === 'FR' ? 'Conformité du foyer :' : 'Household compliance:'}
            </span>
            <span className="font-bold text-white">
              {policy?.compliantUsers || 1} / {policy?.totalUsers || 2}{' '}
              {lang === 'FR' ? 'utilisateurs conformes' : 'users compliant'}
            </span>
          </div>

          {/* User selector chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] text-teal-300 shrink-0">
              {lang === 'FR' ? 'Profil géré :' : 'Managing:'}
            </span>
            {(policy?.users || [
              { id: 'usr_yan', name: 'Yan', role: 'ADMIN', isCompliant: true },
              { id: 'usr_kriz', name: 'Kriz', role: 'MEMBER', isCompliant: false },
            ]).map((u) => {
              const isSelected = u.id === selectedUserId;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-teal-950 shadow-xs'
                      : 'bg-teal-800/80 text-teal-100 hover:bg-teal-700/80 border border-teal-700'
                  }`}
                >
                  <span>{u.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[8px] font-black ${
                      u.isCompliant
                        ? isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-400/20 text-emerald-300'
                        : isSelected
                        ? 'bg-amber-500 text-amber-950'
                        : 'bg-amber-400/20 text-amber-300'
                    }`}
                  >
                    {u.isCompliant
                      ? lang === 'FR' ? 'OK' : 'OK'
                      : lang === 'FR' ? 'REQUIS' : 'REQ'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center shrink-0">
              <Key className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#0D3B37]">
                  {lang === 'FR'
                    ? `Authentification 2FA FIDO2 — ${
                        policy?.users?.find((u) => u.id === selectedUserId)?.name ||
                        (selectedUserId === user.id ? user.name : 'Utilisateur')
                      }`
                    : `Two-Factor Authentication (FIDO2 Standard) — ${
                        policy?.users?.find((u) => u.id === selectedUserId)?.name ||
                        (selectedUserId === user.id ? user.name : 'User')
                      }`}
                </h3>
                {fido2Status?.fido2Enabled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{lang === 'FR' ? 'CONFORME' : 'COMPLIANT'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                    <ShieldAlert className="w-3 h-3" />
                    <span>{lang === 'FR' ? 'CLÉ REQUISE' : 'KEY REQUIRED'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#527470] mt-0.5">
                {lang === 'FR'
                  ? 'Protection de grade entreprise conforme à la spécification FIDO Alliance & W3C WebAuthn Level 3.'
                  : 'Enterprise-grade protection adhering to FIDO Alliance & W3C WebAuthn Level 3 specifications.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {fido2Status?.fido2Enabled && (
              <button
                onClick={() => handleTestAuthentication()}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Fingerprint className="w-3.5 h-3.5 text-teal-700" />
                <span>{lang === 'FR' ? 'Tester la clé' : 'Test Key'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Notices */}
        {statusNotice && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : statusNotice.type === 'error'
                ? 'bg-rose-50 text-rose-900 border border-rose-200'
                : 'bg-teal-50 text-teal-900 border border-teal-200'
            }`}
          >
            {statusNotice.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : statusNotice.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            )}
            <span>{statusNotice.text}</span>
          </div>
        )}

        {/* Iframe Hint Banner */}
        {webAuthnSupport.isIframe && canUseSandboxBypass() && (
          <div className="mt-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-2.5">
            <Laptop className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                {lang === 'FR'
                  ? 'Aperçu en bac à sable (IFrame détectée)'
                  : 'Sandboxed Preview Environment Detected'}
              </p>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                {lang === 'FR'
                  ? "Les navigateurs restreignent parfois l'accès aux clés physiques dans les cadres intégrés. Vous pouvez soit utiliser le simulateur instantané ci-dessous, soit ouvrir l'application dans un nouvel onglet pour utiliser votre vraie YubiKey ou Touch ID."
                  : 'Browsers may restrict direct USB/NFC hardware key prompts inside embedded iframes. You can enroll using the instant sandbox simulator below or open the app in a standalone tab for full YubiKey / Touch ID hardware interaction.'}
              </p>
              <a
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sky-900 font-bold hover:underline text-[11px] pt-1"
              >
                <span>{lang === 'FR' ? 'Ouvrir dans un nouvel onglet' : 'Open in a new tab'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Enroll a New Key Section */}
      <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-4">
        <div>
          <h4 className="font-bold text-xs text-[#0D3B37] uppercase tracking-wider">
            {lang === 'FR'
              ? 'Enregistrer une nouvelle clé de sécurité ou Passkey'
              : 'Enroll a New Security Key or Passkey'}
          </h4>
          <p className="text-xs text-[#527470] mt-0.5">
            {lang === 'FR'
              ? 'Prend en charge YubiKey (USB-A/C, NFC), Google Titan, Apple Touch ID / Face ID, Windows Hello et Android.'
              : 'Supports YubiKey (USB, NFC), Google Titan Key, Apple Touch ID / Face ID, Windows Hello, and Android Biometrics.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={keyNickname}
            onChange={(e) => setKeyNickname(e.target.value)}
            placeholder={
              lang === 'FR'
                ? 'Nom de la clé (ex: YubiKey 5C NFC Yan, MacBook Touch ID)'
                : 'Key name (e.g., YubiKey 5C NFC, Work MacBook Touch ID)'
            }
            className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] focus:outline-none focus:ring-2 focus:ring-teal-700 text-[#0D3B37]"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRegisterHardwareKey(false)}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'FR' ? 'Enregistrer Clé FIDO2' : 'Enroll FIDO2 Key'}</span>
            </button>

            {canUseSandboxBypass() && (
              <button
                onClick={() => handleRegisterHardwareKey(true)}
                disabled={actionLoading}
                title={
                  lang === 'FR'
                    ? 'Simule une clé cryptographique FIDO2 pour tester sans matériel'
                    : 'Simulate a FIDO2 token for instant sandbox testing'
                }
                className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <Cpu className="w-3.5 h-3.5 text-amber-700" />
                <span>{lang === 'FR' ? 'Test Sandbox' : 'Sandbox Test'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alternative 2nd Factor: 6-Digit TOTP Authenticator */}
      <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs text-[#0D3B37] uppercase tracking-wider">
                  {lang === 'FR'
                    ? '2ème Facteur à 6 Chiffres (TOTP)'
                    : '6-Digit 2nd Factor (TOTP)'}
                </h4>
                {fido2Status?.totpEnabled ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black border border-emerald-200">
                    {lang === 'FR' ? 'ACTIF' : 'ACTIVE'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[9px] font-bold">
                    {lang === 'FR' ? 'NON CONFIGURÉ' : 'NOT CONFIGURED'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#527470] mt-0.5">
                {lang === 'FR'
                  ? 'Pour les utilisateurs sans clé FIDO2 / Passkey : connexion par mot de passe + code à 6 chiffres via application d’authentification.'
                  : 'For users without a FIDO2 / Passkey: login with password + 6-digit code via authenticator app.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleStartTotpSetup}
            disabled={actionLoading}
            className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50 whitespace-nowrap self-start sm:self-auto"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>
              {fido2Status?.totpEnabled
                ? lang === 'FR'
                  ? 'Reconfigurer Code 6 Chiffres'
                  : 'Reconfigure 6-Digit Code'
                : lang === 'FR'
                ? 'Activer Code 6 Chiffres'
                : 'Enable 6-Digit Code'}
            </span>
          </button>
        </div>
      </div>

      {/* Enrolled Keys List */}
      <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-[#0D3B37] uppercase tracking-wider">
              {lang === 'FR'
                ? `Clés Enregistrées (${fido2Status?.credentials?.length || 0})`
                : `Enrolled Keys (${fido2Status?.credentials?.length || 0})`}
            </h4>
            <span className="text-[11px] text-[#527470]">
              {lang === 'FR' ? 'Résistant au hameçonnage' : 'Phishing-resistant credentials'}
            </span>
          </div>
          {fido2Status?.credentials && fido2Status.credentials.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDeleteAllModal(true)}
              disabled={actionLoading}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {lang === 'FR' ? 'Tout révoquer' : 'Revoke all'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-[#527470]">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-teal-700" />
            <span>{lang === 'FR' ? 'Chargement des clés FIDO2...' : 'Loading FIDO2 keys...'}</span>
          </div>
        ) : !fido2Status?.credentials || fido2Status.credentials.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#FAF7EE] border border-dashed border-[#D5CEBD] text-center space-y-2">
            <Key className="w-8 h-8 text-[#527470] mx-auto opacity-50" />
            <p className="font-bold text-xs text-[#0D3B37]">
              {lang === 'FR' ? 'Aucune clé FIDO2 enregistrée' : 'No FIDO2 security keys enrolled yet'}
            </p>
            <p className="text-[11px] text-[#527470] max-w-sm mx-auto">
              {lang === 'FR'
                ? 'Protégez votre compte et la base de données chiffrée en enregistrant une clé matérielle ou la biométrie de votre appareil.'
                : 'Protect your account and the encrypted database by registering a hardware key or device biometrics.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {fido2Status.credentials.map((cred) => (
              <div
                key={cred.id}
                className="p-3.5 rounded-xl bg-[#FAF7EE] border border-[#E0D9C8] flex items-center justify-between gap-3 hover:border-teal-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#D5CEBD] text-teal-800 flex items-center justify-center shrink-0 shadow-2xs">
                    {cred.deviceType === 'virtual-hardware-key' ? (
                      <Cpu className="w-4 h-4 text-amber-700" />
                    ) : (
                      <Key className="w-4 h-4 text-teal-800" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#0D3B37] truncate">
                        {cred.friendlyName}
                      </span>
                      {cred.deviceType === 'virtual-hardware-key' && (
                        <span className="px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-800 text-[9px] font-black border border-amber-300">
                          SANDBOX
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[#527470] mt-0.5">
                      <span>
                        {lang === 'FR' ? 'Enregistrée :' : 'Enrolled:'}{' '}
                        {new Date(cred.createdAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>
                        {lang === 'FR' ? 'Compteur anti-clonage :' : 'Clone counter:'}{' '}
                        <strong>{cred.counter}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleTestAuthentication(cred.id)}
                    disabled={actionLoading}
                    title={lang === 'FR' ? 'Tester cette clé' : 'Test this key'}
                    className="p-1.5 rounded-lg bg-white hover:bg-teal-50 text-teal-800 border border-[#D5CEBD] transition-colors cursor-pointer"
                  >
                    <Fingerprint className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setKeyToDelete({ id: cred.id, name: cred.friendlyName })}
                    disabled={actionLoading}
                    title={lang === 'FR' ? 'Supprimer cette clé' : 'Remove key'}
                    className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-[#D5CEBD] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enforcement & Recovery Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Global Household FIDO2 Enforcement Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h5 className="font-bold text-xs text-[#0D3B37]">
                  {lang === 'FR' ? 'FIDO2 Obligatoire pour Tous les Utilisateurs' : 'FIDO2 Mandatory for All Users'}
                </h5>
                <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black bg-teal-100 text-teal-800">
                  GLOBAL
                </span>
              </div>
              <p className="text-[11px] text-[#527470] mt-0.5">
                {lang === 'FR'
                  ? 'Exige que chaque membre du foyer (Admins et Membres réguliers) configure et valide une clé FIDO2 / Passkey.'
                  : 'Requires every household user (Admins and regular Members) to configure and authenticate with a FIDO2 key.'}
              </p>
            </div>
            <button
              onClick={() => handleToggleGlobalPolicy(!policy?.allUsersRequired)}
              disabled={actionLoading}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-40 ${
                policy?.allUsersRequired !== false ? 'bg-teal-800' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  policy?.allUsersRequired !== false ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
          <div className="pt-2 border-t border-[#E8E2D5] flex items-center justify-between text-[11px] text-[#527470]">
            <span>{lang === 'FR' ? 'Statut du compte sélectionné :' : 'Selected account status:'}</span>
            <span className="font-bold text-[#0D3B37]">
              {fido2Status?.fido2Enforced
                ? (lang === 'FR' ? '🔒 Obligatoire' : '🔒 Mandatory')
                : (lang === 'FR' ? 'Facultatif' : 'Optional')}
            </span>
          </div>
        </div>

        {/* Emergency Recovery Codes Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-xs text-[#0D3B37]">
                {lang === 'FR' ? 'Codes de Secours d’Urgence' : 'Emergency Recovery Codes'}
              </h5>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-900 border border-teal-200 text-[10px] font-black">
                {fido2Status?.recoveryCodesRemaining || 0}{' '}
                {lang === 'FR' ? 'restants' : 'remaining'}
              </span>
            </div>
            <p className="text-[11px] text-[#527470] mt-0.5">
              {lang === 'FR'
                ? 'Utilisables une seule fois en cas de perte de votre clé de sécurité physique.'
                : 'Single-use emergency codes to regain access if your physical key is unavailable.'}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowRegenerateModal(true)}
              disabled={actionLoading}
              className="w-full py-1.5 rounded-xl bg-[#FAF7EE] hover:bg-[#EFEAE0] text-[#0D3B37] border border-[#D5CEBD] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5 text-teal-700" />
              <span>{lang === 'FR' ? 'Générer 8 nouveaux codes' : 'Generate 8 New Codes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recovery Codes Display Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7EE] text-[#0D3B37] w-full max-w-md rounded-3xl border border-[#D5CEBD] shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0D3B37]">
                  {lang === 'FR'
                    ? 'Codes de Secours 2FA (À Conserver Précieusement)'
                    : '2FA Emergency Recovery Codes (Save Securely)'}
                </h3>
                <p className="text-xs text-[#527470] mt-0.5">
                  {lang === 'FR'
                    ? 'Ces codes ne seront affichés qu’une seule fois. Chaque code ne fonctionne qu’une seule fois.'
                    : 'These codes will only be displayed once. Each code can be redeemed once.'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E0D9C8] grid grid-cols-2 gap-2.5 font-mono text-xs text-[#0D3B37]">
              {recoveryCodesList.map((code, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-[#FAF7EE] border border-[#E8E2D5] flex items-center justify-between"
                >
                  <span className="text-[10px] text-[#527470] font-sans font-bold">
                    #{idx + 1}
                  </span>
                  <span className="font-bold tracking-wider">{code}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCodes}
                className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0D3B37] border border-[#D5CEBD] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {copiedCodes ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{lang === 'FR' ? 'Copié !' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-teal-700" />
                    <span>{lang === 'FR' ? 'Copier tout' : 'Copy All'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadCodes}
                className="flex-1 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'FR' ? 'Télécharger .TXT' : 'Download .TXT'}</span>
              </button>
            </div>

            <button
              onClick={() => setShowRecoveryModal(false)}
              className="w-full py-2 rounded-xl bg-[#EFEAE0] hover:bg-[#E5DFD3] text-[#0D3B37] font-bold text-xs cursor-pointer"
            >
              {lang === 'FR' ? 'J’ai sauvegardé mes codes' : 'I have saved my codes'}
            </button>
          </div>
        </div>
      )}

      {/* Confirm Delete Single Key Modal */}
      {keyToDelete && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7EE] text-[#0D3B37] w-full max-w-sm rounded-3xl border border-[#D5CEBD] shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0D3B37]">
                  {lang === 'FR' ? 'Supprimer la clé de sécurité ?' : 'Remove security key?'}
                </h3>
                <p className="text-xs text-[#527470] mt-1">
                  {lang === 'FR'
                    ? `Êtes-vous sûr de vouloir révoquer la clé « ${keyToDelete.name} » ? Elle ne pourra plus être utilisée pour vous connecter.`
                    : `Are you sure you want to revoke the key "${keyToDelete.name}"? It will no longer authenticate your account.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setKeyToDelete(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#527470] border border-[#D5CEBD] font-bold text-xs cursor-pointer transition-colors"
              >
                {lang === 'FR' ? 'Annuler' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={() => executeDeleteCredential(keyToDelete.id, keyToDelete.name)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{lang === 'FR' ? 'Supprimer' : 'Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete All Keys Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7EE] text-[#0D3B37] w-full max-w-sm rounded-3xl border border-[#D5CEBD] shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0D3B37]">
                  {lang === 'FR' ? 'Révoquer toutes les clés FIDO2 ?' : 'Revoke all FIDO2 keys?'}
                </h3>
                <p className="text-xs text-[#527470] mt-1">
                  {lang === 'FR'
                    ? 'Toutes vos clés matérielles et passkeys seront supprimées, et l’authentification 2FA sera désactivée.'
                    : 'All enrolled hardware keys and passkeys will be deleted, and 2FA will be disabled.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#527470] border border-[#D5CEBD] font-bold text-xs cursor-pointer transition-colors"
              >
                {lang === 'FR' ? 'Annuler' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={executeDeleteAllCredentials}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{lang === 'FR' ? 'Tout supprimer' : 'Revoke All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Regenerate Emergency Codes Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7EE] text-[#0D3B37] w-full max-w-sm rounded-3xl border border-[#D5CEBD] shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#0D3B37]">
                  {lang === 'FR' ? 'Régénérer les codes de secours ?' : 'Regenerate recovery codes?'}
                </h3>
                <p className="text-xs text-[#527470] mt-1">
                  {lang === 'FR'
                    ? '8 nouveaux codes seront générés. Les anciens codes seront immédiatement et définitivement révoqués.'
                    : '8 new emergency codes will be created. Any previously issued codes will be permanently invalidated.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRegenerateModal(false)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#527470] border border-[#D5CEBD] font-bold text-xs cursor-pointer transition-colors"
              >
                {lang === 'FR' ? 'Annuler' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={executeRegenerateCodes}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>{lang === 'FR' ? 'Générer' : 'Generate'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6-Digit TOTP Setup Modal */}
      {showTotpModal && totpSetupData && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7EE] text-[#0D3B37] w-full max-w-md rounded-3xl border border-[#D5CEBD] shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0D3B37]">
                    {lang === 'FR'
                      ? 'Configurer le Code à 6 Chiffres (2FA)'
                      : 'Configure 6-Digit 2FA Code'}
                  </h3>
                  <p className="text-xs text-[#527470] mt-0.5">
                    {lang === 'FR'
                      ? 'Google Authenticator, Microsoft Authenticator, 1Password'
                      : 'Google Authenticator, Microsoft Authenticator, 1Password'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTotpModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmTotpSetup} className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white border border-[#E0D9C8] space-y-2">
                <label className="block text-[11px] font-bold text-[#0D3B37]">
                  {lang === 'FR' ? '1. Clé secrète à copier dans votre app :' : '1. Secret key to copy into your app:'}
                </label>
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
                    className="ml-2 px-2.5 py-1 rounded bg-white border border-teal-200 text-teal-800 text-[10px] font-bold shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    {copiedSecret ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSecret ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>

                <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-[11px] text-teal-900 flex items-center justify-between">
                  <span>
                    {lang === 'FR' ? 'Code d’essai en cours :' : 'Current test code:'}{' '}
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
                  {lang === 'FR' ? '2. Entrez le code à 6 chiffres affiché :' : '2. Enter the displayed 6-digit code:'}
                </label>
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

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTotpModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                >
                  {lang === 'FR' ? 'Annuler' : 'Cancel'}
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
          </div>
        </div>
      )}
    </div>
  );
};
