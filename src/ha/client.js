/**
 * Home Assistant client factory.
 *
 * Reads `VITE_HA_URL` + `VITE_HA_TOKEN` from import.meta.env (inlined at build
 * time). The connection auto-reconnects with exponential backoff via the
 * library; we surface the connection state through HaContext.
 */
import {
  createConnection,
  createLongLivedTokenAuth,
  ERR_HASS_HOST_REQUIRED,
  ERR_INVALID_AUTH,
  ERR_CANNOT_CONNECT,
  ERR_CONNECTION_LOST,
  subscribeEntities,
} from "home-assistant-js-websocket";

/**
 * Normalise common URL mistakes:
 *   ws://host:8123/api/websocket  → http://host:8123
 *   wss://host:8123/              → https://host:8123
 *   http://host:8123/             → http://host:8123
 * The home-assistant-js-websocket library wants the BASE HA URL only; it
 * appends `/api/websocket` itself and flips the protocol to ws/wss.
 */
function normalizeHaUrl(raw) {
  if (!raw) return "";
  let u = String(raw).trim();
  if (u.startsWith("ws://")) u = "http://" + u.slice(5);
  if (u.startsWith("wss://")) u = "https://" + u.slice(6);
  u = u.replace(/\/api\/websocket\/?$/i, "");
  u = u.replace(/\/+$/g, "");
  return u;
}

export const HA_URL = normalizeHaUrl(import.meta.env.VITE_HA_URL);
export const HA_TOKEN = (import.meta.env.VITE_HA_TOKEN || "").trim();
export const HA_CONFIGURED = Boolean(HA_URL && HA_TOKEN);

/** Human-readable description of a connection failure. */
export function describeError(err) {
  if (err === ERR_HASS_HOST_REQUIRED) return "Missing HA URL";
  if (err === ERR_INVALID_AUTH) return "Invalid token";
  if (err === ERR_CANNOT_CONNECT) return "Cannot reach Home Assistant";
  if (err === ERR_CONNECTION_LOST) return "Connection lost";
  if (typeof err === "string") return err;
  if (err?.message) return err.message;
  return "Unknown connection error";
}

/**
 * Open a long-lived-token connection. Returns the live connection object
 * or rejects with one of the ERR_* codes from the library.
 */
export async function openConnection() {
  if (!HA_CONFIGURED) {
    throw "Missing VITE_HA_URL / VITE_HA_TOKEN";
  }
  const auth = createLongLivedTokenAuth(HA_URL, HA_TOKEN);
  return await createConnection({ auth });
}

export { subscribeEntities };
