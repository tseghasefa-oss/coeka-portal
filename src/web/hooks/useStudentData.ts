import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../stores/useAppStore';
import { API_HOST } from '../config/api';

const API_BASE = `${API_HOST}/api/student`;

function getStudentHeaders(role?: string, token?: string): HeadersInit {
  const effectiveRole = role || 'STUDENT';
  const effectiveToken = token || 'coeka_sess_demo_student';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${effectiveToken}`,
    'X-Demo-Role': effectiveRole,
  };
}

export interface StudentProfileData {
  id: string;
  userId: string;
  matricNumber: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  division: string;
  programme: string;
  level: number;
  gender: string;
  academicStatus: string;
  role: string;
  passportPhotoUrl: string;
  digitalIdVerificationUrl: string;
}

export interface AvailableCourseItem {
  courseId: string;
  code: string;
  title: string;
  creditUnits: number;
  isCompulsory?: boolean;
}

export interface InvoicesData {
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    feeTitle: string;
    category: string;
    amountDueKobo: number;
    amountPaidKobo: number;
    status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
    dueDate: string;
    paidAt?: string;
    formattedDue: string;
    formattedPaid: string;
  }>;
  summary: {
    totalDueKobo: number;
    totalPaidKobo: number;
    outstandingBalanceKobo: number;
    hasOutstandingDebt: boolean;
    hasPaidTuition: boolean;
    formattedTotalDue: string;
    formattedTotalPaid: string;
    formattedOutstandingBalance: string;
  };
}

export interface TranscriptData {
  student: {
    matricNumber: string;
    fullName: string;
    gender: string;
    division: string;
    programme: string;
    admissionYear: number;
  };
  academicHistory: Array<{
    session: string;
    semester: string;
    courses: Array<{
      code: string;
      title: string;
      units: number;
      score: number;
      grade: string;
      point: number;
    }>;
    gpa: number;
  }>;
  cumulative: {
    totalCreditsRegistered: number;
    totalCreditsEarned: number;
    cgpa: number;
    classOfAward: string;
  };
  verificationHash: string;
  verificationUrl: string;
  generatedAt: string;
}

export interface ReportCardData {
  institution: string;
  motto: string;
  academicSession: string;
  term: string;
  studentInfo: {
    fullName: string;
    regNo: string;
    classLevel: string;
    gender: string;
    age: number;
    attendanceScore: string;
    timesPunctual: number;
    positionInClass: string;
    classAverage: number;
    studentAverage: number;
  };
  subjects: Array<{
    name: string;
    ca1: number;
    ca2: number;
    exam: number;
    total: number;
    grade: string;
    remark: string;
    teacher: string;
  }>;
  affectiveTraits: Array<{
    trait: string;
    rating: number;
    description: string;
  }>;
  psychomotorSkills: Array<{
    skill: string;
    rating: number;
    description: string;
  }>;
  remarks: {
    classTeacherRemark: string;
    classTeacherName: string;
    principalRemark: string;
    principalName: string;
    nextTermResumption: string;
  };
  verificationHash: string;
}

export interface TimetableData {
  academicSession: string;
  semesterOrTerm: string;
  days: Array<{
    day: string;
    periods: Array<{
      time: string;
      code: string;
      title: string;
      venue: string;
      lecturer: string;
    }>;
  }>;
}

export interface ClearanceData {
  studentId: string;
  matricNumber: string;
  studentName: string;
  isFullyCleared: boolean;
  clearedCount: number;
  totalUnits: number;
  checklist: Array<{
    unit: string;
    title: string;
    description: string;
    status: 'CLEARED' | 'PENDING';
    officer: string;
    clearedAt: string | null;
    remarks: string;
  }>;
  certificateHash: string | null;
}

/**
 * 1. Fetch Student Profile
 */
export function useStudentProfile() {
  const { userSession } = useAppStore();

  return useQuery<StudentProfileData>({
    queryKey: ['student', 'profile', userSession?.userId],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/profile`, {
          headers: getStudentHeaders(userSession?.role, userSession?.token),
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any = await res.json();
        return data.student;
      } catch (err) {
        return {
          id: 'std-001',
          userId: userSession?.userId || 'usr-std-001',
          matricNumber: 'COEKA/2026/NCE/084',
          fullName: userSession?.fullName || 'Aondoaver Moses Iorliam',
          email: 'm.iorliam@student.coekatsinaala.edu.ng',
          phoneNumber: '08064377594',
          division: userSession?.division || 'NCE Programmes',
          programme: 'NCE Computer Science / Mathematics',
          level: 100,
          gender: 'MALE',
          academicStatus: 'ACTIVE',
          role: 'STUDENT',
          passportPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
          digitalIdVerificationUrl: 'https://portal.coekatsinaala.edu.ng/verify/id/COEKA-2026-NCE-084',
        };
      }
    },
    staleTime: 60000,
  });
}

