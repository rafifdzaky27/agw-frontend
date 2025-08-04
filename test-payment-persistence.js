// Test script to verify backend payment terms persistence

const testPaymentTermsPersistence = async () => {
  console.log("🔍 ===== PAYMENT TERMS PERSISTENCE TEST =====");
  console.log("");
  
  const BACKEND_IP = "http://localhost:5006";
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error("❌ No token found. Please login first.");
    return;
  }
  
  // Use the project ID from your logs
  const projectId = "9ddec3b5-7d1e-4db9-bd1f-099eb3e9a480";
  
  console.log("1. 📋 Getting current project data...");
  
  try {
    // Get current project data
    const getResponse = await fetch(`${BACKEND_IP}/api/portfolio/projects/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const currentData = await getResponse.json();
    console.log("📊 Current project data:", currentData);
    console.log("💰 Current payment terms:", currentData.data?.terminPembayaran || currentData.data?.termin_pembayaran);
    console.log("💰 Current payment terms count:", (currentData.data?.terminPembayaran || currentData.data?.termin_pembayaran || []).length);
    
    console.log("");
    console.log("2. 💰 Sending update with payment terms...");
    
    // Test data with payment terms
    const updateData = {
      project_name: "ITSP",
      project_type: "procurement",
      divisi_inisiasi: "IAG",
      grup_terlibat: "IAG",
      keterangan: "oke",
      nama_vendor: "OJK",
      no_pks_po: "PKS/2025/44",
      tanggal_pks_po: "2025-08-01T00:00:00.000Z",
      tanggal_bapp: "2025-08-22T00:00:00.000Z",
      tanggal_berakhir: "2025-08-31T00:00:00.000Z",
      
      // Payment terms in multiple formats
      termin_pembayaran: [
        {
          id: "test-term-" + Date.now(),
          termin: "Test Payment Term",
          nominal: 50000000,
          description: "Test payment term for persistence check"
        }
      ],
      payment_terms: [
        {
          id: "test-term-" + Date.now(),
          termin: "Test Payment Term",
          nominal: 50000000,
          description: "Test payment term for persistence check"
        }
      ],
      payments: [
        {
          id: "test-term-" + Date.now(),
          termin: "Test Payment Term",
          nominal: 50000000,
          description: "Test payment term for persistence check"
        }
      ]
    };
    
    console.log("📦 Update data:", updateData);
    console.log("💰 Payment terms being sent:", updateData.termin_pembayaran);
    
    // Send update
    const updateResponse = await fetch(`${BACKEND_IP}/api/portfolio/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    const updateResult = await updateResponse.json();
    console.log("📊 Update response status:", updateResponse.status);
    console.log("📊 Update response:", updateResult);
    console.log("💰 Payment terms in update response:", updateResult.data?.terminPembayaran || updateResult.data?.termin_pembayaran);
    
    if (updateResponse.ok) {
      console.log("✅ Update successful!");
      
      console.log("");
      console.log("3. 🔍 Verifying persistence - getting updated data...");
      
      // Wait a moment for backend to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get updated project data
      const verifyResponse = await fetch(`${BACKEND_IP}/api/portfolio/projects/${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const verifyData = await verifyResponse.json();
      console.log("📊 Verification data:", verifyData);
      console.log("💰 Payment terms after persistence:", verifyData.data?.terminPembayaran || verifyData.data?.termin_pembayaran);
      console.log("💰 Payment terms count after persistence:", (verifyData.data?.terminPembayaran || verifyData.data?.termin_pembayaran || []).length);
      
      // Compare
      const sentCount = updateData.termin_pembayaran.length;
      const persistedCount = (verifyData.data?.terminPembayaran || verifyData.data?.termin_pembayaran || []).length;
      
      console.log("");
      console.log("🔍 PERSISTENCE TEST RESULTS:");
      console.log(`   Sent: ${sentCount} payment terms`);
      console.log(`   Persisted: ${persistedCount} payment terms`);
      
      if (persistedCount === sentCount && persistedCount > 0) {
        console.log("✅ SUCCESS: Payment terms persisted correctly!");
      } else if (persistedCount === 0) {
        console.log("❌ FAILURE: Payment terms were not persisted!");
        console.log("🔍 This indicates a backend database persistence issue");
      } else {
        console.log("⚠️  PARTIAL: Some payment terms persisted, but count mismatch");
      }
      
    } else {
      console.log("❌ Update failed:", updateResult);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
  
  console.log("");
  console.log("🎯 TEST COMPLETE");
};

// Instructions
console.log("🔍 To test payment terms persistence:");
console.log("1. Copy and paste this entire script in browser console");
console.log("2. Run: testPaymentTermsPersistence()");
console.log("3. Check the results to see if backend persists payment terms");

// Auto-run if you want
// testPaymentTermsPersistence();
