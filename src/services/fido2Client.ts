import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import { User, Fido2CredentialInfo, Fido2PolicyInfo } from "../types";
import { isAppInstalledOrStandalone, canUseSandboxBypass } from "../utils/installStatus";

export interface Fido2Status {
  fido2Enabled: boolean;
  fido2Enforced: boolean;
  allUsersRequired?: boolean;
  isCompliant?: boolean;
  requiresEnrollment?: boolean;
  totpEnabled?: boolean;
  credentialsCount: number;
  credentials: Fido2CredentialInfo[];
  recoveryCodesRemaining: number;
}

export interface RegistrationResult {
  success: boolean;
  verified: boolean;
  credential?: Fido2CredentialInfo;
  recoveryCodes?: string[] | null;
  message?: string;
  error?: string;
}

export interface AuthenticationResult {
  success: boolean;
  verified: boolean;
  user?: User;
  token?: string;
  remainingCodes?: number;
  message?: string;
  error?: string;
}

export const fido2Client = {
  /**
   * Checks browser and environment support for WebAuthn
   */
  async checkSupport(): Promise<{
    supported: boolean;
    platformAuthenticator: boolean;
    isIframe: boolean;
    isInstalled: boolean;
  }> {
    const supported = browserSupportsWebAuthn();
    let platformAuth = false;
    if (supported) {
      try {
        platformAuth = await platformAuthenticatorIsAvailable();
      } catch {
        platformAuth = false;
      }
    }
    const isInstalled = isAppInstalledOrStandalone();
    const isIframe = canUseSandboxBypass();
    return {
      supported,
      platformAuthenticator: platformAuth,
      isIframe,
      isInstalled,
    };
  },

  /**
   * Get enrolled FIDO2 credentials and 2FA status for a user
   */
  async getStatus(userId: string): Promise<Fido2Status> {
    const res = await fetch(`/api/v1/auth/fido2/status/${encodeURIComponent(userId)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch FIDO2 status: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * Complete standard FIDO2 WebAuthn Registration (Enroll Key / Passkey)
   */
  async registerKey(
    userId: string,
    friendlyName: string = "Hardware Key"
  ): Promise<RegistrationResult> {
    // 1. Get options from server
    const optRes = await fetch("/api/v1/auth/fido2/register-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!optRes.ok) {
      const err = await optRes.json();
      throw new Error(err.error || "Failed to generate registration options");
    }

    const options = await optRes.json();

    // 2. Trigger browser authenticator (YubiKey / Touch ID / Windows Hello)
    let attResp;
    try {
      attResp = await startRegistration({ optionsJSON: options });
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        throw new Error(
          "L'opération a été annulée ou la vérification biométrique/clé a expiré."
        );
      }
      throw new Error(`WebAuthn registration error: ${err.message}`);
    }

    // 3. Send response to server for cryptographic verification
    const verifyRes = await fetch("/api/v1/auth/fido2/register-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        response: attResp,
        friendlyName,
      }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json();
      throw new Error(err.error || "Failed to verify registration on server");
    }

    return verifyRes.json();
  },

  /**
   * Complete standard FIDO2 WebAuthn Authentication (2FA Challenge)
   */
  async authenticateKey(userIdOrUsername: string): Promise<AuthenticationResult> {
    // 1. Get auth options from server
    const optRes = await fetch("/api/v1/auth/fido2/auth-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userIdOrUsername }),
    });

    if (!optRes.ok) {
      const err = await optRes.json();
      throw new Error(err.error || "Failed to generate authentication challenge");
    }

    const options = await optRes.json();

    // 2. Trigger browser authenticator
    let asseResp;
    try {
      asseResp = await startAuthentication({ optionsJSON: options });
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        throw new Error(
          "Vérification annulée ou délai dépassé sur la clé de sécurité."
        );
      }
      throw new Error(`WebAuthn authentication error: ${err.message}`);
    }

    // 3. Send signature to server to verify
    const verifyRes = await fetch("/api/v1/auth/fido2/auth-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userIdOrUsername,
        response: asseResp,
      }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.json();
      throw new Error(err.error || "Failed to verify security key signature");
    }

    return verifyRes.json();
  },

  /**
   * Verify using a single-use emergency recovery code
   */
  async verifyRecoveryCode(
    userIdOrUsername: string,
    code: string
  ): Promise<AuthenticationResult> {
    const res = await fetch("/api/v1/auth/fido2/verify-recovery-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: userIdOrUsername,
        code,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Invalid recovery code");
    }

    return res.json();
  },

  /**
   * Virtual Enrollment for instant testing in sandboxed iframe environments
   */
  async simulateEnroll(
    userId: string,
    friendlyName: string = "Virtual FIDO2 Security Token"
  ): Promise<RegistrationResult> {
    if (isAppInstalledOrStandalone()) {
      throw new Error(
        "Virtual/sandbox bypass is strictly forbidden in installed application mode. Physical hardware Passkey or 6-digit TOTP code is required."
      );
    }

    const res = await fetch("/api/v1/auth/fido2/simulate-enroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pwa-standalone": isAppInstalledOrStandalone() ? "true" : "false",
      },
      body: JSON.stringify({ userId, friendlyName }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to enroll virtual security token");
    }

    return res.json();
  },

  /**
   * Virtual Verification for testing in sandboxed iframe environments
   */
  async simulateAuthenticate(
    userIdOrUsername: string,
    credentialId: string
  ): Promise<AuthenticationResult> {
    if (isAppInstalledOrStandalone()) {
      throw new Error(
        "Virtual/sandbox bypass is strictly forbidden in installed application mode. Physical hardware Passkey or 6-digit TOTP code is required."
      );
    }

    const res = await fetch("/api/v1/auth/fido2/auth-verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pwa-standalone": isAppInstalledOrStandalone() ? "true" : "false",
      },
      body: JSON.stringify({
        userId: userIdOrUsername,
        response: { id: credentialId },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to verify virtual token");
    }

    return res.json();
  },

  /**
   * Delete an enrolled credential
   */
  async deleteCredential(userId: string, credentialId: string): Promise<boolean> {
    const encodedId = encodeURIComponent(credentialId);
    const encodedUserId = encodeURIComponent(userId);
    try {
      const res = await fetch(
        `/api/v1/auth/fido2/credentials/${encodedId}?userId=${encodedUserId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({ userId, credentialId }),
        }
      );

      if (res.ok) {
        return true;
      }
    } catch {
      // If DELETE failed over network or proxy, try POST fallback
    }

    // POST Fallback for restrictive proxies / iframes
    const fallbackRes = await fetch("/api/v1/auth/fido2/delete-credential", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ userId, credentialId }),
    });

    if (!fallbackRes.ok) {
      const err = await fallbackRes.json().catch(() => ({}));
      throw new Error(err.error || "Failed to delete credential");
    }

    return true;
  },

  /**
   * Delete all enrolled credentials (full 2FA reset)
   */
  async deleteAllCredentials(userId: string): Promise<boolean> {
    const encodedUserId = encodeURIComponent(userId);
    try {
      const res = await fetch(
        `/api/v1/auth/fido2/credentials/all?userId=${encodedUserId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({ userId, credentialId: "all" }),
        }
      );

      if (res.ok) {
        return true;
      }
    } catch {
      // fallback
    }

    const fallbackRes = await fetch("/api/v1/auth/fido2/delete-credential", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ userId, credentialId: "all" }),
    });

    if (!fallbackRes.ok) {
      const err = await fallbackRes.json().catch(() => ({}));
      throw new Error(err.error || "Failed to remove all credentials");
    }

    return true;
  },

  /**
   * Generate 8 new emergency recovery codes
   */
  async regenerateRecoveryCodes(userId: string): Promise<string[]> {
    const res = await fetch("/api/v1/auth/fido2/recovery-codes/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to regenerate recovery codes");
    }

    const data = await res.json();
    return data.recoveryCodes || [];
  },

  /**
   * Toggle 2FA enforcement for Admin operations
   */
  async toggleEnforcement(userId: string, enforced: boolean): Promise<boolean> {
    const res = await fetch("/api/v1/auth/fido2/toggle-enforcement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, enforced }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update enforcement settings");
    }

    const data = await res.json();
    return data.fido2Enforced;
  },

  /**
   * Get global FIDO2 security policy
   */
  async getGlobalPolicy(): Promise<Fido2PolicyInfo> {
    const res = await fetch("/api/v1/auth/fido2/policy");
    if (!res.ok) {
      throw new Error("Failed to fetch FIDO2 security policy");
    }
    return res.json();
  },

  /**
   * Toggle or enforce global FIDO2 policy for all household members
   */
  async toggleGlobalEnforcement(enforced: boolean = true): Promise<{ success: boolean; allUsersRequired: boolean }> {
    const res = await fetch("/api/v1/auth/fido2/toggle-enforcement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allUsers: true, enforced }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update global FIDO2 policy");
    }
    return res.json();
  },

  registerHardwareKey(userId: string, friendlyName?: string): Promise<RegistrationResult> {
    return this.registerKey(userId, friendlyName);
  },

  authenticateHardwareKey(userIdOrUsername: string): Promise<AuthenticationResult> {
    return this.authenticateKey(userIdOrUsername);
  },

  /**
   * Request a new 6-digit TOTP secret and setup details
   */
  async setupTotp(userId: string): Promise<{
    success: boolean;
    secret: string;
    otpAuthUri: string;
    message?: string;
  }> {
    const res = await fetch("/api/v1/auth/fido2/totp/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to initialize 2nd factor setup");
    }
    return res.json();
  },

  /**
   * Confirm and activate 6-digit TOTP 2FA
   */
  async confirmTotp(
    userId: string,
    secret: string,
    code: string
  ): Promise<RegistrationResult> {
    const res = await fetch("/api/v1/auth/fido2/totp/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, secret, code }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Invalid 6-digit verification code");
    }
    return res.json();
  },

  /**
   * Verify a 6-digit TOTP code during login
   */
  async verifyTotp(
    userIdOrUsername: string,
    code: string
  ): Promise<AuthenticationResult> {
    const res = await fetch("/api/v1/auth/fido2/totp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userIdOrUsername, code }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Invalid 6-digit code");
    }
    return res.json();
  },
};
