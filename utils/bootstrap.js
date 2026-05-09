const { User, School } = require('../models');
const bcrypt = require('bcryptjs');

/**
 * Bootstrap System - Initializes database with default School and Super Admin
 * Ensures atomic operations and proper relational integrity
 */
async function bootstrapSystem() {
    try {
        console.log('🚀 Starting FikrahTech System Bootstrap...');
        
        // Default admin credentials (CHANGE IN PRODUCTION)
        const adminCredentials = {
            name: 'Yunus Abdulhamid',
            email: 'yunusabdulhameed1@gmail.com',
            plainPassword: 'Admin@123' // TODO: Change in production
        };

        // Hash the admin password securely
        const hashedPassword = await bcrypt.hash(adminCredentials.plainPassword, 12);
        console.log('🔐 Password hashed successfully');
        console.log('🔍 DEBUG: Original password:', adminCredentials.plainPassword);
        console.log('🔍 DEBUG: Hashed password length:', hashedPassword.length);
        console.log('🔍 DEBUG: Hashed password preview:', hashedPassword.substring(0, 20) + '...');

        // 1. Ensure Main Academy School exists (atomic operation)
        const [school, schoolCreated] = await School.findOrCreate({
            where: { id: 1 },
            defaults: {
                id: 1,
                name: 'FikrahTech Main Academy',
                is_blocked: false,
                current_session: '2024/2025',
                current_term: 'First Term'
            }
        });

        if (schoolCreated) {
            console.log('✅ Main Academy School created successfully');
        } else {
            console.log('ℹ️ Main Academy School already exists');
        }

        // 2. Create or Update Super Admin (atomic operation)
        const [user, userCreated] = await User.findOrCreate({
            where: { email: adminCredentials.email },
            defaults: {
                email: adminCredentials.email,
                password: hashedPassword,
                role: 'super_admin',
                school_id: school.id,
                name: adminCredentials.name
            }
        });

        if (userCreated) {
            console.log('✅ NEW Super Admin created successfully');
            console.log(`📧 Email: ${adminCredentials.email}`);
            console.log(`👤 Name: ${adminCredentials.name}`);
            console.log(`🏫 School ID: ${school.id}`);
        } else {
            // Update existing user's password and role
            await user.update({
                password: hashedPassword,
                role: 'super_admin',
                school_id: school.id,
                name: adminCredentials.name
            });
            console.log('✅ Existing Super Admin updated successfully');
            console.log(`📧 Email: ${adminCredentials.email}`);
            console.log(`👤 Name: ${adminCredentials.name}`);
        }

        // 3. Security Reminder
        console.log('⚠️ SECURITY REMINDER: Change default password in production!');
        console.log('🎯 Default Login Credentials:');
        console.log(`   Email: ${adminCredentials.email}`);
        console.log(`   Password: ${adminCredentials.plainPassword}`);

        console.log('🎉 FikrahTech System Bootstrap Complete!');
        return {
            success: true,
            school,
            user,
            credentials: {
                email: adminCredentials.email,
                password: adminCredentials.plainPassword
            }
        };

    } catch (error) {
        console.error('❌ Bootstrap System Failed:', error);
        throw new Error(`System bootstrap failed: ${error.message}`);
    }
}

module.exports = { bootstrapSystem };