/**
 * 2. Fetch Available Courses
 */
export function useAvailableCourses() {
  const { userSession } = useAppStore();

  return useQuery<{ courses: AvailableCourseItem[]; minCreditUnits: number; maxCreditUnits: number }>({
    queryKey: ['student', 'courses', 'available'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/courses/available`, {
          headers: getStudentHeaders(userSession?.role, userSession?.token),
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        return {
          courses: [
            { courseId: 'crs-csc111', code: 'CSC 111', title: 'Introduction to Computer Systems', creditUnits: 2, isCompulsory: true },
            { courseId: 'crs-csc112', code: 'CSC 112', title: 'Problem Solving & BASIC Programming', creditUnits: 3, isCompulsory: true },
            { courseId: 'crs-mth111', code: 'MTH 111', title: 'Algebra and Trigonometry', creditUnits: 3, isCompulsory: true },
            { courseId: 'crs-mth112', code: 'MTH 112', title: 'Basic Calculus', creditUnits: 3, isCompulsory: false },
            { courseId: 'crs-edu111', code: 'EDU 111', title: 'Introduction to Foundations of Education', creditUnits: 2, isCompulsory: true },
            { courseId: 'crs-edu112', code: 'EDU 112', title: 'Educational Psychology', creditUnits: 2, isCompulsory: false },
            { courseId: 'crs-gse111', code: 'GSE 111', title: 'General English I', creditUnits: 2, isCompulsory: true },
          ],
          minCreditUnits: 15,
          maxCreditUnits: 24,
        };
      }
    },
    staleTime: 30000,
  });
}

/**
 * 3. Fetch Registered Courses
 */
export function useRegisteredCourses() {
  const { userSession } = useAppStore();

  return useQuery<{ registeredCourses: any[]; totalCreditUnits: number; isApproved: boolean }>({
    queryKey: ['student', 'courses', 'registered'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/courses/registered`, {
          headers: getStudentHeaders(userSession?.role, userSession?.token),
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        return {
          registeredCourses: [
            { courseId: 'crs-csc111', code: 'CSC 111', title: 'Introduction to Computer Systems', creditUnits: 2, isApproved: true },
            { courseId: 'crs-csc112', code: 'CSC 112', title: 'Problem Solving & BASIC Programming', creditUnits: 3, isApproved: true },
            { courseId: 'crs-mth111', code: 'MTH 111', title: 'Algebra and Trigonometry', creditUnits: 3, isApproved: true },
            { courseId: 'crs-edu111', code: 'EDU 111', title: 'Introduction to Foundations of Education', creditUnits: 2, isApproved: true },
            { courseId: 'crs-gse111', code: 'GSE 111', title: 'General English I', creditUnits: 2, isApproved: true },
          ],
          totalCreditUnits: 12,
          isApproved: true,
        };
      }
    },
    staleTime: 15000,
  });
}

/**
 * 4. Register Courses Mutation
 */
export function useRegisterCourses() {
  const queryClient = useQueryClient();
  const { userSession } = useAppStore();

  return useMutation<
    any,
    Error,
    { selectedCourses: any[]; hasPaidSchoolFees?: boolean }
  >({
    mutationFn: async (payload) => {
      const res = await fetch(`${API_BASE}/courses/register`, {
        method: 'POST',
        headers: getStudentHeaders(userSession?.role, userSession?.token),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData: any = await res.json().catch(() => ({}));
        const message = errorData.error || (errorData.errors ? errorData.errors.join('. ') : `HTTP error ${res.status}`);
        const err = new Error(message);
        (err as any).data = errorData;
        throw err;
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'courses', 'registered'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'clearance'] });
    },
  });
}

/**
 * 5. Fetch Student Invoices & Financial Balance
 */
