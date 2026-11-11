'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [passcode, setPasscode] = useState('');
  const [authed, setAuthed] = useState(false);
  const [apps, setApps] = useState<any[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'inspect2024') {
      setAuthed(true);
      const { data } = await supabase.from('applications').select('*').order('created_at', { ascending: false });
      setApps(data || []);
    } else {
      alert('Invalid Passcode');
    }
  };

  if (!authed) {
    return (
      <main className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-6 rounded-xl border border-neutral-200 max-w-sm w-full space-y-3">
          <h1 className="text-lg font-bold">Landlord Access</h1>
          <input
            type="password"
            placeholder="Enter passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-md font-semibold text-sm">
            View Applications
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Received Applications ({apps.length})</h1>
      <div className="space-y-3">
        {apps.map((app) => (
          <div key={app.id} className="p-4 bg-white border border-neutral-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="font-bold text-neutral-900">{app.full_name}</div>
              <div className="text-sm text-neutral-600">{app.phone} • {app.email}</div>
              <div className="text-xs text-neutral-500 mt-1">
                Income: <strong>${app.weekly_income}/wk</strong> ({app.employment_status}) • Move-in: {app.move_in_date}
              </div>
            </div>
            <div className="flex gap-2">
              <a href={app.id_document_url} target="_blank" rel="noreferrer" className="text-xs bg-neutral-100 hover:bg-neutral-200 font-semibold px-3 py-2 rounded-lg">
                View ID
              </a>
              <a href={app.payslip_url} target="_blank" rel="noreferrer" className="text-xs bg-neutral-100 hover:bg-neutral-200 font-semibold px-3 py-2 rounded-lg">
                View Payslip
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}