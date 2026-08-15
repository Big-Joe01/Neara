import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { appConfig } from '@neara/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NEARA demo data...');

  // ---- Property types
  const propertyTypes = [
    'Self Contain', 'Room and Parlour', '1 Bedroom', '2 Bedroom', '3 Bedroom',
    '4 Bedroom', 'Flat', 'Duplex', 'Shared Apartment', 'Room', 'Studio',
    'Mini Flat', 'Bungalow', 'Apartment', 'Hostel', 'Short-let',
  ];
  for (const name of propertyTypes) {
    await prisma.propertyType.upsert({
      where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      update: {},
    });
  }

  // ---- Amenities
  const amenities = ['WiFi', 'Borehole', 'Prepaid Meter', 'Parking', 'Security', 'AC', 'Wardrobe', 'Balcony', 'Generator', 'Furnished'];
  for (const name of amenities) {
    await prisma.amenity.upsert({
      where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      update: {},
    });
  }

  // ---- Locations
  const locations = [
    { name: 'Yaba', city: 'Lagos', state: 'Lagos' },
    { name: 'Lekki Phase 1', city: 'Lekki', state: 'Lagos' },
    { name: 'Gbagada', city: 'Lagos', state: 'Lagos' },
    { name: 'Surulere', city: 'Lagos', state: 'Lagos' },
    { name: 'Ikeja', city: 'Ikeja', state: 'Lagos' },
    { name: 'Ajah', city: 'Lekki', state: 'Lagos' },
  ];
  for (const loc of locations) {
    await prisma.location.upsert({
      where: { slug: loc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      create: { ...loc, slug: loc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      update: {},
    });
  }

  // ---- Users
  const passwordHash = await bcrypt.hash('Password123', appConfig.jwt.bcryptRounds);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@neara.app' },
    create: {
      email: 'admin@neara.app',
      phone: '08010000000',
      passwordHash,
      role: 'ADMIN',
      displayName: 'NEARA Admin',
      status: 'active',
      isEmailVerified: true,
      isPhoneVerified: true,
      adminProfile: { create: { role: 'super_admin' } },
    },
    update: {},
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@neara.app' },
    create: {
      email: 'customer@neara.app',
      phone: '08011111111',
      passwordHash,
      role: 'CUSTOMER',
      displayName: 'Ada Customer',
      status: 'active',
      isEmailVerified: true,
      isPhoneVerified: true,
      customerProfile: { create: { occupation: 'Software Engineer', employer: 'Tech Co', monthlyIncome: 500000 } },
    },
    update: {},
  });

  const landlord = await prisma.user.upsert({
    where: { email: 'landlord@neara.app' },
    create: {
      email: 'landlord@neara.app',
      phone: '08022222222',
      passwordHash,
      role: 'LANDLORD',
      displayName: 'Mr Landlord',
      status: 'active',
      isEmailVerified: true,
      isPhoneVerified: true,
      isIdentityVerified: true,
      landlordProfile: { create: { companyName: 'Landlord Properties Ltd', isVerified: true, verifiedAt: new Date() } },
    },
    update: {},
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@neara.app' },
    create: {
      email: 'agent@neara.app',
      phone: '08033333333',
      passwordHash,
      role: 'AGENT',
      displayName: 'Grace Agent',
      status: 'active',
      isEmailVerified: true,
      isPhoneVerified: true,
      agentProfile: { create: { agencyName: 'Grace Realty', licenseNumber: 'LAG-2024-001', isVerified: true, verifiedAt: new Date() } },
    },
    update: {},
  });

  // ---- Authorize agent for landlord
  await prisma.agentAuthorization.upsert({
    where: { id: 'seed-auth-1' },
    create: {
      id: 'seed-auth-1',
      agentId: agent.id,
      landlordId: landlord.id,
      status: 'verified',
      source: 'landlord_grant',
      validFrom: new Date(),
      verifiedAt: new Date(),
    },
    update: {},
  });

  // ---- Fee rules (admin-configurable)
  const feeRules = [
    { name: 'Low rent band', minRent: 0, maxRent: 500000, maxPercentage: 5, maxFixedFee: 25000, minFee: null },
    { name: 'Mid rent band', minRent: 500001, maxRent: 1000000, maxPercentage: 5, maxFixedFee: 50000, minFee: null },
    { name: 'High rent band', minRent: 1000001, maxRent: 2000000, maxPercentage: 5, maxFixedFee: 100000, minFee: null },
    { name: 'Premium rent band', minRent: 2000001, maxRent: null, maxPercentage: 5, maxFixedFee: 200000, minFee: null },
  ];
  for (const rule of feeRules) {
    await prisma.feeRule.upsert({
      where: { id: `seed-fee-${rule.name.toLowerCase().replace(/\s+/g, '-')}` },
      create: {
        id: `seed-fee-${rule.name.toLowerCase().replace(/\s+/g, '-')}`,
        ...rule,
        validFrom: new Date(),
        isActive: true,
        createdById: admin.id,
      },
      update: {},
    });
  }

  // ---- Sample properties
  const pt = (name: string) => prisma.propertyType.findUniqueOrThrow({ where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') } });
  const sampleImg = (seed: string) => `https://res.cloudinary.com/demo/image/upload/v1/neara/sample/${seed}.jpg`;

  const propertyData = [
    {
      title: 'Spacious 2 Bedroom Flat in Yaba',
      type: '2 Bedroom',
      rent: 750000,
      city: 'Lagos', area: 'Yaba', state: 'Lagos', address: '12 Yaba Road, Lagos',
      lat: 6.5126, lng: 3.3796,
      source: 'direct' as const,
      bedrooms: 2, bathrooms: 2,
      electricity: 'fair' as const, water: 'reliable' as const,
      description: 'A well-lit 2 bedroom flat in the heart of Yaba. Close to transport, markets, and tech hubs. Prepaid meter installed.',
    },
    {
      title: 'Modern Studio Apartment Lekki Phase 1',
      type: 'Studio',
      rent: 1200000,
      city: 'Lekki', area: 'Lekki Phase 1', state: 'Lagos', address: '5 Admiralty Way, Lekki',
      lat: 6.4474, lng: 3.4084,
      source: 'direct' as const,
      bedrooms: 1, bathrooms: 1,
      electricity: 'excellent' as const, water: 'reliable' as const,
      description: 'A fully furnished modern studio in Lekki Phase 1. Excellent electricity, borehole water, and 24/7 security.',
    },
    {
      title: 'Self Contain in Surulere — Affordable',
      type: 'Self Contain',
      rent: 350000,
      city: 'Lagos', area: 'Surulere', state: 'Lagos', address: '23 Adeniran Ogunsanya, Surulere',
      lat: 6.4936, lng: 3.3533,
      source: 'agent' as const,
      bedrooms: 1, bathrooms: 1,
      electricity: 'fair' as const, water: 'intermittent' as const,
      description: 'Affordable self contain in Surulere. Managed by an authorized NEARA agent. Good for young professionals.',
    },
    {
      title: '3 Bedroom Bungalow in Gbagada',
      type: '3 Bedroom',
      rent: 1800000,
      city: 'Lagos', area: 'Gbagada', state: 'Lagos', address: '8 Ifako Road, Gbagada',
      lat: 6.5475, lng: 3.3843,
      source: 'direct' as const,
      bedrooms: 3, bathrooms: 2,
      electricity: 'excellent' as const, water: 'reliable' as const,
      description: 'Spacious 3 bedroom bungalow with parking for 3 cars, fenced compound, and security gate.',
    },
    {
      title: 'Mini Flat in Ikeja — Direct from Landlord',
      type: 'Mini Flat',
      rent: 600000,
      city: 'Ikeja', area: 'Ikeja', state: 'Lagos', address: '15 Allen Avenue, Ikeja',
      lat: 6.6018, lng: 3.3515,
      source: 'direct' as const,
      bedrooms: 1, bathrooms: 1,
      electricity: 'fair' as const, water: 'reliable' as const,
      description: 'Clean mini flat in Ikeja. Direct from landlord — no agent fee. Prepaid meter and borehole water.',
    },
    {
      title: 'Cozy 1 Bedroom in Ajah',
      type: '1 Bedroom',
      rent: 550000,
      city: 'Lekki', area: 'Ajah', state: 'Lagos', address: '40 Abraham Adesanya, Ajah',
      lat: 6.4676, lng: 3.6012,
      source: 'agent' as const,
      bedrooms: 1, bathrooms: 1,
      electricity: 'fair' as const, water: 'reliable' as const,
      description: 'A cozy 1 bedroom apartment in Ajah. Authorized NEARA agent. Close to the express and shops.',
    },
  ];

  for (let i = 0; i < propertyData.length; i++) {
    const p = propertyData[i]!;
    const type = await pt(p.type);
    const agentFee = p.source === 'agent' ? Math.round((p.rent * 5) / 100) : 0;
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
    const cover = sampleImg(`home-${i + 1}`);

    const property = await prisma.property.upsert({
      where: { slug },
      create: {
        slug,
        title: p.title,
        description: p.description,
        propertyTypeId: type.id,
        rentalPeriod: 'yearly',
        status: 'active',
        listingSource: p.source,
        address: p.address,
        city: p.city,
        state: p.state,
        area: p.area,
        latitude: p.lat,
        longitude: p.lng,
        rent: p.rent,
        cautionFee: Math.round(p.rent * 0.1),
        serviceCharge: 50000,
        legalFee: 25000,
        agentFee,
        otherFees: 0,
        totalMoveIn: p.rent + Math.round(p.rent * 0.1) + 50000 + 25000 + agentFee,
        electricity: p.electricity,
        prepaidMeter: true,
        water: p.water,
        waterSource: p.water === 'reliable' ? 'borehole' : 'tap',
        internet: true,
        generator: false,
        borehole: p.water === 'reliable',
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        kitchen: true,
        parking: 1,
        security: true,
        compound: true,
        fenced: true,
        airConditioning: i === 1,
        furnished: i === 1,
        balcony: false,
        wardrobe: true,
        securityGate: i === 3,
        coverImage: cover,
        landlordId: landlord.id,
        agentId: p.source === 'agent' ? agent.id : null,
        nearaVerified: i % 2 === 0,
        verificationLevel: i % 2 === 0 ? 'neara' : 'none',
        verifiedAt: i % 2 === 0 ? new Date() : null,
        images: {
          create: [
            { url: cover, thumbnailUrl: cover, isCover: true, order: 0 },
            { url: sampleImg(`home-${i + 1}-2`), thumbnailUrl: sampleImg(`home-${i + 1}-2`), isCover: false, order: 1 },
            { url: sampleImg(`home-${i + 1}-3`), thumbnailUrl: sampleImg(`home-${i + 1}-3`), isCover: false, order: 2 },
          ],
        },
      },
      update: {},
    });

    // link authorization to agent properties
    if (p.source === 'agent') {
      await prisma.agentAuthorization.updateMany({
        where: { agentId: agent.id, landlordId: landlord.id },
        data: { propertyId: property.id },
      });
    }
  }

  console.log('✅ Seed complete.');
  console.log('   Admin:    admin@neara.app / Password123');
  console.log('   Customer: customer@neara.app / Password123');
  console.log('   Landlord: landlord@neara.app / Password123');
  console.log('   Agent:    agent@neara.app / Password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
