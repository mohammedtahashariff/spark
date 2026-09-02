import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { 
  User, Trainer, ClientSite, Schedule, AttendanceRecord, 
  ScheduleChangeRequest, AuditLog, UserRole, ExpenseClaim, 
  PayrollRun, Payslip, Quotation, Invoice, PaymentAllocation, ClassReport,
  LoginHistoryItem, RealTimeEvent, RealTimeEventType, ReimbursementPaymentStatus
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
  lastLogins: Record<string, string>;
  loginHistoryList: LoginHistoryItem[];
  realtimeEvents: RealTimeEvent[];
  latestEvent: RealTimeEvent | null;
  
  // Inactivity & Session Management
  sessionExpiredMessage: string | null;
  setSessionExpiredMessage: (msg: string | null) => void;
  showInactivityWarning: boolean;
  inactivitySecondsRemaining: number;
  extendSession: () => void;
  
  // Actions
  login: (email: string, role: UserRole) => boolean;
  logout: (reason?: string) => void;
  
  // Trainer Management
  addTrainer: (trainer: Omit<Trainer, 'id'>) => void;
  updateTrainer: (trainer: Trainer) => void;
  updateTrainerDateOfJoining: (trainerId: string, date: string) => void;
  updateTrainerDOJ: (trainerId: string, date: string) => void;
  uploadTrainerResume: (trainerId: string, resumeFile: { name: string; url: string; size: string }) => void;
  deleteTrainerResume: (trainerId: string) => void;
  
  // Site Management
  addSite: (site: Omit<ClientSite, 'id'>) => void;
  updateSite: (site: ClientSite) => void;
  deleteSite: (siteId: string) => void;
  
  // Schedule Management
  addSchedule: (schedule: Omit<Schedule, 'id'>) => void;
  updateSchedule: (schedule: Schedule) => void;
  requestScheduleChange: (req: Omit<ScheduleChangeRequest, 'id' | 'trainerId' | 'trainerName' | 'createdAt' | 'status'>) => void;
  reviewScheduleChange: (requestId: string, status: 'Approved' | 'Rejected', remarks: string) => void;
  
  // Attendance Management
  checkInTrainer: (scheduleId: string, latitude: number, longitude: number, accuracy: number, selfieUrl: string, locationAddress?: string) => { success: boolean; record: AttendanceRecord };
  reviewAttendance: (recordId: string, status: 'Verified' | 'Rejected' | 'Corrected', remarks: string) => void;
  
  // Reports & Expenses
  submitClassReport: (scheduleId: string, report: ClassReport) => void;
  submitExpenseClaim: (claim: Omit<ExpenseClaim, 'id' | 'trainerId' | 'trainerName' | 'status' | 'paymentStatus' | 'createdAt'>) => void;
  reviewExpenseClaim: (claimId: string, status: 'Approved' | 'Rejected') => void;
  markExpensePaid: (claimId: string, paymentDetails: { paidAmount: number; paymentDate: string; paymentReference: string; paymentMethod: string }) => void;
  
  // Payroll Management
  createPayrollRun: (month: string) => PayrollRun | null;
  approvePayrollRun: (runId: string) => void;
  payPayrollRun: (runId: string) => void;
  
  // Finance & Invoicing
  createQuotation: (quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'status' | 'subtotal' | 'taxTotal' | 'totalAmount'>) => void;
  updateQuotationStatus: (quotId: string, status: Quotation['status']) => void;
  convertQuotationToInvoice: (quotId: string) => void;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'subtotal' | 'taxTotal' | 'totalAmount' | 'amountPaid' | 'outstandingBalance'>) => void;
  approveInvoice: (invoiceId: string) => void;
  issueInvoice: (invoiceId: string) => void;
  recordPayment: (payment: Omit<PaymentAllocation, 'id' | 'paymentNumber'>) => void;
  
  // Real-time & Audit
  broadcastRealTimeEvent: (type: RealTimeEventType, title: string, message: string, data?: any) => void;
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

