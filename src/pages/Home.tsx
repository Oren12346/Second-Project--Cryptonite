// src/pages/Home.tsx

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store/store";

import { loadCoins } from "../store/coins/coinsSlice";
import { loadCoinDetails } from "../store/coins/CoinDetail/coinDetailsSlice";

import {
  addSelected,
  removeSelected,
  replaceSelected,
} from "../store/selectedCoins/selectedCoinsSlice";

import type { Coin } from "../models/Coin";

import CoinCard from "../components/CoinCard";
import CoinDetailsModal from "../components/CoinDetailsModal";
import MaxCoinsDialog from "../components/MaxCoinsDialog/MaxCoinsDialog";

import "./Home.css";

type Props = {
  searchTerm: string;
};

export default function Home({ searchTerm }: Props) {
  const dispatch = useDispatch<AppDispatch>();

  // Modal state (More Info)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);
  const [selectedCoinName, setSelectedCoinName] = useState<
    string | undefined
  >(undefined);

  // Max-5 dialog state
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [pendingAddId, setPendingAddId] = useState<string>("");

  // Coins list (typed)
  const { items, isLoading, error } = useSelector((s: RootState) => s.coins);
  const coins = items as Coin[];

  // Selected coins (ids only)
  const selectedIds = useSelector((s: RootState) => s.selectedCoins.ids);
  const selectedSet = useMemo(() => new Set<string>(selectedIds), [selectedIds]);

  // Coin details selectors
  const coinDetailsEntry = useSelector((s: RootState) =>
    selectedCoinId ? s.coinDetails.byId[selectedCoinId] : undefined
  );
  const details = coinDetailsEntry?.details ?? null;

  const status = useSelector((s: RootState) =>
    selectedCoinId ? s.coinDetails.statusById[selectedCoinId] : "idle"
  );
  const errorDetails = useSelector((s: RootState) =>
    selectedCoinId ? s.coinDetails.errorById[selectedCoinId] : null
  );

  const isDetailsLoading = status === "loading";

  useEffect(() => {
    // Prevent refetch loops:
    // 1) If we already have data -> do nothing
    if (items.length > 0) return;

    // 2) If a request is in progress -> do nothing
    if (isLoading) return;

    // 3) If we already failed -> do not auto-retry (avoids 429 spam)
    if (error) return;

    dispatch(loadCoins());
  }, [dispatch, items.length, isLoading, error]);

  function handleMoreInfo(id: string) {
    setSelectedCoinId(id);
    setSelectedCoinName(coins.find((c) => c.id === id)?.name);
    setIsModalOpen(true);

    // Fetch details (modal content)
    dispatch(loadCoinDetails(id));
  }

  function handleToggle(id: string, next: boolean) {
    if (!next) {
      dispatch(removeSelected(id));
      return;
    }

    if (selectedSet.has(id)) return;

    // Max 5 rule
    if (selectedIds.length >= 5) {
      setPendingAddId(id);
      setIsReplaceOpen(true);
      return;
    }

    dispatch(addSelected(id));
  }

  function handleConfirmReplace(removeId: string) {
    dispatch(replaceSelected({ removeId, addId: pendingAddId }));
    setIsReplaceOpen(false);
    setPendingAddId("");
  }

  function handleCancelReplace() {
    setIsReplaceOpen(false);
    setPendingAddId("");
  }

  // Client-side filtering
  const q = searchTerm.trim().toLowerCase();
  const filteredItems = q
    ? coins.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q)
      )
    : coins;

  if (isLoading) return <p className="pageMsg">Loading coins...</p>;

  if (error) {
    return (
      <div className="pageMsg">
        <p>Error: {error}</p>
        <button type="button" onClick={() => dispatch(loadCoins())}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className="home">
      <div className="home__head">
        <h2 className="home__title">Top Coins</h2>
        <p className="home__sub">Select up to 5 coins for Reports</p>
      </div>

      <div className="coinsGrid">
        {filteredItems.map((coin) => (
          <CoinCard
            key={coin.id}
            coin={coin}
            isSelected={selectedSet.has(coin.id)}
            onMoreInfo={handleMoreInfo}
            onToggle={handleToggle}
          />
        ))}
      </div>

      <CoinDetailsModal
        isOpen={isModalOpen}
        coinName={selectedCoinName}
        coinId={selectedCoinId}
        details={details}
        isLoading={isDetailsLoading}
        error={errorDetails}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCoinId(null);
          setSelectedCoinName(undefined);
        }}
      />

      <MaxCoinsDialog
        isOpen={isReplaceOpen}
        addCoinId={pendingAddId}
        selectedIds={selectedIds}
        onConfirm={handleConfirmReplace}
        onCancel={handleCancelReplace}
      />
    </section>
  );
}
