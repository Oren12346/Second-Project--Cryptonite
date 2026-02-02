// src/pages/Reports.tsx

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import type { Coin } from "../models/Coin";

import CanvasJSReact from "@canvasjs/react-charts";
import {
  fetchUsdPricesForSymbols,
  type CryptoComparePriceResponse,
} from "../services/cryptoCompareApi";

import "./Reports.css";

/**
 * Project requirement: refresh every 2 seconds
 */
const POLL_MS = 2000;
const MAX_POINTS = 60;

type LinePoint = { x: Date; y: number };
type LineSeries = { name: string; dataPoints: LinePoint[] };

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

export default function Reports() {
  const selectedIds = useSelector((s: RootState) => s.selectedCoins.ids);
  const { items } = useSelector((s: RootState) => s.coins);
  const coins = items as Coin[];

  // Selected IDs -> symbols (BTC, ETH...)
  const selectedSymbols = useMemo((): string[] => {
    if (!selectedIds.length || !coins.length) return [];

    const idToSymbol = new Map<string, string>(coins.map((c) => [c.id, c.symbol]));

    const list = selectedIds
      .map((id) => idToSymbol.get(id))
      .filter((sym): sym is string => typeof sym === "string" && sym.length > 0)
      .map((sym) => sym.trim().toUpperCase());

    return Array.from(new Set(list));
  }, [selectedIds, coins]);

  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState<string>("");

  // One chart with multiple series (one per symbol)
  const [seriesBySymbol, setSeriesBySymbol] = useState<Record<string, LineSeries>>({});

  // Keep series map aligned with selectedSymbols
  useEffect(() => {
    setSeriesBySymbol((prev) => {
      const next: Record<string, LineSeries> = {};
      for (const sym of selectedSymbols) {
        next[sym] = prev[sym] ?? { name: sym, dataPoints: [] };
      }
      return next;
    });
  }, [selectedSymbols]);

  // Poll every 2 seconds
  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    async function tick() {
      if (selectedSymbols.length === 0) {
        setStatus("idle");
        setError("");
        setSeriesBySymbol({});
        return;
      }

      try {
        setStatus((prev) => (prev === "ok" ? "ok" : "loading"));
        setError("");

        // Project API (pricemulti)
        const prices: CryptoComparePriceResponse = await fetchUsdPricesForSymbols(selectedSymbols);
        if (cancelled) return;

        const now = new Date();

        setSeriesBySymbol((prev) => {
          const next: Record<string, LineSeries> = { ...prev };

          for (const sym of selectedSymbols) {
            const usd = prices?.[sym]?.USD;
            if (typeof usd !== "number") continue;

            const old = next[sym] ?? { name: sym, dataPoints: [] };
            const updated = [...old.dataPoints, { x: now, y: usd }];

            next[sym] = {
              ...old,
              dataPoints:
                updated.length > MAX_POINTS ? updated.slice(updated.length - MAX_POINTS) : updated,
            };
          }

          return next;
        });

        setStatus("ok");
      } catch (e: unknown) {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    }

    tick();
    timer = window.setInterval(tick, POLL_MS);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [selectedSymbols]);

  const options = useMemo(() => {
    const data = selectedSymbols.map((sym) => ({
      type: "spline",
      name: sym,
      showInLegend: true,
      xValueFormatString: "HH:mm:ss",
      yValueFormatString: "$#,###.##",
      dataPoints: (seriesBySymbol[sym]?.dataPoints ?? []) as any,
    }));

    return {
      animationEnabled: false,
      theme: "dark2",
      backgroundColor: "transparent",
      title: { text: "Live Crypto Prices (USD)" },
      axisX: {
        title: "Time",
        valueFormatString: "HH:mm:ss",
        gridThickness: 0,
        tickThickness: 0,
        lineThickness: 1,
      },
      axisY: {
        title: "USD",
        prefix: "$",
        includeZero: false,
        gridThickness: 1,
        gridColor: "rgba(255,255,255,0.08)",
        tickThickness: 0,
        lineThickness: 1,
      },
      toolTip: { shared: true },
      legend: { cursor: "pointer" },
      data,
    };
  }, [selectedSymbols, seriesBySymbol]);

  return (
    <div className="reportsPage">
      <header className="reportsHeader">
        <div className="reportsHeader__row">
          <h1 className="reportsTitle">Reports</h1>

          <div className={`reportsStatus reportsStatus--${status}`}>
            {status === "loading" && "Loading..."}
            {status === "ok" && "Live"}
            {status === "error" && "Error"}
            {status === "idle" && "Idle"}
          </div>
        </div>

        <p className="reportsSubtitle">Refresh every 2 seconds (project requirement)</p>
      </header>

      {selectedSymbols.length === 0 ? (
        <div className="reportsEmpty">
          <div className="reportsEmpty__box">
            <h2 className="reportsEmpty__title">No coins selected</h2>
            <p className="reportsEmpty__text">Select coins in Home and come back to Reports.</p>
          </div>
        </div>
      ) : (
        <section className="reportsCard">
          {status === "error" && (
            <div className="reportsError">
              <div className="reportsError__title">Could not load prices</div>
              <div className="reportsError__text">{error}</div>
            </div>
          )}

          <div className="reportsChartWrap reportsChartWrap--pretty reportsChartWrap--tall">
            <CanvasJSChart options={options} />
          </div>

          <footer className="reportsFooter">Data source: CryptoCompare (pricemulti)</footer>
        </section>
      )}
    </div>
  );
}