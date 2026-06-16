import { useSelector } from 'react-redux';
import StatusBadge from '../../components/shared/StatusBadge';
import { Calendar, Clock, Video, MapPin, ExternalLink } from 'lucide-react';

export default function InterviewSchedule() {
  const { user } = useSelector(state => state.auth);
  const { interviews } = useSelector(state => state.data);

  const myInterviews = interviews.filter(i => i.studentId === user.id);
  const upcoming = myInterviews.filter(i => i.status === 'Upcoming');
  const completed = myInterviews.filter(i => i.status === 'Completed');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Interview Schedule</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">Your upcoming and past interviews</p>
      </div>

      {/* Upcoming */}
      <div>
        <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
          <Calendar size={18} className="text-primary-500" /> Upcoming Interviews
        </h2>
        {upcoming.length === 0 ? (
          <div className="glass-card p-8 text-center text-surface-400">
            <Calendar size={40} className="mx-auto mb-2 opacity-30" />
            <p>No upcoming interviews</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {upcoming.map(interview => (
              <div key={interview.id} className="glass-card p-5 border-l-4 border-primary-500">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-white">{interview.company}</h3>
                    <p className="text-sm text-primary-500 font-medium">{interview.role}</p>
                  </div>
                  <StatusBadge status={interview.mode} />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                    <Calendar size={14} className="text-surface-400" />
                    <span>{interview.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                    <Clock size={14} className="text-surface-400" />
                    <span>{interview.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                    {interview.mode === 'Virtual' ? <Video size={14} className="text-surface-400" /> : <MapPin size={14} className="text-surface-400" />}
                    <span>{interview.mode === 'Virtual' ? 'Virtual Meeting' : 'On-Campus'}</span>
                  </div>
                </div>
                {interview.meetingLink && (
                  <a
                    href={interview.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 btn-primary w-full py-2.5 text-xs"
                  >
                    <ExternalLink size={14} /> Join Meeting
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Interviews Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <h2 className="font-bold text-surface-900 dark:text-white">All Interviews</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Mode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Link</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {myInterviews.map(i => (
                <tr key={i.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/30">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">{i.company}</p>
                    <p className="text-xs text-surface-400">{i.role}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-600 dark:text-surface-400">{i.date}</td>
                  <td className="px-4 py-3 text-sm text-surface-600 dark:text-surface-400">{i.time}</td>
                  <td className="px-4 py-3"><StatusBadge status={i.mode} /></td>
                  <td className="px-4 py-3">
                    {i.meetingLink ? (
                      <a href={i.meetingLink} target="_blank" rel="noreferrer" className="text-primary-500 hover:text-primary-600 text-sm flex items-center gap-1">
                        <ExternalLink size={13} /> Join
                      </a>
                    ) : (
                      <span className="text-xs text-surface-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
