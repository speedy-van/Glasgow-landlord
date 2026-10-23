export function hasTrustedOrigin(
  request: Pick<Request, "headers">,
  trustedOrigin: string,
) {
  // Next can expose its internal bind address in request.url. Use the same
  // canonical public origin as authentication, never forwarded browser headers.
  return (
    request.headers.get("origin") === trustedOrigin &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}
