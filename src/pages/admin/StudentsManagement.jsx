import { useState, useEffect } from 'react';
import DataTable from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import Modal from '../../components/shared/Modal';
import { Eye, Edit3, Trash2, GraduationCap, Save } from 'lucide-react';

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'Other'];
const PLACEMENT_STATUSES = ['Not Placed', 'Placed'];
const CAMPUSES = ['GEU Dehradun', 'GEHU Dehradun', 'GEHU Bhimtal', 'GEHU Haldwani'];

export default function StudentsManagement() {
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    branch: 'CSE',
    cgpa: 0,
    placementStatus: 'Not Placed',
    backlogs: 0,
    batch: '',
    campus: 'GEU Dehradun',
    phone: '',
    universityRollNo: '',
    classRollNo: '',
    section: '',
    semester: 1,
    skills: '',
    projects: [],
    linkedinUrl: '',
    githubUrl: '',
    resumeUrl: '',
  });

  const token = localStorage.getItem('crms_token');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch students');
      }

      // Map DB schema to component's expected data shape
      const mapped = data.data.map(s => ({
        ...s,
        id: s.userId._id, // Use userId as unique ID for editing/deleting
        name: s.userId.fullName,
        email: s.userId.email,
        registeredAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A',
      }));
      setStudentList(mapped);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/admin/batches', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setBatches(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch batches for filtering:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchBatches();
  }, []);

  const handleEditClick = (student) => {
    setEditStudent(student);
    setEditForm({
      fullName: student.name || '',
      email: student.email || '',
      branch: student.branch === 'Not Profiled' ? 'CSE' : student.branch,
      cgpa: student.cgpa || 0,
      placementStatus: student.placementStatus || 'Not Placed',
      backlogs: student.backlogs || 0,
      batch: student.batch || '',
      campus: student.campus || 'GEU Dehradun',
      phone: student.phone || '',
      universityRollNo: student.universityRollNo || '',
      classRollNo: student.classRollNo || '',
      section: student.section || '',
      semester: student.semester || 1,
      skills: Array.isArray(student.skills) ? student.skills.join(', ') : '',
      projects: student.projects || [],
      linkedinUrl: student.linkedinUrl || '',
      githubUrl: student.githubUrl || '',
      resumeUrl: student.resumeUrl || '',
    });
  };

  const handleProjectChange = (index, field, value) => {
    const updated = [...editForm.projects];
    updated[index] = { ...updated[index], [field]: value };
    setEditForm(prev => ({ ...prev, projects: updated }));
  };

  const addProject = () => {
    setEditForm(prev => ({
      ...prev,
      projects: [...prev.projects, { title: '', description: '', tech: '', projectUrl: '' }]
    }));
  };

  const removeProject = (index) => {
    const updated = editForm.projects.filter((_, i) => i !== index);
    setEditForm(prev => ({ ...prev, projects: updated }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = editForm.skills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const submissionData = {
        ...editForm,
        skills: skillsArray,
      };

      const res = await fetch(`/api/admin/students/${editStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submissionData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update student');
      }

      alert('Student updated successfully!');
      setEditStudent(null);
      fetchStudents(); // Refresh list
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteClick = async (student) => {
    if (!window.confirm(`Are you sure you want to delete student "${student.name}"? This will delete their account and profile permanently.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete student');
      }

      alert('Student deleted successfully!');
      fetchStudents(); // Refresh list
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {row.name ? row.name.charAt(0) : 'U'}
        </div>
        <div>
          <p className="font-semibold text-surface-900 dark:text-white text-sm">{row.name}</p>
          <p className="text-[11px] text-surface-400">{row.email}</p>
          {row.universityRollNo && (
            <p className="text-[10px] font-medium text-primary-500 dark:text-primary-400 mt-0.5">
              Roll No: {row.universityRollNo}
            </p>
          )}
        </div>
      </div>
    )},
    { header: 'Branch', accessor: 'branch' },
    { header: 'Campus', accessor: 'campus' },
    { header: 'CGPA', accessor: 'cgpa', render: (row) => (
      <span className="font-semibold text-surface-900 dark:text-white">{row.cgpa != null ? row.cgpa : '—'}</span>
    )},
    { header: 'Status', accessor: 'placementStatus', render: (row) => <StatusBadge status={row.placementStatus} /> },
  ];

  const filteredStudents = studentList.filter(s => {
    const matchBatch = selectedBatch ? s.batch === selectedBatch : true;
    const matchCampus = selectedCampus ? s.campus === selectedCampus : true;
    return matchBatch && matchCampus;
  });

  if (loading && studentList.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-surface-400 text-sm">Loading students...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Students Management</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">{filteredStudents.length} registered students</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-white dark:bg-surface-900 rounded-xl border border-surface-150 dark:border-surface-800">
        <div className="flex flex-wrap items-center gap-6 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">Filter by Batch:</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="input-field py-1.5 px-3 text-sm max-w-xs bg-transparent"
            >
              <option value="" className="dark:bg-surface-900">All Batches</option>
              {batches.map((b) => {
                const canonical = b.canonicalBatch || `${b.startYear}-${b.endYear}`;
                return (
                  <option key={b._id} value={canonical} className="dark:bg-surface-900">
                    {b.batchName} ({canonical})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-surface-700 dark:text-surface-300">Filter by Campus:</label>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="input-field py-1.5 px-3 text-sm max-w-xs bg-transparent"
            >
              <option value="" className="dark:bg-surface-900">All Campuses</option>
              {CAMPUSES.map((c) => (
                <option key={c} value={c} className="dark:bg-surface-900">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredStudents}
        extraSearchKeys={['email', 'universityRollNo']}
        searchPlaceholder="Search students..."
        actions={(row) => (
          <>
            <button onClick={() => setSelectedStudent(row)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors" title="View">
              <Eye size={15} className="text-surface-500" />
            </button>
            <button onClick={() => handleEditClick(row)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors" title="Edit">
              <Edit3 size={15} className="text-primary-500" />
            </button>
            <button onClick={() => handleDeleteClick(row)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors" title="Delete">
              <Trash2 size={15} className="text-red-500" />
            </button>
          </>
        )}
      />

      {/* View Details Modal */}
      <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} title="Student Details" size="lg">
        {selectedStudent && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            <div className="flex items-center gap-4 border-b border-surface-100 dark:border-surface-700 pb-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xl font-bold shrink-0">
                {selectedStudent.name ? selectedStudent.name.charAt(0) : 'U'}
              </div>
              <div>
                <p className="text-lg font-bold text-surface-900 dark:text-white">{selectedStudent.name}</p>
                <p className="text-sm text-surface-500">{selectedStudent.email}</p>
                <div className="mt-1">
                  <StatusBadge status={selectedStudent.placementStatus} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Academic & Contact Information</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Branch', value: selectedStudent.branch },
                  { label: 'Campus', value: selectedStudent.campus || '—' },
                  { label: 'Batch', value: selectedStudent.batch || '—' },
                  { label: 'Semester', value: selectedStudent.semester || '—' },
                  { label: 'Section', value: selectedStudent.section || '—' },
                  { label: 'CGPA', value: selectedStudent.cgpa ?? '—' },
                  { label: 'Backlogs', value: selectedStudent.backlogs ?? 0 },
                  { label: 'University Roll No', value: selectedStudent.universityRollNo || '—' },
                  { label: 'Class Roll No', value: selectedStudent.classRollNo || '—' },
                  { label: 'Phone', value: selectedStudent.phone || '—' },
                  { label: 'Registered On', value: selectedStudent.registeredAt },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/30 border border-surface-100 dark:border-surface-700/50">
                    <p className="text-xs text-surface-400">{item.label}</p>
                    <p className="font-semibold text-surface-900 dark:text-white text-sm mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Profiles & Attachments</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/30 border border-surface-100 dark:border-surface-700/50 flex flex-col justify-between">
                  <p className="text-xs text-surface-400">LinkedIn Profile</p>
                  {selectedStudent.linkedinUrl ? (
                    <a href={selectedStudent.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-500 hover:underline font-semibold mt-1 truncate block">
                      {selectedStudent.linkedinUrl}
                    </a>
                  ) : (
                    <p className="text-xs text-surface-400 italic mt-1">Not Provided</p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/30 border border-surface-100 dark:border-surface-700/50 flex flex-col justify-between">
                  <p className="text-xs text-surface-400">GitHub Profile</p>
                  {selectedStudent.githubUrl ? (
                    <a href={selectedStudent.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-500 hover:underline font-semibold mt-1 truncate block">
                      {selectedStudent.githubUrl}
                    </a>
                  ) : (
                    <p className="text-xs text-surface-400 italic mt-1">Not Provided</p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/30 border border-surface-100 dark:border-surface-700/50 flex flex-col justify-between">
                  <p className="text-xs text-surface-400">Resume PDF</p>
                  {selectedStudent.resumeUrl ? (
                    <a href={selectedStudent.resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-500 hover:underline font-semibold mt-1 truncate block">
                      View Resume Document
                    </a>
                  ) : (
                    <p className="text-xs text-surface-400 italic mt-1">No Resume Uploaded</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Registered Skills</h4>
              {selectedStudent.skills && selectedStudent.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.skills.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-surface-400 italic">No skills listed</p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Project Showcases</h4>
              {selectedStudent.projects && selectedStudent.projects.length > 0 ? (
                <div className="space-y-3">
                  {selectedStudent.projects.map((proj, i) => (
                    <div key={i} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700/30 border border-surface-100 dark:border-surface-700/50">
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">{proj.title || 'Untitled Project'}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{proj.description || 'No description provided.'}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {proj.tech && (
                          <p className="text-[10px] text-primary-500 font-semibold bg-primary-500/5 px-2 py-0.5 rounded w-fit">
                            {proj.tech}
                          </p>
                        )}
                        {proj.projectUrl && (
                          <a
                            href={proj.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-accent-500 hover:underline font-semibold bg-accent-500/5 px-2 py-0.5 rounded w-fit"
                          >
                            Live Demo
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-surface-400 italic">No projects listed</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={!!editStudent} onClose={() => setEditStudent(null)} title="Edit Student Profile" size="lg">
        {editStudent && (
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
              {/* Section 1: Account Info */}
              <div>
                <h4 className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-3 pb-1 border-b border-surface-100 dark:border-surface-700">Account Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Full Name *</label>
                    <input
                      type="text"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Email *</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact & Roll Identifiers */}
              <div>
                <h4 className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-3 pb-1 border-b border-surface-100 dark:border-surface-700">Contact & Roll Numbers</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="input-label">Phone *</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Section *</label>
                    <input
                      type="text"
                      value={editForm.section}
                      onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Semester *</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editForm.semester}
                      onChange={(e) => setEditForm({ ...editForm, semester: parseInt(e.target.value) || 1 })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="input-label">University Roll No *</label>
                    <input
                      type="text"
                      value={editForm.universityRollNo}
                      onChange={(e) => setEditForm({ ...editForm, universityRollNo: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="input-label">Class Roll No *</label>
                    <input
                      type="text"
                      value={editForm.classRollNo}
                      onChange={(e) => setEditForm({ ...editForm, classRollNo: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Academic Record */}
              <div>
                <h4 className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-3 pb-1 border-b border-surface-100 dark:border-surface-700">Academic & Placement Profile</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="input-label">Branch *</label>
                    <select
                      value={editForm.branch}
                      onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                      className="input-field bg-transparent"
                      required
                    >
                      {BRANCHES.map(b => (
                        <option key={b} value={b} className="dark:bg-surface-900">{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">CGPA *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={editForm.cgpa}
                      onChange={(e) => setEditForm({ ...editForm, cgpa: parseFloat(e.target.value) || 0 })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Backlogs *</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.backlogs}
                      onChange={(e) => setEditForm({ ...editForm, backlogs: parseInt(e.target.value) || 0 })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Batch (e.g. 2023-2027)</label>
                    <input
                      type="text"
                      placeholder="2023-2027"
                      value={editForm.batch}
                      onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="input-label">Campus *</label>
                    <select
                      value={editForm.campus}
                      onChange={(e) => setEditForm({ ...editForm, campus: e.target.value })}
                      className="input-field bg-transparent"
                      required
                    >
                      {CAMPUSES.map(c => (
                        <option key={c} value={c} className="dark:bg-surface-900">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Placement Status *</label>
                    <select
                      value={editForm.placementStatus}
                      onChange={(e) => setEditForm({ ...editForm, placementStatus: e.target.value })}
                      className="input-field bg-transparent"
                      required
                    >
                      {PLACEMENT_STATUSES.map(s => (
                        <option key={s} value={s} className="dark:bg-surface-900">{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 4: Web Profiles & Resume */}
              <div>
                <h4 className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-3 pb-1 border-b border-surface-100 dark:border-surface-700">Web Profiles & Skills</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">LinkedIn URL</label>
                      <input
                        type="text"
                        value={editForm.linkedinUrl}
                        onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="input-label">GitHub URL</label>
                      <input
                        type="text"
                        value={editForm.githubUrl}
                        onChange={(e) => setEditForm({ ...editForm, githubUrl: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Resume PDF Link</label>
                    <input
                      type="text"
                      value={editForm.resumeUrl}
                      onChange={(e) => setEditForm({ ...editForm, resumeUrl: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="input-label">Skills (Comma separated)</label>
                    <input
                      type="text"
                      value={editForm.skills}
                      onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                      placeholder="React, Node.js, Python"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Projects */}
              <div>
                <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-700 pb-2 mb-3">
                  <h4 className="text-xs font-bold text-primary-500 uppercase tracking-wider">Project Showcases</h4>
                  <button
                    type="button"
                    onClick={addProject}
                    className="text-xs text-primary-500 hover:text-primary-600 font-semibold"
                  >
                    + Add Project
                  </button>
                </div>
                
                <div className="space-y-4">
                  {editForm.projects.map((project, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl border border-surface-150 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/10 relative space-y-3"
                    >
                      <button
                        type="button"
                        onClick={() => removeProject(index)}
                        className="absolute top-3 right-3 text-xs text-red-500 hover:text-red-600 font-semibold"
                      >
                        Remove
                      </button>
                      <h5 className="text-[10px] font-bold text-surface-400 uppercase">Project #{index + 1}</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-surface-500 font-medium">Project Title</label>
                          <input
                            type="text"
                            value={project.title || ''}
                            onChange={(e) => handleProjectChange(index, 'title', e.target.value)}
                            placeholder="e.g. E-Commerce Platform"
                            className="input-field py-2 text-sm mt-0.5"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-surface-500 font-medium">Technologies Used</label>
                          <input
                            type="text"
                            value={project.tech || ''}
                            onChange={(e) => handleProjectChange(index, 'tech', e.target.value)}
                            placeholder="e.g. React, Node.js, Express"
                            className="input-field py-2 text-sm mt-0.5"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-surface-500 font-medium">Project Description</label>
                        <textarea
                          rows="2"
                          value={project.description || ''}
                          onChange={(e) => handleProjectChange(index, 'description', e.target.value)}
                          placeholder="Describe project details..."
                          className="input-field text-sm mt-0.5 resize-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-surface-500 font-medium">Live Project URL (Optional)</label>
                        <input
                          type="url"
                          value={project.projectUrl || ''}
                          onChange={(e) => handleProjectChange(index, 'projectUrl', e.target.value)}
                          placeholder="e.g. https://myproject.com"
                          className="input-field py-2 text-sm mt-0.5"
                        />
                      </div>
                    </div>
                  ))}
                  {editForm.projects.length === 0 && (
                    <p className="text-xs text-surface-400 italic text-center py-2">No projects configured for this student.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">
                <Save size={16} /> Save Changes
              </button>
              <button type="button" onClick={() => setEditStudent(null)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
