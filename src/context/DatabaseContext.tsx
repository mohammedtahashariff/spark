import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
  User, Trainer, ClientSite, Schedule, AttendanceRecord, 
  ScheduleChangeRequest, AuditLog, UserRole, ExpenseClaim, 
  PayrollRun, Payslip, Quotation, Invoice, PaymentAllocation, ClassReport
} from '../types';

interface DatabaseContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  trainers: Trainer[];
  sites: ClientSite[];
  schedules: Schedule[];
  attendanceRecords: AttendanceRecord[];
  changeRequests: ScheduleChangeRequest[];
  expenses: ExpenseClaim[];
  payrollRuns: PayrollRun[];
  payslips: Payslip[];
  quotations: Quotation[];
  invoices: Invoice[];
  payments: PaymentAllocation[];
  auditLogs: AuditLog[];
  
  // Actions
  login: (email: string, role: UserRole) => boolean;
  logout: () => void;
  addTrainer: (trainer: Omit<Trainer, 'id'>) => void;
  updateTrainer: (trainer: Trainer) => void;
  addSite: (site: Omit<ClientSite, 'id'>) => void;
  updateSite: (site: ClientSite) => void;
  addSchedule: (schedule: Omit<Schedule, 'id'>) => void;
  updateSchedule: (schedule: Schedule) => void;
  requestScheduleChange: (req: Omit<ScheduleChangeRequest, 'id' | 'trainerId' | 'trainerName' | 'createdAt' | 'status'>) => void;
  reviewScheduleChange: (requestId: string, status: 'Approved' | 'Rejected', remarks: string) => void;
  checkInTrainer: (scheduleId: string, latitude: number, longitude: number, accuracy: number, selfieUrl: string) => { success: boolean; record: AttendanceRecord };
  reviewAttendance: (recordId: string, status: 'Verified' | 'Rejected' | 'Corrected', remarks: string) => void;
  
  // New Actions
  submitClassReport: (scheduleId: string, report: ClassReport) => void;
  submitExpenseClaim: (claim: Omit<ExpenseClaim, 'id' | 'trainerId' | 'trainerName' | 'status' | 'createdAt'>) => void;
  reviewExpenseClaim: (claimId: string, status: 'Approved' | 'Rejected') => void;
  createPayrollRun: (month: string) => PayrollRun | null;
  approvePayrollRun: (runId: string) => void;
  payPayrollRun: (runId: string) => void;
  createQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'status' | 'subtotal' | 'taxTotal' | 'totalAmount'>) => void;
  updateQuotationStatus: (quotId: string, status: Quotation['status']) => void;
  convertQuotationToInvoice: (quotId: string) => void;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'subtotal' | 'taxTotal' | 'totalAmount' | 'amountPaid' | 'outstandingBalance'>) => void;
  issueInvoice: (invoiceId: string) => void;
  recordPayment: (payment: Omit<PaymentAllocation, 'id' | 'paymentNumber'>) => void;
  
  addAuditLog: (action: string, details: string) => void;
  resetDatabase: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

