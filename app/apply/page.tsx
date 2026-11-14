
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import frontViewImg from '../../utils/images/frontview.png';

type Applicant = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  employmentStatus: string;
  salaryAmount: number;
  salaryFrequency: 'weekly' | 'fortnight' | 'monthly';
  idDocumentFile: File | null;
  payslipFile: File | null;
};

const createApplicant = (id: number): Applicant => ({
  id,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  employmentStatus: '',
  salaryAmount: 0,
  salaryFrequency: 'weekly',
  idDocumentFile: null,
  payslipFile: null,
});

const inputClass =
  'w-full px-4 py-3 bg-slate-100/80 border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF] text-slate-900 text-sm';

const labelClass =
  'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5';

export default function ApplicationPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([
    createApplicant(1),
  ]);

  // No default lease term: applicant must select one.
  const [leaseTerm, setLeaseTerm] = useState<number | ''>('');

  const [numberOfOccupants, setNumberOfOccupants] = useState<number | ''>('');
  const [preferredMoveInDate, setPreferredMoveInDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateApplicant = (
    applicantId: number,
    field: keyof Applicant,
    value: string | number | File | null
  ) => {
    setApplicants((previous) =>
      previous.map((applicant) =>
        applicant.id === applicantId
          ? { ...applicant, [field]: value }
          : applicant
      )
    );
  };

  const addApplicant = () => {
    const newId =
      Math.max(...applicants.map((applicant) => applicant.id), 0) + 1;

    setApplicants((previous) => [
      ...previous,
      createApplicant(newId),
    ]);
  };

  const removeApplicant = (applicantId: number) => {
    if (applicants.length === 1) return;

    setApplicants((previous) =>
      previous.filter((applicant) => applicant.id !== applicantId)
    );
  };

  const handleFileChange = (
    applicantId: number,
    fileType: 'idDocumentFile' | 'payslipFile',
    file: File | null
  ) => {
    updateApplicant(applicantId, fileType, file);
  };

  const uploadDocument = async (
    file: File | null,
    applicantId: number,
    documentType: 'id' | 'payslip'
  ): Promise<string> => {
    if (!file) return '';

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `applications/${Date.now()}_${applicantId}_${documentType}_${safeFileName}`;

    const { error } = await supabase.storage
      .from('tenant-docs')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    const { data } = supabase.storage
      .from('tenant-docs')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (leaseTerm === '') {
      alert('Please select an initial lease term.');
      return;
    }

    if (
      numberOfOccupants === '' ||
      !Number.isInteger(Number(numberOfOccupants)) ||
      Number(numberOfOccupants) < 1
    ) {
      alert('Please enter a valid number of occupants.');
      return;
    }

    if (!preferredMoveInDate) {
      alert('Please select your preferred lease start date.');
      return;
    }

    setLoading(true);

    try {
      const rowsToInsert = await Promise.all(
        applicants.map(async (applicant) => {
          const idUrl = await uploadDocument(
            applicant.idDocumentFile,
            applicant.id,
            'id'
          );

          const payslipUrl = await uploadDocument(
            applicant.payslipFile,
            applicant.id,
            'payslip'
          );

          return {
            full_name: `${applicant.firstName} ${applicant.lastName}`.trim(),
            email: applicant.email,
            phone: applicant.phone,
            current_address: applicant.address,
            employment_status: applicant.employmentStatus,
            weekly_income: applicant.salaryFrequency === 'weekly' ? applicant.salaryAmount  : applicant.salaryFrequency === 'fortnight' ? applicant.salaryAmount / 2 : applicant.salaryAmount * 12 / 52,
            salary_frequency: applicant.salaryFrequency,
            move_in_date: preferredMoveInDate,
            lease_term: leaseTerm,
            number_of_occupants: numberOfOccupants,
            id_document_url: idUrl,
            payslip_url: payslipUrl,
          };
        })
      );

      const { error } = await supabase
        .from('applications')
        .insert(rowsToInsert);

      if (error) {
        throw error;
      }

      setSubmitted(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred.';

      alert(`Unable to submit your application: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#F2F2F7] flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-3xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Application Submitted!
          </h1>
          <p className="text-sm text-slate-600">
            Thank you for submitting your tenancy application.
            Your details have been received for review.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F2F7] py-10 px-4 antialiased">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT COLUMN: PROPERTY SUMMARY */}

        <div className="lg:col-span-1 space-y-6">
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

                <h2 className="text-lg font-bold text-slate-900 mt-2">
                  13 Ben Hogan Ct
                </h2>

                <p className="text-xs text-slate-500">
                  Mount Waverley, Victoria
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rent</span>
                  <span className="font-bold text-slate-900">
                    $690 per week
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Bond</span>
                  <span className="font-bold text-slate-900">
                    $3,000
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Available</span>
                  <span className="font-bold text-emerald-600">
                    Now
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-around text-slate-600 text-xs font-semibold">
                <span>🛏️ 3 Beds</span>
                <span>🛁 1 Bath</span>
                <span>🚗 1 Parking</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: APPLICATION FORM */}

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-white/60">

            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Tenancy Application Form
              </h1>

              <p className="text-xs text-slate-500 mt-1">
                Complete all sections below to submit your application
                to the property manager.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* LEASE PREFERENCES */}

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Lease Preferences
                </h3>

                <div>
                  <label className={labelClass}>
                    Preferred Lease Start Date *
                  </label>

                  <input
                    type="date"
                    name="moveInDate"
                    required
                    value={preferredMoveInDate}
                    onChange={(event) =>
                      setPreferredMoveInDate(event.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Initial Lease Term (Months) *
                  </label>

                  <select
                    name="leaseTerm"
                    required
                    value={leaseTerm}
                    onChange={(event) =>
                      setLeaseTerm(
                        event.target.value === ''
                          ? ''
                          : Number(event.target.value)
                      )
                    }
                    className={inputClass}
                  >
                    <option value="">Select lease term</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="18">18 Months</option>
                    <option value="24">24 Months</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    How Many People Will Be Living at This Property? *
                  </label>

                  <input
                    type="number"
                    name="numberOfOccupants"
                    min="1"
                    max="20"
                    step="1"
                    required
                    value={numberOfOccupants}
                    onChange={(event) =>
                      setNumberOfOccupants(
                        event.target.value === ''
                          ? ''
                          : Number(event.target.value)
                      )
                    }
                    placeholder="Enter total number of occupants"
                    className={inputClass}
                  />

                  <p className="text-xs text-slate-500 mt-1">
                    Include all adults and children, including the applicants.
                  </p>
                </div>
              </div>

              {/* APPLICANT SECTIONS */}

              {applicants.map((applicant, index) => (
                <div
                  key={applicant.id}
                  className="space-y-4 pt-5 border-t border-slate-100"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Applicant {index + 1} Details
                    </h3>

                    {applicants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeApplicant(applicant.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800"
                      >
                        Remove Applicant
                      </button>
                    )}
                  </div>

                  {/* PERSONAL DETAILS */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>First Name *</label>
                      <input
                        type="text"
                        required
                        value={applicant.firstName}
                        onChange={(event) =>
                          updateApplicant(
                            applicant.id,
                            'firstName',
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Last Name *</label>
                      <input
                        type="text"
                        required
                        value={applicant.lastName}
                        onChange={(event) =>
                          updateApplicant(
                            applicant.id,
                            'lastName',
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Email Address *</label>
                      <input
                        type="email"
                        required
                        value={applicant.email}
                        onChange={(event) =>
                          updateApplicant(
                            applicant.id,
                            'email',
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Mobile Phone *</label>
                      <input
                        type="tel"
                        required
                        value={applicant.phone}
                        onChange={(event) =>
                          updateApplicant(
                            applicant.id,
                            'phone',
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Current Address *</label>
                    <input
                      type="text"
                      required
                      value={applicant.address}
                      onChange={(event) =>
                        updateApplicant(
                          applicant.id,
                          'address',
                          event.target.value
                        )
                      }
                      className={inputClass}
                    />
                  </div>

                  {/* EMPLOYMENT AND INCOME */}

                  <div className="pt-3 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Employment & Income
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>
                          Employment Status *
                        </label>

                        <select
                          required
                          value={applicant.employmentStatus}
                          onChange={(event) =>
                            updateApplicant(
                              applicant.id,
                              'employmentStatus',
                              event.target.value
                            )
                          }
                          className={inputClass}
                        >
                          <option value="">Select employment status</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Casual">Casual</option>
                          <option value="Self-employed">Self-employed</option>
                          <option value="Student">Student</option>
                          <option value="Unemployed">Unemployed</option>
                          <option value="Retired">Retired</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelClass}>
                          Income Amount ($AUD) *
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={applicant.salaryAmount}
                          onChange={(event) =>
                            updateApplicant(
                              applicant.id,
                              'salaryAmount',
                              Number(event.target.value)
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Income Frequency *
                      </label>

                      <select
                        required
                        value={applicant.salaryFrequency}
                        onChange={(event) =>
                          updateApplicant(
                            applicant.id,
                            'salaryFrequency',
                            event.target.value
                          )
                        }
                        className={inputClass}
                      >
                        <option value="weekly">Weekly</option>
                        <option value="fortnight">Fortnightly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  {/* DOCUMENTS */}

                  <div className="pt-3 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Verification Documents
                    </h4>

                    <div className="p-4 bg-slate-100/60 rounded-2xl border border-slate-200/60 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">
                          Photo ID (Driver Licence or Passport)
                        </label>

                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(event) =>
                            handleFileChange(
                              applicant.id,
                              'idDocumentFile',
                              event.target.files?.[0] ?? null
                            )
                          }
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:border-0 file:rounded-xl file:bg-white file:text-[#007AFF] file:font-semibold shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2">
                          Proof of Income (Latest Payslip)
                        </label>

                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(event) =>
                            handleFileChange(
                              applicant.id,
                              'payslipFile',
                              event.target.files?.[0] ?? null
                            )
                          }
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:border-0 file:rounded-xl file:bg-white file:text-[#007AFF] file:font-semibold shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* ADD ANOTHER APPLICANT */}

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={addApplicant}
                  className="w-full border-2 border-dashed border-[#007AFF]/40 text-[#007AFF] hover:bg-[#007AFF]/5 font-semibold py-3 rounded-xl transition-all text-sm"
                >
                  + Add Another Applicant
                </button>
              </div>

              {/* TERMS AND SUBMIT */}

              <div className="pt-4 border-t border-slate-100 space-y-4 text-center">
                <p className="text-[11px] text-slate-500">
                  By submitting an application, you accept our Terms and
                  Conditions and confirm that all information provided is
                  accurate.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#E5002B] hover:bg-[#C80024] active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all shadow-md text-base disabled:bg-slate-300"
                >
                  {loading
                    ? 'Submitting Application...'
                    : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
