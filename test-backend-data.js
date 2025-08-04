// Test script to verify backend data structure

console.log("🔍 ===== BACKEND DATA STRUCTURE TEST =====");
console.log("");

// Simulate the data that should be sent to backend
const frontendData = {
  kodeProject: "PRJ-2025-044",
  projectName: "ITSP",
  projectType: "procurement",
  divisiInisiasi: "IAG",
  grupTerlibat: "IAG",
  keterangan: "oke",
  namaVendor: "OJK",
  noPKSPO: "PKS/2025/44",
  tanggalPKSPO: "2025-08-01",
  tanggalBAPP: "2025-08-22",
  tanggalBerakhir: "2025-08-31",
  terminPembayaran: [
    {
      id: "term-1",
      termin: "Term 1",
      nominal: 10000000,
      description: "First payment"
    }
  ]
};

console.log("📋 Frontend Data (camelCase):");
console.log(JSON.stringify(frontendData, null, 2));
console.log("");

// Simulate transformation
const transformedData = {
  kode_project: frontendData.kodeProject,
  project_name: frontendData.projectName,
  project_type: frontendData.projectType,
  divisi_inisiasi: frontendData.divisiInisiasi,
  grup_terlibat: frontendData.grupTerlibat,
  keterangan: frontendData.keterangan,
  nama_vendor: frontendData.namaVendor,
  no_pks_po: frontendData.noPKSPO,
  tanggal_pks_po: frontendData.tanggalPKSPO + "T00:00:00.000Z",
  tanggal_bapp: frontendData.tanggalBAPP + "T00:00:00.000Z",
  tanggal_berakhir: frontendData.tanggalBerakhir + "T00:00:00.000Z",
  termin_pembayaran: frontendData.terminPembayaran
};

console.log("🔄 Transformed Data (snake_case):");
console.log(JSON.stringify(transformedData, null, 2));
console.log("");

// Simulate multi-format backend data
const backendData = {
  // Basic fields
  project_name: transformedData.project_name,
  project_type: transformedData.project_type,
  divisi_inisiasi: transformedData.divisi_inisiasi,
  grup_terlibat: transformedData.grup_terlibat,
  nama_vendor: transformedData.nama_vendor,
  no_pks_po: transformedData.no_pks_po,
  
  // Date variations
  tanggal_pks_po: transformedData.tanggal_pks_po,
  pks_date: transformedData.tanggal_pks_po,
  pks_po_date: transformedData.tanggal_pks_po,
  contract_date: transformedData.tanggal_pks_po,
  start_date: transformedData.tanggal_pks_po,
  
  tanggal_bapp: transformedData.tanggal_bapp,
  bapp_date: transformedData.tanggal_bapp,
  handover_date: transformedData.tanggal_bapp,
  delivery_date: transformedData.tanggal_bapp,
  
  tanggal_berakhir: transformedData.tanggal_berakhir,
  end_date: transformedData.tanggal_berakhir,
  finish_date: transformedData.tanggal_berakhir,
  completion_date: transformedData.tanggal_berakhir,
  
  // Payment terms variations
  termin_pembayaran: transformedData.termin_pembayaran,
  payment_terms: transformedData.termin_pembayaran,
  payments: transformedData.termin_pembayaran,
  terms: transformedData.termin_pembayaran,
  
  // CamelCase backup
  tanggalPKSPO: frontendData.tanggalPKSPO,
  tanggalBAPP: frontendData.tanggalBAPP,
  tanggalBerakhir: frontendData.tanggalBerakhir,
  terminPembayaran: frontendData.terminPembayaran
};

console.log("📡 Backend Data (multi-format):");
console.log(JSON.stringify(backendData, null, 2));
console.log("");

console.log("🔍 CRITICAL CHECKS:");
console.log("");

console.log("📅 Date Format Validation:");
const dateFields = ['tanggal_pks_po', 'tanggal_bapp', 'tanggal_berakhir'];
dateFields.forEach(field => {
  const value = transformedData[field];
  const date = new Date(value);
  const isValid = !isNaN(date.getTime()) && date.getTime() !== 0;
  console.log(`   ${field}: "${value}" → Valid: ${isValid}`);
  if (isValid) {
    console.log(`      Parsed: ${date.toISOString()}`);
    console.log(`      Display: ${date.toLocaleDateString('id-ID')}`);
  }
});

console.log("");
console.log("💰 Payment Terms Validation:");
const paymentTerms = transformedData.termin_pembayaran;
console.log(`   Count: ${paymentTerms.length}`);
paymentTerms.forEach((term, index) => {
  console.log(`   Term ${index + 1}:`);
  console.log(`      ID: ${term.id}`);
  console.log(`      Name: ${term.termin}`);
  console.log(`      Amount: ${term.nominal} (${typeof term.nominal})`);
  console.log(`      Description: ${term.description}`);
});

console.log("");
console.log("🎯 BACKEND EXPECTATIONS:");
console.log("");
console.log("If backend still shows 1970 dates or missing payment terms:");
console.log("1. Backend might expect different field names");
console.log("2. Backend might not process nested objects correctly");
console.log("3. Backend might have date parsing issues");
console.log("4. Backend might require specific date formats");
console.log("");
console.log("💡 DEBUGGING STEPS:");
console.log("1. Check backend logs for received data");
console.log("2. Verify backend date parsing logic");
console.log("3. Check backend payment terms processing");
console.log("4. Test with minimal data first");
