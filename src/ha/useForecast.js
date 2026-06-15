/**
 * Fetches a weather entity's forecast.
 *
 * HA 2024+ removed `forecast` from `weather.*` attributes. The integration
 * either:
 *   a) supports `weather.get_forecasts` with return_response (modern), or
 *   b) only supports `weather/subscribe_forecasts` (websocket stream).
 *
 * We try (a) first; if it doesn't yield rows we fall back to (b). Some
 * integrations also key the response by `entity_id`, others return the
 * forecast array directly — the parser handles both shapes.
 *
 * Falls back from "daily" to "hourly" if the integration doesn't expose daily.
 */
import { useEffect, useState } from "react";
import { useHA } from "./HaContext";

/** Robust forecast extractor — handles three observed response shapes. */
function extractForecast(res, entityId) {
  const r = res?.response;
  if (!r) return [];
  if (Array.isArray(r?.[entityId]?.forecast)) return r[entityId].forecast;
  if (Array.isArray(r?.[entityId])) return r[entityId];
  if (Array.isArray(r?.forecast)) return r.forecast;
  return [];
}

export function useForecast(entityId, preferredType = "daily", refreshMs = 15 * 60 * 1000) {
  const { conn, status } = useHA();
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    if (status !== "connected" || !conn || !entityId) return undefined;
    let alive = true;
    let subUnsub;

    const tryServiceCall = async (type) => {
      try {
        const res = await conn.sendMessagePromise({
          type: "call_service",
          domain: "weather",
          service: "get_forecasts",
          service_data: { type },
          target: { entity_id: entityId },
          return_response: true,
        });
        return extractForecast(res, entityId);
      } catch (err) {
        console.warn(`[AURORA] get_forecasts ${type} failed`, err);
        return [];
      }
    };

    const trySubscribe = async (type) => {
      try {
        subUnsub = await conn.subscribeMessage(
          (event) => {
            if (!alive) return;
            const arr = event?.forecast || [];
            if (arr.length) { got = true; setForecast(arr); }
          },
          {
            type: "weather/subscribe_forecast",
            forecast_type: type,
            entity_id: entityId,
          }
        );
      } catch (err) {
        console.warn(`[AURORA] subscribe_forecast ${type} failed`, err);
      }
    };

    let got = false;
    const apply = (arr) => {
      if (alive && Array.isArray(arr) && arr.length) { got = true; setForecast(arr); }
    };
    const fallback = preferredType === "daily" ? "hourly" : "daily";

    const load = async () => {
      // Fire the live subscription AND the one-shot service call together —
      // whichever yields rows first wins. (Some integrations only push via
      // subscribe; others only answer get_forecasts.)
      trySubscribe(preferredType);
      apply(await tryServiceCall(preferredType));
      // Nothing yet? try the other granularity.
      if (alive && !got) {
        trySubscribe(fallback);
        apply(await tryServiceCall(fallback));
      }
    };

    load();
    const id = setInterval(() => tryServiceCall(preferredType).then(apply), refreshMs);
    return () => {
      alive = false;
      clearInterval(id);
      try { subUnsub && subUnsub(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conn, status, entityId, preferredType, refreshMs]);

  return forecast;
}
