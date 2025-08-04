// Test script for date handling issues

console.log("🔍 ===== DATE HANDLING TEST =====");
console.log("");

// Test various date formats that might come from backend
const testDates = [
  "2025-08-01T00:00:00.000Z",
  "2025-08-01",
  "2025-08-01T00:00:00",
  null,
  undefined,
  "",
  "0",
  0,
  "1970-01-01T00:00:00.000Z"
];

console.log("📅 Testing date formats:");
console.log("");

testDates.forEach((dateInput, index) => {
  console.log(`Test ${index + 1}: Input = ${JSON.stringify(dateInput)}`);
  
  try {
    if (!dateInput) {
      console.log("   Result: Empty input → ''");
      console.log("");
      return;
    }
    
    const date = new Date(dateInput);
    const timestamp = date.getTime();
    
    console.log(`   Date object: ${date}`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Is valid: ${!isNaN(timestamp)}`);
    console.log(`   Is epoch (1970): ${timestamp === 0}`);
    
    if (isNaN(timestamp) || timestamp === 0) {
      console.log("   Result: Invalid/Epoch → ''");
    } else {
      const formatted = date.toISOString().split('T')[0];
      console.log(`   Result: Valid → '${formatted}'`);
    }
    
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    console.log("   Result: Error → ''");
  }
  
  console.log("");
});

console.log("🔍 COMMON DATE ISSUES:");
console.log("");
console.log("1. ❌ Epoch Time (1970-01-01):");
console.log("   - Caused by: timestamp 0, null dates, invalid parsing");
console.log("   - Solution: Check for timestamp === 0");
console.log("");

console.log("2. ❌ Invalid Date Objects:");
console.log("   - Caused by: malformed date strings");
console.log("   - Solution: Check isNaN(date.getTime())");
console.log("");

console.log("3. ❌ Timezone Issues:");
console.log("   - Caused by: local vs UTC time");
console.log("   - Solution: Use consistent UTC formatting");
console.log("");

console.log("✅ RECOMMENDED DATE HANDLING:");
console.log("");
console.log("const formatDateForInput = (dateString) => {");
console.log("  if (!dateString) return '';");
console.log("  ");
console.log("  const date = new Date(dateString);");
console.log("  if (isNaN(date.getTime()) || date.getTime() === 0) {");
console.log("    return '';");
console.log("  }");
console.log("  ");
console.log("  return date.toISOString().split('T')[0];");
console.log("};");
console.log("");

console.log("const formatDateForBackend = (dateString) => {");
console.log("  if (!dateString) return '';");
console.log("  ");
console.log("  const date = new Date(dateString + 'T00:00:00.000Z');");
console.log("  if (isNaN(date.getTime())) return '';");
console.log("  ");
console.log("  return date.toISOString();");
console.log("};");
