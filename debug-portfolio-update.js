// Debug script for portfolio update data transformation

// Mock data transformation functions
const camelToSnake = (str) => {
  const specialCases = {
    'noPKSPO': 'no_pks_po',
    'tanggalPKSPO': 'tanggal_pks_po',
    'tanggalBAPP': 'tanggal_bapp',
    'terminPembayaran': 'termin_pembayaran',
    'uploadedAt': 'uploaded_at',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    'projectId': 'project_id',
    'vendorId': 'vendor_id',
    'paymentDate': 'payment_date',
    'budgetType': 'budget_type',
    'opexCabang': 'opex_cabang',
    'opexPusat': 'opex_pusat'
  };
  
  if (specialCases[str]) {
    return specialCases[str];
  }
  
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

const transformObjectToSnakeCase = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(transformObjectToSnakeCase);
  
  const transformed = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = camelToSnake(key);
    transformed[snakeKey] = transformObjectToSnakeCase(value);
  }
  return transformed;
};

console.log("🔍 ===== PORTFOLIO UPDATE DATA TRANSFORMATION DEBUG =====");
console.log("");

// Test with typical update data
const sampleUpdateData = {
  kodeProject: "PRJ-2025-033",
  projectName: "Test Project Update",
  projectType: "procurement",
  divisiInisiasi: "IT",
  grupTerlibat: "Development Team",
  keterangan: "Updated description",
  namaVendor: "Test Vendor",
  noPKSPO: "PKS/2025/033",
  tanggalPKSPO: "2025-08-01T00:00:00.000Z",
  tanggalBAPP: "2025-08-15T00:00:00.000Z",
  tanggalBerakhir: "2025-12-31T00:00:00.000Z"
};

console.log("📋 Original Update Data (camelCase):");
console.log(JSON.stringify(sampleUpdateData, null, 2));
console.log("");

console.log("🔄 Transformed Data (snake_case):");
const transformedData = transformObjectToSnakeCase(sampleUpdateData);
console.log(JSON.stringify(transformedData, null, 2));
console.log("");

console.log("🔍 Key Transformations:");
Object.keys(sampleUpdateData).forEach(key => {
  const snakeKey = camelToSnake(key);
  console.log(`   ${key} → ${snakeKey}`);
});
console.log("");

// Test with problematic data that might cause 400 error
const problematicData = {
  kodeProject: "PRJ-2025-033",
  projectName: "Test Project",
  // Missing required fields?
  projectType: null,
  divisiInisiasi: "",
  // Invalid date format?
  tanggalPKSPO: "invalid-date",
  // Unexpected fields?
  unexpectedField: "should not be here",
  // Nested objects?
  terminPembayaran: [
    {
      id: "term-1",
      termin: "Term 1",
      nominal: 1000000,
      status: "Belum Dibayar"
    }
  ]
};

console.log("⚠️  Potentially Problematic Data:");
console.log(JSON.stringify(problematicData, null, 2));
console.log("");

console.log("🔄 Transformed Problematic Data:");
const transformedProblematicData = transformObjectToSnakeCase(problematicData);
console.log(JSON.stringify(transformedProblematicData, null, 2));
console.log("");

console.log("🎯 POTENTIAL ISSUES THAT COULD CAUSE HTTP 400:");
console.log("1. Missing required fields");
console.log("2. Invalid data types (null where string expected)");
console.log("3. Invalid date formats");
console.log("4. Unexpected fields in payload");
console.log("5. Nested objects not properly handled");
console.log("6. Field validation failures on backend");
console.log("");

console.log("💡 DEBUGGING RECOMMENDATIONS:");
console.log("1. Check browser console for detailed request/response logs");
console.log("2. Verify all required fields are present");
console.log("3. Validate date formats (ISO 8601)");
console.log("4. Check backend API documentation for expected schema");
console.log("5. Test with minimal data first");
