// Quick API test script
const BASE = 'http://localhost:5000/api/auth';

async function test() {
  console.log('=== 1. Register Student ===');
  try {
    const reg = await fetch(`${BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Test Student', email: 'test@gmail.com', password: '123456', role: 'student' }),
    });
    const regData = await reg.json();
    console.log(`Status: ${reg.status}`, JSON.stringify(regData, null, 2));
  } catch (e) { console.error(e.message); }

  console.log('\n=== 2. Block Admin Registration ===');
  try {
    const adm = await fetch(`${BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Hacker', email: 'hack@test.com', password: '123456', role: 'admin' }),
    });
    const admData = await adm.json();
    console.log(`Status: ${adm.status}`, JSON.stringify(admData, null, 2));
  } catch (e) { console.error(e.message); }

  console.log('\n=== 3. Login Student ===');
  let token = '';
  try {
    const login = await fetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@gmail.com', password: '123456' }),
    });
    const loginData = await login.json();
    console.log(`Status: ${login.status}`, JSON.stringify(loginData, null, 2));
    token = loginData.data?.token || '';
  } catch (e) { console.error(e.message); }

  console.log('\n=== 4. Login Admin ===');
  try {
    const adl = await fetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@crms.com', password: 'password123' }),
    });
    const adlData = await adl.json();
    console.log(`Status: ${adl.status}`, JSON.stringify(adlData, null, 2));
  } catch (e) { console.error(e.message); }

  console.log('\n=== 5. Get Me (Protected) ===');
  try {
    const me = await fetch(`${BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await me.json();
    console.log(`Status: ${me.status}`, JSON.stringify(meData, null, 2));
  } catch (e) { console.error(e.message); }

  console.log('\n=== 6. Get Me (No Token) ===');
  try {
    const noAuth = await fetch(`${BASE}/me`);
    const noAuthData = await noAuth.json();
    console.log(`Status: ${noAuth.status}`, JSON.stringify(noAuthData, null, 2));
  } catch (e) { console.error(e.message); }

  console.log('\n=== ALL TESTS DONE ===');
}

test();
