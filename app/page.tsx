"use client";

import { useState, useEffect } from "react";

const PIN = "1234";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginPass, setLoginPass] = useState("");

  const [wallets, setWallets] = useState<any>({ "အိမ်သုံးစရိတ်": [] });
  const [currentBook, setCurrentBook] = useState("အိမ်သုံးစရိတ်");
  const [currentType, setCurrentType] = useState("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());

  // Modals State
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  // Form States
  const [editId, setEditId] = useState<number | null>(null);
  const [entryDesc, setEntryDesc] = useState("");
  const [entryAmt, setEntryAmt] = useState("");
  const [entryType, setEntryType] = useState("expense");
  const [newBookName, setNewBookName] = useState("");
  const [renameInput, setRenameInput] = useState("");

  useEffect(() => {
    setIsMounted(true);
    const storedWallets = JSON.parse(localStorage.getItem('mnote_wallets_v2') || 'null');
    if (storedWallets) setWallets(storedWallets);
    
    const storedBook = localStorage.getItem('mnote_active_book');
    if (storedBook && storedWallets && storedWallets[storedBook]) {
      setCurrentBook(storedBook);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('mnote_wallets_v2', JSON.stringify(wallets));
      localStorage.setItem('mnote_active_book', currentBook);
    }
  }, [wallets, currentBook, isMounted]);

  if (!isMounted) return null; // Prevent hydration errors

  const handleLogin = () => {
    if (loginPass === PIN) setIsLoggedIn(true);
  };

  const createNewBook = () => {
    const name = newBookName.trim();
    if (!name || wallets[name]) return;
    setWallets({ ...wallets, [name]: [] });
    setCurrentBook(name);
    setNewBookName("");
    setIsBookModalOpen(false);
  };

  const renameBook = () => {
    const newName = renameInput.trim();
    if (!newName || newName === currentBook || wallets[newName]) return setIsRenameModalOpen(false);
    
    const updatedWallets = { ...wallets };
    updatedWallets[newName] = updatedWallets[currentBook];
    delete updatedWallets[currentBook];
    
    setWallets(updatedWallets);
    setCurrentBook(newName);
    setIsRenameModalOpen(false);
  };

  const openEntryModal = (id: number | null = null) => {
    if (id) {
      const item = wallets[currentBook].find((i: any) => i.id === id);
      setEditId(id);
      setEntryDesc(item.desc);
      setEntryAmt(item.amt.toString());
      setEntryType(item.type);
    } else {
      setEditId(null);
      setEntryDesc("");
      setEntryAmt("");
      setEntryType("expense");
    }
    setIsEntryModalOpen(true);
  };

  const saveEntry = () => {
    const amt = parseFloat(entryAmt);
    if (!entryDesc || isNaN(amt)) return;

    const currentEntries = [...(wallets[currentBook] || [])];

    if (editId) {
      const idx = currentEntries.findIndex(i => i.id === editId);
      currentEntries[idx] = { ...currentEntries[idx], desc: entryDesc, amt, type: entryType };
    } else {
      const now = new Date();
      currentEntries.unshift({
        id: Date.now(), desc: entryDesc, amt, type: entryType,
        dateStr: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        month: now.getMonth().toString(), year: now.getFullYear().toString()
      });
    }

    setWallets({ ...wallets, [currentBook]: currentEntries });
    setIsEntryModalOpen(false);
  };

  const deleteEntry = (id: number) => {
    if (window.confirm('Delete?')) {
      const filtered = wallets[currentBook].filter((i: any) => i.id !== id);
      setWallets({ ...wallets, [currentBook]: filtered });
    }
  };

  const exportData = () => {
    let csv = "Date,Description,Type,Amount\n";
    wallets[currentBook].forEach((i: any) => csv += `${i.dateStr},${i.desc},${i.type},${i.amt}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${currentBook}.csv`; a.click();
  };

  // Derived calculations
  const currentEntries = wallets[currentBook] || [];
  const years = [...new Set(currentEntries.map((i: any) => i.year))];
  if (!years.includes(new Date().getFullYear().toString())) years.push(new Date().getFullYear().toString());
  years.sort((a: any, b: any) => b - a);

  const filteredEntries = currentEntries.filter((i: any) => {
    const mMatch = filterMonth === 'all' || i.month === filterMonth;
    const yMatch = i.year === filterYear;
    const tMatch = currentType === 'all' || i.type === currentType;
    return mMatch && yMatch && tMatch;
  });

  let incTotal = 0, expTotal = 0;
  currentEntries.filter((i: any) => (filterMonth === 'all' || i.month === filterMonth) && i.year === filterYear).forEach((i: any) => {
    if (i.type === 'income') incTotal += i.amt; else expTotal += i.amt;
  });

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#030712] p-8">
        <div className="w-full max-w-xs text-center">
          <h1 className="text-xl font-bold mb-8 tracking-widest uppercase text-yellow-400">mnote001</h1>
          <input type="password" placeholder="PIN" value={loginPass} onChange={(e) => setLoginPass(e.target.value)}
            className="w-full p-4 text-center text-2xl tracking-[0.5em] mb-6 outline-none rounded-xl bg-slate-900 border border-slate-800" />
          <button onClick={handleLogin} className="w-full bg-yellow-400 text-black py-4 rounded-xl font-bold">Login</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="p-3 sticky top-0 z-40 bg-[#030712]/90 backdrop-blur-md border-b border-white/5">
        <div className="flex justify-between items-center px-1 mb-2">
          <div className="flex items-center gap-1">
            <select value={currentBook} onChange={(e) => setCurrentBook(e.target.value)} className="bg-transparent border-none text-yellow-400 font-bold text-base focus:ring-0 p-0 pr-6 max-w-[150px] truncate">
              {Object.keys(wallets).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <button onClick={() => { setRenameInput(currentBook); setIsRenameModalOpen(true); }} className="text-slate-500 text-xs p-1"><i className="fa-solid fa-pen"></i></button>
            <button onClick={() => setIsBookModalOpen(true)} className="text-slate-500 text-xs p-1"><i className="fa-solid fa-folder-plus"></i></button>
          </div>
          <div className="flex gap-4 text-slate-400 text-sm">
            <button onClick={exportData}><i className="fa-solid fa-file-csv"></i></button>
            <button onClick={() => location.reload()}><i className="fa-solid fa-power-off"></i></button>
          </div>
        </div>
        <div className="flex gap-1.5">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="p-1.5 text-[10px] flex-1 outline-none">
            <option value="all">All Months</option>
            {MONTHS.map((m, i) => <option key={i} value={i.toString()}>{m}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="p-1.5 text-[10px] w-20 outline-none">
            {years.map((y: any) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <div className="p-6 rounded-[2rem] balance-gradient shadow-2xl relative overflow-hidden">
          <p className="text-white/70 text-[9px] font-bold uppercase tracking-widest mb-1">{currentBook} Balance</p>
          <h1 className="text-5xl font-extrabold text-white tracking-tighter mb-5">{(incTotal - expTotal).toLocaleString()}</h1>
          <div className="flex gap-4 pt-4 border-t border-white/10">
            <div className="flex-1"><p className="text-[8px] text-white/60 uppercase">In</p><p className="text-sm font-bold text-green-300">+{incTotal.toLocaleString()}</p></div>
            <div className="flex-1 text-right"><p className="text-[8px] text-white/60 uppercase">Out</p><p className="text-sm font-bold text-red-300">-{expTotal.toLocaleString()}</p></div>
          </div>
        </div>

        <div className="flex gap-2 px-1">
          <button onClick={() => setCurrentType('all')} className={`filter-tab ${currentType === 'all' ? 'tab-active' : ''}`}>All</button>
          <button onClick={() => setCurrentType('income')} className={`filter-tab ${currentType === 'income' ? 'tab-active' : ''}`}>Income</button>
          <button onClick={() => setCurrentType('expense')} className={`filter-tab ${currentType === 'expense' ? 'tab-active' : ''}`}>Expense</button>
        </div>

        <div className="space-y-1">
          {filteredEntries.map((item: any) => (
            <div key={item.id} className="p-5 list-card rounded-2xl flex justify-between items-center" onClick={() => openEntryModal(item.id)}>
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  <i className={`fa-solid ${item.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down'} text-[11px]`}></i>
                </div>
                <div><h4 className="font-semibold text-[15px] text-white tracking-tight">{item.desc}</h4><p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">{item.dateStr}</p></div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-bold text-[16px] ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{item.amt.toLocaleString()}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteEntry(item.id); }} className="text-slate-700 p-2 ml-1"><i className="fa-solid fa-trash-can text-sm"></i></button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <button onClick={() => openEntryModal()} className="fixed bottom-6 right-6 w-14 h-14 bg-yellow-400 text-black rounded-2xl shadow-xl z-50 flex items-center justify-center text-xl active:scale-90 transition"><i className="fa-solid fa-plus"></i></button>

      {/* Entry Modal */}
      {isEntryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-yellow-400">{editId ? "Edit Record" : "New Record"}</h3>
              <button onClick={() => setIsEntryModalOpen(false)} className="text-slate-500 text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <input type="text" value={entryDesc} onChange={(e) => setEntryDesc(e.target.value)} placeholder="အကြောင်းအရာ" className="w-full p-4 outline-none" />
              <div className="flex gap-2">
                <input type="number" value={entryAmt} onChange={(e) => setEntryAmt(e.target.value)} placeholder="ပမာဏ" className="flex-1 p-4 outline-none" inputMode="decimal" />
                <select value={entryType} onChange={(e) => setEntryType(e.target.value)} className="w-32 p-4 outline-none">
                  <option value="expense">Out (-)</option>
                  <option value="income">In (+)</option>
                </select>
              </div>
              <button onClick={saveEntry} className="w-full bg-yellow-400 text-black py-4 rounded-xl font-bold">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Book Modal */}
      {isBookModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-yellow-400 mb-6">စာရင်းစာအုပ်အသစ်</h3>
            <input type="text" value={newBookName} onChange={(e) => setNewBookName(e.target.value)} placeholder="အမည်ပေးပါ" className="w-full p-4 mb-6 outline-none" />
            <div className="flex gap-4">
              <button onClick={() => setIsBookModalOpen(false)} className="flex-1 py-4 text-slate-500">Cancel</button>
              <button onClick={createNewBook} className="flex-1 bg-yellow-400 text-black py-4 rounded-xl font-bold">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {isRenameModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-yellow-400 mb-6">စာရင်းအမည်ပြောင်းရန်</h3>
            <input type="text" value={renameInput} onChange={(e) => setRenameInput(e.target.value)} className="w-full p-4 mb-6 outline-none" />
            <div className="flex gap-4">
              <button onClick={() => setIsRenameModalOpen(false)} className="flex-1 py-4 text-slate-500">Cancel</button>
              <button onClick={renameBook} className="flex-1 bg-yellow-400 text-black py-4 rounded-xl font-bold">Update</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
