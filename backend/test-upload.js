// Automated verification script for PDF Resume Upload and academic details
const AUTH_BASE = 'http://localhost:5000/api/auth';
const PROFILE_BASE = 'http://localhost:5000/api/student/profile';

async function testUploadAndDetails() {
  console.log('=== STARTING PROFILE DETAILS & UPLOAD VERIFICATION ===');
  const timestamp = Date.now();
  const email = `uploader_${timestamp}@test.com`;
  const password = 'password123';
  let token = '';

  // 1. Register Student
  console.log('\n--- 1. Registering Student ---');
  try {
    const res = await fetch(`${AUTH_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Aarav Tester',
        email,
        password,
        role: 'student'
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}, Success: ${data.success}`);
    token = data.data?.token;
  } catch (e) {
    console.error('Registration failed:', e.message);
    return;
  }

  // 2. Upload Resume PDF
  console.log('\n--- 2. Uploading PDF Resume ---');
  let resumeUrl = '';
  try {
    const formData = new FormData();
    const pdfBlob = new Blob(['%PDF-1.5 fake pdf data for test purpose'], { type: 'application/pdf' });
    formData.append('resume', pdfBlob, 'student_resume.pdf');

    const res = await fetch(`${PROFILE_BASE}/upload-resume`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
    console.log(`Uploaded Resume Path:`, data.data?.resumeUrl);
    resumeUrl = data.data?.resumeUrl;
  } catch (e) {
    console.error('File upload failed:', e.message);
    return;
  }

  // 3. Create Student Profile with Roll Numbers, Section, and Project Objects
  console.log('\n--- 3. Creating Profile with All Details ---');
  try {
    const res = await fetch(PROFILE_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        phone: '9876543210',
        universityRollNo: `ROLL-${timestamp}`,
        classRollNo: 'CS-B-12',
        section: 'B',
        branch: 'CSE',
        semester: 6,
        cgpa: 9.15,
        skills: ['JavaScript', 'Node.js', 'React'],
        projects: [
          {
            title: 'CRMS Portal',
            description: 'Campus Recruitment Management System',
            tech: 'React, Redux, Express, MongoDB'
          }
        ],
        resumeUrl: resumeUrl, // From upload step
        linkedinUrl: 'https://linkedin.com/in/aarav',
        githubUrl: 'https://github.com/aarav',
        backlogs: 0,
        placementStatus: 'Not Placed'
      })
    });

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
    console.log('Saved Class Details:');
    console.log(`  Uni Roll: ${data.data?.universityRollNo}`);
    console.log(`  Class Roll: ${data.data?.classRollNo}`);
    console.log(`  Section: ${data.data?.section}`);
    console.log(`  Projects:`, JSON.stringify(data.data?.projects, null, 2));
  } catch (e) {
    console.error('Profile creation failed:', e.message);
  }

  // 4. Retrieve Profile and verify Populated details
  console.log('\n--- 4. Retrieving Profile ---');
  try {
    const res = await fetch(PROFILE_BASE, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log('Populated User:', data.data?.userId);
    console.log('Verified Resume URL:', data.data?.resumeUrl);
  } catch (e) {
    console.error('Profile retrieval failed:', e.message);
  }

  console.log('\n=== VERIFICATION FINISHED ===');
}

testUploadAndDetails();