export function useStudentInvoices() {
  const { userSession } = useAppStore();

  return useQuery<InvoicesData>({
    queryKey: ['student', 'invoices', userSession?.userId],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/invoices`, {
          headers: getStudentHeaders(userSession?.role, userSession?.token),
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        return {
          invoices: [
            {
              id: 'inv-001',
              invoiceNumber: 'INV-2026-COEKA-00184',
              feeTitle: '2026/2027 NCE Tuition & Consolidated Institutional Fees',
              category: 'TUITION',
              amountDueKobo: 4500000,
              amountPaidKobo: 0,
              status: 'UNPAID',
              dueDate: '2026-12-15',
              formattedDue: '₦45,000.00',
              formattedPaid: '₦0.00',
            },
            {
              id: 'inv-002',
              invoiceNumber: 'INV-2026-COEKA-00185',
              feeTitle: 'Hostel Accommodation (Hall A - Female Bedspace)',
              category: 'HOSTEL',
              amountDueKobo: 2000000,
              amountPaidKobo: 2000000,
              status: 'PAID',
              dueDate: '2026-11-30',
              paidAt: '2026-10-05T14:32:00Z',
              formattedDue: '₦20,000.00',
              formattedPaid: '₦20,000.00',
            },
          ],
          summary: {
            totalDueKobo: 6500000,
            totalPaidKobo: 2000000,
            outstandingBalanceKobo: 4500000,
            hasOutstandingDebt: true,
            hasPaidTuition: false,
            formattedTotalDue: '₦65,000.00',
            formattedTotalPaid: '₦20,000.00',
            formattedOutstandingBalance: '₦45,000.00',
          },
        };
      }
    },
    staleTime: 10000,
  });
}

/**
 * 6. Fetch Official Academic Transcript (Tertiary)
 */
export function useStudentTranscript() {
  const { userSession } = useAppStore();

  return useQuery<TranscriptData>({
    queryKey: ['student', 'transcript', userSession?.userId],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/transcript`, {
          headers: getStudentHeaders(userSession?.role, userSession?.token),
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any = await res.json();
        return data.transcript;
      } catch (err) {
        return {
          student: {
            matricNumber: 'COEKA/2026/NCE/084',
            fullName: userSession?.fullName || 'Aondoaver Moses Iorliam',
            gender: 'Male',
            division: 'NCE Programmes',
            programme: 'NCE Computer Science / Mathematics',
            admissionYear: 2026,
          },
          academicHistory: [
            {
              session: '2026/2027',
              semester: 'FIRST',
              courses: [
                { code: 'CSC 111', title: 'Intro to Computer Systems', units: 2, score: 86, grade: 'A', point: 5.0 },
                { code: 'CSC 112', title: 'Problem Solving & BASIC', units: 3, score: 78, grade: 'A', point: 5.0 },
                { code: 'MTH 111', title: 'Algebra & Trigonometry', units: 3, score: 70, grade: 'A', point: 5.0 },
                { code: 'EDU 111', title: 'Philosophy of Education', units: 2, score: 80, grade: 'A', point: 5.0 },
                { code: 'GSE 111', title: 'General English I', units: 2, score: 78, grade: 'A', point: 5.0 },
              ],
              gpa: 5.0,
            },
          ],
          cumulative: {
            totalCreditsRegistered: 12,
            totalCreditsEarned: 12,
            cgpa: 5.0,
            classOfAward: 'Distinction',
          },
          verificationHash: 'coeka_trans_hash_verified_9941a8',
          verificationUrl: 'https://portal.coekatsinaala.edu.ng/verify/transcript/COEKA-2026-NCE-084',
          generatedAt: new Date().toISOString(),
        };
      }
    },
    staleTime: 30000,
  });
}

/**
 * 7. Fetch Basic Education Termly Report Card
 */
