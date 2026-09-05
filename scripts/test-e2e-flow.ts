async function testEndToEnd() {
  const baseUrl = "http://localhost:3000";
  console.log("=== Testing End-to-End Onboarding & Auth Flow ===");

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = "testPassword123!";
  const firstName = "Jordan";
  const lastName = "Taylor";

  // 1. Test Signup
  console.log(`\n1. Testing Signup for ${testEmail}...`);
  const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      firstName,
      lastName,
      timezone: "America/New_York",
    }),
  });

  const signupCookie = signupRes.headers.get("set-cookie");
  const signupData = await signupRes.json();
  console.log(`Signup Status: ${signupRes.status}`);
  if (!signupRes.ok || !signupData.token) {
    throw new Error(`Signup failed: ${JSON.stringify(signupData)}`);
  }
  console.log(`[✓] Signup succeeded! Received JWT Token and Cookie.`);

  // 2. Test /api/auth/me
  console.log("\n2. Testing /api/auth/me with Bearer token & Cookie...");
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: {
      "Authorization": `Bearer ${signupData.token}`,
      "Cookie": signupCookie || "",
    },
  });
  const meData = await meRes.json();
  console.log(`Auth Me Status: ${meRes.status}`);
  if (!meRes.ok || !meData.user || meData.user.email !== testEmail) {
    throw new Error(`Auth Me check failed: ${JSON.stringify(meData)}`);
  }
  console.log(`[✓] /api/auth/me verified user: ${meData.user.firstName} ${meData.user.lastName} (isOnboarded: ${meData.user.isOnboarded})`);

  // 3. Test /api/onboarding submission
  console.log("\n3. Testing /api/onboarding commitment creation...");
  const onbRes = await fetch(`${baseUrl}/api/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${signupData.token}`,
      "Cookie": signupCookie || "",
    },
    body: JSON.stringify({
      commitmentName: "Daily Evening Grounding",
      commitmentWhy: "To sleep with a quiet, calm mind",
      frequency: "daily",
      customDays: [0, 1, 2, 3, 4, 5, 6],
      morningNotificationTime: "07:30",
      eveningNotificationTime: "21:00",
      timezone: "America/New_York",
    }),
  });
  const onbData = await onbRes.json();
  console.log(`Onboarding Status: ${onbRes.status}`);
  if (!onbRes.ok || !onbData.success || !onbData.user.isOnboarded) {
    throw new Error(`Onboarding failed: ${JSON.stringify(onbData)}`);
  }
  console.log(`[✓] Onboarding completed! User marked isOnboarded: true.`);

  // 4. Test Login Errors
  console.log("\n4. Testing Granular Login Errors...");
  
  // Non-existent user
  const notFoundRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nonexistent_anchor_user_999@example.com", password: "Password123!" }),
  });
  const notFoundData = await notFoundRes.json();
  console.log(`User Not Found Status: ${notFoundRes.status}, Code: ${notFoundData.code}`);
  if (notFoundRes.status !== 404 || notFoundData.code !== "USER_NOT_FOUND") {
    throw new Error("Expected 404 and USER_NOT_FOUND code");
  }
  console.log(`[✓] USER_NOT_FOUND returned: "${notFoundData.error}"`);

  // Wrong password
  const wrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: "IncorrectPassword!" }),
  });
  const wrongPassData = await wrongPassRes.json();
  console.log(`Wrong Password Status: ${wrongPassRes.status}, Code: ${wrongPassData.code}`);
  if (wrongPassRes.status !== 401 || wrongPassData.code !== "WRONG_PASSWORD") {
    throw new Error("Expected 401 and WRONG_PASSWORD code");
  }
  console.log(`[✓] WRONG_PASSWORD returned: "${wrongPassData.error}"`);

  console.log("\n=========================================");
  console.log("ALL END-TO-END FLOW TESTS PASSED (100%)!");
  console.log("=========================================");
}

testEndToEnd().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
