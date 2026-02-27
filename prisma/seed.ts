import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('superadmin', 10)

    try {
        await prisma.user.deleteMany({
            where: { role: { not: 'SUPERADMIN' } }
        });
        console.log('Wiped all non-superadmin mock accounts. Ready for production.');
    } catch (e) {
        console.error('Error wiping mock accounts', e);
    }

    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@dlsud.edu.ph' },
        update: {
            password: hashedPassword,
            role: 'SUPERADMIN',
            verified: true,
        },
        create: {
            email: 'superadmin@dlsud.edu.ph',
            password: hashedPassword,
            role: 'SUPERADMIN',
            verified: true,
        },
    })
    console.log('Super admin created/verified:', superAdmin.email)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
