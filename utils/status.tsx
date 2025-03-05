export function getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
        draft: "bg-gray-400",
        waiting_approval: "bg-yellow-500",
        waiting_finalization: "bg-orange-500",
        waiting_migration: "bg-purple-500",
        finishing: "bg-blue-500",
        success: "bg-green-500",
        failed: "bg-red-500",
    };

    return statusColors[status] || "bg-gray-500";
}
