import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Trash2,
  Edit3,
  Layers,
  GraduationCap,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useCourses, CourseItem } from '../../hooks/useAdminData';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const AdminCoursesTab: React.FC = () => {
  const { uiPreferences, activeDivision } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  // React Query Hook for Courses
  const {
    courses,
    isLoading,
    isError,
    createCourse,
    isCreating,
    deleteCourse,
    isDeleting,
    assignFaculty,
    isAssigning,
    refetch,
  } = useCourses();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<CourseItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // New course form fields
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDivision, setNewDivision] = useState<'NCE' | 'DEGREE' | 'SECONDARY' | 'PRIMARY'>('NCE');
  const [newProgrammeId, setNewProgrammeId] = useState('prog-nce-csc-mth');
  const [newCredits, setNewCredits] = useState<number>(3);
  const [newLevel, setNewLevel] = useState<number>(100);
  const [newSemester, setNewSemester] = useState<number>(1);
  const [newCompulsory, setNewCompulsory] = useState<boolean>(true);

  // Assign faculty form fields
  const [selectedStaffId, setSelectedStaffId] = useState('stf-001');
  const [selectedStaffName, setSelectedStaffName] = useState('Dr. Olufemi Adeyemi (Senior Lecturer - CSC)');
  const [assignRole, setAssignRole] = useState('PRIMARY_LECTURER');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    const cleanCode = newCode.trim().toUpperCase();
    const cleanTitle = newTitle.trim();

    if (!cleanCode) {
      setFormError('Course code is required (e.g. CSC 113)');
      return;
    }
    if (cleanTitle.length < 3) {
      setFormError('Course title must be at least 3 characters long');
      return;
    }
    if (newCredits < 1 || newCredits > 6) {
      setFormError('Credit units must be between 1 and 6');
      return;
    }

    // Determine programmeId based on division if not set
    let progId = newProgrammeId;
    if (newDivision === 'NCE' && !progId.startsWith('prog-nce')) {
      progId = 'prog-nce-csc-mth';
    } else if (newDivision === 'DEGREE' && !progId.startsWith('prog-deg')) {
      progId = 'prog-deg-bed';
    } else if (newDivision === 'SECONDARY' && !progId.startsWith('prog-sec')) {
      progId = 'prog-sec-sss';
    } else if (newDivision === 'PRIMARY' && !progId.startsWith('prog-pri')) {
      progId = 'prog-pri-elem';
    }

    try {
      await createCourse({
        programmeId: progId,
        code: cleanCode,
        title: cleanTitle,
        creditUnits: Number(newCredits),
        level: Number(newLevel),
        semesterTerm: Number(newSemester),
        isCompulsory: Boolean(newCompulsory),
        division: newDivision,
      });

      showToast(`Course ${cleanCode} created and stored successfully!`);
      setNewCode('');
      setNewTitle('');
      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create course');
    }
  };

  const handleAssignFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal) return;

    try {
      await assignFaculty({
        staffId: selectedStaffId,
        courseId: showAssignModal.id,
        semesterId: newDivision === 'DEGREE' ? 'sem-deg-2026-1' : 'sem-nce-2026-1',
        role: assignRole,
      });

      showToast(`Assigned ${selectedStaffName} to ${showAssignModal.code}`);
      setShowAssignModal(null);
    } catch (err: any) {
      alert(`Assignment failed: ${err.message}`);
    }
  };

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDangerous?: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  const handleDeleteCourse = (id: string, code: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Curriculum Course',
      message: `Are you sure you want to permanently delete course "${code}"? Students will no longer be able to register for this course unit and any pending staff allocations will be revoked.`,
      confirmText: 'Delete Course',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await deleteCourse(id);
          showToast(`Course ${code} removed.`);
        } catch (err: any) {
          showToast(`Delete failed: ${err.message}`);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Filter courses based on search & selected division
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.programmeName && c.programmeName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDiv = selectedDivision === 'ALL' || c.division === selectedDivision;
    return matchesSearch && matchesDiv;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-amber-300 border border-amber-400/40 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className={`w-6 h-6 ${isNavy ? 'text-blue-600' : 'text-emerald-700'}`} />
            Academic Management & Course Directory
          </h2>
          <p className="text-xs text-slate-500">
            Define curriculum units, manage accreditation catalogs, and assign lecturers in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
            title="Refresh Courses"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setFormError(null);
              setShowAddModal(true);
            }}
            className={`flex items-center gap-2 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all ${
              isNavy ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-700 hover:bg-emerald-600'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add New Course</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Active Courses</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{courses.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium">Synced with D1 Engine</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Academic Departments</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">8</div>
          <div className="text-[11px] text-slate-500 font-medium">Sciences, Arts, Languages, Edu</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Allocated Faculty</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {courses.filter((c) => c.assignedFaculty).length} / {courses.length}
          </div>
          <div className="text-[11px] text-purple-600 font-medium">Staff Allocations Active</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Accreditation Status</span>
            <GraduationCap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">100%</div>
          <div className="text-[11px] text-emerald-600 font-medium">NCCE & NUC Ratified</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search code, title, programme..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 shrink-0">Division:</span>
          {['ALL', 'NCE', 'DEGREE', 'SECONDARY', 'PRIMARY'].map((div) => (
            <button
              key={div}
              onClick={() => setSelectedDivision(div)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDivision === div
                  ? isNavy
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-emerald-800 text-amber-300 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {div}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Course Code</th>
                <th className="py-3 px-4">Title & Programme</th>
                <th className="py-3 px-4 text-center">Units</th>
                <th className="py-3 px-4 text-center">Level / Term</th>
                <th className="py-3 px-4">Assigned Lecturer</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading curriculum database...
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No courses found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-900 font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {course.code}
                      {course.isCompulsory && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold font-sans">
                          Core
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{course.title}</div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        {course.programmeName || course.programmeId} •{' '}
                        <span className="font-semibold">{course.division || 'NCE'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {course.creditUnits} CU
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {course.level}L / Sem {course.semesterTerm}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {course.assignedFaculty ? (
                        <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{course.assignedFaculty}</span>
                        </div>
                      ) : (
                        <span className="text-amber-600 italic text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setShowAssignModal(course)}
                          className="px-2.5 py-1 text-xs rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>Assign</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course.id, course.code)}
                          disabled={isDeleting}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Course Modal with Form Validation */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1">Add New Course</h3>
            <p className="text-xs text-slate-500 mb-4">
              Provision a new curriculum course unit with validation.
            </p>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddCourse} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSC 113"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Credit Units (1-6) *</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    required
                    value={newCredits}
                    onChange={(e) => setNewCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Course Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Algorithms & Data Structures I"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Division *</label>
                  <select
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="NCE">NCE (Tertiary)</option>
                    <option value="DEGREE">DEGREE (Affiliated)</option>
                    <option value="SECONDARY">DEMONSTRATION SECONDARY</option>
                    <option value="PRIMARY">STAFF PRIMARY</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Level *</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value={100}>100 Level</option>
                    <option value={200}>200 Level</option>
                    <option value={300}>300 Level</option>
                    <option value={400}>400 Level</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Semester / Term *</label>
                <select
                  value={newSemester}
                  onChange={(e) => setNewSemester(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value={1}>First Semester (Term 1)</option>
                  <option value={2}>Second Semester (Term 2)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="compulsoryCheckModal"
                  checked={newCompulsory}
                  onChange={(e) => setNewCompulsory(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="compulsoryCheckModal" className="text-xs font-semibold text-slate-700">
                  Compulsory Institutional Core Course
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow flex items-center gap-1.5 ${
                    isNavy ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-700 hover:bg-emerald-600'
                  } disabled:opacity-50`}
                >
                  {isCreating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Faculty Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Assign Faculty Member
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Allocate <strong>{showAssignModal.code}</strong> ({showAssignModal.title}) to an academic lecturer.
            </p>

            <form onSubmit={handleAssignFaculty} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Academic Staff</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => {
                    setSelectedStaffId(e.target.value);
                    const opt = e.target.options[e.target.selectedIndex].text;
                    setSelectedStaffName(opt);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="stf-001">Dr. Olufemi Adeyemi (Senior Lecturer - CSC)</option>
                  <option value="stf-002">Prof. Terver Akume (Reader - MTH)</option>
                  <option value="stf-003">Dr. (Mrs) Bridget Tyav (Chief Lecturer - EDU)</option>
                  <option value="stf-004">Mr. Emmanuel Gbadu (Lecturer I - ENG)</option>
                  <option value="stf-005">Dr. Simon Iorliam (Senior Lecturer - BED)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Allocation Role</label>
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="PRIMARY_LECTURER">Primary Course Lecturer (Score Upload Rights)</option>
                  <option value="CO_LECTURER">Co-Lecturer (Assistant)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow flex items-center gap-1.5 ${
                    isNavy ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-700 hover:bg-emerald-600'
                  } disabled:opacity-50`}
                >
                  {isAssigning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Confirm Allocation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDangerous={confirmModal.isDangerous}
        isLoading={isDeleting}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
