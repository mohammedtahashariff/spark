export type UserRole = 'super_admin' | 'management' | 'hr' | 'finance' | 'operations' | 'trainer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Onboarding' | 'Suspended';
  rate: number;
  fixedSalary: number;
  skills: string[];
  documents: {
    category: string;
    name: string;
    status: 'Draft' | 'Review' | 'Approved' | 'Issued' | 'Archived';
    documentNumber: string;
    uploadedAt: string;
  }[];
}

export interface ClientSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number; // in meters
  address: string;
}

export interface ClassReport {
  scheduleId: string;
  date: string;
  topicCovered: string;
  deliveredHours: number;
  studentCount: number;
  issues: string;
  remarks: string;
  evidenceUrl?: string;
}

export interface Schedule {
  id: string;
  siteId: string;
  siteName: string;
  batchName: string;
  courseName: string;
  trainerId: string;
  trainerName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  hours: number;
  report?: ClassReport; // Bound training report
}

export interface AttendanceRecord {
  id: string;
  trainerId: string;
  trainerName: string;
  date: string;
  checkInTime: string;
  serverTimestamp: string;
  selfieUrl: string;
  latitude: number;
  longitude: number;
  gpsAccuracy: number;
  siteId: string;
  siteName: string;
  distanceFromSite: number;
  verificationStatus: 'Verified' | 'Review' | 'Rejected' | 'Corrected';
  adminRemarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ScheduleChangeRequest {
  id: string;
  scheduleId: string;
  trainerId: string;
  trainerName: string;
  batchName: string;
  courseName: string;
  originalDate: string;
  originalStartTime: string;
  originalEndTime: string;
  requestedDate: string;
  requestedStartTime: string;
  requestedEndTime: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
}

export interface ExpenseClaim {
  id: string;
  trainerId: string;
  trainerName: string;
  date: string;
  category: 'Travel' | 'Food' | 'Accommodation' | 'Local Transport' | 'Other';
  amount: number;
  purpose: string;
  siteId: string;
  siteName: string;
  receiptUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface Payslip {
  id: string;
  payrollRunId: string;
  trainerId: string;
  trainerName: string;
  month: string; // YYYY-MM
  hourlyHours: number;
  hourlyRate: number;
  hourlyPay: number;
  fixedSalary: number;
  incentives: number;
  deductions: number;
  approvedExpenses: number;
  grossSalary: number;
  netSalary: number;
  status: 'Draft' | 'Approved' | 'Processing' | 'Paid' | 'Failed';
  paymentDate?: string;
}

export interface PayrollRun {
  id: string;
  month: string; // YYYY-MM
  runDate: string;
  totalAmount: number;
  status: 'Draft' | 'Approved' | 'Processing' | 'Paid';
  payslipsCount: number;
  approvedBy?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  taxCode: string; // e.g. "GST 18%"
  taxAmount: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerName: string;
  siteId: string;
  siteName: string;
  date: string;
  servicePeriod: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  taxTotal: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Converted';
  convertedInvoiceId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationId?: string;
  customerName: string;
  siteId: string;
  siteName: string;
  date: string;
  dueDate: string;
  servicePeriod: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  taxTotal: number;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  status: 'Draft' | 'Approved' | 'Issued' | 'Part Paid' | 'Paid' | 'Overdue';
}

export interface PaymentAllocation {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  paymentMode: 'Bank Transfer' | 'UPI' | 'Card' | 'Cheque';
  referenceNumber: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
  ipAddress: string;
  deviceInfo: string;
}
