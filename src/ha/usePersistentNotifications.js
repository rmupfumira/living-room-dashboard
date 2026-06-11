/**
 * usePersistentNotifications — subscribe to HA's persistent_notification
 * collection. Returns the array of active notifications and a dismiss helper.
 *
 * HA exposes notifications via the WebSocket command
 *   { type: "persistent_notification/subscribe" }
 * which streams initial state + change events.
 */
import { useEffect, useState, useCallback } from "react";
import { useHA } from "./HaContext";
import { useService } from "./useService";

export function usePersistentNotifications() {
  const { conn, status } = useHA();
  const call = useService();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (status !== "connected" || !conn) return undefined;
    let unsub;
    let alive = true;
    const next = new Map();

    (async () => {
      try {
        unsub = await conn.subscribeMessage(
          (msg) => {
            if (!alive) return;
            if (msg.type === "added" || msg.type === "current") {
              const arr = msg.notifications || (msg.notification ? [msg.notification] : []);
              for (const n of arr) next.set(n.notification_id, n);
            } else if (msg.type === "updated") {
              const arr = msg.notifications || [msg.notification];
              for (const n of arr) next.set(n.notification_id, n);
            } else if (msg.type === "removed") {
              const arr = msg.notification_ids || (msg.notification_id ? [msg.notification_id] : []);
              for (const id of arr) next.delete(id);
            }
            setItems(Array.from(next.values()).sort((a, b) =>
              String(b.created_at || "").localeCompare(String(a.created_at || ""))
            ));
          },
          { type: "persistent_notification/subscribe" }
        );
      } catch (err) {
        console.warn("[AURORA] persistent_notification subscribe failed", err);
      }
    })();

    return () => {
      alive = false;
      try { unsub && unsub(); } catch {}
    };
  }, [conn, status]);

  const dismiss = useCallback(
    (notification_id) =>
      call("persistent_notification", "dismiss", { notification_id }),
    [call]
  );

  const dismissAll = useCallback(() => call("persistent_notification", "dismiss_all"), [call]);

  return { items, dismiss, dismissAll };
}
