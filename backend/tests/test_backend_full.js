const { spawn } = require('child_process');
const path = require('path');

const PORT = 5002;
const BASE_URL = `http://localhost:${PORT}/api`;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('=== RUNNING COMPREHENSIVE BACKEND VERIFICATION ===\n');
  let token = '';
  let eventId = '';
  let photoId = '';

  const testEmail = `photographer_${Date.now()}@example.com`;

  // 1. Register Photographer
  console.log('[1/12] Register Photographer...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alex Lensman',
      email: testEmail,
      password: 'SecurePassword123'
    })
  });
  const regData = await regRes.json();
  if (regRes.status !== 201 || !regData.success) {
    throw new Error(`Register failed: ${JSON.stringify(regData)}`);
  }
  console.log('  -> Register OK:', regData.data.email);

  // 2. Login Photographer
  console.log('[2/12] Login Photographer...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'SecurePassword123'
    })
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.data.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  token = loginData.data.token;
  console.log('  -> Login OK, JWT token acquired');

  // 3. Get Photographer Profile (Me)
  console.log('[3/12] Get Profile (/auth/me)...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData = await meRes.json();
  if (meRes.status !== 200 || meData.data.email !== testEmail) {
    throw new Error(`GetMe failed: ${JSON.stringify(meData)}`);
  }
  console.log('  -> Profile OK:', meData.data.name);

  // 4. Create Event with description
  console.log('[4/12] Create Event with description...');
  const eventRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Sunset Music Festival',
      date: '2026-11-20',
      location: 'Goa Beachfront',
      description: 'Annual sunset live concert and photography showcase.'
    })
  });
  const eventData = await eventRes.json();
  if (eventRes.status !== 201 || !eventData.data.id) {
    throw new Error(`Create event failed: ${JSON.stringify(eventData)}`);
  }
  eventId = eventData.data.id;
  console.log('  -> Create Event OK:', eventId, 'isPublic:', eventData.data.isPublic);

  // 5. Upload Photo
  console.log('[5/12] Upload Photo...');
  const mockImageBuffer = Buffer.from('fake-png-photo-content');
  const blob = new Blob([mockImageBuffer], { type: 'image/png' });
  const formData = new FormData();
  formData.append('photos', blob, 'beach_sunset.png');

  const uploadRes = await fetch(`${BASE_URL}/events/${eventId}/photos`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  const uploadData = await uploadRes.json();
  if (uploadRes.status !== 201 || !uploadData.data || uploadData.data.length === 0) {
    throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
  }
  photoId = uploadData.data[0].id;
  console.log('  -> Upload OK, photoId:', photoId);

  // 6. Get Event Photos (Photographer)
  console.log('[6/12] Get Event Photos (Photographer)...');
  const getPhotosRes = await fetch(`${BASE_URL}/events/${eventId}/photos`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const getPhotosData = await getPhotosRes.json();
  if (getPhotosRes.status !== 200 || getPhotosData.data.length === 0) {
    throw new Error(`Get Photos failed: ${JSON.stringify(getPhotosData)}`);
  }
  console.log('  -> Get Photos OK, count:', getPhotosData.data.length);

  // 7. Toggle Public Access ON
  console.log('[7/12] Toggle Public Access ON (isPublic = true)...');
  const toggleOnRes = await fetch(`${BASE_URL}/events/${eventId}/public`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ isPublic: true })
  });
  const toggleOnData = await toggleOnRes.json();
  if (toggleOnRes.status !== 200 || toggleOnData.data.isPublic !== true) {
    throw new Error(`Toggle Public ON failed: ${JSON.stringify(toggleOnData)}`);
  }
  console.log('  -> Toggle ON OK, isPublic:', toggleOnData.data.isPublic);

  // 8. Generate QR Code
  console.log('[8/12] Generate Event QR Code...');
  const qrRes = await fetch(`${BASE_URL}/events/${eventId}/qr?origin=http://localhost:5173`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const qrData = await qrRes.json();
  if (qrRes.status !== 200 || !qrData.data.qrCodeDataUrl) {
    throw new Error(`Generate QR failed: ${JSON.stringify(qrData)}`);
  }
  console.log('  -> QR OK, Public URL:', qrData.data.publicUrl);

  // 9. Access Public Event (Guest, NO auth)
  console.log('[9/12] Guest Access Public Event (NO auth)...');
  const pubEventRes = await fetch(`${BASE_URL}/public/events/${eventId}`);
  const pubEventData = await pubEventRes.json();
  if (pubEventRes.status !== 200 || pubEventData.data.name !== 'Sunset Music Festival') {
    throw new Error(`Guest access public event failed: ${JSON.stringify(pubEventData)}`);
  }
  console.log('  -> Guest Event OK:', pubEventData.data.name, 'by', pubEventData.data.photographer.name);

  // 10. Access Public Photos (Guest, NO auth)
  console.log('[10/12] Guest Access Public Photos (NO auth)...');
  const pubPhotosRes = await fetch(`${BASE_URL}/public/events/${eventId}/photos`);
  const pubPhotosData = await pubPhotosRes.json();
  if (pubPhotosRes.status !== 200 || pubPhotosData.data.length === 0) {
    throw new Error(`Guest access public photos failed: ${JSON.stringify(pubPhotosData)}`);
  }
  console.log('  -> Guest Photos OK, count:', pubPhotosData.data.length);

  // 11. Toggle Public Access OFF and verify Guest 403
  console.log('[11/12] Toggle Public Access OFF and verify Guest Access Denied (403)...');
  const toggleOffRes = await fetch(`${BASE_URL}/events/${eventId}/public`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ isPublic: false })
  });
  const toggleOffData = await toggleOffRes.json();
  if (toggleOffRes.status !== 200 || toggleOffData.data.isPublic !== false) {
    throw new Error(`Toggle Public OFF failed: ${JSON.stringify(toggleOffData)}`);
  }

  const deniedRes = await fetch(`${BASE_URL}/public/events/${eventId}`);
  if (deniedRes.status !== 403) {
    throw new Error(`Expected 403 for private event, but got ${deniedRes.status}`);
  }
  console.log('  -> Private event access correctly denied with 403 Forbidden!');

  // 12. Delete Photo (Photographer)
  console.log('[12/12] Delete Photo (Photographer)...');
  const deleteRes = await fetch(`${BASE_URL}/photos/${photoId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const deleteData = await deleteRes.json();
  if (deleteRes.status !== 200 || !deleteData.success) {
    throw new Error(`Delete photo failed: ${JSON.stringify(deleteData)}`);
  }
  console.log('  -> Photo Delete OK');

  console.log('\n=== ALL 12 BACKEND INTEGRATION TESTS PASSED PERFECTLY! ===');
}

async function main() {
  const env = { ...process.env, PORT: PORT.toString(), NODE_ENV: 'test' };
  const serverProcess = spawn('node', [path.join(__dirname, '../src/server.js')], {
    env,
    stdio: 'pipe'
  });

  serverProcess.stdout.on('data', (data) => {
    // console.log(`[Server]: ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error]: ${data.toString().trim()}`);
  });

  await delay(2500);

  try {
    await runTests();
    serverProcess.kill('SIGINT');
    process.exit(0);
  } catch (err) {
    console.error('\nBackend test FAILED:', err);
    serverProcess.kill('SIGINT');
    process.exit(1);
  }
}

main();
