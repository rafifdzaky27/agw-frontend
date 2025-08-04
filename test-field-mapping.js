// Test script to verify field transformations

const camelToSnake = (str) => {
  const specialCases = {
    'kodeProject': 'kode_project',
    'projectName': 'project_name',
    'projectType': 'project_type',
    'divisiInisiasi': 'divisi_inisiasi',
    'grupTerlibat': 'grup_terlibat',
    'namaVendor': 'nama_vendor',
    'noPKSPO': 'no_pks_po',
    'tanggalPKSPO': 'tanggal_pks_po',
    'tanggalBAPP': 'tanggal_bapp',
    'tanggalBerakhir': 'tanggal_berakhir',
    'terminPembayaran': 'termin_pembayaran'
  };
  
  return specialCases[str] || str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
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

console.log("🔍 ===== FIELD MAPPING TEST =====");
console.log("");

// Test data that should match backend requirements
const testData = {
  kodeProject: "PRJ-2025-033",
  projectName: "Test Project Name",
  projectType: "procurement",
  divisiInisiasi: "IT Division",
  grupTerlibat: "Development Team",
  keterangan: "Test description",
  namaVendor: "Test Vendor",
  noPKSPO: "PKS/2025/033",
  tanggalPKSPO: "2025-08-01T00:00:00.000Z",
  tanggalBAPP: "2025-08-15T00:00:00.000Z",
  tanggalBerakhir: "2025-12-31T00:00:00.000Z"
};

console.log("📋 Original Data (camelCase):");
console.log(JSON.stringify(testData, null, 2));
console.log("");

console.log("🔄 Transformed Data (snake_case):");
const transformedData = transformObjectToSnakeCase(testData);
console.log(JSON.stringify(transformedData, null, 2));
console.log("");

console.log("🎯 BACKEND VALIDATION CHECK:");
console.log("");

// Check required fields based on error message
const requiredFields = {
  'project_name': transformedData.project_name,
  'project_type': transformedData.project_type,
  'divisi_inisiasi': transformedData.divisi_inisiasi,
  'grup_terlibat': transformedData.grup_terlibat
};

console.log("📊 Required Fields Status:");
Object.entries(requiredFields).forEach(([field, value]) => {
  if (!value || value === '') {
    console.log(`❌ ${field}: MISSING or EMPTY`);
  } else {
    console.log(`✅ ${field}: "${value}"`);
  }
});

console.log("");
console.log("🔍 Project Type Validation:");
const validProjectTypes = ['internal development', 'procurement', 'non procurement'];
const projectType = transformedData.project_type;

if (validProjectTypes.includes(projectType)) {
  console.log(`✅ project_type: "${projectType}" is VALID`);
} else {
  console.log(`❌ project_type: "${projectType}" is INVALID`);
  console.log(`   Expected one of: ${validProjectTypes.join(', ')}`);
}

console.log("");
console.log("💡 EXPECTED BACKEND PAYLOAD:");
console.log(JSON.stringify(transformedData, null, 2));
