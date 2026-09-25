import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lock,
  ShoppingCart,
  Send,
  Plus,
  Trash2,
  Check,
  CreditCard,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  useAvailableCourses,
  useRegisteredCourses,
  useRegisterCourses,
  useStudentInvoices,
  AvailableCourseItem,
} from '../../hooks/useStudentData';

interface CourseRegistrationViewProps {
  onNavigateToInvoices?: () => void;
}

export const CourseRegistrationView: React.FC<CourseRegistrationViewProps> = ({
  onNavigateToInvoices,
}) => {
  const { data: coursesData, isLoading: coursesLoading } = useAvailableCourses();
  const { data: regData, isLoading: regLoading, refetch: refetchReg } = useRegisteredCourses();
  const { data: invoicesData, isLoading: invoicesLoading } = useStudentInvoices();
  const registerMutation = useRegisterCourses();

  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([
    'crs-csc111',
    'crs-csc112',
    'crs-mth111',
    'crs-edu111',
    'crs-gse111',
  ]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableCourses = coursesData?.courses || [];
  const minCredits = coursesData?.minCreditUnits || 15;
  const maxCredits = coursesData?.maxCreditUnits || 24;

  // Crucial Fee Payment Gate Check:
  // If student has an outstanding debt (balance > 0), registration is locked
  const hasOutstandingDebt = invoicesData?.summary?.hasOutstandingDebt ?? true;
  const outstandingBalanceFormatted =
    invoicesData?.summary?.formattedOutstandingBalance || '₦45,000.00';

  // Calculate selected load
  const selectedCoursesList = availableCourses.filter((c) =>
    selectedCourseIds.includes(c.courseId)
  );
  const currentCreditUnits = selectedCoursesList.reduce((sum, c) => sum + c.creditUnits, 0);

  const isBelowMin = currentCreditUnits < minCredits;
  const isAboveMax = currentCreditUnits > maxCredits;
  const isLoadValid = !isBelowMin && !isAboveMax;

  // Toggle selection
  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  // Submit registration
  const handleSubmit = async () => {
    if (hasOutstandingDebt) {
      setErrorMessage(
        `Course registration is locked: You have an outstanding fee balance of ${outstandingBalanceFormatted}. Bursary clearance is required before course registration.`
      );
      return;
    }

    if (!isLoadValid) {
      setErrorMessage(
        `Invalid credit load: You have selected ${currentCreditUnits} units. Permissible load is between ${minCredits} and ${maxCredits} units.`
      );
      return;
    }

    try {
      setErrorMessage(null);
      const res = await registerMutation.mutateAsync({
        selectedCourses: selectedCoursesList,
        hasPaidSchoolFees: !hasOutstandingDebt,
      });

      setSuccessMessage(
        res.message || 'Course registration successfully submitted to Course Adviser for electronic approval!'
      );
      refetchReg();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit course registration.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Fee Clearance Warning Banner (If debt exists) */}
      {hasOutstandingDebt ? (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl shrink-0">
              <Lock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                Course Registration Locked — Bursary Clearance Required
              </h4>
              <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                You have an outstanding session balance of{' '}
                <strong className="font-extrabold text-amber-950">
                  {outstandingBalanceFormatted}
                </strong>
                . Institutional senate regulations mandate complete fee settlement prior to course selection and registration approval.
              </p>
            </div>
          </div>

          {onNavigateToInvoices && (
            <button
              onClick={onNavigateToInvoices}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white shadow-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Clear Fees in My Invoices</span>
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold text-emerald-950">Bursary Clearance Verified!</strong>{' '}
            Your session tuition balance is ₦0.00. You are cleared to select and register your semester courses.
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs font-bold px-2 py-0.5">
            ✕
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs font-bold px-2 py-0.5">
            ✕
          </button>
        </div>
      )}

      {/* Shopping Cart Layout: Course Pool vs Selected Units */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Available Courses Selection List */}
        <div className="lg:col-span-2 bento-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <span>Available Courses for Semester</span>
              </h3>
              <p className="text-xs text-slate-500">
                Select compulsory and approved elective courses for your programme
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg">
              {availableCourses.length} Courses Offered
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {availableCourses.map((course) => {
              const isSelected = selectedCourseIds.includes(course.courseId);

              return (
                <div
                  key={course.courseId}
                  onClick={() => handleToggleCourse(course.courseId)}
                  className={`py-3 px-3 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition ${
                    isSelected
                      ? 'bg-emerald-50/60 border border-emerald-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleCourse(course.courseId)}
                      className="rounded text-emerald-700 focus:ring-emerald-600 h-4 w-4"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {course.code}
                        </span>
                        {course.isCompulsory && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            Compulsory
                          </span>
                        )}
                      </div>
                      <h5 className="text-xs font-medium text-slate-700 mt-0.5">
                        {course.title}
                      </h5>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                      {course.creditUnits} Units
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Registration Shopping Cart & Credit Load Gauge */}
        <div className="space-y-6">
          <div className="bento-card p-6 bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-700" />
                <h4 className="text-sm font-bold text-slate-900">Selected Cart</h4>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {selectedCoursesList.length} Selected
              </span>
            </div>

            {/* Credit Load Gauge */}
            <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-slate-600">Total Credit Load:</span>
                <span
                  className={`font-mono text-base font-black ${
                    isLoadValid ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {currentCreditUnits} Units
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    currentCreditUnits > maxCredits
                      ? 'bg-rose-500'
                      : currentCreditUnits < minCredits
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{
                    width: `${Math.min(100, (currentCreditUnits / maxCredits) * 100)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>Min: {minCredits} Units</span>
                <span>Max: {maxCredits} Units</span>
              </div>
            </div>

            {/* Selected Courses List in Cart */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
              {selectedCoursesList.map((c) => (
                <div key={c.courseId} className="py-2 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="font-mono font-bold text-slate-800">{c.code}</span>
                    <span className="text-[11px] text-slate-500 block truncate">{c.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs text-slate-700 font-bold">{c.creditUnits}u</span>
                    <button
                      type="button"
                      onClick={() => handleToggleCourse(c.courseId)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Registration Button with STRICT FEE CLEARANCE GATE */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                type="button"
                id="btn-submit-course-registration"
                disabled={hasOutstandingDebt || !isLoadValid || registerMutation.isPending}
                onClick={handleSubmit}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-2 ${
                  hasOutstandingDebt
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    : !isLoadValid
                    ? 'bg-amber-600 text-white cursor-not-allowed opacity-75'
                    : 'bg-emerald-800 hover:bg-emerald-700 text-white shadow-md cursor-pointer'
                }`}
              >
                {hasOutstandingDebt ? (
                  <>
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Locked (Clear ₦ Balance First)</span>
                  </>
                ) : registerMutation.isPending ? (
                  <span>Transmitting Registration...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm & Submit Registration</span>
                  </>
                )}
              </button>

              {hasOutstandingDebt && (
                <p className="text-[11px] text-center text-amber-800 font-medium">
                  Course registration button is strictly locked until student fee balance is ₦0.00.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
