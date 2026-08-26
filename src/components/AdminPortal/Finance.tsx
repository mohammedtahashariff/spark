import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Plus, ArrowRight, X, Eye } from 'lucide-react';
import type { Invoice, InvoiceLineItem } from '../../types';


// Helper: Convert number to Words (Simulated for billing INR)
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

const Finance: React.FC = () => {
  const { 
    quotations, invoices, payments, sites, 
    createQuotation, updateQuotationStatus, convertQuotationToInvoice, 
    createInvoice, issueInvoice, recordPayment 
  } = useDatabase();

  const [subTab, setSubTab] = useState<'quotes' | 'invoices' | 'payments' | 'ageing'>('invoices');
  
  // Modal controllers
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  // Add Quote/Invoice Common Form State
  const [custName, setCustName] = useState('');
  const [siteId, setSiteId] = useState('');
  const [period, setPeriod] = useState('August 2026');
  const [discount, setDiscount] = useState('0');
  
  // Item line State
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemRate, setItemRate] = useState('1000');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);

  // Payment Record State
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'Bank Transfer' | 'UPI' | 'Card' | 'Cheque'>('Bank Transfer');
  const [payRef, setPayRef] = useState('');

  const handleAddLineItem = () => {
    if (!itemDesc.trim() || !itemQty || !itemRate) return;
    const qty = Number(itemQty);
    const rate = Number(itemRate);
    const sub = qty * rate;
    const tax = Math.round(sub * 0.18); // 18% GST default

    setLineItems(prev => [
      ...prev,
      {
        description: itemDesc.trim(),
        quantity: qty,
        rate,
        taxCode: 'GST 18%',
        taxAmount: tax,
        total: sub + tax
      }
    ]);

    setItemDesc('');
    setItemQty('1');
    setItemRate('1000');
  };

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !siteId || lineItems.length === 0) return;

    const site = sites.find(s => s.id === siteId);
    if (!site) return;

    createQuotation({
      customerName: custName,
      siteId,
      siteName: site.name,
      date: new Date().toISOString().split('T')[0],
      servicePeriod: period,
      lineItems,
      discount: Number(discount) || 0
    });

    setCustName('');
    setSiteId('');
    setDiscount('0');
    setLineItems([]);
    setShowAddQuote(false);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !siteId || lineItems.length === 0) return;

    const site = sites.find(s => s.id === siteId);
    if (!site) return;

    const today = new Date();
    const due = new Date();
    due.setDate(due.getDate() + 30); // 30 days terms

    createInvoice({
      customerName: custName,
      siteId,
      siteName: site.name,
      date: today.toISOString().split('T')[0],
      dueDate: due.toISOString().split('T')[0],
      servicePeriod: period,
      lineItems,
      discount: Number(discount) || 0
    });

    setCustName('');
    setSiteId('');
    setDiscount('0');
    setLineItems([]);
    setShowAddInvoice(false);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payInvoiceId || !payAmount || !payRef) return;

    const inv = invoices.find(i => i.id === payInvoiceId);
    if (!inv) return;

    recordPayment({
      invoiceId: payInvoiceId,
      invoiceNumber: inv.invoiceNumber,
      amount: Number(payAmount),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: payMode,
      referenceNumber: payRef
    });

    setPayInvoiceId('');
    setPayAmount('');
    setPayRef('');
    setShowRecordPayment(false);
  };

  // Ageing Logic: outstanding totals grouped by customers
  const computeAgeing = () => {
    const ageingMap: { [key: string]: { total: number; current: number; d1: number; d2: number; d3: number } } = {};
    
    invoices.forEach(inv => {
      if (inv.outstandingBalance <= 0) return;
      
      if (!ageingMap[inv.customerName]) {
        ageingMap[inv.customerName] = { total: 0, current: 0, d1: 0, d2: 0, d3: 0 };
      }
      
      const record = ageingMap[inv.customerName];
      record.total += inv.outstandingBalance;

      // Group by due date (simulated ageing logic)
      const diffTime = new Date(inv.dueDate).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 0) {
        record.current += inv.outstandingBalance;
      } else {
        const pastDue = Math.abs(diffDays);
        if (pastDue <= 30) record.d1 += inv.outstandingBalance;
        else if (pastDue <= 60) record.d2 += inv.outstandingBalance;
        else record.d3 += inv.outstandingBalance;
      }
    });

    return Object.entries(ageingMap).map(([name, data]) => ({ name, ...data }));
  };

  const getInvoiceStatus = (status: string) => {
    switch (status) {
      case 'Paid':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Paid</span>;
      case 'Part Paid':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/10 text-blue-450 border border-blue-500/20">Part Paid</span>;
      case 'Issued':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/20">Issued</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-800 text-slate-400 border border-slate-700">Draft</span>;
    }
  };

  const ageingData = computeAgeing();

  return (
    <div className="space-y-5 text-slate-700 dark:text-slate-350 flex flex-col h-full relative transition-colors duration-200">
      
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-zinc-800 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide font-sans">Commercial & Finance</h2>
          <p className="text-xs text-slate-550 mt-0.5 font-medium">Create invoices, manage corporate quotations, record UPI/Bank receipts, and check ageing accounts.</p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl p-1 gap-1 shadow-sm">
          <button
            onClick={() => setSubTab('quotes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'quotes' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm' : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Quotations
          </button>
          <button
            onClick={() => setSubTab('invoices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'invoices' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm' : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Tax Invoices
          </button>
          <button
            onClick={() => setSubTab('payments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'payments' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm' : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setSubTab('ageing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'ageing' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm' : 'text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Ageing Grid
          </button>
        </div>
      </div>

      {/* Main Inner Content */}
      <div className="flex-grow overflow-y-auto">
        
        {/* 1. Quotations Tab */}
        {subTab === 'quotes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">{quotations.length} Quotations logged</span>
              <button
                onClick={() => { setLineItems([]); setShowAddQuote(true); }}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
              >
                <Plus size={16} /> Create Quotation
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-150 dark:border-zinc-800 text-slate-500 dark:text-slate-450 uppercase tracking-wider text-[9px] font-bold">
                    <th className="p-4">Quotation No</th>
                    <th className="p-4">Customer Site</th>
                    <th className="p-4">Service Period</th>
                    <th className="p-4 text-right">Total (GST inc)</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {quotations.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/30 transition">
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">{q.quotationNumber}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{q.customerName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-medium">{q.siteName}</p>
                      </td>
                      <td className="p-4 font-semibold text-slate-600 dark:text-slate-400">{q.servicePeriod}</td>
                      <td className="p-4 text-right font-black text-rose-600 dark:text-rose-455">₹{q.totalAmount.toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            q.status === 'Converted' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                            q.status === 'Accepted' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                            q.status === 'Rejected' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-455 border border-rose-500/20' :
                            'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-500 border border-slate-200 dark:border-zinc-700'
                          }`}>
                            {q.status}
                          </span>
                          
                          {q.status === 'Draft' && (
                            <button
                              onClick={() => updateQuotationStatus(q.id, 'Sent')}
                              className="text-[10px] font-bold text-blue-600 dark:text-blue-500 hover:underline"
                            >
                              Send Quote
                            </button>
                          )}
                          {q.status === 'Sent' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateQuotationStatus(q.id, 'Accepted')}
                                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => updateQuotationStatus(q.id, 'Rejected')}
                                className="text-[10px] font-bold text-rose-600 dark:text-rose-500 hover:underline"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {q.status === 'Accepted' && (
                            <button
                              onClick={() => convertQuotationToInvoice(q.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                            >
                              Convert to Invoice <ArrowRight size={10} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Tax Invoices Tab */}
        {subTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">{invoices.length} Tax Invoices generated</span>
              <button
                onClick={() => { setLineItems([]); setShowAddInvoice(true); }}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Plus size={16} /> Create Invoice
              </button>
            </div>            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-150 dark:border-zinc-800 text-slate-500 dark:text-slate-450 uppercase tracking-wider text-[9px] font-bold">
                    <th className="p-4">Invoice No</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4 text-right">Outstanding (₹)</th>
                    <th className="p-4 text-right">Grand Total (₹)</th>
                    <th className="p-4 text-center font-bold">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/30 transition">
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">{inv.invoiceNumber}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{inv.customerName}</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-450 mt-0.5 font-medium">Cycle: {inv.servicePeriod}</p>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 font-semibold">{inv.dueDate}</td>
                      <td className="p-4 text-right font-black text-rose-600 dark:text-rose-455">₹{inv.outstandingBalance.toLocaleString()}</td>
                      <td className="p-4 text-right font-black text-slate-800 dark:text-slate-200">₹{inv.totalAmount.toLocaleString()}</td>
                      <td className="p-4 text-center">{getInvoiceStatus(inv.status)}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-355 p-1.5 rounded transition"
                            title="View PDF Invoice"
                          >
                            <Eye size={12} />
                          </button>
                          
                          {inv.status === 'Draft' && (
                            <button
                              onClick={() => issueInvoice(inv.id)}
                              className="text-[10px] font-black text-blue-600 dark:text-blue-500 hover:underline"
                            >
                              Issue Invoice
                            </button>
                          )}
                          {['Issued', 'Part Paid'].includes(inv.status) && (
                            <button
                              onClick={() => { setPayInvoiceId(inv.id); setPayAmount(inv.outstandingBalance.toString()); setShowRecordPayment(true); }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg text-[10px] font-bold transition shadow-sm"
                            >
                              Record pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Payments Tab */}
        {subTab === 'payments' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-sans">Allocated Client Receipts Log</h3>
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-150 dark:border-zinc-800 text-slate-500 dark:text-slate-450 uppercase tracking-wider text-[9px] font-bold">
                    <th className="p-4">Receipt No</th>
                    <th className="p-4">Invoice Reference</th>
                    <th className="p-4">Receipt Date</th>
                    <th className="p-4">Method / Ref</th>
                    <th className="p-4 text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {payments.map(pay => (
                    <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/30 transition">
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">{pay.paymentNumber}</td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{pay.invoiceNumber}</span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 font-semibold">{pay.paymentDate}</td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-700 dark:text-slate-350">{pay.paymentMode}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 font-medium">Ref: {pay.referenceNumber}</p>
                      </td>
                      <td className="p-4 text-right font-black text-rose-600 dark:text-rose-455">₹{pay.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 dark:text-slate-500 font-medium">No payment receipts logged in ledger.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Ageing Grid Tab */}
        {subTab === 'ageing' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-sans">Receivables Collections Ageing Grid</h3>
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-150 dark:border-zinc-800 text-slate-500 dark:text-slate-450 uppercase tracking-wider text-[9px] font-bold">
                    <th className="p-4">Customer Site</th>
                    <th className="p-4 text-right">Total Outstanding</th>
                    <th className="p-4 text-right">Current</th>
                    <th className="p-4 text-right">1 - 30 Days</th>
                    <th className="p-4 text-right">31 - 60 Days</th>
                    <th className="p-4 text-right">60+ Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {ageingData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/30 transition">
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{row.name}</td>
                      <td className="p-4 text-right font-black text-rose-600 dark:text-rose-455">₹{row.total.toLocaleString()}</td>
                      <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-350">₹{row.current.toLocaleString()}</td>
                      <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-350">₹{row.d1.toLocaleString()}</td>
                      <td className="p-4 text-right font-semibold text-slate-700 dark:text-slate-350">₹{row.d2.toLocaleString()}</td>
                      <td className="p-4 text-right font-semibold text-rose-600 dark:text-rose-500">₹{row.d3.toLocaleString()}</td>
                    </tr>
                  ))}
                  {ageingData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 dark:text-slate-500 font-medium">No outstanding customer receivables in grid.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Quotation Creation Modal */}
      {showAddQuote && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl overflow-y-auto max-h-[600px] custom-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-md font-bold text-white">Create Commercial Quotation</h3>
              <button onClick={() => setShowAddQuote(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveQuotation} className="space-y-4 text-xs text-slate-350">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. ABC College of Eng"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none focus:border-rose-600 text-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Location Site *</label>
                  <select
                    required
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none focus:border-rose-600 text-white font-semibold"
                  >
                    <option value="">Select Site</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Service Period</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder="August 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none focus:border-rose-600 text-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Discount Amount (₹)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none focus:border-rose-600 text-white font-semibold"
                  />
                </div>
              </div>

              {/* Add Line Item subform */}
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-3">
                <p className="font-bold text-[10px] uppercase tracking-wider text-rose-500">Service Line Items</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-slate-500 font-bold text-[8px]">Description</label>
                    <input
                      type="text"
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      placeholder="e.g. Training Bootcamp (20 hours)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white outline-none focus:border-rose-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold text-[8px]">Action</label>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-lg font-bold"
                    >
                      Add Line
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold text-[8px]">Qty / Hours</label>
                    <input
                      type="number"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold text-[8px]">Unit Rate (₹)</label>
                    <input
                      type="number"
                      value={itemRate}
                      onChange={(e) => setItemRate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white outline-none"
                    />
                  </div>
                </div>

                {/* Line Items List */}
                {lineItems.length > 0 && (
                  <div className="divide-y divide-slate-850 mt-2">
                    {lineItems.map((item, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center text-[10px]">
                        <span className="text-slate-300 font-bold">{item.description} ({item.quantity} * ₹{item.rate})</span>
                        <span className="font-bold text-rose-500">₹{item.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={lineItems.length === 0}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 font-bold transition shadow-lg disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                Save Quotation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Creation Modal */}
      {showAddInvoice && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl overflow-y-auto max-h-[600px] custom-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-md font-bold text-white">Create Tax Invoice</h3>
              <button onClick={() => setShowAddInvoice(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4 text-xs text-slate-355">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="ABC Engineering College"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none focus:border-rose-600 text-white font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Location Site *</label>
                  <select
                    required
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none focus:border-rose-600 text-white font-semibold"
                  >
                    <option value="">Select Site Location</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Service Period</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none text-white font-semibold focus:border-rose-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-455 font-bold uppercase tracking-wider text-[9px]">Discount (₹)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none text-white font-semibold focus:border-rose-600"
                  />
                </div>
              </div>

              {/* Line Items Subform */}
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-3">
                <p className="font-bold text-[10px] uppercase tracking-wider text-rose-500">Service Line Items</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-slate-500 font-bold text-[8px]">Description</label>
                    <input
                      type="text"
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      placeholder="e.g. Java Fullstack Bootcamp Program (10 days)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white outline-none focus:border-rose-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold text-[8px]">Action</label>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-lg font-bold"
                    >
                      Add Line
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold text-[8px]">Qty / Days / Hours</label>
                    <input
                      type="number"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 font-bold text-[8px]">Unit Rate (₹)</label>
                    <input
                      type="number"
                      value={itemRate}
                      onChange={(e) => setItemRate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white outline-none"
                    />
                  </div>
                </div>

                {lineItems.length > 0 && (
                  <div className="divide-y divide-slate-850 mt-2">
                    {lineItems.map((item, idx) => (
                      <div key={idx} className="py-2 flex justify-between items-center text-[10px]">
                        <span className="text-slate-300 font-bold">{item.description} ({item.quantity} * ₹{item.rate})</span>
                        <span className="font-bold text-rose-500">₹{item.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={lineItems.length === 0}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 font-bold transition shadow-lg disabled:bg-slate-800 disabled:text-slate-500"
              >
                Create Tax Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Receipt Modal */}
      {showRecordPayment && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-sm font-bold text-white">Record Client Payment</h3>
              <button onClick={() => setShowRecordPayment(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs text-slate-350">
              <div className="space-y-1">
                <label className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Select Invoice *</label>
                <select
                  required
                  value={payInvoiceId}
                  onChange={(e) => setPayInvoiceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none text-white font-semibold focus:border-rose-600"
                >
                  <option value="">Select Invoice</option>
                  {invoices.filter(i => ['Issued', 'Part Paid'].includes(i.status)).map(i => (
                    <option key={i.id} value={i.id}>
                      {i.invoiceNumber} - {i.customerName} (Bal: ₹{i.outstandingBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Receipt Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none text-white font-semibold focus:border-rose-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none text-white font-semibold focus:border-rose-600"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Card">Credit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-450 font-bold uppercase tracking-wider text-[9px]">Banking Ref / Txn ID *</label>
                <input
                  type="text"
                  required
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="HDFCTRN89234123"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none text-white font-semibold focus:border-rose-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 font-bold transition shadow-lg"
              >
                Record Payment Allocation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PDF Printable Invoice Detail view overlay */}
      {viewInvoice && (
        <div className="absolute inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
          
          {/* Printable Invoice Page Container */}
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl p-8 border border-slate-200 flex flex-col justify-between max-h-[90vh] overflow-y-auto relative print-container">
            
            {/* Top Close icon */}
            <button 
              onClick={() => setViewInvoice(null)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-800 p-2 rounded-full hidden-print"
              title="Close Invoice View"
            >
              <X size={18} />
            </button>

            {/* Header Content */}
            <div className="space-y-6">
              
              {/* Brand & Corporate details */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                <div>
                  {/* Brand name matching design in Century Gothic */}
                  <h3 className="font-sans font-black text-2xl text-slate-950 tracking-wider">SPARK EDUTECH</h3>
                  <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Empowering Talent • Enabling Careers</p>
                  <div className="text-xs text-slate-500 space-y-0.5 mt-2.5 leading-relaxed font-semibold">
                    <p>Spark Corporate Office, GSTIN: 29AAACD9932B1Z3</p>
                    <p>Kasturba Road, MG Road Area, Bengaluru, 560001</p>
                    <p>contact@sparkedutech.com • +91 80 4399 2300</p>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="font-extrabold text-xl text-slate-950 uppercase tracking-wide">TAX INVOICE</h1>
                  <div className="bg-slate-950 text-white rounded p-2.5 text-xs text-left mt-2 space-y-1 font-mono font-semibold">
                    <p>Inv No: <span className="font-black text-rose-500">{viewInvoice.invoiceNumber}</span></p>
                    <p>Date: {viewInvoice.date}</p>
                    <p>Due Date: {viewInvoice.dueDate}</p>
                  </div>
                </div>
              </div>

              {/* Bill To details */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black mb-1">BILL TO (CLIENT)</p>
                  <p className="font-bold text-slate-950 text-sm">{viewInvoice.customerName}</p>
                  <p className="text-slate-500 mt-1">{viewInvoice.siteName}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black mb-1">SERVICE SUMMARY</p>
                  <p>Billing Period: <span className="text-slate-950 font-bold">{viewInvoice.servicePeriod}</span></p>
                  <p className="mt-1">Terms: Net 30 Days</p>
                </div>
              </div>

              {/* Line items Grid */}
              <table className="w-full text-left text-xs border-collapse font-semibold mt-4">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[9px] font-black tracking-wider">
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Qty / Days</th>
                    <th className="p-3 text-right">Unit Rate (₹)</th>
                    <th className="p-3 text-right">Tax Code</th>
                    <th className="p-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viewInvoice.lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-bold text-slate-950">{item.description}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-right">₹{item.rate.toLocaleString()}</td>
                      <td className="p-3 text-right">{item.taxCode} (₹{item.taxAmount.toLocaleString()})</td>
                      <td className="p-3 text-right font-bold text-slate-950">₹{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Calculations */}
              <div className="flex justify-end pt-3">
                <div className="w-64 space-y-1.5 text-xs text-right font-semibold border-t border-slate-250 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="text-slate-950">₹{viewInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  {viewInvoice.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Discount</span>
                      <span className="text-slate-950">- ₹{viewInvoice.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">CGST/SGST (18% tax)</span>
                    <span className="text-slate-950">₹{viewInvoice.taxTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-900 pt-2 font-black">
                    <span className="text-slate-950 text-sm">Invoice Total</span>
                    <span className="text-rose-600 text-sm">₹{viewInvoice.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Amount in words */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-bold leading-normal">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black block mb-0.5">Amount in words:</span>
                <p className="text-slate-800">{numberToWords(viewInvoice.totalAmount)}</p>
              </div>

            </div>

            {/* Footer Signatures */}
            <div className="border-t border-slate-200 pt-6 mt-8 flex justify-between items-end text-[10px] text-slate-450 font-semibold leading-relaxed">
              <div>
                <p className="font-bold text-slate-900">Payment Instructions:</p>
                <p>Bank: HDFC Bank Ltd • Branch: MG Road Bengaluru</p>
                <p>A/c Name: Spark Edutech Private Limited</p>
                <p>A/c Number: 50200088924012 • IFSC: HDFC0000140</p>
              </div>
              <div className="text-center w-48 border-t border-slate-400 pt-2.5 mt-8 self-end font-bold text-slate-950">
                Authorized Signatory
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Finance;
