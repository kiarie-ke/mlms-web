import {
  LayoutDashboard, Users, UserPlus, Layers, BookOpen, CalendarCheck, Wallet, Megaphone, Landmark, GraduationCap,
  ClipboardList, Video, MessageSquare, Award, BarChart3, Settings, Library, Code2, HelpCircle, Medal, MessagesSquare, Bell, FolderOpen,
} from 'lucide-react';

const icons = {
  dashboard: LayoutDashboard, students: Users, admissions: UserPlus, cohorts: Layers, courses: BookOpen, learning: GraduationCap,
  attendance: CalendarCheck, fees: Wallet, financials: Landmark, instructors: Users, assignments: ClipboardList, classes: Video,
  announcements: Megaphone, messages: MessageSquare, certification: Award, reports: BarChart3, admin: Settings, materials: FolderOpen,
  playground: Code2, quizzes: HelpCircle, grades: Medal, discussions: MessagesSquare, notifications: Bell,
};
const paths = { dashboard: '/' };

// [key, label] per role, mirroring the original portals.
export const menus = {
  ADMIN: [
    ['dashboard', 'Dashboard'], ['students', 'Students'], ['admissions', 'Admissions'], ['cohorts', 'Courses & Cohorts'],
    ['attendance', 'Attendance'], ['fees', 'Fees & Payments'], ['financials', 'Financials'], ['instructors', 'Instructors'],
    ['courses', 'Learning Content'], ['assignments', 'Assignments'], ['classes', 'Online Classes'], ['announcements', 'Announcements'],
    ['messages', 'Messages'], ['certification', 'Certification'], ['reports', 'Reports'], ['admin', 'Administration'],
  ],
  STUDENT: [
    ['dashboard', 'Dashboard'], ['learning', 'My Learning'], ['materials', 'Learning Materials'], ['playground', 'Code Playground'],
    ['assignments', 'Assignments'], ['quizzes', 'Quizzes'], ['grades', 'Grades'], ['attendance', 'Attendance'], ['fees', 'My Fees'],
    ['classes', 'Online Classes'], ['announcements', 'Announcements'], ['messages', 'Private Chat'], ['discussions', 'Group Discussion'],
    ['notifications', 'Notifications'], ['certification', 'Certification'],
  ],
  INSTRUCTOR: [
    ['dashboard', 'Dashboard'], ['students', 'My Students'], ['courses', 'Learning Notes'], ['materials', 'Teaching Materials'],
    ['assignments', 'Assignments & Grading'], ['quizzes', 'Quizzes & Exams'], ['attendance', 'Attendance'], ['classes', 'Online Classes'],
    ['announcements', 'Announcements'], ['messages', 'Private Chat'], ['discussions', 'Group Discussion'], ['notifications', 'Notifications'],
    ['certification', 'Certification'], ['grades', 'Grades'],
  ],
};

export const pathOf = (k) => paths[k] ?? `/${k}`;
export const navItems = (role) => menus[role].map(([k, label]) => ({ key: k, to: pathOf(k), label, icon: icons[k] }));
