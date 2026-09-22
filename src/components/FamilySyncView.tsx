import React, { useState } from 'react';
import { Users, Copy, Check, Shield, Clock, Plus, UserCheck, ArrowRightLeft, Key, ShieldAlert, ShieldCheck, Camera } from 'lucide-react';
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
}

export const FamilySyncView: React.FC<FamilySyncViewProps> = ({
  currentUser,
  onSwitchUser,
  members,
  onOpenAdmin,
  onUpdateMember,
}) => {
  const { t, lang } = useLanguage();
  const [copied, setCopied] = useState(false);
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
    <div className="space-y-5 pb-20 animate-fade-in">
      {/* Header */}
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

      {/* Household Invite Box */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#EBF3E8] to-[#DEF0DC] border border-[#BFDEBA] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
            <Users className="w-4 h-4 text-emerald-700" />
            <span>The Yan & Kriz Kitchen</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-semibold">
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
              <button
                key={member.id}
                onClick={() => handleMemberClick(member)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
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
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAvatarModalUser(member);
                      }}
                      className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-800 hover:bg-emerald-600 text-white shadow-xs transition-colors cursor-pointer"
                      title={lang === 'FR' ? 'Changer la photo de profil' : 'Change profile picture'}
                    >
                      <Camera className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#233527] truncate">{member.name}</span>
                      {isActive && <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </div>
                    <span className="text-[11px] text-[#6C8470]">
                      {member.role === 'ADMIN'
                        ? (lang === 'FR' ? 'Administrateur' : 'Admin')
                        : (lang === 'FR' ? 'Membre' : 'Member')}
                    </span>
                  </div>
                </div>

                <div className="pt-1 border-t border-[#E5EFE2] flex items-center justify-between text-[10px]">
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
              </button>
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
                    <>Ajouté dans {getLocationLocalizedName(log.details.location, lang)} par <strong>{log.details.addedBy}</strong></>
                  ) : (
                    <>Added to {log.details.location} by <strong>{log.details.addedBy}</strong></>
                  )
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
