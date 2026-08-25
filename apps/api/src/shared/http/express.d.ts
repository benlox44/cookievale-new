declare module "express" {
  export interface Request {
    headers: {
      cookie?: string;
      "x-forwarded-for"?: string;
      "x-forwarded-proto"?: string;
    };
  }

  export interface Response {
    status(code: number): Response;
    json(body: unknown): Response;
    cookie(name: string, value: string, options: CookieOptions): Response;
    clearCookie(name: string): Response;
  }

  export interface CookieOptions {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    maxAge?: number;
  }
}
