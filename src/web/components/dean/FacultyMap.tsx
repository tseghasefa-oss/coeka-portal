import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  Check,
  UserCheck,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import {
  useFacultyAssignments,
  useAssignFaculty,
  useUnassignFaculty,
} from '../../hooks/useDeanData';

export function FacultyMap() {
  const { data, isLoading, refetch } = useFacultyAssignments();
  const assignMutation = useAssignFaculty();
  const unassignMutation = useUnassignFaculty();

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'PRIMARY_LECTURER' | 'ASSISTANT_LECTURER' | 'TUTOR'>('PRIMARY_LECTURER');
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Drag and drop state
  const [draggedStaffId, setDraggedStaffId] = useState<string | null>(null);

  const courses = data?.courses || [];
  const lecturers = data?.lecturers || [];
  const allocations = data?.allocations || [];

  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      (c.assignedLecturer && c.assignedLecturer.toLowerCase().includes(q))
    );
  });

  const handleAssign = async (courseId: string, staffId: string) => {
    try {
      const res = await assignMutation.mutateAsync({
        courseId,
        staffId,
        semesterId: 'sem-nce-2026-1',
        role: selectedRole,
      });
      setSuccessToast(`Successfully allocated course to faculty.`);
      setSelectedCourseId('');
      setSelectedStaffId('');
      refetch();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to assign lecturer to course');
    }
  };

  const handleUnassign = async (allocationId: string) => {
    if (!confirm('Are you sure you want to remove this faculty course assignment?')) return;
    try {
      await unassignMutation.mutateAsync(allocationId);
      setSuccessToast('Faculty assignment removed.');
      refetch();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to remove assignment');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, staffId: string) => {
    setDraggedStaffId(staffId);
    e.dataTransfer.setData('text/plain', staffId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnCourse = (e: React.DragEvent, courseId: string) => {
    e.preventDefault();
    const staffId = e.dataTransfer.getData('text/plain') || draggedStaffId;
    if (staffId && courseId) {
      handleAssign(courseId, staffId);
    }
    setDraggedStaffId(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950 p-6 rounded-2xl text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-400" />
              <span>Faculty Course Allocation & Teaching Map</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Drag-and-drop lecturers directly onto courses, or use the quick allocator below to manage instructional duties across schools.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-slate-400 block text-[10px]">Total Courses:</span>
              <span className="font-bold text-white text-sm">{courses.length}</span>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-slate-400 block text-[10px]">Allocated:</span>
              <span className="font-bold text-emerald-400 text-sm">{allocations.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Lecturers Palette (Left) + Course Assignment Dropzone (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Available Faculty Lecturers (Draggable Cards) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <span>Academic Faculty Roster</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Drag a lecturer card and drop it onto any course on the right.
            </p>

            <div className="space-y-2.5">
              {lecturers.map((lecturer) => (
                <div
                  key={lecturer.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lecturer.id)}
                  onClick={() => setSelectedStaffId(lecturer.id)}
                  className={`p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing flex items-center justify-between ${
                    selectedStaffId === lecturer.id
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                      {lecturer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800">{lecturer.name}</div>
                      <div className="text-[10px] text-slate-400">{lecturer.email}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                    Drag
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Select & Assign Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase">Quick Allocate</h4>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Lecturer</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="">-- Choose Lecturer --</option>
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Teaching Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="PRIMARY_LECTURER">Primary Course Lecturer</option>
                <option value="ASSISTANT_LECTURER">Co-Lecturer / Assistant</option>
                <option value="TUTOR">Tutorial Assistant</option>
              </select>
            </div>

            <button
              onClick={() => {
                if (selectedCourseId && selectedStaffId) {
                  handleAssign(selectedCourseId, selectedStaffId);
                } else {
                  alert('Please select both a course and a lecturer');
                }
              }}
              disabled={assignMutation.isPending || !selectedCourseId || !selectedStaffId}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{assignMutation.isPending ? 'Assigning...' : 'Assign to Course'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Course Cards with Dropzones */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search curriculum courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading curriculum courses and allocations...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCourses.map((c) => {
                const allocation = allocations.find((a) => a.courseId === c.id);

                return (
                  <div
                    key={c.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnCourse(e, c.id)}
                    className={`bg-white rounded-2xl border p-4 shadow-sm transition-all flex flex-col justify-between ${
                      allocation
                        ? 'border-slate-200 hover:border-emerald-300'
                        : 'border-dashed border-slate-300 bg-slate-50/50 hover:border-emerald-500 hover:bg-emerald-50/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-mono font-bold">
                          {c.code}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {c.units} Units • Level {c.level}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm mt-2 line-clamp-1">{c.title}</h4>

                      {/* Assigned Lecturer Details or Drop Target */}
                      <div className="mt-3">
                        {allocation ? (
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center">
                                {allocation.staffName.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">{allocation.staffName}</span>
                                <span className="text-[10px] text-emerald-700 font-semibold">{allocation.role}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnassign(allocation.allocationId)}
                              title="Unassign Lecturer"
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 hover:bg-emerald-50/40 hover:text-emerald-700 transition-colors">
                            <span>Drop lecturer here to assign</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
