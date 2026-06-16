import { useState, useEffect } from 'react';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { UserCheck, Calendar, Mail, FileText } from 'lucide-react';

export default function Shortlisted() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for the Contact / Offer Letter Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const token = localStorage.getItem('crms_token');

  const fetchShortlisted = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/applications/recruiter', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch shortlisted candidates');
      }

      // Map backend data to UI shape
      const mapped = (data.data || []).map(app => {
        const profile = app.studentProfileId || {};
        const userObj = profile.userId || {};
        return {
          id: app._id,
          status: app.status,
          drive: {
            role: app.driveId?.role || 'Unknown Role',
            companyName: app.driveId?.companyName || 'Our Company',
          },
          student: {
            name: userObj.fullName || 'Unknown Student',
            email: userObj.email || '',
            branch: profile.branch || 'Not Profiled',
            cgpa: profile.cgpa != null ? profile.cgpa : '—',
            skills: profile.skills || [],
            resume: profile.resumeUrl || '',
          }
        };
      });

      // Filter and Group to show ONLY selected (placed) candidates, grouped by student email
      const grouped = [];
      const studentMap = {};

      mapped.forEach(app => {
        if (app.status === 'Selected') {
          const email = app.student.email;
          if (!studentMap[email]) {
            studentMap[email] = {
              id: app.id,
              status: app.status,
              student: app.student,
              drives: [{ role: app.drive.role, companyName: app.drive.companyName, id: app.id }],
            };
            grouped.push(studentMap[email]);
          } else {
            // Avoid duplicate roles for the same candidate under the same drive
            const alreadyAdded = studentMap[email].drives.some(d => d.role === app.drive.role && d.companyName === app.drive.companyName);
            if (!alreadyAdded) {
              studentMap[email].drives.push({ role: app.drive.role, companyName: app.drive.companyName, id: app.id });
            }
          }
        }
      });

      setCandidates(grouped);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlisted();
  }, []);

  const handleOpenContactModal = (candidate) => {
    setSelectedCandidate(candidate);
    const rolesList = candidate.drives.map(d => d.role).join(', ');
    const firstCompany = candidate.drives[0]?.companyName || 'Our Company';
    
    setEmailSubject(`Job Offer: ${rolesList} at ${firstCompany}`);
    
    const rolesDetail = candidate.drives.map(d => `- ${d.role} (${d.companyName})`).join('\n');
    
    setEmailBody(`Dear ${candidate.student?.name || 'Candidate'},\n\nWe are pleased to offer you the position(s) at ${firstCompany}!\n\nWe were highly impressed by your qualifications and performance throughout the recruitment process. We believe your skills and experience will be a great asset to our team.\n\nPlease find the details of the offer(s) below:\n${rolesDetail}\n\nTo accept this offer, please reply to this email or contact us at your earliest convenience.\n\nWe look forward to welcoming you to the team!\n\nBest regards,\n${firstCompany} Recruitment Team`);
    setIsContactModalOpen(true);
  };

  const handleSendEmail = () => {
    if (!selectedCandidate) return;
    const mailtoUrl = `mailto:${selectedCandidate.student.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl);
    setIsContactModalOpen(false);
  };

  if (loading && candidates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-surface-400 text-sm">Loading selected candidates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Selected Candidates</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">{candidates.length} final selected candidates</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {candidates.map(app => (
          <div key={app.id} className="glass-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shrink-0">
                  {app.student?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-surface-900 dark:text-white truncate">{app.student?.name}</p>
                  <p className="text-xs text-surface-400">{app.student?.branch} • CGPA: {app.student?.cgpa}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>

              <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
                <p className="text-xs text-surface-400">Selected for</p>
                <div className="space-y-1 mt-1">
                  {app.drives.map((d, index) => (
                    <p key={index} className="text-sm font-medium text-primary-500">
                      {d.role} <span className="text-xs text-surface-400 font-normal">({d.companyName})</span>
                    </p>
                  ))}
                </div>
              </div>

              {app.student?.skills && app.student?.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {app.student.skills.slice(0, 4).map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 text-[10px] font-medium rounded-md">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4 pt-2">
              <button 
                onClick={() => handleOpenContactModal(app)}
                className="btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1"
              >
                <Mail size={13} /> Contact
              </button>
              {app.student.resume && (
                <button 
                  onClick={() => window.open(app.student.resume, '_blank')}
                  className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1"
                  title="View Resume"
                >
                  <FileText size={13} /> Resume
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {candidates.length === 0 && (
        <div className="text-center py-16 text-surface-400 glass-card">
          <UserCheck size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No selected candidates</p>
        </div>
      )}

      {/* Offer Letter / Contact Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Send Offer Letter / Contact Candidate"
        size="lg"
      >
        {selectedCandidate && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1">To</label>
              <input
                type="text"
                value={selectedCandidate.student?.email}
                disabled
                className="w-full px-3 py-2 border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 rounded-lg text-sm text-surface-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1">Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-lg text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1">Email Body</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 rounded-lg text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans resize-y"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5"
              >
                <Mail size={16} /> Open Mail Client
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
