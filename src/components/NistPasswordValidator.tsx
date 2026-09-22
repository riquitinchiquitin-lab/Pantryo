import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Copy,
  Check,
  Sparkles,
  ClipboardPaste,
  Info,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Lock,
  Ban,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  evaluatePasswordNist,
  generatePassphrase,
  generateMachinePassword,
  NistValidationResult,
} from '../utils/nistPassword';

interface NistPasswordValidatorProps {
  password: string;
  onPasswordChange: (newPassword: string) => void;
  userContext?: { name?: string; email?: string; username?: string };
  lang?: 'FR' | 'EN';
  showHierarchyGuide?: boolean;
}

export const NistPasswordValidator: React.FC<NistPasswordValidatorProps> = ({
  password,
  onPasswordChange,
  userContext,
  lang = 'FR',
  showHierarchyGuide = true,
}) => {
  const contextName = userContext?.name || '';
  const contextEmail = userContext?.email || '';
  const contextUsername = userContext?.username || '';

  const [copied, setCopied] = useState(false);
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [serverCheckResult, setServerCheckResult] = useState<{
    isPwned?: boolean;
    pwnedCount?: number;
    error?: string;
  } | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const evalResult: NistValidationResult = evaluatePasswordNist(password, {
    name: contextName,
    email: contextEmail,
    username: contextUsername,
  });

  // Debounced server-side HIBP k-anonymity check
  useEffect(() => {
    if (!password || password.length < 8) {
      setServerCheckResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/v1/admin/validate-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password,
            name: contextName,
            email: contextEmail,
            username: contextUsername,
          }),
        });
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          setServerCheckResult({
            isPwned: data.isPwned,
            pwnedCount: data.pwnedCount,
          });
        }
      } catch {
        // Ignore background network errors
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [password, contextName, contextEmail, contextUsername]);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onPasswordChange(text);
      }
    } catch {
      // Clipboard read permission might be denied
    }
  };

  const handleGeneratePassphrase = () => {
    const phrase = generatePassphrase(4, '-');
    onPasswordChange(phrase);
  };

  const handleGenerateRandom = () => {
    const randomPass = generateMachinePassword(24);
    onPasswordChange(randomPass);
  };

  // Entropy color and rating
  const entropy = evalResult.entropyBits;
  const entropyColor =
    entropy >= 60
      ? 'bg-emerald-500 text-emerald-700'
      : entropy >= 40
      ? 'bg-blue-500 text-blue-700'
      : entropy >= 20
      ? 'bg-amber-500 text-amber-700'
      : 'bg-rose-500 text-rose-700';

  const entropyLabel =
    entropy >= 60
      ? lang === 'FR' ? 'Très élevée' : 'Very High'
      : entropy >= 40
      ? lang === 'FR' ? 'Robuste' : 'Strong'
      : entropy >= 20
      ? lang === 'FR' ? 'Moyenne' : 'Moderate'
      : lang === 'FR' ? 'Faible' : 'Weak';

  return (
    <div id="nist-password-validator-container" className="space-y-3 pt-2 text-xs">
      {/* Password Visibility Preview Bar */}
      {password && (
        <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setPreviewVisible(!previewVisible)}
              className="p-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-colors shrink-0 cursor-pointer"
              title={previewVisible ? (lang === 'FR' ? 'Masquer le mot de passe' : 'Hide password') : (lang === 'FR' ? 'Afficher le mot de passe' : 'View password')}
            >
              {previewVisible ? <EyeOff className="w-3.5 h-3.5 text-teal-700" /> : <Eye className="w-3.5 h-3.5 text-slate-600" />}
            </button>
            <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100 truncate select-all">
              {previewVisible ? password : '•'.repeat(Math.min(password.length, 28))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-500 font-medium">
              {previewVisible ? (lang === 'FR' ? 'En clair' : 'Plaintext') : (lang === 'FR' ? 'Masqué' : 'Masked')}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
              title="Copier"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? (lang === 'FR' ? 'Copié' : 'Copied') : (lang === 'FR' ? 'Copier' : 'Copy')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Toolbar: Generation & Password Managers */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            id="btn-generate-passphrase"
            onClick={handleGeneratePassphrase}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors border border-emerald-200/60 dark:border-emerald-800/40 cursor-pointer"
            title="Générer une phrase de passe mémorisable multi-mots (NIST SP 800-63B)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'FR' ? 'Phrase multi-mots (16+ car)' : 'Passphrase (16+ chars)'}</span>
          </button>

          <button
            type="button"
            id="btn-generate-machine-password"
            onClick={handleGenerateRandom}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors border border-blue-200/60 dark:border-blue-800/40 cursor-pointer"
            title="Générer une chaîne aléatoire 24 caractères pour gestionnaire"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{lang === 'FR' ? 'Aléatoire 24 car.' : 'Random 24-char'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {password && (
            <button
              type="button"
              id="btn-copy-password"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300/70 transition-colors cursor-pointer"
              title="Copier le mot de passe"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? (lang === 'FR' ? 'Copié !' : 'Copied!') : (lang === 'FR' ? 'Copier' : 'Copy')}</span>
            </button>
          )}

          <button
            type="button"
            id="btn-paste-password"
            onClick={handlePaste}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300/70 transition-colors cursor-pointer"
            title="Coller depuis le gestionnaire de mots de passe (autorisé par NIST)"
          >
            <ClipboardPaste className="w-3 h-3" />
            <span>{lang === 'FR' ? 'Coller' : 'Paste'}</span>
          </button>
        </div>
      </div>

      {/* NIST Compliance & Entropy Status Bar */}
      {password ? (
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {evalResult.nistCompliant && !serverCheckResult?.isPwned ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>NIST SP 800-63B {lang === 'FR' ? 'Conforme' : 'Compliant'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{lang === 'FR' ? 'Non Conforme NIST' : 'Non-Compliant'}</span>
                </span>
              )}

              <span className="text-slate-500 text-[11px]">
                {evalResult.length} {lang === 'FR' ? 'caractères' : 'chars'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">
                {lang === 'FR' ? 'Entropie' : 'Entropy'}:
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                ~{entropy} bits ({entropyLabel})
              </span>
            </div>
          </div>

          {/* Entropy progress bar */}
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${entropyColor.split(' ')[0]}`}
              style={{ width: `${Math.min(100, Math.max(10, (entropy / 80) * 100))}%` }}
            />
          </div>

          {/* Breached Check Alert (HIBP k-anonymity) */}
          {serverCheckResult?.isPwned && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900/60 text-[11px]">
              <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {lang === 'FR' ? 'Mot de passe compromis détecté' : 'Compromised Password Detected'}
                </p>
                <p>
                  {lang === 'FR'
                    ? `Apparaît dans ${serverCheckResult.pwnedCount?.toLocaleString()} fuites de données connues (Have I Been Pwned). Choisissez une phrase unique.`
                    : `Found in ${serverCheckResult.pwnedCount?.toLocaleString()} known data breaches. Choose a unique passphrase.`}
                </p>
              </div>
            </div>
          )}

          {/* Errors list */}
          {evalResult.errors.length > 0 && (
            <div className="space-y-1 text-rose-600 dark:text-rose-400 text-[11px]">
              {evalResult.errors.map((err, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          {/* Warnings and positive guidance */}
          {evalResult.warnings.length > 0 && evalResult.errors.length === 0 && (
            <div className="space-y-1 text-amber-600 dark:text-amber-400 text-[11px]">
              {evalResult.warnings.map((warn, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}

          {evalResult.feedback.length > 0 && evalResult.errors.length === 0 && (
            <div className="space-y-1 text-emerald-600 dark:text-emerald-400 text-[11px]">
              {evalResult.feedback.map((msg, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] leading-relaxed">
          <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
            {lang === 'FR' ? 'Normes NIST SP 800-63B appliquées :' : 'Applied NIST SP 800-63B Standards:'}
          </p>
          <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
            <li>{lang === 'FR' ? 'Longueur minimale de 8 car. (15+ car. ou phrase recommandée)' : 'Minimum 8 chars (15+ chars or passphrase recommended)'}</li>
            <li>{lang === 'FR' ? 'Pas de règles arbitraires (majuscule, chiffre, symbole non imposés)' : 'No arbitrary composition puzzles (no forced symbols/digits)'}</li>
            <li>{lang === 'FR' ? 'Gestionnaires de mots de passe & collage expressément autorisés' : 'Password managers & copy-pasting explicitly welcomed'}</li>
            <li>{lang === 'FR' ? 'Filtrage anti-fuites (Have I Been Pwned) et anti-identifiants' : 'Breach screening (HIBP k-anonymity) & context filtering'}</li>
          </ul>
        </div>
      )}

      {/* Modern Hierarchy of Authentication Educational Card */}
      {showHierarchyGuide && (
        <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={() => setShowHierarchy(!showHierarchy)}
            className="w-full flex items-center justify-between p-2.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold text-[11px]">
                {lang === 'FR' ? 'Hiérarchie moderne de l’authentification' : 'Modern Authentication Hierarchy'}
              </span>
            </div>
            {showHierarchy ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showHierarchy && (
            <div className="p-3 border-t border-slate-200/70 dark:border-slate-800 space-y-2.5 text-[11px]">
              {/* Tier 1 */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-900/30">
                <Fingerprint className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-purple-900 dark:text-purple-200">
                      Tier 1 : Passkeys / FIDO2 WebAuthn
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-100">
                      OPTIMAL
                    </span>
                  </div>
                  <p className="text-purple-800/80 dark:text-purple-300 text-[10px] mt-0.5">
                    {lang === 'FR'
                      ? 'Clés de sécurité physiques (YubiKey) et biométrie. Cryptographie asymétrique inviolable contre le phishing et les fuites de bases de données.'
                      : 'Hardware security keys (YubiKey) & biometrics. Asymmetric cryptography immune to phishing and server breaches.'}
                  </p>
                </div>
              </div>

              {/* Tier 2 */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">
                      Tier 2 : {lang === 'FR' ? 'Phrase de passe (16+ car) + 2FA' : 'Passphrase (16+ chars) + MFA'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                      ÉLEVÉ
                    </span>
                  </div>
                  <p className="text-emerald-800/80 dark:text-emerald-300 text-[10px] mt-0.5">
                    {lang === 'FR'
                      ? 'Plusieurs mots sans rapport (ex: "cobalt-lantern-summit-orchard"), mémorisables et haute entropie, secondés par un 2FA.'
                      : 'Multiple random words offering high dictionary entropy, memorability, and paired with second-factor authentication.'}
                  </p>
                </div>
              </div>

              {/* Tier 3 */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/30">
                <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-blue-900 dark:text-blue-200">
                      Tier 3 : {lang === 'FR' ? 'Chaîne aléatoire de gestionnaire' : 'Password Manager Random Strings'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100">
                      STANDARD
                    </span>
                  </div>
                  <p className="text-blue-800/80 dark:text-blue-300 text-[10px] mt-0.5">
                    {lang === 'FR'
                      ? '16 à 32 caractères pseudo-aléatoires générés et enregistrés dans Bitwarden, 1Password ou Apple Keychain.'
                      : '16–32 character pseudorandom strings stored in a trusted password manager.'}
                  </p>
                </div>
              </div>

              {/* Banned */}
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/30">
                <Ban className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-rose-900 dark:text-rose-200">
                      {lang === 'FR' ? 'Pratiques obsolètes proscrites par le NIST' : 'Banned Obsolete Practices (NIST)'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-200 text-rose-900 dark:bg-rose-800 dark:text-rose-100">
                      PROSCRIT
                    </span>
                  </div>
                  <p className="text-rose-800/80 dark:text-rose-300 text-[10px] mt-0.5">
                    {lang === 'FR'
                      ? 'Expirations forcées tous les 90 jours (incitent à des variations triviales comme Printemps2025!), règles de symboles arbitraires (P@ssword1!), et questions secrètes facilement piratables.'
                      : 'Forced 60/90-day resets driving predictable edits, arbitrary symbol rules (P@ssword1!), and easily spoofed security questions.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
