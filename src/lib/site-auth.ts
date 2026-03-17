import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

export const AUTH_COOKIE_NAME = "idxslotbotchecker_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const SESSION_NONCE_BYTES = 16;

function getSitePassword() {
  return process.env.SITE_PASSWORD;
}

function getSessionSecret() {
  return process.env.SITE_SESSION_SECRET;
}

export function getAuthConfigurationError() {
  const password = getSitePassword();
  if (!password) {
    return "SITE_PASSWORD is not configured.";
  }

  const sessionSecret = getSessionSecret();
  if (!sessionSecret) {
    return "SITE_SESSION_SECRET is not configured.";
  }

  if (sessionSecret.length < 32) {
    return "SITE_SESSION_SECRET must be at least 32 characters.";
  }

  return null;
}

function digestValue(value: string) {
  return createHash("sha256").update(value).digest();
}

function signPayload(payload: string) {
  const secret = getSessionSecret();
  const password = getSitePassword();
  if (!secret || !password) {
    throw new Error("Site auth is not configured.");
  }

  const signingKey = createHash("sha256").update(`${secret}:${password}`).digest();
  return createHmac("sha256", signingKey).update(payload).digest("base64url");
}

export function isPasswordValid(password: string) {
  const configuredPassword = getSitePassword();
  if (!configuredPassword) {
    return false;
  }

  const providedDigest = digestValue(password);
  const configuredDigest = digestValue(configuredPassword);
  return timingSafeEqual(providedDigest, configuredDigest);
}

export function hasValidSessionCookieValue(cookieValue: string | null | undefined) {
  if (!cookieValue) {
    return false;
  }

  try {
    const parts = cookieValue.split(".");
    if (parts.length !== 3) {
      return false;
    }

    const [expiresAtRaw, nonce, signature] = parts;
    if (!/^\d+$/.test(expiresAtRaw) || !/^[a-f0-9]+$/i.test(nonce) || !signature) {
      return false;
    }

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return false;
    }

    const expectedSignature = signPayload(`${expiresAtRaw}.${nonce}`);
    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export function createSessionCookie() {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const nonce = randomBytes(SESSION_NONCE_BYTES).toString("hex");
  const payload = `${expiresAt}.${nonce}`;
  const signature = signPayload(payload);

  return {
    name: AUTH_COOKIE_NAME,
    value: `${payload}.${signature}`,
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    priority: "high" as const,
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function createClearedSessionCookie() {
  return {
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    priority: "high" as const,
    maxAge: 0,
  };
}
