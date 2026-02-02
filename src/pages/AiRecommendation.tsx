import { useMemo, useState, useRef } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import type { Coin } from "../models/Coin";

import {
  fetchAiCoinPromptData,
  type AiCoinPromptData,
} from "../services/aiCoinDataApi";
import {
  fetchAiRecommendation,
  type AiRecommendationResult,
} from "../services/aiRecommendationApi";

import "./AiRecommendation.css";

type Verdict = "BUY" | "DON'T BUY";

type UiResult = {
  verdict: Verdict;
  reason: string;
  rawText: string;
};

export default function AiRecommendation() {
  const selectedIds = useSelector((s: RootState) => s.selectedCoins.ids);
  const { items } = useSelector((s: RootState) => s.coins);
  const coins = items as Coin[];

  const selectedCoins = useMemo(() => {
    if (!selectedIds.length || !coins.length) return [];
    const byId = new Map<string, Coin>(coins.map((c) => [c.id, c]));
    return selectedIds
      .map((id) => byId.get(id))
      .filter((c): c is Coin => Boolean(c));
  }, [selectedIds, coins]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );
  const [error, setError] = useState("");
  const [result, setResult] = useState<UiResult | null>(null);

  // Prevent race conditions between fast clicks
  const lastAiRequestIdRef = useRef(0);

  async function handleRecommend() {
    if (!selectedId) return;

    const requestId = ++lastAiRequestIdRef.current;

    setStatus("loading");
    setError("");
    setResult(null);

    try {
      const promptData: AiCoinPromptData =
        await fetchAiCoinPromptData(selectedId);

      // Ignore outdated response
      if (requestId !== lastAiRequestIdRef.current) return;

      const rec: AiRecommendationResult =
        await fetchAiRecommendation(promptData);

      // Ignore outdated response
      if (requestId !== lastAiRequestIdRef.current) return;

      setResult({
        verdict: rec.verdict,
        reason: rec.reason,
        rawText: rec.rawText,
      });

      // Ignore outdated response
      if (requestId !== lastAiRequestIdRef.current) return;

      setStatus("ok");
    } catch (e: unknown) {
      // Ignore outdated response
      if (requestId !== lastAiRequestIdRef.current) return;

      setStatus("error");
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  return (
    <div className="aiPage">
      <header className="aiHeader">
        <h1 className="aiTitle">AI Recommendation</h1>
        <p className="aiSubtitle">
          Choose one selected coin and get a BUY / DON'T BUY recommendation.
        </p>
      </header>

      {selectedCoins.length === 0 ? (
        <div className="aiEmpty">
          <div className="aiEmpty__box">
            <h2 className="aiEmpty__title">No coins selected</h2>
            <p className="aiEmpty__text">
              Go to Home and select up to 5 coins, then come back here.
            </p>
          </div>
        </div>
      ) : (
        <section className="aiGrid">
          <article className="aiCard">
            <h3>Select a coin</h3>

            <div className="aiRadioList">
              {selectedCoins.map((coin) => (
                <label key={coin.id} className="aiRadioItem">
                  <input
                    type="radio"
                    name="coin"
                    value={coin.id}
                    checked={selectedId === coin.id}
                    onChange={() => {
                      setSelectedId(coin.id);
                      // Reset UI when switching coin
                      setStatus("idle");
                      setError("");
                      setResult(null);
                    }}
                  />

                  <div className="aiRadioCoin">
                    {coin.image ? (
                      <img
                        src={coin.image}
                        alt={`${coin.name} logo`}
                        className="aiRadioCoin__img"
                      />
                    ) : (
                      <div className="aiRadioCoin__imgFallback" />
                    )}

                    <div className="aiRadioCoin__meta">
                      <div className="aiRadioCoin__name">{coin.name}</div>
                      <div className="aiRadioCoin__symbol">
                        {coin.symbol.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <button
              className="aiBtn aiBtn--primary"
              type="button"
              disabled={!selectedId}
              onClick={handleRecommend}
            >
              {status === "loading" ? "Asking AI..." : "Get recommendation"}
            </button>

            {status === "error" && (
              <div className="aiError">
                <div className="aiError__title">
                  Could not get recommendation
                </div>
                <div className="aiError__text">{error}</div>
              </div>
            )}

            {result && (
              <div className="aiResult">
                <div
                  className={`aiVerdict aiVerdict--${
                    result.verdict === "BUY" ? "buy" : "dont"
                  }`}
                >
                  {result.verdict}
                </div>

                <p className="aiReason">{result.reason}</p>

                <details className="aiRaw">
                  <summary>Show raw response</summary>
                  <pre className="aiRaw__pre">{result.rawText}</pre>
                </details>
              </div>
            )}
          </article>
        </section>
      )}

      <footer className="aiFooter">
        <span>Data source: CoinGecko</span>
        <span className="aiFooter__sep">•</span>
        <span>AI: /api/ai/recommendation</span>
      </footer>
    </div>
  );
}
