import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { 
  Layout, Users, Calendar, MapPin, Settings, ShieldAlert, 
  LogOut, Receipt, Landmark, CreditCard, BookOpen, User, 
  ShieldCheck, UserCheck, Navigation
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  roles?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, logout } = useDatabase();

  const menuItems: MenuItem[] = currentUser?.role === 'trainer' ? [
    { id: 't_dashboard', label: 'Trainer Home', icon: Layout },
    { id: 't_schedule', label: 'My Schedule', icon: Calendar },
    { id: 't_attendance', label: 'Mark Attendance', icon: MapPin },
    { id: 't_report', label: 'Class Reports', icon: BookOpen },
    { id: 't_expenses', label: 'My Expenses', icon: CreditCard },
    { id: 't_salary', label: 'Earnings & Payslips', icon: Landmark },
    { id: 't_profile', label: 'My Profile', icon: User }
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: Layout, roles: ['super_admin', 'management', 'hr', 'finance', 'operations'] },
    { id: 'hr_dashboard', label: 'HR Operations', icon: UserCheck, roles: ['super_admin', 'management', 'hr'] },
    { id: 'trainers', label: 'Trainer Profiles', icon: Users, roles: ['super_admin', 'management', 'hr'] },
    { id: 'training_sites', label: 'Training Sites', icon: Navigation, roles: ['super_admin', 'management', 'operations'] },
    { id: 'operations', label: 'Training Ops', icon: Calendar, roles: ['super_admin', 'management', 'operations'] },
    { id: 'attendance', label: 'Attendance Feed', icon: MapPin, roles: ['super_admin', 'management', 'hr'] },
    { id: 'finance', label: 'Invoices & Quotes', icon: Receipt, roles: ['super_admin', 'management', 'finance'] },
    { id: 'payroll', label: 'Trainer Payroll', icon: Landmark, roles: ['super_admin', 'management', 'finance', 'hr'] },
    { id: 'expenses', label: 'Reimbursements', icon: CreditCard, roles: ['super_admin', 'management', 'finance', 'hr'] },
    { id: 'approvals', label: 'Approval Center', icon: ShieldCheck, roles: ['super_admin', 'management', 'hr', 'finance', 'operations'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['super_admin'] },
    { id: 'audit', label: 'Security Audit', icon: ShieldAlert, roles: ['super_admin', 'management'] }
  ];

  const filteredItems = currentUser?.role === 'trainer'
    ? menuItems
    : menuItems.filter(item => currentUser ? item.roles?.includes(currentUser.role) : false);

  const getLinkClass = (itemId: string) => {
    const base = "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200";
    if (activeTab === itemId) {
      return `${base} bg-[#E50914] text-white shadow-lg shadow-red-500/20 font-bold`;
    }
    return `${base} text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-slate-100`;
  };

  return (
    <aside className="w-64 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-900 flex flex-col h-full shrink-0 transition-colors duration-200">
      {/* Navigation List */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="w-full text-left"
          >
            <div className={getLinkClass(item.id)}>
              <item.icon size={16} className="shrink-0" />
              <span>{item.label}</span>
            </div>
          </button>
        ))}
      </nav>

      {/* Logged in User Indicator & Logout */}
      {currentUser && (
        <div className="p-4 border-t border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/20">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={currentUser.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"}
              alt="avatar"
              className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-750 object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-250 truncate">{currentUser.name}</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide truncate">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-all duration-150 border border-slate-200 dark:border-zinc-800"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
