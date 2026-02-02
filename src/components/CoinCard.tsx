import "./CoinCard.css";
import type { Coin } from "../models/Coin";

type Props = {
  coin: Coin;
  onMoreInfo?: (coinId: string) => void;
  isSelected?: boolean;
  onToggle?: (coinId: string, next: boolean) => void;
};

export default function CoinCard({
  coin,
  onMoreInfo,
  isSelected = false,
  onToggle,
}: Props) {
  return (
    <article className="coinCard">
      <div className="coinCard__top">
        <img className="coinCard__img" src={coin.image} alt={coin.name} />

        <div className="coinCard__meta">
          <h3 className="coinCard__name">{coin.name}</h3>
          <p className="coinCard__symbol">{coin.symbol.toUpperCase()}</p>
        </div>

        {/* Switch UI (logic will be handled in the next step) */}
        <label className="coinCard__switch" title="Track coin">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onToggle?.(coin.id, e.target.checked)}
          />
          <span className="coinCard__slider" />
        </label>
      </div>

      <div className="coinCard__actions">
        <button
          className="coinCard__btn"
          type="button"
          onClick={() => onMoreInfo?.(coin.id)}
        >
          More Info
        </button>

        <span className="coinCard__hint">USD / EUR / ILS</span>
      </div>
    </article>
  );
}
