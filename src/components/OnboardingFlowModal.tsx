import React, { useState, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  RefreshCw,
  KeyRound,
  Fingerprint,
  Camera,
  Upload,
} from 'lucide-react';
import { User } from '../types';
import { PantryoLogo } from './PantryoLogo';
import { useLanguage } from '../utils/i18n';
import { NistPasswordValidator } from './NistPasswordValidator';
import { ChangeAvatarModal } from './ChangeAvatarModal';

interface OnboardingFlowModalProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

export const OnboardingFlowModal: React.FC<OnboardingFlowModalProps> = ({
  user,
  onComplete,
}) => {
  const { lang } = useLanguage();
  const isAdminInit = Boolean(user.isDefaultAdmin || user.mustSetupProfile);

  // Form states
  const [username, setUsername] = useState(user.email === 'admin' ? '' : user.email);
  const [name, setName] = useState(user.name === 'Administrator' ? '' : user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '/avatars/chef-cat.svg');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isAdminInit) {
      if (!username.trim()) {
        setError(
          lang === 'FR'
            ? 'Veuillez saisir un identifiant personnalisé'
            : 'Please enter a personalized username'
        );
        return;
      }
      if (username.trim().toLowerCase() === 'admin') {
        setError(
          lang === 'FR'
            ? "L'identifiant ne peut pas être 'admin'. Choisissez un nom ou pseudo personnalisé."
            : "Username cannot remain 'admin'. Please choose your personal username."
        );
        return;
      }
      if (!name.trim()) {
        setError(
          lang === 'FR'
            ? 'Veuillez saisir votre prénom ou nom'
            : 'Please enter your display name'
        );
        return;
      }
    }

    if (!newPassword.trim()) {
      setError(
        lang === 'FR'
          ? 'Veuillez saisir votre nouveau mot de passe'
          : 'Please enter your new password'
      );
      return;
    }

    if (newPassword.trim() === 'pantryo' || newPassword.trim() === 'pnatryo' || newPassword.trim() === 'admin123') {
      setError(
        lang === 'FR'
          ? 'Le nouveau mot de passe ne peut pas être le mot de passe par défaut.'
          : 'The new password cannot be the default factory password.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        lang === 'FR'
          ? 'Les deux mots de passe ne correspondent pas'
          : 'Passwords do not match'
      );
      return;
    }

    try {
      setLoading(true);

      if (isAdminInit) {
        // Complete default admin initialization
        const res = await fetch(`/api/v1/admin/users/${encodeURIComponent(user.id)}/complete-setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newUsername: username.trim(),
            newName: name.trim(),
            newPassword: newPassword.trim(),
            avatarUrl: avatarUrl || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || (lang === 'FR' ? 'Erreur lors de la configuration' : 'Setup failed'));
          return;
        }

        onComplete(data.user);
      } else {
        // Member must change password
        const res = await fetch(`/api/v1/admin/users/${encodeURIComponent(user.id)}/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newPassword: newPassword.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || (lang === 'FR' ? 'Erreur lors du changement' : 'Password change failed'));
          return;
        }

        // Also update avatar if changed
        if (avatarUrl && avatarUrl !== user.avatarUrl) {
          await fetch(`/api/v1/admin/users/${encodeURIComponent(user.id)}/avatar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatarUrl }),
          }).catch(() => {});
          data.user.avatarUrl = avatarUrl;
        }

        onComplete(data.user);
      }
    } catch (err: any) {
      console.error('Onboarding submission error:', err);
      setError(err.message || (lang === 'FR' ? 'Une erreur est survenue' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#FAF7EE] text-[#133E3B] w-full max-w-lg rounded-3xl border border-[#E0D9C8] shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-teal-900 to-teal-950 text-white relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              {isAdminInit ? (
                <KeyRound className="w-6 h-6 text-teal-300" />
              ) : (
                <Lock className="w-6 h-6 text-teal-300" />
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-800/80 text-[10px] font-bold text-teal-200 tracking-wider uppercase mb-1">
                <ShieldAlert className="w-3 h-3 text-amber-300" />
                <span>
                  {isAdminInit
                    ? lang === 'FR'
                      ? 'Premier Démarrage • Initialisation Admin'
                      : 'First Run • Admin Initialization'
                    : lang === 'FR'
                    ? 'Changement de mot de passe obligatoire'
                    : 'Mandatory Password Setup'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                {isAdminInit
                  ? lang === 'FR'
                    ? 'Personnalisation du compte Administrateur'
                    : 'Configure Your Administrator Account'
                  : lang === 'FR'
                  ? `Bienvenue, ${user.name}`
                  : `Welcome, ${user.name}`}
              </h2>
            </div>
          </div>

          <p className="mt-3 text-xs text-teal-100/90 leading-relaxed">
            {isAdminInit
              ? lang === 'FR'
                ? "Vous êtes connecté avec les identifiants initiaux d'installation (admin / pnatryo). Pour sécuriser votre foyer, vous devez créer votre identifiant personnalisé et votre propre mot de passe. Le mot de passe par défaut sera définitivement supprimé."
                : 'You have logged in with the fresh install credentials (admin / pnatryo). To secure your pantry, you must create a personalized username and new password. The default factory password will be permanently destroyed.'
              : lang === 'FR'
              ? 'Votre compte a été créé par un administrateur. Lors de votre première connexion, vous devez définir votre mot de passe personnel, puis associer votre clé de sécurité Passkey / FIDO2.'
              : 'Your account was provisioned by your household administrator. On your first sign-in, you must configure your personal password, followed by your Passkey / FIDO2 security key.'}
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {isAdminInit && (
            <div className="space-y-3 p-4 rounded-2xl bg-white border border-[#E5DFD0]">
              <h4 className="text-xs font-bold text-[#0D3B37] uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-teal-700" />
                <span>{lang === 'FR' ? 'Identifiants Personnalisés' : 'Personalized Credentials'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0D3B37] mb-1">
                    {lang === 'FR' ? 'Prénom / Nom d’affichage' : 'Display Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={lang === 'FR' ? 'Ex: Alexandre' : 'e.g. Alex'}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] text-xs font-semibold text-[#0D3B37] focus:outline-hidden focus:ring-2 focus:ring-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D3B37] mb-1">
                    {lang === 'FR' ? 'Identifiant ou Email' : 'Username or Email'}
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={lang === 'FR' ? 'Ex: alex ou alex@foyer.local' : 'e.g. alex or alex@home.local'}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] text-xs font-semibold text-[#0D3B37] focus:outline-hidden focus:ring-2 focus:ring-teal-700 font-mono"
                  />
                </div>
              </div>

              {/* Profile Picture Option in Admin Setup */}
              <div className="pt-2 border-t border-[#EFEAE0] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={avatarUrl}
                    alt={name || 'Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-teal-600/30 shadow-xs"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#0D3B37] block">
                      {lang === 'FR' ? 'Photo de profil' : 'Profile Picture'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {lang === 'FR' ? 'Choisissez une photo ou prenez un selfie' : 'Select avatar or take selfie'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-1.5 border border-teal-200 cursor-pointer transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? 'Changer' : 'Change'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Profile Picture Option for regular members during first login */}
          {!isAdminInit && (
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5DFD0] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-teal-600/30 shadow-xs"
                />
                <div>
                  <span className="text-xs font-bold text-[#0D3B37] block">
                    {lang === 'FR' ? 'Personnaliser votre photo de profil' : 'Customize Profile Picture'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {lang === 'FR' ? 'Appuyez pour choisir votre avatar' : 'Tap to change your photo'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-1.5 border border-teal-200 cursor-pointer transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{lang === 'FR' ? 'Changer' : 'Change'}</span>
              </button>
            </div>
          )}

          {/* New Password & Confirmation */}
          <div className="space-y-3 p-4 rounded-2xl bg-white border border-[#E5DFD0]">
            <h4 className="text-xs font-bold text-[#0D3B37] uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-700" />
              <span>{lang === 'FR' ? 'Nouveau Mot de Passe' : 'New Password'}</span>
            </h4>

            <div>
              <label className="block text-xs font-bold text-[#0D3B37] mb-1">
                {lang === 'FR' ? 'Nouveau mot de passe' : 'New password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={lang === 'FR' ? 'Phrase secrète recommandée...' : 'Passphrase recommended...'}
                  className="w-full pl-3 pr-10 py-2 rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] text-xs text-[#0D3B37] focus:outline-hidden focus:ring-2 focus:ring-teal-700 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0D3B37] mb-1">
                {lang === 'FR' ? 'Confirmez le nouveau mot de passe' : 'Confirm new password'}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={lang === 'FR' ? 'Retapez le mot de passe...' : 'Retype password...'}
                  className="w-full pl-3 pr-10 py-2 rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] text-xs text-[#0D3B37] focus:outline-hidden focus:ring-2 focus:ring-teal-700 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* NIST SP 800-63B Interactive Screener */}
            <NistPasswordValidator
              password={newPassword}
              onPasswordChange={setNewPassword}
              userContext={{
                name: name || user.name,
                email: username || user.email,
                username: (username || user.email).split('@')[0],
              }}
              lang={lang}
              showHierarchyGuide={false}
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'FR' ? 'Enregistrement en cours...' : 'Saving changes...'}</span>
              </>
            ) : (
              <>
                <span>
                  {isAdminInit
                    ? lang === 'FR'
                      ? 'Valider mon compte & Supprimer le mot de passe par défaut'
                      : 'Save Account & Remove Default Password'
                    : lang === 'FR'
                    ? 'Définir mon mot de passe & Passer à la clé Passkey'
                    : 'Set Password & Continue to Passkey Registration'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Profile Picture Change Modal */}
      {isAvatarModalOpen && (
        <ChangeAvatarModal
          isOpen={isAvatarModalOpen}
          user={{
            ...user,
            avatarUrl: avatarUrl,
            name: name || user.name,
          }}
          onClose={() => setIsAvatarModalOpen(false)}
          onSaveAvatar={(newAvatar) => {
            setAvatarUrl(newAvatar);
            setIsAvatarModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
