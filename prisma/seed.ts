import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.solarCalculation.deleteMany();
  await prisma.siteObstruction.deleteMany();
  await prisma.siteAssessment.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  const demoUsers = [
    { name: "Alex Miller", email: "field@helios.dev", role: "FIELD_EXECUTIVE", password: "field1234" },
    { name: "Priya Nair", email: "manager@helios.dev", role: "MANAGER", password: "manager1234" },
    { name: "Sam Okafor", email: "admin@helios.dev", role: "ADMIN", password: "admin1234" },
  ];

  for (const u of demoUsers) {
    await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        role: u.role,
        passwordHash: await bcrypt.hash(u.password, 10),
      },
    });
  }
  console.log("Seeded demo users (email / password):");
  for (const u of demoUsers) console.log(`  ${u.email} / ${u.password}  [${u.role}]`);

  const leads = [
    {
      leadCode: "HEL-4492-AX",
      customerName: "Jonathan Sterling",
      phone: "+91 98765 43210",
      address: "842 Oakwood Crest",
      city: "Austin",
      state: "Rajasthan",
      pinCode: "78745",
      lat: 30.7333,
      lng: 76.7794,
      propertyType: "RESIDENTIAL",
      connectionType: "SINGLE_PHASE",
      sanctionedLoadKw: 8,
      avgMonthlyBill: 4200,
      avgMonthlyUnits: 520,
      leadSource: "Referral",
      fieldExecutive: "Alex Miller",
      status: "VISIT_IN_PROGRESS",
    },
    {
      leadCode: "HEL-9011-VM",
      customerName: "Araceli Velez",
      phone: "+91 98450 11223",
      address: "1901 Mariposa Ln",
      city: "San Jose",
      state: "Gujarat",
      pinCode: "380001",
      lat: 23.0225,
      lng: 72.5714,
      propertyType: "RESIDENTIAL",
      connectionType: "SINGLE_PHASE",
      sanctionedLoadKw: 5,
      avgMonthlyBill: 2800,
      avgMonthlyUnits: 340,
      leadSource: "Website",
      fieldExecutive: "Alex Miller",
      status: "VISIT_SCHEDULED",
    },
    {
      leadCode: "HEL-3381-TX",
      customerName: "Marcus Thorne",
      phone: "+91 99887 66554",
      address: "442 West Pine Dr",
      city: "Phoenix",
      state: "Maharashtra",
      pinCode: "411001",
      lat: 18.5204,
      lng: 73.8567,
      propertyType: "RESIDENTIAL",
      connectionType: "SINGLE_PHASE",
      sanctionedLoadKw: 6,
      avgMonthlyBill: 3600,
      avgMonthlyUnits: 410,
      leadSource: "Walk-in",
      fieldExecutive: "Alex Miller",
      status: "ASSESSMENT_COMPLETE",
    },
    {
      leadCode: "HEL-8821",
      customerName: "Harrison Residence",
      phone: "+91 91234 56780",
      address: "12.4 mi Sector 4",
      city: "Fremont",
      state: "Karnataka",
      pinCode: "94043",
      lat: 12.9716,
      lng: 77.5946,
      propertyType: "RESIDENTIAL",
      connectionType: "THREE_PHASE",
      sanctionedLoadKw: 15,
      avgMonthlyBill: 9800,
      avgMonthlyUnits: 1150,
      leadSource: "Campaign",
      fieldExecutive: "Alex Miller",
      status: "VISIT_IN_PROGRESS",
      notes: "Structural reinforcement required before install.",
    },
    {
      leadCode: "HEL-8819",
      customerName: "Stark Logistics Center",
      phone: "+91 90000 12345",
      address: "45.0 mi Industrial Zone",
      city: "Beverly Hills",
      state: "Punjab",
      pinCode: "90210",
      lat: 30.901,
      lng: 75.8573,
      propertyType: "INDUSTRIAL",
      connectionType: "THREE_PHASE",
      sanctionedLoadKw: 300,
      avgMonthlyBill: 185000,
      avgMonthlyUnits: 22000,
      leadSource: "Cold Call",
      fieldExecutive: "Alex Miller",
      status: "VISIT_SCHEDULED",
    },
    {
      leadCode: "HEL-8815",
      customerName: "Miller Estate",
      phone: "+91 98123 45670",
      address: "2.1 mi Green Valley",
      city: "Mountain View",
      state: "Tamil Nadu",
      pinCode: "94040",
      lat: 13.0827,
      lng: 80.2707,
      propertyType: "RESIDENTIAL",
      connectionType: "SINGLE_PHASE",
      sanctionedLoadKw: 10,
      avgMonthlyBill: 5200,
      avgMonthlyUnits: 610,
      leadSource: "Referral",
      fieldExecutive: "Alex Miller",
      status: "PROPOSAL_GENERATED",
    },
  ];

  for (const lead of leads) {
    await prisma.lead.create({ data: lead });
  }

  // Give the flagship lead (used across the visit-wizard mockups) a fully
  // populated in-progress assessment so every screen has real data to render.
  const flagship = await prisma.lead.findUnique({ where: { leadCode: "HEL-4492-AX" } });
  if (flagship) {
    const assessment = await prisma.siteAssessment.create({
      data: {
        leadId: flagship.id,
        visitStartedAt: new Date(),
        roofType: "FLAT_RCC",
        roofCondition: "GOOD",
        totalRoofAreaSqft: 1200,
        usableAreaSqft: 950,
        floors: 2,
        buildingAgeYears: 8,
        roofAccess: "Easy",
        structurallySound: true,
        hasLeakageOrCracks: false,
        roofOrientation: "SOUTH",
        roofTiltDegrees: 0,
        usesMountingStructure: true,
        proposedPanelTilt: 15,
        shadingMorning: "NONE",
        shadingPeak: "PARTIAL",
        shadingEvening: "PARTIAL",
        discomName: "MSEDCL",
        meterLocation: "Outside",
        distanceRoofToMeterM: 12,
        netMeteringAvailable: true,
        hasExistingInverter: false,
        hasExistingSolar: false,
        spaceNearMeter: true,
        status: "VISIT_IN_PROGRESS",
      },
    });

    await prisma.siteObstruction.createMany({
      data: [
        { assessmentId: assessment.id, type: "trees", present: true, heightFt: 18.5, distanceFt: 12, isDeciduous: false },
        { assessmentId: assessment.id, type: "water_tank", present: false },
        { assessmentId: assessment.id, type: "neighboring_building", present: false },
      ],
    });
  }

  console.log(`Seeded ${leads.length} leads.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
