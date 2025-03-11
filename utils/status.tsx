export function getStatusColor(status: string | undefined): string {
    const statusColors: Record<string, string> = {
        draft: "#6B7280",  // Gray-400
        waiting_approval: "#F59E0B", // Yellow-500
        waiting_finalization: "#F97316", // Orange-500
        waiting_migration: "#A855F7", // Purple-500
        finishing: "#3B82F6", // Blue-500
        success: "#16A34A", // Green-500
        failed: "#EF4444", // Red-500
    };

    if (!status){
      return "#808080"; // Gray
    }

    return statusColors[status.toLowerCase()] || "#808080"; // Gray
}