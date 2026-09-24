import React, { useState, useEffect } from 'react';
import {
  Key,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  UserCheck,
  Fingerprint,
  RefreshCw,
  Check,
  Smartphone,
} from 'lucide-react';
import { User } from '../types';
import { PantryoLogo } from './PantryoLogo';
import { useLanguage, LanguageSwitcher } from '../utils/i18n';
import { fido2Client } from '../services/fido2Client';
import { Fido2AuthModal } from './Fido2AuthModal';
import { OnboardingFlowModal } from './OnboardingFlowModal';
import { ChangeAvatarModal } from './ChangeAvatarModal';

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
  const [selectedUser, setSelectedUser] = useState<User | null>(
    householdMembers[0] || null
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [webAuthnSupported, setWebAuthnSupported] = useState(false);

  // Clean-Install Initial Setup Form States (when zero saved users exist)
  const [initName, setInitName] = useState('');
  const [initUsername, setInitUsername] = useState('');
  const [initPassword, setInitPassword] = useState('');
  const [initConfirmPassword, setInitConfirmPassword] = useState('');
  const [showInitPassword, setShowInitPassword] = useState(false);
  const [initAvatarUrl, setInitAvatarUrl] = useState(
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
  );
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

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

  useEffect(() => {
    if (householdMembers && householdMembers.length > 0) {
      if (!selectedUser || !householdMembers.find((m) => m.id === selectedUser.id)) {
        setSelectedUser(householdMembers[0]);
      }
    }
  }, [householdMembers]);

  // Clean-Install Initial Administrator Registration Submission
  const handleSetupAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!initName.trim()) {
      setError(
        lang === 'FR'
          ? 'Veuillez saisir votre nom ou prénom'
          : 'Please enter your display name'
      );
      return;
    }

    const cleanUsername = initUsername.trim().toLowerCase();
    if (!cleanUsername) {
      setError(
        lang === 'FR'
          ? 'Veuillez choisir un identifiant personnalisé'
          : 'Please enter a personalized username'
      );
      return;
    }

    if (cleanUsername === 'admin') {
      setError(
        lang === 'FR'
          ? "L'identifiant ne peut pas être 'admin'. Choisissez un nom d'utilisateur ou pseudo personnel."
          : "Username cannot remain generic 'admin'. Please choose your personal username."
      );
      return;
    }

    if (!initPassword.trim()) {
      setError(
        lang === 'FR'
          ? 'Veuillez saisir votre mot de passe'
          : 'Please enter your password'
      );
      return;
    }

    if (initPassword.length < 8) {
      setError(
        lang === 'FR'
          ? 'Le mot de passe doit contenir au moins 8 caractères (NIST SP 800-63B)'
          : 'Password must be at least 8 characters (NIST SP 800-63B)'
      );
      return;
    }

    if (initPassword !== initConfirmPassword) {
      setError(
        lang === 'FR'
          ? 'Les deux mots de passe ne correspondent pas'
          : 'Passwords do not match'
      );
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/v1/auth/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: initName.trim(),
          username: cleanUsername,
          password: initPassword.trim(),
          avatarUrl: initAvatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize administrator account');
      }

      const createdAdmin: User = data.user;
      setSelectedUser(createdAdmin);
      if (onMembersUpdated) {
        onMembersUpdated([createdAdmin]);
      }

      // Mandatory 2FA registration for the new administrator
      setFidoModal({
        isOpen: true,
        targetUser: createdAdmin,
        mode: 'ENROLL_MANDATORY',
        preferredMethod: webAuthnSupported ? 'fido' : 'totp',
        loginType: 'password',
      });
    } catch (err: any) {
      setError(err.message || 'Setup error');
    } finally {
      setLoading(false);
    }
  };

  // Quick Passkey / Biometrics trigger
  const handlePasskeyLogin = async (userToAuth: User) => {
    setError('');
    setSelectedUser(userToAuth);

    // If user needs password change or admin init, route through password onboarding first
    if (userToAuth.mustChangePassword || userToAuth.mustSetupProfile) {
      setError(
        lang === 'FR'
          ? 'Configuration initiale requise : veuillez vous connecter par mot de passe pour initialiser votre compte.'
          : 'Initial configuration required: please sign in with password to set up your account.'
      );
      return;
    }

    if (userToAuth.fido2Enabled) {
      setFidoModal({
        isOpen: true,
        targetUser: userToAuth,
        mode: 'VERIFY',
        preferredMethod: 'fido',
        loginType: 'passkey',
      });
    } else {
      setFidoModal({
        isOpen: true,
        targetUser: userToAuth,
        mode: 'ENROLL_MANDATORY',
        preferredMethod: webAuthnSupported ? 'fido' : 'totp',
        loginType: 'passkey',
      });
    }
  };

  // Password submission fallback (with NIST rate-limiting check and FIDO2 2FA step)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
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
          username: selectedUser.email || selectedUser.name,
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error ||
            (lang === 'FR'
              ? 'Identifiants incorrects'
              : 'Invalid credentials')
        );
        return;
      }

      const authenticatedUser: User = data.user || selectedUser;

      // 1. Check if user is required to setup personalized credentials or change password
      if (authenticatedUser.mustChangePassword || authenticatedUser.mustSetupProfile) {
        setOnboardingUser(authenticatedUser);
        return;
      }

      // 2. FIDO2 / 2FA Enforcement check
      // When logging in with password (no passkey possibility or preference), prioritize 6-digit TOTP
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
      // Fallback for clean install demo
      if (
        (selectedUser.email === 'admin' || selectedUser.name === 'Administrator') &&
        (password === 'pantryo' || password === 'pnatryo')
      ) {
        setOnboardingUser(selectedUser);
      } else {
        setError(
          err.message ||
            (lang === 'FR' ? 'Erreur de connexion' : 'Login failed')
        );
      }
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
      fetch('/api/v1/admin/users')
        .then((r) => r.json())
        .then((users) => onMembersUpdated(users))
        .catch(() => {});
    }

    // Now proceed immediately to mandatory FIDO2 passkey registration
    setFidoModal({
      isOpen: true,
      targetUser: updatedUser,
      mode: 'ENROLL_MANDATORY',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7EE] via-[#F4EDE0] to-[#EBE3D0] flex flex-col justify-between items-center p-4 sm:p-6 w-full animate-fade-in">
      {/* Top Header with Language Switcher */}
      <header className="w-full max-w-md flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <PantryoLogo size={32} />
          <span className="font-black text-lg tracking-tight text-[#0D3B37]">
            Pantryo
          </span>
        </div>
        <LanguageSwitcher />
      </header>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-[#E5DFD0] rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
        {householdMembers.length === 0 ? (
          /* ======================================================== */
          /* CLEAN INSTALL / ZERO SAVED USERS INITIAL SETUP VIEW      */
          /* ======================================================== */
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {lang === 'FR' ? 'Configuration Initiale • Installation Propre' : 'Initial Setup • Clean Installation'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0D3B37] tracking-tight">
                {lang === 'FR' ? 'Créer le Compte Administrateur' : 'Create Administrator Account'}
              </h2>
              <p className="text-xs text-[#527470]">
                {lang === 'FR'
                  ? 'Aucun profil enregistré. Créez votre compte administrateur pour initialiser votre foyer et sécuriser vos données.'
                  : 'No saved users. Create your primary administrator account to initialize your kitchen and secure your data.'}
              </p>
            </div>

            <form onSubmit={handleSetupAdminSubmit} className="space-y-3.5 pt-1">
              {/* Avatar Picker Preview */}
              <div className="flex flex-col items-center justify-center gap-1 pb-1">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => setIsAvatarModalOpen(true)}
                  title={lang === 'FR' ? 'Changer la photo' : 'Change picture'}
                >
                  <img
                    src={initAvatarUrl}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-teal-600 shadow-sm group-hover:opacity-85 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-white font-bold">{lang === 'FR' ? 'Modifier' : 'Edit'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="text-[11px] font-bold text-teal-800 hover:underline cursor-pointer"
                >
                  {lang === 'FR' ? 'Choisir ou prendre une photo' : 'Choose or take a photo'}
                </button>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0D3B37] block">
                  {lang === 'FR' ? 'Nom ou Prénom' : 'Full Name or Display Name'}
                </label>
                <input
                  type="text"
                  required
                  value={initName}
                  onChange={(e) => setInitName(e.target.value)}
                  placeholder={lang === 'FR' ? 'Ex: Sophie Martin' : 'e.g., Alex Johnson'}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7EE] border border-[#E0D9C8] rounded-xl text-xs sm:text-sm text-[#0D3B37] focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Username */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0D3B37]">
                    {lang === 'FR' ? 'Identifiant personnel' : 'Personal Username or Email'}
                  </label>
                  <span className="text-[10px] text-[#7A9A96]">
                    {lang === 'FR' ? 'Différent de "admin"' : 'Cannot be generic "admin"'}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={initUsername}
                  onChange={(e) => setInitUsername(e.target.value)}
                  placeholder={lang === 'FR' ? 'Ex: sophie ou sophie@foyer.local' : 'e.g., alex or alex@home.local'}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7EE] border border-[#E0D9C8] rounded-xl text-xs sm:text-sm text-[#0D3B37] focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-hidden font-mono"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#0D3B37]">
                    {lang === 'FR' ? 'Mot de passe sécurisé' : 'Secure Password'}
                  </label>
                  <span className="text-[10px] text-teal-800 font-bold">
                    NIST SP 800-63B (min 8 chars)
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showInitPassword ? 'text' : 'password'}
                    required
                    value={initPassword}
                    onChange={(e) => setInitPassword(e.target.value)}
                    placeholder={lang === 'FR' ? 'Au moins 8 caractères...' : 'At least 8 characters...'}
                    className="w-full pl-9 pr-10 py-2.5 bg-[#FAF7EE] border border-[#E0D9C8] rounded-xl text-xs sm:text-sm text-[#0D3B37] focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInitPassword(!showInitPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showInitPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0D3B37] block">
                  {lang === 'FR' ? 'Confirmer le mot de passe' : 'Confirm Password'}
                </label>
                <input
                  type={showInitPassword ? 'text' : 'password'}
                  required
                  value={initConfirmPassword}
                  onChange={(e) => setInitConfirmPassword(e.target.value)}
                  placeholder={lang === 'FR' ? 'Retapez votre mot de passe...' : 'Re-type your password...'}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7EE] border border-[#E0D9C8] rounded-xl text-xs sm:text-sm text-[#0D3B37] focus:ring-2 focus:ring-teal-600 focus:bg-white focus:outline-hidden font-mono"
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer mt-1"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{lang === 'FR' ? 'Initialisation en cours...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {lang === 'FR'
                        ? 'Créer le Compte Administrateur & Continuer'
                        : 'Create Administrator Account & Continue'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* ======================================================== */
          /* STANDARD LOGIN VIEW WITH REAL HOUSEHOLD USERS            */
          /* ======================================================== */
          <>
            {/* Title & Household context */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>
                  {lang === 'FR' ? 'Pantryo • Sécurité FIDO2 & 2FA' : 'Pantryo • FIDO2 & 2FA Security'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0D3B37] tracking-tight">
                {lang === 'FR' ? 'Connexion Sécurisée' : 'Secure Login'}
              </h2>
              <p className="text-xs text-[#527470]">
                {lang === 'FR'
                  ? 'Choisissez votre profil pour accéder à votre cuisine et inventaire'
                  : 'Choose your profile to access kitchen inventory and pantry'}
              </p>
            </div>

            {/* Member Selector Cards */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#527470] block">
                {lang === 'FR' ? 'Sélectionner un profil :' : 'Select profile:'}
              </label>
              <div className={`grid ${householdMembers.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
                {householdMembers.map((member) => {
                  const isSelected = selectedUser?.id === member.id;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(member);
                        setError('');
                      }}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-600/20 shadow-xs'
                          : 'bg-[#FAF7EE] border-[#E5DFD0] hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-white shadow-2xs"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#0D3B37] truncate">
                            {member.name}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-[#527470] block truncate">
                          {member.role === 'ADMIN'
                            ? lang === 'FR'
                              ? 'Administrateur'
                              : 'Admin'
                            : lang === 'FR'
                            ? 'Membre'
                            : 'Member'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fast Passkey / Biometrics Button */}
            {selectedUser && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handlePasskeyLogin(selectedUser)}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0D3B37] via-[#0E766E] to-[#134E48] hover:from-[#092926] hover:to-[#0B5C56] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <Fingerprint className="w-5 h-5 text-teal-300" />
                  <span>
                    {lang === 'FR'
                      ? `Se connecter avec Passkey / Clé FIDO2`
                      : `Sign in with Passkey / FIDO2 Key`}
                  </span>
                </button>
                <p className="text-[10px] text-center text-[#527470]">
                  {lang === 'FR'
                    ? 'Compatible Face ID, Touch ID, Windows Hello et clés YubiKey'
                    : 'Compatible with Face ID, Touch ID, Windows Hello, and YubiKeys'}
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#E5DFD0] w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-[#7A9A96] uppercase tracking-wider absolute">
                {lang === 'FR' ? 'ou par mot de passe' : 'or with password'}
              </span>
            </div>

            {/* Password Form */}
            {selectedUser && (
              <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0D3B37]">
                      {lang === 'FR' ? 'Mot de passe' : 'Password'}
                    </label>
                    <span className="text-[10px] text-[#7A9A96]">
                      {lang === 'FR' ? 'NIST SP 800-63B' : 'NIST SP 800-63B'}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
                      className="w-full pl-9 pr-10 py-2.5 bg-[#FAF7EE] border border-[#E0D9C8] rounded-xl text-xs sm:text-sm text-[#0D3B37] placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* 2nd Factor 6 digits reminder for password logins */}
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-teal-800 font-medium">
                    <Smartphone className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>
                      {lang === 'FR'
                        ? '2ème facteur requis après mot de passe : code à 6 chiffres (Google Authenticator / TOTP)'
                        : '2nd factor required after password: 6-digit code (Google Authenticator / TOTP)'}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{lang === 'FR' ? 'Vérification...' : 'Verifying...'}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {lang === 'FR'
                          ? `Se connecter en tant que ${selectedUser.name}`
                          : `Log in as ${selectedUser.name}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* Change Avatar Modal for Setup */}
      {isAvatarModalOpen && (
        <ChangeAvatarModal
          isOpen={isAvatarModalOpen}
          user={{
            id: 'temp_admin',
            name: initName || 'Administrator',
            email: initUsername || 'admin',
            role: 'ADMIN',
            avatarUrl: initAvatarUrl,
            fido2Enabled: false,
          }}
          onClose={() => setIsAvatarModalOpen(false)}
          onSaveAvatar={(newUrl) => {
            setInitAvatarUrl(newUrl);
            setIsAvatarModalOpen(false);
          }}
        />
      )}

      {/* Footer */}
      <footer className="text-center text-[11px] text-[#7A9A96] py-3 space-y-1">
        <p>Pantryo • Zero-Waste Kitchen & Smart Pantry Management</p>
        <p className="text-[10px] text-slate-400">
          Domain: pantryo.yknet.org • FIDO2 WebAuthn & NIST SP 800-63B Enforced
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

