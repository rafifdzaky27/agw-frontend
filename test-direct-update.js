// Direct API test to bypass form issues
// Run this in browser console to test data transformation

const testDirectUpdate = async () => {
  console.log("🧪 ===== DIRECT API UPDATE TEST =====");
  
  const BACKEND_IP = "http://localhost:5006";
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error("❌ No token found. Please login first.");
    return;
  }
  
  // Test data that should work
  const testData = {
    kode_project: "PRJ-2025-TEST",
    project_name: "Test Project Name",
    project_type: "procurement",
    divisi_inisiasi: "IT Division",
    grup_terlibat: "Development Team",
    keterangan: "Test description",
    nama_vendor: "Test Vendor",
    no_pks_po: "PKS/2025/TEST",
    tanggal_pks_po: "2025-08-01T00:00:00.000Z",
    tanggal_bapp: "2025-08-15T00:00:00.000Z",
    tanggal_berakhir: "2025-12-31T00:00:00.000Z"
  };
  
  console.log("📦 Test data (snake_case):", testData);
  
  // Use an existing project ID - replace with actual ID
  const projectId = "9ddec3b5-7d1e-4db9-bd1f-099eb3e9a480"; // Replace with actual project ID
  
  try {
    console.log(`📡 Making direct API call to: ${BACKEND_IP}/api/portfolio/projects/${projectId}`);
    
    const response = await fetch(`${BACKEND_IP}/api/portfolio/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log("📊 Response status:", response.status);
    console.log("📊 Response ok:", response.ok);
    
    const responseData = await response.text();
    console.log("📊 Response data:", responseData);
    
    if (response.ok) {
      console.log("✅ SUCCESS! Direct API call worked with snake_case data");
      console.log("🎯 This means the issue is in frontend data transformation");
    } else {
      console.log("❌ FAILED! Even direct snake_case data failed");
      console.log("🎯 This means the issue is in backend validation or field names");
      
      try {
        const errorData = JSON.parse(responseData);
        console.log("📊 Parsed error:", errorData);
      } catch (e) {
        console.log("📊 Raw error response:", responseData);
      }
    }
    
  } catch (error) {
    console.error("❌ API call failed:", error);
  }
};

// Instructions
console.log("🔍 To test direct API call:");
console.log("1. Copy and paste this entire script in browser console");
console.log("2. Run: testDirectUpdate()");
console.log("3. Check the results");

// Auto-run if you want
// testDirectUpdate();
