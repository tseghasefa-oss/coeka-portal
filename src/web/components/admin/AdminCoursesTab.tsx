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
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface CourseRecord {
  id: string;
  code: string;
  title: string;
  programme: string;
  division: string;
  creditUnits: number;
  level: number;
  semester: number;
  isCompulsory: boolean;
  assignedFaculty?: string;
}

export const AdminCoursesTab: React.FC = () => {
  const { uiPreferences } = useAppStore();
  const isNavy = uiPreferences.theme === 'navy';

  // Local state for courses catalogue
  const [courses, setCourses] = useState<CourseRecord[]>([
    {
      id: 'crs-1',
      code: 'CSC 111',
      title: 'Introduction to Computer Science & Information Technology',
      programme: 'NCE Computer Science / Mathematics',
      division: 'NCE',
      creditUnits: 3,
      level: 100,
      semester: 1,
      isCompulsory: true,
      assignedFaculty: 'Dr. Olufemi Adeyemi (Senior Lecturer)',
    },
    {
      id: 'crs-2',
      code: 'MTH 111',
      title: 'General Mathematics I (Algebra & Trigonometry)',
      programme: 'NCE Computer Science / Mathematics',
      division: 'NCE',
      creditUnits: 3,
      level: 100,
      semester: 1,
      isCompulsory: true,
      assignedFaculty: 'Prof. Terver Akume (Reader)',
    },
    {
      id: 'crs-3',
      code: 'EDU 111',
      title: 'Foundations of Education & Teacher Professionalism',
      programme: 'All NCE Programmes',
      division: 'NCE',
      creditUnits: 2,
      level: 100,
      semester: 1,
      isCompulsory: true,
      assignedFaculty: 'Dr. (Mrs) Bridget Tyav (Chief Lecturer)',
    },
    {
      id: 'crs-4',
      code: 'GSE 111',
      title: 'General English & Communication Skills I',
      programme: 'General Studies Unit',
      division: 'NCE',
      creditUnits: 2,
      level: 100,
      semester: 1,
      isCompulsory: true,
      assignedFaculty: 'Mr. Emmanuel Gbadu (Lecturer I)',
    },
    {
      id: 'crs-5',
      code: 'BED 211',
      title: 'Principles of Business Education & Microeconomics',
      programme: 'B.Ed Business Education',
      division: 'DEGREE',
      creditUnits: 3,
      level: 200,
      semester: 1,
      isCompulsory: true,
      assignedFaculty: 'Dr. Simon Iorliam (Senior Lecturer)',
    },
    {
      id: 'crs-6',
      code: 'SEC-BIO-101',
      title: 'Senior Secondary Biology (Living Organisms & Cell Biology)',
      programme: 'Senior Secondary Science',
      division: 'SECONDARY',
      creditUnits: 2,
      level: 100,
      semester: 1,
      isCompulsory: true,
      assignedFaculty: 'Mr. Moses Terfa (Master Teacher II)',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<CourseRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New course form fields
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newProgramme, setNewProgramme] = useState('NCE Computer Science / Mathematics');
  const [newDivision, setNewDivision] = useState('NCE');
  const [newCredits, setNewCredits] = useState(3);
  const [newLevel, setNewLevel] = useState(100);
  const [newSemester, setNewSemester] = useState(1);
  const [newCompulsory, setNewCompulsory] = useState(true);

  // Assign faculty form field
  const [selectedFaculty, setSelectedFaculty] = useState('Dr. Olufemi Adeyemi (Senior Lecturer)');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newTitle.trim()) return;

    const newCourse: CourseRecord = {
      id: `crs-${Date.now()}`,
      code: newCode.toUpperCase().trim(),
      title: newTitle.trim(),
      programme: newProgramme,
      division: newDivision,
      creditUnits: Number(newCredits),
      level: Number(newLevel),
      semester: Number(newSemester),
      isCompulsory: newCompulsory,
    };

    setCourses([newCourse, ...courses]);
    setNewCode('');
    setNewTitle('');
    setShowAddModal(false);
    showToast(`Course ${newCourse.code} created and added to curriculum.`);
  };

  const handleAssignFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal) return;

    setCourses(
      courses.map((c) =>
        c.id === showAssignModal.id ? { ...c, assignedFaculty: selectedFaculty } : c
      )
    );
    showToast(`Assigned ${selectedFaculty} to ${showAssignModal.code}`);
    setShowAssignModal(null);
  };

  const handleDeleteCourse = (id: string, code: string) => {
    if (confirm(`Are you sure you want to remove ${code} from the academic curriculum?`)) {
      setCourses(courses.filter((c) => c.id !== id));
      showToast(`Course ${code} removed successfully.`);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.programme.toLowerCase().includes(searchQuery.toLowerCase());
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
            Academic Management & Curriculum Directory
          </h2>
          <p className="text-xs text-slate-500">
            Provision departments, programmes, courses, and allocate courses to academic lecturers.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className={`flex items-center gap-2 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition-all ${
            isNavy ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-700 hover:bg-emerald-600'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create New Course</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Active Courses</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{courses.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium">Across 4 divisions</div>
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
              {filteredCourses.length === 0 ? (
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
                        {course.programme} • <span className="font-semibold">{course.division}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {course.creditUnits} CU
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {course.level}L / Sem {course.semester}
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
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
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

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-1">Create Curriculum Course</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a new course unit to the COEKA academic database.
            </p>

            <form onSubmit={handleAddCourse} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSC 113"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Credit Units</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    required
                    value={newCredits}
                    onChange={(e) => setNewCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Algorithms & Data Structures I"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Division</label>
                  <select
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="NCE">NCE (Tertiary)</option>
                    <option value="DEGREE">DEGREE (Affiliated)</option>
                    <option value="SECONDARY">DEMONSTRATION SECONDARY</option>
                    <option value="PRIMARY">STAFF PRIMARY</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Level / Term</label>
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

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="compulsoryCheck"
                  checked={newCompulsory}
                  onChange={(e) => setNewCompulsory(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="compulsoryCheck" className="text-xs font-semibold text-slate-700">
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
                  className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow ${
                    isNavy ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-700 hover:bg-emerald-600'
                  }`}
                >
                  Save Course
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
                <label className="text-xs font-bold text-slate-700 block mb-1">Lecturer</label>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Dr. Olufemi Adeyemi (Senior Lecturer)">Dr. Olufemi Adeyemi (Senior Lecturer - CSC)</option>
                  <option value="Prof. Terver Akume (Reader)">Prof. Terver Akume (Reader - MTH)</option>
                  <option value="Dr. (Mrs) Bridget Tyav (Chief Lecturer)">Dr. (Mrs) Bridget Tyav (Chief Lecturer - EDU)</option>
                  <option value="Mr. Emmanuel Gbadu (Lecturer I)">Mr. Emmanuel Gbadu (Lecturer I - ENG)</option>
                  <option value="Dr. Simon Iorliam (Senior Lecturer)">Dr. Simon Iorliam (Senior Lecturer - BED)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Role Type</label>
                <select className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white">
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
                  className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow ${
                    isNavy ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-700 hover:bg-emerald-600'
                  }`}
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
