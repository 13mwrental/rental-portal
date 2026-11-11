'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ApplicationPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      // 1. Upload Payslip
      const payslipFile = formData.get('payslip') as File;
      const payslipPath = `payslips/${Date.now()}_${payslipFile.name.replace(/\s+/g, '_')}`;
      const { error: payErr } = await supabase.storage.from('tenant-docs').upload(payslipPath, payslipFile);
      if (payErr) throw payErr;
      const payslipUrl = supabase.storage.from('tenant-docs').getPublicUrl(payslipPath).data.publicUrl;

      // 2. Upload ID
      const idFile = formData.get('idDocument') as File;
      const idPath = `ids/${Date.now()}_${idFile.name.replace(/\s+/g, '_')}`;
      const { error: idErr } = await supabase.storage.from('tenant-docs').upload(idPath, idFile);
      if (idErr) throw idErr;
      const idUrl = supabase.storage.from('tenant-docs').getPublicUrl(idPath).data.publicUrl;

      // 3. Save Record
      const { error: dbErr } = await supabase.from('applications').insert([
        {
          full_name: formData.get('fullName'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          current_address: formData.get('address'),
          employment_status: formData.get('employment'),
          weekly_income: Number(formData.get('income')),
          move_in_date: formData.get('moveInDate'),
          id_document_url: idUrl,
          payslip_url: payslipUrl,
        },
      ]);
      if (dbErr) throw dbErr;

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
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">✓</div>
          <h2 className="text-xl font-bold text-neutral-900">Application Submitted</h2>
          <p className="text-neutral-600 mt-2 text-sm leading-relaxed">
            Your tenancy application and documents have been submitted directly to the landlord.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-100 py-6 px-4">
      <div className="max-w-lg mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-neutral-200">
        <div className="mb-6">
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            Direct Application
          </span>
          <h1 className="text-2xl font-bold text-neutral-900 mt-2">Residential Tenancy Form</h1>
          <p className="text-xs text-neutral-500 mt-1">Please provide accurate information for verification.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">Full Legal Name</label>
            <input required name="fullName" type="text" placeholder=" " className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-blue-600" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">Email</label>
              <input required name="email" type="email" placeholder="abc@example.com" className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">Mobile Phone</label>
              <input required name="phone" type="tel" placeholder="0400 000 000" className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-blue-600" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">Current Residential Address</label>
            <input required name="address" type="text" placeholder="Unit, Street, Suburb, Postcode" className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-blue-600" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">Employment</label>
              <select name="employment" className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-blue-600 bg-white">
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Casual">Casual</option>
                <option value="Self-employed">Self-employed</option>
                <option value="Student">Student</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">Net Weekly Income ($AUD)</label>
              <input required name="income" type="number" min="0" placeholder="" className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-blue-600" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">Preferred Move-in Date</label>
            <input required name="moveInDate" type="date" className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none focus:border-blue-600" />
          </div>

          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3">
            <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide block">Verification Documents</span>
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Photo ID (Passport / Driver Licence)</label>
              <input required name="idDocument" type="file" accept="image/*,.pdf" className="w-full text-xs text-neutral-500 file:mr-2 file:py-1.5 file:px-3 file:border-0 file:rounded-md file:bg-neutral-200 file:font-semibold" />
            </div>
            <div>
              <label className="block text-xs text-neutral-600 mb-1">Proof of Income (Recent Payslip)</label>
              <input required name="payslip" type="file" accept="image/*,.pdf" className="w-full text-xs text-neutral-500 file:mr-2 file:py-1.5 file:px-3 file:border-0 file:rounded-md file:bg-neutral-200 file:font-semibold" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-150 disabled:bg-neutral-400"
          >
            {loading ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </main>
  );
}