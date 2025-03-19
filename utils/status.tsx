export function getStatusColor(status: string | undefined): string {
  const statusColors: Record<string, string> = {
      draft: "#9CA3AF",          // Gray-500
      waiting_approval: "#E57373",  // Pastel Red
      waiting_finalization: "#7986CB", // Lavender
      waiting_migration: "#FFB74D",   // Turquoise
      success: "#66BB6A",          // Light Green
      failed: "#EF5350",           // Soft Red
  };

  if (!status){
    return "#808080"; // Gray
  }

  return statusColors[status.toLowerCase()] || "#808080"; // Gray
}