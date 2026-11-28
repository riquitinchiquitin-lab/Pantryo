import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Fingerprint,
  RefreshCw,
  Check,
  UserCheck,
} from 'lucide-react';
import { User } from '../types';
import { PantryoLogo } from './PantryoLogo';
import { useLanguage, LanguageSwitcher } from '../utils/i18n';
import { fido2Client } from '../services/fido2Client';
import { Fido2AuthModal } from './Fido2AuthModal';
import { OnboardingFlowModal } from './OnboardingFlowModal';
import { PWAInstallButton } from './PWAInstallButton';

interface LoginSplashProps {
  onLoginSuccess: (user: User) => void;
  householdMembers: User[];
  onMembersUpdated?: (members: User[]) => void;
  isInstalled?: boolean;
}

export const LoginSplash: React.FC<LoginSplashProps> = ({
  onLoginSuccess,
  householdMembers,
  onMembersUpdated,
  isInstalled = false,
}) => {
  const { lang } = useLanguage();
  const [selectedUser, setSelectedUser] = useState<User | null>(() =>
    householdMembers && householdMembers.length > 0 ? householdMembers[0] : null
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);

  // Auto-fetch users from server on mount to sync public members
  useEffect(() => {
    fetch('/api/v1/auth/public-members')
      .then((r) => r.json())
      .then((users) => {
        if (Array.isArray(users) && users.length > 0) {
          if (onMembersUpdated) onMembersUpdated(users);
          setSelectedUser((prev) => {
            if (prev && users.find((u) => u.id === prev.id)) return prev;
            return users[0];
          });
        }
      })
      .catch((err) => console.warn('[Pantryo Login] Could not auto-fetch users:', err));
  }, [onMembersUpdated]);

  useEffect(() => {
    if (householdMembers && householdMembers.length > 0) {
      if (!selectedUser || !householdMembers.find((m) => m.id === selectedUser.id)) {
        setSelectedUser(householdMembers[0]);
      }
    }
  }, [householdMembers, selectedUser]);

  // Onboarding Modal state (for admin initialization or user password change)
  const [onboardingUser, setOnboardingUser] = useState<User | null>(null);

  // FIDO2 Modal State
  const [fidoModal, setFidoModal] = useState<{
    isOpen: boolean;
    targetUser: User | null;
    mode: 'VERIFY' | 'ENROLL_MANDATORY';
    preferredMethod?: 'fido' | 'totp' | 'recovery';
    loginType?: 'password' | 'passkey';
  }>({
    isOpen: false,
    targetUser: null,
    mode: 'VERIFY',
    preferredMethod: 'fido',
    loginType: 'passkey',
  });

  useEffect(() => {
    fido2Client.checkSupport().then((res) => {
      setWebAuthnSupported(res.supported);
    });
  }, []);

  // Direct Passkey / Biometrics trigger — immediately prompts OS/browser for fingerprint or passkey selection
  const handlePasskeyLogin = async (userToAuth: User) => {
    if (passkeyLoading) return;
    setError('');
    setSelectedUser(userToAuth);

    if (userToAuth.mustChangePassword || userToAuth.mustSetupProfile) {
      setError(
        lang === 'FR'
          ? 'Configuration initiale requise : veuillez vous connecter par mot de passe pour initialiser votre compte.'
          : 'Initial configuration required: please sign in with password to set up your account.'
      );
      return;
    }

    if (!webAuthnSupported) {
      setError(
        lang === 'FR'
          ? 'Les clés Passkey / FIDO2 nécessitent un navigateur compatible en HTTPS (ou localhost).'
          : 'Passkeys / FIDO2 require a supported browser over HTTPS (or localhost).'
      );
      return;
    }

    try {
      setPasskeyLoading(true);
      // If the selected user has a registered passkey, pass their ID (supports both platform biometrics & hardware keys);
      // otherwise use discoverable mode so the browser immediately opens the native passkey picker / biometric prompt.
      const result = await fido2Client.authenticateKey(
        userToAuth.fido2Enabled ? userToAuth.id : undefined
      );

      if (result.success && result.verified) {
        const authenticatedUser: User = result.user || userToAuth;
        if (authenticatedUser.mustChangePassword || authenticatedUser.mustSetupProfile) {
          setOnboardingUser(authenticatedUser);
          return;
        }
        onLoginSuccess(authenticatedUser);
      }
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setError(
          userToAuth.fido2Enabled
            ? lang === 'FR'
              ? 'Vérification biométrique / Passkey annulée ou expirée.'
              : 'Passkey / biometric verification was cancelled or timed out.'
            : lang === 'FR'
            ? 'Aucune clé Passkey sélectionnée. Connectez-vous avec votre mot de passe pour enregistrer une clé Passkey.'
            : 'No passkey selected. Sign in with your password to register a passkey for this account.'
        );
      } else {
        setError(
          err?.message ||
            (lang === 'FR'
              ? "Échec de l'authentification par Passkey / FIDO2"
              : 'Passkey / FIDO2 authentication failed')
        );
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  // Password submission (with NIST SP 800-63B verification & FIDO2/TOTP checks)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userToAuth = selectedUser || householdMembers[0];
    if (!userToAuth) return;

    if (!password.trim()) {
      setError(
        lang === 'FR'
          ? 'Veuillez saisir votre mot de passe'
          : 'Please enter your password'
      );
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userToAuth.email || userToAuth.name || userToAuth.id,
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ||
            (lang === 'FR'
              ? 'Mot de passe incorrect'
              : 'Invalid password')
        );
        return;
      }

      if (data.token) {
        try {
          localStorage.setItem('pantryo_auth_token', data.token);
          localStorage.setItem('pantryo_active_user_id', (data.user || userToAuth).id);
        } catch (_) {}
      }

      const authenticatedUser: User = data.user || userToAuth;

      // 1. Check if user is required to setup personalized credentials or change password
      if (authenticatedUser.mustChangePassword || authenticatedUser.mustSetupProfile) {
        setOnboardingUser(authenticatedUser);
        return;
      }

      // 2. FIDO2 / 2FA Enforcement check
      if (data.requires2FA) {
        setFidoModal({
          isOpen: true,
          targetUser: authenticatedUser,
          mode: data.requiresEnrollment ? 'ENROLL_MANDATORY' : 'VERIFY',
          preferredMethod: 'totp',
          loginType: 'password',
        });
        return;
      }

      if (data.success && authenticatedUser) {
        onLoginSuccess(authenticatedUser);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.message ||
          (lang === 'FR' ? 'Erreur de connexion' : 'Login failed')
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle completion of password/profile onboarding
  const handleOnboardingComplete = (updatedUser: User) => {
    setOnboardingUser(null);
    setPassword('');
    setSelectedUser(updatedUser);

    if (onMembersUpdated) {
      fetch('/api/v1/auth/public-members')
        .then((r) => r.json())
        .then((users) => onMembersUpdated(users))
        .catch(() => {});
    }

    onLoginSuccess(updatedUser);
  };

  const effectiveMembers = householdMembers && householdMembers.length > 0
    ? householdMembers
    : (selectedUser ? [selectedUser] : []);

  const activeUser = selectedUser || effectiveMembers[0] || null;

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface)] flex flex-col justify-between items-center p-4 sm:p-6 w-full animate-fade-in">
      {/* Top Header with Language Switcher & Install Button */}
      <header className="w-full max-w-md flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <PantryoLogo size={32} />
          <span className="font-black text-lg tracking-tight text-[var(--md-sys-color-on-surface)]">
            Pantryo
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isInstalled && <PWAInstallButton variant="pill" />}
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Login Card - Material Design 3 Elevated Surface Container */}
      <div className="w-full max-w-md bg-[var(--md-sys-color-surface-container-lowest)] border border-[var(--md-sys-color-outline-variant)]/70 rounded-[28px] p-6 sm:p-8 shadow-[var(--md-sys-elevation-2)] space-y-6">
        {/* Title & Household context */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>
              {lang === 'FR' ? 'Pantryo • Connexion Sécurisée' : 'Pantryo • Secure Login'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
            {effectiveMembers.length > 1
              ? (lang === 'FR' ? 'Profils de cuisine' : 'Household Profiles')
              : (lang === 'FR' ? 'Connexion Administrateur' : 'Administrator Sign In')}
          </h2>
          <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
            {effectiveMembers.length > 1
              ? (lang === 'FR'
                  ? 'Sélectionnez votre profil pour accéder à votre cuisine et inventaire'
                  : 'Select your profile to access kitchen inventory and pantry')
              : (lang === 'FR'
                  ? 'Connectez-vous pour configurer et gérer votre cuisine intelligente'
                  : 'Sign in to manage and configure your smart kitchen pantry')}
          </p>
        </div>

        {/* Member Selector Cards: Single Admin profile or Multi-user profile grid */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)] block">
            {effectiveMembers.length > 1
              ? (lang === 'FR' ? 'Sélectionner un profil :' : 'Select profile:')
              : (lang === 'FR' ? 'Compte administrateur :' : 'Administrator account:')}
          </label>
          <div className={`grid ${effectiveMembers.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
            {effectiveMembers.map((member) => {
              const isSelected = activeUser?.id === member.id;
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(member);
                    setError('');
                    setPassword('');
                  }}
                  className={`p-3 rounded-[20px] border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--md-sys-color-primary-container)]/40 border-[var(--md-sys-color-primary)] ring-2 ring-[var(--md-sys-color-primary)]/20 shadow-xs'
                      : 'bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/70 hover:bg-[var(--md-sys-color-surface-container)] hover:border-[var(--md-sys-color-outline)]'
                  }`}
                >
                  <img
                    src={member.avatarUrl || '/avatars/chef-cat.svg'}
                    alt={member.name}
                    className={`w-11 h-11 rounded-full object-cover shrink-0 border-2 shadow-xs bg-[var(--md-sys-color-secondary-container)] ${
                      isSelected ? 'border-[var(--md-sys-color-primary)]' : 'border-white'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] truncate">
                        {member.name}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          member.role === 'ADMIN'
                            ? 'bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]'
                            : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]'
                        }`}
                      >
                        {member.role === 'ADMIN'
                          ? (lang === 'FR' ? 'Administrateur' : 'Admin')
                          : (lang === 'FR' ? 'Membre' : 'Member')}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fast Passkey / Biometrics Button (M3 Full-Pill Primary Action) */}
        {activeUser && (activeUser.fido2Enabled || webAuthnSupported) && (
          <div className="space-y-1.5 pt-1">
            <button
              type="button"
              onClick={() => handlePasskeyLogin(activeUser)}
              disabled={passkeyLoading || loading}
              className="w-full py-3 px-5 rounded-full bg-[var(--md-sys-color-primary)] hover:brightness-110 disabled:opacity-60 text-[var(--md-sys-color-on-primary)] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[var(--md-sys-elevation-1)] hover:shadow-[var(--md-sys-elevation-2)] transition-all active:scale-98 cursor-pointer"
            >
              {passkeyLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 text-[var(--md-sys-color-primary-container)] animate-spin" />
                  <span>
                    {lang === 'FR'
                      ? 'Scannez votre empreinte ou choisissez une clé...'
                      : 'Scan your finger or select a passkey...'}
                  </span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4 text-[var(--md-sys-color-primary-container)]" />
                  <span>
                    {lang === 'FR'
                      ? `Se connecter avec Passkey / Clé FIDO2`
                      : `Sign in with Passkey / FIDO2 Key`}
                  </span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-[var(--md-sys-color-outline)]">
              {lang === 'FR'
                ? 'Compatible Face ID, Touch ID, Windows Hello & YubiKey'
                : 'Compatible with Face ID, Touch ID, Windows Hello & YubiKey'}
            </p>
          </div>
        )}

        {/* Divider if Passkey shown */}
        {activeUser && (activeUser.fido2Enabled || webAuthnSupported) && (
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[var(--md-sys-color-outline-variant)]/70 w-full" />
            <span className="bg-[var(--md-sys-color-surface-container-lowest)] px-3 text-[11px] font-bold text-[var(--md-sys-color-outline)] uppercase tracking-wider absolute">
              {lang === 'FR' ? 'ou par mot de passe' : 'or with password'}
            </span>
          </div>
        )}

        {/* Password Form for Selected Profile */}
        {activeUser && (
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                  {lang === 'FR' ? 'Mot de passe' : 'Password'}
                </label>
                <span className="text-[10px] text-[var(--md-sys-color-outline)]">
                  {lang === 'FR' ? 'NIST SP 800-63B' : 'NIST SP 800-63B'}
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--md-sys-color-outline)]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    lang === 'FR'
                      ? 'Entrez votre mot de passe...'
                      : 'Enter your password...'
                  }
                  className="w-full pl-10 pr-10 py-3 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-outline)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:border-[var(--md-sys-color-primary)] focus:bg-[var(--md-sys-color-surface-container-lowest)] transition-all font-mono"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs flex items-center gap-2 animate-fade-in font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-5 rounded-full bg-[var(--md-sys-color-secondary-container)] hover:brightness-95 disabled:opacity-50 text-[var(--md-sys-color-on-secondary-container)] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{lang === 'FR' ? 'Vérification en cours...' : 'Verifying...'}</span>
                </>
              ) : (
                <>
                  <span>
                    {lang === 'FR'
                      ? `Se connecter en tant que ${activeUser.name}`
                      : `Log in as ${activeUser.name}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-[var(--md-sys-color-outline)] py-3 space-y-1">
        <p>Pantryo • Zero-Waste Kitchen & Smart Pantry Management</p>
        <p className="text-[10px] opacity-75">
          FIDO2 WebAuthn & NIST SP 800-63B Local Security
        </p>
      </footer>

      {/* Onboarding Flow Modal (Mandatory Admin Initialization & User First-Login Setup) */}
      {onboardingUser && (
        <OnboardingFlowModal
          user={onboardingUser}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* FIDO2 Authentication / Enrollment Modal */}
      {fidoModal.isOpen && fidoModal.targetUser && (
        <Fido2AuthModal
          isOpen={fidoModal.isOpen}
          targetUser={fidoModal.targetUser}
          mode={fidoModal.mode}
          preferredMethod={fidoModal.preferredMethod}
          loginType={fidoModal.loginType}
          onClose={() =>
            setFidoModal({
              isOpen: false,
              targetUser: null,
              mode: 'VERIFY',
            })
          }
          onSuccess={(verifiedUser) => {
            setFidoModal({
              isOpen: false,
              targetUser: null,
              mode: 'VERIFY',
            });
            onLoginSuccess(verifiedUser || fidoModal.targetUser!);
          }}
        />
      )}
    </div>
  );
};
