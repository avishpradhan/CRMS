// Automated test script for Student Profile APIs
const AUTH_BASE = 'http://localhost:5000/api/auth';
const PROFILE_BASE = 'http://localhost:5000/api/student/profile';

// Helper to print test headers
function printHeader(title) {
  console.log(`\n==================================================`);
  console.log(`TEST: ${title}`);
  console.log(`==================================================`);
}

async function runTests() {
  const timestamp = Date.now();
  const studentEmail = `student_${timestamp}@test.com`;
  const recruiterEmail = `recruiter_${timestamp}@test.com`;
  const password = 'password123';

  let studentToken = '';
  let recruiterToken = '';

  // 1. Register Student
  printHeader('1. Register Student');
  try {
    const res = await fetch(`${AUTH_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'John Student',
        email: studentEmail,
        password,
        role: 'student'
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
    studentToken = data.data?.token;
  } catch (e) {
    console.error('Failed to register student:', e.message);
  }

  // 2. Register Recruiter
  printHeader('2. Register Recruiter');
  try {
    const res = await fetch(`${AUTH_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Jane Recruiter',
        email: recruiterEmail,
        password,
        role: 'recruiter'
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
    recruiterToken = data.data?.token;
  } catch (e) {
    console.error('Failed to register recruiter:', e.message);
  }

  // 3. Get profile initially (should be 404 Not Found)
  printHeader('3. Get Profile initially (Should fail with 404)');
  try {
    const res = await fetch(PROFILE_BASE, {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
  } catch (e) {
    console.error('Error:', e.message);
  }

  // 4. Try to create profile as Recruiter (should be 403 Forbidden)
  printHeader('4. Create profile as Recruiter (Should fail with 403)');
  try {
    const res = await fetch(PROFILE_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${recruiterToken}`
      },
      body: JSON.stringify({
        phone: '1234567890',
        branch: 'CSE',
        semester: 6,
        cgpa: 8.5,
        skills: ['React', 'Node.js'],
        projects: ['Portfolio'],
        resumeUrl: 'https://resume.com/john',
        linkedinUrl: 'https://linkedin.com/in/john',
        githubUrl: 'https://github.com/john'
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
  } catch (e) {
    console.error('Error:', e.message);
  }

  // 5. Create profile as Student with invalid validations (Should fail with 400)
  printHeader('5. Create profile with invalid validations (Should fail with 400)');
  try {
    const res = await fetch(PROFILE_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        phone: 'invalid-phone-format', // invalid phone
        branch: 'XYZ', // invalid enum
        semester: 12, // range 1-10
        cgpa: 11.5, // range 0-10
        skills: [], // validator requires length > 0
        projects: ['Portfolio'],
        resumeUrl: 'invalid-url', // invalid URL
        linkedinUrl: 'https://linkedin.com/in/john',
        githubUrl: 'https://github.com/john',
        backlogs: -2 // min 0
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
  } catch (e) {
    console.error('Error:', e.message);
  }

  // 6. Create profile as Student with valid data (Should succeed with 201)
  printHeader('6. Create profile as Student (Should succeed with 201)');
  try {
    const res = await fetch(PROFILE_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        phone: '9876543210',
        branch: 'CSE',
        semester: 6,
        cgpa: 8.5,
        skills: ['React', 'Node.js', 'MongoDB'],
        projects: ['SecureAuth', 'Study Planner'],
        resumeUrl: 'https://resume.com/john',
        linkedinUrl: 'https://linkedin.com/in/john',
        githubUrl: 'https://github.com/john',
        backlogs: 0,
        placementStatus: 'Not Placed'
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
    console.log('Data:', JSON.stringify(data.data, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }

  // 7. Create profile again (Should fail with 400 / Duplicate)
  printHeader('7. Create duplicate profile (Should fail with 400)');
  try {
    const res = await fetch(PROFILE_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        phone: '9876543210',
        branch: 'IT',
        semester: 7,
        cgpa: 9.0,
        skills: ['Java'],
        projects: ['Other Project'],
        resumeUrl: 'https://resume.com/john2',
        linkedinUrl: 'https://linkedin.com/in/john2',
        githubUrl: 'https://github.com/john2'
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
  } catch (e) {
    console.error('Error:', e.message);
  }

  // 8. Get profile (Should succeed with 200)
  printHeader('8. Get Profile (Should succeed with 200)');
  try {
    const res = await fetch(PROFILE_BASE, {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
    console.log('Populated User Info:', data.data?.userId);
    console.log('Profile CGPA & branch:', data.data?.cgpa, data.data?.branch);
  } catch (e) {
    console.error('Error:', e.message);
  }

  // 9. Update profile with invalid validations (Should fail with 400)
  printHeader('9. Update profile with invalid validations (Should fail with 400)');
  try {
    const res = await fetch(PROFILE_BASE, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        cgpa: 12.0 // invalid range
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
  } catch (e) {
    console.error('Error:', e.message);
  }

  // 10. Update profile with valid data (Should succeed with 200)
  printHeader('10. Update profile with valid data (Should succeed with 200)');
  try {
    const res = await fetch(PROFILE_BASE, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        cgpa: 9.2,
        semester: 7,
        placementStatus: 'Placed',
        skills: ['React', 'Node.js', 'MongoDB', 'Express']
      })
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
    console.log('Updated CGPA:', data.data?.cgpa);
    console.log('Updated placementStatus:', data.data?.placementStatus);
    console.log('Updated skills:', data.data?.skills);
  } catch (e) {
    console.error('Error:', e.message);
  }

  // 11. Delete profile (Should succeed with 200)
  printHeader('11. Delete Profile (Should succeed with 200)');
  try {
    const res = await fetch(PROFILE_BASE, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
  } catch (e) {
    console.error('Error:', e.message);
  }

  // 12. Get profile after deletion (Should fail with 404)
  printHeader('12. Get Profile after deletion (Should fail with 404)');
  try {
    const res = await fetch(PROFILE_BASE, {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
  } catch (e) {
    console.error('Error:', e.message);
  }

  console.log(`\n==================================================`);
  console.log(`ALL TESTS FINISHED`);
  console.log(`==================================================`);
}

runTests();
