#!/usr/bin/env node

// Test script to check Finance API responses
const BACKEND_IP = process.env.NEXT_PUBLIC_BACKEND_IP || "http://localhost:5006";

async function testFinanceAPI() {
  console.log("🔍 ===== TESTING FINANCE API CALLS =====");
  console.log("");
  
  try {
    // Test 1: Get Finance Projects List
    console.log("1. 📋 Testing GET /api/finance/projects");
    console.log(`   Endpoint: ${BACKEND_IP}/api/finance/projects`);
    
    const projectsResponse = await fetch(`${BACKEND_IP}/api/finance/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!projectsResponse.ok) {
      throw new Error(`HTTP error! status: ${projectsResponse.status}`);
    }
    
    const projectsData = await projectsResponse.json();
    console.log("   ✅ Response Status:", projectsResponse.status);
    console.log("   📊 Response Data Structure:");
    console.log("      Success:", projectsData.success);
    console.log("      Data Length:", projectsData.data?.length || 0);
    
    if (projectsData.data && projectsData.data.length > 0) {
      console.log("");
      console.log("   🔍 SEARCHING FOR PRJ-2025-033:");
      
      const targetProject = projectsData.data.find(project => 
        project.kodeProject === 'PRJ-2025-033' || 
        project.noPKSPO?.includes('033') ||
        project.projectName?.includes('033')
      );
      
      if (targetProject) {
        console.log("   ✅ FOUND PRJ-2025-033!");
        console.log("      Project ID:", targetProject.id);
        console.log("      Project Code:", targetProject.kodeProject);
        console.log("      Project Name:", targetProject.projectName);
        console.log("      Payment Status:", targetProject.paymentStatus);
        console.log("      Total Terms:", targetProject.totalTerms);
        console.log("      Paid Terms:", targetProject.paidTerms);
        console.log("      Total Value:", targetProject.totalValue);
        console.log("      Paid Value:", targetProject.paidValue);
        
        if (targetProject.terminPembayaran) {
          console.log("      Payment Terms:");
          targetProject.terminPembayaran.forEach((term, index) => {
            console.log(`        ${index + 1}. ${term.termin} - ${term.status} - ${term.nominal}`);
          });
        }
        
        // Test 2: Get Project Details
        console.log("");
        console.log("2. 📋 Testing GET /api/finance/projects/{id}");
        console.log(`   Endpoint: ${BACKEND_IP}/api/finance/projects/${targetProject.id}`);
        
        const detailResponse = await fetch(`${BACKEND_IP}/api/finance/projects/${targetProject.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          console.log("   ✅ Detail Response Status:", detailResponse.status);
          console.log("   📊 Detail Data:");
          console.log("      Success:", detailData.success);
          
          if (detailData.data) {
            console.log("      Payment Terms Count:", detailData.data.terminPembayaran?.length || 0);
            console.log("      Payment Status:", detailData.data.paymentStatus);
            
            if (detailData.data.terminPembayaran) {
              console.log("      Detailed Payment Terms:");
              detailData.data.terminPembayaran.forEach((term, index) => {
                console.log(`        ${index + 1}. ${term.termin}`);
                console.log(`           Status: ${term.status}`);
                console.log(`           Amount: ${term.nominal}`);
                console.log(`           Payment Date: ${term.paymentDate || 'Not set'}`);
                console.log(`           Budget: ${term.budget || 'Not set'}`);
                console.log(`           Notes: ${term.notes || 'No notes'}`);
              });
            }
          }
        } else {
          console.log("   ❌ Detail Response Error:", detailResponse.status);
        }
        
      } else {
        console.log("   ❌ PRJ-2025-033 NOT FOUND in projects list");
        console.log("   📋 Available projects:");
        projectsData.data.slice(0, 5).forEach((project, index) => {
          console.log(`      ${index + 1}. ${project.kodeProject} - ${project.projectName}`);
        });
      }
    }
    
    console.log("");
    console.log("3. 📊 Testing GET /api/finance/reports/summary");
    console.log(`   Endpoint: ${BACKEND_IP}/api/finance/reports/summary`);
    
    const summaryResponse = await fetch(`${BACKEND_IP}/api/finance/reports/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      console.log("   ✅ Summary Response Status:", summaryResponse.status);
      console.log("   📊 Summary Data:");
      console.log("      Success:", summaryData.success);
      
      if (summaryData.data) {
        console.log("      Total Projects:", summaryData.data.totalProjects);
        console.log("      Completed Projects:", summaryData.data.completedProjects);
        console.log("      In Progress Projects:", summaryData.data.inProgressProjects);
        console.log("      Pending Projects:", summaryData.data.pendingProjects);
        console.log("      Total Value:", summaryData.data.totalValue);
        console.log("      Paid Value:", summaryData.data.paidValue);
        console.log("      Remaining Value:", summaryData.data.remainingValue);
      }
    } else {
      console.log("   ❌ Summary Response Error:", summaryResponse.status);
    }
    
  } catch (error) {
    console.error("❌ API Test Error:", error.message);
    console.log("");
    console.log("💡 TROUBLESHOOTING:");
    console.log("1. Check if backend server is running");
    console.log("2. Verify BACKEND_IP environment variable");
    console.log("3. Check network connectivity");
    console.log("4. Verify API endpoints are correct");
  }
  
  console.log("");
  console.log("🎯 ANALYSIS COMPLETE");
}

// Run the test
testFinanceAPI();