// Helper: Haversine distance in meters
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const DEFAULT_USERS: User[] = [
  { id: 'u1', name: 'Arjun Dev (Super Admin)', email: 'superadmin@spark.com', role: 'super_admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { id: 'u2', name: 'Deepika Rao (MD)', email: 'md@spark.com', role: 'md', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
  { id: 'u7', name: 'Pooja Sharma (Coordinator)', email: 'coordinator@spark.com', role: 'coordinator', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80' },
  { id: 'u3', name: 'Sunitha Krishnan (HR Manager)', email: 'hr@spark.com', role: 'hr', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
  { id: 'u4', name: 'Venkat Ramakrishnan (Finance)', email: 'finance@spark.com', role: 'finance', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
  { id: 'u5', name: 'Suresh Nair (Ops Manager)', email: 'ops@spark.com', role: 'operations', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80' },
  { id: 'u6', name: 'Rajesh Kumar (Trainer)', email: 'trainer@spark.com', role: 'trainer', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80' }
];

const DEFAULT_TRAINERS: Trainer[] = [
  {
    id: 't1',
    individualId: 'TRN-2026-001',
    name: 'Rajesh Kumar',
    email: 'trainer@spark.com',
    phone: '+91 98450 12345',
    status: 'Active',
    rate: 850,
    fixedSalary: 0,
    skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS'],
    documents: [
      { category: 'Onboarding', name: 'Appointment Letter', status: 'Approved', documentNumber: 'SPK-ONB-2026-001', uploadedAt: '2026-01-10' },
      { category: 'Onboarding', name: 'Trainer Agreement', status: 'Approved', documentNumber: 'SPK-AGR-2026-001', uploadedAt: '2026-01-10' },
      { category: 'Identity & profile', name: 'ID Proof (Aadhaar)', status: 'Approved', documentNumber: 'SPK-ID-9923', uploadedAt: '2026-01-10' }
    ]
  },
  {
    id: 't2',
    individualId: 'TRN-2026-002',
    name: 'Dr. Ananya Sharma',
    email: 'ananya.sharma@sparkedutech.com',
    phone: '+91 98860 54321',
    status: 'Active',
    rate: 0,
    fixedSalary: 95000,
    skills: ['Python', 'Django', 'Machine Learning', 'Data Science'],
    documents: [
      { category: 'Onboarding', name: 'Offer Letter', status: 'Approved', documentNumber: 'SPK-OFF-2026-002', uploadedAt: '2026-02-15' },
      { category: 'Identity & profile', name: 'Address Proof', status: 'Approved', documentNumber: 'SPK-ADD-1244', uploadedAt: '2026-02-15' }
    ]
  },
  {
    id: 't3',
    individualId: 'TRN-2026-003',
    name: 'Amit Patel',
    email: 'amit.patel@sparkedutech.com',
    phone: '+91 99000 98765',
    status: 'Onboarding',
    rate: 900,
    fixedSalary: 0,
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker'],
    documents: [
      { category: 'Onboarding', name: 'Joining Form', status: 'Review', documentNumber: 'SPK-JF-2026-089', uploadedAt: '2026-08-20' }
    ]
  }
];

const DEFAULT_SITES: ClientSite[] = [
  { id: 's1', name: 'PES University (Main Campus)', latitude: 12.934968, longitude: 77.534882, geofenceRadius: 200, address: 'Outer Ring Road, Banashankari 3rd Stage, Bengaluru, Karnataka 560085' },
  { id: 's2', name: 'RV College of Engineering (RVCE)', latitude: 12.922687, longitude: 77.498425, geofenceRadius: 200, address: 'Mysore Road, RV Vidyaniketan, Bengaluru, Karnataka 560059' },
  { id: 's3', name: 'Ramaiah Institute of Technology (MSRIT)', latitude: 13.030799, longitude: 77.564883, geofenceRadius: 150, address: 'MSR Nagar, MSRIT Post, Bengaluru, Karnataka 560054' }
];

const getFormattedDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DEFAULT_S_CLASSES = (): Schedule[] => [
  {
    id: 'sch1',
    siteId: 's1',
    siteName: 'PES University (Main Campus)',
    batchName: 'Java Full Stack Batch A',
    courseName: 'OOP Concepts - Inheritance & Polymorphism',
    trainerId: 't1',
    trainerName: 'Rajesh Kumar',
    date: getFormattedDate(0), // Today
    startTime: '10:00',
    endTime: '13:00',
    status: 'Scheduled',
    hours: 3
  },
  {
    id: 'sch2',
    siteId: 's2',
    siteName: 'RV College of Engineering (RVCE)',
    batchName: 'Python Data Science Batch B',
    courseName: 'Web Scraping & DOM Traversal with Beautiful Soup',
    trainerId: 't2',
    trainerName: 'Dr. Ananya Sharma',
    date: getFormattedDate(1), // Tomorrow
    startTime: '14:00',
    endTime: '17:00',
    status: 'Scheduled',
    hours: 3
  },
  {
    id: 'sch3',
    siteId: 's1',
    siteName: 'PES University (Main Campus)',
    batchName: 'React Native Batch C',
    courseName: 'State Management & Custom Context Hooks',
    trainerId: 't1',
    trainerName: 'Rajesh Kumar',
    date: getFormattedDate(-2), // 2 Days Ago
    startTime: '09:00',
    endTime: '12:00',
    status: 'Completed',
    hours: 3,
    report: {
      scheduleId: 'sch3',
      date: getFormattedDate(-2),
      topicCovered: 'State Management with Context API, Reducer hooks, Custom store design',
      deliveredHours: 3,
      studentCount: 55,
      issues: 'No issues. Students completed lab exercise.',
      remarks: 'Lab test evaluated.'
    }
  }
];

const DEFAULT_ATTENDANCE = (): AttendanceRecord[] => [
  {
    id: 'att1',
    trainerId: 't2',
    trainerName: 'Dr. Ananya Sharma',
    date: getFormattedDate(-2),
    checkInTime: '13:54:20',
    serverTimestamp: new Date(getFormattedDate(-2) + 'T13:54:20Z').toISOString(),
    selfieUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=60',
    latitude: 12.922710,
    longitude: 77.498450,
    gpsAccuracy: 10,
    siteId: 's2',
    siteName: 'RV College of Engineering (RVCE)',
    distanceFromSite: 4.2,
    verificationStatus: 'Verified'
  }
];

const DEFAULT_EXPENSES = (): ExpenseClaim[] => [
  {
    id: 'exp1',
    trainerId: 't1',
    trainerName: 'Rajesh Kumar',
    date: getFormattedDate(-2),
    category: 'Travel',
    amount: 850,
    purpose: 'Uber fare to PES University for React Native session',
    siteId: 's1',
    siteName: 'PES University (Main Campus)',
    status: 'Approved',
    createdAt: new Date().toISOString()
  },
  {
    id: 'exp2',
    trainerId: 't2',
    trainerName: 'Dr. Ananya Sharma',
    date: getFormattedDate(0),
    category: 'Food',
    amount: 450,
    purpose: 'Lunch catering during batch evaluation project seminar',
    siteId: 's2',
    siteName: 'RV College of Engineering (RVCE)',
    status: 'Pending',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_PAYROLL = (): PayrollRun[] => [
  {
    id: 'pr_1',
    month: '2026-07',
    runDate: getFormattedDate(-15),
    totalAmount: 114000,
    status: 'Paid',
    payslipsCount: 2,
    approvedBy: 'finance@spark.com'
  }
];

const DEFAULT_PAYSLIPS = (): Payslip[] => [
  {
    id: 'ps_1',
    payrollRunId: 'pr_1',
    trainerId: 't1',
    trainerName: 'Rajesh Kumar',
    month: '2026-07',
    hourlyHours: 40,
    hourlyRate: 850,
    hourlyPay: 34000,
    fixedSalary: 0,
    incentives: 1500,
    deductions: 0,
    approvedExpenses: 1850,
    grossSalary: 37350,
    netSalary: 37350,
    status: 'Paid',
    paymentDate: getFormattedDate(-15)
  },
  {
    id: 'ps_2',
    payrollRunId: 'pr_1',
    trainerId: 't2',
    trainerName: 'Dr. Ananya Sharma',
    month: '2026-07',
    hourlyHours: 0,
    hourlyRate: 0,
    hourlyPay: 0,
    fixedSalary: 95000,
    incentives: 0,
    deductions: 2500,
    approvedExpenses: 0,
    grossSalary: 95000,
    netSalary: 92500,
    status: 'Paid',
    paymentDate: getFormattedDate(-15)
  }
];

const DEFAULT_QUOTATIONS = (): Quotation[] => [
  {
    id: 'q_1',
    quotationNumber: 'SPK-QT-2026-0001',
    customerName: 'RV College of Engineering',
    siteId: 's2',
    siteName: 'RV College of Engineering (RVCE)',
    date: getFormattedDate(-10),
    servicePeriod: 'August 2026',
    lineItems: [
      { description: 'Python/Django Foundation Training (30 hours)', quantity: 30, rate: 1500, taxCode: 'GST 18%', taxAmount: 8100, total: 53100 }
    ],
    subtotal: 45000,
    discount: 0,
    taxTotal: 8100,
    totalAmount: 53100,
    status: 'Converted',
    convertedInvoiceId: 'inv_1'
  }
];

const DEFAULT_INVOICES = (): Invoice[] => [
  {
    id: 'inv_1',
    invoiceNumber: 'SPK-INV-2026-0001',
    quotationId: 'q_1',
    customerName: 'RV College of Engineering',
    siteId: 's2',
    siteName: 'RV College of Engineering (RVCE)',
    date: getFormattedDate(-8),
    dueDate: getFormattedDate(22),
    servicePeriod: 'August 2026',
    lineItems: [
      { description: 'Python/Django Foundation Training (30 hours)', quantity: 30, rate: 1500, taxCode: 'GST 18%', taxAmount: 8100, total: 53100 }
    ],
    subtotal: 45000,
    discount: 0,
    taxTotal: 8100,
    totalAmount: 53100,
    amountPaid: 53100,
    outstandingBalance: 0,
    status: 'Paid'
  },
  {
    id: 'inv_2',
    invoiceNumber: 'SPK-INV-2026-0002',
    customerName: 'PES University',
    siteId: 's1',
    siteName: 'PES University (Main Campus)',
    date: getFormattedDate(-1),
    dueDate: getFormattedDate(29),
    servicePeriod: 'August 2026',
    lineItems: [
      { description: 'Java Full Stack bootcamp program (10 days)', quantity: 10, rate: 12000, taxCode: 'GST 18%', taxAmount: 21600, total: 141600 }
    ],
    subtotal: 120000,
    discount: 0,
    taxTotal: 21600,
    totalAmount: 141600,
    amountPaid: 0,
    outstandingBalance: 141600,
    status: 'Issued'
  }
];

const DEFAULT_PAYMENTS = (): PaymentAllocation[] => [
  {
    id: 'pay_1',
    paymentNumber: 'SPK-REC-2026-001',
    invoiceId: 'inv_1',
    invoiceNumber: 'SPK-INV-2026-0001',
    amount: 53100,
    paymentDate: getFormattedDate(-5),
    paymentMode: 'Bank Transfer',
    referenceNumber: 'NEFTHDFC8932402123'
  }
];

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('spk_theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('spk_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [sites, setSites] = useState<ClientSite[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [changeRequests, setChangeRequests] = useState<ScheduleChangeRequest[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentAllocation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Load from localStorage or seed defaults
  useEffect(() => {
    const localTrainers = localStorage.getItem('spk_trainers');
    const localSites = localStorage.getItem('spk_sites');
    const localSchedules = localStorage.getItem('spk_schedules');
    const localAttendance = localStorage.getItem('spk_attendance');
    const localRequests = localStorage.getItem('spk_requests');
    const localExpenses = localStorage.getItem('spk_expenses');
    const localPayroll = localStorage.getItem('spk_payroll');
    const localPayslips = localStorage.getItem('spk_payslips');
    const localQuotations = localStorage.getItem('spk_quotations');
    const localInvoices = localStorage.getItem('spk_invoices');
    const localPayments = localStorage.getItem('spk_payments');
    const localAudit = localStorage.getItem('spk_audit');
    const localCurrentUser = localStorage.getItem('spk_current_user');

    if (localTrainers) {
      const parsed: Trainer[] = JSON.parse(localTrainers);
      const migrated = parsed.map((t, idx) => ({
        ...t,
        individualId: t.individualId || `TRN-2026-${String(idx + 1).padStart(3, '0')}`
      }));
      setTrainers(migrated);
      localStorage.setItem('spk_trainers', JSON.stringify(migrated));
    } else {
      setTrainers(DEFAULT_TRAINERS);
      localStorage.setItem('spk_trainers', JSON.stringify(DEFAULT_TRAINERS));
    }

    if (localSites) setSites(JSON.parse(localSites));
    else {
      setSites(DEFAULT_SITES);
      localStorage.setItem('spk_sites', JSON.stringify(DEFAULT_SITES));
    }

    if (localSchedules) setSchedules(JSON.parse(localSchedules));
    else {
      const initSchedules = DEFAULT_S_CLASSES();
      setSchedules(initSchedules);
      localStorage.setItem('spk_schedules', JSON.stringify(initSchedules));
    }

    if (localAttendance) setAttendanceRecords(JSON.parse(localAttendance));
    else {
      const initAttendance = DEFAULT_ATTENDANCE();
      setAttendanceRecords(initAttendance);
      localStorage.setItem('spk_attendance', JSON.stringify(initAttendance));
    }

    if (localRequests) setChangeRequests(JSON.parse(localRequests));
    else {
      const initReqs = DEFAULT_REQUESTS();
      setChangeRequests(initReqs);
      localStorage.setItem('spk_requests', JSON.stringify(initReqs));
    }

    if (localExpenses) setExpenses(JSON.parse(localExpenses));
    else {
      const initExpenses = DEFAULT_EXPENSES();
      setExpenses(initExpenses);
      localStorage.setItem('spk_expenses', JSON.stringify(initExpenses));
    }

    if (localPayroll) setPayrollRuns(JSON.parse(localPayroll));
    else {
      const initPayroll = DEFAULT_PAYROLL();
      setPayrollRuns(initPayroll);
      localStorage.setItem('spk_payroll', JSON.stringify(initPayroll));
    }

    if (localPayslips) setPayslips(JSON.parse(localPayslips));
    else {
      const initPayslips = DEFAULT_PAYSLIPS();
      setPayslips(initPayslips);
      localStorage.setItem('spk_payslips', JSON.stringify(initPayslips));
    }

    if (localQuotations) setQuotations(JSON.parse(localQuotations));
    else {
      const initQuot = DEFAULT_QUOTATIONS();
      setQuotations(initQuot);
      localStorage.setItem('spk_quotations', JSON.stringify(initQuot));
    }

    if (localInvoices) setInvoices(JSON.parse(localInvoices));
    else {
      const initInvoices = DEFAULT_INVOICES();
      setInvoices(initInvoices);
      localStorage.setItem('spk_invoices', JSON.stringify(initInvoices));
    }

    if (localPayments) setPayments(JSON.parse(localPayments));
    else {
      const initPayments = DEFAULT_PAYMENTS();
      setPayments(initPayments);
      localStorage.setItem('spk_payments', JSON.stringify(initPayments));
    }

    if (localAudit) setAuditLogs(JSON.parse(localAudit));
    else {
      const initAudit: AuditLog[] = [];
      setAuditLogs(initAudit);
    }

    if (localCurrentUser) {
      const parsedUser = JSON.parse(localCurrentUser);
      if (parsedUser.role === 'management') {
        parsedUser.role = 'md';
        parsedUser.name = 'Deepika Rao (MD)';
        parsedUser.email = 'md@spark.com';
        localStorage.setItem('spk_current_user', JSON.stringify(parsedUser));
      }
      setCurrentUserState(parsedUser);
    }
  }, []);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('spk_current_user', JSON.stringify(user));
      addAuditLogWithUser(user, 'User Login', `Logged in as ${user.name} (${user.role.toUpperCase()})`);
    } else {
      localStorage.removeItem('spk_current_user');
    }
  };

  const addAuditLogWithUser = (user: User, action: string, details: string) => {
    const newLog: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      userEmail: user.email,
      userName: user.name,
      role: user.role,
      action,
      details,
      ipAddress: '192.168.1.101',
      deviceInfo: 'Spark Simulation / Chrome 128'
    };

    setAuditLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100);
      localStorage.setItem('spk_audit', JSON.stringify(updated));
      return updated;
    });
  };

  const addAuditLog = (action: string, details: string) => {
    if (!currentUser) return;
    addAuditLogWithUser(currentUser, action, details);
  };

  const login = (email: string, role: UserRole): boolean => {
    const normalizedRole = (role as string) === 'management' ? 'md' : role;
    const user = DEFAULT_USERS.find(u => (u.email === email || (role === 'md' && u.email === 'md@spark.com')) && u.role === normalizedRole);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    const fallbackUser: User = {
      id: 'u_' + Date.now(),
      name: email.split('@')[0].toUpperCase(),
      email,
      role: normalizedRole,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'
    };
    setCurrentUser(fallbackUser);
    return true;
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('User Logout', `Logged out user ${currentUser.email}`);
    }
    setCurrentUser(null);
  };

  const addTrainer = (newTrainer: Omit<Trainer, 'id'>) => {
    const nextSeq = trainers.length + 1;
    const trainer: Trainer = {
      ...newTrainer,
      id: 't_' + Date.now(),
      individualId: newTrainer.individualId || `TRN-2026-${String(nextSeq).padStart(3, '0')}`
    };
    setTrainers(prev => {
      const updated = [...prev, trainer];
      localStorage.setItem('spk_trainers', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Trainer Added', `HR onboarding initiated for trainer ${trainer.name} (ID: ${trainer.individualId})`);
  };

  const updateTrainer = (updatedTrainer: Trainer) => {
    setTrainers(prev => {
      const updated = prev.map(t => t.id === updatedTrainer.id ? updatedTrainer : t);
      localStorage.setItem('spk_trainers', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Trainer Updated', `Updated profile/documents for trainer ${updatedTrainer.name}`);
  };

  const addSite = (newSite: Omit<ClientSite, 'id'>) => {
    const site: ClientSite = {
      ...newSite,
      id: 's_' + Date.now()
    };
    setSites(prev => {
      const updated = [...prev, site];
      localStorage.setItem('spk_sites', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Site Created', `Created client training site: ${site.name}`);
  };

  const updateSite = (updatedSite: ClientSite) => {
    setSites(prev => {
      const updated = prev.map(s => s.id === updatedSite.id ? updatedSite : s);
      localStorage.setItem('spk_sites', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Site Updated', `Updated settings/geofence for site ${updatedSite.name}`);
  };

  const addSchedule = (newSchedule: Omit<Schedule, 'id'>) => {
    const schedule: Schedule = {
      ...newSchedule,
      id: 'sch_' + Date.now()
    };
    setSchedules(prev => {
      const updated = [...prev, schedule];
      localStorage.setItem('spk_schedules', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Schedule Created', `Created schedule class ${schedule.courseName} for trainer ${schedule.trainerName}`);
  };

  const updateSchedule = (updatedSchedule: Schedule) => {
    setSchedules(prev => {
      const updated = prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s);
      localStorage.setItem('spk_schedules', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Schedule Updated', `Updated schedule class details (ID: ${updatedSchedule.id})`);
  };

  const DEFAULT_REQUESTS = (): ScheduleChangeRequest[] => [
    {
      id: 'req2',
      scheduleId: 'sch1',
      trainerId: 't1',
      trainerName: 'John Doe',
      batchName: 'Java Batch A',
      courseName: 'OOP - Inheritance & Polymorphism',
      originalDate: getFormattedDate(0),
      originalStartTime: '10:00',
      originalEndTime: '13:00',
      requestedDate: getFormattedDate(0),
      requestedStartTime: '14:00',
      requestedEndTime: '17:00',
      reason: 'Urgent family work in the morning',
      status: 'Pending',
      createdAt: new Date().toISOString()
    }
  ];

  const requestScheduleChange = (req: Omit<ScheduleChangeRequest, 'id' | 'trainerId' | 'trainerName' | 'createdAt' | 'status'>) => {
    if (!currentUser || currentUser.role !== 'trainer') return;
    const trainer = trainers.find(t => t.email === currentUser.email) || trainers[0];
    const schedule = schedules.find(s => s.id === req.scheduleId);
    if (!schedule) return;

    const request: ScheduleChangeRequest = {
      ...req,
      id: 'req_' + Date.now(),
      trainerId: trainer.id,
      trainerName: trainer.name,
      createdAt: new Date().toISOString(),
      status: 'Pending'
    };

    setChangeRequests(prev => {
      const updated = [request, ...prev];
      localStorage.setItem('spk_requests', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Schedule Change Submit', `Trainer ${trainer.name} requested schedule change for class ${schedule.courseName}`);
  };

  const reviewScheduleChange = (requestId: string, status: 'Approved' | 'Rejected', remarks: string) => {
    if (!currentUser) return;
    let targetTrainer = '';
    let targetCourse = '';
    let targetScheduleId = '';
    let newDate = '';
    let newStart = '';
    let newEnd = '';

    setChangeRequests(prev => {
      const updated = prev.map(r => {
        if (r.id === requestId) {
          targetTrainer = r.trainerName;
          targetCourse = r.courseName;
          targetScheduleId = r.scheduleId;
          newDate = r.requestedDate;
          newStart = r.requestedStartTime;
          newEnd = r.requestedEndTime;
          return {
            ...r,
            status,
            reviewRemarks: remarks,
            reviewedBy: currentUser.email,
            reviewedAt: new Date().toISOString()
          };
        }
        return r;
      });
      localStorage.setItem('spk_requests', JSON.stringify(updated));
      return updated;
    });

    if (status === 'Approved' && targetScheduleId) {
      setSchedules(prev => {
        const updated = prev.map(s => {
          if (s.id === targetScheduleId) {
            return {
              ...s,
              date: newDate,
              startTime: newStart,
              endTime: newEnd,
              status: 'Rescheduled' as const
            };
          }
          return s;
        });
        localStorage.setItem('spk_schedules', JSON.stringify(updated));
        return updated;
      });
    }

    addAuditLog('Schedule Change Review', `${status} schedule change request for trainer ${targetTrainer} on class ${targetCourse}`);
  };

  const checkInTrainer = (scheduleId: string, latitude: number, longitude: number, accuracy: number, selfieUrl: string): { success: boolean; record: AttendanceRecord } => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) throw new Error('Schedule class not found');
    const site = sites.find(s => s.id === schedule.siteId);
    if (!site) throw new Error('Client Site not found');

    const distance = calculateDistance(latitude, longitude, site.latitude, site.longitude);
    const isWithinGeofence = distance <= site.geofenceRadius;
    const verificationStatus = isWithinGeofence ? 'Verified' : 'Review';

    const newRecord: AttendanceRecord = {
      id: 'att_' + Date.now(),
      trainerId: schedule.trainerId,
      trainerName: schedule.trainerName,
      date: schedule.date,
      checkInTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
      serverTimestamp: new Date().toISOString(),
      selfieUrl,
      latitude,
      longitude,
      gpsAccuracy: accuracy,
      siteId: site.id,
      siteName: site.name,
      distanceFromSite: parseFloat(distance.toFixed(1)),
      verificationStatus
    };

    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => !(r.trainerId === schedule.trainerId && r.date === schedule.date));
      const updated = [newRecord, ...filtered];
      localStorage.setItem('spk_attendance', JSON.stringify(updated));
      return updated;
    });

    addAuditLog(
      'Trainer Attendance Checkin',
      `Trainer ${schedule.trainerName} marked attendance for ${schedule.courseName}. Distance: ${distance.toFixed(1)}m. Geofence Status: ${verificationStatus}.`
    );

    return { success: true, record: newRecord };
  };

  const reviewAttendance = (recordId: string, status: 'Verified' | 'Rejected' | 'Corrected', remarks: string) => {
    if (!currentUser) return;
    let trainer = '';
    let checkInDate = '';

    setAttendanceRecords(prev => {
      const updated = prev.map(r => {
        if (r.id === recordId) {
          trainer = r.trainerName;
          checkInDate = r.date;
          return {
            ...r,
            verificationStatus: status,
            adminRemarks: remarks,
            reviewedBy: currentUser.email,
            reviewedAt: new Date().toISOString()
          };
        }
        return r;
      });
      localStorage.setItem('spk_attendance', JSON.stringify(updated));
      return updated;
    });

    addAuditLog('Attendance Review Override', `Admin overridden attendance record (ID: ${recordId}) for ${trainer} on ${checkInDate} to status: ${status}. Remarks: "${remarks}"`);
  };

  // 1. Submit Training Delivery Report
  const submitClassReport = (scheduleId: string, report: ClassReport) => {
    setSchedules(prev => {
      const updated = prev.map(s => s.id === scheduleId ? { ...s, report, status: 'Completed' as const } : s);
      localStorage.setItem('spk_schedules', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Training Report Submitted', `Submitted topics delivery report for schedule class ID: ${scheduleId}`);
  };

  // 2. Submit Trainer Expense Claim
  const submitExpenseClaim = (claim: Omit<ExpenseClaim, 'id' | 'trainerId' | 'trainerName' | 'status' | 'createdAt'>) => {
    if (!currentUser) return;
    const trainer = trainers.find(t => t.email === currentUser.email) || trainers[0];

    const newClaim: ExpenseClaim = {
      ...claim,
      id: 'exp_' + Date.now(),
      trainerId: trainer.id,
      trainerName: trainer.name,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    setExpenses(prev => {
      const updated = [newClaim, ...prev];
      localStorage.setItem('spk_expenses', JSON.stringify(updated));
      return updated;
    });

    addAuditLog('Expense Claim Submitted', `Trainer ${trainer.name} submitted a ₹${claim.amount} claim for ${claim.category}.`);
  };

  // 3. Review Trainer Expense Claim
  const reviewExpenseClaim = (claimId: string, status: 'Approved' | 'Rejected') => {
    if (!currentUser) return;
    let trainerName = '';
    let amount = 0;

    setExpenses(prev => {
      const updated = prev.map(c => {
        if (c.id === claimId) {
          trainerName = c.trainerName;
          amount = c.amount;
          return {
            ...c,
            status,
            reviewedBy: currentUser.email,
            reviewedAt: new Date().toISOString()
          };
        }
        return c;
      });
      localStorage.setItem('spk_expenses', JSON.stringify(updated));
      return updated;
    });

    addAuditLog('Expense Claim Reviewed', `${status} ₹${amount} expense claim for trainer ${trainerName}`);
  };

  // 4. Create Payroll Cycle Run
  const createPayrollRun = (month: string): PayrollRun | null => {
    if (!currentUser) return null;
    const existing = payrollRuns.find(r => r.month === month);
    if (existing) return existing;

    const runId = 'pr_' + Date.now();
    const runDate = new Date().toISOString().split('T')[0];
    const activeTrainers = trainers.filter(t => t.status === 'Active');
    const newPayslips: Payslip[] = [];
    let grandTotal = 0;

    activeTrainers.forEach(t => {
      const completedClasses = schedules.filter(
        s => s.trainerId === t.id && s.status === 'Completed' && s.date.startsWith(month)
      );
      const hours = completedClasses.reduce((sum, s) => sum + s.hours, 0);
      const hourlyPay = t.rate > 0 ? hours * t.rate : 0;
      
      const trainerExpenses = expenses.filter(
        e => e.trainerId === t.id && e.status === 'Approved' && e.date.startsWith(month)
      );
      const approvedExpenses = trainerExpenses.reduce((sum, e) => sum + e.amount, 0);

      const grossSalary = t.fixedSalary > 0 ? t.fixedSalary : hourlyPay;
      const netSalary = grossSalary + approvedExpenses;

      if (netSalary > 0) {
        newPayslips.push({
          id: 'ps_' + Math.random().toString(36).substr(2, 9),
          payrollRunId: runId,
          trainerId: t.id,
          trainerName: t.name,
          month,
          hourlyHours: hours,
          hourlyRate: t.rate,
          hourlyPay,
          fixedSalary: t.fixedSalary,
          incentives: 0,
          deductions: 0,
          approvedExpenses,
          grossSalary,
          netSalary,
          status: 'Draft'
        });
        grandTotal += netSalary;
      }
    });

    const newRun: PayrollRun = {
      id: runId,
      month,
      runDate,
      totalAmount: grandTotal,
      status: 'Draft',
      payslipsCount: newPayslips.length
    };

    setPayrollRuns(prev => {
      const updated = [newRun, ...prev];
      localStorage.setItem('spk_payroll', JSON.stringify(updated));
      return updated;
    });

    setPayslips(prev => {
      const updated = [...newPayslips, ...prev];
      localStorage.setItem('spk_payslips', JSON.stringify(updated));
      return updated;
    });

    addAuditLog('Payroll Run Initiated', `Created Draft payroll run for cycle: ${month}. Total: ₹${grandTotal.toLocaleString()}`);
    return newRun;
  };

  const approvePayrollRun = (runId: string) => {
    if (!currentUser) return;
    
    setPayrollRuns(prev => {
      const updated = prev.map(r => r.id === runId ? { ...r, status: 'Approved' as const, approvedBy: currentUser.email } : r);
      localStorage.setItem('spk_payroll', JSON.stringify(updated));
      return updated;
    });

    setPayslips(prev => {
      const updated = prev.map(p => p.payrollRunId === runId ? { ...p, status: 'Approved' as const } : p);
      localStorage.setItem('spk_payslips', JSON.stringify(updated));
      return updated;
    });

    addAuditLog('Payroll Run Approved', `Approved payroll run ID: ${runId}`);
  };

  const payPayrollRun = (runId: string) => {
    setPayrollRuns(prev => {
      const updated = prev.map(r => r.id === runId ? { ...r, status: 'Paid' as const } : r);
      localStorage.setItem('spk_payroll', JSON.stringify(updated));
      return updated;
    });

    setPayslips(prev => {
      const updated = prev.map(p => p.payrollRunId === runId ? { ...p, status: 'Paid' as const, paymentDate: new Date().toISOString().split('T')[0] } : p);
      localStorage.setItem('spk_payslips', JSON.stringify(updated));
      return updated;
    });

    addAuditLog('Payroll Run Paid', `Paid salaries for run ID: ${runId}`);
  };

  // 5. Quotation Actions
  const createQuotation = (quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'status' | 'subtotal' | 'taxTotal' | 'totalAmount'>) => {
    const subtotal = quotation.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const taxTotal = quotation.lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal - quotation.discount + taxTotal;

    const newQuotation: Quotation = {
      ...quotation,
      id: 'q_' + Date.now(),
      quotationNumber: `SPK-QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      subtotal,
      taxTotal,
      totalAmount,
      status: 'Draft'
    };

    setQuotations(prev => {
      const updated = [newQuotation, ...prev];
      localStorage.setItem('spk_quotations', JSON.stringify(updated));
      return updated;
    });

    addAuditLog('Quotation Created', `Created Quotation: ${newQuotation.quotationNumber}`);
  };

  const updateQuotationStatus = (quotId: string, status: Quotation['status']) => {
    setQuotations(prev => {
      const updated = prev.map(q => q.id === quotId ? { ...q, status } : q);
      localStorage.setItem('spk_quotations', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Quotation Updated', `Updated Quotation ID: ${quotId} status to ${status}`);
  };

  const convertQuotationToInvoice = (quotId: string) => {
    const quot = quotations.find(q => q.id === quotId);
    if (!quot) return;

    const invoiceId = 'inv_' + Date.now();
    const invoiceNumber = `SPK-INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + 30);

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      quotationId: quot.id,
      customerName: quot.customerName,
      siteId: quot.siteId,
      siteName: quot.siteName,
      date: today,
      dueDate: due.toISOString().split('T')[0],
      servicePeriod: quot.servicePeriod,
      lineItems: quot.lineItems,
      subtotal: quot.subtotal,
      discount: quot.discount,
      taxTotal: quot.taxTotal,
      totalAmount: quot.totalAmount,
      amountPaid: 0,
      outstandingBalance: quot.totalAmount,
      status: 'Draft'
    };

    setQuotations(prev => {
      const updated = prev.map(q => q.id === quotId ? { ...q, status: 'Converted' as const, convertedInvoiceId: invoiceId } : q);
      localStorage.setItem('spk_quotations', JSON.stringify(updated));
      return updated;
    });

    setInvoices(prev => {
      const updated = [newInvoice, ...prev];
      localStorage.setItem('spk_invoices', JSON.stringify(updated));
      return updated;
    });

    addAuditLog('Quotation Converted', `Converted Quotation ${quot.quotationNumber} into Tax Invoice: ${invoiceNumber}`);
  };

  const createInvoice = (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'subtotal' | 'taxTotal' | 'totalAmount' | 'amountPaid' | 'outstandingBalance'>) => {
    const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const taxTotal = invoice.lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal - invoice.discount + taxTotal;

    const newInvoice: Invoice = {
      ...invoice,
      id: 'inv_' + Date.now(),
      invoiceNumber: `SPK-INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      subtotal,
      taxTotal,
      totalAmount,
      amountPaid: 0,
      outstandingBalance: totalAmount,
      status: 'Draft'
    };

    setInvoices(prev => {
      const updated = [newInvoice, ...prev];
      localStorage.setItem('spk_invoices', JSON.stringify(updated));
      return updated;
    });

    addAuditLog('Invoice Created', `Created Tax Invoice: ${newInvoice.invoiceNumber}`);
  };

  const issueInvoice = (invoiceId: string) => {
    setInvoices(prev => {
      const updated = prev.map(inv => inv.id === invoiceId ? { ...inv, status: 'Issued' as const } : inv);
      localStorage.setItem('spk_invoices', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Invoice Issued', `Issued Invoice ID: ${invoiceId} officially to client.`);
  };

  const recordPayment = (payment: Omit<PaymentAllocation, 'id' | 'paymentNumber'>) => {
    const paymentNum = `SPK-REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const paymentId = 'pay_' + Date.now();

    const newPayment: PaymentAllocation = {
      ...payment,
      id: paymentId,
      paymentNumber: paymentNum
    };

    setPayments(prev => {
      const updated = [newPayment, ...prev];
      localStorage.setItem('spk_payments', JSON.stringify(updated));
      return updated;
    });

    setInvoices(prev => {
      const updated = prev.map(inv => {
        if (inv.id === payment.invoiceId) {
          const newPaid = inv.amountPaid + payment.amount;
          const newOutstanding = Math.max(0, inv.totalAmount - newPaid);
          return {
            ...inv,
            amountPaid: newPaid,
            outstandingBalance: newOutstanding,
            status: newOutstanding === 0 ? 'Paid' as const : 'Part Paid' as const
          };
        }
        return inv;
      });
      localStorage.setItem('spk_invoices', JSON.stringify(updated));
      return updated;
    });

    addAuditLog('Payment Allocated', `Recorded payment of ₹${payment.amount} allocated against Invoice: ${payment.invoiceNumber}`);
  };

  const resetDatabase = () => {
    localStorage.removeItem('spk_trainers');
    localStorage.removeItem('spk_sites');
    localStorage.removeItem('spk_schedules');
    localStorage.removeItem('spk_attendance');
    localStorage.removeItem('spk_requests');
    localStorage.removeItem('spk_expenses');
    localStorage.removeItem('spk_payroll');
    localStorage.removeItem('spk_payslips');
    localStorage.removeItem('spk_quotations');
    localStorage.removeItem('spk_invoices');
    localStorage.removeItem('spk_payments');
    localStorage.removeItem('spk_audit');
    localStorage.removeItem('spk_current_user');

    setTrainers(DEFAULT_TRAINERS);
    setSites(DEFAULT_SITES);
    setSchedules(DEFAULT_S_CLASSES());
    setAttendanceRecords(DEFAULT_ATTENDANCE());
    setChangeRequests(DEFAULT_REQUESTS());
    setExpenses(DEFAULT_EXPENSES());
    setPayrollRuns(DEFAULT_PAYROLL());
    setPayslips(DEFAULT_PAYSLIPS());
    setQuotations(DEFAULT_QUOTATIONS());
    setInvoices(DEFAULT_INVOICES());
    setPayments(DEFAULT_PAYMENTS());
    setAuditLogs([]);
    setCurrentUserState(null);
    localStorage.removeItem('spk_current_user');
  };

  return (
    <DatabaseContext.Provider value={{
      currentUser,
      setCurrentUser,
      users: DEFAULT_USERS,
      trainers,
      sites,
      schedules,
      attendanceRecords,
      changeRequests,
      expenses,
      payrollRuns,
      payslips,
      quotations,
      invoices,
      payments,
      auditLogs,
      login,
      logout,
      addTrainer,
      updateTrainer,
      addSite,
      updateSite,
      addSchedule,
      updateSchedule,
      requestScheduleChange,
      reviewScheduleChange,
      checkInTrainer,
      reviewAttendance,
      submitClassReport,
      submitExpenseClaim,
      reviewExpenseClaim,
      createPayrollRun,
      approvePayrollRun,
      payPayrollRun,
      createQuotation,
      updateQuotationStatus,
      convertQuotationToInvoice,
      createInvoice,
      issueInvoice,
      recordPayment,
      addAuditLog,
      resetDatabase,
      theme,
      toggleTheme
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
