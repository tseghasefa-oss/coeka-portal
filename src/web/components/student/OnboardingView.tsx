import React, { useState } from 'react';
import {
  GraduationCap,
  UserCheck,
  Camera,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  QrCode,
  Building,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import {
  useOnboardingStatus,
  useSubmitBiodata,
  useUploadPassport,
  usePayAcceptance,
} from '../../hooks/useAdmissionsData';
import { useStudentProfile } from '../../hooks/useStudentData';

interface OnboardingViewProps {
  onComplete?: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const { userSession } = useAppStore();
  const { data: profile } = useStudentProfile();
  const studentId = userSession?.userId || profile?.id || 'std-001';

  const { data: onboardingData, isLoading: statusLoading, refetch: refetchStatus } = useOnboardingStatus(studentId);
  const submitBiodataMutation = useSubmitBiodata();
  const uploadPassportMutation = useUploadPassport();
  const payAcceptanceMutation = usePayAcceptance();

  // Step tracker: 1 (Welcome) -> 2 (Biodata) -> 3 (Passport) -> 4 (Acceptance) -> 5 (Completed)
  const [step, setStep] = useState<number>(1);

  // Form State: Bio-data
  const [dateOfBirth, setDateOfBirth] = useState('2003-05-14');
  const [gender, setGender] = useState('MALE');
  const [stateOfOrigin, setStateOfOrigin] = useState('Benue');
  const [lgaOfOrigin, setLgaOfOrigin] = useState('Katsina-Ala');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [contactAddress, setContactAddress] = useState('No. 14 College Road, Katsina-Ala, Benue State');
  const [biodataSuccess, setBiodataSuccess] = useState(false);

  // Form State: Passport Upload
  const [passportPreview, setPassportPreview] = useState<string | null>(
    profile?.passportPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
  );
  const [passportUploaded, setPassportUploaded] = useState(false);
  const [passportError, setPassportError] = useState<string | null>(null);

  // Form State: Acceptance Fee
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Handle image file selection and conversion to Base64
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setPassportError('Image file is too large. Please select a photo under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPassportPreview(base64);
      setPassportError(null);
    };
    reader.readAsDataURL(file);
  };

  // Submit Bio-data Form
  const handleSubmitBiodata = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitBiodataMutation.mutateAsync({
        studentId,
        dateOfBirth,
        gender,
        stateOfOrigin,
        lgaOfOrigin,
        bloodGroup,
        contactAddress,
      });
      setBiodataSuccess(true);
      setStep(3); // Advance to passport
    } catch (err: any) {
      console.error(err);
    }
  };

  // Submit Passport Upload to Cloudflare R2
  const handleUploadPassport = async () => {
    if (!passportPreview) {
      setPassportError('Please select a passport photo first.');
      return;
    }

    try {
      await uploadPassportMutation.mutateAsync({
        studentId,
        imageBase64: passportPreview,
        filename: `passport_${studentId}.jpg`,
      });
      setPassportUploaded(true);
      setStep(4); // Advance to acceptance fee
    } catch (err: any) {
      setPassportError(err.message || 'Failed to upload passport photo.');
    }
  };

  // Pay Acceptance Fee
  const handlePayAcceptance = async () => {
    try {
      await payAcceptanceMutation.mutateAsync({
        studentId,
        gateway: 'VPAY',
      });
      setPaymentSuccess(true);
      refetchStatus();
      setStep(5); // Advance to final unlocked step
    } catch (err: any) {
      console.error(err);
    }
  };

  const matric = onboardingData?.matricNumber || profile?.matricNumber || 'COEKA/2026/NCE/084';
  const fullName = onboardingData?.fullName || profile?.fullName || userSession?.fullName || 'Student Applicant';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bento-card p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl border border-emerald-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider border border-emerald-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>COEKA Student Lifecycle Onboarding</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-2 tracking-tight">
              Admissions & Matriculation Onboarding Portal
            </h1>
            <p className="text-xs text-emerald-200 mt-1">
              Complete your biographical profile, biometric ID verification, and acceptance fee to unlock full campus services.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-right">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
              Provisional Matric No.
            </span>
            <strong className="text-sm font-mono text-white block">{matric}</strong>
            <span className="text-[10px] text-emerald-300">College of Education Katsina-Ala</span>
          </div>
        </div>

        {/* Step Progression Bar */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-2">
            <span className={step >= 1 ? 'text-amber-300' : ''}>1. Offer Acceptance</span>
            <span className={step >= 2 ? 'text-amber-300' : ''}>2. Bio-Data Entry</span>
            <span className={step >= 3 ? 'text-amber-300' : ''}>3. Passport Biometrics</span>
            <span className={step >= 4 ? 'text-amber-300' : ''}>4. Acceptance Fee</span>
            <span className={step >= 5 ? 'text-amber-300' : ''}>5. Course Reg Unlock</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* STEP 1: Offer Acceptance & Institutional Dossier */}
      {step === 1 && (
        <div className="bento-card p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Congratulations on Your Provisional Admission!
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                The College of Education, Katsina-Ala has offered you provisional admission into the 2026/2027 Academic Session.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Candidate Name</span>
                <strong className="text-slate-800 font-bold">{fullName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Matriculation No.</span>
                <strong className="text-slate-800 font-mono">{matric}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Division</span>
                <strong className="text-slate-800">{userSession?.division || 'NCE Regular'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Entry Level</span>
                <strong className="text-slate-800">100 Level</strong>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-md transition-all cursor-pointer"
            >
              <span>Accept Offer & Enter Bio-Data</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Bio-Data Entry Form */}
      {step === 2 && (
        <form onSubmit={handleSubmitBiodata} className="bento-card p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Step 2: Personal Bio-Data Verification</h2>
              <p className="text-xs text-slate-500">Provide official biographical information for institutional records</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State of Origin</label>
              <input
                type="text"
                required
                value={stateOfOrigin}
                onChange={(e) => setStateOfOrigin(e.target.value)}
                placeholder="Benue"
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">LGA of Origin</label>
              <input
                type="text"
                required
                value={lgaOfOrigin}
                onChange={(e) => setLgaOfOrigin(e.target.value)}
                placeholder="Katsina-Ala"
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Residential Address</label>
              <input
                type="text"
                required
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                placeholder="Street address, city"
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={submitBiodataMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-md transition-all cursor-pointer"
            >
              {submitBiodataMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Bio-Data...</span>
                </>
              ) : (
                <>
                  <span>Save Bio-Data & Proceed</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Passport Biometrics Upload (Cloudflare R2 Object Storage) */}
      {step === 3 && (
        <div className="bento-card p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Step 3: Biometric Passport Photo (Cloudflare R2)</h2>
              <p className="text-xs text-slate-500">Upload official passport photo with plain background for student digital ID card</p>
            </div>
          </div>

          {passportError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{passportError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Passport Preview Box */}
            <div className="w-32 h-36 rounded-2xl overflow-hidden border-2 border-slate-300 bg-white shrink-0 shadow-sm relative group">
              {passportPreview ? (
                <img
                  src={passportPreview}
                  alt="Student Passport"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-[10px]">No Photo</span>
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1 text-center sm:text-left">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800">Select Passport Photo File</h4>
                <p className="text-[11px] text-slate-500">
                  JPG or PNG format, maximum 2MB. Ensure clear face lighting and centered composition.
                </p>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-800 file:text-white hover:file:bg-emerald-900 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleUploadPassport}
              disabled={uploadPassportMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-md transition-all cursor-pointer"
            >
              {uploadPassportMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading to Cloudflare R2...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Passport & Continue</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Acceptance Fee Payment Settlement */}
      {step === 4 && (
        <div className="bento-card p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Step 4: Statutory Acceptance Fee Settlement</h2>
              <p className="text-xs text-slate-500">Pay your institutional acceptance fee to unlock Course Registration and formal matriculation</p>
            </div>
          </div>

          {/* Fee Invoice Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-700">Acceptance & Matriculation Processing Tariff</span>
              <span className="font-mono font-bold text-slate-900">₦15,000.00</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="text-slate-500">Biometric Smart ID Card & Lanyard</span>
              <span className="font-mono text-emerald-700 font-bold">INCLUDED</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <strong className="text-slate-900 font-bold">Total Statutory Amount Due:</strong>
              <strong className="text-base font-black font-mono text-emerald-800">₦15,000.00</strong>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Automated Bursary Clearance Gate
            </span>
            <p className="text-[11px] text-amber-800">
              Settling this fee transitions your status from <strong>PROVISIONAL</strong> to <strong>ACTIVE</strong> and removes the prerequisite registration lock on your account.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handlePayAcceptance}
              disabled={payAcceptanceMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-md transition-all cursor-pointer"
            >
              {payAcceptanceMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Settlement (VPay Engine)...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-amber-300" />
                  <span>Pay ₦15,000.00 Acceptance Fee Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Matriculation Clearance & Course Registration Unlock */}
      {step === 5 && (
        <div className="bento-card p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
              ACADEMIC STATUS: ACTIVE MATRIC
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Onboarding Complete & Verified!
            </h2>
            <p className="text-xs text-slate-600">
              Your bio-data is registered, biometric passport uploaded to R2, and acceptance fee settled. Your Course Registration portal is now unlocked.
            </p>
          </div>

          {/* Digital ID Preview Card */}
          <div className="max-w-md mx-auto p-4 rounded-3xl bg-slate-900 text-white shadow-lg flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-amber-400 bg-white shrink-0">
                <img
                  src={passportPreview || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                  alt="Student"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5 text-xs">
                <span className="text-[10px] text-amber-300 font-bold uppercase block">COE Katsina-Ala</span>
                <strong className="text-sm font-bold block">{fullName}</strong>
                <span className="font-mono text-emerald-400 text-xs">{matric}</span>
              </div>
            </div>

            <div className="p-2 bg-white rounded-xl shrink-0">
              <QrCode className="w-8 h-8 text-slate-900" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onComplete}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-black bg-emerald-800 hover:bg-emerald-900 text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer"
            >
              <span>Proceed to Course Registration</span>
              <ArrowRight className="w-5 h-5 text-amber-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