function getFormattedDate(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_USERS: User[] = [
  { id: 'u1', name: 'Arjun Dev (Super Admin)', email: 'superadmin@spark.com', role: 'super_admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { id: 'u2', name: 'Deepika Rao (Director)', email: 'management@spark.com', role: 'management', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
  { id: 'u3', name: 'Sunitha Krishnan (HR Manager)', email: 'hr@spark.com', role: 'hr', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
  { id: 'u4', name: 'Venkat Ramakrishnan (Finance)', email: 'finance@spark.com', role: 'finance', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
  { id: 'u5', name: 'Suresh Nair (Ops Manager)', email: 'ops@spark.com', role: 'operations', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80' },
  { id: 'u6', name: 'Mohammed Taha (Trainer)', email: 'trainer@spark.com', role: 'trainer', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80' }
];

const DEFAULT_TRAINERS: Trainer[] = [
  {
    id: 't1',
    individualId: 'TRN-2026-001',
    name: 'Mohammed Taha',
    email: 'trainer@spark.com',
    phone: '+91 98450 99881',
    status: 'Active',
    rate: 1200,
    fixedSalary: 0,
    skills: ['Full Stack Development', 'React / Node.js', 'System Architecture', 'Python AI'],
    dateOfJoining: '2024-06-15',
    resumeUrl: '/resumes/mohammed_taha_resume.pdf',
    resumeName: 'Mohammed_Taha_Resume.pdf',
    resumeUploadedAt: '2026-08-15',
    resumeSize: '1.4 MB',
    lastLoginAt: '2026-09-01T09:31:00Z',
    documents: [
      { category: 'Onboarding', name: 'Offer Letter', status: 'Approved', documentNumber: 'DLT-OFF-2024-089', uploadedAt: '2024-06-15' },
      { category: 'Legal', name: 'Master Trainer Agreement', status: 'Approved', documentNumber: 'DLT-AGR-2024-089', uploadedAt: '2024-06-16' },
      { category: 'Identity', name: 'Aadhaar Card / Govt ID', status: 'Approved', documentNumber: 'DLT-ID-2024-089', uploadedAt: '2024-06-15' }
    ]
  },
  {
    id: 't2',
    individualId: 'TRN-2026-002',
    name: 'Dr. Ananya Sharma',
    email: 'ananya.sharma@spark.com',
    phone: '+91 98860 12345',
    status: 'Active',
    rate: 0,
    fixedSalary: 95000,
    skills: ['Data Science', 'Machine Learning', 'Python / PyTorch', 'Computer Vision'],
    dateOfJoining: '2023-11-01',
    resumeUrl: '/resumes/ananya_sharma_resume.pdf',
    resumeName: 'Dr_Ananya_Sharma_CV.pdf',
    resumeUploadedAt: '2026-07-20',
    resumeSize: '2.1 MB',
    lastLoginAt: '2026-08-31T09:12:00Z',
    documents: [
      { category: 'Onboarding', name: 'Offer Letter', status: 'Approved', documentNumber: 'DLT-OFF-2023-012', uploadedAt: '2023-11-01' },
      { category: 'Credentials', name: 'PhD Certificate in CS', status: 'Approved', documentNumber: 'DLT-DOC-2023-012', uploadedAt: '2023-11-01' }
    ]
  },
  {
    id: 't3',
    individualId: 'TRN-2026-003',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@spark.com',
    phone: '+91 97410 56789',
    status: 'Active',
    rate: 950,
    fixedSalary: 0,
    skills: ['Java Enterprise', 'Spring Boot', 'Microservices', 'AWS Cloud'],
    dateOfJoining: '2025-02-10',
    resumeUrl: '/resumes/rajesh_kumar_resume.pdf',
    resumeName: 'Rajesh_Kumar_Resume.pdf',
    resumeUploadedAt: '2026-08-01',
    resumeSize: '950 KB',
    lastLoginAt: '2026-08-30T10:00:00Z',
    documents: [
      { category: 'Onboarding', name: 'Offer Letter', status: 'Approved', documentNumber: 'DLT-OFF-2025-045', uploadedAt: '2025-02-10' }
    ]
  },
  {
    id: 't4',
    individualId: 'TRN-2026-004',
    name: 'Priya Sundaram',
    email: 'priya.sundaram@spark.com',
    phone: '+91 99002 44332',
    status: 'Onboarding',
    rate: 850,
    fixedSalary: 0,
    skills: ['UI/UX Design', 'React Native', 'Mobile Systems'],
    dateOfJoining: '2026-08-25',
    resumeUrl: '/resumes/priya_sundaram_resume.pdf',
    resumeName: 'Priya_Sundaram_Portfolio.pdf',
    resumeUploadedAt: '2026-08-26',
    resumeSize: '3.2 MB',
    documents: [
      { category: 'Onboarding', name: 'Offer Letter', status: 'Review', documentNumber: 'DLT-OFF-2026-102', uploadedAt: '2026-08-25' }
    ]
  },
  {
    id: 't5',
    individualId: 'TRN-2026-005',
    name: 'Vikram Malhotra',
    email: 'vikram.m@spark.com',
    phone: '+91 98451 11223',
    status: 'Suspended',
    rate: 1100,
    fixedSalary: 0,
    skills: ['Cybersecurity', 'Ethical Hacking', 'Network Security'],
    dateOfJoining: '2024-01-20',
    documents: []
  }
];

const DEFAULT_SITES: ClientSite[] = [
  {
    id: 's1',
    name: 'Bangalore Training Center (Main Site)',
    latitude: 12.9716,
    longitude: 77.5946,
    geofenceRadius: 100,
    address: 'MG Road, Bangalore, Karnataka - 560001',
    contactPerson: 'Prof. Narayana Murthy',
    contactNumber: '+91 98765 43210',
    status: 'Active'
  },
  {
    id: 's2',
    name: 'PES University (Main Campus)',
    latitude: 12.9344,
    longitude: 77.5345,
    geofenceRadius: 200,
    address: '100 Feet Ring Road, BSK III Stage, Bangalore - 560085',
    contactPerson: 'Dr. K. S. Sridhar',
    contactNumber: '+91 98450 12345',
    status: 'Active'
  },
  {
    id: 's3',
    name: 'RV College of Engineering (RVCE)',
    latitude: 12.9237,
    longitude: 77.4987,
    geofenceRadius: 200,
    address: 'Mysore Road, RV Vidyaniketan Post, Bangalore - 560059',
    contactPerson: 'Dr. Subramanya K. N.',
    contactNumber: '+91 99001 54321',
    status: 'Active'
  },
  {
    id: 's4',
    name: 'BMS College of Engineering',
    latitude: 12.9410,
    longitude: 77.5655,
    geofenceRadius: 150,
    address: 'Bull Temple Road, Basavanagudi, Bangalore - 560019',
    contactPerson: 'Dr. Muralidhara S.',
    contactNumber: '+91 94480 98765',
    status: 'Active'
  }
];

const DEFAULT_S_CLASSES = (): Schedule[] => [
  {
    id: 'sch1',
    siteId: 's1',
    siteName: 'Bangalore Training Center (Main Site)',
    batchName: 'AI & Full Stack Mastery Batch A',
    courseName: 'Advanced Distributed Systems & Microservices',
    trainerId: 't1',
    trainerName: 'Mohammed Taha',
    date: getFormattedDate(0), // Today
    startTime: '09:30',
    endTime: '12:30',
    status: 'Scheduled',
    hours: 3
  },
  {
    id: 'sch2',
    siteId: 's3',
    siteName: 'RV College of Engineering (RVCE)',
    batchName: 'Python Data Science Batch B',
    courseName: 'Deep Neural Networks & Computer Vision',
    trainerId: 't2',
    trainerName: 'Dr. Ananya Sharma',
    date: getFormattedDate(0), // Today
    startTime: '14:00',
    endTime: '17:00',
    status: 'Scheduled',
    hours: 3
  },
  {
    id: 'sch3',
    siteId: 's2',
    siteName: 'PES University (Main Campus)',
    batchName: 'Java Enterprise Batch C',
    courseName: 'Spring Cloud Architecture & Resilience',
    trainerId: 't3',
    trainerName: 'Rajesh Kumar',
    date: getFormattedDate(-1), // Yesterday
    startTime: '10:00',
    endTime: '13:00',
    status: 'Completed',
    hours: 3,
    report: {
      scheduleId: 'sch3',
      date: getFormattedDate(-1),
      topicCovered: 'Circuit breaker pattern, Eureka service registry, Gateway routing',
      deliveredHours: 3,
      studentCount: 58,
      issues: 'None. All students deployed local docker containers.',
      remarks: 'Excellent hands-on session.'
    }
  }
];

const DEFAULT_ATTENDANCE = (): AttendanceRecord[] => [
  {
    id: 'att1',
    trainerId: 't2',
    trainerName: 'Dr. Ananya Sharma',
    date: getFormattedDate(-1),
    checkInTime: '01:54 PM',
    serverTimestamp: new Date(getFormattedDate(-1) + 'T13:54:20Z').toISOString(),
    selfieUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=60',
    latitude: 12.92375,
    longitude: 77.49868,
    gpsAccuracy: 8,
    locationAddress: 'Mysore Road, RVCE Campus, Bangalore',
    siteId: 's3',
    siteName: 'RV College of Engineering (RVCE)',
    distanceFromSite: 18.5,
    verificationStatus: 'Verified'
  },
  {
    id: 'att2',
    trainerId: 't3',
    trainerName: 'Rajesh Kumar',
    date: getFormattedDate(-1),
    checkInTime: '09:51 AM',
    serverTimestamp: new Date(getFormattedDate(-1) + 'T09:51:10Z').toISOString(),
    selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60',
    latitude: 12.9348,
    longitude: 77.5349,
    gpsAccuracy: 12,
    locationAddress: '100 Feet Ring Road, PES Campus, Bangalore',
    siteId: 's2',
    siteName: 'PES University (Main Campus)',
    distanceFromSite: 45.0,
    verificationStatus: 'Verified'
  }
];

const DEFAULT_EXPENSES = (): ExpenseClaim[] => [
  {
    id: 'exp1',
    trainerId: 't1',
    trainerName: 'Mohammed Taha',
    date: getFormattedDate(-2),
    category: 'Travel',
    amount: 2500,
    approvedAmount: 2300,
    purpose: 'Cab fare to Bangalore Training Center for Full Stack Intensive seminar',
    siteId: 's1',
    siteName: 'Bangalore Training Center (Main Site)',
    status: 'Approved',
    paymentStatus: 'Paid',
    paidAmount: 2300,
    paymentDate: getFormattedDate(-1),
    paymentReference: 'PAY-2026-00041',
    paymentMethod: 'Bank Transfer',
    paidAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'exp2',
    trainerId: 't2',
    trainerName: 'Dr. Ananya Sharma',
    date: getFormattedDate(0),
    category: 'Food',
    amount: 450,
    purpose: 'Working lunch during batch capstone evaluation',
    siteId: 's3',
    siteName: 'RV College of Engineering (RVCE)',
    status: 'Pending',
    paymentStatus: 'Pending',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_PAYROLL = (): PayrollRun[] => [
  {
    id: 'pr_1',
    month: '2026-07',
    runDate: getFormattedDate(-15),
    totalAmount: 189000,
    status: 'Paid',
    payslipsCount: 3,
    approvedBy: 'finance@spark.com'
  }
];

const DEFAULT_PAYSLIPS = (): Payslip[] => [
  {
    id: 'ps_1',
    payrollRunId: 'pr_1',
    trainerId: 't1',
    trainerName: 'Mohammed Taha',
    month: '2026-07',
    hourlyHours: 45,
    hourlyRate: 1200,
    hourlyPay: 54000,
    fixedSalary: 0,
    incentives: 3000,
    deductions: 0,
    approvedExpenses: 2300,
    grossSalary: 59300,
    netSalary: 59300,
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
    siteId: 's3',
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
    customerAddress: 'Mysore Road, Bangalore, Karnataka - 560059',
    customerTaxId: '29AAACR1234F1Z1',
    siteId: 's3',
    siteName: 'RV College of Engineering (RVCE)',
    date: getFormattedDate(-8),
    dueDate: getFormattedDate(22),
    servicePeriod: 'August 2026',
    poNumber: 'PO/RVCE/2026/892',
    contractRef: 'MOU-DLT-RVCE-2024',
    lineItems: [
      { description: 'Python & AI Specialization Track (30 hours)', quantity: 30, unit: 'Hours', rate: 1500, discount: 0, taxCode: 'GST 18%', taxAmount: 8100, total: 53100 }
    ],
    subtotal: 45000,
    discount: 0,
    taxTotal: 8100,
    rounding: 0,
    totalAmount: 53100,
    amountPaid: 53100,
    outstandingBalance: 0,
    status: 'Paid',
    isLocked: true,
    issuedAt: getFormattedDate(-8),
    approvedBy: 'Venkat Ramakrishnan'
  },
  {
    id: 'inv_2',
    invoiceNumber: 'SPK-INV-2026-0002',
    customerName: 'PES University (Main Campus)',
    customerAddress: '100 Feet Ring Road, BSK III Stage, Bangalore - 560085',
    customerTaxId: '29AAACP5678K1Z5',
    siteId: 's2',
    siteName: 'PES University (Main Campus)',
    date: getFormattedDate(-1),
    dueDate: getFormattedDate(29),
    servicePeriod: 'August 2026',
    poNumber: 'PES/ENG/2026-09/441',
    contractRef: 'MOU-SPK-PES-2025',
    lineItems: [
      { description: 'Java Full Stack & Microservices Bootcamp (80 hours)', quantity: 80, unit: 'Hours', rate: 1500, discount: 0, taxCode: 'GST 18%', taxAmount: 21600, total: 141600 }
    ],
    subtotal: 120000,
    discount: 0,
    taxTotal: 21600,
    rounding: 0,
    totalAmount: 141600,
    amountPaid: 0,
    outstandingBalance: 141600,
    status: 'Issued',
    isLocked: true,
    issuedAt: getFormattedDate(-1),
    approvedBy: 'Venkat Ramakrishnan'
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

const DEFAULT_REQUESTS = (): ScheduleChangeRequest[] => [];

// 15 Minutes Inactivity Limit in milliseconds
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const WARNING_THRESHOLD_MS = 13.5 * 60 * 1000; // Warning shown with 1.5 min remaining

// Safe LocalStorage helpers with QuotaExceeded fallback
export function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`[Storage] Failed to read ${key}:`, err);
    return null;
  }
}

export function safeLocalStorageSet(key: string, value: any): void {
  try {
    let toSave = value;
    if (key === 'spk_attendance' && Array.isArray(value)) {
      toSave = value.map(rec => {
        // If selfie base64 is larger than 25KB, optimize it to prevent localStorage QuotaExceededError
        if (rec.selfieUrl && rec.selfieUrl.startsWith('data:image') && rec.selfieUrl.length > 25000) {
          return {
            ...rec,
            selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
          };
        }
        return rec;
      });
    }
    const serialized = typeof toSave === 'string' ? toSave : JSON.stringify(toSave);
    localStorage.setItem(key, serialized);
  } catch (err: any) {
    console.warn(`[Storage] Failed to save ${key}, attempting quota recovery:`, err);
    try {
      if (err?.name === 'QuotaExceededError' || err?.code === 22) {
        localStorage.removeItem('spk_audit');
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, serialized);
      }
    } catch (innerErr) {
      console.error(`[Storage] Quota exceeded and recovery failed for ${key}:`, innerErr);
    }
  }
}

const hydrateTrainers = (list: Trainer[]): Trainer[] => {
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_TRAINERS;
  return list.map(t => {
    const seed = DEFAULT_TRAINERS.find(d => d.id === t.id || d.email === t.email);
    if (!seed) return t;
    return {
      ...seed,
      ...t,
      individualId: t.individualId || seed.individualId || `TRN-${t.id}`,
      dateOfJoining: t.dateOfJoining || seed.dateOfJoining || '2024-06-15',
      resumeName: t.resumeName || seed.resumeName || 'Resume.pdf',
      resumeUrl: t.resumeUrl || seed.resumeUrl || '/resumes/resume.pdf',
      resumeUploadedAt: t.resumeUploadedAt || seed.resumeUploadedAt || '2026-08-01',
      resumeSize: t.resumeSize || seed.resumeSize || '1.2 MB',
      documents: Array.isArray(t.documents) && t.documents.length > 0 ? t.documents : seed.documents
    };
  });
};

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    const local = safeLocalStorageGet('spk_current_user');
    if (local) {
      try {
        const user = JSON.parse(local);
        if (user && user.id) return user;
      } catch {
        return DEFAULT_USERS[0];
      }
    }
    return DEFAULT_USERS[0];
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (safeLocalStorageGet('spk_theme') as 'dark' | 'light') || 'dark';
  });

  // Inactivity & Session state
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivitySecondsRemaining, setInactivitySecondsRemaining] = useState(90);
  const lastActiveRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<number | null>(null);
  const warningCountdownIntervalRef = useRef<number | null>(null);

  // Real-time Event state & broadcast channel
  const [realtimeEvents, setRealtimeEvents] = useState<RealTimeEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<RealTimeEvent | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Core collections initialized synchronously from localStorage
  const [users] = useState<User[]>(DEFAULT_USERS);

  const [trainers, setTrainers] = useState<Trainer[]>(() => {
    const local = safeLocalStorageGet('spk_trainers');
    if (local) {
      try {
        return hydrateTrainers(JSON.parse(local));
      } catch (e) {
        console.error('Failed to parse trainers:', e);
      }
    }
    safeLocalStorageSet('spk_trainers', DEFAULT_TRAINERS);
    return DEFAULT_TRAINERS;
  });

  const [sites, setSites] = useState<ClientSite[]>(() => {
    const local = safeLocalStorageGet('spk_sites');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse sites:', e);
      }
    }
    safeLocalStorageSet('spk_sites', DEFAULT_SITES);
    return DEFAULT_SITES;
  });

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const local = safeLocalStorageGet('spk_schedules');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse schedules:', e);
      }
    }
    const init = DEFAULT_S_CLASSES();
    safeLocalStorageSet('spk_schedules', init);
    return init;
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const local = safeLocalStorageGet('spk_attendance');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse attendance:', e);
      }
    }
    const init = DEFAULT_ATTENDANCE();
    safeLocalStorageSet('spk_attendance', init);
    return init;
  });

  const [changeRequests, setChangeRequests] = useState<ScheduleChangeRequest[]>(() => {
    const local = safeLocalStorageGet('spk_requests');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse requests:', e);
      }
    }
    return DEFAULT_REQUESTS();
  });

  const [expenses, setExpenses] = useState<ExpenseClaim[]>(() => {
    const local = safeLocalStorageGet('spk_expenses');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse expenses:', e);
      }
    }
    const init = DEFAULT_EXPENSES();
    safeLocalStorageSet('spk_expenses', init);
    return init;
  });

  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() => {
    const local = safeLocalStorageGet('spk_payroll');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse payroll:', e);
      }
    }
    const init = DEFAULT_PAYROLL();
    safeLocalStorageSet('spk_payroll', init);
    return init;
  });

  const [payslips, setPayslips] = useState<Payslip[]>(() => {
    const local = safeLocalStorageGet('spk_payslips');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse payslips:', e);
      }
    }
    const init = DEFAULT_PAYSLIPS();
    safeLocalStorageSet('spk_payslips', init);
    return init;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const local = safeLocalStorageGet('spk_quotations');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse quotations:', e);
      }
    }
    const init = DEFAULT_QUOTATIONS();
    safeLocalStorageSet('spk_quotations', init);
    return init;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const local = safeLocalStorageGet('spk_invoices');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse invoices:', e);
      }
    }
    const init = DEFAULT_INVOICES();
    safeLocalStorageSet('spk_invoices', init);
    return init;
  });

  const [payments, setPayments] = useState<PaymentAllocation[]>(() => {
    const local = safeLocalStorageGet('spk_payments');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse payments:', e);
      }
    }
    const init = DEFAULT_PAYMENTS();
    safeLocalStorageSet('spk_payments', init);
    return init;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const local = safeLocalStorageGet('spk_audit');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse audit logs:', e);
      }
    }
    return [];
  });

  const [lastLogins, setLastLogins] = useState<Record<string, string>>(() => {
    const local = safeLocalStorageGet('spk_last_logins');
    if (local) {
      try { return JSON.parse(local); } catch {}
    }
    return {};
  });

  const [loginHistoryList, setLoginHistoryList] = useState<LoginHistoryItem[]>(() => {
    const local = safeLocalStorageGet('spk_login_history');
    if (local) {
      try { return JSON.parse(local); } catch {}
    }
    return [];
  });

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    safeLocalStorageSet('spk_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Continuous Automatic LocalStorage Persistence for All Collections
  useEffect(() => {
    safeLocalStorageSet('spk_trainers', trainers);
  }, [trainers]);

  useEffect(() => {
    safeLocalStorageSet('spk_sites', sites);
  }, [sites]);

  useEffect(() => {
    safeLocalStorageSet('spk_schedules', schedules);
  }, [schedules]);

  useEffect(() => {
    safeLocalStorageSet('spk_attendance', attendanceRecords);
  }, [attendanceRecords]);

  useEffect(() => {
    safeLocalStorageSet('spk_requests', changeRequests);
  }, [changeRequests]);

  useEffect(() => {
    safeLocalStorageSet('spk_expenses', expenses);
  }, [expenses]);

  useEffect(() => {
    safeLocalStorageSet('spk_payroll', payrollRuns);
  }, [payrollRuns]);

  useEffect(() => {
    safeLocalStorageSet('spk_payslips', payslips);
  }, [payslips]);

  useEffect(() => {
    safeLocalStorageSet('spk_quotations', quotations);
  }, [quotations]);

  useEffect(() => {
    safeLocalStorageSet('spk_invoices', invoices);
  }, [invoices]);

  useEffect(() => {
    safeLocalStorageSet('spk_payments', payments);
  }, [payments]);

  useEffect(() => {
    if (currentUser) {
      safeLocalStorageSet('spk_current_user', currentUser);
    }
  }, [currentUser]);

  // Real-time broadcast channel initialization
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('spark_realtime_events');
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data && event.data.type) {
          const incomingEvent: RealTimeEvent = event.data;
          setRealtimeEvents(prev => [incomingEvent, ...prev.slice(0, 49)]);
          setLatestEvent(incomingEvent);
          
          // Re-sync local storage updates if emitted from another tab
          if (incomingEvent.type === 'ATTENDANCE_CHECKIN') {
            const raw = localStorage.getItem('spk_attendance');
            if (raw) setAttendanceRecords(JSON.parse(raw));
          } else if (incomingEvent.type === 'EXPENSE_SUBMIT' || incomingEvent.type === 'EXPENSE_PAID') {
            const raw = localStorage.getItem('spk_expenses');
            if (raw) setExpenses(JSON.parse(raw));
          } else if (incomingEvent.type === 'INVOICE_ISSUED') {
            const raw = localStorage.getItem('spk_invoices');
            if (raw) setInvoices(JSON.parse(raw));
          } else if (incomingEvent.type === 'SITE_ADDED') {
            const raw = localStorage.getItem('spk_sites');
            if (raw) setSites(JSON.parse(raw));
          }
        }
      };

      return () => {
        channel.close();
      };
    } catch {
      // Fallback if BroadcastChannel not supported
    }
  }, []);

  const broadcastRealTimeEvent = useCallback((type: RealTimeEventType, title: string, message: string, data?: any) => {
    const eventItem: RealTimeEvent = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type,
      title,
      message,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: true }),
      data
    };

    setRealtimeEvents(prev => [eventItem, ...prev.slice(0, 49)]);
    setLatestEvent(eventItem);

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage(eventItem);
      } catch { /* ignore */ }
    }
  }, []);

  // Helper to add audit logs
  const addAuditLog = useCallback((action: string, details: string) => {
    const now = new Date();
    const newLog: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: now.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      userEmail: currentUser?.email || 'system@spark.com',
      userName: currentUser?.name || 'System Auto-Agent',
      role: currentUser?.role || 'super_admin',
      action,
      details,
      ipAddress: '103.14.120.45',
      deviceInfo: navigator.userAgent.includes('Windows') ? 'Windows 11 / Chrome' : 'Enterprise Client'
    };

    setAuditLogs(prev => {
      const updated = [newLog, ...prev.slice(0, 99)];
      safeLocalStorageSet('spk_audit', JSON.stringify(updated));
      return updated;
    });
  }, [currentUser]);

  // Extend active session
  const extendSession = useCallback(() => {
    lastActiveRef.current = Date.now();
    setShowInactivityWarning(false);
    if (warningCountdownIntervalRef.current) {
      window.clearInterval(warningCountdownIntervalRef.current);
      warningCountdownIntervalRef.current = null;
    }
    if (currentUser) {
      const updatedUser = { ...currentUser, sessionExpiresAt: Date.now() + INACTIVITY_TIMEOUT_MS };
      setCurrentUserState(updatedUser);
      safeLocalStorageSet('spk_current_user', JSON.stringify(updatedUser));
    }
  }, [currentUser]);

  // Logout action with reason
  const logout = useCallback((reason?: string) => {
    if (inactivityTimerRef.current) window.clearTimeout(inactivityTimerRef.current);
    if (warningCountdownIntervalRef.current) window.clearInterval(warningCountdownIntervalRef.current);
    setShowInactivityWarning(false);
    
    if (currentUser) {
      addAuditLog('User Logout', `User ${currentUser.name} (${currentUser.email}) logged out. ${reason || 'Standard logout'}`);
    }

    setCurrentUserState(null);
    localStorage.removeItem('spk_current_user');

    if (reason) {
      setSessionExpiredMessage(reason);
    }
  }, [currentUser, addAuditLog]);

  // Inactivity tracking engine (15 minutes)
  useEffect(() => {
    if (!currentUser) return;

    lastActiveRef.current = Date.now();

    const handleUserActivity = () => {
      lastActiveRef.current = Date.now();
      if (showInactivityWarning) {
        extendSession();
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'keypress', 'touchstart', 'touchmove', 'scroll', 'wheel', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Periodic check interval (every 5 seconds)
    const checkInterval = window.setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActiveRef.current;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        // Expired!
        window.clearInterval(checkInterval);
        logout('Your session has expired due to inactivity. Please log in again.');
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        // Show warning countdown
        const remainingSeconds = Math.max(1, Math.round((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
        setInactivitySecondsRemaining(remainingSeconds);
        setShowInactivityWarning(true);
      } else {
        setShowInactivityWarning(false);
      }
    }, 3000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      window.clearInterval(checkInterval);
    };
  }, [currentUser, showInactivityWarning, extendSession, logout]);

  // Cross-tab broadcast & storage listener for real-time synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        if (e.key === 'spk_trainers') setTrainers(hydrateTrainers(JSON.parse(e.newValue)));
        else if (e.key === 'spk_sites') setSites(JSON.parse(e.newValue));
        else if (e.key === 'spk_schedules') setSchedules(JSON.parse(e.newValue));
        else if (e.key === 'spk_attendance') setAttendanceRecords(JSON.parse(e.newValue));
        else if (e.key === 'spk_requests') setChangeRequests(JSON.parse(e.newValue));
        else if (e.key === 'spk_expenses') setExpenses(JSON.parse(e.newValue));
        else if (e.key === 'spk_payroll') setPayrollRuns(JSON.parse(e.newValue));
        else if (e.key === 'spk_payslips') setPayslips(JSON.parse(e.newValue));
        else if (e.key === 'spk_quotations') setQuotations(JSON.parse(e.newValue));
        else if (e.key === 'spk_invoices') setInvoices(JSON.parse(e.newValue));
        else if (e.key === 'spk_payments') setPayments(JSON.parse(e.newValue));
      } catch (err) {
        console.warn('Storage sync error:', err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setCurrentUser = (user: User | null) => {
    if (user) {
      const withSession = { ...user, sessionExpiresAt: Date.now() + INACTIVITY_TIMEOUT_MS };
      setCurrentUserState(withSession);
      safeLocalStorageSet('spk_current_user', JSON.stringify(withSession));
    } else {
      setCurrentUserState(null);
      localStorage.removeItem('spk_current_user');
    }
  };

  const login = (email: string, role: UserRole): boolean => {
    const stamp = new Date().toISOString();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const user = DEFAULT_USERS.find(u => u.email === email && u.role === role);
    const loggedIn = user || {
      id: 'u_' + Date.now(),
      name: email.split('@')[0].toUpperCase(),
      email,
      role,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80'
    };

    const newLoginHistoryItem: LoginHistoryItem = {
      id: 'lh_' + Date.now(),
      date: formattedDate,
      time: formattedTime,
      device: navigator.userAgent.includes('Windows') ? 'Windows 11 / Chrome' : 'Browser Client',
      ipAddress: '103.14.120.45',
      status: 'Successful'
    };

    const withLogin: User = { 
      ...loggedIn, 
      lastLoginAt: stamp,
      sessionExpiresAt: Date.now() + INACTIVITY_TIMEOUT_MS,
      loginHistory: [newLoginHistoryItem, ...(loggedIn.loginHistory || [])]
    };

    setLastLogins(prev => {
      const updated = { ...prev, [email]: stamp };
      safeLocalStorageSet('spk_last_logins', JSON.stringify(updated));
      return updated;
    });

    setLoginHistoryList(prev => {
      const updated = [newLoginHistoryItem, ...prev.slice(0, 49)];
      safeLocalStorageSet('spk_login_history', JSON.stringify(updated));
      return updated;
    });

    // Also update trainer's lastLoginAt if trainer
    if (role === 'trainer') {
      setTrainers(prev => {
        const updated = prev.map(t => t.email === email ? {
          ...t,
          lastLoginAt: stamp,
          loginHistory: [newLoginHistoryItem, ...(t.loginHistory || [])]
        } : t);
        safeLocalStorageSet('spk_trainers', JSON.stringify(updated));
        return updated;
      });
    }

    setCurrentUser(withLogin);
    setSessionExpiredMessage(null);
    lastActiveRef.current = Date.now();
    addAuditLog('User Login', `Authenticated ${withLogin.name} (${withLogin.email}) under role ${withLogin.role.toUpperCase()}`);
    return true;
  };

  // Trainer Management Actions
  const addTrainer = (newTrainer: Omit<Trainer, 'id'>) => {
    const nextSeq = trainers.length + 1;
    const trainer: Trainer = {
      ...newTrainer,
      id: 't_' + Date.now(),
      individualId: newTrainer.individualId || `TRN-2026-${String(nextSeq).padStart(3, '0')}`,
      dateOfJoining: newTrainer.dateOfJoining || new Date().toISOString().split('T')[0]
    };
    setTrainers(prev => {
      const updated = [...prev, trainer];
      safeLocalStorageSet('spk_trainers', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Trainer Added', `HR onboarding initiated for trainer ${trainer.name} (${trainer.email})`);
    broadcastRealTimeEvent('TRAINER_STATUS', 'New Trainer Registered', `${trainer.name} has been added to the trainer roster.`, { trainerId: trainer.id });
  };

  const updateTrainer = (updatedTrainer: Trainer) => {
    setTrainers(prev => {
      const updated = prev.map(t => t.id === updatedTrainer.id ? updatedTrainer : t);
      safeLocalStorageSet('spk_trainers', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Trainer Updated', `Updated profile and compliance records for ${updatedTrainer.name}`);
    broadcastRealTimeEvent('TRAINER_STATUS', 'Trainer Profile Updated', `${updatedTrainer.name}'s profile and credentials have been updated.`, { trainerId: updatedTrainer.id, status: updatedTrainer.status });
  };

  const updateTrainerDateOfJoining = (trainerId: string, date: string) => {
    setTrainers(prev => {
      const updated = prev.map(t => t.id === trainerId ? { ...t, dateOfJoining: date } : t);
      safeLocalStorageSet('spk_trainers', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Date of Joining Updated', `Updated Date of Joining to ${date} for trainer ID ${trainerId}`);
  };

  const uploadTrainerResume = (trainerId: string, resumeFile: { name: string; url: string; size: string }) => {
    const today = new Date().toISOString().split('T')[0];
    setTrainers(prev => {
      const updated = prev.map(t => t.id === trainerId ? {
        ...t,
        resumeName: resumeFile.name,
        resumeUrl: resumeFile.url,
        resumeSize: resumeFile.size,
        resumeUploadedAt: today
      } : t);
      safeLocalStorageSet('spk_trainers', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Resume Uploaded', `Uploaded resume "${resumeFile.name}" for trainer ID ${trainerId}`);
  };

  const deleteTrainerResume = (trainerId: string) => {
    setTrainers(prev => {
      const updated = prev.map(t => t.id === trainerId ? {
        ...t,
        resumeName: undefined,
        resumeUrl: undefined,
        resumeSize: undefined,
        resumeUploadedAt: undefined
      } : t);
      safeLocalStorageSet('spk_trainers', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Resume Removed', `Removed resume for trainer ID ${trainerId}`);
  };

  // Site Management Actions
  const addSite = (newSite: Omit<ClientSite, 'id'>) => {
    const site: ClientSite = {
      ...newSite,
      id: 's_' + Date.now(),
      status: newSite.status || 'Active'
    };
    setSites(prev => {
      const updated = [...prev, site];
      safeLocalStorageSet('spk_sites', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Training Site Created', `Registered site "${site.name}" with geofence radius ${site.geofenceRadius}m`);
    broadcastRealTimeEvent('SITE_ADDED', 'New Training Site Added', `${site.name} added with ${site.geofenceRadius}m geofence radius.`, { siteId: site.id });
  };

  const updateSite = (updatedSite: ClientSite) => {
    setSites(prev => {
      const updated = prev.map(s => s.id === updatedSite.id ? updatedSite : s);
      safeLocalStorageSet('spk_sites', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Site Updated', `Updated site "${updatedSite.name}" coordinates and configuration`);
  };

  const deleteSite = (siteId: string) => {
    setSites(prev => {
      const updated = prev.filter(s => s.id !== siteId);
      safeLocalStorageSet('spk_sites', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Site Deleted', `Deleted site ID ${siteId}`);
  };

  // Schedule Management Actions
  const addSchedule = (newSchedule: Omit<Schedule, 'id'>) => {
    const schedule: Schedule = {
      ...newSchedule,
      id: 'sch_' + Date.now()
    };
    setSchedules(prev => {
      const updated = [...prev, schedule];
      safeLocalStorageSet('spk_schedules', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Schedule Class Created', `Scheduled class "${schedule.courseName}" for trainer ${schedule.trainerName} on ${schedule.date}`);
    broadcastRealTimeEvent('SCHEDULE_CHANGE', 'New Session Scheduled', `${schedule.courseName} assigned to ${schedule.trainerName} for ${schedule.date}.`);
  };

  const updateSchedule = (updatedSchedule: Schedule) => {
    setSchedules(prev => {
      const updated = prev.map(s => s.id === updatedSchedule.id ? updatedSchedule : s);
      safeLocalStorageSet('spk_schedules', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Schedule Updated', `Modified schedule for ${updatedSchedule.courseName} (${updatedSchedule.date})`);
  };

  const requestScheduleChange = (req: Omit<ScheduleChangeRequest, 'id' | 'trainerId' | 'trainerName' | 'createdAt' | 'status'>) => {
    const schedule = schedules.find(s => s.id === req.scheduleId);
    if (!schedule) throw new Error('Schedule not found');

    const newReq: ScheduleChangeRequest = {
      ...req,
      id: 'req_' + Date.now(),
      trainerId: schedule.trainerId,
      trainerName: schedule.trainerName,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    setChangeRequests(prev => {
      const updated = [newReq, ...prev];
      safeLocalStorageSet('spk_requests', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Reschedule Requested', `Trainer ${schedule.trainerName} requested change on ${schedule.courseName} from ${req.originalDate} to ${req.requestedDate}`);
  };

  const reviewScheduleChange = (requestId: string, status: 'Approved' | 'Rejected', remarks: string) => {
    let targetTrainer = '';
    let targetCourse = '';
    let updatedSchedules = schedules;

    setChangeRequests(prev => {
      const updated = prev.map(r => {
        if (r.id === requestId) {
          targetTrainer = r.trainerName;
          targetCourse = r.courseName;

          if (status === 'Approved') {
            updatedSchedules = schedules.map(s => {
              if (s.id === r.scheduleId) {
                return {
                  ...s,
                  date: r.requestedDate,
                  startTime: r.requestedStartTime,
                  endTime: r.requestedEndTime,
                  status: 'Rescheduled'
                };
              }
              return s;
            });
          }

          return {
            ...r,
            status,
            reviewedBy: currentUser?.email || 'admin@spark.com',
            reviewedAt: new Date().toISOString(),
            reviewRemarks: remarks
          };
        }
        return r;
      });

      safeLocalStorageSet('spk_requests', JSON.stringify(updated));
      return updated;
    });

    if (status === 'Approved') {
      setSchedules(updatedSchedules);
      safeLocalStorageSet('spk_schedules', JSON.stringify(updatedSchedules));
    }

    addAuditLog('Schedule Change Review', `${status} schedule change request for trainer ${targetTrainer} on class ${targetCourse}`);
  };

  // Attendance Check-In Action
  const checkInTrainer = (
    scheduleId: string, 
    latitude: number, 
    longitude: number, 
    accuracy: number, 
    selfieUrl: string, 
    locationAddress?: string
  ): { success: boolean; record: AttendanceRecord } => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) throw new Error('Schedule class not found');
    const site = sites.find(s => s.id === schedule.siteId);
    if (!site) throw new Error('Client site not found');

    const distance = calculateDistance(latitude, longitude, site.latitude, site.longitude);
    const isWithinGeofence = distance <= site.geofenceRadius;
    const verificationStatus: AttendanceRecord['verificationStatus'] = isWithinGeofence ? 'Verified' : 'Review';
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newRecord: AttendanceRecord = {
      id: 'att_' + Date.now(),
      trainerId: schedule.trainerId,
      trainerName: schedule.trainerName,
      date: localDate,
      checkInTime: formattedTime,
      serverTimestamp: now.toISOString(),
      selfieUrl,
      latitude,
      longitude,
      gpsAccuracy: accuracy,
      locationAddress: locationAddress || `${site.name} Area, GPS ±${accuracy}m`,
      siteId: site.id,
      siteName: site.name,
      distanceFromSite: parseFloat(distance.toFixed(1)),
      verificationStatus
    };

    setAttendanceRecords(prev => {
      const updated = [newRecord, ...prev];
      safeLocalStorageSet('spk_attendance', JSON.stringify(updated));
      return updated;
    });

    addAuditLog(
      'Trainer Check-In',
      `${schedule.trainerName} checked in for site ${site.name}. Verification: ${verificationStatus} (${distance.toFixed(1)}m from site).`
    );

    // Broadcast real-time checkin event to all connected portals
    broadcastRealTimeEvent(
      'ATTENDANCE_CHECKIN',
      'Trainer Checked In',
      `${schedule.trainerName} checked in at ${formattedTime} for ${site.name} (${verificationStatus}).`,
      { record: newRecord }
    );

    return { success: true, record: newRecord };
  };

  const reviewAttendance = (recordId: string, status: 'Verified' | 'Rejected' | 'Corrected', remarks: string) => {
    setAttendanceRecords(prev => {
      const updated = prev.map(r => {
        if (r.id === recordId) {
          return {
            ...r,
            verificationStatus: status,
            adminRemarks: remarks,
            reviewedBy: currentUser?.email || 'hr@spark.com',
            reviewedAt: new Date().toISOString()
          };
        }
        return r;
      });
      safeLocalStorageSet('spk_attendance', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Attendance Review', `Reviewed check-in record ${recordId} as ${status}. Remarks: ${remarks}`);
    broadcastRealTimeEvent('ATTENDANCE_REVIEW', 'Attendance Review Updated', `Check-in record has been marked as ${status}.`);
  };

  // Reports & Expenses
  const submitClassReport = (scheduleId: string, report: ClassReport) => {
    setSchedules(prev => {
      const updated = prev.map(s => {
        if (s.id === scheduleId) {
          return {
            ...s,
            status: 'Completed' as const,
            report
          };
        }
        return s;
      });
      safeLocalStorageSet('spk_schedules', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Class Report Filed', `Submitted lecture log for class ${scheduleId} (${report.deliveredHours} hours delivered)`);
  };

  const submitExpenseClaim = (claim: Omit<ExpenseClaim, 'id' | 'trainerId' | 'trainerName' | 'status' | 'paymentStatus' | 'createdAt'>) => {
    const trainer = trainers.find(t => t.email === currentUser?.email) || trainers[0];
    const newClaim: ExpenseClaim = {
      ...claim,
      id: 'exp_' + Date.now(),
      trainerId: trainer.id,
      trainerName: trainer.name,
      status: 'Pending',
      paymentStatus: 'Pending',
      createdAt: new Date().toISOString()
    };

    setExpenses(prev => {
      const updated = [newClaim, ...prev];
      safeLocalStorageSet('spk_expenses', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Expense Claim Filed', `Claim of ₹${claim.amount} for ${claim.category} submitted by ${trainer.name}`);
    broadcastRealTimeEvent('EXPENSE_SUBMIT', 'Expense Claim Submitted', `${trainer.name} submitted a ₹${claim.amount.toLocaleString()} ${claim.category} claim.`);
  };

  const reviewExpenseClaim = (claimId: string, status: 'Approved' | 'Rejected') => {
    setExpenses(prev => {
      const updated = prev.map(e => {
        if (e.id === claimId) {
          return {
            ...e,
            status,
            approvedAmount: status === 'Approved' ? (e.approvedAmount || e.amount) : 0,
            paymentStatus: (status === 'Approved' ? 'Approved' : 'Rejected') as ReimbursementPaymentStatus,
            reviewedBy: currentUser?.email || 'admin@spark.com',
            reviewedAt: new Date().toISOString()
          };
        }
        return e;
      });
      safeLocalStorageSet('spk_expenses', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Expense Claim Review', `${status} expense claim ID ${claimId}`);
    broadcastRealTimeEvent('EXPENSE_REVIEW', 'Expense Claim Reviewed', `Expense claim ${claimId} marked as ${status}.`);
  };

  const markExpensePaid = (
    claimId: string, 
    paymentDetails: { paidAmount: number; paymentDate: string; paymentReference: string; paymentMethod: string }
  ) => {
    setExpenses(prev => {
      const updated = prev.map(e => {
        if (e.id === claimId) {
          return {
            ...e,
            paymentStatus: 'Paid' as const,
            paidAmount: paymentDetails.paidAmount,
            paymentDate: paymentDetails.paymentDate,
            paymentReference: paymentDetails.paymentReference,
            paymentMethod: paymentDetails.paymentMethod,
            paidAt: new Date().toISOString()
          };
        }
        return e;
      });
      safeLocalStorageSet('spk_expenses', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Reimbursement Paid', `Recorded payment of ₹${paymentDetails.paidAmount} for claim ${claimId}. Ref: ${paymentDetails.paymentReference}`);
    broadcastRealTimeEvent('EXPENSE_PAID', 'Reimbursement Paid', `Reimbursement ${claimId} of ₹${paymentDetails.paidAmount.toLocaleString()} marked as PAID ✓.`, paymentDetails);
  };

  // Payroll Management
  const createPayrollRun = (month: string): PayrollRun | null => {
    const existing = payrollRuns.find(p => p.month === month);
    if (existing) return existing;

    const newPayslips: Payslip[] = trainers.filter(t => t.status === 'Active').map(t => {
      const trainerCompletedClasses = schedules.filter(
        s => s.trainerId === t.id && s.status === 'Completed' && s.date.startsWith(month)
      );
      const deliveredHours = trainerCompletedClasses.reduce((sum, s) => sum + s.hours, 0);
      const hourlyPay = t.rate * deliveredHours;
      const fixedSalary = t.fixedSalary;
      const approvedExpenseList = expenses.filter(
        e => e.trainerId === t.id && e.status === 'Approved' && e.paymentStatus !== 'Paid' && e.date.startsWith(month)
      );
      const expenseAmount = approvedExpenseList.reduce((sum, e) => sum + e.amount, 0);
      const gross = hourlyPay + fixedSalary + expenseAmount;

      return {
        id: 'ps_' + Date.now() + '_' + t.id,
        payrollRunId: 'pr_' + Date.now(),
        trainerId: t.id,
        trainerName: t.name,
        month,
        hourlyHours: deliveredHours,
        hourlyRate: t.rate,
        hourlyPay,
        fixedSalary,
        incentives: 0,
        deductions: 0,
        approvedExpenses: expenseAmount,
        grossSalary: gross,
        netSalary: gross,
        status: 'Draft'
      };
    });

    const totalAmt = newPayslips.reduce((sum, p) => sum + p.netSalary, 0);
    const newRun: PayrollRun = {
      id: 'pr_' + Date.now(),
      month,
      runDate: new Date().toISOString().split('T')[0],
      totalAmount: totalAmt,
      status: 'Draft',
      payslipsCount: newPayslips.length
    };

    setPayrollRuns(prev => {
      const updated = [newRun, ...prev];
      safeLocalStorageSet('spk_payroll', JSON.stringify(updated));
      return updated;
    });

    setPayslips(prev => {
      const updated = [...newPayslips, ...prev];
      safeLocalStorageSet('spk_payslips', JSON.stringify(updated));
      return updated;
    });

    addAuditLog('Payroll Run Generated', `Compiled draft payroll run for ${month} totaling ₹${totalAmt.toLocaleString()}`);
    return newRun;
  };

  const approvePayrollRun = (runId: string) => {
    setPayrollRuns(prev => {
      const updated = prev.map(p => p.id === runId ? { ...p, status: 'Approved' as const, approvedBy: currentUser?.email } : p);
      safeLocalStorageSet('spk_payroll', JSON.stringify(updated));
      return updated;
    });
    setPayslips(prev => {
      const updated = prev.map(p => p.payrollRunId === runId ? { ...p, status: 'Approved' as const } : p);
      safeLocalStorageSet('spk_payslips', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Payroll Approved', `Approved payroll run ID ${runId}`);
    broadcastRealTimeEvent('PAYROLL_STATUS', 'Payroll Approved', `Payroll run ${runId} has been approved.`);
  };

  const payPayrollRun = (runId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setPayrollRuns(prev => {
      const updated = prev.map(p => p.id === runId ? { ...p, status: 'Paid' as const } : p);
      safeLocalStorageSet('spk_payroll', JSON.stringify(updated));
      return updated;
    });
    setPayslips(prev => {
      const updated = prev.map(p => p.payrollRunId === runId ? { ...p, status: 'Paid' as const, paymentDate: today } : p);
      safeLocalStorageSet('spk_payslips', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Payroll Disbursed', `Processed salary payout for payroll run ${runId}`);
    broadcastRealTimeEvent('PAYROLL_STATUS', 'Payroll Disbursed', `Salary payments for run ${runId} have been disbursed.`);
  };

  // Invoicing & Finance Actions
  const createQuotation = (quotation: Omit<Quotation, 'id' | 'quotationNumber' | 'status' | 'subtotal' | 'taxTotal' | 'totalAmount'>) => {
    const subtotal = quotation.lineItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const taxTotal = quotation.lineItems.reduce((acc, item) => acc + item.taxAmount, 0);
    const totalAmount = subtotal - (quotation.discount || 0) + taxTotal;
    const quotNum = `SPK-QT-2026-${String(quotations.length + 1).padStart(4, '0')}`;

    const newQuot: Quotation = {
      ...quotation,
      id: 'q_' + Date.now(),
      quotationNumber: quotNum,
      subtotal,
      taxTotal,
      totalAmount,
      status: 'Draft'
    };

    setQuotations(prev => {
      const updated = [newQuot, ...prev];
      safeLocalStorageSet('spk_quotations', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Quotation Created', `Created quotation ${quotNum} for customer ${quotation.customerName}`);
  };

  const updateQuotationStatus = (quotId: string, status: Quotation['status']) => {
    setQuotations(prev => {
      const updated = prev.map(q => q.id === quotId ? { ...q, status } : q);
      safeLocalStorageSet('spk_quotations', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Quotation Status Updated', `Updated quotation ${quotId} status to ${status}`);
  };

  const convertQuotationToInvoice = (quotId: string) => {
    const quot = quotations.find(q => q.id === quotId);
    if (!quot) return;

    const today = new Date();
    const due = new Date();
    due.setDate(due.getDate() + 30);
    const invNum = `SPK-INV-2026-${String(invoices.length + 1).padStart(4, '0')}`;

    const newInvoice: Invoice = {
      id: 'inv_' + Date.now(),
      invoiceNumber: invNum,
      quotationId: quot.id,
      customerName: quot.customerName,
      siteId: quot.siteId,
      siteName: quot.siteName,
      date: today.toISOString().split('T')[0],
      dueDate: due.toISOString().split('T')[0],
      servicePeriod: quot.servicePeriod,
      lineItems: quot.lineItems,
      subtotal: quot.subtotal,
      discount: quot.discount,
      taxTotal: quot.taxTotal,
      totalAmount: quot.totalAmount,
      amountPaid: 0,
      outstandingBalance: quot.totalAmount,
      status: 'Draft',
      isLocked: false
    };

    setInvoices(prev => {
      const updated = [newInvoice, ...prev];
      safeLocalStorageSet('spk_invoices', JSON.stringify(updated));
      return updated;
    });

    setQuotations(prev => {
      const updated = prev.map(q => q.id === quotId ? { ...q, status: 'Converted' as const, convertedInvoiceId: newInvoice.id } : q);
      safeLocalStorageSet('spk_quotations', JSON.stringify(updated));
      return updated;
    });

    addAuditLog('Quotation Converted', `Converted quotation ${quot.quotationNumber} into tax invoice ${invNum}`);
  };

  const createInvoice = (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'status' | 'subtotal' | 'taxTotal' | 'totalAmount' | 'amountPaid' | 'outstandingBalance'>) => {
    const subtotal = invoice.lineItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const taxTotal = invoice.lineItems.reduce((acc, item) => acc + item.taxAmount, 0);
    const totalAmount = subtotal - (invoice.discount || 0) + taxTotal;
    const invNum = `SPK-INV-2026-${String(invoices.length + 1).padStart(4, '0')}`;

    const newInvoice: Invoice = {
      ...invoice,
      id: 'inv_' + Date.now(),
      invoiceNumber: invNum,
      subtotal,
      taxTotal,
      totalAmount,
      amountPaid: 0,
      outstandingBalance: totalAmount,
      status: 'Draft',
      isLocked: false
    };

    setInvoices(prev => {
      const updated = [newInvoice, ...prev];
      safeLocalStorageSet('spk_invoices', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Invoice Drafted', `Created invoice draft ${invNum} for ${invoice.customerName} (₹${totalAmount.toLocaleString()})`);
  };

  const approveInvoice = (invoiceId: string) => {
    setInvoices(prev => {
      const updated = prev.map(i => i.id === invoiceId ? {
        ...i,
        status: 'Approved' as const,
        approvedBy: currentUser?.name || 'Venkat Ramakrishnan'
      } : i);
      safeLocalStorageSet('spk_invoices', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Invoice Approved', `Approved invoice ${invoiceId}`);
    broadcastRealTimeEvent('INVOICE_APPROVED', 'Invoice Approved', `Tax Invoice ${invoiceId} has been approved.`);
  };

  const issueInvoice = (invoiceId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setInvoices(prev => {
      const updated = prev.map(i => i.id === invoiceId ? {
        ...i,
        status: 'Issued' as const,
        isLocked: true,
        issuedAt: today
      } : i);
      safeLocalStorageSet('spk_invoices', JSON.stringify(updated));
      return updated;
    });
    addAuditLog('Invoice Issued & Locked', `Issued and locked tax invoice ${invoiceId}. Modifications are now restricted.`);
    broadcastRealTimeEvent('INVOICE_ISSUED', 'Tax Invoice Issued', `Tax Invoice ${invoiceId} issued to customer and locked.`);
  };

  const recordPayment = (payment: Omit<PaymentAllocation, 'id' | 'paymentNumber'>) => {
    const payNum = `SPK-REC-2026-${String(payments.length + 1).padStart(3, '0')}`;
    const newPayment: PaymentAllocation = {
      ...payment,
      id: 'pay_' + Date.now(),
      paymentNumber: payNum
    };

    setPayments(prev => {
      const updated = [newPayment, ...prev];
      safeLocalStorageSet('spk_payments', JSON.stringify(updated));
      return updated;
    });

    setInvoices(prev => {
      const updated = prev.map(inv => {
        if (inv.id === payment.invoiceId) {
          const newPaid = inv.amountPaid + payment.amount;
          const newOutstanding = Math.max(0, inv.totalAmount - newPaid);
          const newStatus = newOutstanding === 0 ? 'Paid' as const : 'Part Paid' as const;

          return {
            ...inv,
            amountPaid: newPaid,
            outstandingBalance: newOutstanding,
            status: newStatus
          };
        }
        return inv;
      });
      safeLocalStorageSet('spk_invoices', JSON.stringify(updated));
      return updated;
    });

    addAuditLog('Payment Allocated', `Recorded payment receipt ${payNum} of ₹${payment.amount.toLocaleString()} against invoice ${payment.invoiceNumber}`);
    broadcastRealTimeEvent('PAYMENT_RECEIVED', 'Payment Receipt Logged', `Received ₹${payment.amount.toLocaleString()} for invoice ${payment.invoiceNumber}.`);
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
    localStorage.removeItem('spk_last_logins');
    localStorage.removeItem('spk_login_history');
    localStorage.removeItem('spk_org_settings');
    localStorage.removeItem('spk_active_tab');

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
    setLastLogins({});
    setLoginHistoryList([]);

    addAuditLog('Demo Database Reset', 'Re-seeded Spark environment to default baseline enterprise records.');
  };

  return (
    <DatabaseContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
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
        lastLogins,
        loginHistoryList,
        realtimeEvents,
        latestEvent,
        
        sessionExpiredMessage,
        setSessionExpiredMessage,
        showInactivityWarning,
        inactivitySecondsRemaining,
        extendSession,
        
        login,
        logout,
        addTrainer,
        updateTrainer,
        updateTrainerDateOfJoining,
        updateTrainerDOJ: updateTrainerDateOfJoining,
        uploadTrainerResume,
        deleteTrainerResume,
        addSite,
        updateSite,
        deleteSite,
        addSchedule,
        updateSchedule,
        requestScheduleChange,
        reviewScheduleChange,
        checkInTrainer,
        reviewAttendance,
        submitClassReport,
        submitExpenseClaim,
        reviewExpenseClaim,
        markExpensePaid,
        createPayrollRun,
        approvePayrollRun,
        payPayrollRun,
        createQuotation,
        updateQuotationStatus,
        convertQuotationToInvoice,
        createInvoice,
        approveInvoice,
        issueInvoice,
        recordPayment,
        broadcastRealTimeEvent,
        addAuditLog,
        resetDatabase,
        theme,
        toggleTheme
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
