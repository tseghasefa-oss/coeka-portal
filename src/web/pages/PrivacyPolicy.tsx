import React from 'react';
import { ShieldCheck, Lock, FileText, ArrowLeft, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export function PrivacyPolicy() {
  const { setActiveTab } = useAppStore();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('website')}
            className="flex items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portal</span>
          </button>
          <span className="text-xs font-mono px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full font-bold">
            NDPA 2023 Compliant • Statutory Version 1.0
          </span>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-emerald-800">
          <div className="flex items-center gap-3 text-amber-400 mb-3">
            <ShieldCheck className="w-8 h-8" />
            <span className="text-xs uppercase font-extrabold tracking-widest">
              College of Education, Katsina-Ala
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Institutional Data Protection & Privacy Policy
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base max-w-2xl leading-relaxed">
            Formally enacted pursuant to the <strong>Nigeria Data Protection Act (NDPA 2023)</strong>, 
            National Commission for Colleges of Education (NCCE) standards, and international higher-education 
            data governance frameworks.
          </p>
        </div>

        {/* Policy Body Cards */}
        <div className="space-y-6">
          {/* 1. Legal Mandate */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center gap-3 text-emerald-800">
              <Building2 className="w-5 h-5 shrink-0" />
              <h2 className="text-xl font-bold">1. Statutory Mandate & Legal Framework</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              The College of Education, Katsina-Ala (COEKA), established under Benue State law and accredited by the 
              National Commission for Colleges of Education (NCCE) and the Teachers Registration Council of Nigeria (TRCN), 
              acts as a <strong>Data Controller</strong> under Section 24 of the Nigeria Data Protection Act (NDPA 2023). 
              We are committed to maintaining the confidentiality, integrity, and availability of student, staff, and guardian personal records.
            </p>
          </div>

          {/* 2. Data Categories */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-emerald-800">
              <FileText className="w-5 h-5 shrink-0" />
              <h2 className="text-xl font-bold">2. Categories of Personal Data Collected</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              We process only data strictly necessary for academic enrollment, financial stewardship, campus security, and certification:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <strong className="text-slate-900 block font-bold">Academic & Identity Records</strong>
                <p className="text-slate-600">JAMB registration, O-Level credentials, Matriculation numbers, biometrics, semester continuous assessments, and Senate-certified examination broadsheets.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <strong className="text-slate-900 block font-bold">Financial & Banking Data</strong>
                <p className="text-slate-600">VPay dynamic NUBAN bank accounts, Paystack transaction references, digital receipts, integer Kobo fee payments, and bursary audit ledgers.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <strong className="text-slate-900 block font-bold">Residency & Health Safety</strong>
                <p className="text-slate-600">Hostel room inventory, hall of residence bedspace allocation, annual medical fitness certification, and next-of-kin emergency contact profiles.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <strong className="text-slate-900 block font-bold">Edge Telemetry & Security</strong>
                <p className="text-slate-600">Cloudflare edge connection logs, IP addresses (hashed), authentication timestamps, cryptographic session keys, and Sentry runtime breadcrumbs.</p>
              </div>
            </div>
          </div>

          {/* 3. Lawful Basis */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center gap-3 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <h2 className="text-xl font-bold">3. Lawful Bases for Processing (NDPA Section 25)</h2>
            </div>
            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2 leading-relaxed">
              <li><strong>Performance of Contract:</strong> Processing student matriculation, fee assessments, course registrations, and transcript issuance pursuant to the educational admissions offer.</li>
              <li><strong>Legal Obligation:</strong> Reporting academic standing and graduation manifests to the NCCE, Joint Admissions and Matriculation Board (JAMB), and Benue State Ministry of Education.</li>
              <li><strong>Explicit Consent:</strong> Validated through the portal consent gateway prior to accessing digital campus services.</li>
            </ul>
          </div>

          {/* 4. Data Security */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center gap-3 text-emerald-800">
              <Lock className="w-5 h-5 shrink-0" />
              <h2 className="text-xl font-bold">4. Cloudflare Edge Security & Cold Storage</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              All communications are enforced using modern <strong>TLS 1.3 encryption</strong> with strict Content Security Policies (CSP) and HSTS. 
              Database records reside within distributed Cloudflare D1 nodes with nightly AES-256 encrypted backups transferred to cold R2 object storage. 
              Under no circumstances does COEKA sell or commercially broker student data.
            </p>
          </div>

          {/* 5. Data Subject Rights */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center gap-3 text-emerald-800">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <h2 className="text-xl font-bold">5. Your Statutory Rights (NDPA Sections 34 – 39)</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              As a matriculated student or registered guardian, you retain full rights under the NDPA:
            </p>
            <div className="space-y-2 text-sm text-slate-700">
              <p>• <strong>Right to Portability (Section 38):</strong> Download a complete JSON dossier of all your stored academic, financial, and biodata via the <code className="bg-slate-100 text-emerald-800 px-2 py-0.5 rounded font-mono text-xs">/api/student/export-my-data</code> tool.</p>
              <p>• <strong>Right to Rectification (Section 35):</strong> Request immediate correction of inaccurate biodata through the Academic Registrar.</p>
              <p>• <strong>Right to Erasure (Section 36):</strong> Request deletion of non-statutory records subject to academic retention laws.</p>
              <p>• <strong>Right to Object (Section 37):</strong> Lodge objections to automated profiling or non-essential data processing.</p>
            </div>
          </div>

          {/* 6. DPO Contact */}
          <div className="bg-emerald-50 rounded-2xl p-6 sm:p-8 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-3 text-emerald-900">
              <AlertCircle className="w-5 h-5 shrink-0 text-emerald-700" />
              <h2 className="text-xl font-bold">6. Data Protection Officer (DPO) Contact</h2>
            </div>
            <p className="text-sm text-emerald-950 leading-relaxed">
              For privacy inquiries, rights enforcement, or NDPA compliance verifications, contact the Institutional DPO:
            </p>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 text-xs font-mono text-slate-700 space-y-1">
              <p><strong>Office:</strong> Directorate of ICT & Legal Services, College of Education, Katsina-Ala</p>
              <p><strong>Address:</strong> P.M.B. 1008, Katsina-Ala, Benue State, Nigeria</p>
              <p><strong>Email:</strong> dpo@coeka.edu.ng • privacy@coeka.edu.ng</p>
              <p><strong>Supervisory Authority:</strong> Nigeria Data Protection Commission (NDPC) • info@ndpc.gov.ng</p>
            </div>
          </div>
        </div>

        {/* Footer Return Action */}
        <div className="text-center pt-4">
          <button
            onClick={() => setActiveTab('website')}
            className="px-6 py-3 rounded-xl font-bold bg-emerald-800 hover:bg-emerald-700 text-white shadow-md transition cursor-pointer"
          >
            Acknowledge & Return to Portal
          </button>
        </div>
      </div>
    </div>
  );
}