export function useStudentReportCard() {
  const { userSession } = useAppStore();

  return useQuery<ReportCardData>({
    queryKey: ['student', 'report-card', userSession?.userId],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/report-card`, {
          headers: getStudentHeaders(userSession?.role, userSession?.token),
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any = await res.json();
        return data.reportCard;
      } catch (err) {
        return {
          institution: 'College of Education Demonstration Secondary School, Katsina-Ala',
          motto: 'Excellence in Pedagogy & Morals',
          academicSession: '2026/2027',
          term: 'First Term',
          studentInfo: {
            fullName: userSession?.fullName || 'Ngodoo Blessing Tsegha',
            regNo: 'COEKA/DEMO/2026/SS2/012',
            classLevel: 'Senior Secondary 2 (SS2 Science)',
            gender: 'Female',
            age: 16,
            attendanceScore: '96% (68 of 70 days)',
            timesPunctual: 66,
            positionInClass: '2nd of 42 Students',
            classAverage: 68.4,
            studentAverage: 82.5,
          },
          subjects: [
            { name: 'Mathematics', ca1: 18, ca2: 18, exam: 54, total: 90, grade: 'A1', remark: 'Excellent mastery', teacher: 'Mr. I. Aondo' },
            { name: 'English Language', ca1: 16, ca2: 17, exam: 50, total: 83, grade: 'A1', remark: 'Very good vocabulary', teacher: 'Mrs. D. Tyav' },
            { name: 'Biology', ca1: 17, ca2: 16, exam: 48, total: 81, grade: 'A1', remark: 'Diligent student', teacher: 'Dr. T. Kange' },
            { name: 'Chemistry', ca1: 15, ca2: 15, exam: 46, total: 76, grade: 'A1', remark: 'Good analytical skills', teacher: 'Mr. B. Uzer' },
            { name: 'Physics', ca1: 16, ca2: 14, exam: 48, total: 78, grade: 'A1', remark: 'Strong problem solving', teacher: 'Mr. S. Gbadu' },
            { name: 'Civic Education', ca1: 19, ca2: 19, exam: 52, total: 90, grade: 'A1', remark: 'Role model', teacher: 'Mrs. H. Iorliam' },
            { name: 'Computer Studies', ca1: 18, ca2: 19, exam: 55, total: 92, grade: 'A1', remark: 'Outstanding aptitude', teacher: 'Mr. P. Chia' },
          ],
          affectiveTraits: [
            { trait: 'Punctuality', rating: 5, description: 'Excellent' },
            { trait: 'Politeness & Respect', rating: 5, description: 'Excellent' },
            { trait: 'Neatness', rating: 5, description: 'Excellent' },
            { trait: 'Relationship with Peers', rating: 4, description: 'Very Good' },
            { trait: 'Attentiveness in Class', rating: 5, description: 'Excellent' },
            { trait: 'Leadership Ability', rating: 4, description: 'Very Good' },
          ],
          psychomotorSkills: [
            { skill: 'Handwriting & Calligraphy', rating: 5, description: 'Excellent' },
            { skill: 'Sports & Games', rating: 4, description: 'Very Good' },
            { skill: 'Laboratory Practical Skills', rating: 5, description: 'Excellent' },
            { skill: 'Public Speaking / Debate', rating: 4, description: 'Very Good' },
          ],
          remarks: {
            classTeacherRemark: 'An exceptionally gifted and well-mannered student. Consistently puts in her best effort.',
            classTeacherName: 'Dr. Terver Kange',
            principalRemark: 'Outstanding performance. Keep up this brilliant scholastic trajectory.',
            principalName: 'Prof. J. T. Orngu (Principal)',
            nextTermResumption: 'January 11, 2027',
          },
          verificationHash: 'coeka_report_card_hash_8841c7b',
        };
      }
    },
    staleTime: 30000,
  });
}

/**
 * 8. Fetch Daily Class Timetable
 */
export function useStudentTimetable() {
  const { userSession } = useAppStore();

  return useQuery<TimetableData>({
    queryKey: ['student', 'timetable', userSession?.userId],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/timetable`, {
          headers: getStudentHeaders(userSession?.role, userSession?.token),
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any = await res.json();
        return data.timetable;
      } catch (err) {
        return {
          academicSession: '2026/2027',
          semesterOrTerm: 'First Semester',
          days: [
            {
              day: 'Monday',
              periods: [
                { time: '08:00 - 10:00', code: 'CSC 111', title: 'Intro to Computer Systems', venue: 'ETF Lecture Hall A', lecturer: 'Dr. T. Kange' },
                { time: '10:00 - 12:00', code: 'MTH 111', title: 'Algebra & Trigonometry', venue: 'Maths Lab 2', lecturer: 'Prof. B. Uzer' },
                { time: '13:00 - 15:00', code: 'GSE 111', title: 'General English I', venue: 'College Auditorium', lecturer: 'Mrs. D. Tyav' },
              ],
            },
            {
              day: 'Tuesday',
              periods: [
                { time: '09:00 - 11:00', code: 'CSC 112', title: 'Problem Solving & BASIC', venue: 'Computer Lab 1', lecturer: 'Dr. T. Kange' },
                { time: '11:00 - 13:00', code: 'EDU 111', title: 'Philosophy of Education', venue: 'Education Complex B', lecturer: 'Dr. S. Gbadu' },
              ],
            },
            {
              day: 'Wednesday',
              periods: [
                { time: '08:00 - 10:00', code: 'MTH 112', title: 'Basic Calculus', venue: 'Lecture Theater 3', lecturer: 'Mr. P. Chia' },
                { time: '10:00 - 12:00', code: 'CSC 111', title: 'Hardware Lab Practical', venue: 'Hardware Lab', lecturer: 'Dr. T. Kange' },
                { time: '14:00 - 16:00', code: 'GSE 112', title: 'Use of Library', venue: 'College Main Library', lecturer: 'Librarian' },
              ],
            },
            {
              day: 'Thursday',
              periods: [
                { time: '09:00 - 12:00', code: 'CSC 112', title: 'Hands-on Programming Studio', venue: 'Computer Lab 2', lecturer: 'Dr. T. Kange' },
                { time: '13:00 - 15:00', code: 'EDU 112', title: 'Educational Psychology', venue: 'Education Complex B', lecturer: 'Mrs. H. Iorliam' },
              ],
            },
            {
              day: 'Friday',
              periods: [
                { time: '08:00 - 10:00', code: 'MTH 111', title: 'Tutorials & Problem Sets', venue: 'Maths Lab 2', lecturer: 'Prof. B. Uzer' },
                { time: '10:00 - 12:00', code: 'SPORTS', title: 'Physical & Health Recreation', venue: 'College Sports Pavilion', lecturer: 'Coach Terna' },
              ],
            },
          ],
        };
      }
    },
    staleTime: 60000,
  });
}

