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

        // 1. Ensure Main Academy School exists (atomic operation)
        const [school, schoolCreated] = await School.findOrCreate({
            where: { name: 'FikrahTech Main Academy' },
            defaults: {
                name: 'FikrahTech Main Academy',
                is_blocked: false,
                current_session: '2024/2025',
                current_term: 'First Term'
            }
        });
        console.log('✅ SCHOOL CHECK COMPLETE');

        // 2. Create or Update Super Admin (atomic operation) - Use plain text, let model hooks hash it
        const [user, userCreated] = await User.findOrCreate({
            where: { email: adminCredentials.email },
            defaults: {
                email: adminCredentials.email,
                password: adminCredentials.plainPassword, // Let User model hooks handle hashing
                role: 'super_admin',
                school_id: null,
                name: adminCredentials.name
            }
        });

        if (userCreated) {
            console.log('✅ NEW Super Admin created successfully');
            console.log(`📧 Email: ${adminCredentials.email}`);
            console.log(`👤 Name: ${adminCredentials.name}`);
            console.log(`🏫 School ID: null`);
        } else {
            // Update existing user's password and role - Use plain text, let model hooks hash it
            await user.update({
                password: adminCredentials.plainPassword, // Let User model hooks handle hashing
                role: 'super_admin',
                school_id: null,
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
