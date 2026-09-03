import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { 
  Lock, CheckCircle, Printer, Download, Send, 
  ArrowLeft, Plus, Trash2, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import BrandLogo from '../BrandLogo';
import type { Invoice, InvoiceLineItem } from '../../types';

// Helper: Convert number to Words (INR)
function numberToWords(num: number): string {
  const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero Rupees Only';
  
  const parse = (n: number): string => {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : '');
  };

  let words = '';
  if (num >= 100000) {
    words += parse(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    words += parse(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  if (num >= 100) {
    words += parse(Math.floor(num / 100)) + ' Hundred ';
    num %= 100;
  }
  if (num > 0) {
    if (words !== '') words += 'and ';
    words += parse(num);
  }
  
  return words.trim() + ' Rupees Only';
}

interface TaxInvoiceFullPageProps {
  invoiceId?: string;
  onBack: () => void;
}

const TaxInvoiceFullPage: React.FC<TaxInvoiceFullPageProps> = ({ invoiceId, onBack }) => {
  const { 
    currentUser, invoices, sites, createInvoice, 
    approveInvoice, issueInvoice 
  } = useDatabase();

  const existingInvoice = invoices.find(i => i.id === invoiceId);
  const isEditing = !!existingInvoice;
  const isLocked = existingInvoice ? (existingInvoice.isLocked || existingInvoice.status === 'Issued' || existingInvoice.status === 'Paid' || existingInvoice.status === 'Part Paid') : false;

  // Masked GST toggle state
  const [revealGstin, setRevealGstin] = useState(false);

  // Invoice Form State
  const [customerName, setCustomerName] = useState(existingInvoice?.customerName || '');
  const [customerAddress, setCustomerAddress] = useState(existingInvoice?.customerAddress || 'Mysore Road, Bangalore, Karnataka - 560059');
  const [customerTaxId, setCustomerTaxId] = useState(existingInvoice?.customerTaxId || '29AAACR1234F1Z1');
  const [siteId, setSiteId] = useState(existingInvoice?.siteId || (sites[0]?.id || ''));
  const [invoiceDate, setInvoiceDate] = useState(existingInvoice?.date || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(existingInvoice?.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [servicePeriod, setServicePeriod] = useState(existingInvoice?.servicePeriod || 'August 2026');
  const [poNumber, setPoNumber] = useState(existingInvoice?.poNumber || 'PO/2026/8942');
  const [contractRef, setContractRef] = useState(existingInvoice?.contractRef || 'MOU-DLT-2026-ENG');
  const [discount, setDiscount] = useState<number>(existingInvoice?.discount || 0);

  // Line items state
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    existingInvoice?.lineItems || [
      { description: 'Advanced Python & AI Training Bootcamp (40 hours)', quantity: 40, unit: 'Hours', rate: 1500, taxCode: 'GST 18%', taxAmount: 10800, total: 70800 }
    ]
  );

  // New item temp inputs
  const [newDesc, setNewDesc] = useState('');
  const [newQty, setNewQty] = useState(10);
  const [newUnit, setNewUnit] = useState('Hours');
  const [newRate, setNewRate] = useState(1200);

  // Totals calculation
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const totalTax = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalAfterDiscount = Math.max(0, subtotal - discount);
  const totalAmount = Math.round(totalAfterDiscount + totalTax);
  const amountInWords = numberToWords(totalAmount);

  // RBAC permissions
  const canSeeTaxReg = currentUser?.role === 'super_admin' || currentUser?.role === 'finance';
  const canApprove = currentUser?.role === 'super_admin' || currentUser?.role === 'finance' || currentUser?.role === 'management';

  const handleAddLineItem = () => {
    if (!newDesc.trim() || newQty <= 0 || newRate <= 0) return;
    const base = newQty * newRate;
    const tax = Math.round(base * 0.18); // 18% GST
    const item: InvoiceLineItem = {
      description: newDesc.trim(),
      quantity: newQty,
      unit: newUnit,
      rate: newRate,
      taxCode: 'GST 18%',
      taxAmount: tax,
      total: base + tax
    };
    setLineItems([...lineItems, item]);
    setNewDesc('');
    setNewQty(10);
    setNewRate(1200);
  };

  const handleRemoveLineItem = (index: number) => {
    if (isLocked) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSaveDraft = () => {
    if (!customerName || lineItems.length === 0) {
      alert('Please enter customer name and at least one line item.');
      return;
    }
    const targetSite = sites.find(s => s.id === siteId) || sites[0];

    createInvoice({
      customerName,
      customerAddress,
      customerTaxId,
      siteId: targetSite.id,
      siteName: targetSite.name,
      date: invoiceDate,
      dueDate,
      servicePeriod,
      poNumber,
      contractRef,
      lineItems,
      discount
    });

    alert('Tax Invoice Draft Saved Successfully.');
    onBack();
  };

  const handleApprove = () => {
    if (existingInvoice) {
      approveInvoice(existingInvoice.id);
      alert(`Invoice ${existingInvoice.invoiceNumber} Approved.`);
    }
  };

  const handleIssue = () => {
    if (existingInvoice) {
      issueInvoice(existingInvoice.id);
      alert(`Tax Invoice ${existingInvoice.invoiceNumber} Officially Issued. Document is now LOCKED.`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-800 dark:text-slate-200">
      
      {/* Top Action Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#E50914] transition"
        >
          <ArrowLeft size={16} /> Back to Commercial Ledger
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {isLocked && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-[#E50914] border border-[#E50914]/30 rounded-xl text-xs font-black tracking-wider">
              <Lock size={14} /> ISSUED — LOCKED
            </span>
          )}

          {!isLocked && (
            <>
              <button
                onClick={handleSaveDraft}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-xs font-bold rounded-xl transition"
              >
                Save Draft
              </button>

              {existingInvoice && existingInvoice.status === 'Draft' && canApprove && (
                <button
                  onClick={handleApprove}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle size={14} /> Approve Invoice
                </button>
              )}

              {existingInvoice && existingInvoice.status === 'Approved' && (
                <button
                  onClick={handleIssue}
                  className="px-3.5 py-1.5 bg-[#E50914] hover:bg-[#b00610] text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-md shadow-red-600/20"
                >
                  <Lock size={14} /> Issue Invoice (Lock)
                </button>
              )}
            </>
          )}

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
            title="Print Full Invoice"
          >
            <Printer size={14} /> Print
          </button>

          <button
            onClick={() => alert('Tax Invoice PDF Generated successfully.')}
            className="px-3.5 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
          >
            <Download size={14} /> Download PDF
          </button>

          <button
            onClick={() => alert(`Invoice dispatched to client email.`)}
            className="px-3.5 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
          >
            <Send size={14} /> Send to Client
          </button>
        </div>
      </div>

      {/* FULL-PAGE TAX INVOICE DOCUMENT CANVAS */}
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 sm:p-12 shadow-xl text-slate-900 dark:text-slate-100 font-sans space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* 1. HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 dark:border-zinc-800 pb-6 gap-6">
          <div className="space-y-2">
            <BrandLogo size="md" />
            <h1 className="text-xl font-black tracking-tight text-black dark:text-white">DevLustro Technologies Pvt Ltd</h1>
            <p className="text-xs text-slate-500 font-medium">Enterprise Learning & Technical Trainer Operations</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="inline-block bg-[#E50914] text-white text-xs font-black tracking-[0.2em] uppercase px-3 py-1 rounded-md mb-2 shadow-sm">
              TAX INVOICE
            </span>
            <p className="text-sm font-extrabold text-slate-850 dark:text-white">
              Invoice No: <span className="font-mono text-[#E50914]">{existingInvoice?.invoiceNumber || 'SPK-INV-2026-DRAFT'}</span>
            </p>
            <p className="text-xs text-slate-500">Date: <span className="font-semibold text-slate-800 dark:text-slate-200">{invoiceDate}</span></p>
            <p className="text-xs text-slate-500">Due Date: <span className="font-semibold text-slate-800 dark:text-slate-200">{dueDate}</span></p>
          </div>
        </div>

        {/* 2. SELLER & CUSTOMER DETAILS (2-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
          
          {/* Seller Details */}
          <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-xl p-4 space-y-1.5">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-[#E50914]">Seller Details</h4>
            <p className="font-black text-sm text-slate-900 dark:text-white">DevLustro Technologies Pvt Ltd</p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Level 4, Outer Ring Road Tech Hub, Bellandur, Bangalore, Karnataka - 560103, India
            </p>
            {canSeeTaxReg ? (
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-0.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <p><strong>GSTIN:</strong> {revealGstin ? '29AAACD9932B1Z3' : '29AAAC•••••1Z3'}</p>
                  <button
                    type="button"
                    onClick={() => setRevealGstin(prev => !prev)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 transition"
                    title={revealGstin ? 'Mask GSTIN' : 'Reveal GSTIN'}
                  >
                    {revealGstin ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
                <p><strong>PAN:</strong> AAACD9932B</p>
                <p><strong>CIN:</strong> U72900KA2024PTC189021</p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic pt-1 flex items-center gap-1">
                <Lock size={10} className="text-amber-500" /> Tax identifier masked & secured.
              </p>
            )}
          </div>

          {/* Customer Details */}
          <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-xl p-4 space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-[#E50914]">Customer / Billed To</h4>
            {isLocked ? (
              <div className="space-y-1">
                <p className="font-black text-sm text-slate-900 dark:text-white">{customerName}</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{customerAddress}</p>
                {canSeeTaxReg && customerTaxId && (
                  <p className="font-mono text-[11px] pt-1"><strong>Client Tax ID:</strong> {customerTaxId}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Legal Entity Name *"
                  className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-bold text-xs outline-none focus:border-[#E50914]"
                />
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Billing Address & State *"
                  rows={2}
                  className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs outline-none focus:border-[#E50914] resize-none"
                />
                {canSeeTaxReg && (
                  <input
                    type="text"
                    value={customerTaxId}
                    onChange={(e) => setCustomerTaxId(e.target.value)}
                    placeholder="Customer GSTIN / Tax ID"
                    className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono text-xs outline-none focus:border-[#E50914]"
                  />
                )}
              </div>
            )}
          </div>

        </div>

        {/* 3. INVOICE METADATA DETAILS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">PO Number</span>
            <p className="font-bold text-slate-800 dark:text-white mt-0.5">{poNumber}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">MOU / Contract Ref</span>
            <p className="font-bold text-slate-800 dark:text-white mt-0.5">{contractRef}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Service Period</span>
            <p className="font-bold text-slate-800 dark:text-white mt-0.5">{servicePeriod}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Terms</span>
            <p className="font-bold text-slate-800 dark:text-white mt-0.5">Net 30 Days</p>
          </div>
        </div>

        {/* 4. LINE ITEMS TABLE */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Services & Line Items</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-zinc-800 text-[10px] uppercase font-black text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Description</th>
                  <th className="py-2 px-2 text-right">Qty / Hrs</th>
                  <th className="py-2 px-2 text-right">Unit</th>
                  <th className="py-2 px-2 text-right">Rate (₹)</th>
                  <th className="py-2 px-2 text-right">Tax Code</th>
                  <th className="py-2 px-2 text-right">Tax (₹)</th>
                  <th className="py-2 px-2 text-right">Amount (₹)</th>
                  {!isLocked && <th className="py-2 px-2 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
                {lineItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-900/30">
                    <td className="py-3 px-2 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-2 font-bold text-slate-800 dark:text-slate-100">{item.description}</td>
                    <td className="py-3 px-2 text-right font-mono">{item.quantity}</td>
                    <td className="py-3 px-2 text-right text-slate-500">{item.unit || 'Hours'}</td>
                    <td className="py-3 px-2 text-right font-mono">₹{item.rate.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right text-slate-500 font-bold text-[10px]">{item.taxCode}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-600 dark:text-slate-400">₹{item.taxAmount.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">₹{item.total.toLocaleString()}</td>
                    {!isLocked && (
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 transition"
                          title="Delete Item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Line Item form row if not locked */}
          {!isLocked && (
            <div className="bg-slate-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-wrap gap-2 items-center text-xs print:hidden">
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Item description (e.g. Distributed Cloud Seminar)..."
                className="flex-1 min-w-[220px] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-semibold outline-none"
              />
              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(Number(e.target.value))}
                placeholder="Qty"
                className="w-20 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-mono outline-none"
              />
              <input
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(Number(e.target.value))}
                placeholder="Rate"
                className="w-24 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-xs font-mono outline-none"
              />
              <button
                type="button"
                onClick={handleAddLineItem}
                className="bg-[#E50914] text-white px-3 py-2 rounded-lg font-bold hover:bg-[#b00610] transition flex items-center gap-1"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
          )}

        </div>

        {/* 5. TOTALS BREAKDOWN */}
        <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t-2 border-slate-200 dark:border-zinc-800 gap-8">
          
          {/* Amount in words & Notes */}
          <div className="space-y-3 max-w-md text-xs">
            <div className="bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider mb-0.5">Amount in Words</span>
              <p className="font-black text-slate-900 dark:text-slate-100 italic">{amountInWords}</p>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Tax invoice generated under Section 31 of CGST Act. Certified that the particulars given above are true and correct.
            </p>
          </div>

          {/* Numerical Totals */}
          <div className="w-full sm:w-72 space-y-2 text-xs font-bold">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono">₹{subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-mono">-₹{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tax (GST 18%):</span>
              <span className="font-mono">₹{totalTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Rounding Adjustment:</span>
              <span className="font-mono">₹0.00</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-slate-300 dark:border-zinc-700 text-base font-black text-slate-900 dark:text-white">
              <span>TOTAL:</span>
              <span className="text-[#E50914] font-mono">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>

        </div>

        {/* 6. PAYMENT DETAILS & INSTRUCTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200 dark:border-zinc-800 text-xs bg-slate-50/60 dark:bg-zinc-900/30 p-5 rounded-xl">
          <div className="space-y-1.5">
            <h4 className="font-black text-[10px] uppercase text-[#E50914] tracking-wider">Bank Wire Details (Direct Escrow)</h4>
            <div className="space-y-1 font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
              <p><strong>Bank:</strong> HDFC Bank Ltd (MG Road Branch)</p>
              <p><strong>Account Name:</strong> DevLustro Technologies Pvt Ltd</p>
              <p><strong>Account No:</strong> 50200012345678</p>
              <p><strong>IFSC Code:</strong> HDFC0001234</p>
              <p><strong>UPI ID:</strong> spark.devlustro@hdfcbank</p>
            </div>
          </div>

          <div className="space-y-1.5 flex flex-col justify-between">
            <div>
              <h4 className="font-black text-[10px] uppercase text-[#E50914] tracking-wider">Authorized Signatory</h4>
              <p className="text-[10px] text-slate-400 mt-1">DevLustro Technologies Pvt Ltd Digital Stamp</p>
            </div>
            <div className="pt-4 border-t border-dashed border-slate-300 dark:border-zinc-700 flex justify-between items-center text-[10px] text-slate-500 font-bold">
              <span>Authorized Signature</span>
              <span className="text-emerald-500 flex items-center gap-1"><ShieldCheck size={12} /> Digitally Signed</span>
            </div>
          </div>
        </div>

        {/* 7. FOOTER */}
        <div className="pt-6 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center text-[10px] text-slate-400 font-semibold">
          <span>Spark Enterprise Trainer Operations · Powered by DevLustro Technologies Pvt Ltd</span>
          <span>Page 1 of 1</span>
        </div>

      </div>

    </div>
  );
};

export default TaxInvoiceFullPage;
