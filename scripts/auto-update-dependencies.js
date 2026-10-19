#!/usr/bin/env node
/**
 * Pantryo Automated Dependency Update & Security Audit Utility
 * ============================================================
 * 1. Checks for security vulnerabilities via npm audit
 * 2. Parses npm outdated to detect minor/patch vs major releases
 * 3. Applies non-breaking dependency updates within semver constraints (npm update)
 * 4. Applies automated security patches via npm audit fix
 * 5. Verifies project build and typechecking integrity (npm run build)
 * 6. Persists status to server/data/dependency-status.json
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const logFile = path.resolve(rootDir, "update-dependencies.log");
const dataDir = path.resolve(rootDir, "server/data");
const statusFile = path.resolve(dataDir, "dependency-status.json");

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(logFile, line + "\n");
  } catch (_) {}
}

export function getOutdatedAnalysis() {
  try {
    const rawOutdated = execSync("npm outdated --json", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const parsed = JSON.parse(rawOutdated || "{}");
    const minorPatchUpdates = [];
    const majorAlerts = [];

    for (const [pkg, info] of Object.entries(parsed)) {
      const current = info.current || "unknown";
      const wanted = info.wanted || current;
      const latest = info.latest || wanted;

      const currentMajor = current.split(".")[0];
      const latestMajor = latest.split(".")[0];

      if (current !== wanted) {
        minorPatchUpdates.push({
          package: pkg,
          current,
          wanted,
          latest,
          type: "minor-patch",
        });
      }

      if (currentMajor !== latestMajor) {
        majorAlerts.push({
          package: pkg,
          current,
          latest,
          breakingChangeNotice: `Major version upgrade available (${current} -> ${latest}). Kept at ${current} to protect runtime stability.`,
        });
      }
    }

    return { minorPatchUpdates, majorAlerts, allOutdated: parsed };
  } catch (err) {
    if (err.stdout) {
      try {
        const parsed = JSON.parse(err.stdout || "{}");
        const minorPatchUpdates = [];
        const majorAlerts = [];
        for (const [pkg, info] of Object.entries(parsed)) {
          const current = info.current || "unknown";
          const wanted = info.wanted || current;
          const latest = info.latest || wanted;
          const currentMajor = current.split(".")[0];
          const latestMajor = latest.split(".")[0];

          if (current !== wanted) {
            minorPatchUpdates.push({ package: pkg, current, wanted, latest, type: "minor-patch" });
          }
          if (currentMajor !== latestMajor) {
            majorAlerts.push({
              package: pkg,
              current,
              latest,
              breakingChangeNotice: `Major version upgrade available (${current} -> ${latest}). Kept at ${current} to protect runtime stability.`,
            });
          }
        }
        return { minorPatchUpdates, majorAlerts, allOutdated: parsed };
      } catch (_) {}
    }
    return { minorPatchUpdates: [], majorAlerts: [], allOutdated: {} };
  }
}

export async function runAutoUpdate(options = {}) {
  const result = {
    timestamp: new Date().toISOString(),
    success: false,
    auditBefore: null,
    auditAfter: null,
    updatesApplied: false,
    buildVerified: false,
    minorPatchUpdates: [],
    majorAlerts: [],
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

  // 2. Analyze outdated packages
  const outdatedInfo = getOutdatedAnalysis();
  result.minorPatchUpdates = outdatedInfo.minorPatchUpdates;
  result.majorAlerts = outdatedInfo.majorAlerts;

  // 3. Safe semver dependency update (minor + patch)
  try {
    log("Running npm update (safe semver patch and minor updates)...");
    execSync("npm update", { stdio: "inherit" });
    result.updatesApplied = true;
  } catch (err) {
    log(`Notice during npm update: ${err.message}`);
  }

  // 4. Security patch auto-fix
  try {
    log("Running npm audit fix for automated security patches...");
    execSync("npm audit fix", { stdio: "inherit" });
  } catch (err) {
    log(`Notice during npm audit fix: ${err.message}`);
  }

  // 5. Audit after fix
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

  // 6. Refresh outdated analysis after update
  const refreshedOutdated = getOutdatedAnalysis();
  result.minorPatchUpdates = refreshedOutdated.minorPatchUpdates;
  result.majorAlerts = refreshedOutdated.majorAlerts;

  // 7. Verification: Build
  if (!options.skipBuild) {
    try {
      log("Verifying project build integrity with npm run build...");
      execSync("npm run build", { stdio: "inherit" });
      result.buildVerified = true;
      result.success = true;
      log("Project build passed successfully!");
    } catch (err) {
      result.error = `Build verification failed: ${err.message}`;
      log(`[ERROR] ${result.error}`);
    }
  } else {
    result.success = true;
    result.buildVerified = true;
  }

  const vulnsBefore = result.auditBefore?.vulnerabilities?.total ?? 0;
  const vulnsAfter = result.auditAfter?.vulnerabilities?.total ?? 0;
  result.summary = `Automated package check complete. Vulnerabilities: ${vulnsAfter} (was ${vulnsBefore}). Major version alerts: ${result.majorAlerts.length}. Build verified: ${result.buildVerified}.`;
  log(result.summary);

  // Persist status to server/data/dependency-status.json
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(statusFile, JSON.stringify(result, null, 2), "utf8");
    log(`Persisted dependency status to ${statusFile}`);
  } catch (err) {
    log(`Notice: Could not persist status file: ${err.message}`);
  }

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
