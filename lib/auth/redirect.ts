import { DEFAULT_AUTH_REDIRECT } from "@/lib/auth/constants";

const AUTH_ROUTES = new Set(["/login", "/register"]);

/**
 * Accepts only same-origin path redirects. This prevents auth forms from
 * becoming open redirect endpoints when they receive a `next` query value.
 */
export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback = DEFAULT_AUTH_REDIRECT,
): string {
  if (
    !value ||
    value.length > 2_048 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }

  try {
    const url = new URL(value, "https://proai.local");

    if (url.origin !== "https://proai.local" || AUTH_ROUTES.has(url.pathname)) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function getAuthHref(
  route: "/login" | "/register",
  redirectTo: string,
): string {
  const safeRedirect = getSafeRedirectPath(redirectTo);

  if (safeRedirect === DEFAULT_AUTH_REDIRECT) {
    return route;
  }

  return `${route}?next=${encodeURIComponent(safeRedirect)}`;
}

