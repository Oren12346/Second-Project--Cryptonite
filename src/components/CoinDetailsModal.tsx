import { useEffect } from "react";
import "./CoinDetailsModal.css";
import type { CoinDetails } from "../services/coinDetailsApi";

type Props = {
  isOpen: boolean;
  coinName?: string;
  coinId: string | null;

  details: CoinDetails | null;
  isLoading: boolean;
  error: string | null;

  onClose: () => void;
};

function formatPrice(value?: number) {
  if (value === undefined || value === null) return "—";

  // Some coins can be extremely small, so keep 0 as valid only if it's truly 0.
  // If you prefer "—" when API returns 0, uncomment the next line:
  // if (value === 0) return "—";

  return value.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

export default function CoinDetailsModal({
  isOpen,
  coinName,
  coinId,
  details,
  isLoading,
  error,
  onClose,
}: Props) {
  // Close on ESC + lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;

    // Lock scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const prices = details?.market_data?.current_price;
  const usd = prices?.usd;
  const eur = prices?.eur;
  const ils = prices?.ils;

  const hasAnyPrice =
    usd !== undefined || eur !== undefined || ils !== undefined;

  return (
    <div className="cdm-backdrop" onClick={onClose} role="presentation">
      <div
        className="cdm-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Coin details dialog"
      >
        <div className="cdm-header">
          <div>
            <h2 className="cdm-title">{coinName ?? "Coin Details"}</h2>
            <p className="cdm-subtitle">{coinId ?? ""}</p>
          </div>

          <button className="cdm-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="cdm-body">
          {isLoading && <div className="cdm-state">Loading prices…</div>}

          {!isLoading && error && (
            <div className="cdm-state cdm-error">Error: {error}</div>
          )}

          {!isLoading && !error && !details && (
            <div className="cdm-state">No data yet.</div>
          )}

          {!isLoading && !error && details && !hasAnyPrice && (
            <div className="cdm-state">No prices available for this coin.</div>
          )}

          {!isLoading && !error && details && hasAnyPrice && (
            <div className="cdm-prices">
              <div className="cdm-price-row">
                <span className="cdm-currency">$ USD</span>
                <span className="cdm-value">{formatPrice(usd)}</span>
              </div>

              <div className="cdm-price-row">
                <span className="cdm-currency">€ EUR</span>
                <span className="cdm-value">{formatPrice(eur)}</span>
              </div>

              <div className="cdm-price-row">
                <span className="cdm-currency">₪ ILS</span>
                <span className="cdm-value">{formatPrice(ils)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="cdm-footer">
          <button className="cdm-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}