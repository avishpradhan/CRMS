import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createStudentProfile, uploadResumeFile, logout } from '../../store/slices/authSlice';
import { User, Phone, BookOpen, Award, Wrench, FolderGit2, FileText, ArrowRight, ArrowLeft, CheckCircle, Upload, LogOut } from 'lucide-react';

export default function StudentProfileSetup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);

  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Initial Form State
  const [form, setForm] = useState({
    phone: '',
    universityRollNo: '',
    classRollNo: '',
    section: '',
    inviteCode: '',
    branch: 'CSE',
    semester: 1,
    cgpa: '',
    backlogs: 0,
    skills: '',
    projects: [{ title: '', description: '', tech: '', projectUrl: '' }],
    resumeUrl: '',
    placementStatus: 'Not Placed',
    campus: 'GEU Dehradun'
  });

  // Pre-populate invitation code from user document if available
  useEffect(() => {
    if (user && user.inviteCode) {
      setForm((prev) => ({ ...prev, inviteCode: user.inviteCode }));
    }
  }, [user]);

  const [selectedFile, setSelectedFile] = useState(null);

  // Input change handlers
  const handleChange = (e) => {
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
    updatedProjects[index][field] = value;
    setForm((prev) => ({ ...prev, projects: updatedProjects }));
  };

  const addProject = () => {
    setForm((prev) => ({
      ...prev,
      projects: [...prev.projects, { title: '', description: '', tech: '', projectUrl: '' }]
    }));
  };

  const removeProject = (index) => {
    if (form.projects.length === 1) return;
    const updatedProjects = form.projects.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, projects: updatedProjects }));
  };

  // File Upload Handler
  const handleFileChange = async (e) => {
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

    setSelectedFile(file);
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

  // Navigation handlers
  const nextStep = () => {
    setFormError('');
    if (step === 1) {
      if (!form.phone || !form.universityRollNo || !form.classRollNo || !form.section || !form.inviteCode) {
        setFormError('Please fill out all details, including a valid invitation code.');
        return;
      }
      if (!/^\+?[0-9]{10,15}$/.test(form.phone)) {
        setFormError('Please enter a valid phone number (10-15 digits).');
        return;
      }
    } else if (step === 2) {
      if (!form.branch || !form.semester || form.cgpa === '') {
        setFormError('Please fill out all academic fields.');
        return;
      }
    } else if (step === 3) {
      if (!form.skills.trim()) {
        setFormError('Please enter at least one skill.');
        return;
      }
      for (let i = 0; i < form.projects.length; i++) {
        const p = form.projects[i];
        if (!p.title.trim() || !p.description.trim() || !p.tech.trim()) {
          setFormError(`Please complete all fields for Project #${i + 1}.`);
          return;
        }
      }
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setFormError('');
    setStep((prev) => prev - 1);
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.resumeUrl) {
      setFormError('Please upload your resume PDF to complete the profile setup.');
      return;
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
      await dispatch(createStudentProfile(submissionData)).unwrap();
      navigate('/student/dashboard');
    } catch (err) {
      setFormError(err || 'Failed to create profile. Check inputs.');
    }
  };

  const handleSetupLater = () => {
    sessionStorage.setItem('bypass_profile_setup', 'true');
    navigate('/student/dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('bypass_profile_setup');
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <BookOpen className="text-primary-500" /> CRMS
          </h1>
          <p className="text-xs text-surface-500">Campus Recruitment Management System</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSetupLater}
            className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors animate-pulse-soft"
          >
            Setup Later
          </button>
          <div className="h-4 w-px bg-surface-200 dark:bg-surface-800" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-3xl mx-auto w-full glass-card p-6 sm:p-8 animate-fade-in relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-surface-200 dark:bg-surface-800">
          <div
            className="h-full gradient-primary transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Stepper Indicators */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 4 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${
                    step > s ? 'bg-emerald-500' : 'bg-surface-150 dark:bg-surface-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
            {step === 1 && 'Personal Information'}
            {step === 2 && 'Academic Record'}
            {step === 3 && 'Projects & Skills'}
            {step === 4 && 'Resume Attachment'}
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {step === 1 && 'Please configure your contact number and class identifier keys.'}
            {step === 2 && 'Specify your course streams, semester markers, and current CGPA standings.'}
            {step === 3 && 'List your coding skill tags and outline your engineering project highlights.'}
            {step === 4 && 'Attach your verified academic resume PDF to complete onboarding.'}
          </p>
        </div>

        {/* Error Notification */}
        {(formError || error) && (
          <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">
            {formError || error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4 animate-slide-in">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={user?.fullName || ''}
                    className="input-field bg-surface-100 dark:bg-surface-800 opacity-70 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="input-field bg-surface-100 dark:bg-surface-800 opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 text-surface-400" size={18} />
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g. +919876543210"
                      className="input-field pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label">University Roll Number</label>
                  <input
                    type="text"
                    name="universityRollNo"
                    value={form.universityRollNo}
                    onChange={handleChange}
                    placeholder="e.g. 2022CSE1001"
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Class Roll Number</label>
                  <input
                    type="text"
                    name="classRollNo"
                    value={form.classRollNo}
                    onChange={handleChange}
                    placeholder="e.g. CS-45"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Section</label>
                  <input
                    type="text"
                    name="section"
                    value={form.section}
                    onChange={handleChange}
                    placeholder="e.g. A, B, Section-1"
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Invitation Code * (e.g. GEU2327)</label>
                  <input
                    type="text"
                    name="inviteCode"
                    value={form.inviteCode}
                    onChange={handleChange}
                    placeholder="e.g. GEU2327"
                    className={`input-field uppercase ${user?.inviteCode ? 'bg-surface-100 dark:bg-surface-800 opacity-70 cursor-not-allowed' : ''}`}
                    required
                    disabled={!!user?.inviteCode}
                  />
                </div>
                <div>
                  <label className="input-label">Campus</label>
                  <select
                    name="campus"
                    value={form.campus}
                    onChange={handleChange}
                    className="input-field bg-transparent"
                    required
                  >
                    <option value="GEU Dehradun" className="dark:bg-surface-900">GEU Dehradun</option>
                    <option value="GEHU Dehradun" className="dark:bg-surface-900">GEHU Dehradun</option>
                    <option value="GEHU Bhimtal" className="dark:bg-surface-900">GEHU Bhimtal</option>
                    <option value="GEHU Haldwani" className="dark:bg-surface-900">GEHU Haldwani</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Academic Info */}
          {step === 2 && (
            <div className="space-y-4 animate-slide-in">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Branch</label>
                  <select
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    className="input-field bg-transparent"
                    required
                  >
                    <option value="CSE" className="dark:bg-surface-900">Computer Science (CSE)</option>
                    <option value="IT" className="dark:bg-surface-900">Information Technology (IT)</option>
                    <option value="ECE" className="dark:bg-surface-900">Electronics & Communication (ECE)</option>
                    <option value="EEE" className="dark:bg-surface-900">Electrical & Electronics (EEE)</option>
                    <option value="ME" className="dark:bg-surface-900">Mechanical Engineering (ME)</option>
                    <option value="CE" className="dark:bg-surface-900">Civil Engineering (CE)</option>
                    <option value="Other" className="dark:bg-surface-900">Other</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={form.semester}
                    onChange={(e) => handleNumberChange('semester', 1, 10, e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Current CGPA (0.0 - 10.0)</label>
                  <div className="relative">
                    <Award className="absolute left-3.5 top-3 text-surface-400" size={18} />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={form.cgpa}
                      onChange={(e) => handleFloatChange('cgpa', 0, 10, e.target.value)}
                      placeholder="e.g. 8.75"
                      className="input-field pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="input-label">Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    value={form.backlogs}
                    onChange={(e) => handleNumberChange('backlogs', 0, 99, e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Skills & Projects */}
          {step === 3 && (
            <div className="space-y-6 animate-slide-in">
              <div>
                <label className="input-label flex items-center gap-1.5">
                  <Wrench size={16} className="text-primary-500" /> Skills (Comma separated)
                </label>
                <input
                  type="text"
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  placeholder="e.g. React, Node.js, Python, MongoDB"
                  className="input-field"
                  required
                />
                <p className="text-[10px] text-surface-400 mt-1">
                  Type skills separated by commas to register your programming tags.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-surface-100 dark:border-surface-800 pb-2">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-white flex items-center gap-1.5">
                    <FolderGit2 size={16} className="text-primary-500" /> Projects (At least one)
                  </h3>
                  <button
                    type="button"
                    onClick={addProject}
                    className="text-xs text-primary-500 hover:text-primary-600 font-semibold transition-colors"
                  >
                    + Add Another Project
                  </button>
                </div>

                {form.projects.map((project, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-surface-150 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/20 relative space-y-3"
                  >
                    {form.projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProject(index)}
                        className="absolute top-3 right-3 text-xs text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                    <h4 className="text-xs font-bold text-surface-400">PROJECT #{index + 1}</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-surface-500 font-medium">Project Title</label>
                        <input
                          type="text"
                          value={project.title}
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
                          value={project.tech}
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
                        value={project.description}
                        onChange={(e) => handleProjectChange(index, 'description', e.target.value)}
                        placeholder="Describe the project goal and your implementations..."
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
              </div>
            </div>
          )}

          {/* STEP 4: Resume Attachment */}
          {step === 4 && (
            <div className="space-y-4 animate-slide-in">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">LinkedIn URL</label>
                  <input
                    type="text"
                    name="linkedinUrl"
                    value={form.linkedinUrl}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">GitHub URL</label>
                  <input
                    type="text"
                    name="githubUrl"
                    value={form.githubUrl}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Upload Resume (PDF only, max 5MB)</label>
                <div className="mt-1 border-2 border-dashed border-surface-200 dark:border-surface-800 hover:border-primary-500 dark:hover:border-primary-500 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer relative bg-surface-50/20 dark:bg-surface-900/10">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {uploading ? (
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin mx-auto" />
                      <p className="text-sm font-semibold text-surface-600 dark:text-surface-300">Uploading PDF Resume...</p>
                    </div>
                  ) : form.resumeUrl ? (
                    <div className="space-y-2">
                      <CheckCircle className="text-emerald-500 mx-auto" size={36} />
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Resume uploaded successfully!</p>
                      <p className="text-xs text-surface-400">{selectedFile ? selectedFile.name : 'resume.pdf'}</p>
                      <p className="text-xs text-primary-500 underline">Click or drag here to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="text-surface-400 mx-auto" size={32} />
                      <p className="text-sm font-semibold text-surface-600 dark:text-surface-300">Click or drag PDF file here</p>
                      <p className="text-xs text-surface-400">PDF documents up to 5MB are accepted</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-surface-100 dark:border-surface-800 pt-6 mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondary flex items-center gap-1 text-sm py-2"
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary flex items-center gap-1 text-sm py-2"
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || uploading}
                className="btn-primary flex items-center gap-1.5 text-sm py-2 px-6 shadow-lg shadow-primary-500/20"
              >
                {loading ? 'Submitting Details...' : 'Complete Profile Setup'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto w-full text-center text-[10px] text-surface-400 mt-8">
        &copy; {new Date().getFullYear()} CRMS Admin Portal. All rights reserved. Registered under University T&P Cell.
      </div>
    </div>
  );
}
