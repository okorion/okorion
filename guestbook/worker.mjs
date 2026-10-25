import { objects } from "../scripts/gallery/catalog.mjs";
import { validSubmission, uuidPattern } from "./validation.mjs";
const lifetimeMs = 72 * 60 * 60 * 1000;
const cookieName = "guestbook_visitor";
const encoder = new TextEncoder();
const response = (body, status = 200, extra = {}) => Response.json(body, {
  status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...extra },
});
const message = (text, status) => response({ error: text }, status);
const local = (env) => env.ENVIRONMENT === "local";
const key = (env) => crypto.subtle.importKey("raw", encoder.encode(env.COOKIE_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
const base64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
async function visitor(request, env) {
  const value = request.headers.get("Cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (!value || value.length > 100) return null;
  const [id, signature] = value.split(".");
  if (!uuidPattern.test(id) || !/^[A-Za-z0-9_-]{43}$/.test(signature || "")) return null;
  try {
    const bytes = Uint8Array.from(atob(signature.replaceAll("-", "+").replaceAll("_", "/") + "="), (character) => character.charCodeAt(0));
    return await crypto.subtle.verify("HMAC", await key(env), bytes, encoder.encode(`guestbook:${id}`)) ? id : null;
  } catch { return null; }
}
async function cookie(id, env) {
  const signature = base64url(await crypto.subtle.sign("HMAC", await key(env), encoder.encode(`guestbook:${id}`)));
  return `${cookieName}=${id}.${signature}; HttpOnly; SameSite=Strict; Path=/; Max-Age=259200${local(env) ? "" : "; Secure"}`;
}
function configured(env) {
  return typeof env.COOKIE_SECRET === "string" && env.COOKIE_SECRET.length >= 32 &&
    typeof env.TURNSTILE_SITE_KEY === "string" && env.TURNSTILE_SITE_KEY.length > 5 &&
    typeof env.TURNSTILE_SECRET_KEY === "string" && env.TURNSTILE_SECRET_KEY.length > 20 &&
    (local(env) || !env.TURNSTILE_SITE_KEY.startsWith("1x000000"));
}
const publicGreeting = (row) => ({ id: row.id, asset: row.asset, createdAt: row.created_at, expiresAt: row.expires_at });
async function boundedBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks = []; let length = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 4096) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}
async function submit(request, env) {
  const url = new URL(request.url);
  if (request.headers.get("Origin") !== url.origin) return message("이 페이지에서 다시 등록해 주세요.", 403);
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) return message("지원하지 않는 요청 형식입니다.", 415);
  if (Number(request.headers.get("Content-Length") || 0) > 4096) return message("요청이 너무 큽니다.", 413);
  const text = await boundedBody(request);
  if (text === null) return message("요청이 너무 큽니다.", 413);
  let input;
  try { input = JSON.parse(text); } catch { return message("요청 내용을 확인해 주세요.", 400); }
  if (!validSubmission(input)) return message("소품 선택과 공개 동의를 확인해 주세요.", 400);
  const visitorId = await visitor(request, env);
  if (!visitorId) return message("페이지를 새로 열고 다시 등록해 주세요.", 401);
  const existing = await env.DB.prepare("SELECT id, asset, created_at, expires_at FROM greetings WHERE visitor_key = ? AND request_id = ? AND expires_at > ?").bind(visitorId, input.requestId, new Date().toISOString()).first();
  if (existing) return response({ greeting: publicGreeting(existing), repeated: true });
  if (!(await env.SUBMISSIONS.limit({ key: `okorion-guestbook:${visitorId}` })).success) return message("잠시 기다린 뒤 다시 등록해 주세요.", 429);
  const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: input.token, idempotency_key: input.requestId }),
    signal: AbortSignal.timeout(10000),
  });
  if (!verification.ok) return message("도배 방지 확인을 다시 시도해 주세요.", 503);
  const checked = await verification.json();
  if (!checked.success || (!local(env) && (checked.hostname !== url.hostname || checked.action !== "guestbook"))) return message("도배 방지 확인을 다시 진행해 주세요.", 400);
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.parse(createdAt) + lifetimeMs).toISOString();
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO greetings (id, visitor_key, request_id, asset, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(visitor_key) DO UPDATE SET id=excluded.id, request_id=excluded.request_id, asset=excluded.asset, created_at=excluded.created_at, expires_at=excluded.expires_at WHERE greetings.request_id != excluded.request_id").bind(id, visitorId, input.requestId, input.asset, createdAt, expiresAt).run();
  const saved = await env.DB.prepare("SELECT id, asset, created_at, expires_at FROM greetings WHERE visitor_key = ?").bind(visitorId).first();
  return response({ greeting: publicGreeting(saved) }, 201);
}
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/greetings" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT id, asset, created_at, expires_at FROM greetings WHERE expires_at > ? ORDER BY created_at DESC, id DESC LIMIT 6").bind(new Date().toISOString()).all();
        return response({ version: 1, greetings: results.map(publicGreeting) });
      }
      if (url.pathname.startsWith("/api/") && !configured(env)) return message("등록 페이지를 준비하고 있습니다. 잠시 후 다시 열어 주세요.", 503);
      if (url.pathname === "/api/config" && request.method === "GET") {
        const id = await visitor(request, env) || crypto.randomUUID();
        return response({ siteKey: env.TURNSTILE_SITE_KEY, objects: objects.map(({ id, label }) => ({ id, label })), retentionHours: 72 }, 200, { "Set-Cookie": await cookie(id, env) });
      }
      if (url.pathname === "/api/greetings" && request.method === "POST") return await submit(request, env);
      if (url.pathname.startsWith("/api/")) return message("지원하지 않는 요청입니다.", 405);
      const asset = await env.ASSETS.fetch(request);
      const secured = new Response(asset.body, asset);
      secured.headers.set("X-Content-Type-Options", "nosniff");
      secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      secured.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; img-src 'self'; style-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
      if (secured.headers.get("Content-Type")?.includes("text/html")) {
        return new HTMLRewriter().on('link[rel="canonical"]', { element(element) { element.setAttribute("href", url.origin + "/"); } })
          .on('meta[property="og:url"]', { element(element) { element.setAttribute("content", url.origin + "/"); } })
          .on('meta[property="og:image"]', { element(element) { element.setAttribute("content", url.origin + "/choices/lambis_shell.png"); } }).transform(secured);
      }
      return secured;
    } catch (error) {
      console.error(`Guestbook request failed: ${error.name}`);
      return message("등록을 완료하지 못했습니다. 선택한 소품을 유지한 채 다시 시도해 주세요.", 503);
    }
  },
  async scheduled(_event, env) {
    await env.DB.prepare("DELETE FROM greetings WHERE expires_at <= ?").bind(new Date().toISOString()).run();
  },
};
