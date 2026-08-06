-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'FIELD_EXECUTIVE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "leadCode" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "altPhone" TEXT,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pinCode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "propertyType" TEXT NOT NULL DEFAULT 'RESIDENTIAL',
    "connectionType" TEXT NOT NULL DEFAULT 'SINGLE_PHASE',
    "sanctionedLoadKw" DOUBLE PRECISION,
    "avgMonthlyBill" DOUBLE PRECISION,
    "avgMonthlyUnits" DOUBLE PRECISION,
    "leadSource" TEXT,
    "fieldExecutive" TEXT,
    "preferredVisitAt" TIMESTAMP(3),
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteAssessment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "visitStartedAt" TIMESTAMP(3),
    "visitCompletedAt" TIMESTAMP(3),
    "roofType" TEXT,
    "roofCondition" TEXT,
    "totalRoofAreaSqft" DOUBLE PRECISION,
    "usableAreaSqft" DOUBLE PRECISION,
    "floors" INTEGER,
    "buildingAgeYears" INTEGER,
    "roofAccess" TEXT,
    "structurallySound" BOOLEAN,
    "hasLeakageOrCracks" BOOLEAN,
    "roofOrientation" TEXT,
    "roofTiltDegrees" DOUBLE PRECISION,
    "usesMountingStructure" BOOLEAN,
    "proposedPanelTilt" DOUBLE PRECISION,
    "shadingMorning" TEXT NOT NULL DEFAULT 'NONE',
    "shadingPeak" TEXT NOT NULL DEFAULT 'NONE',
    "shadingEvening" TEXT NOT NULL DEFAULT 'NONE',
    "meterNumber" TEXT,
    "discomName" TEXT,
    "meterLocation" TEXT,
    "distanceRoofToMeterM" DOUBLE PRECISION,
    "netMeteringAvailable" BOOLEAN,
    "hasExistingInverter" BOOLEAN,
    "hasExistingSolar" BOOLEAN,
    "spaceNearMeter" BOOLEAN,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VISIT_SCHEDULED',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteObstruction" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT true,
    "heightFt" DOUBLE PRECISION,
    "distanceFt" DOUBLE PRECISION,
    "direction" TEXT,
    "isDeciduous" BOOLEAN,
    "notes" TEXT,

    CONSTRAINT "SiteObstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolarCalculation" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "systemSizeKw" DOUBLE PRECISION NOT NULL,
    "panelCount" INTEGER NOT NULL,
    "panelWattage" INTEGER NOT NULL,
    "inverterType" TEXT,
    "pshHours" DOUBLE PRECISION NOT NULL,
    "pshSource" TEXT NOT NULL DEFAULT 'STATE_AVERAGE',
    "performanceRatio" DOUBLE PRECISION NOT NULL,
    "orientationFactor" DOUBLE PRECISION NOT NULL,
    "shadingLossPct" DOUBLE PRECISION NOT NULL,
    "dustLossPct" DOUBLE PRECISION NOT NULL,
    "temperatureLossPct" DOUBLE PRECISION NOT NULL,
    "cableInverterLossPct" DOUBLE PRECISION NOT NULL,
    "dailyGenKwh" DOUBLE PRECISION NOT NULL,
    "monthlyGenKwh" DOUBLE PRECISION NOT NULL,
    "annualGenKwh" DOUBLE PRECISION NOT NULL,
    "tariffPerUnit" DOUBLE PRECISION NOT NULL,
    "costPerKw" DOUBLE PRECISION NOT NULL,
    "grossCost" DOUBLE PRECISION NOT NULL,
    "subsidyAmount" DOUBLE PRECISION NOT NULL,
    "netCost" DOUBLE PRECISION NOT NULL,
    "monthlySavings" DOUBLE PRECISION NOT NULL,
    "annualSavings" DOUBLE PRECISION NOT NULL,
    "paybackYears" DOUBLE PRECISION NOT NULL,
    "lifetimeSavings25yr" DOUBLE PRECISION NOT NULL,
    "roiPct" DOUBLE PRECISION NOT NULL,
    "co2OffsetAnnualTons" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolarCalculation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_leadCode_key" ON "Lead"("leadCode");

-- CreateIndex
CREATE UNIQUE INDEX "SiteAssessment_leadId_key" ON "SiteAssessment"("leadId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteAssessment" ADD CONSTRAINT "SiteAssessment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteObstruction" ADD CONSTRAINT "SiteObstruction_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "SiteAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolarCalculation" ADD CONSTRAINT "SolarCalculation_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "SiteAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

