const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create 5 users
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.client.user.create({
      data: {
        username: `user${i}`,
        email: `user${i}@example.com`,
        passwordHash: '$2b$10$dummy.hash.for.seeding.purposes.only', // This is a dummy hash
        fullName: `User ${i} Full Name`,
        bio: `This is the bio for user ${i}`,
        avatarUrl: `https://example.com/avatar${i}.jpg`,
        coverPhotoUrl: `https://example.com/cover${i}.jpg`,
        location: `City ${i}`,
        phone: `+123456789${i}`,
        isVerified: i % 2 === 0, // Alternate verified status
      },
    });
    users.push(user);
    console.log(`✅ Created user: ${user.username}`);
  }

  // Create 10 sample interests
  const sampleInterests = [
    'Technology',
    'Sports',
    'Music',
    'Travel',
    'Food',
    'Art',
    'Books',
    'Movies',
    'Gaming',
    'Photography',
    'Fitness',
    'Cooking',
    'Nature',
    'Fashion',
    'Science',
    'History',
    'Politics',
    'Business',
    'Health',
    'Education',
  ];

  // Create UserInterest for each user with 10 random interests
  for (const user of users) {
    // Select 10 random interests for each user
    const shuffled = [...sampleInterests].sort(() => 0.5 - Math.random());
    const selectedInterests = shuffled.slice(0, 10);

    const userInterest = await prisma.client.userInterest.create({
      data: {
        userId: user.id,
        photoURL: `https://example.com/interest-photo-${user.username}.jpg`,
        interest: selectedInterests,
      },
    });

    console.log(`✅ Created interests for ${user.username}: ${selectedInterests.join(', ')}`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });