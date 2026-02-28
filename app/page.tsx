"use client";

import { useEffect, useState } from "react";
import { loadWallets, saveWallets } from "@/lib/storage";
import { Wallets } from "@/lib/types";

import LoginScreen from "@/components/LoginScreen";
import BalanceCard from "@/components/BalanceCard";
import EntryList from "@/components/EntryList";
import EntryModal from "@/components/EntryModal";

export default function Home() {
  const [ready, setReady] = useState(false);
  const [wallets, setWallets] = useState<Wallets>({});
  const [book, setBook] = useState("");

  useEffect(() => {
    const data = loadWallets();
    setWallets(data);
    setBook(Object.keys(data)[0]);
  }, []);

  useEffect(() => {
    if (book) saveWallets(wallets);
  }, [wallets]);

  if (!ready) return <LoginScreen onLogin={() => setReady(true)} />;

  const addEntry = (entry: any) => {
    setWallets(prev => ({
      ...prev,
      [book]: [entry, ...prev[book]],
    }));
  };

  const deleteEntry = (id: number) => {
    setWallets(prev => ({
      ...prev,
      [book]: prev[book].filter(e => e.id !== id),
    }));
  };

  const list = wallets[book] || [];

  return (
    <main className="p-4 space-y-4">
      <BalanceCard data={list} />
      <EntryList items={list} onDelete={deleteEntry} />
      <EntryModal onAdd={addEntry} />
    </main>
  );
}
