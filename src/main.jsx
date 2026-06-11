import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { HaProvider } from "./ha/HaContext.jsx";
import "./aurora.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HaProvider>
      <App />
    </HaProvider>
  </StrictMode>
);
