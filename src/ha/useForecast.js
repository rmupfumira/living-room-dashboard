/**
 * Fetches a weather entity's daily forecast via the
 * `weather.get_forecasts` service (return_response: true).
 *
 * HA 2024+ removed `forecast` from `weather.*` attributes; the modern way is
 * to either subscribe to `weather/subscribe_forecasts` or call the service.
 * We use the service form because it's simpler and refreshing every 15 min
 * is more than enough for a daily forecast.
 */
import { useEffect, useState } from "react";
import { useHA } from "./HaContext";

export function useForecast(entityId, type = "daily", refreshMs = 15 * 60 * 1000) {
  const { conn, status } = useHA();
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    if (status !== "connected" || !conn || !entityId) return undefined;
    let alive = true;

    const fetchForecast = async () => {
      try {
        const res = await conn.sendMessagePromise({
          type: "call_service",
          domain: "weather",
          service: "get_forecasts",
          service_data: { type },
          target: { entity_id: entityId },
          return_response: true,
        });
        if (!alive) return;
        const arr = res?.response?.[entityId]?.forecast || [];
        setForecast(arr);
      } catch (err) {
        console.warn("[AURORA] forecast fetch failed", err);
      }
    };

    fetchForecast();
    const id = setInterval(fetchForecast, refreshMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [conn, status, entityId, type, refreshMs]);

  return forecast;
}