/**
 * 9. Fetch Digital Clearance Checklist
 */
export function useStudentClearance() {
  const { userSession } = useAppStore();

  return useQuery<ClearanceData>({
    queryKey: ['student', 'clearance', userSession?.userId],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/clearance`, {
          headers: getStudentHeaders(userSession?.role, userSession?.token),
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        return {
          studentId: 'std-001',
          matricNumber: 'COEKA/2026/NCE/084',
          studentName: userSession?.fullName || 'Aondoaver Moses Iorliam',
          isFullyCleared: false,
          clearedCount: 4,
          totalUnits: 5,
          checklist: [
            {
              unit: 'BURSARY',
              title: 'Bursary & Financial Clearance',
              description: '100% tuition, institutional levies, and hostel fee settlement',
              status: 'PENDING',
              officer: 'Mr. Terfa Akpera (Bursar)',
              clearedAt: null,
              remarks: 'Outstanding balance: ₦45,000.00',
            },
            {
              unit: 'DEPARTMENT',
              title: 'Academic Department Clearance',
              description: 'Completion of compulsory credit units and academic standing verification',
              status: 'CLEARED',
              officer: 'HOD Computer Science',
              clearedAt: '2026-09-23T10:15:00Z',
              remarks: 'All prescribed first semester courses completed with good academic standing.',
            },
            {
              unit: 'LIBRARY',
              title: 'College Main Library Clearance',
              description: 'Return of all borrowed books, reference volumes, and no pending fines',
              status: 'CLEARED',
              officer: 'College Librarian',
              clearedAt: '2026-09-22T14:40:00Z',
              remarks: 'Zero books on loan. No outstanding library liabilities.',
            },
            {
              unit: 'HOSTEL',
              title: 'Hall of Residence & Student Affairs',
              description: 'Room inventory inspection, key handover, and hall warden sign-off',
              status: 'CLEARED',
              officer: 'Hall Warden (Queen Amina Hall)',
              clearedAt: '2026-09-22T11:20:00Z',
              remarks: 'Bedspace and furniture verified intact.',
            },
            {
              unit: 'MEDICAL',
              title: 'College Health Services & Clinic',
              description: 'Annual medical fitness screening and clinic card clearance',
              status: 'CLEARED',
              officer: 'Director of Health Services',
              clearedAt: '2026-09-21T09:00:00Z',
              remarks: 'Medical screening records complete and certified fit.',
            },
          ],
          certificateHash: null,
        };
      }
    },
    staleTime: 10000,
  });
}
