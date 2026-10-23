export function config() {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    BLOB_STORE_ID: process.env.BLOB_STORE_ID,
  };
}

export function siteOrigin() {
  const configured = config().BETTER_AUTH_URL;
  const vercelHost =
    process.env.VERCEL_ENV === "production"
      ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)
      : process.env.VERCEL_URL;
  return new URL(
    configured ||
      (vercelHost ? `https://${vercelHost}` : "http://localhost:3000"),
  ).origin;
}

export function administratorEmails(value = config().ADMIN_EMAILS) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function authenticationConfigured() {
  const env = config();
  return Boolean(
    env.DATABASE_URL &&
    env.BETTER_AUTH_SECRET &&
    env.BETTER_AUTH_SECRET.length >= 32 &&
    administratorEmails().length,
  );
}

export function mediaConfigured() {
  const env = config();
  return Boolean(
    env.BLOB_READ_WRITE_TOKEN ||
    (env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
  );
}
