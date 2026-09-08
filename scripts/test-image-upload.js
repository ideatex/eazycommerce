/**
 * AUTOMATED VERIFICATION SUITE: ADMIN PANEL IMAGE UPLOAD ENDPOINT
 * 
 * Verifies:
 * 1. POST /api/upload accepts valid PNG/JPEG images via multipart/form-data.
 * 2. Uploaded image is saved with a sanitized, collision-free filename in public/uploads/products/.
 * 3. File exists on disk and is readable.
 * 4. Image URL returns HTTP 200 when fetched from the server.
 * 5. Rejection of disallowed MIME types (e.g., text/plain).
 * 6. POST /api/admin/upload alias functions identically.
 */

const fs = require("fs");
const path = require("path");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failedTests++;
  }
}

function assertEquals(actual, expected, msg = "") {
  if (actual !== expected) {
    throw new Error(`Assertion failed: Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}. ${msg}`);
  }
}

function assertTrue(val, msg = "") {
  if (!val) throw new Error(`Assertion failed: Expected true. ${msg}`);
}

async function main() {
  console.log("\n==================================================================");
  console.log("=== ADMIN PANEL: PRODUCT IMAGE UPLOAD AUTOMATION TEST SUITE ===");
  console.log("==================================================================\n");

  const baseUrl = "http://localhost:3000";
  let uploadedFilePath = null;
  let uploadedUrl = null;

  // 1x1 Transparent PNG byte array
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);

  // Test 1: Upload valid PNG to /api/upload
  await runTest("TEST 1: Upload valid PNG image to /api/upload", async () => {
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const filename = "test_wireless_headset.png";

    const payload = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`),
      pngBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: payload,
    });

    assertEquals(res.status, 200, "Response status is 200");
    const json = await res.json();
    assertTrue(json.success, "Response JSON indicates success: true");
    assertTrue(json.url.startsWith("/uploads/products/"), "URL points to /uploads/products/");
    assertTrue(json.filename.includes("test_wireless_headset"), "Filename retains sanitized base");

    uploadedUrl = json.url;
    uploadedFilePath = path.join(process.cwd(), "public", json.url.replace(/^\//, ""));
  });

  // Test 2: File exists on filesystem in public/uploads/products/
  await runTest("TEST 2: Verify uploaded file is written to public/uploads/products/ on disk", async () => {
    assertTrue(uploadedFilePath !== null, "File path was captured");
    assertTrue(fs.existsSync(uploadedFilePath), `File exists on disk at ${uploadedFilePath}`);
    const stats = fs.statSync(uploadedFilePath);
    assertEquals(stats.size, pngBuffer.length, "File size on disk matches uploaded byte buffer");
  });

  // Test 3: Uploaded image is accessible via HTTP
  await runTest("TEST 3: Verify uploaded image is served at static URL with HTTP 200", async () => {
    assertTrue(uploadedUrl !== null, "Uploaded URL is defined");
    const res = await fetch(`${baseUrl}${uploadedUrl}`);
    assertEquals(res.status, 200, "Static image URL returned HTTP 200");
    const fetchedBuf = Buffer.from(await res.arrayBuffer());
    assertEquals(fetchedBuf.length, pngBuffer.length, "Fetched image length matches uploaded image");
  });

  // Test 4: Reject disallowed MIME type
  await runTest("TEST 4: Reject non-image file (text/plain)", async () => {
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const textBuffer = Buffer.from("Hello world, this is not an image");

    const payload = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="malicious.txt"\r\nContent-Type: text/plain\r\n\r\n`),
      textBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: payload,
    });

    assertEquals(res.status, 400, "Response status is 400 Bad Request for disallowed file type");
    const json = await res.json();
    assertEquals(json.success, false, "Response JSON indicates success: false");
    assertTrue(json.error.includes("Invalid file format") || json.error.includes("Invalid format"), "Error message explains format restriction");
  });

  // Test 5: /api/admin/upload alias works identically
  await runTest("TEST 5: Verify /api/admin/upload alias endpoint accepts upload", async () => {
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const filename = "admin_dslr_camera.png";

    const payload = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`),
      pngBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const res = await fetch(`${baseUrl}/api/admin/upload`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body: payload,
    });

    assertEquals(res.status, 200, "Admin endpoint returned HTTP 200");
    const json = await res.json();
    assertTrue(json.success, "Admin endpoint returned success: true");
    assertTrue(json.url.startsWith("/uploads/products/"), "Admin endpoint returns valid upload URL");

    // Clean up second file
    const adminUploadedPath = path.join(process.cwd(), "public", json.url.replace(/^\//, ""));
    if (fs.existsSync(adminUploadedPath)) {
      fs.unlinkSync(adminUploadedPath);
    }
  });

  // Clean up primary test file
  if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
    fs.unlinkSync(uploadedFilePath);
  }

  console.log("\n==================================================================");
  console.log(`=== AUDIT RESULT: ${passedTests}/${totalTests} TESTS PASSED ===`);
  console.log("==================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
