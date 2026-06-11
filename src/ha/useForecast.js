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
            if (arr.length) setForecast(arr);
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

    const load = async () => {
      // 1) service call, preferred type
      let arr = await tryServiceCall(preferredType);
      if (alive && arr.length) {
        setForecast(arr);
        return;
      }
      // 2) service call, fallback type
      const fallback = preferredType === "daily" ? "hourly" : "daily";
      arr = await tryServiceCall(fallback);
      if (alive && arr.length) {
        setForecast(arr);
        return;
      }
      // 3) live subscription, preferred then fallback
      await trySubscribe(preferredType);
      if (alive && forecast.length === 0) {
        await trySubscribe(fallback);
      }
    };

    load();
    const id = setInterval(load, refreshMs);
    return () => {
      alive = false;
      clearInterval(id);
      try { subUnsub && subUnsub(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conn, status, entityId, preferredType, refreshMs]);

  return forecast;
}
