const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('--- Starting API Verification Tests ---');
  let token = '';
  let eventId = '';
  let photoId = '';

  // 1. Register Photographer
  console.log('\n[1/7] Testing Register...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Photographer',
      email: 'test@example.com',
      password: 'password123'
    })
  });
  const regData = await regRes.json();
  console.log('Register Response Status:', regRes.status);
  console.log('Register Response Data:', JSON.stringify(regData, null, 2));
  if (regRes.status !== 201) throw new Error('Registration failed');

  // 2. Login Photographer
  console.log('\n[2/7] Testing Login...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });
  const loginData = await loginRes.json();
  console.log('Login Response Status:', loginRes.status);
  console.log('Login Response Data:', JSON.stringify(loginData, null, 2));
  if (loginRes.status !== 200) throw new Error('Login failed');
  token = loginData.data.token;

  // 3. Get Profile (Me)
  console.log('\n[3/7] Testing Profile (Me)...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const meData = await meRes.json();
  console.log('Me Response Status:', meRes.status);
  console.log('Me Response Data:', JSON.stringify(meData, null, 2));
  if (meRes.status !== 200) throw new Error('Get profile failed');

  // 4. Create Event
  console.log('\n[4/7] Testing Create Event...');
  const eventRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Annual Gala 2026',
      date: '2026-12-15',
      location: 'Convention Center'
    })
  });
  const eventData = await eventRes.json();
  console.log('Create Event Response Status:', eventRes.status);
  console.log('Create Event Response Data:', JSON.stringify(eventData, null, 2));
  if (eventRes.status !== 201) throw new Error('Event creation failed');
  eventId = eventData.data.id;

  // 5. Upload Photo
  console.log('\n[5/7] Testing Upload Photo...');
  // Create a mock image file buffer using Blob
  const mockImageBuffer = Buffer.from('fake-png-content');
  const blob = new Blob([mockImageBuffer], { type: 'image/png' });
  const formData = new FormData();
  formData.append('photos', blob, 'sample_photo.png');

  const uploadRes = await fetch(`${BASE_URL}/events/${eventId}/photos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  const uploadData = await uploadRes.json();
  console.log('Upload Photos Response Status:', uploadRes.status);
  console.log('Upload Photos Response Data:', JSON.stringify(uploadData, null, 2));
  if (uploadRes.status !== 201) throw new Error('Photo upload failed');
  photoId = uploadData.data[0].id;

  // 6. Get Event Photos
  console.log('\n[6/7] Testing Get Event Photos...');
  const getPhotosRes = await fetch(`${BASE_URL}/events/${eventId}/photos`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const getPhotosData = await getPhotosRes.json();
  console.log('Get Photos Response Status:', getPhotosRes.status);
  console.log('Get Photos Response Data:', JSON.stringify(getPhotosData, null, 2));
  if (getPhotosRes.status !== 200) throw new Error('Get event photos failed');

  // 7. Delete Photo
  console.log('\n[7/7] Testing Delete Photo...');
  const deleteRes = await fetch(`${BASE_URL}/photos/${photoId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const deleteData = await deleteRes.json();
  console.log('Delete Photo Response Status:', deleteRes.status);
  console.log('Delete Photo Response Data:', JSON.stringify(deleteData, null, 2));
  if (deleteRes.status !== 200) throw new Error('Delete photo failed');

  console.log('\n--- All API Verification Tests Passed Successfully! ---');
}

// Start backend server subprocess
async function main() {
  console.log('Starting backend server for verification...');
  
  const env = { ...process.env, PORT: PORT.toString(), NODE_ENV: 'test' };
  const serverProcess = spawn('node', [path.join(__dirname, 'src/server.js')], {
    env,
    stdio: 'pipe'
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server Stdout]: ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Stderr]: ${data.toString().trim()}`);
  });

  // Wait for server to connect to database and start listening
  await delay(3000);

  try {
    await runTests();
    serverProcess.kill();
    await delay(500);
    process.exit(0);
  } catch (error) {
    console.error('\nVerification tests FAILED with error:', error);
    serverProcess.kill();
    await delay(500);
    process.exit(1);
  }
}

main();
