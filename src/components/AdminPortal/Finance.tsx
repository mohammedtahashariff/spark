import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Plus, ArrowRight, X, Eye, FileText, Lock, CheckCircle, Printer, Download, CreditCard, DollarSign } from 'lucide-react';
import type { Invoice, InvoiceLineItem } from '../../types';
import TaxInvoiceFullPage from './TaxInvoiceFullPage';

const Finance: React.FC = () => {
  const { 
    currentUser, quotations, invoices, payments, sites, 
    createQuotation, updateQuotationStatus, convertQuotationToInvoice, 
    createInvoice, issueInvoice, recordPayment 
  } = useDatabase();

  const [subTab, setSubTab] = useState<'quotes' | 'invoices' | 'payments' | 'ageing'>('invoices');
  
  // Full-Page Invoice Navigation State (Requirement 13)
  const [fullPageInvoiceId, setFullPageInvoiceId] = useState<string | 'new' | null>(null);

  // Modal controllers
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);

  // Add Quote Common Form State
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

  // Permission logic for Tax Registration ID (Requirement 17)
  const canSeeTaxReg = currentUser?.role === 'super_admin' || currentUser?.role === 'finance';

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

  // Ageing Logic
  const computeAgeing = () => {
    const ageingMap: { [key: string]: { total: number; current: number; d1: number; d2: number; d3: number } } = {};
    
    invoices.forEach(inv => {
      if (inv.outstandingBalance <= 0) return;
      
      if (!ageingMap[inv.customerName]) {
        ageingMap[inv.customerName] = { total: 0, current: 0, d1: 0, d2: 0, d3: 0 };
      }
      
      const record = ageingMap[inv.customerName];
      record.total += inv.outstandingBalance;

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

  const getInvoiceStatus = (status: string, isLocked?: boolean) => {
    if (isLocked || status === 'Issued') {
      return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-[#E50914] border border-[#E50914]/30 flex items-center gap-1"><Lock size={10} /> ISSUED — LOCKED</span>;
    }
    switch (status) {
      case 'Paid':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">PAID ✓</span>;
      case 'Part Paid':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Part Paid</span>;
      case 'Approved':
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Approved</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-500 border border-slate-200 dark:border-zinc-700">Draft</span>;
    }
  };

  const ageingData = computeAgeing();

  // If Full-Page Tax Invoice view is active, render it directly (Requirement 13)
  if (fullPageInvoiceId !== null) {
    return (
      <TaxInvoiceFullPage
        invoiceId={fullPageInvoiceId === 'new' ? undefined : fullPageInvoiceId}
        onBack={() => setFullPageInvoiceId(null)}
      />
    );
  }

  return (
    <div className="space-y-5 text-slate-700 dark:text-slate-350 flex flex-col h-full relative transition-colors duration-200">
      
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">Commercial & Finance</h2>
          <p className="text-xs text-slate-500 dark:text-slate-455 mt-0.5 font-medium">
            Manage tax invoices, corporate quotations, direct receipts, and ageing balance sheets.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-1 gap-1 shadow-sm">
          <button
            onClick={() => setSubTab('invoices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'invoices' ? 'bg-[#E50914] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tax Invoices
          </button>
          <button
            onClick={() => setSubTab('quotes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'quotes' ? 'bg-[#E50914] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Quotations
          </button>
          <button
            onClick={() => setSubTab('payments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'payments' ? 'bg-[#E50914] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setSubTab('ageing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'ageing' ? 'bg-[#E50914] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ageing Grid
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow overflow-y-auto">
        
        {/* 1. Tax Invoices Tab (Full-Page Invoice Integration) */}
        {subTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">{invoices.length} Tax Invoices generated</span>
              
              <button
                onClick={() => setFullPageInvoiceId('new')}
                className="bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-600/20"
              >
                <Plus size={16} /> CREATE FULL-PAGE TAX INVOICE
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-slate-450 uppercase tracking-wider text-[9px] font-bold">
                    <th className="p-4">Invoice No</th>
                    <th className="p-4">Client / Campus</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4 text-right">Outstanding (₹)</th>
                    <th className="p-4 text-right">Grand Total (₹)</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
                  {invoices.map(inv => (
                    <tr 
                      key={inv.id} 
                      onClick={() => setFullPageInvoiceId(inv.id)}
                      className="hover:bg-slate-50 dark:hover:bg-zinc-850/40 transition cursor-pointer"
                    >
                      <td className="p-4 font-mono font-bold text-[#E50914]">{inv.invoiceNumber}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white">{inv.customerName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{inv.siteName}</p>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{inv.dueDate}</td>
                      <td className="p-4 text-right font-black text-[#E50914]">₹{inv.outstandingBalance.toLocaleString()}</td>
                      <td className="p-4 text-right font-black text-slate-900 dark:text-white">₹{inv.totalAmount.toLocaleString()}</td>
                      <td className="p-4 text-center">{getInvoiceStatus(inv.status, inv.isLocked)}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setFullPageInvoiceId(inv.id); }}
                          className="bg-slate-50 dark:bg-zinc-800 hover:bg-[#E50914] hover:text-white border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold transition"
                        >
                          Open Full-Page
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Quotations Tab */}
        {subTab === 'quotes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">{quotations.length} Quotations logged</span>
              <button
                onClick={() => { setLineItems([]); setShowAddQuote(true); }}
                className="bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Plus size={16} /> Create Quotation
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-slate-500 uppercase tracking-wider text-[9px] font-bold">
                    <th className="p-4">Quotation No</th>
                    <th className="p-4">Customer Site</th>
                    <th className="p-4">Service Period</th>
                    <th className="p-4 text-right">Total (GST inc)</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
                  {quotations.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-zinc-850/40 transition">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">{q.quotationNumber}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white">{q.customerName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{q.siteName}</p>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{q.servicePeriod}</td>
                      <td className="p-4 text-right font-black text-[#E50914]">₹{q.totalAmount.toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-zinc-700">
                            {q.status}
                          </span>
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

        {/* 3. Payments Tab */}
        {subTab === 'payments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">{payments.length} Payments recorded</span>
              <button
                onClick={() => setShowRecordPayment(true)}
                className="bg-[#E50914] hover:bg-[#b00610] text-white rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <Plus size={16} /> Record Payment Receipt
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-slate-500 uppercase tracking-wider text-[9px] font-bold">
                    <th className="p-4">Receipt No</th>
                    <th className="p-4">Invoice No</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Payment Mode</th>
                    <th className="p-4">Reference UTR</th>
                    <th className="p-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-zinc-850/40 transition">
                      <td className="p-4 font-mono font-bold text-[#E50914]">{p.paymentNumber}</td>
                      <td className="p-4 font-mono">{p.invoiceNumber}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{p.paymentDate}</td>
                      <td className="p-4">{p.paymentMode}</td>
                      <td className="p-4 font-mono text-[11px] text-slate-500">{p.referenceNumber}</td>
                      <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400">₹{p.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Ageing Grid Tab */}
        {subTab === 'ageing' && (
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-500">Corporate Client Outstanding Ageing Analysis</span>
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-slate-500 uppercase tracking-wider text-[9px] font-bold">
                    <th className="p-4">Client Name</th>
                    <th className="p-4 text-right">Current (0-30d)</th>
                    <th className="p-4 text-right">31-60 Days</th>
                    <th className="p-4 text-right">60+ Days</th>
                    <th className="p-4 text-right">Total Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-semibold">
                  {ageingData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-850/40 transition">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{row.name}</td>
                      <td className="p-4 text-right font-mono">₹{row.current.toLocaleString()}</td>
                      <td className="p-4 text-right font-mono text-amber-500">₹{row.d1.toLocaleString()}</td>
                      <td className="p-4 text-right font-mono text-rose-500">₹{row.d2.toLocaleString()}</td>
                      <td className="p-4 text-right font-black text-[#E50914]">₹{row.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Record Payment Receipt Modal */}
      {showRecordPayment && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Record Payment Receipt</h3>
              <button onClick={() => setShowRecordPayment(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Select Invoice *</label>
                <select
                  required
                  value={payInvoiceId}
                  onChange={(e) => {
                    setPayInvoiceId(e.target.value);
                    const inv = invoices.find(i => i.id === e.target.value);
                    if (inv) setPayAmount(String(inv.outstandingBalance));
                  }}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-800 dark:text-white outline-none"
                >
                  <option value="">Select an outstanding invoice</option>
                  {invoices.filter(i => i.outstandingBalance > 0).map(i => (
                    <option key={i.id} value={i.id}>
                      {i.invoiceNumber} - {i.customerName} (Bal: ₹{i.outstandingBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono font-bold text-slate-800 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-bold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Corporate Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-bold">UTR / Reference No *</label>
                  <input
                    type="text"
                    required
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="NEFT20268941"
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 font-mono text-slate-800 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRecordPayment(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E50914] text-white rounded-xl font-bold hover:bg-[#b00610] shadow"
                >
                  Record Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Quotation Modal */}
      {showAddQuote && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Quotation</h3>
              <button onClick={() => setShowAddQuote(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>

            <form onSubmit={handleSaveQuotation} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. RV College of Engineering"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-800 dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-bold">Training Site / Campus *</label>
                <select
                  required
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-2 text-slate-800 dark:text-white outline-none"
                >
                  <option value="">Select a training site</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Line items creator */}
              <div className="border border-slate-200 dark:border-zinc-800 p-3 rounded-xl space-y-2 bg-slate-50 dark:bg-zinc-900">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Add Item Line</span>
                <input
                  type="text"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Description (e.g. Python Bootcamp 40 hrs)"
                  className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded p-1.5 text-xs outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    placeholder="Qty / Hours"
                    className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded p-1.5 text-xs outline-none"
                  />
                  <input
                    type="number"
                    value={itemRate}
                    onChange={(e) => setItemRate(e.target.value)}
                    placeholder="Rate (₹)"
                    className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded p-1.5 text-xs outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="w-full bg-black dark:bg-white text-white dark:text-black py-1.5 rounded font-bold text-[11px]"
                >
                  + Add Item to Quote
                </button>
              </div>

              {lineItems.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Items Added ({lineItems.length})</span>
                  {lineItems.map((item, i) => (
                    <div key={i} className="flex justify-between bg-slate-100 dark:bg-zinc-800 p-2 rounded text-[11px]">
                      <span>{item.description} ({item.quantity} hrs)</span>
                      <span className="font-bold text-[#E50914]">₹{item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuote(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E50914] text-white rounded-xl font-bold hover:bg-[#b00610]"
                >
                  Save Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Finance;
