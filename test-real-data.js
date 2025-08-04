// Test script with real API data
const realApiData = {
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
  "vendor_name": null,
  "vendor_address": null,
  "vendor_phone": null,
  "terminPembayaran": [
    {
      "id": "a8365d3f-b5b7-4022-972e-d5df142cf76c",
      "project_id": "e2798e75-7b4d-4d5e-bfa8-b00f8692725a",
      "termin": "oke",
      "nominal": 10000000,
      "description": "oke",
      "status": "Belum Dibayar",
      "payment_date": null,
      "budget_type": null,
      "notes": null,
      "opex_cabang": null,
      "opex_pusat": null,
      "created_at": "2025-08-03T16:16:41.689Z",
      "updated_at": "2025-08-03T16:16:41.689Z"
    },
    {
      "id": "13661f2b-8d15-4f6f-bc75-4687d0f6c3a4",
      "project_id": "e2798e75-7b4d-4d5e-bfa8-b00f8692725a",
      "termin": "mantap",
      "nominal": 20000000,
      "description": "mantap",
      "status": "Belum Dibayar",
      "payment_date": null,
      "budget_type": null,
      "notes": null,
      "opex_cabang": null,
      "opex_pusat": null,
      "created_at": "2025-08-03T16:16:41.689Z",
      "updated_at": "2025-08-03T16:16:41.689Z"
    }
  ],
  "files": [],
  "paymentStats": {
    "total_terms": "2",
    "paid_terms": "0",
    "total_value": 30000000,
    "paid_value": 0,
    "capex_value": 0,
    "opex_value": 0
  },
  "paymentStatus": {
    "status": "Not Started",
    "color": "gray"
  }
};

// Simple transformation functions for testing
const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

const transformObjectToCamelCase = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(transformObjectToCamelCase);
  
  const transformed = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = snakeToCamel(key);
    
    // Special handling for nested arrays that need transformation
    if (Array.isArray(value)) {
      transformed[camelKey] = value.map(transformObjectToCamelCase);
    } else if (value && typeof value === 'object') {
      transformed[camelKey] = transformObjectToCamelCase(value);
    } else {
      transformed[camelKey] = value;
    }
  }
  return transformed;
};

console.log("=== ORIGINAL DATA ===");
console.log("terminPembayaran exists:", !!realApiData.terminPembayaran);
console.log("terminPembayaran length:", realApiData.terminPembayaran?.length);
console.log("files exists:", !!realApiData.files);
console.log("files length:", realApiData.files?.length);

console.log("\n=== TRANSFORMED DATA ===");
const transformed = transformObjectToCamelCase(realApiData);
console.log("terminPembayaran exists:", !!transformed.terminPembayaran);
console.log("terminPembayaran length:", transformed.terminPembayaran?.length);
console.log("files exists:", !!transformed.files);
console.log("files length:", transformed.files?.length);

console.log("\n=== TERMIN PEMBAYARAN DETAILS ===");
if (transformed.terminPembayaran) {
  transformed.terminPembayaran.forEach((term, index) => {
    console.log(`Term ${index + 1}:`, {
      id: term.id,
      termin: term.termin,
      nominal: term.nominal,
      description: term.description
    });
  });
}

console.log("\n=== TRANSFORMATION SUCCESS ===");
console.log("✅ Data transformation completed successfully");
