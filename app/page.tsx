"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pin, setPin] = useState("");
  const [records, setRecords] = useState([]);
  const [activeBook, setActiveBook] = useState("အိမ်သုံးစရိတ်");
  const [books, setBooks] = useState(["အိမ်သုံးစရိတ်"]);
  
  // Form States
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [type, setType] = useState("expense");
  const [showModal, setShowModal] = useState(false);

  // Fetch Data from Supabase
  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("records")
      .select("*")
      .eq("book_name", activeBook)
      .order("created_at", { ascending: false });

    if (!error) setRecords(data);
  };

  // Get unique books from database
  const fetchBooks = async () => {
    const { data, error } = await supabase.from("records").select("book_name");
    if (!error) {
      const uniqueBooks = [...new Set(data.map((d) => d.book_name))];
      if (uniqueBooks.length > 0) setBooks(uniqueBooks);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchBooks();
      fetchRecords();
    }
  }, [isLoggedIn, activeBook]);

  const handleLogin = () => {
    if (pin === "1234") setIsLoggedIn(true);
  };

  const saveEntry = async () => {
    if (!desc || !amt) return;
    
    const { error } = await supabase.from("records").insert([
      { book_name: activeBook, description: desc, amount: parseFloat(amt), type }
    ]);

    if (!error) {
      setShowModal(false);
      setDesc(""); setAmt("");
      fetchRecords(); // Refresh lists
    }
  };

  const deleteEntry = async (id) => {
    if (confirm("Delete?")) {
      await supabase.from("records").delete().eq("id", id);
      fetchRecords();
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#030712] p-8">
        <div className="w-full max-w-xs text-center">
          <h1 className="text-xl font-bold mb-8 tracking-widest uppercase text-yellow-400">mnote001</h1>
          <input 
            type="password" placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)}
            className="w-full p-4 text-center text-2xl tracking-[0.5em] mb-6 outline-none rounded-xl bg-slate-900 border border-slate-800 text-white"
          />
          <button onClick={handleLogin} className="w-full bg-yellow-400 text-black py-4 rounded-xl font-bold">Login</button>
        </div>
      </div>
    );
  }

  // Calculate Totals
  const incT = records.filter(r => r.type === "income").reduce((acc, curr) => acc + curr.amount, 0);
  const expT = records.filter(r => r.type === "expense").reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 pb-24 font-sans">
      <header className="p-4 sticky top-0 z-40 bg-[#030712]/90 backdrop-blur-md border-b border-white/5">
        <select 
          value={activeBook} 
          onChange={(e) => setActiveBook(e.target.value)}
          className="bg-transparent text-yellow-400 font-bold text-lg outline-none"
        >
          {books.map(b => <option key={b} value={b} className="text-black">{b}</option>)}
        </select>
      </header>

      <main className="p-4 space-y-4">
        {/* Balance Card */}
        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-700 to-purple-600 shadow-2xl">
          <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">{activeBook} Balance</p>
          <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-5">{(incT - expT).toLocaleString()}</h1>
          <div className="flex gap-4 pt-4 border-t border-white/10">
            <div className="flex-1"><p className="text-[10px] text-white/60">IN</p><p className="text-green-300 font-bold">+{incT}</p></div>
            <div className="flex-1 text-right"><p className="text-[10px] text-white/60">OUT</p><p className="text-red-300 font-bold">-{expT}</p></div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {records.map(item => (
            <div key={item.id} className="p-4 bg-slate-800/50 rounded-2xl flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-white">{item.description}</h4>
                <p className="text-[10px] text-slate-500">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-bold ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {item.amount.toLocaleString()}
                </span>
                <button onClick={() => deleteEntry(item.id)} className="text-slate-500 hover:text-red-400">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add Button */}
      <button onClick={() => setShowModal(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-yellow-400 text-black rounded-2xl text-2xl shadow-xl flex items-center justify-center">+</button>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 p-6 rounded-t-3xl border-t border-purple-500/30">
            <div className="flex justify-between mb-4">
              <h3 className="text-yellow-400 font-bold text-lg">New Entry</h3>
              <button onClick={() => setShowModal(false)} className="text-white text-xl">&times;</button>
            </div>
            <input type="text" placeholder="အကြောင်းအရာ" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-4 rounded-xl bg-slate-800 text-white mb-4 outline-none" />
            <div className="flex gap-2 mb-6">
              <input type="number" placeholder="ပမာဏ" value={amt} onChange={e => setAmt(e.target.value)} className="flex-1 p-4 rounded-xl bg-slate-800 text-white outline-none" />
              <select value={type} onChange={e => setType(e.target.value)} className="p-4 rounded-xl bg-slate-800 text-white outline-none">
                <option value="expense">Out (-)</option>
                <option value="income">In (+)</option>
              </select>
            </div>
            <button onClick={saveEntry} className="w-full bg-yellow-400 text-black py-4 rounded-xl font-bold">Confirm</button>
          </div>
        </div>
      )}
    </div>
  );
}
