'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [passcode, setPasscode] = useState('');
  const [authed, setAuthed] = useState(false);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'visitors' | 'apps'>('visitors');

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Check-ins
    const { data: vData, error: vErr } = await supabase
      .from('inspection_visitors')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (vErr) console.error('Error fetching visitors:', vErr.message);
    else setVisitors(vData || []);

    // Fetch Applications
    const { data: aData, error: aErr } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (aErr) console.error('Error fetching applications:', aErr.message);
    else setApps(aData || []);

    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'inspect2024') {
      setAuthed(true);
      await fetchData();
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
            Login
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button 
            onClick={() => setTab('visitors')}
            className={`font-bold text-sm px-4 py-2 rounded-lg transition ${tab === 'visitors' ? 'bg-blue-600 text-white' : 'bg-neutral-200 text-neutral-800'}`}
          >
            Check-Ins ({visitors.length})
          </button>
          <button 
            onClick={() => setTab('apps')}
            className={`font-bold text-sm px-4 py-2 rounded-lg transition ${tab === 'apps' ? 'bg-blue-600 text-white' : 'bg-neutral-200 text-neutral-800'}`}
          >
            Applications ({apps.length})
          </button>
        </div>

        <button 
          onClick={fetchData} 
          disabled={loading}
          className="text-xs bg-neutral-800 hover:bg-neutral-900 text-white font-semibold px-3 py-2 rounded-lg"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Data'}
        </button>
      </div>

      {tab === 'visitors' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold mb-3">Inspection Attendees</h2>
          {visitors.length === 0 ? (
            <div className="p-6 text-center bg-white border border-neutral-200 rounded-xl text-neutral-500 text-sm">
              No check-ins recorded yet.
            </div>
          ) : (
            visitors.map((v) => (
              <div key={v.id} className="p-4 bg-white border border-neutral-200 rounded-xl flex justify-between items-center shadow-sm">
                <div>
                  <div className="font-bold text-neutral-900">{v.first_name} {v.last_name}</div>
                  <div className="text-sm text-neutral-600">{v.phone} • {v.email}</div>
                </div>
                <div className="text-xs text-neutral-400">
                  {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'apps' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold mb-3">Submitted Applications</h2>
          {apps.length === 0 ? (
            <div className="p-6 text-center bg-white border border-neutral-200 rounded-xl text-neutral-500 text-sm">
              No applications submitted yet.
            </div>
          ) : (
            apps.map((app) => (
              <div key={app.id} className="p-4 bg-white border border-neutral-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
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
            ))
          )}
        </div>
      )}
    </main>
  );
}