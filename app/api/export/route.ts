import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCheckInsByUserId, getActiveCommitmentByUserId } from "@/lib/db-service";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checkIns = await getCheckInsByUserId(session.id);
  const commitment = await getActiveCommitmentByUserId(session.id);

  // Generate CSV rows
  const headers = ["Date", "Type", "Commitment", "Status", "Planned Actions", "Reflection", "Blocker Tags", "Mood Or Craving", "Lessons Learned"];
  const rows = checkIns.map((c) => {
    const planned = c.plannedActions ? `"${c.plannedActions.join("; ")}"` : "";
    const tags = c.blockerTags ? `"${c.blockerTags.join(", ")}"` : "";
    const reflection = c.reflection ? `"${c.reflection.replace(/"/g, '""')}"` : "";
    const lesson = c.lessonsLearned ? `"${c.lessonsLearned.replace(/"/g, '""')}"` : "";
    
    return [
      c.date,
      c.type,
      `"${commitment?.name || "Anchor Commitment"}"`,
      c.status || "Planned",
      planned,
      reflection,
      tags,
      c.moodOrCraving ?? "",
      lesson,
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="anchor-recovery-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
