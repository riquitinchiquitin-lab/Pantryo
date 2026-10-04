import React, { useState } from 'react';
import { Users, Copy, Check, Shield, Clock, Plus, UserCheck, ArrowRightLeft, Key, ShieldAlert, ShieldCheck, Camera, LogOut, Download, Smartphone, CheckCircle2, Edit3, Trash2, X, AlertTriangle, ChefHat } from 'lucide-react';
import { User, ActivityLogItem } from '../types';
import { useLanguage, getLocationLocalizedName } from '../utils/i18n';
import { Fido2AuthModal } from './Fido2AuthModal';
import { ChangeAvatarModal } from './ChangeAvatarModal';

interface FamilySyncViewProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  members: User[];
  onOpenAdmin?: () => void;
  onUpdateMember?: (user: User) => void;
  onLogout?: () => void;
  onInstall?: () => void;
  isInstalled?: boolean;
  kitchenName?: string;
  onDeleteMember?: (user: User) => Promise<void> | void;
}

export const FamilySyncView: React.FC<FamilySyncViewProps> = ({
  currentUser,
  onSwitchUser,
  members,
  onOpenAdmin,
  onUpdateMember,
  onLogout,
  onInstall,
  isInstalled = false,
  kitchenName = 'The Yan & Kriz Kitchen',
  onDeleteMember,
}) => {
  const { t, lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    targetUser: User | null;
    mode: 'VERIFY' | 'ENROLL_MANDATORY';
  }>({
    isOpen: false,
    targetUser: null,
    mode: 'VERIFY',
  });
  const [avatarModalUser, setAvatarModalUser] = useState<User | null>(null);
  const inviteCode = 'KOMRADE-7729';

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMemberClick = (member: User) => {
    if (member.id === currentUser.id) return;

    // All users must use FIDO2
    if (member.fido2Enabled) {
      setAuthModal({
        isOpen: true,
        targetUser: member,
        mode: 'VERIFY',
      });
    } else {
      setAuthModal({
        isOpen: true,
        targetUser: member,
        mode: 'ENROLL_MANDATORY',
      });
    }
  };

  const activityAudit: ActivityLogItem[] = [
    {
      id: 'log_3',
      action: 'ITEM_DEFROSTED',
      details: { itemName: lang === 'FR' ? 'Bœuf haché bio' : 'Grass-Fed Ground Beef', fromLocation: 'Freezer', toLocation: 'Fridge', newExpiration: '3 days', defrostedBy: 'Yan' },
      userId: 'usr_yan',
      householdId: 'hh_01',
      createdAt: lang === 'FR' ? 'Il y a 12 min' : '12 minutes ago',
    },
    {
      id: 'log_2',
      action: 'ITEM_CREATED',
      details: { itemName: lang === 'FR' ? 'Fraises bio' : 'Organic Strawberries', location: 'Fridge', addedBy: 'Kriz' },
      userId: 'usr_kriz',
      householdId: 'hh_01',
      createdAt: lang === 'FR' ? 'Il y a 3 heures' : '3 hours ago',
    },
    {
      id: 'log_1',
      action: 'ITEM_CREATED',
      details: { itemName: lang === 'FR' ? 'Lait d\'avoine barista' : 'Oat Milk (Barista Blend)', location: 'Fridge', addedBy: 'Yan' },
      userId: 'usr_yan',
      householdId: 'hh_01',
      createdAt: lang === 'FR' ? 'Hier' : 'Yesterday',
    },
  ];

  return (
    <div className="space-y-5 pb-32 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#233527]">
            {lang === 'FR' ? 'Synchronisation Familiale & Foyer' : 'Family Sync & Household'}
          </h2>
          <p className="text-xs text-[#5D7060]">
            {lang === 'FR'
              ? 'Accès partagé pour colocataires et familles'
              : 'Multi-tenant access for roommates and families'}
          </p>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title={lang === 'FR' ? 'Déconnexion du compte' : 'Log out of account'}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{lang === 'FR' ? 'Déconnexion' : 'Log Out'}</span>
          </button>
        )}
      </div>

      {/* Household Invite Box */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#EBF3E8] to-[#DEF0DC] border border-[#BFDEBA] shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm min-w-0">
            <Users className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="truncate">{kitchenName || 'The Yan & Kriz Kitchen'}</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-semibold shrink-0">
            {lang === 'FR' ? 'Foyer Actif' : 'Active Household'}
          </span>
        </div>

        <p className="text-xs text-[#425E45] leading-relaxed">
          {lang === 'FR'
            ? 'Partagez ce code d\'invitation avec les membres de votre foyer pour scanner des articles, recevoir les alertes de péremption et gérer les courses ensemble.'
            : 'Share this invite code with family members or roommates so they can scan items, receive expiration alerts, and manage fridge items together.'}
        </p>

        <div className="flex items-center gap-2 p-2 bg-white/90 backdrop-blur rounded-2xl border border-emerald-200">
          <div className="flex-1 font-mono font-bold text-center tracking-wider text-emerald-900 text-sm">
            {inviteCode}
          </div>
          <button
            onClick={copyInvite}
            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? (lang === 'FR' ? 'Copié' : 'Copied') : (lang === 'FR' ? 'Copier' : 'Copy')}
          </button>
        </div>
      </div>

      {/* Admin Management Quick Card */}
      {onOpenAdmin && (
        <div className="p-4 rounded-3xl bg-white border border-[#D5E1D2] shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[#233527]">
                  {lang === 'FR' ? 'Console d’Administration Pantryo' : 'Pantryo Admin Console'}
                </h4>
              </div>
              <p className="text-xs text-[#5D7060]">
                {lang === 'FR'
                  ? 'Sauvegardes chiffrées, restauration complète et gestion des accès'
                  : 'Encrypted backups, disaster recovery & household permissions'}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAdmin}
            className="px-3.5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 shadow-sm shrink-0 cursor-pointer"
          >
            <span>{lang === 'FR' ? 'Gérer' : 'Manage'}</span>
          </button>
        </div>
      )}

      {/* Switch Active User / Simulator Switcher */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#5D7060]">
            {lang === 'FR' ? `Membres du Foyer (${members.length})` : `Household Members (${members.length})`}
          </h3>
          <span className="text-[11px] text-[#69856C]">
            {lang === 'FR' ? 'Touchez pour changer de profil actif' : 'Tap to switch active profile'}
          </span>
        </div>

        {/* Global Policy Notice */}
        <div className="p-3 rounded-2xl bg-teal-50/90 border border-teal-200/80 text-xs text-teal-900 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0">
              <Key className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-[11px] text-teal-950 block truncate">
                {lang === 'FR' ? 'Politique Globale : FIDO2 Obligatoire pour Tous' : 'Global Policy: FIDO2 Mandatory for All Users'}
              </span>
              <span className="text-[10px] text-teal-700 block">
                {lang === 'FR'
                  ? 'Chaque compte doit être déverrouillé par Passkey, Touch ID ou YubiKey.'
                  : 'Every account requires a Passkey, Touch ID, or YubiKey.'}
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-teal-100 text-teal-800 border border-teal-300 shrink-0">
            ENFORCED
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {members.map((member) => {
            const isActive = member.id === currentUser.id;
            return (
              <div
                key={member.id}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all ${
                  isActive
                    ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-[#F2F6F0] border-[#D9E4D6] hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative group/avatar shrink-0">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs cursor-pointer hover:opacity-90"
                      onClick={() => setAvatarModalUser(member)}
                    />
                    <button
                      type="button"
                      onClick={() => setAvatarModalUser(member)}
                      className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-800 hover:bg-emerald-600 text-white shadow-xs transition-colors cursor-pointer"
                      title={lang === 'FR' ? 'Changer la photo de profil' : 'Change profile picture'}
                    >
                      <Camera className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleMemberClick(member)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#233527] truncate">{member.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isActive && <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                        {onDeleteMember && members.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUserToDelete(member);
                            }}
                            className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={lang === 'FR' ? `Supprimer ${member.name}` : `Delete ${member.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-[#6C8470]">
                      {member.role === 'ADMIN'
                        ? (lang === 'FR' ? 'Administrateur' : 'Admin')
                        : (lang === 'FR' ? 'Membre' : 'Member')}
                    </span>
                  </div>
                </div>

                <div
                  className="pt-1 border-t border-[#E5EFE2] flex items-center justify-between text-[10px] cursor-pointer"
                  onClick={() => handleMemberClick(member)}
                >
                  {member.fido2Enabled ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{lang === 'FR' ? 'FIDO2 Conforme' : 'FIDO2 Active'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                      <Key className="w-3 h-3 text-amber-600" />
                      <span>{lang === 'FR' ? 'Clé requise' : 'Key required'}</span>
                    </span>
                  )}
                  <span className="text-[#879D89] font-medium">
                    {isActive ? (lang === 'FR' ? 'Actuel' : 'Active') : (lang === 'FR' ? 'Basculer ➜' : 'Switch ➜')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FIDO2 Auth & Mandatory Enrollment Modal */}
      {authModal.isOpen && authModal.targetUser && (
        <Fido2AuthModal
          isOpen={authModal.isOpen}
          targetUser={authModal.targetUser}
          mode={authModal.mode}
          onClose={() =>
            setAuthModal({
              isOpen: false,
              targetUser: null,
              mode: 'VERIFY',
            })
          }
          onSuccess={(updatedUser) => {
            if (updatedUser && onUpdateMember) {
              onUpdateMember(updatedUser);
            }
            onSwitchUser(updatedUser || authModal.targetUser!);
          }}
        />
      )}

      {/* Change Avatar / Profile Picture Modal */}
      {avatarModalUser && (
        <ChangeAvatarModal
          isOpen={Boolean(avatarModalUser)}
          user={avatarModalUser}
          onClose={() => setAvatarModalUser(null)}
          onSaveAvatar={(newAvatarUrl) => {
            const updated: User = {
              ...avatarModalUser,
              avatarUrl: newAvatarUrl,
            };
            if (onUpdateMember) {
              onUpdateMember(updated);
            }
            if (currentUser.id === avatarModalUser.id) {
              onSwitchUser(updated);
            }
            setAvatarModalUser(null);
          }}
        />
      )}

      {/* PWA Application & Install Status Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-white via-white to-teal-50/40 border border-[#D5E1D2] space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-[#0D3B37]">
                {lang === 'FR' ? 'Application & Installation PWA' : 'App & PWA Installation'}
              </h4>
              <p className="text-[11px] text-[#527470]">
                {lang === 'FR' ? 'Application Web Progressive plein écran' : 'Fullscreen Progressive Web App'}
              </p>
            </div>
          </div>
          {isInstalled ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-100 text-teal-900 font-extrabold text-[10px] border border-teal-200">
              <CheckCircle2 className="w-3 h-3 text-teal-700" />
              <span>{lang === 'FR' ? 'Appli Installée' : 'App Installed'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] border border-amber-200">
              <Smartphone className="w-3 h-3 text-amber-700" />
              <span>{lang === 'FR' ? 'Mode Navigateur' : 'Browser Mode'}</span>
            </span>
          )}
        </div>

        <p className="text-xs text-[#2A4D48] leading-relaxed">
          {isInstalled
            ? lang === 'FR'
              ? 'Pantryo est installée sur cet appareil en mode autonome avec prise en charge du cache hors-ligne et lancement plein écran.'
              : 'Pantryo is installed on this device in standalone mode with offline cache and instant launch.'
            : lang === 'FR'
            ? 'Installez Pantryo sur votre écran d\'accueil pour profiter du mode plein écran, d\'un accès rapide sans barre d\'adresse et de la numérisation caméra instantanée.'
            : 'Install Pantryo on your home screen for a fullscreen experience, fast camera barcode scanning, and offline access.'}
        </p>

        {!isInstalled && onInstall && (
          <button
            type="button"
            onClick={onInstall}
            className="w-full py-2.5 px-4 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-300" />
            <span>{lang === 'FR' ? 'Installer Pantryo sur cet appareil' : 'Install Pantryo on this device'}</span>
          </button>
        )}
      </div>

      {/* Household Audit Activity Feed */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5D7060]">
          <Clock className="w-3.5 h-3.5" />
          <span>{lang === 'FR' ? 'Journal d\'Activité en Temps Réel' : 'Real-Time Audit Activity'}</span>
        </div>

        <div className="space-y-2.5">
          {activityAudit.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-white border border-[#D5E1D2] text-xs space-y-1 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#233527]">
                  {log.details.itemName}
                </span>
                <span className="text-[11px] text-[#7B947E]">{log.createdAt}</span>
              </div>
              <p className="text-[#59725C]">
                {log.action === 'ITEM_DEFROSTED' ? (
                  lang === 'FR' ? (
                    <>Décongelé par <strong>{log.details.defrostedBy}</strong> (déplacé du Congélateur ➡️ Réfrigérateur avec 3 jours de conservation)</>
                  ) : (
                    <>Defrosted by <strong>{log.details.defrostedBy}</strong> (moved from Freezer ➡️ Fridge with 3 days shelf-life)</>
                  )
                ) : (
                  lang === 'FR' ? (
                    <>Ajouté dans {getLocationLocalizedName(log.details.location || '', lang)} par <strong>{log.details.addedBy}</strong></>
                  ) : (
                    <>Added to {log.details.location} by <strong>{log.details.addedBy}</strong></>
                  )
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#D5E1D2] max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  {lang === 'FR' ? `Supprimer "${userToDelete.name}" ?` : `Delete "${userToDelete.name}"?`}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'FR'
                    ? 'Ce membre sera définitivement retiré du foyer.'
                    : 'This member will be permanently removed from this household.'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-tight">
                {lang === 'FR'
                  ? 'Les articles ajoutés par cet utilisateur resteront dans la cuisine. Cette action ne peut pas être annulée.'
                  : 'Items previously added by this member will remain in the kitchen. This action cannot be undone.'}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                {lang === 'FR' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={async () => {
                  if (!onDeleteMember || !userToDelete) return;
                  setIsDeletingUser(true);
                  try {
                    await onDeleteMember(userToDelete);
                    setUserToDelete(null);
                  } finally {
                    setIsDeletingUser(false);
                  }
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition-colors active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingUser ? '...' : (lang === 'FR' ? 'Supprimer' : 'Delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
