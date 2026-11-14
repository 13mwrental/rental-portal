'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [passcode, setPasscode] = useState('');
  const [authed, setAuthed] = useState(false);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tab, setTab] = useState<'visitors' | 'apps'>('visitors');

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const [visitorsResult, applicationsResult] = await Promise.all([
        supabase.from('inspection_visitors').select('*').order('created_at', { ascending: false }),
        supabase.from('applications').select('*').order('created_at', { ascending: false }),
      ]);

      if (visitorsResult.error) throw visitorsResult.error;
      if (applicationsResult.error) throw applicationsResult.error;

      setVisitors(visitorsResult.data ?? []);
      setApps(applicationsResult.data ?? []);

      const { data: documentRows, error: documentsError } = await supabase
        .from('application_documents')
        .select('id, application_id, document_type, file_name, storage_path');

      if (documentsError) {
        setDocuments([]);
        setErrorMessage(
          `Applications loaded, but supporting documents could not be loaded: ${documentsError.message}`
        );
        return;
      }

      const documentsWithLinks = await Promise.all(
        (documentRows ?? []).map(async (document) => {
          const { data, error } = await supabase.storage
            .from('tenant-docs')
            .createSignedUrl(document.storage_path, 60 * 60);

          return {
            ...document,
            signedUrl: error ? '' : data.signedUrl,
            linkError: error?.message,
          };
        })
      );

      setDocuments(documentsWithLinks);
      const failedLinks = documentsWithLinks.filter((document) => document.linkError);
      if (failedLinks.length > 0) {
        setErrorMessage(
          `${failedLinks.length} supporting document link(s) could not be created. Check storage permissions.`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load dashboard data.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
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
      <main className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4 antialiased">
        <form onSubmit={handleLogin} className="bg-white/80 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-white/60 max-w-sm w-full space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Landlord Access</h1>
            <p className="text-xs text-slate-500 mt-1">Enter your admin passcode to view dashboard</p>
          </div>
          <input
            type="password"
            placeholder="Passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF] text-slate-900 text-sm text-center tracking-widest transition-all"
          />
          <button type="submit" className="w-full bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all shadow-sm text-sm">
            Unlock Dashboard
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F2F7] p-4 sm:p-8 antialiased max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inspection Manager</h1>
          <p className="text-xs text-slate-500">Live attendance and tenancy applications</p>
        </div>

        <button 
          onClick={fetchData} 
          disabled={loading}
          className="self-start sm:self-auto text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Data'}
        </button>
      </div>

      {errorMessage && (
        <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* iOS Segmented Control Tab Switcher */}
      <div className="bg-slate-200/60 p-1 rounded-2xl flex gap-1 mb-6 border border-slate-300/40">
        <button 
          onClick={() => setTab('visitors')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${tab === 'visitors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Check-Ins ({visitors.length})
        </button>
        <button 
          onClick={() => setTab('apps')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${tab === 'apps' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          Applications ({apps.length})
        </button>
      </div>

      {/* Check-ins Tab */}
      {tab === 'visitors' && (
        <div className="space-y-3">
          {visitors.length === 0 ? (
            <div className="p-8 text-center bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl text-slate-400 text-sm">
              No check-ins recorded yet.
            </div>
          ) : (
            visitors.map((v) => (
              <div key={v.id} className="p-4 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl flex justify-between items-center shadow-sm">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{v.first_name} {v.last_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{v.phone} • {v.email}</div>
                </div>
                <div className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                  {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Applications Tab */}
      {tab === 'apps' && (
        <div className="space-y-3">
          {apps.length === 0 ? (
            <div className="p-8 text-center bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl text-slate-400 text-sm">
              No applications submitted yet.
            </div>
          ) : (
            apps.map((app) => (
              <div key={app.id} className="p-5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 text-sm">{app.full_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{app.phone} • {app.email}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Application ID: <span className="font-mono text-slate-700">{app.id}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Submitted: {app.created_at
                      ? new Date(app.created_at).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Time unavailable'}
                  </div>
                  <div className="text-xs text-slate-600 mt-2 bg-slate-100 inline-block px-3 py-1 rounded-lg">
                    Income: <strong className="text-slate-900">${app.weekly_income}/wk</strong> ({app.employment_status}) • Move-in: {app.move_in_date || 'Not provided'} • <strong>Lease: {app.lease_term || 'Not provided'}{app.lease_term ? ' Mos' : ''}</strong>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Occupants: <strong className="text-slate-900">{app.number_of_occupants ?? 'Not provided'}</strong>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Pets: <strong className="text-slate-900">{app.has_pets == null ? 'Not provided' : app.has_pets ? 'Yes' : 'No'}</strong>
                    {app.has_pets && app.pet_details && <> • Details: {app.pet_details}</>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {documents
                      .filter((document) => String(document.application_id) === String(app.id))
                      .map((document) => (
                        document.signedUrl ? (
                          <a
                            key={document.id}
                            href={document.signedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl bg-[#007AFF]/10 px-3.5 py-2 text-xs font-semibold text-[#007AFF] transition-all hover:bg-[#007AFF]/20"
                          >
                            {document.document_type === 'rental_receipt'
                              ? `Rental Receipt: ${document.file_name}`
                              : `${document.document_type === 'photo_id' ? 'Photo ID' : 'Payslip'}: ${document.file_name}`}
                          </a>
                        ) : null
                      ))}
                    {!documents.some((document) => String(document.application_id) === String(app.id)) && (
                      <span className="text-xs text-slate-400">No supporting documents</span>
                    )}
                    {app.id_document_url && (
                      <a
                        href={app.id_document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-[#007AFF]/10 px-3.5 py-2 text-xs font-semibold text-[#007AFF] transition-all hover:bg-[#007AFF]/20"
                      >
                        View ID
                      </a>
                    )}
                    {app.payslip_url && (
                      <a
                        href={app.payslip_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-[#007AFF]/10 px-3.5 py-2 text-xs font-semibold text-[#007AFF] transition-all hover:bg-[#007AFF]/20"
                      >
                        View Payslip
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}