export const AUTH_CONFIG = Symbol("AUTH_CONFIG");

export interface AuthConfig {
  adminPassword: string;
  secretKey: string;
}