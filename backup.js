const { execFile } = require("node:child_process");
const {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} = require("node:fs");
const { join } = require("node:path");
const { promisify } = require("node:util");
const { gzipSync, gunzipSync } = require("node:zlib");

const execFileAsync = promisify(execFile);

const BACKUP_RETENTION = 7;
const LOG_FILE = join(__dirname, "backup.log");
const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}_\d{6}$/;

function log(...args) {
  const line = `[${new Date().toISOString().replace("T", " ").slice(0, 19)}] ${args.join(" ")}`;
  process.stdout.write(`${line}\n`);
  appendFileSync(LOG_FILE, `${line}\n`);
}

function requireEnv(key) {
  const value = process.env[key];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function formatSize(bytes) {
  const units = ["B", "K", "M", "G", "T"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${Math.round(size * 10) / 10}${units[unit]}`;
}

function dirSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(full);
    } else {
      total += statSync(full).size;
    }
  }
  return total;
}

function timestampNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `_${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
  );
}

function verifyBackupDestination(dest) {
  if (!existsSync(dest)) {
    log(`[ERROR] Backup destination ${dest} is not available. No backup was created.`);
    return false;
  }
  const probe = join(dest, ".backup_probe");
  try {
    writeFileSync(probe, "ok");
    rmSync(probe, { force: true });
  } catch (error) {
    log(`[ERROR] Backup destination ${dest} is not writable: ${error.message}. No backup was created.`);
    return false;
  }
  return true;
}

async function main() {
  log("=== CookieVale Backup Started ===");

  const dbUser = requireEnv("POSTGRES_USER");
  const dbName = requireEnv("POSTGRES_DB");
  const dbPassword = requireEnv("POSTGRES_PASSWORD");
  const dest = requireEnv("CONTAINER_BACKUP_PATH");
  const mediaRoot = requireEnv("CONTAINER_MEDIA_PATH");

  if (!verifyBackupDestination(dest)) {
    process.exit(1);
  }
  mkdirSync(dest, { recursive: true });

  const backupDir = join(dest, timestampNow());
  const configDir = join(backupDir, "config");
  const mediaDir = join(backupDir, "media");
  mkdirSync(configDir, { recursive: true });
  mkdirSync(mediaDir, { recursive: true });

  log(`[*] Destination: ${backupDir}`);

  // ---- Database dump (compressed) ----
  log("[*] Exporting database...");
  const dumpPath = join(configDir, "cookievale_db_dump.sql.gz");
  try {
    const { stdout } = await execFileAsync(
      "pg_dump",
      ["-h", "db", "-U", dbUser, "-d", dbName],
      {
        env: { ...process.env, PGPASSWORD: dbPassword },
        maxBuffer: 1024 * 1024 * 1024,
        timeout: 300_000,
      },
    );
    writeFileSync(dumpPath, gzipSync(Buffer.from(stdout)));
    log(`[OK] Database dump: ${formatSize(statSync(dumpPath).size)}`);
  } catch (error) {
    log(`[ERROR] pg_dump failed: ${error.message}`);
    rmSync(backupDir, { recursive: true, force: true });
    process.exit(1);
  }

  // ---- Verify dump ----
  if (statSync(dumpPath).size === 0) {
    log("[ERROR] Database dump is empty (0 bytes)");
    rmSync(backupDir, { recursive: true, force: true });
    process.exit(1);
  }
  try {
    gunzipSync(readFileSync(dumpPath));
  } catch (error) {
    log(`[ERROR] Database dump corrupted: ${error.message}`);
    rmSync(backupDir, { recursive: true, force: true });
    process.exit(1);
  }
  log("[OK] Dump integrity verified");

  // ---- Copy .env (LF only) ----
  log("[*] Copying .env...");
  const envSrc = join(__dirname, ".env");
  writeFileSync(join(configDir, ".env"), readFileSync(envSrc, "utf8").replace(/\r\n/g, "\n"));

  // ---- Media sync ----
  if (!existsSync(mediaRoot)) {
    log(`[WARNING] CONTAINER_MEDIA_PATH (${mediaRoot}) does not exist, skipping`);
  } else {
    log(`[*] Syncing media from ${mediaRoot}...`);
    rmSync(mediaDir, { recursive: true, force: true });
    cpSync(mediaRoot, mediaDir, { recursive: true });
    log(`[OK] Media synced: ${formatSize(dirSize(mediaDir))}`);
  }

  // ---- Rotate old backups ----
  log(`[*] Cleaning old backups (keeping last ${BACKUP_RETENTION})...`);
  const backupDirs = readdirSync(dest, { withFileTypes: true })
    .filter((e) => e.isDirectory() && TIMESTAMP_RE.test(e.name))
    .map((e) => join(dest, e.name))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  for (const oldDir of backupDirs.slice(BACKUP_RETENTION)) {
    log(`  Removing: ${oldDir}`);
    rmSync(oldDir, { recursive: true, force: true });
  }

  // ---- Summary ----
  const totalSize = formatSize(dirSize(backupDir));
  const remaining = Math.min(backupDirs.length, BACKUP_RETENTION);
  log(`=== Backup Completed Successfully === (${totalSize}, ${remaining}/${BACKUP_RETENTION} backups stored)`);
}

main().catch((error) => {
  log(`[ERROR] ${error.message}`);
  process.exit(1);
});
