'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CheckInPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const applyUrl = typeof window !== 'undefined' ? `${window.location.origin}/apply` : '';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase.from('inspection_visitors').insert([
        {
          first_name: formData.get('firstName'),
          last_name: formData.get('lastName'),
          email: formData.get('email'),
          phone: formData.get('phone'),
        },
      ]);

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4 antialiased">
        <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-white/60 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-[#34C759]/15 text-[#34C759] rounded-full flex items-center justify-center mx-auto text-3xl font-semibold">
            ✓
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">You're Checked In</h1>
            <p className="text-slate-500 text-sm mt-1.5 font-normal">Welcome to today's open inspection.</p>
          </div>

          <div className="p-6 bg-slate-100/70 border border-slate-200/60 rounded-2xl space-y-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Tenancy Application
            </span>
            
            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200/60">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(applyUrl)}`} 
                  alt="Application Form QR Code"
                  className="w-32 h-32 rounded-lg"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Scan the code above or tap below to launch the residential tenancy application.
            </p>

            <Link
              href="/apply"
              className="block w-full bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm text-sm text-center"
            >
              Start Application →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F2F7] py-10 px-4 flex items-center justify-center antialiased">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-white/60">
        <div className="mb-8 text-center space-y-2">
          <div className="inline-block px-3 py-1 bg-[#007AFF]/10 text-[#007AFF] text-xs font-semibold rounded-full tracking-wide">
            Open Home Inspection
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome</h1>
          <p className="text-sm text-slate-500">Please enter your details to register attendance.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">First Name</label>
              <input 
                required 
                name="firstName" 
                type="text" 
                placeholder="Jane" 
                className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF] text-slate-900 placeholder:text-slate-400 text-sm transition-all" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Last Name</label>
              <input 
                required 
                name="lastName" 
                type="text" 
                placeholder="Smith" 
                className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF] text-slate-900 placeholder:text-slate-400 text-sm transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Mobile Phone</label>
            <input 
              required 
              name="phone" 
              type="tel" 
              placeholder="0400 000 000" 
              className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF] text-slate-900 placeholder:text-slate-400 text-sm transition-all" 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
            <input 
              required 
              name="email" 
              type="email" 
              placeholder="jane.smith@example.com" 
              className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF] text-slate-900 placeholder:text-slate-400 text-sm transition-all" 
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm text-sm mt-4 disabled:bg-slate-300"
          >
            {loading ? 'Checking in...' : 'Check In'}
          </button>
        </form>
      </div>
    </main>
  );
}