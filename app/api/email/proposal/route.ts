import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth-helpers";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  await requireSession();

  const { leadId } = (await request.json()) as { leadId?: string };
  if (!leadId) return NextResponse.json({ error: "Missing leadId" }, { status: 400 });

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      assessment: {
        include: {
          calculations: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const calculation = lead?.assessment?.calculations[0];
  if (!lead || !calculation) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (!lead.email) {
    return NextResponse.json({ error: "Lead does not have an email address" }, { status: 400 });
  }

  const proposalUrl = new URL(`/leads/${lead.id}/proposal`, request.url).toString();
  const money = (value: number) => `Rs ${Math.round(value).toLocaleString("en-IN")}`;

  const result = await sendEmail({
    to: lead.email,
    subject: `Solar proposal for ${lead.customerName}`,
    text: `Your ${calculation.systemSizeKw.toFixed(1)} kWp solar proposal is ready: ${proposalUrl}`,
    html: `
      <h1>Solar proposal ready</h1>
      <p>Hello ${lead.customerName},</p>
      <p>Your ${calculation.systemSizeKw.toFixed(1)} kWp solar proposal is ready for review.</p>
      <p><strong>Estimated net cost:</strong> ${money(calculation.netCost)}</p>
      <p><strong>Estimated annual savings:</strong> ${money(calculation.annualSavings)}</p>
      <p><a href="${proposalUrl}">View proposal</a></p>
    `,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 502 });
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: "PROPOSAL_SENT" },
  });

  return NextResponse.json({ id: result.data?.id });
}
