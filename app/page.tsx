"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [books, setBooks] = useState<any[]>([]);
  const [currentBook, setCurrentBook] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);

  // Load Books
  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    const { data } = await supabase.from("books").select("*");
    setBooks(data || []);
    if (data?.length) setCurrentBook(data[0]);
  };

  // Load Entries when book changes
  useEffect(() => {
    if (currentBook) loadEntries(currentBook.id);
  }, [currentBook]);

  const loadEntries = async (bookId: string) => {
    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false });

    setEntries(data || []);
  };

  const addBook = async () => {
    const name = prompt("Book Name?");
    if (!name) return;

    await supabase.from("books").insert({ name });
    loadBooks();
  };

  const addEntry = async () => {
    const desc = prompt("Description?");
    const amt = prompt("Amount?");
    if (!desc || !amt) return;

    await supabase.from("entries").insert({
      book_id: currentBook.id,
      desc,
      amt: Number(amt),
      type: "expense",
    });

    loadEntries(currentBook.id);
  };

  const total = entries.reduce((s, e) => s + Number(e.amt), 0);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-yellow-400 text-xl font-bold">mnote cloud</h1>

      <div className="flex gap-2">
        <select
          value={currentBook?.id || ""}
          onChange={(e) =>
            setCurrentBook(books.find((b) => b.id === e.target.value))
          }
          className="bg-slate-800 p-2"
        >
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <button onClick={addBook} className="bg-yellow-400 px-3">
          + Book
        </button>
      </div>

      <div className="text-3xl font-bold">Total: {total}</div>

      <button onClick={addEntry} className="bg-green-500 px-4 py-2">
        Add Entry
      </button>

      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.id} className="p-3 bg-slate-800 rounded">
            {e.desc} — {e.amt}
          </div>
        ))}
      </div>
    </main>
  );
}
