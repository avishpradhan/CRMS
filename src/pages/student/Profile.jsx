import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProfile, createStudentProfile, updateStudentProfile, uploadResumeFile, clearError } from '../../store/slices/authSlice';
import { User, Mail, Phone, BookOpen, Award, Wrench, FolderGit2, FileText, Save, Edit3, ShieldAlert, Hash, Landmark, Layers, Briefcase, Plus, Trash2 } from 'lucide-react';

const Github = (props) => (
  <svg
    viewBox="0 0 24 24"
    width={props.size || "18"}
    height={props.size || "18"}
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const Linkedin = (props) => (
  <svg
    viewBox="0 0 24 24"
    width={props.size || "18"}
    height={props.size || "18"}
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function StudentProfile() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);

  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    phone: '',
    universityRollNo: '',
    classRollNo: '',
    section: '',
    branch: 'CSE',
    semester: 1,
    cgpa: '',
    backlogs: 0,
    skills: '',
    projects: [],
    linkedinUrl: '',
    githubUrl: '',
    resumeUrl: '',
    placementStatus: 'Not Placed',
    campus: 'GEU Dehradun'
  });

  // Fetch profile on mount
  useEffect(() => {
    dispatch(fetchProfile());
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Sync form state when user changes (only when not editing)
  useEffect(() => {
    if (user && !editing) {
      setForm({
        phone: user.phone || '',
        universityRollNo: user.universityRollNo || '',
        classRollNo: user.classRollNo || '',
        section: user.section || '',
        branch: user.branch || 'CSE',
        semester: user.semester || 1,
        cgpa: user.cgpa || '',
        backlogs: user.backlogs || 0,
        skills: Array.isArray(user.skills) ? user.skills.join(', ') : '',
        projects: user.projects || [],
        linkedinUrl: user.linkedinUrl || '',
        githubUrl: user.githubUrl || '',
        resumeUrl: user.resumeUrl || '',
        placementStatus: user.placementStatus || 'Not Placed',
        campus: user.campus || 'GEU Dehradun'
      });
    }
  }, [user, editing]);

  // Form change handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name, min, max, value) => {
    let num = parseInt(value, 10);
    if (isNaN(num)) num = '';
    if (num !== '' && num < min) num = min;
    if (num !== '' && num > max) num = max;
    setForm((prev) => ({ ...prev, [name]: num }));
  };

  const handleFloatChange = (name, min, max, value) => {
    let num = parseFloat(value);
    if (isNaN(num)) num = '';
    if (num !== '' && num < min) num = min;
    if (num !== '' && num > max) num = max;
    setForm((prev) => ({ ...prev, [name]: num }));
  };

  // Projects handlers
  const handleProjectChange = (index, field, value) => {
    const updatedProjects = [...form.projects];
    updatedProjects[index] = { ...updatedProjects[index], [field]: value };
    setForm((prev) => ({ ...prev, projects: updatedProjects }));
  };

  const addProject = () => {
    setForm((prev) => ({
      ...prev,
      projects: [...prev.projects, { title: '', description: '', tech: '', projectUrl: '' }]
    }));
  };

  const removeProject = (index) => {
    const updatedProjects = form.projects.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, projects: updatedProjects }));
  };

  // Resume PDF Reupload Handler
  const handleResumeReupload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setFormError('Only PDF files are allowed!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('File size must be less than 5MB!');
      return;
    }

    setFormError('');
    setUploading(true);

    try {
      const result = await dispatch(uploadResumeFile(file)).unwrap();
      setForm((prev) => ({ ...prev, resumeUrl: result.resumeUrl }));
    } catch (err) {
      setFormError(err || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  // Save changes
  const handleSave = async () => {
    setFormError('');
    if (!form.phone || !form.universityRollNo || !form.classRollNo || !form.section || form.cgpa === '') {
      setFormError('Please fill out all required personal, roll numbers, section, and CGPA details.');
      return;
    }

    if (!form.skills.trim()) {
      setFormError('Please enter at least one skill.');
      return;
    }

    // Validate projects
    for (let i = 0; i < form.projects.length; i++) {
      const p = form.projects[i];
      if (!p.title.trim() || !p.description.trim() || !p.tech.trim()) {
        setFormError(`Please complete all fields for Project #${i + 1}.`);
        return;
      }
    }

    // Process skills into array
    const skillsArray = form.skills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const submissionData = {
      ...form,
      skills: skillsArray,
    };

    try {
      if (user && user.hasProfile) {
        await dispatch(updateStudentProfile(submissionData)).unwrap();
      } else {
        await dispatch(createStudentProfile(submissionData)).unwrap();
      }
      setEditing(false);
    } catch (err) {
      setFormError(err || 'Failed to save profile.');
    }
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-3 border-b border-surface-100 dark:border-surface-800 last:border-0">
      <Icon size={18} className="text-primary-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-surface-400 font-medium">{label}</p>
        <p className="text-sm font-medium text-surface-900 dark:text-white mt-0.5 break-words">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">My Profile</h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">Manage and update your placement portfolio details</p>
        </div>
        <button
          onClick={() => {
            if (editing) {
              handleSave();
            } else {
              setEditing(true);
            }
          }}
          disabled={loading || uploading}
          className="btn-primary flex items-center gap-1.5 py-2 px-4 shadow-md transition-all"
        >
          {editing ? (
            <>
              <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
            </>
          ) : (
            <>
              <Edit3 size={16} /> Edit Profile
            </>
          )}
        </button>
      </div>

      {/* Error Notification */}
      {(formError || error) && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium flex items-center gap-2">
          <ShieldAlert size={18} />
          <span>{formError || error}</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center text-white text-3xl font-bold">
            {user?.fullName?.charAt(0) || user?.name?.charAt(0) || 'S'}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-surface-900 dark:text-white">
              {user?.fullName || user?.name || 'Student Name'}
            </h2>
            <p className="text-surface-500 dark:text-surface-400">{user?.email}</p>
            <p className="text-sm text-primary-500 font-medium mt-1">
              Branch: {user?.branch || 'Not Configured'} • CGPA: {user?.cgpa || '0.00'} • Backlogs: {user?.backlogs ?? '0'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Personal & Academic Information */}
        <div className="glass-card p-5 h-fit">
          <h3 className="font-bold text-surface-900 dark:text-white mb-3">Academic & Contact Information</h3>
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label text-xs">Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    className="input-field text-sm py-2"
                  />
                </div>
                <div>
                  <label className="input-label text-xs">Section</label>
                  <input
                    name="section"
                    value={form.section}
                    onChange={handleInputChange}
                    className="input-field text-sm py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label text-xs">University Roll No</label>
                  <input
                    name="universityRollNo"
                    value={form.universityRollNo}
                    onChange={handleInputChange}
                    className="input-field text-sm py-2"
                  />
                </div>
                <div>
                  <label className="input-label text-xs">Class Roll No</label>
                  <input
                    name="classRollNo"
                    value={form.classRollNo}
                    onChange={handleInputChange}
                    className="input-field text-sm py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label text-xs">Branch</label>
                  <select
                    name="branch"
                    value={form.branch}
                    onChange={handleInputChange}
                    className="input-field text-sm py-2 bg-transparent"
                  >
                    <option value="CSE" className="dark:bg-surface-900">CSE</option>
                    <option value="IT" className="dark:bg-surface-900">IT</option>
                    <option value="ECE" className="dark:bg-surface-900">ECE</option>
                    <option value="EEE" className="dark:bg-surface-900">EEE</option>
                    <option value="ME" className="dark:bg-surface-900">ME</option>
                    <option value="CE" className="dark:bg-surface-900">CE</option>
                    <option value="Other" className="dark:bg-surface-900">Other</option>
                  </select>
                </div>
                <div>
                  <label className="input-label text-xs">Semester</label>
                  <input
                    type="number"
                    value={form.semester}
                    onChange={(e) => handleNumberChange('semester', 1, 10, e.target.value)}
                    className="input-field text-sm py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label text-xs">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.cgpa}
                    onChange={(e) => handleFloatChange('cgpa', 0, 10, e.target.value)}
                    className="input-field text-sm py-2"
                  />
                </div>
                <div>
                  <label className="input-label text-xs">Backlogs</label>
                  <input
                    type="number"
                    value={form.backlogs}
                    onChange={(e) => handleNumberChange('backlogs', 0, 99, e.target.value)}
                    className="input-field text-sm py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label text-xs">Placement Status</label>
                  <select
                    name="placementStatus"
                    value={form.placementStatus}
                    onChange={handleInputChange}
                    className="input-field text-sm py-2 bg-transparent"
                  >
                    <option value="Not Placed" className="dark:bg-surface-900">Not Placed</option>
                    <option value="Placed" className="dark:bg-surface-900">Placed</option>
                  </select>
                </div>
                <div>
                  <label className="input-label text-xs">Campus</label>
                  <select
                    name="campus"
                    value={form.campus}
                    onChange={handleInputChange}
                    className="input-field text-sm py-2 bg-transparent"
                  >
                    <option value="GEU Dehradun" className="dark:bg-surface-900">GEU Dehradun</option>
                    <option value="GEHU Dehradun" className="dark:bg-surface-900">GEHU Dehradun</option>
                    <option value="GEHU Bhimtal" className="dark:bg-surface-900">GEHU Bhimtal</option>
                    <option value="GEHU Haldwani" className="dark:bg-surface-900">GEHU Haldwani</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label text-xs">Academic Batch</label>
                  <input
                    value={user?.batchId?.batchName || user?.batch || '—'}
                    disabled
                    className="input-field text-sm py-2 bg-surface-100 dark:bg-surface-800 opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="input-label text-xs">LinkedIn Profile URL</label>
                  <input
                    name="linkedinUrl"
                    value={form.linkedinUrl}
                    onChange={handleInputChange}
                    className="input-field text-sm py-2"
                  />
                </div>
                <div>
                  <label className="input-label text-xs">GitHub Profile URL</label>
                  <input
                    name="githubUrl"
                    value={form.githubUrl}
                    onChange={handleInputChange}
                    className="input-field text-sm py-2"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <InfoRow icon={User} label="Full Name" value={user?.fullName || user?.name} />
              <InfoRow icon={Mail} label="Email Address" value={user?.email} />
              <InfoRow icon={Phone} label="Phone Number" value={user?.phone} />
              <InfoRow icon={Layers} label="Academic Batch" value={user?.batchId?.batchName || user?.batch} />
              <InfoRow icon={Landmark} label="Campus" value={user?.campus} />
              <InfoRow icon={Hash} label="University Roll Number" value={user?.universityRollNo} />
              <InfoRow icon={Landmark} label="Class Roll Number" value={user?.classRollNo} />
              <InfoRow icon={Layers} label="Section" value={user?.section} />
              <InfoRow icon={BookOpen} label="Branch" value={user?.branch} />
              <InfoRow icon={Award} label="CGPA" value={user?.cgpa} />
              <InfoRow icon={Hash} label="Backlogs Count" value={user?.backlogs} />
              <InfoRow icon={Briefcase} label="Placement Status" value={user?.placementStatus} />
              <InfoRow icon={Linkedin} label="LinkedIn Profile" value={user?.linkedinUrl} />
              <InfoRow icon={Github} label="GitHub Profile" value={user?.githubUrl} />
            </div>
          )}
        </div>

        {/* Skills, Projects & Resume details */}
        <div className="space-y-6">
          {/* Skills Section */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
              <Wrench size={16} className="text-primary-500" /> Skills
            </h3>
            {editing ? (
              <div>
                <label className="input-label text-xs">Skills (Comma separated)</label>
                <input
                  name="skills"
                  value={form.skills}
                  onChange={handleInputChange}
                  placeholder="e.g. React, Node.js, Python"
                  className="input-field text-sm py-2"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user?.skills && user.skills.length > 0 ? (
                  user.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-lg"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-surface-400">No skills registered.</p>
                )}
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3 pb-1 border-b border-surface-50 dark:border-surface-800">
              <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2">
                <FolderGit2 size={16} className="text-primary-500" /> Projects
              </h3>
              {editing && (
                <button
                  type="button"
                  onClick={addProject}
                  className="text-xs text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-0.5"
                >
                  <Plus size={14} /> Add Project
                </button>
              )}
            </div>
            
            {editing ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {form.projects.map((project, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl border border-surface-150 dark:border-surface-800 bg-surface-50/30 relative space-y-2"
                  >
                    <button
                      type="button"
                      onClick={() => removeProject(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-surface-400 font-medium">Title</label>
                        <input
                          type="text"
                          value={project.title || ''}
                          onChange={(e) => handleProjectChange(index, 'title', e.target.value)}
                          className="input-field text-xs py-1.5 mt-0.5"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-surface-400 font-medium">Tech</label>
                        <input
                          type="text"
                          value={project.tech || ''}
                          onChange={(e) => handleProjectChange(index, 'tech', e.target.value)}
                          className="input-field text-xs py-1.5 mt-0.5"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-surface-400 font-medium">Description</label>
                      <textarea
                        rows="2"
                        value={project.description || ''}
                        onChange={(e) => handleProjectChange(index, 'description', e.target.value)}
                        className="input-field text-xs py-1.5 mt-0.5 resize-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-surface-400 font-medium">Live Project URL (Optional)</label>
                      <input
                        type="url"
                        value={project.projectUrl || ''}
                        onChange={(e) => handleProjectChange(index, 'projectUrl', e.target.value)}
                        className="input-field text-xs py-1.5 mt-0.5"
                        placeholder="e.g. https://myproject.com"
                      />
                    </div>
                  </div>
                ))}
                {form.projects.length === 0 && (
                  <p className="text-xs text-center text-surface-400 py-3">No projects added. Click "Add Project".</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {user?.projects && user.projects.length > 0 ? (
                  user.projects.map((project, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700"
                    >
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">{project.title}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{project.description}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs text-primary-500 font-medium bg-primary-500/5 px-2.5 py-1 rounded-md w-fit">{project.tech}</span>
                        {project.projectUrl && (
                          <a
                            href={project.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent-500 hover:underline font-medium bg-accent-500/5 px-2.5 py-1 rounded-md w-fit"
                          >
                            Live Demo
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-surface-400">No projects listed.</p>
                )}
              </div>
            )}
          </div>

          {/* Resume Section */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText size={16} className="text-primary-500" /> Resume
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700">
              <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center shrink-0">
                <FileText size={18} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                  {user?.resumeUrl ? user.resumeUrl.split('/').pop() : 'No Resume Uploaded'}
                </p>
                <p className="text-xs text-surface-400">PDF Document</p>
              </div>
              
              <div className="flex items-center gap-2">
                {user?.resumeUrl && (
                  <a
                    href={user.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    View
                  </a>
                )}
                
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeReupload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                  >
                    {uploading ? 'Uploading...' : 'Reupload'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
