import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * App-wide confirmation dialog for critical (security-reducing) actions.
 *
 * Usage:
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Unlock Front Door?", confirmLabel: "Unlock", danger: true })) {
 *     ...do the thing...
 *   }
 *
 * Returns a promise that resolves true (confirmed) or false (cancelled / backdrop / Esc).
 */
const ConfirmCtx = createContext(() => Promise.resolve(true));
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }) {
  const [opts, setOpts] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (options) => new Promise((resolve) => {
      resolver.current = resolve;
      setOpts(options || {});
    }),
    []
  );

  const settle = (val) => {
    setOpts(null);
    const r = resolver.current;
    resolver.current = null;
    r?.(val);
  };

  useEffect(() => {
    if (!opts) return;
    const onKey = (e) => {
      if (e.key === "Escape") settle(false);
      else if (e.key === "Enter") settle(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opts]);

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {opts && (
        <div className="cf-backdrop" onClick={() => settle(false)}>
          <div className="cf-modal" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-label={opts.title || "Confirm"}>
            <div className={"cf-ic" + (opts.danger ? " danger" : "")}>
              <AlertTriangle size={26} strokeWidth={2} />
            </div>
            <div className="cf-title">{opts.title || "Are you sure?"}</div>
            {opts.message && <div className="cf-msg">{opts.message}</div>}
            <div className="cf-actions">
              <button type="button" className="cf-btn cancel" onClick={() => settle(false)}>
                {opts.cancelLabel || "Cancel"}
              </button>
              <button type="button" className={"cf-btn confirm" + (opts.danger ? " danger" : "")} onClick={() => settle(true)}>
                {opts.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}
