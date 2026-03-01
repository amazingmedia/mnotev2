"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  // --- Notification (Toast) States ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  useEffect(() => {
    if (toast.type) {
      const timer = setTimeout(() => setToast({ message: '', type: null }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // --- App States ---
  const [books, setBooks] = useState<string[]>([]);
  const [currentBook, setCurrentBook] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auth/Modal States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
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
  const [currentType, setCurrentType] = useState("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());

  // --- Pull-to-Refresh Logic ---
  const [startY, setStartY] = useState(0);

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (mainEl.scrollTop === 0) {
        setStartY(e.touches[0].pageY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0].pageY;
      const distance = endY - startY;
      if (mainEl.scrollTop === 0 && distance > 150) {
        window.location.reload();
      }
    };

    mainEl.addEventListener("touchstart", handleTouchStart);
    mainEl.addEventListener("touchend", handleTouchEnd);
    return () => {
      mainEl.removeEventListener("touchstart", handleTouchStart);
      mainEl.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startY]);

  useEffect(() => {
    setIsMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchBooksAndData();
    }
  }, [user]);

  const fetchBooksAndData = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('entries')
      .select('book_name')
      .eq('user_id', user.id);

    if (!error && data) {
      const dbBooks = Array.from(new Set(data.map((i: any) => i.book_name)));
      const finalBooks = dbBooks.length > 0 ? dbBooks : ["အိမ်သုံးစရိတ်"];
      setBooks(finalBooks);
      
      const savedBook = localStorage.getItem(`active_book_${user.id}`);
      if (savedBook && finalBooks.includes(savedBook)) {
        setCurrentBook(savedBook);
      } else {
        setCurrentBook(finalBooks[0]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user && currentBook) {
      localStorage.setItem(`active_book_${user.id}`, currentBook);
      fetchEntries();
    }
  }, [currentBook, user]);

  const fetchEntries = async () => {
    if (!user || !currentBook) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('book_name', currentBook)
      .eq('user_id', user.id)
      .order('id', { ascending: false });

    if (!error && data) setEntries(data);
    setIsLoading(false);
  };

const createNewBook = async () => {
    const name = newBookName.trim();
    if (!name || books.includes(name) || !user) return;
    
    setIsLoading(true);
    const now = new Date();
    
    // Database ထဲမှာ စာအုပ်နာမည်ကို စာရင်းတစ်ခုအနေနဲ့ အရင်သွားမှတ်ခိုင်းတာပါ
    const { error } = await supabase.from('entries').insert([{
      user_id: user.id,
      book_name: name,
      desc_text: "စာအုပ်စတင်ဖွင့်လှစ်ခြင်း",
      amt: 0,
      entry_type: "income",
      date_str: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      month_str: now.getMonth().toString(),
      year_str: now.getFullYear().toString()
    }]);

    if (error) {
      showToast("Error: " + error.message, "error");
    } else {
      // Database မှာ အောင်မြင်မှ App ထဲက List မှာ ပြမယ်
      setBooks(prev => [name, ...prev]);
      setCurrentBook(name);
      setNewBookName("");
      setIsBookModalOpen(false);
      showToast(`စာအုပ်သစ် "${name}" ကို Database တွင် မှတ်သားပြီးပါပြီ`, "success");
    }
    setIsLoading(false);
  };
  const renameBook = async () => {
    const newName = renameInput.trim();
    if (!newName || newName === currentBook || books.includes(newName) || !user) return setIsRenameModalOpen(false);
    
    if (!window.navigator.onLine) {
      showToast("အင်တာနက်မရှိသဖြင့် အမည်ပြောင်း၍မရပါ", "error");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase
      .from('entries')
      .update({ book_name: newName })
      .eq('book_name', currentBook)
      .eq('user_id', user.id);

    if (error) {
      showToast("Error: " + error.message, "error");
    } else {
      const updatedBooks = books.map(b => b === currentBook ? newName : b);
      setBooks(updatedBooks);
      setCurrentBook(newName);
      setIsRenameModalOpen(false);
      showToast("စာအုပ်အမည် ပြောင်းပြီးပါပြီ", "success");
    }
    setIsLoading(false);
  };

  const handleAuth = async () => {
    setAuthError("");
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const saveEntry = async () => {
    const amt = parseFloat(entryAmt);
    if (!entryDesc || isNaN(amt) || !user) return;

    if (!window.navigator.onLine) {
      showToast("အင်တာနက်မရှိသဖြင့် သိမ်းဆည်း၍မရပါ", "error");
      return;
    }

    setIsLoading(true);
    let error;

    if (editId) {
      const { error: err } = await supabase.from('entries').update({ desc_text: entryDesc, amt, entry_type: entryType }).eq('id', editId).eq('user_id', user.id);
      error = err;
    } else {
      const now = new Date();
      const { error: err } = await supabase.from('entries').insert([{
        user_id: user.id, book_name: currentBook, desc_text: entryDesc, amt, entry_type: entryType,
        date_str: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        month_str: now.getMonth().toString(), year_str: now.getFullYear().toString()
      }]);
      error = err;
    }

    if (error) {
      showToast("Error: " + error.message, "error");
    } else {
      showToast(editId ? "ပြင်ဆင်ပြီးပါပြီ" : "မှတ်တမ်းအသစ် သိမ်းဆည်းပြီးပါပြီ", "success");
      setIsEntryModalOpen(false);
      fetchEntries();
    }
    setIsLoading(false);
  };

  const deleteEntry = async (id: number) => {
    if (window.confirm('Delete?')) {
      if (!window.navigator.onLine) {
        showToast("အင်တာနက်မရှိသဖြင့် ဖျက်၍မရပါ", "error");
        return;
      }
      setIsLoading(true);
      const { error } = await supabase.from('entries').delete().eq('id', id).eq('user_id', user.id);
      if (error) {
        showToast("Error: " + error.message, "error");
      } else {
        showToast("ဖျက်ပြီးပါပြီ", "success");
        fetchEntries();
      }
    }
  };

  if (!isMounted) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#030712] z-[100]">
        <div className="w-full max-w-xs text-center text-yellow-400 p-8">
          <h1 className="text-xl font-bold mb-8 uppercase tracking-widest">Money Note</h1>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 mb-4 rounded-xl" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 mb-6 rounded-xl" />
          {authError && <p className="text-red-400 text-xs mb-4">{authError}</p>}
          <button onClick={handleAuth} className="w-full bg-yellow-400 text-black py-4 rounded-xl font-bold mb-6 uppercase">{isSignUp ? "Sign Up" : "Login"}</button>
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-slate-500">{isSignUp ? "Already have account? Login" : "No account? Sign Up"}</button>
        </div>
      </div>
    );
  }

  const filteredEntries = entries.filter((i: any) => {
    const mMatch = filterMonth === 'all' || i.month_str === filterMonth;
    const yMatch = i.year_str === filterYear;
    const tMatch = currentType === 'all' || i.entry_type === currentType;
    return mMatch && yMatch && tMatch;
  });

  let incTotal = 0, expTotal = 0;
  entries.filter((i: any) => (filterMonth === 'all' || i.month_str === filterMonth) && i.year_str === filterYear).forEach((i: any) => {
    if (i.entry_type === 'income') incTotal += parseFloat(i.amt); else expTotal += parseFloat(i.amt);
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#030712]">
      <header className="flex-none p-3 z-40 bg-[#030712]/90 backdrop-blur-md border-b border-white/5">
        <div className="flex justify-between items-center px-1 mb-2">
          <div className="flex items-center gap-1">
            <select value={currentBook} onChange={(e) => setCurrentBook(e.target.value)} className="bg-transparent text-yellow-400 font-bold border-none focus:ring-0 truncate max-w-[150px]">
              {books.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <button onClick={() => { setRenameInput(currentBook); setIsRenameModalOpen(true); }} className="text-slate-500 p-1"><i className="fa-solid fa-pen text-[10px]"></i></button>
            <button onClick={() => setIsBookModalOpen(true)} className="text-slate-500 p-1"><i className="fa-solid fa-folder-plus text-xs"></i></button>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-red-400 text-sm"><i className="fa-solid fa-power-off"></i></button>
        </div>
        <div className="flex gap-1.5">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="p-1.5 text-[10px] flex-1">
            <option value="all">All Months</option>
            {MONTHS.map((m, i) => <option key={i} value={i.toString()}>{m}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="p-1.5 text-[10px] w-20">
            <option value="2026">2026</option>
          </select>
        </div>
      </header>

      <div className="flex-none p-4 pb-2 space-y-4">
        <div className="p-6 rounded-[2rem] balance-gradient text-white shadow-2xl relative overflow-hidden">
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">{currentBook} Balance {isLoading && "(Syncing...)"}</p>
          <h1 className="text-5xl font-extrabold tracking-tighter my-3">{(incTotal - expTotal).toLocaleString()}</h1>
          <div className="flex gap-4 pt-4 border-t border-white/10 text-xs">
            <div className="flex-1"><p className="opacity-60 uppercase text-[8px]">In</p><p className="font-bold text-green-300">+{incTotal.toLocaleString()}</p></div>
            <div className="flex-1 text-right"><p className="opacity-60 uppercase text-[8px]">Out</p><p className="font-bold text-red-300">-{expTotal.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="flex gap-2 px-1">
          {["all", "income", "expense"].map(t => (
            <button key={t} onClick={() => setCurrentType(t)} className={`filter-tab ${currentType === t ? 'tab-active' : ''}`}>{t.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 pb-28 space-y-1 no-scrollbar relative">
        <div className="opacity-90 transition-opacity" style={{ opacity: isLoading ? 0.5 : 1 }}>
          {filteredEntries.length === 0 && !isLoading && <p className="text-center text-slate-500 text-sm mt-10">မှတ်တမ်းမရှိသေးပါ။</p>}
          {filteredEntries.map((item: any) => (
            <div key={item.id} className="p-5 list-card rounded-2xl flex justify-between items-center" onClick={() => { setEditId(item.id); setEntryDesc(item.desc_text); setEntryAmt(item.amt); setEntryType(item.entry_type); setIsEntryModalOpen(true); }}>
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center ${item.entry_type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  <i className={`fa-solid ${item.entry_type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down'} text-[10px]`}></i>
                </div>
                <div><h4 className="font-semibold text-white text-sm">{item.desc_text}</h4><p className="text-[9px] text-slate-500 font-bold uppercase">{item.date_str}</p></div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-bold ${item.entry_type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{item.amt.toLocaleString()}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteEntry(item.id); }} className="text-slate-700 p-2 ml-1"><i className="fa-solid fa-trash-can text-sm"></i></button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <button onClick={() => { setEditId(null); setEntryDesc(""); setEntryAmt(""); setIsEntryModalOpen(true); }} className="fixed bottom-10 right-6 w-14 h-14 bg-yellow-400 text-black rounded-2xl shadow-xl z-50 flex items-center justify-center text-xl active:scale-90 transition"><i className="fa-solid fa-plus"></i></button>

      {/* Toast Notification */}
      {toast.type && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl transition-all animate-bounce ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white font-bold text-sm flex items-center gap-2`}>
          <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
          {toast.message}
        </div>
      )}

      {/* Entry Modal */}
      {isEntryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-yellow-400">{editId ? "Edit" : "New"} Entry</h3><button onClick={() => setIsEntryModalOpen(false)} className="text-slate-500 text-2xl">&times;</button></div>
            <div className="space-y-4">
              <input type="text" value={entryDesc} onChange={(e) => setEntryDesc(e.target.value)} placeholder="အကြောင်းအရာ" className="w-full p-4 rounded-xl bg-slate-800 text-white outline-none" />
              <div className="flex gap-2">
                <input type="number" value={entryAmt} onChange={(e) => setEntryAmt(e.target.value)} placeholder="ပမာဏ" className="flex-1 p-4 rounded-xl bg-slate-800 text-white outline-none" inputMode="decimal" />
                <select value={entryType} onChange={(e) => setEntryType(e.target.value)} className="w-32 p-4 rounded-xl bg-slate-800 text-white outline-none">
                  <option value="expense">Out (-)</option>
                  <option value="income">In (+)</option>
                </select>
              </div>
              <button onClick={saveEntry} className="w-full bg-yellow-400 text-black py-4 rounded-xl font-bold uppercase">{isLoading ? "Saving..." : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Book Modal */}
      {isBookModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-yellow-400 mb-6 uppercase">New Book</h3>
            <input type="text" value={newBookName} onChange={(e) => setNewBookName(e.target.value)} placeholder="နာမည်ပေးပါ" className="w-full p-4 mb-6 rounded-xl bg-slate-800 text-white outline-none" />
            <div className="flex gap-4">
              <button onClick={() => setIsBookModalOpen(false)} className="flex-1 py-4 text-slate-500">Cancel</button>
              <button onClick={createNewBook} className="flex-1 bg-yellow-400 text-black py-4 rounded-xl font-bold uppercase">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {isRenameModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-yellow-400 mb-6 uppercase">Rename Book</h3>
            <input type="text" value={renameInput} onChange={(e) => setRenameInput(e.target.value)} className="w-full p-4 mb-6 rounded-xl bg-slate-800 text-white outline-none" />
            <div className="flex gap-4">
              <button onClick={() => setIsRenameModalOpen(false)} className="flex-1 py-4 text-slate-500">Cancel</button>
              <button onClick={renameBook} className="flex-1 bg-yellow-400 text-black py-4 rounded-xl font-bold uppercase">
                {isLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
