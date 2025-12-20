const { prisma } = require('../src/lib/prisma')

async function migrateAdmins() {
  try {
    console.log('Checking current admins...')

    // Get all admins
    const allAdmins = await prisma.admin.findMany()
    console.log(`Found ${allAdmins.length} admins in total`)

    for (const admin of allAdmins) {
      console.log(`Admin ${admin.id}:`)
      console.log(`  Email: ${admin.email}`)
      console.log(`  Name: ${admin.name}`)
      console.log(`  FirstName: ${admin.firstName}`)
      console.log(`  LastName: ${admin.lastName}`)
      console.log(`  PhoneNumber: ${admin.phoneNumber}`)
      console.log('---')
    }

    console.log('Check completed!')
  } catch (error) {
    console.error('Check failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateAdmins()