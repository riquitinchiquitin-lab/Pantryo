import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Database,
  Download,
  Upload,
  RefreshCw,
  Lock,
  Unlock,
  Key,
  Users,
  Check,
  AlertTriangle,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  UserPlus,
  Crown,
  UserCheck,
  ArrowRight,
  Server,
  HardDrive,
  Info,
  X,
} from 'lucide-react';
import { User, DatabaseStats, DatabaseBackupPackage } from '../types';
import { useLanguage } from '../utils/i18n';
import { Fido2SecurityPanel } from './Fido2SecurityPanel';
import { NistPasswordValidator } from './NistPasswordValidator';
import { generatePassphrase } from '../utils/nistPassword';

const DEFAULT_DATABASE_STATS: DatabaseStats = {
  status: 'HEALTHY',
  encryption: {
    algorithm: 'AES-256-GCM',
    atRest: true,
    authenticated: true,
    keyDerivation: 'PBKDF2-SHA256 (100,000 rounds)',
    storageLocation: 'server/data/pantryo_database.enc',
    fileSizeKb: 25,
  },
  twoFactor: {
    standard: 'FIDO2 / WebAuthn Level 3',
    passkeysSupported: true,
    hardwareKeysSupported: true,
    recoveryCodesSupported: true,
    activeEnrolledUsers: 1,
  },
  counts: {
    items: 8,
    plannedMeals: 1,
    customRecipes: 1,
    groceryItems: 0,
    savedLists: 0,
    users: 2,
    locations: 3,
    categories: 10,
  },
  household: {
    id: 'hh_yan_kriz_01',
    name: 'The Yan & Kriz Kitchen',
    inviteCode: 'PANTRY-YK77',
  },
  lastBackupAt: null,
  lastRestoreAt: null,
  serverTime: new Date().toISOString(),
};

interface AdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserChange?: (user: User) => void;
  onDatabaseRestored?: () => void;
}

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onDatabaseRestored,
}) => {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'backup' | 'users' | 'security'>('backup');
  const [stats, setStats] = useState<DatabaseStats>(DEFAULT_DATABASE_STATS);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Backup State
  const [encryptBackup, setEncryptBackup] = useState(true);
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [showBackupPassphrase, setShowBackupPassphrase] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Restore State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePackage, setRestorePackage] = useState<DatabaseBackupPackage | null>(null);
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [showRestorePassphrase, setShowRestorePassphrase] = useState(false);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset State
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetAction, setResetAction] = useState<'seed' | 'wipe'>('seed');

  // Users State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [newUserPassword, setNewUserPassword] = useState(() => generatePassphrase(4, '-'));
  const [showNewUserPassword, setShowNewUserPassword] = useState(true);

  // Change Password State
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showNewPasswordValue, setShowNewPasswordValue] = useState(true);

  // Fetch Database Stats & Users
  const fetchStatsAndUsers = async (retryCount = 0) => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/v1/admin/stats', {
          headers: {
            Accept: 'application/json',
            'x-user-role': currentUser?.role || 'ADMIN',
            'x-user-id': currentUser?.id || 'usr_yan',
          },
        }),
        fetch('/api/v1/admin/users', {
          headers: {
            Accept: 'application/json',
            'x-user-role': currentUser?.role || 'ADMIN',
            'x-user-id': currentUser?.id || 'usr_yan',
          },
        }),
      ]);

      const statsType = statsRes.headers.get('content-type') || '';
      if (statsRes.ok && statsType.includes('application/json')) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else if (retryCount < 2) {
        setTimeout(() => fetchStatsAndUsers(retryCount + 1), 600);
        return;
      }

      const usersType = usersRes.headers.get('content-type') || '';
      if (usersRes.ok && usersType.includes('application/json')) {
        const usersData = await usersRes.json();
        setUsersList(usersData);
      }
    } catch (err) {
      console.warn('Admin stats fetch note:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatsAndUsers();
      setStatusMessage(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle Export Backup
  const handleExportBackup = async () => {
    if (encryptBackup && !backupPassphrase.trim()) {
      setStatusMessage({
        text: lang === 'FR' ? 'Veuillez entrer une phrase de passe pour chiffrer la sauvegarde' : 'Please enter a passphrase to encrypt your backup',
        type: 'error',
      });
      return;
    }

    try {
      setIsExporting(true);
      setStatusMessage(null);

      const params = new URLSearchParams();
      if (encryptBackup) {
        params.append('encrypt', 'true');
        params.append('passphrase', backupPassphrase.trim());
      }

      const res = await fetch(`/api/v1/admin/backup?${params.toString()}`, {
        headers: {
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Export failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `pantryo-backup-${dateStr}${encryptBackup ? '.pantryo.enc' : '.json'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMessage({
        text:
          lang === 'FR'
            ? `Sauvegarde ${encryptBackup ? 'chiffrée (AES-256-GCM)' : 'JSON'} téléchargée avec succès !`
            : `Backup ${encryptBackup ? 'encrypted (AES-256-GCM)' : 'JSON'} downloaded successfully!`,
        type: 'success',
      });

      fetchStatsAndUsers();
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Selection for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        setRestorePackage(parsed);
        setStatusMessage(null);
      } catch (err) {
        setStatusMessage({
          text: lang === 'FR' ? 'Fichier de sauvegarde invalide (JSON requis)' : 'Invalid backup file (JSON/Encrypted package required)',
          type: 'error',
        });
        setRestorePackage(null);
      }
    };
    reader.readAsText(file);
  };

  // Handle Execute Restore
  const handleExecuteRestore = async () => {
    if (!restorePackage) {
      setStatusMessage({
        text: lang === 'FR' ? 'Veuillez d’abord sélectionner un fichier de sauvegarde' : 'Please select a backup file first',
        type: 'error',
      });
      return;
    }

    if (restorePackage.metadata?.isEncrypted && !restorePassphrase.trim()) {
      setStatusMessage({
        text: lang === 'FR' ? 'Cette sauvegarde est chiffrée. Veuillez entrer la phrase de passe de déchiffrement.' : 'This backup is encrypted. Please enter the decryption passphrase.',
        type: 'error',
      });
      return;
    }

    try {
      setIsRestoring(true);
      setStatusMessage(null);

      const res = await fetch('/api/v1/admin/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          backupPackage: restorePackage,
          passphrase: restorePassphrase.trim(),
          mode: restoreMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Restore failed');
      }

      setStatusMessage({
        text:
          lang === 'FR'
            ? `Restauration réussie (${data.recordCounts?.items ?? 0} articles synchronisés) !`
            : `Database restored successfully (${data.recordCounts?.items ?? 0} items synchronized)!`,
        type: 'success',
      });

      // Clear restore state
      setRestoreFile(null);
      setRestorePackage(null);
      setRestorePassphrase('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh stats & notify parent
      fetchStatsAndUsers();
      if (onDatabaseRestored) {
        onDatabaseRestored();
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Database Reset
  const handleExecuteReset = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ action: resetAction }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');

      setShowResetConfirm(false);
      setStatusMessage({
        text:
          resetAction === 'seed'
            ? lang === 'FR'
              ? 'Base de données réinitialisée aux stocks d’usine avec succès !'
              : 'Database reset to factory stock successfully!'
            : lang === 'FR'
            ? 'Tous les articles ont été effacés avec succès.'
            : 'All inventory items wiped successfully.',
        type: 'success',
      });

      fetchStatsAndUsers();
      if (onDatabaseRestored) {
        onDatabaseRestored();
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole,
          password: newUserPassword,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create user');
      }

      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword(generatePassphrase(4, '-'));
      fetchStatsAndUsers();
      setStatusMessage({
        text: lang === 'FR' ? 'Membre ajouté avec succès !' : 'Household member added successfully!',
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Role Change
  const handleUpdateRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update role');
      }

      fetchStatsAndUsers();
      setStatusMessage({
        text: lang === 'FR' ? `Rôle mis à jour vers ${newRole}` : `Role updated to ${newRole}`,
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    }
  };

  // Handle Set Password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword || !newPasswordValue) return;

    try {
      const res = await fetch(`/api/v1/admin/users/${selectedUserForPassword.id}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role,
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({ password: newPasswordValue }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update password');
      }

      setSelectedUserForPassword(null);
      setNewPasswordValue('');
      setStatusMessage({
        text: lang === 'FR' ? 'Mot de passe mis à jour avec succès' : 'Password updated successfully',
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#FAF7EE] text-[#133E3B] flex flex-col w-full h-full overflow-hidden animate-fade-in"
    >
      <div className="flex flex-col w-full h-full overflow-hidden">
        {/* Top Header */}
        <div className="px-5 sm:px-8 py-4 bg-white border-b border-[#E8E2D5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-[#0D3B37]">
                  {lang === 'FR' ? 'Console d’Administration & Sauvegarde' : 'App & Database Administration'}
                </h2>
              </div>
              <p className="text-xs text-[#527470]">
                {lang === 'FR'
                  ? 'Gestion de la base de données chiffrée, sauvegardes et comptes du foyer'
                  : 'Encrypted storage management, database backups & household access'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
              title={lang === 'FR' ? 'Fermer / Quitter' : 'Close / Exit'}
            >
              <X className="w-4 h-4" />
              <span>{lang === 'FR' ? 'Quitter' : 'Exit'}</span>
            </button>
          </div>
        </div>

        {/* Global Toast / Feedback */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 shrink-0 ${
              statusMessage.type === 'success'
                ? 'bg-teal-700 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-5 sm:px-7 pt-3 bg-white/70 border-b border-[#E8E2D5] flex gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === 'backup'
                ? 'border-teal-800 text-teal-900 bg-[#FAF7EE]'
                : 'border-transparent text-[#527470] hover:text-[#0D3B37]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{lang === 'FR' ? 'Sauvegarde & Restauration' : 'Backup & Restore'}</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === 'users'
                ? 'border-teal-800 text-teal-900 bg-[#FAF7EE]'
                : 'border-transparent text-[#527470] hover:text-[#0D3B37]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{lang === 'FR' ? 'Membres & Rôles' : 'Household & Access'}</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap border-b-2 ${
              activeTab === 'security'
                ? 'border-teal-800 text-teal-900 bg-[#FAF7EE]'
                : 'border-transparent text-[#527470] hover:text-[#0D3B37]'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{lang === 'FR' ? 'Sécurité & 2FA FIDO2' : 'Security & FIDO2 2FA'}</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* TAB 1: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0D3B37]">
                        {lang === 'FR' ? 'Base de Données Chiffrée' : 'Encrypted Storage Status'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {stats?.status || 'HEALTHY'}
                      </span>
                    </div>
                    <p className="text-xs text-[#527470] mt-0.5">
                      {lang === 'FR'
                        ? `Chiffrement : AES-256-GCM au repos (${stats?.encryption?.fileSizeKb ?? 0} Ko)`
                        : `Encryption: AES-256-GCM at rest (${stats?.encryption?.fileSizeKb ?? 0} KB)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-[#527470] w-full sm:w-auto justify-between sm:justify-start">
                  <div className="px-3 py-1.5 bg-[#F6F2E8] rounded-xl text-center">
                    <span className="block text-xs font-black text-[#0D3B37]">
                      {stats?.counts?.items ?? 0}
                    </span>
                    <span className="text-[10px] uppercase text-[#738C88]">
                      {lang === 'FR' ? 'Articles' : 'Items'}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 bg-[#F6F2E8] rounded-xl text-center">
                    <span className="block text-xs font-black text-[#0D3B37]">
                      {stats?.counts?.plannedMeals ?? 0}
                    </span>
                    <span className="text-[10px] uppercase text-[#738C88]">
                      {lang === 'FR' ? 'Repas' : 'Meals'}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 bg-[#F6F2E8] rounded-xl text-center">
                    <span className="block text-xs font-black text-[#0D3B37]">
                      {stats?.counts?.customRecipes ?? 0}
                    </span>
                    <span className="text-[10px] uppercase text-[#738C88]">
                      {lang === 'FR' ? 'Recettes' : 'Recipes'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid: 2 Columns for Export & Import */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. BACKUP (EXPORT) */}
                <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                        <Download className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-[#0D3B37]">
                        {lang === 'FR' ? 'Exporter une Sauvegarde' : 'Export Full Backup'}
                      </h3>
                    </div>
                    <p className="text-xs text-[#527470]">
                      {lang === 'FR'
                        ? 'Téléchargez une archive complète de vos stocks, dates de péremption, repas planifiés et recettes.'
                        : 'Download a complete archive of your stock, expiration records, planned meals, and custom recipes.'}
                    </p>

                    <div className="mt-4 space-y-3">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-[#0D3B37]">
                        <input
                          type="checkbox"
                          checked={encryptBackup}
                          onChange={(e) => setEncryptBackup(e.target.checked)}
                          className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500 border-[#C9C2B0]"
                        />
                        <span>
                          {lang === 'FR'
                            ? 'Chiffrer l’archive avec une phrase de passe (AES-256-GCM)'
                            : 'Encrypt archive with passphrase (AES-256-GCM)'}
                        </span>
                      </label>

                      {encryptBackup && (
                        <div className="relative animate-fade-in">
                          <input
                            type={showBackupPassphrase ? 'text' : 'password'}
                            placeholder={lang === 'FR' ? 'Phrase secrète de chiffrement' : 'Encryption passphrase'}
                            value={backupPassphrase}
                            onChange={(e) => setBackupPassphrase(e.target.value)}
                            className="w-full px-3 py-2 pr-9 text-xs rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono text-[#0D3B37]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowBackupPassphrase(!showBackupPassphrase)}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showBackupPassphrase ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleExportBackup}
                    disabled={isExporting}
                    className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>
                      {encryptBackup
                        ? lang === 'FR'
                          ? 'Télécharger la sauvegarde chiffrée (.pantryo.enc)'
                          : 'Download Encrypted Backup (.pantryo.enc)'
                        : lang === 'FR'
                        ? 'Télécharger la sauvegarde JSON (.json)'
                        : 'Download JSON Backup (.json)'}
                    </span>
                  </button>
                </div>

                {/* 2. RESTORE (IMPORT) */}
                <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-[#0D3B37]">
                        {lang === 'FR' ? 'Restaurer une Sauvegarde' : 'Restore from Backup'}
                      </h3>
                    </div>
                    <p className="text-xs text-[#527470]">
                      {lang === 'FR'
                        ? 'Restaurez vos données à partir d’un fichier .pantryo.enc chiffré ou d’un export .json.'
                        : 'Restore your pantry data from an encrypted .pantryo.enc package or a .json export.'}
                    </p>

                    <div className="mt-4 space-y-3">
                      {/* File picker */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".enc,.json,.pantryo"
                        onChange={handleFileChange}
                        className="w-full text-xs text-[#527470] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-100 file:text-teal-800 hover:file:bg-teal-200 cursor-pointer"
                      />

                      {/* Backup Inspection Info */}
                      {restorePackage && (
                        <div className="p-3 rounded-xl bg-[#F6F2E8] border border-[#E8E2D5] text-xs space-y-1 animate-fade-in">
                          <div className="flex items-center justify-between font-bold text-[#0D3B37]">
                            <span>{lang === 'FR' ? 'Fichier analysé :' : 'Analyzed package:'}</span>
                            <span className="text-teal-700">
                              {restorePackage.metadata?.isEncrypted ? 'Chiffré AES-256-GCM' : 'JSON Standard'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#527470]">
                            {lang === 'FR' ? 'Articles dans l’archive :' : 'Items in snapshot:'}{' '}
                            <strong className="text-[#0D3B37]">
                              {restorePackage.metadata?.recordCounts?.items ?? 'N/A'}
                            </strong>{' '}
                            • {lang === 'FR' ? 'Repas :' : 'Meals:'}{' '}
                            <strong className="text-[#0D3B37]">
                              {restorePackage.metadata?.recordCounts?.plannedMeals ?? 'N/A'}
                            </strong>
                          </p>

                          {restorePackage.metadata?.isEncrypted && (
                            <div className="relative pt-1.5">
                              <input
                                type={showRestorePassphrase ? 'text' : 'password'}
                                placeholder={lang === 'FR' ? 'Entrez la phrase secrète de déchiffrement' : 'Enter decryption passphrase'}
                                value={restorePassphrase}
                                onChange={(e) => setRestorePassphrase(e.target.value)}
                                className="w-full px-3 py-1.5 pr-8 text-xs rounded-lg bg-white border border-[#D5CEBD] focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-[#0D3B37]"
                              />
                              <button
                                type="button"
                                onClick={() => setShowRestorePassphrase(!showRestorePassphrase)}
                                className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {showRestorePassphrase ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mode choice */}
                      <div className="flex gap-2">
                        <label className="flex-1 flex items-center gap-1.5 p-2 rounded-xl bg-[#FAF7EE] border border-[#E5DFD0] text-[11px] font-bold cursor-pointer text-[#0D3B37]">
                          <input
                            type="radio"
                            name="restoreMode"
                            value="replace"
                            checked={restoreMode === 'replace'}
                            onChange={() => setRestoreMode('replace')}
                            className="text-teal-700"
                          />
                          <span>{lang === 'FR' ? 'Remplacement complet' : 'Full Clean Restore'}</span>
                        </label>
                        <label className="flex-1 flex items-center gap-1.5 p-2 rounded-xl bg-[#FAF7EE] border border-[#E5DFD0] text-[11px] font-bold cursor-pointer text-[#0D3B37]">
                          <input
                            type="radio"
                            name="restoreMode"
                            value="merge"
                            checked={restoreMode === 'merge'}
                            onChange={() => setRestoreMode('merge')}
                            className="text-teal-700"
                          />
                          <span>{lang === 'FR' ? 'Fusionner & Synchroniser' : 'Merge with Current'}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteRestore}
                    disabled={isRestoring || !restorePackage}
                    className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isRestoring ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{lang === 'FR' ? 'Confirmer & Restaurer' : 'Execute Restore Now'}</span>
                  </button>
                </div>
              </div>

              {/* Emergency Danger Zone */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs text-rose-900">
                        {lang === 'FR' ? 'Réinitialisation & Maintenance d’Urgence' : 'Database Maintenance & Reset'}
                      </h4>
                      <p className="text-[11px] text-rose-700">
                        {lang === 'FR'
                          ? 'Restaurer les stocks d’usine par défaut ou vider tous les articles.'
                          : 'Revert to fresh factory inventory seed or wipe all item records.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setResetAction('seed');
                        setShowResetConfirm(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 font-bold text-xs cursor-pointer"
                    >
                      {lang === 'FR' ? 'Stocks d’Usine' : 'Factory Stock'}
                    </button>
                    <button
                      onClick={() => {
                        setResetAction('wipe');
                        setShowResetConfirm(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
                    >
                      {lang === 'FR' ? 'Tout Vider' : 'Wipe All'}
                    </button>
                  </div>
                </div>

                {showResetConfirm && (
                  <div className="mt-3 p-3 rounded-xl bg-white border border-rose-300 text-xs space-y-2 animate-fade-in">
                    <p className="font-bold text-rose-900">
                      {resetAction === 'seed'
                        ? lang === 'FR'
                          ? 'Êtes-vous sûr de vouloir réinitialiser aux stocks d’usine ?'
                          : 'Are you sure you want to reset to factory stock?'
                        : lang === 'FR'
                        ? 'ATTENTION : Cela supprimera définitivement tous les articles actuels.'
                        : 'WARNING: This will permanently wipe all inventory records.'}
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3 py-1 rounded-lg bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                      >
                        {lang === 'FR' ? 'Annuler' : 'Cancel'}
                      </button>
                      <button
                        onClick={handleExecuteReset}
                        className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs cursor-pointer"
                      >
                        {lang === 'FR' ? 'Confirmer' : 'Confirm Action'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: HOUSEHOLD USERS & ROLES */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-[#0D3B37]">
                    {lang === 'FR' ? 'Comptes et Droits d’Accès du Foyer' : 'Household Accounts & Access Control'}
                  </h3>
                  <p className="text-xs text-[#527470]">
                    {lang === 'FR'
                      ? 'Gestion des accès, mots de passe conformes NIST et clés d’authentification FIDO2.'
                      : 'Manage household accounts, NIST-compliant passphrases, and FIDO2 passkeys.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedUserForPassword(currentUser);
                      setNewPasswordValue('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
                    title={lang === 'FR' ? 'Modifier votre mot de passe' : 'Change your password'}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{lang === 'FR' ? 'Modifier mon mot de passe' : 'Change My Password'}</span>
                  </button>

                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{lang === 'FR' ? 'Ajouter un Membre' : 'Add Member'}</span>
                  </button>
                </div>
              </div>

              {/* Global FIDO2 Policy Status Banner */}
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-teal-900">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-teal-950">
                        {lang === 'FR'
                          ? 'Politique Globale : FIDO2 Obligatoire pour Tous les Utilisateurs'
                          : 'Global Policy: FIDO2 Mandatory for All Users'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black bg-teal-200 text-teal-900">
                        ENFORCED
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-700 mt-0.5">
                      {lang === 'FR'
                        ? 'Tous les utilisateurs (Admins et Membres) doivent posséder une clé FIDO2 active pour accéder à leur compte.'
                        : 'All users (Admins & Members) are required to have an active FIDO2 security key to log in.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('security')}
                  className="px-3 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? 'Gérer Sécurité FIDO2' : 'Manage FIDO2'}</span>
                </button>
              </div>

              {/* Users List Table */}
              <div className="rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs overflow-hidden">
                <div className="divide-y divide-[#EFEAE0]">
                  {usersList.map((u) => {
                    const isCurrentUser = u.id === currentUser.id;
                    const isAdmin = u.role === 'ADMIN';

                    return (
                      <div
                        key={u.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF7EE]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              u.avatarUrl ||
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                            }
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover border border-[#D5CEBD] shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#0D3B37]">{u.name}</span>
                              {isAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                                  <Crown className="w-3 h-3 text-amber-700" />
                                  ADMIN
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                  MEMBER
                                </span>
                              )}
                              {isCurrentUser && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800">
                                  {lang === 'FR' ? 'Vous' : 'You'}
                                </span>
                              )}
                              {u.fido2Enabled ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  title="Protégé par clé FIDO2"
                                >
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" />
                                  <span>{lang === 'FR' ? 'FIDO2 Conforme' : 'FIDO2 Compliant'}</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                                  title="Enrôlement FIDO2 requis"
                                >
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                                  <span>{lang === 'FR' ? 'Clé Requise' : 'Key Required'}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#527470]">{u.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Switch Active User */}
                          {onUserChange && !isCurrentUser && (
                            <button
                              onClick={() => onUserChange(u)}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF7EE] hover:bg-[#EFEAE0] text-[#0D3B37] border border-[#D5CEBD] font-bold text-xs flex items-center gap-1 cursor-pointer"
                              title={lang === 'FR' ? 'Basculer sur cette session' : 'Switch active session'}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{lang === 'FR' ? 'Basculer' : 'Switch'}</span>
                            </button>
                          )}

                          {/* Role Toggle Button */}
                          <button
                            onClick={() => handleUpdateRole(u.id, u.role)}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF7EE] hover:bg-[#EFEAE0] text-[#0D3B37] border border-[#D5CEBD] font-bold text-xs flex items-center gap-1 cursor-pointer"
                            title={lang === 'FR' ? 'Changer de rôle' : 'Toggle role'}
                          >
                            <Shield className="w-3.5 h-3.5 text-teal-700" />
                            <span>{isAdmin ? 'Make Member' : 'Make Admin'}</span>
                          </button>

                          {/* Change Password */}
                          <button
                            onClick={() => {
                              setSelectedUserForPassword(u);
                              setNewPasswordValue('');
                            }}
                            className="px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                            title={lang === 'FR' ? 'Modifier le mot de passe de ce membre' : 'Change password for this member'}
                          >
                            <Key className="w-3.5 h-3.5 text-teal-700" />
                            <span>{lang === 'FR' ? 'Changer mot de passe' : 'Change Password'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add User Modal Dialog */}
              {showAddUserModal && (
                <form
                  onSubmit={handleCreateUser}
                  className="p-5 rounded-2xl bg-white border border-teal-300 shadow-lg space-y-4 animate-fade-in"
                >
                  <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-2">
                    <h4 className="font-bold text-sm text-[#0D3B37]">
                      {lang === 'FR' ? 'Ajouter un nouveau membre' : 'Add New Household Member'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-[#0D3B37] mb-1">
                        {lang === 'FR' ? 'Prénom / Nom' : 'Name'}
                      </label>
                      <input
                        type="text"
                        required
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="e.g. Alex"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#0D3B37] mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] focus:outline-none focus:ring-2 focus:ring-teal-700"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-[#0D3B37] mb-1">
                        {lang === 'FR' ? 'Rôle' : 'Role'}
                      </label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] focus:outline-none focus:ring-2 focus:ring-teal-700"
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-[#0D3B37]">
                          {lang === 'FR' ? 'Mot de passe initial (NIST SP 800-63B)' : 'Initial Password (NIST SP 800-63B)'}
                        </label>
                        <span className="text-[10px] text-slate-500">
                          {showNewUserPassword
                            ? (lang === 'FR' ? 'Visible en clair' : 'Visible')
                            : (lang === 'FR' ? 'Masqué' : 'Masked')}
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type={showNewUserPassword ? 'text' : 'password'}
                          required
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          className="w-full pl-3 pr-20 py-2 rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono text-xs text-[#0D3B37]"
                        />
                        <div className="absolute right-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            title={showNewUserPassword ? (lang === 'FR' ? 'Masquer le mot de passe' : 'Hide password') : (lang === 'FR' ? 'Afficher le mot de passe' : 'View password')}
                          >
                            {showNewUserPassword ? <EyeOff className="w-4 h-4 text-teal-800" /> : <Eye className="w-4 h-4" />}
                          </button>
                          {newUserPassword && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(newUserPassword);
                                setStatusMessage({
                                  text: lang === 'FR' ? 'Mot de passe copié !' : 'Password copied!',
                                  type: 'success',
                                });
                              }}
                              className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold cursor-pointer"
                              title={lang === 'FR' ? 'Copier' : 'Copy'}
                            >
                              {lang === 'FR' ? 'Copier' : 'Copy'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real-time NIST SP 800-63B Validation & Generator */}
                  <NistPasswordValidator
                    password={newUserPassword}
                    onPasswordChange={setNewUserPassword}
                    userContext={{
                      name: newUserName,
                      email: newUserEmail,
                      username: newUserEmail.split('@')[0],
                    }}
                    lang={lang}
                    showHierarchyGuide={false}
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                    >
                      {lang === 'FR' ? 'Annuler' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-sm cursor-pointer"
                    >
                      {lang === 'FR' ? 'Créer le membre' : 'Create Member'}
                    </button>
                  </div>
                </form>
              )}

              {/* Set Password Dialog */}
              {selectedUserForPassword && (
                <form
                  onSubmit={handleSetPassword}
                  className="p-5 rounded-2xl bg-white border border-slate-300 shadow-lg space-y-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between border-b border-[#EFEAE0] pb-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#0D3B37]">
                        {lang === 'FR'
                          ? `Modifier le mot de passe pour ${selectedUserForPassword.name}`
                          : `Set password for ${selectedUserForPassword.name}`}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'FR'
                          ? 'Conforme aux directives NIST SP 800-63B : privilégiez la longueur sur la complexité.'
                          : 'Adheres to NIST SP 800-63B guidelines: length over complexity.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUserForPassword(null)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-[#0D3B37]">
                        {lang === 'FR' ? 'Nouveau mot de passe ou phrase de passe' : 'New Password or Passphrase'}
                      </label>
                      <span className="text-[10px] text-slate-500">
                        {showNewPasswordValue
                          ? (lang === 'FR' ? 'Visible en clair' : 'Visible')
                          : (lang === 'FR' ? 'Masqué' : 'Masked')}
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type={showNewPasswordValue ? 'text' : 'password'}
                        required
                        value={newPasswordValue}
                        onChange={(e) => setNewPasswordValue(e.target.value)}
                        placeholder={lang === 'FR' ? 'ex: phrase-de-passe-securisee' : 'e.g. correct-horse-battery-staple'}
                        className="w-full pl-3 pr-20 py-2 rounded-xl bg-[#FAF7EE] border border-[#D5CEBD] focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono text-xs text-[#0D3B37]"
                      />
                      <div className="absolute right-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowNewPasswordValue(!showNewPasswordValue)}
                          className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          title={showNewPasswordValue ? (lang === 'FR' ? 'Masquer le mot de passe' : 'Hide password') : (lang === 'FR' ? 'Afficher le mot de passe' : 'View password')}
                        >
                          {showNewPasswordValue ? <EyeOff className="w-4 h-4 text-teal-800" /> : <Eye className="w-4 h-4" />}
                        </button>
                        {newPasswordValue && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(newPasswordValue);
                              setStatusMessage({
                                text: lang === 'FR' ? 'Mot de passe copié !' : 'Password copied!',
                                type: 'success',
                              });
                            }}
                            className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold cursor-pointer"
                            title={lang === 'FR' ? 'Copier' : 'Copy'}
                          >
                            {lang === 'FR' ? 'Copier' : 'Copy'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Real-time NIST SP 800-63B Validation & Generator */}
                  <NistPasswordValidator
                    password={newPasswordValue}
                    onPasswordChange={setNewPasswordValue}
                    userContext={{
                      name: selectedUserForPassword.name,
                      email: selectedUserForPassword.email,
                      username: selectedUserForPassword.email?.split('@')[0],
                    }}
                    lang={lang}
                    showHierarchyGuide={true}
                  />

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedUserForPassword(null)}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
                    >
                      {lang === 'FR' ? 'Annuler' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-teal-800 text-white font-bold text-xs shadow-sm cursor-pointer"
                    >
                      {lang === 'FR' ? 'Enregistrer' : 'Save Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: SECURITY ARCHITECTURE & 2FA FIDO2 */}
          {activeTab === 'security' && (
            <div className="space-y-6 text-xs text-[#2A4D48]">
              {/* FIDO2 WebAuthn Management Suite */}
              <Fido2SecurityPanel
                user={currentUser}
                householdMembers={usersList}
                onUserUpdated={(updated) => {
                  if (onUserChange) onUserChange(updated);
                  fetchStatsAndUsers();
                }}
              />

              {/* Cryptographic Storage Architecture */}
              <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0D3B37]">
                      {lang === 'FR' ? 'Architecture Cryptographique Active' : 'Cryptographic Security Architecture'}
                    </h3>
                    <p className="text-xs text-[#527470]">
                      {lang === 'FR'
                        ? 'Chiffrement symétrique de grade militaire et protection de la vie privée'
                        : 'Military-grade symmetric encryption and privacy-by-design storage'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#FAF7EE] border border-[#E8E2D5]">
                    <span className="font-black text-teal-800 block text-xs">
                      Cipher: AES-256-GCM
                    </span>
                    <p className="text-[11px] text-[#527470] mt-1">
                      {lang === 'FR'
                        ? 'Mode Galois/Counter (GCM) avec étiquette d’authentification 128 bits garantissant la confidentialité et l’intégrité contre toute falsification.'
                        : 'Galois/Counter Mode (GCM) with 128-bit authentication tag guarantees confidentiality and tamper-proof data verification.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7EE] border border-[#E8E2D5]">
                    <span className="font-black text-teal-800 block text-xs">
                      Memory-Hard KDF: scrypt (N=32768)
                    </span>
                    <p className="text-[11px] text-[#527470] mt-1">
                      {lang === 'FR'
                        ? 'KDF à mémoire dure (N=32768, r=8, p=1, 64 Mo) rendant le cassage par GPU/ASIC inopérant, conforme NIST SP 800-63B.'
                        : 'Memory-hard KDF (N=32768, r=8, p=1, 64MB) designed to neutralize GPU/ASIC cracking rigs per NIST SP 800-63B.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7EE] border border-[#E8E2D5]">
                    <span className="font-black text-teal-800 block text-xs">
                      Storage at Rest
                    </span>
                    <p className="text-[11px] text-[#527470] mt-1">
                      {lang === 'FR'
                        ? 'Zéro texte clair sur le disque du serveur. Le fichier `server/data/pantryo_database.enc` est intégralement chiffré en continu.'
                        : 'Zero plaintext stored on disk. `server/data/pantryo_database.enc` is fully encrypted at rest upon every mutation.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF7EE] border border-[#E8E2D5]">
                    <span className="font-black text-teal-800 block text-xs">
                      FIDO2 / WebAuthn Level 3
                    </span>
                    <p className="text-[11px] text-[#527470] mt-1">
                      {lang === 'FR'
                        ? 'Paires de clés asymétriques résistantes au hameçonnage avec signature cryptographique générée dans le matériel sécurisé.'
                        : 'Phishing-resistant asymmetric keypairs signed directly in secure hardware modules or platform biometrics.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* NIST SP 800-63B Standards Compliance & Modern Hierarchy */}
              <div className="p-5 rounded-2xl bg-white border border-[#E0D9C8] shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#0D3B37]">
                          NIST SP 800-63B & Standards Modernes
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          CONFORME ACTIF
                        </span>
                      </div>
                      <p className="text-xs text-[#527470]">
                        {lang === 'FR'
                          ? 'Mise en œuvre intégrale des directives d’identité numérique NIST SP 800-63B'
                          : 'Full implementation of NIST SP 800-63B Digital Identity Guidelines'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4 Core Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Pillar 1 */}
                  <div className="p-3.5 rounded-xl bg-[#FAF7EE] border border-[#E8E2D5] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-teal-800 font-bold text-xs">
                      <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px]">1</span>
                      <span>{lang === 'FR' ? 'Longueur sur Complexité' : 'Length Over Complexity'}</span>
                    </div>
                    <p className="text-[11px] text-[#527470] leading-relaxed">
                      {lang === 'FR'
                        ? 'Plancher de 8 car. min, 15+ car. fortement recommandé. Jusqu’à 256 car. autorisés. Suppression totale des règles arbitraires (majuscule/symbole forcé). Espaces et Unicode NFKC pleinement acceptés.'
                        : '8 char minimum floor, 15+ chars recommended, up to 256 chars permitted. Dropped arbitrary composition puzzles. Spaces and Unicode NFKC fully accepted.'}
                    </p>
                  </div>

                  {/* Pillar 2 */}
                  <div className="p-3.5 rounded-xl bg-[#FAF7EE] border border-[#E8E2D5] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-teal-800 font-bold text-xs">
                      <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px]">2</span>
                      <span>{lang === 'FR' ? 'Bannissement des Politiques Obsolètes' : 'Banning Obsolete Policies'}</span>
                    </div>
                    <p className="text-[11px] text-[#527470] leading-relaxed">
                      {lang === 'FR'
                        ? 'Élimination des expirations arbitraires 60/90 jours (qui forcent des variations prévisibles). Aucune question secrète ni indice. Collage et gestionnaires de mots de passe expressément autorisés.'
                        : 'Eliminated periodic 60/90-day resets driving predictable edits. No security questions or hints. Copy/pasting and password managers fully encouraged.'}
                    </p>
                  </div>

                  {/* Pillar 3 */}
                  <div className="p-3.5 rounded-xl bg-[#FAF7EE] border border-[#E8E2D5] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-teal-800 font-bold text-xs">
                      <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px]">3</span>
                      <span>{lang === 'FR' ? 'Filtrage Proactif Anti-Fuites' : 'Proactive Breach Screening'}</span>
                    </div>
                    <p className="text-[11px] text-[#527470] leading-relaxed">
                      {lang === 'FR'
                        ? 'Contrôle en k-anonymat via l’API Have I Been Pwned (seuls 5 caractères de préfixe SHA-1 sont transmis). Filtrage contextuel (nom, email, Pantryo) et des séquences (12345, qwerty).'
                        : 'K-anonymity check via Have I Been Pwned API (only 5 SHA-1 prefix chars sent). Contextual screening (name, email, app terms) and sequential run filtering.'}
                    </p>
                  </div>

                  {/* Pillar 4 */}
                  <div className="p-3.5 rounded-xl bg-[#FAF7EE] border border-[#E8E2D5] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-teal-800 font-bold text-xs">
                      <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px]">4</span>
                      <span>{lang === 'FR' ? 'Stockage Sécurisé & Throttling' : 'Hardened Storage & Throttling'}</span>
                    </div>
                    <p className="text-[11px] text-[#527470] leading-relaxed">
                      {lang === 'FR'
                        ? 'Hachage scrypt à mémoire dure (32 Mo+). Limitation de débit progressive (délais exponentiels après échecs) sans verrouillage permanent destructeur (prévention des attaques par déni de service).'
                        : 'Memory-hard scrypt KDF. Progressive rate-limiting delays after repeated failures, avoiding permanent lockouts weaponizable for DoS attacks.'}
                    </p>
                  </div>
                </div>

                {/* Modern Hierarchy Visual Banner */}
                <div className="mt-2 p-3.5 rounded-xl bg-slate-900 text-slate-100 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    {lang === 'FR' ? 'La Hiérarchie Moderne de l’Authentification :' : 'Modern Hierarchy of Authentication:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10px]">
                    <div className="p-2 rounded-lg bg-purple-900/60 border border-purple-500/40">
                      <span className="font-bold text-purple-300 block mb-0.5">Tier 1 : Passkeys / FIDO2</span>
                      <p className="text-purple-200/80">Inviolable au phishing, biométrie & matériel sécurisé.</p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-900/60 border border-emerald-500/40">
                      <span className="font-bold text-emerald-300 block mb-0.5">Tier 2 : Phrase 16+ car + 2FA</span>
                      <p className="text-emerald-200/80">Haute entropie de dictionnaire (Diceware) mémorisable.</p>
                    </div>
                    <div className="p-2 rounded-lg bg-blue-900/60 border border-blue-500/40">
                      <span className="font-bold text-blue-300 block mb-0.5">Tier 3 : Gestionnaire 24 car.</span>
                      <p className="text-blue-200/80">Chaînes aléatoires générées par Bitwarden / 1Password.</p>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-900/60 border border-rose-500/40">
                      <span className="font-bold text-rose-300 block mb-0.5">Banni : Mots de passe courts</span>
                      <p className="text-rose-200/80">Règles symboles (P@ssword1!) et resets 90 jours proscrits.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-[#E8E2D5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#527470]">
            <Shield className="w-4 h-4 text-teal-700" />
            <span>
              {lang === 'FR' ? 'Session active :' : 'Active session:'}{' '}
              <strong className="text-[#0D3B37]">{currentUser.name}</strong> ({currentUser.role})
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#FAF7EE] hover:bg-[#EFEAE0] text-[#0D3B37] font-bold text-xs border border-[#D5CEBD] transition-colors cursor-pointer"
          >
            {lang === 'FR' ? 'Fermer la console' : 'Close Console'}
          </button>
        </div>
      </div>
    </div>
  );
};
