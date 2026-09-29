// Where the site lives, for absolute URLs in link previews. Not a secret.
// Vercel sets these automatically: the production domain, or the unique URL of a preview deployment.

export const SITE_NAME = "Sarjy";

export function siteUrl(): URL {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return new URL(host ? `https://${host}` : "http://localhost:3000");
}
