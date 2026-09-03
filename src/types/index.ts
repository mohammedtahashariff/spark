export type UserRole = 'super_admin' | 'md' | 'coordinator' | 'hr' | 'finance' | 'operations' | 'trainer' | 'management';

export interface LoginHistoryItem {
  id: string;
  date: string;
  time: string;
  device: string;
  ipAddress: string;
  status: 'Successful' | 'Failed';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastLoginAt?: string;
  sessionExpiresAt?: number;
  loginHistory?: LoginHistoryItem[];
}

export interface TrainerDocument {
  category: string;
  name: string;
  status: 'Draft' | 'Review' | 'Approved' | 'Issued' | 'Archived';
  documentNumber: string;
  uploadedAt: string;
  expiryDate?: string;
  rejectionRemarks?: string;
}

export interface Trainer {
  id: string;
  individualId: string; // e.g. "TRN-2026-001"
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Onboarding' | 'Suspended';
  rate: number;
  fixedSalary: number;
  skills: string[];
  dateOfJoining: string; // YYYY-MM-DD or Formatted string
  resumeUrl?: string;
  resumeName?: string;
  resumeUploadedAt?: string;
  resumeSize?: string;
  lastLoginAt?: string;
  loginHistory?: LoginHistoryItem[];
  documents: TrainerDocument[];
}

export interface ClientSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number; // in meters
  address: string;
  contactPerson?: string;
  contactNumber?: string;
  status?: 'Active' | 'Inactive';
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
  locationAddress?: string;
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

export type ReimbursementPaymentStatus = 'Pending' | 'Approved' | 'Processing' | 'Paid' | 'Failed' | 'Rejected' | 'Unpaid';

export interface ExpenseClaim {
  id: string;
  trainerId: string;
  trainerName: string;
  date: string;
  category: 'Travel' | 'Food' | 'Accommodation' | 'Local Transport' | 'Other';
  amount: number;
  approvedAmount?: number;
  purpose: string;
  siteId: string;
  siteName: string;
  receiptUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  paymentStatus: ReimbursementPaymentStatus;
  paidAmount?: number;
  paymentDate?: string;
  paymentReference?: string;
  paymentMethod?: 'Bank Transfer' | 'UPI' | 'Card' | 'Cheque' | string;
  paidAt?: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionRemarks?: string;
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
  unit?: string;
  rate: number;
  discount?: number;
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
  customerAddress?: string;
  customerTaxId?: string;
  siteId: string;
  siteName: string;
  date: string;
  dueDate: string;
  servicePeriod: string;
  poNumber?: string;
  contractRef?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount: number;
  taxTotal: number;
  rounding?: number;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  status: 'Draft' | 'Approved' | 'Issued' | 'Part Paid' | 'Paid' | 'Overdue';
  isLocked?: boolean;
  issuedAt?: string;
  approvedBy?: string;
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

export type RealTimeEventType = 
  | 'ATTENDANCE_CHECKIN'
  | 'ATTENDANCE_REVIEW'
  | 'EXPENSE_SUBMIT'
  | 'EXPENSE_REVIEW'
  | 'EXPENSE_PAID'
  | 'PAYROLL_STATUS'
  | 'INVOICE_ISSUED'
  | 'INVOICE_APPROVED'
  | 'PAYMENT_RECEIVED'
  | 'TRAINER_STATUS'
  | 'SITE_ADDED'
  | 'SCHEDULE_CHANGE';

export interface RealTimeEvent {
  id: string;
  type: RealTimeEventType;
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}
