import type { BetterAuthOptions } from "better-auth";

export function authOptions({
  database,
  secret,
  origin,
  administrators,
  allowRegistration = false,
}: {
  database: BetterAuthOptions["database"];
  secret: string;
  origin: string;
  administrators: string[];
  allowRegistration?: boolean;
}) {
  const allowed = new Set(
    administrators.map((email) => email.trim().toLowerCase()),
  );
  return {
    database,
    secret,
    baseURL: origin,
    trustedOrigins: [origin],
    emailAndPassword: {
      enabled: true,
      disableSignUp: !allowRegistration,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: false,
    },
    user: { modelName: "admin_users" },
    account: { modelName: "admin_accounts" },
    verification: { modelName: "admin_verifications" },
    session: {
      modelName: "admin_sessions",
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 15,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      modelName: "admin_rate_limits",
      window: 60,
      max: 30,
      customRules: { "/sign-in/email": { window: 60, max: 5 } },
    },
    advanced: {
      useSecureCookies: origin.startsWith("https:"),
      ipAddress: {
        ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"],
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!allowed.has(user.email.toLowerCase())) return false;
            return { data: user };
          },
        },
      },
    },
  } satisfies BetterAuthOptions;
}
