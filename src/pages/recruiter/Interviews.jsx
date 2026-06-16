import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addInterview, updateApplicationStatus } from '../../store/slices/dataSlice';
import Modal from '../../components/shared/Modal';
import StatusBadge from '../../components/shared/StatusBadge';
import { students as allStudents, drives as allDrives } from '../../data/mockData';
import { Calendar, Plus, Clock, Video, MapPin, ExternalLink } from 'lucide-react';

export default function RecruiterInterviews() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { drives, applications, interviews } = useSelector(state => state.data);
  const [showSchedule, setShowSchedule] = useState(false);
  const [form, setForm] = useState({ applicationId: '', date: '', time: '', mode: 'Virtual', meetingLink: '' });

  const myDrives = drives.filter(d => d.recruiterId === user.id);
  const myDriveIds = myDrives.map(d => d.id);
  const myInterviews = interviews.filter(i => myDriveIds.includes(i.driveId));

  const schedulableApps = applications.filter(a =>
    myDriveIds.includes(a.driveId) && (a.status === 'Shortlisted' || a.status === 'Interview Scheduled')
  ).map(app => {
    const student = allStudents.find(s => s.id === app.studentId);
    const drive = allDrives.find(d => d.id === app.driveId);
    return { ...app, student, drive };
  });

  const handleSchedule = (e) => {
    e.preventDefault();
    const app = schedulableApps.find(a => a.id === parseInt(form.applicationId));
    if (!app) return;
    dispatch(addInterview({
      applicationId: app.id,
      studentId: app.studentId,
      driveId: app.driveId,
      company: app.drive?.companyName,
      role: app.drive?.role,
      date: form.date,
      time: form.time,
      mode: form.mode,
      meetingLink: form.meetingLink || null,
      status: 'Upcoming',
    }));
    dispatch(updateApplicationStatus({ id: app.id, status: 'Interview Scheduled' }));
    setShowSchedule(false);
    setForm({ applicationId: '', date: '', time: '', mode: 'Virtual', meetingLink: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Interview Scheduling</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Manage and schedule candidate interviews</p>
        </div>
        <button onClick={() => setShowSchedule(true)} className="btn-primary">
          <Plus size={16} /> Schedule Interview
        </button>
      </div>

      {/* Upcoming Interviews */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {myInterviews.map(interview => {
          const student = allStudents.find(s => s.id === interview.studentId);
          return (
            <div key={interview.id} className={`glass-card p-5 border-l-4 ${interview.status === 'Upcoming' ? 'border-primary-500' : 'border-emerald-500'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-surface-900 dark:text-white">{student?.name}</p>
                  <p className="text-xs text-surface-400">{student?.branch}</p>
                </div>
                <StatusBadge status={interview.status} />
              </div>
              <p className="text-sm text-primary-500 font-medium mt-2">{interview.role}</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                  <Calendar size={14} className="text-surface-400" /> {interview.date}
                </div>
                <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                  <Clock size={14} className="text-surface-400" /> {interview.time}
                </div>
                <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                  {interview.mode === 'Virtual' ? <Video size={14} className="text-surface-400" /> : <MapPin size={14} className="text-surface-400" />}
                  {interview.mode}
                </div>
              </div>
              {interview.meetingLink && (
                <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium">
                  <ExternalLink size={12} /> Meeting Link
                </a>
              )}
            </div>
          );
        })}
      </div>

      {myInterviews.length === 0 && (
        <div className="text-center py-16 text-surface-400 glass-card">
          <Calendar size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No interviews scheduled</p>
        </div>
      )}

      {/* Schedule Modal */}
      <Modal isOpen={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule Interview" size="md">
        <form onSubmit={handleSchedule} className="space-y-4">
          <div>
            <label className="input-label">Select Candidate *</label>
            <select value={form.applicationId} onChange={e => setForm({...form, applicationId: e.target.value})} className="input-field" required>
              <option value="">Choose a candidate...</option>
              {schedulableApps.map(a => (
                <option key={a.id} value={a.id}>{a.student?.name} — {a.drive?.role}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Date *</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Time *</label>
              <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="input-label">Mode *</label>
            <select value={form.mode} onChange={e => setForm({...form, mode: e.target.value})} className="input-field">
              <option value="Virtual">Virtual</option>
              <option value="On-Campus">On-Campus</option>
            </select>
          </div>
          {form.mode === 'Virtual' && (
            <div>
              <label className="input-label">Meeting Link</label>
              <input value={form.meetingLink} onChange={e => setForm({...form, meetingLink: e.target.value})} placeholder="https://meet.google.com/..." className="input-field" />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Schedule Interview</button>
            <button type="button" onClick={() => setShowSchedule(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
