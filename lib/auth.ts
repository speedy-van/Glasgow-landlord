import { betterAuth } from "better-auth";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { headers } from "next/headers";
import { cache } from "react";
import { authOptions } from "./auth-options";
import {
  config,
  siteOrigin,
  authenticationConfigured,
  administratorEmails,
} from "./config";
import { ApiError } from "./server-store";

neonConfig.webSocketConstructor = WebSocket;
neonConfig.poolQueryViaFetch = true;
function createAuth() {
  const env = config();
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
  });
  pool.on("error", () =>
    console.error("Administrator database connection failed"),
  );
  return betterAuth(
    authOptions({
      database: pool,
      secret: env.BETTER_AUTH_SECRET!,
      origin: siteOrigin(),
      administrators: administratorEmails(),
    }),
  );
}
let instance: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  if (!authenticationConfigured())
    throw new ApiError(
      503,
      "Administration is temporarily unavailable. Please try again later.",
    );
  return (instance ??= createAuth());
}

export const getAdminSession = cache(async () => {
  if (!authenticationConfigured()) return null;
  return getAuth().api.getSession({ headers: await headers() });
});
