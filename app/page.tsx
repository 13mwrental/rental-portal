'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CheckInPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Get dynamic URL for the application page
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
      <main className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-neutral-200 max-w-md w-full text-center space-y-6">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Check-In Successful!</h1>
            <p className="text-neutral-600 text-sm mt-1">Thank you for attending the inspection today.</p>
          </div>

          <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-4">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
              Ready to Apply for this Property?
            </span>
            
            {/* Live QR Code pointing to /apply */}
            <div className="flex justify-center">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(applyUrl)}`} 
                alt="Application Form QR Code"
                className="w-36 h-36 border p-2 bg-white rounded-lg shadow-sm"
              />
            </div>

            <p className="text-xs text-neutral-500">
              Scan the QR code or click below to start your tenancy application.
            </p>

            <Link
              href="/apply"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition text-sm text-center"
            >
              Start Tenancy Application →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 py-8 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-neutral-200">
        <div className="mb-6 text-center">
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Open Inspection Check-In
          </span>
          <h1 className="text-2xl font-bold text-neutral-900 mt-3">Welcome</h1>
          <p className="text-xs text-neutral-500 mt-1">Please check in to register your attendance.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">First Name</label>
              <input required name="firstName" type="text" placeholder="John" className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">Last Name</label>
              <input required name="lastName" type="text" placeholder="Doe" className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-blue-600" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">Mobile Phone</label>
            <input required name="phone" type="tel" placeholder="0400 000 000" className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-blue-600" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">Email Address</label>
            <input required name="email" type="email" placeholder="john@example.com" className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-blue-600" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-150 disabled:bg-neutral-400 mt-2"
          >
            {loading ? 'Checking in...' : 'Check In to Inspection'}
          </button>
        </form>
      </div>
    </main>
  );
}