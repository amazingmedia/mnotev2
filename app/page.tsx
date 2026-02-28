"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Head from "next/head";

interface RecordItem {
  id: number;
  book_name: string;
  description: string;
  amount: number;
  type: string;
  created_at: string;
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pin, setPin] = useState("");
  
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [activeBook, setActiveBook] = useState("အိမ်သုံးစရိတ်");
  const [books, setBooks] = useState<string[]>(["အိမ်သုံးစရိတ်"]);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [currentType, setCurrentType] = useState<string>("all");

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);

  // Form States
  const [editId, setEditId] = useState<number | null>(null);
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [type, setType] = useState("expense");
  const [newBookName, setNewBookName] = useState("");
  const [renameInput, setRenameInput] = useState("");

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // --- Fetching Data ---
  const fetchBooks = async () => {
    const { data, error } = await supabase.from("records").select("book_name");
    if (!error && data) {
      const uniqueBooks = Array.from(new Set(data.map((d: any) => d.book_name as string)));
      if (uniqueBooks.length > 0) setBooks(uniqueBooks);
      if (uniqueBooks.length > 0 && !uniqueBooks.includes(activeBook)) {
         setActiveBook(uniqueBooks[0]);
      }
    }
  };

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("records")
      .select("*")
      .eq("book_name", activeBook)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const formattedData = data as RecordItem[];
      setRecords(formattedData);
      
      // Extract Years for Filter
      const currentYr = new Date().getFullYear();
      const years = Array.from(new Set(formattedData.map(r => new Date(r.created_at).getFullYear())));
      if (!years.includes(currentYr)) years.push(currentYr);
      setAvailableYears(years.sort((a, b) => b - a).map(String));
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchBooks();
      fetchRecords();
    }
  }, [isLoggedIn, activeBook]);

  // --- Handlers ---
  const handleLogin = () => {
    if (pin === "1234") setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setPin("");
  };

  const openModalForNew = () => {
    setEditId(null); setDesc(""); setAmt(""); setType("expense");
    setShowModal(true);
  };

  const openModalForEdit = (item: RecordItem) => {
    setEditId(item.id); setDesc(item.description); setAmt(item.amount.toString()); setType(item.type);
    setShowModal(true);
  };

  const saveEntry = async () => {
    if (!desc || isNaN(parseFloat(amt))) return;
    
    if (editId) {
       // Update existing
       await supabase.from("records").update({ description: desc, amount: parseFloat(amt), type }).eq("id", editId);
    } else {
       // Insert new
       await supabase.from("records").insert([{ book_name: activeBook, description: desc, amount: parseFloat(amt), type }]);
    }
    setShowModal(false);
    fetchRecords();
  };

  const deleteEntry = async (id: number) => {
    if (confirm("Delete?")) {
      await supabase.from("records").delete().eq("id", id);
      fetchRecords();
    }
  };

  const createNewBook = () => {
    const name = newBookName.trim();
    if (!name || books.includes(name)) return;
    setBooks(prev => [...prev, name]);
    setActiveBook(name);
    setShowBookModal(false);
    setNewBookName("");
  };

  const renameBook = async () => {
    const newName = renameInput.trim();
    if (!newName || newName === activeBook || books.includes(newName)) return;
    
    // Update all records with old book name to new book name in Supabase
    await supabase.from("records").update({ book_name: newName }).eq("book_name", activeBook);
    
    setActiveBook(newName);
    setShowRenameModal(false);
    fetchBooks();
  };

  const exportData = () => {
    let csv = "Date,Description,Type,Amount\n";
    records.forEach(i => {
      const dateStr = new Date(i.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      csv += `"${dateStr}","${i.description}","${i.type}","${i.amount}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${activeBook}.csv`; a.click();
  };

  // --- Filtering Logic ---
  const filteredRecords = records.filter(i => {
    const date = new Date(i.created_at);
    const mMatch = filterMonth === "all" || date.getMonth().toString() === filterMonth;
    const yMatch = date.getFullYear().toString() === filterYear;
    const tMatch = currentType === "all" || i.type === currentType;
    return mMatch && yMatch && tMatch;
  });

  const totalsForSelectedMonthYear = records.filter(i => {
    const date = new Date(i.created_at);
    return (filterMonth === "all" || date.getMonth().toString() === filterMonth) && (date.getFullYear().toString() === filterYear);
  });

  const incT = totalsForSelectedMonthYear.filter(r => r.type === "income").reduce((a, b) => a + b.amount, 0);
  const expT = totalsForSelectedMonthYear.filter(r => r.type === "expense").reduce((a, b) => a + b.amount, 0);

  // --- Render Login ---
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#030712] p-8">
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

  return (
    <>
      <Head>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
      </Head>
      <div className="min-h-screen bg-[#030712] text-[#f1f5f9] pb-24 font-sans select-none">
        
        {/* Header */}
        <header className="p-3 sticky top-0 z-40 bg-[#030712]/90 backdrop-blur-md border-b border-white/5">
          <div className="flex justify-between items-center px-1 mb-2">
            <div className="flex items-center gap-1">
              <select value={activeBook} onChange={(e) => setActiveBook(e.target.value)} className="bg-transparent border-none text-yellow-400 font-bold text-base outline-none p-0 pr-6 max-w-[150px] truncate">
                {books.map(b => <option key={b} value={b} className="bg-slate-800 text-white">{b}</option>)}
              </select>
              <button onClick={() => {setRenameInput(activeBook); setShowRenameModal(true);}} className="text-slate-500 text-xs p-1 ml-2"><i className="fa-solid fa-pen"></i></button>
              <button onClick={() => setShowBookModal(true)} className="text-slate-500 text-xs p-1 ml-2"><i className="fa-solid fa-folder-plus"></i></button>
            </div>
            <div className="flex gap-4 text-slate-400 text-sm">
              <button onClick={exportData}><i className="fa-solid fa-file-csv"></i></button>
              <button onClick={logout}><i className="fa-solid fa-power-off"></i></button>
            </div>
          </div>
          <div className="flex gap-1.5">
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="p-1.5 text-[10px] flex-1 bg-slate-800 text-white rounded-lg outline-none">
              <option value="all">All Months</option>
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="p-1.5 text-[10px] w-20 bg-slate-800 text-white rounded-lg outline-none">
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 space-y-4">
          
          {/* Balance Card */}
          <div className="p-6 rounded-[2rem] bg-gradient-to-br from-blue-700 to-purple-600 shadow-2xl relative overflow-hidden border border-white/10">
            <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest mb-1">{activeBook} Balance</p>
            <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-5">{(incT - expT).toLocaleString()}</h1>
            <div className="flex gap-4 pt-4 border-t border-white/10">
              <div className="flex-1"><p className="text-[8px] text-white/60 uppercase">In</p><p className="text-sm font-bold text-green-300">{incT.toLocaleString()}</p></div>
              <div className="flex-1 text-right"><p className="text-[8px] text-white/60 uppercase">Out</p><p className="text-sm font-bold text-red-300">{expT.toLocaleString()}</p></div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 px-1">
            <button onClick={() => setCurrentType('all')} className={`px-3 py-2 rounded-lg text-[11px] font-semibold transition border ${currentType === 'all' ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'text-slate-400 border-slate-800'}`}>All</button>
            <button onClick={() => setCurrentType('income')} className={`px-3 py-2 rounded-lg text-[11px] font-semibold transition border ${currentType === 'income' ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'text-slate-400 border-slate-800'}`}>Income</button>
            <button onClick={() => setCurrentType('expense')} className={`px-3 py-2 rounded-lg text-[11px] font-semibold transition border ${currentType === 'expense' ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'text-slate-400 border-slate-800'}`}>Expense</button>
          </div>

          {/* List Container */}
          <div className="space-y-2">
            {filteredRecords.map(item => {
              const dateStr = new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
              return (
                <div key={item.id} onClick={() => openModalForEdit(item)} className="p-5 bg-slate-800/40 border border-white/5 rounded-2xl flex justify-between items-center cursor-pointer active:scale-95 transition">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      <i className={`fa-solid ${item.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down'} text-[11px]`}></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[15px] text-white tracking-tight">{item.description}</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{dateStr}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold text-[16px] ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {item.amount.toLocaleString()}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); deleteEntry(item.id); }} className="text-slate-700 p-2 ml-1 active:text-red-500">
                      <i className="fa-solid fa-trash-can text-sm"></i>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </main>

        {/* Floating Add Button */}
        <button onClick={openModalForNew} className="fixed bottom-6 right-6 w-14 h-14 bg-yellow-400 text-black rounded-2xl shadow-xl z-50 flex items-center justify-center text-xl active:scale-90 transition">
          <i className="fa-solid fa-plus"></i>
        </button>

        {/* --- Modals --- */}
        
        {/* Entry Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col justify-end items-center">
            <div className="w-full max-w-md bg-[#111827] rounded-t-3xl border-t border-purple-500/30 p-6 pb-safe">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-yellow-400">{editId ? "Edit Record" : "New Entry"}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-500 text-2xl">&times;</button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="အကြောင်းအရာ" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-4 rounded-xl bg-slate-800 text-white outline-none border border-slate-700" />
                <div className="flex gap-2">
                  <input type="number" placeholder="ပမာဏ" value={amt} onChange={e => setAmt(e.target.value)} className="flex-1 p-4 rounded-xl bg-slate-800 text-white outline-none border border-slate-700" inputMode="decimal" />
                  <select value={type} onChange={e => setType(e.target.value)} className="w-32 p-4 rounded-xl bg-slate-800 text-white outline-none border border-slate-700">
                    <option value="expense">Out (-)</option>
                    <option value="income">In (+)</option>
                  </select>
                </div>
                <button onClick={saveEntry} className="w-full bg-yellow-400 text-black py-4 rounded-xl font-bold active:scale-95 transition">Confirm</button>
              </div>
            </div>
          </div>
        )}

        {/* New Book Modal */}
        {showBookModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col justify-end items-center">
            <div className="w-full max-w-md bg-[#111827] rounded-t-3xl border-t border-purple-500/30 p-8 pb-safe">
              <h3 className="text-lg font-bold text-yellow-400 mb-6">စာရင်းစာအုပ်အသစ်</h3>
              <input type="text" placeholder="အမည်ပေးပါ" value={newBookName} onChange={e => setNewBookName(e.target.value)} className="w-full p-4 mb-6 rounded-xl bg-slate-800 text-white outline-none border border-slate-700" />
              <div className="flex gap-4">
                <button onClick={() => setShowBookModal(false)} className="flex-1 py-4 text-slate-500 font-semibold">Cancel</button>
                <button onClick={createNewBook} className="flex-1 bg-yellow-400 text-black py-4 rounded-xl font-bold active:scale-95 transition">Create</button>
              </div>
            </div>
          </div>
        )}

        {/* Rename Book Modal */}
        {showRenameModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col justify-end items-center">
            <div className="w-full max-w-md bg-[#111827] rounded-t-3xl border-t border-purple-500/30 p-8 pb-safe">
              <h3 className="text-lg font-bold text-yellow-400 mb-6">စာရင်းအမည်ပြောင်းရန်</h3>
              <input type="text" value={renameInput} onChange={e => setRenameInput(e.target.value)} className="w-full p-4 mb-6 rounded-xl bg-slate-800 text-white outline-none border border-slate-700" />
              <div className="flex gap-4">
                <button onClick={() => setShowRenameModal(false)} className="flex-1 py-4 text-slate-500 font-semibold">Cancel</button>
                <button onClick={renameBook} className="flex-1 bg-yellow-400 text-black py-4 rounded-xl font-bold active:scale-95 transition">Update</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
