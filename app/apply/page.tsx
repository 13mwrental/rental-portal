"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import frontViewImg from "../../utils/images/frontview.png";

type DocumentType = "photo_id" | "payslip" | "rental_receipt";
type SalaryFrequency = "weekly" | "fortnight" | "monthly";
type PetStatus = "yes" | "no";

type Applicant = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  employmentStatus: string;
  salaryAmount: string;
  salaryFrequency: SalaryFrequency;
  idDocumentFiles: File[];
  payslipFiles: File[];
  rentalReceiptFiles: File[];
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-100/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600";

function createApplicant(id: number): Applicant {
  return {
    id,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    employmentStatus: "",
    salaryAmount: "",
    salaryFrequency: "weekly",
    idDocumentFiles: [],
    payslipFiles: [],
    rentalReceiptFiles: [],
  };
}

function weeklyIncome(amount: number, frequency: SalaryFrequency): number {
  if (frequency === "fortnight") return amount / 2;
  if (frequency === "monthly") return (amount * 12) / 52;
  return amount;
}

function safeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default function ApplicationPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([
    createApplicant(0),
  ]);
  const [nextApplicantId, setNextApplicantId] = useState(1);
  const [preferredMoveInDate, setPreferredMoveInDate] = useState("");
  const [leaseTerm, setLeaseTerm] = useState<number | "">("");
  const [numberOfOccupants, setNumberOfOccupants] = useState("");
  const [hasPets, setHasPets] = useState<PetStatus>("no");
  const [petDetails, setPetDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateApplicant = (
    applicantId: number,
    changes: Partial<Applicant>
  ) => {
    setApplicants((current) =>
      current.map((applicant) =>
        applicant.id === applicantId
          ? { ...applicant, ...changes }
          : applicant
      )
    );
  };

  const addApplicant = () => {
    setApplicants((current) => [
      ...current,
      createApplicant(nextApplicantId),
    ]);
    setNextApplicantId((current) => current + 1);
  };

  const removeApplicant = (applicantId: number) => {
    if (applicants.length === 1) return;
    setApplicants((current) =>
      current.filter((applicant) => applicant.id !== applicantId)
    );
  };

  const handleFileChange = (
    applicantId: number,
    documentType: DocumentType,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;

    const invalidFile = selectedFiles.find((file) => {
      const validType =
        file.type === "application/pdf" || file.type.startsWith("image/");
      const maxSize = 10 * 1024 * 1024;
      return !validType || file.size > maxSize;
    });

    if (invalidFile) {
      setErrorMessage(
        `"${invalidFile.name}" is not supported. Upload PDF or image files up to 10 MB each.`
      );
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    const field =
      documentType === "photo_id"
        ? "idDocumentFiles"
        : documentType === "payslip"
          ? "payslipFiles"
          : "rentalReceiptFiles";

    setApplicants((current) =>
      current.map((applicant) =>
        applicant.id === applicantId
          ? {
              ...applicant,
              [field]: [...applicant[field], ...selectedFiles],
            }
          : applicant
      )
    );

    // Allows the same file to be selected again after it has been removed.
    event.target.value = "";
  };

  const removeFile = (
    applicantId: number,
    documentType: DocumentType,
    fileIndex: number
  ) => {
    const field =
      documentType === "photo_id"
        ? "idDocumentFiles"
        : documentType === "payslip"
          ? "payslipFiles"
          : "rentalReceiptFiles";

    setApplicants((current) =>
      current.map((applicant) =>
        applicant.id === applicantId
          ? {
              ...applicant,
              [field]: applicant[field].filter(
                (_, index) => index !== fileIndex
              ),
            }
          : applicant
      )
    );
  };

  const uploadApplicantDocuments = async (
    applicationId: string,
    applicant: Applicant
  ) => {
    const filesToUpload: {
      file: File;
      documentType: DocumentType;
    }[] = [
      ...applicant.idDocumentFiles.map((file) => ({
        file,
        documentType: "photo_id" as const,
      })),
      ...applicant.payslipFiles.map((file) => ({
        file,
        documentType: "payslip" as const,
      })),
      ...applicant.rentalReceiptFiles.map((file) => ({
        file,
        documentType: "rental_receipt" as const,
      })),
    ];

    const documentRows: {
      application_id: string;
      document_type: DocumentType;
      file_name: string;
      storage_path: string;
      content_type: string;
      file_size: number;
    }[] = [];

    for (const item of filesToUpload) {
      const storagePath = [
        applicationId,
        item.documentType,
        `${crypto.randomUUID()}-${safeFileName(item.file.name)}`,
      ].join("/");

      const { error: uploadError } = await supabase.storage
        .from("tenant-docs")
        .upload(storagePath, item.file, {
          contentType: item.file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      documentRows.push({
        application_id: applicationId,
        document_type: item.documentType,
        file_name: item.file.name,
        storage_path: storagePath,
        content_type: item.file.type || "application/octet-stream",
        file_size: item.file.size,
      });
    }

    if (documentRows.length > 0) {
      const { error: documentsError } = await supabase
        .from("application_documents")
        .insert(documentRows);

      if (documentsError) throw documentsError;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!preferredMoveInDate) {
      setErrorMessage("Please select your preferred lease start date.");
      return;
    }

    if (leaseTerm === "") {
      setErrorMessage("Please select an initial lease term.");
      return;
    }

    const occupants = Number(numberOfOccupants);
    if (!Number.isInteger(occupants) || occupants < 1 || occupants > 20) {
      setErrorMessage("Please enter a valid number of occupants (1–20).");
      return;
    }

    for (let index = 0; index < applicants.length; index += 1) {
      const applicant = applicants[index];
      const applicantLabel = `Applicant ${index + 1}`;

      if (
        !applicant.firstName.trim() ||
        !applicant.lastName.trim() ||
        !applicant.email.trim() ||
        !applicant.phone.trim() ||
        !applicant.address.trim() ||
        !applicant.employmentStatus
      ) {
        setErrorMessage(
          `Please complete all personal and employment details for ${applicantLabel}.`
        );
        return;
      }

      if (
        applicant.salaryAmount === "" ||
        !Number.isFinite(Number(applicant.salaryAmount)) ||
        Number(applicant.salaryAmount) < 0
      ) {
        setErrorMessage(`Please enter a valid income for ${applicantLabel}.`);
        return;
      }

      if (applicant.idDocumentFiles.length === 0) {
        setErrorMessage(
          `Please upload at least one Photo ID document for ${applicantLabel}.`
        );
        return;
      }

      if (applicant.payslipFiles.length === 0) {
        setErrorMessage(
          `Please upload at least one payslip for ${applicantLabel}.`
        );
        return;
      }

      if (applicant.rentalReceiptFiles.length === 0) {
        setErrorMessage(
          `Please upload current rental receipts for ${applicantLabel}.`
        );
        return;
      }
    }

    if (hasPets === "yes" && !petDetails.trim()) {
      setErrorMessage("Please describe your pet details.");
      return;
    }

    setLoading(true);

    try {
      // One applications row is created for each applicant, matching the
      // current database design. Each row receives its own document records.
      for (const applicant of applicants) {
        const amount = Number(applicant.salaryAmount);

        const baseApplication = {
          full_name: `${applicant.firstName.trim()} ${applicant.lastName.trim()}`,
          email: applicant.email.trim(),
          phone: applicant.phone.trim(),
          current_address: applicant.address.trim(),
          employment_status: applicant.employmentStatus,
          weekly_income: weeklyIncome(amount, applicant.salaryFrequency),
          salary_frequency: applicant.salaryFrequency,
          move_in_date: preferredMoveInDate,
          lease_term: leaseTerm,
          number_of_occupants: occupants,
        };

        const applicationPayload = {
          ...baseApplication,
          has_pets: hasPets === "yes",
          pet_details: hasPets === "yes" ? petDetails.trim() : null,
        };

        const { data: application, error: applicationError } = await supabase
          .from("applications")
          .insert(applicationPayload)
          .select("id")
          .single();

        if (applicationError) throw applicationError;
        if (!application?.id) {
          throw new Error("The application was saved without returning an ID.");
        }

        await uploadApplicantDocuments(application.id, applicant);
      }

      setSubmitted(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred.";
      setErrorMessage(
        `We couldn't complete the application: ${message}. Please contact the property manager before submitting again.`
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F2F2F7] px-4 py-10">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
            ✓
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Application submitted
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Thank you. Your tenancy application and supporting documents have
            been submitted successfully. The property manager will review your
            application.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F2F7] px-4 py-10 antialiased">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-8 lg:grid-cols-3">
        {/* Property summary */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
            <div className="h-48 bg-slate-200">
              <img
                src={frontViewImg.src}
                alt="13 Ben Hogan Ct property"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-4 p-5">
              <div>
                <span className="rounded-full bg-[#007AFF]/10 px-2.5 py-1 text-xs font-semibold text-[#007AFF]">
                  Featured Property
                </span>
                <h2 className="mt-2 text-lg font-bold text-slate-900">
                  13 Ben Hogan Ct
                </h2>
                <p className="text-xs text-slate-500">
                  Mount Waverley, Victoria
                </p>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
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

              <div className="flex justify-around border-t border-slate-100 pt-3 text-xs font-semibold text-slate-600">
                <span>🛏️ 3 Beds</span>
                <span>🛁 1 Bath</span>
                <span>🚗 1 Parking</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Application form */}
        <section className="lg:col-span-2">
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] backdrop-blur-2xl sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Tenancy Application Form
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Complete all sections below to submit your application to the
                property manager. Fields marked * are required.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Lease preferences */}
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                  Lease Preferences
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Preferred Lease Start Date *
                    </label>
                    <input
                      type="date"
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
                      required
                      value={leaseTerm}
                      onChange={(event) =>
                        setLeaseTerm(
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value)
                        )
                      }
                      className={inputClass}
                    >
                      <option value="">Select lease term</option>
                      {[6, 12, 18, 24].map((months) => (
                        <option key={months} value={months}>
                          {months} months
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Number of Occupants *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="20"
                      step="1"
                      value={numberOfOccupants}
                      onChange={(event) =>
                        setNumberOfOccupants(event.target.value)
                      }
                      placeholder="Include all adults and children"
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Include every person who will live at the property,
                      including all applicants and children.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>Pets *</label>
                    <select
                      required
                      value={hasPets}
                      onChange={(event) =>
                        setHasPets(event.target.value as PetStatus)
                      }
                      className={inputClass}
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>

                {hasPets === "yes" && (
                  <div>
                    <label className={labelClass}>Pet Details *</label>
                    <textarea
                      required
                      value={petDetails}
                      onChange={(event) => setPetDetails(event.target.value)}
                      rows={3}
                      placeholder="Describe the type and number of pets, e.g. 1 dog, 2 cats"
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                )}
              </section>

              {/* Applicants */}
              <section className="space-y-5 border-t border-slate-100 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                      Applicant Details
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Add each adult applicant separately.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addApplicant}
                    className="rounded-xl bg-[#007AFF]/10 px-4 py-2.5 text-sm font-semibold text-[#007AFF] transition hover:bg-[#007AFF]/20"
                  >
                    + Add Another Applicant
                  </button>
                </div>

                {applicants.map((applicant, index) => (
                  <div
                    key={applicant.id}
                    className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold text-slate-900">
                        Applicant {index + 1}
                      </h3>
                      {applicants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeApplicant(applicant.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Remove applicant
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>First Name *</label>
                        <input
                          required
                          value={applicant.firstName}
                          onChange={(event) =>
                            updateApplicant(applicant.id, {
                              firstName: event.target.value,
                            })
                          }
                          className={inputClass}
                          autoComplete="given-name"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Last Name *</label>
                        <input
                          required
                          value={applicant.lastName}
                          onChange={(event) =>
                            updateApplicant(applicant.id, {
                              lastName: event.target.value,
                            })
                          }
                          className={inputClass}
                          autoComplete="family-name"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Email Address *</label>
                        <input
                          required
                          type="email"
                          value={applicant.email}
                          onChange={(event) =>
                            updateApplicant(applicant.id, {
                              email: event.target.value,
                            })
                          }
                          className={inputClass}
                          autoComplete="email"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Mobile Phone *</label>
                        <input
                          required
                          type="tel"
                          value={applicant.phone}
                          onChange={(event) =>
                            updateApplicant(applicant.id, {
                              phone: event.target.value,
                            })
                          }
                          className={inputClass}
                          autoComplete="tel"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Current Address *</label>
                      <input
                        required
                        value={applicant.address}
                        onChange={(event) =>
                          updateApplicant(applicant.id, {
                            address: event.target.value,
                          })
                        }
                        className={inputClass}
                        autoComplete="street-address"
                      />
                    </div>

                    {/* Employment and income */}
                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                        Employment & Income
                      </h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                          <label className={labelClass}>
                            Employment Status *
                          </label>
                          <select
                            required
                            value={applicant.employmentStatus}
                            onChange={(event) =>
                              updateApplicant(applicant.id, {
                                employmentStatus: event.target.value,
                              })
                            }
                            className={inputClass}
                          >
                            <option value="">Select status</option>
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Casual">Casual</option>
                            <option value="Self-employed">Self-employed</option>
                            <option value="Student">Student</option>
                            <option value="Unemployed">Unemployed</option>
                            <option value="Retired">Retired</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Income Amount *</label>
                          <input
                            required
                            type="number"
                            min="0"
                            step="0.01"
                            value={applicant.salaryAmount}
                            onChange={(event) =>
                              updateApplicant(applicant.id, {
                                salaryAmount: event.target.value,
                              })
                            }
                            placeholder="e.g. 1500"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>
                            Income Frequency *
                          </label>
                          <select
                            required
                            value={applicant.salaryFrequency}
                            onChange={(event) =>
                              updateApplicant(applicant.id, {
                                salaryFrequency: event.target
                                  .value as SalaryFrequency,
                              })
                            }
                            className={inputClass}
                          >
                            <option value="weekly">Weekly</option>
                            <option value="fortnight">Fortnightly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Mandatory multiple document uploads */}
                    <div className="space-y-4 border-t border-slate-100 pt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                        Verification Documents
                      </h4>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <label className={labelClass}>
                          Photo ID (Driver Licence or Passport) *
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          multiple
                          onChange={(event) =>
                            handleFileChange(
                              applicant.id,
                              "photo_id",
                              event
                            )
                          }
                          className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-semibold file:text-[#007AFF] file:shadow-sm"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          Select one or more PDF or image files. Maximum 10 MB
                          per file.
                        </p>
                        {applicant.idDocumentFiles.length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {applicant.idDocumentFiles.map((file, fileIndex) => (
                              <li
                                key={`${file.name}-${fileIndex}`}
                                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-xs"
                              >
                                <span className="min-w-0 truncate text-slate-700">
                                  {file.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFile(
                                      applicant.id,
                                      "photo_id",
                                      fileIndex
                                    )
                                  }
                                  className="shrink-0 font-semibold text-red-600"
                                >
                                  Remove
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <label className={labelClass}>
                          Proof of Income (Payslips) *
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          multiple
                          onChange={(event) =>
                            handleFileChange(applicant.id, "payslip", event)
                          }
                          className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-semibold file:text-[#007AFF] file:shadow-sm"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          Upload one or more recent payslips. PDF and image
                          files up to 10 MB each.
                        </p>
                        {applicant.payslipFiles.length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {applicant.payslipFiles.map((file, fileIndex) => (
                              <li
                                key={`${file.name}-${fileIndex}`}
                                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-xs"
                              >
                                <span className="min-w-0 truncate text-slate-700">
                                  {file.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFile(
                                      applicant.id,
                                      "payslip",
                                      fileIndex
                                    )
                                  }
                                  className="shrink-0 font-semibold text-red-600"
                                >
                                  Remove
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <label className={labelClass}>
                          Current Rental Receipts *
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          multiple
                          onChange={(event) =>
                            handleFileChange(
                              applicant.id,
                              "rental_receipt",
                              event
                            )
                          }
                          className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:font-semibold file:text-[#007AFF] file:shadow-sm"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          Upload your current rental receipts or recent tenancy
                          payment confirmation for the property you currently rent.
                        </p>
                        {applicant.rentalReceiptFiles.length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {applicant.rentalReceiptFiles.map((file, fileIndex) => (
                              <li
                                key={`${file.name}-${fileIndex}`}
                                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-xs"
                              >
                                <span className="min-w-0 truncate text-slate-700">
                                  {file.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFile(
                                      applicant.id,
                                      "rental_receipt",
                                      fileIndex
                                    )
                                  }
                                  className="shrink-0 font-semibold text-red-600"
                                >
                                  Remove
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <button
                type="button"
                onClick={addApplicant}
                disabled={loading}
                className="w-full rounded-xl border border-[#007AFF]/30 bg-[#007AFF]/5 px-4 py-3 text-sm font-semibold text-[#007AFF] transition hover:bg-[#007AFF]/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add Another Applicant
              </button>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {errorMessage}
                </div>
              )}

              {/* Submit */}
              <div className="space-y-4 border-t border-slate-100 pt-5 text-center">
                <p className="text-xs leading-5 text-slate-500">
                  By submitting this application, you confirm that the
                  information provided is accurate and that you consent to the
                  property manager reviewing the application and supporting
                  documents.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#E5002B] py-4 text-base font-bold text-white shadow-md transition hover:bg-[#C80024] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? "Submitting Application..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
