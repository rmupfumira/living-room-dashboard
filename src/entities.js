/**
 * Aurora → Home Assistant entity mapping.
 *
 * This is the ONLY place in the codebase that hard-codes entity IDs.
 * Every component imports the slot name; if you need to point a tile at a
 * different entity, change it here and only here.
 *
 * Validated against the live HA instance (2026.5.4) during Phase 0
 * — see the Aurora mapping table in the conversation history.
 */

export const ENTITIES = {
  /* ─── Doorbell ──────────────────────────────────────────── */
  doorbell: {
    camera: "camera.doorbell_frigate",
    ring: "binary_sensor.doorbell_doorbell",      // physical button press
    motion: "binary_sensor.g4_doorbell_pro_poe_motion",
    ringing: "input_boolean.doorbell_ringing",    // sticky "is ringing right now"
    lock: "lock.front_door_lock",
  },

  /* ─── Security ──────────────────────────────────────────── */
  security: {
    garage: "cover.garage_door_z2m",
    gate: "cover.centurion_gate_gate",
    outdoorAlarm: "alarm_control_panel.partition_outdoor",
    indoorAlarm: "alarm_control_panel.partition_indoor",
    entArea: "lock.ent_area",       // entertainment area door (it's a lock)
    screenGate: "cover.screen_gate",
    secureHomeScript: "script.secure_home",
  },

  /* ─── Solar / Power (Deye/SunSynk inverter, values in Watts) ── */
  power: {
    pvPower: "sensor.pv_power",                        // W
    pvToday: "sensor.pv_energy",                       // kWh
    pvPeakForecast: "sensor.solcast_pv_forecast_peak_forecast_today", // kW (forecast — fallback ref)
    loadPower: "sensor.load_power",                    // W
    loadToday: "sensor.load_energy",                   // kWh
    gridPower: "sensor.grid_power",                    // W (positive = importing)
    gridImportToday: "sensor.grid_energy_in",          // kWh
    gridExportToday: "sensor.grid_energy_out",         // kWh
    batterySoc: "sensor.battery_state_of_charge",      // %
    batteryPower: "sensor.battery_power",              // W (+charge / −discharge)
    batteryTime: null,                                 // not present in this install
    selfSufficiency: "sensor.off_grid_percentage_today", // %
  },

  /* ─── Weather ────────────────────────────────────────────── */
  weather: "weather.pirateweather",

  /* ─── Media · Climate · Lamp ─────────────────────────────── */
  media: "media_player.living_room_2",   // "Lounge TV" — LG WebOS
  climate: "climate.living_room_ac",     // "Living room AC"
  lamp: "switch.kitchen_pendant",        // "Kitchen Pendant" (switch.* — toggle only)
};

/* ─── Curated binary_sensors that bubble up into the alerts feed.
   Add/remove as needed; severity is inferred by the alerts component
   from the `class` field. */
export const ALERT_SENSORS = [
  { id: "binary_sensor.mg5050_zone_out_main_gate_open", class: "critical", label: "Main gate breach" },
  { id: "binary_sensor.zone_electric_fence_open", class: "critical", label: "Electric fence" },
  { id: "binary_sensor.kitchen_gas_leak_sensor_gas", class: "critical", label: "Kitchen gas leak" },
  { id: "binary_sensor.zone_out_front_door_open", class: "warning", label: "Front door patio" },
  { id: "binary_sensor.zone_out_garage_open", class: "warning", label: "Garage front" },
  { id: "binary_sensor.downstairs_hallway_door_contact", class: "info", label: "Downstairs hallway door" },
];
