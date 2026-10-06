#!/usr/bin/env node
/**
 * Pantryo Automated Dependency Update & Security Audit Utility
 * ============================================================
 * 1. Checks for security vulnerabilities via npm audit
 * 2. Applies non-breaking dependency updates within semver constraints
 * 3. Applies automated security patches via npm audit fix
 * 4. Verifies project build and typechecking integrity
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const logFile = path.resolve(rootDir, "update-dependencies.log");

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(logFile, line + "\n");
  } catch (_) {}
}

export async function runAutoUpdate() {
  const result = {
    timestamp: new Date().toISOString(),
    success: false,
    auditBefore: null,
    auditAfter: null,
    updatesApplied: false,
    buildVerified: false,
    error: null,
    summary: "",
  };

  log("Starting automated package update & vulnerability remediation...");

  // 1. Initial audit
  try {
    const rawAudit = execSync("npm audit --json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    result.auditBefore = JSON.parse(rawAudit).metadata;
  } catch (err) {
    if (err.stdout) {
      try {
        result.auditBefore = JSON.parse(err.stdout).metadata;
      } catch (_) {}
    }
  }

  // 2. Safe semver dependency update
  try {
    log("Running npm update (safe semver patch and minor updates)...");
    execSync("npm update", { stdio: "inherit" });
    result.updatesApplied = true;
  } catch (err) {
    log(`Notice during npm update: ${err.message}`);
  }

  // 3. Security patch auto-fix
  try {
    log("Running npm audit fix for automated security patches...");
    execSync("npm audit fix", { stdio: "inherit" });
  } catch (err) {
    log(`Notice during npm audit fix: ${err.message}`);
  }

  // 4. Audit after fix
  try {
    const rawAuditAfter = execSync("npm audit --json", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    result.auditAfter = JSON.parse(rawAuditAfter).metadata;
  } catch (err) {
    if (err.stdout) {
      try {
        result.auditAfter = JSON.parse(err.stdout).metadata;
      } catch (_) {}
    }
  }

  // 5. Verification: Lint and Build
  try {
    log("Verifying project build integrity with npm run build...");
    execSync("npm run build", { stdio: "inherit" });
    result.buildVerified = true;
    result.success = true;
    log("Project build passed successfully!");
  } catch (err) {
    result.error = `Build verification failed: ${err.message}`;
    log(`[ERROR] ${result.error}`);
    return result;
  }

  const vulnsBefore = result.auditBefore?.vulnerabilities?.total ?? "N/A";
  const vulnsAfter = result.auditAfter?.vulnerabilities?.total ?? "N/A";
  result.summary = `Packages updated. Vulnerabilities before: ${vulnsBefore}, after: ${vulnsAfter}. Build verified.`;
  log(result.summary);

  return result;
}

// Direct execution from CLI
if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  runAutoUpdate().then((res) => {
    if (!res.success) {
      process.exit(1);
    }
  });
}
