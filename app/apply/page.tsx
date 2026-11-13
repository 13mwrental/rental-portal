'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import frontViewImg from '../../utils/images/frontview.png';

export default function ApplicationPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leaseTerm, setLeaseTerm] = useState(12);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const payslipFile = formData.get('payslip') as File;
      const payslipPath = `payslips/${Date.now()}_${payslipFile.name.replace(/\s+/g, '_')}`;
      const { error: payErr } = await supabase.storage.from('tenant-docs').upload(payslipPath, payslipFile);
      if (payErr) throw payErr;
      const payslipUrl = supabase.storage.from('tenant-docs').getPublicUrl(payslipPath).data.publicUrl;

      const idFile = formData.get('idDocument') as File;
      const idPath = `ids/${Date.now()}_${idFile.name.replace(/\s+/g, '_')}`;
      const { error: idErr } = await supabase.storage.from('tenant-docs').upload(idPath, idFile);
      if (idErr) throw idErr;
      const idUrl = supabase.storage.from('tenant-docs').getPublicUrl(idPath).data.publicUrl;

      const { error: dbErr } = await supabase.from('applications').insert([
        {
          full_name: `${formData.get('firstName')} ${formData.get('lastName')}`,
          email: formData.get('email'),
          phone: formData.get('phone'),
          current_address: formData.get('address'),
          employment_status: formData.get('employment'),
          weekly_income: Number(formData.get('income')),
          move_in_date: formData.get('moveInDate'),
          lease_term: leaseTerm,
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
      <main className="min-h-screen bg-[#F2F2F7] flex items-center justify-center p-4 antialiased">
        <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-white/60 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-[#34C759]/15 text-[#34C759] rounded-full flex items-center justify-center mx-auto text-3xl font-semibold">✓</div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Application Submitted</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Your tenancy application has been sent securely to the landlord. Good luck!
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F2F7] py-10 px-4 antialiased">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Property Card Summary */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-white/60 overflow-hidden sticky top-6">
            <div className="h-48 bg-slate-200 relative">
              <img 
                src={frontViewImg.src} 
                alt="Property" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-4">
              <div>
                <span className="text-xs font-semibold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-1 rounded-full">
                  Featured Property
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2">13 Ben Hogan Ct</h2>
                <p className="text-xs text-slate-500">Mount Waverley, Victoria</p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rent</span>
                  <span className="font-bold text-slate-900">$690 per week</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bond</span>
                  <span className="font-bold text-slate-900">$3,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Available</span>
                  <span className="font-bold text-emerald-600">Now</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-around text-slate-600 text-xs font-semibold">
                <span>🛏️ 3 Beds</span>
                <span>🛁 1 Baths</span>
                <span>🚗 1 Parking</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Application Form Sections */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-white/60">
            
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tenancy Application Form</h1>
              <p className="text-xs text-slate-500 mt-1">Complete all sections below to submit your application to the property manager.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* SECTION: Lease Preferences */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Lease Preferences</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Preferred Lease Start Date</label>
                  <input required name="moveInDate" type="date" className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF] text-slate-900 text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Initial Lease Term (Months)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[6, 12, 18, 24].map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setLeaseTerm(m)}
                        className={`py-2.5 rounded-xl font-semibold text-xs transition-all border ${leaseTerm === m ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-200/60 hover:bg-slate-200'}`}
                      >
                        {m} Months
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION: Personal Details */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Personal Details</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">First Name</label>
                    <input required name="firstName" type="text" placeholder="" className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF] text-slate-900 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Last Name</label>
                    <input required name="lastName" type="text" placeholder="" className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF] text-slate-900 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input required name="email" type="email" placeholder="abc@example.com" className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF] text-slate-900 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Mobile Phone</label>
                    <input required name="phone" type="tel" placeholder="0400 000 000" className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF] text-slate-900 text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Current Address</label>
                  <input required name="address" type="text" placeholder="Street, Suburb, Postcode" className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF] text-slate-900 text-sm" />
                </div>
              </div>

              {/* SECTION: Employment & Income */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Employment & Income</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Employment Status</label>
                    <select name="employment" className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF] text-slate-900 text-sm">
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Casual">Casual</option>
                      <option value="Self-employed">Self-employed</option>
                      <option value="Student">Student</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Net Weekly Income ($AUD)</label>
                    <input required name="income" type="number" min="0" placeholder="$" className="w-full px-4 py-3 bg-slate-100/80 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-[#007AFF] text-slate-900 text-sm" />
                  </div>
                </div>
              </div>

              {/* SECTION: Verification Documents */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Verification Documents</h3>

                <div className="p-4 bg-slate-100/60 rounded-2xl border border-slate-200/60 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Photo ID (Driver Licence or Passport)</label>
                    <input required name="idDocument" type="file" accept="image/*,.pdf" className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white file:text-[#007AFF] file:font-semibold shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Proof of Income (Latest Payslip)</label>
                    <input required name="payslip" type="file" accept="image/*,.pdf" className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-white file:text-[#007AFF] file:font-semibold shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Terms and Submit */}
              <div className="pt-4 border-t border-slate-100 space-y-4 text-center">
                <p className="text-[11px] text-slate-500">
                  By submitting an application, you accept our <span className="text-[#007AFF] underline cursor-pointer">Terms and Conditions</span> and confirm all information provided is accurate.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#E5002B] hover:bg-[#C80024] active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all shadow-md text-base disabled:bg-slate-300"
                >
                  {loading ? 'Submitting Application...' : 'Submit application'}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </main>
  );
}