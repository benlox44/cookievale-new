function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function requireEnvNumber(key: string): number {
  const value = Number(requireEnv(key));
  if (!Number.isInteger(value)) {
    throw new Error(`Environment variable ${key} must be an integer`);
  }
  return value;
}

export interface Config {
  port: number;
  databaseUrl: string;
  secretKey: string;
  adminPassword: string;
  baseUrl: string;
  trustedProxyHosts: string[];
  containerMediaPath: string;
  telegramBotToken: string;
  telegramChatId: string;
  nodeEnv: string;
  timeZone: string;
}

export function loadConfig(): Config {
  const port = requireEnvNumber("PORT");
  if (port < 1 || port > 65535) {
    throw new Error("PORT must be between 1 and 65535");
  }

  return {
    port,
    databaseUrl: requireEnv("DATABASE_URL"),
    secretKey: requireEnv("SECRET_KEY"),
    adminPassword: requireEnv("ADMIN_PASSWORD"),
    baseUrl: requireEnv("BASE_URL"),
    trustedProxyHosts: requireEnv("TRUSTED_PROXY_HOSTS")
      .split(",")
      .map((host) => host.trim())
      .filter((host) => host.length > 0),
    containerMediaPath: requireEnv("CONTAINER_MEDIA_PATH"),
    telegramBotToken: requireEnv("TELEGRAM_BOT_TOKEN"),
    telegramChatId: requireEnv("TELEGRAM_CHAT_ID"),
    nodeEnv: requireEnv("NODE_ENV"),
    timeZone: requireEnv("TZ"),
  };
}
