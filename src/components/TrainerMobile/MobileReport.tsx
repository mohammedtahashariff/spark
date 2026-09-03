import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { BookOpen, CheckCircle, Clock, Users, ShieldAlert, Check, Plus } from 'lucide-react';

const MobileReport: React.FC = () => {
  const { currentUser, schedules, trainers, submitClassReport } = useDatabase();
  const todayStr = new Date().toISOString().split('T')[0];

  const trainer = trainers.find(t => t.email === currentUser?.email) || trainers[0];
  
  // Find completed classes that do not have a report filed yet
  const reportableClasses = schedules.filter(
    s => s.trainerId === trainer.id && !s.report
  );

  const availableReportClasses = reportableClasses.length > 0
    ? reportableClasses
    : schedules.filter(s => s.trainerId === trainer.id || s.status === 'Scheduled');

  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [forceShowForm, setForceShowForm] = useState(false);
  
  // Form State
  const [topic, setTopic] = useState('');
  const [hours, setHours] = useState('');
  const [students, setStudents] = useState('');
  const [issues, setIssues] = useState('');
  const [remarks, setRemarks] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (availableReportClasses.length > 0 && (!selectedScheduleId || !availableReportClasses.some(c => c.id === selectedScheduleId))) {
      setSelectedScheduleId(availableReportClasses[0].id);
    }
  }, [availableReportClasses, selectedScheduleId]);

  useEffect(() => {
    if (selectedScheduleId) {
      const cls = schedules.find(s => s.id === selectedScheduleId);
      if (cls) {
        setHours(cls.hours.toString());
        setTopic(cls.courseName);
      }
    }
  }, [selectedScheduleId, schedules]);

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId) return;

    if (!topic.trim() || !hours || !students) {
      setErrorMsg('Topic, hours, and student count are required.');
      return;
    }

    submitClassReport(selectedScheduleId, {
      scheduleId: selectedScheduleId,
      date: todayStr,
      topicCovered: topic.trim(),
      deliveredHours: Number(hours),
      studentCount: Number(students),
      issues: issues.trim() || 'No issues reported.',
      remarks: remarks.trim()
    });

    setSuccess(true);
    setErrorMsg('');
    setTimeout(() => {
      setSuccess(false);
      setForceShowForm(false);
      setSelectedScheduleId('');
      setTopic('');
      setHours('');
      setStudents('');
      setIssues('');
      setRemarks('');
    }, 2000);
  };

  if (reportableClasses.length === 0 && !success && !forceShowForm) {
    return (
      <div className="space-y-4 pb-8 text-white flex flex-col items-center justify-center text-center h-[500px]">
        <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500">
          <BookOpen size={28} />
        </div>
        <div>
          <p className="font-bold text-white">No Reports Pending</p>
          <p className="text-xs text-slate-400 max-w-[225px] mt-1">
            All your scheduled training sessions already have reports filed.
          </p>
        </div>
        <button
          onClick={() => {
            const fallbackId = availableReportClasses[0]?.id || '';
            setSelectedScheduleId(fallbackId);
            setForceShowForm(true);
          }}
          className="mt-2 px-5 py-2.5 bg-[#E50914] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/30 active:scale-95 transition"
        >
          <Plus size={14} /> Add Report
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8 text-white relative">
      <div className="flex justify-between items-center">
        <h2 className="text-md font-bold tracking-wide">Submit Training Report</h2>
        <button
          onClick={() => {
            const fallbackId = availableReportClasses[0]?.id || '';
            setSelectedScheduleId(fallbackId);
            setForceShowForm(true);
          }}
          className="bg-[#E50914] text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition"
        >
          <Plus size={12} /> Add Report
        </button>
      </div>

      {success ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-xl py-12">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/20">
            <CheckCircle size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Report Filed Successfully</h3>
            <p className="text-xs text-slate-400 mt-1">Class hours have been logged for payroll run.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitReport} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl text-xs text-slate-300">
          {errorMsg && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-400 p-2 rounded-lg font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Select Class</label>
            <select
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 outline-none focus:border-rose-600 text-white font-semibold"
            >
              {reportableClasses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.courseName} ({c.date})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Delivered Topic Details *</label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. OOP - Inheritance, class structures, super constructors"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-600 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                <Clock size={11} /> Duration (Hours) *
              </label>
              <input
                type="number"
                required
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-600 font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                <Users size={11} /> Student Count *
              </label>
              <input
                type="number"
                required
                value={students}
                onChange={(e) => setStudents(e.target.value)}
                placeholder="45"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-600 font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 text-slate-400">
              <ShieldAlert size={12} className="text-amber-500" /> Issues / Anomalies
            </label>
            <textarea
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              placeholder="e.g. Internet drop for 10 minutes (optional)"
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-600 resize-none font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">General Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Practical exercises finished successfully..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-rose-600 resize-none font-semibold"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 font-bold transition shadow-lg shadow-rose-900/10 flex items-center justify-center gap-1.5"
          >
            <Check size={14} /> Submit Training Report
          </button>
        </form>
      )}
    </div>
  );
};

export default MobileReport;
