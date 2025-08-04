// Test script to verify data transformation
const { transformObjectToCamelCase, transformObjectToSnakeCase } = require('./utils/dataTransform.ts');

// Sample data from API (snake_case)
const sampleSnakeData = {
  "id": "e2798e75-7b4d-4d5e-bfa8-b00f8692725a",
  "kode_project": "PRJ-2025-007",
  "project_name": "ITSP",
  "project_type": "procurement",
  "divisi_inisiasi": "IAG",
  "grup_terlibat": "IAG",
  "keterangan": "mantap",
  "nama_vendor": "OJK",
  "no_pks_po": "PKS/2025/07",
  "tanggal_pks_po": "2025-10-01T00:00:00.000Z",
  "tanggal_bapp": "2025-11-30T00:00:00.000Z",
  "tanggal_berakhir": "2025-12-31T00:00:00.000Z",
  "vendor_id": null,
  "created_at": "2025-08-03T16:16:41.689Z",
  "updated_at": "2025-08-03T16:16:41.689Z",
  "vendor_name": null
};

console.log("Original snake_case data:");
console.log(JSON.stringify(sampleSnakeData, null, 2));

console.log("\nTransformed to camelCase:");
const camelData = transformObjectToCamelCase(sampleSnakeData);
console.log(JSON.stringify(camelData, null, 2));

console.log("\nTransformed back to snake_case:");
const backToSnake = transformObjectToSnakeCase(camelData);
console.log(JSON.stringify(backToSnake, null, 2));

console.log("\nVerification:");
console.log("kode_project -> kodeProject:", sampleSnakeData.kode_project, "->", camelData.kodeProject);
console.log("project_name -> projectName:", sampleSnakeData.project_name, "->", camelData.projectName);
console.log("divisi_inisiasi -> divisiInisiasi:", sampleSnakeData.divisi_inisiasi, "->", camelData.divisiInisiasi);
