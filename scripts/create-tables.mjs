#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase connection details
const SUPABASE_URL = 'https://supa.gangerdermatology.com';
const SUPABASE_SERVICE_KEY = 'sb_secret_v5sXkhM2ouPpiR5axMqYIQ_Db7TwDVc';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function executeSQLStatement(sql, description) {
    log(`\nExecuting: ${description}`, 'yellow');
    
    try {
        // Try the SQL execution endpoint
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ sql })
        });

        if (!response.ok) {
            // Try alternative approach using direct SQL
            const altResponse = await fetch(`${SUPABASE_URL}/sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_SERVICE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
                },
                body: JSON.stringify({ query: sql })
            });

            if (!altResponse.ok) {
                const errorText = await altResponse.text();
                throw new Error(`HTTP ${altResponse.status}: ${errorText}`);
            }
            
            log('✅ Success (alternative method)', 'green');
            return true;
        }
        
        log('✅ Success', 'green');
        return true;
    } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
        return false;
    }
}

async function createEssentialTables() {
    log('🚀 Starting essential tables creation for Ganger Platform...', 'cyan');
    
    // Read the SQL file
    const sqlFilePath = join(__dirname, 'create-essential-tables.sql');
    let sqlContent;
    
    try {
        sqlContent = readFileSync(sqlFilePath, 'utf8');
        log('📄 SQL file read successfully', 'blue');
    } catch (error) {
        log(`❌ Error reading SQL file: ${error.message}`, 'red');
        process.exit(1);
    }

    // Split SQL into logical chunks for better error handling
    const sqlSections = [
        {
            description: "Extensions",
            sql: `
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
                CREATE EXTENSION IF NOT EXISTS "pgcrypto";
            `
        },
        {
            description: "User Profiles Table",
            sql: `
                CREATE TABLE IF NOT EXISTS public.user_profiles (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
                    email TEXT UNIQUE NOT NULL,
                    full_name TEXT,
                    role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff', 'intern', 'viewer')),
                    location TEXT DEFAULT 'Multiple',
                    position TEXT,
                    phone TEXT,
                    avatar_url TEXT,
                    metadata JSONB DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `
        },
        {
            description: "Teams Table",
            sql: `
                CREATE TABLE IF NOT EXISTS public.teams (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    name TEXT UNIQUE NOT NULL,
                    description TEXT,
                    settings JSONB DEFAULT '{}',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `
        },
        {
            description: "Team Members Table",
            sql: `
                CREATE TABLE IF NOT EXISTS public.team_members (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
                    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                    role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
                    joined_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(team_id, user_id)
                );
            `
        },
        {
            description: "App Permissions Table",
            sql: `
                CREATE TABLE IF NOT EXISTS public.app_permissions (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                    app_name TEXT NOT NULL,
                    permission_level TEXT DEFAULT 'read' CHECK (permission_level IN ('read', 'write', 'admin')),
                    granted_at TIMESTAMPTZ DEFAULT NOW(),
                    granted_by UUID REFERENCES auth.users(id),
                    UNIQUE(user_id, app_name)
                );
            `
        },
        {
            description: "Audit Logs Table",
            sql: `
                CREATE TABLE IF NOT EXISTS public.audit_logs (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_id UUID REFERENCES auth.users(id),
                    action TEXT NOT NULL,
                    resource_type TEXT,
                    resource_id UUID,
                    details JSONB DEFAULT '{}',
                    ip_address INET,
                    user_agent TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
            `
        },
        {
            description: "Enable Row Level Security",
            sql: `
                ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.app_permissions ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
            `
        },
        {
            description: "RLS Policy - User Profiles View",
            sql: `
                CREATE POLICY "Users can view all profiles" ON public.user_profiles
                    FOR SELECT TO authenticated
                    USING (true);
            `
        },
        {
            description: "RLS Policy - User Profiles Update",
            sql: `
                CREATE POLICY "Users can update own profile" ON public.user_profiles
                    FOR UPDATE TO authenticated
                    USING (auth.uid() = user_id);
            `
        },
        {
            description: "RLS Policy - Teams View",
            sql: `
                CREATE POLICY "Authenticated users can view teams" ON public.teams
                    FOR SELECT TO authenticated
                    USING (true);
            `
        },
        {
            description: "RLS Policy - Team Members View",
            sql: `
                CREATE POLICY "Users can view team members" ON public.team_members
                    FOR SELECT TO authenticated
                    USING (true);
            `
        },
        {
            description: "RLS Policy - App Permissions View",
            sql: `
                CREATE POLICY "Users can view own permissions" ON public.app_permissions
                    FOR SELECT TO authenticated
                    USING (auth.uid() = user_id);
            `
        },
        {
            description: "RLS Policy - Audit Logs View",
            sql: `
                CREATE POLICY "Admins can view all logs" ON public.audit_logs
                    FOR SELECT TO authenticated
                    USING (
                        EXISTS (
                            SELECT 1 FROM public.user_profiles
                            WHERE user_profiles.user_id = auth.uid()
                            AND user_profiles.role = 'admin'
                        )
                    );
            `
        },
        {
            description: "Performance Indexes",
            sql: `
                CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
                CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
                CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
                CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
                CREATE INDEX IF NOT EXISTS idx_app_permissions_user_id ON public.app_permissions(user_id);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
            `
        },
        {
            description: "User Creation Function",
            sql: `
                CREATE OR REPLACE FUNCTION public.handle_new_user()
                RETURNS TRIGGER AS $$
                BEGIN
                    INSERT INTO public.user_profiles (user_id, email, full_name, avatar_url)
                    VALUES (
                        NEW.id,
                        NEW.email,
                        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
                        NEW.raw_user_meta_data->>'avatar_url'
                    );
                    
                    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, details)
                    VALUES (
                        NEW.id,
                        'user.signup',
                        'user',
                        NEW.id,
                        jsonb_build_object(
                            'email', NEW.email,
                            'provider', NEW.raw_app_meta_data->>'provider'
                        )
                    );
                    
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql SECURITY DEFINER;
            `
        },
        {
            description: "User Creation Trigger",
            sql: `
                DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
                CREATE TRIGGER on_auth_user_created
                    AFTER INSERT ON auth.users
                    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
            `
        },
        {
            description: "Update Timestamp Function",
            sql: `
                CREATE OR REPLACE FUNCTION public.update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = NOW();
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `
        },
        {
            description: "Update Timestamp Triggers",
            sql: `
                CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
                    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

                CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
                    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
            `
        },
        {
            description: "Grant Permissions",
            sql: `
                GRANT USAGE ON SCHEMA public TO authenticated;
                GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
                GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
                GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
            `
        },
        {
            description: "Default Team",
            sql: `
                INSERT INTO public.teams (name, description) 
                VALUES ('Ganger Dermatology', 'Main organization team')
                ON CONFLICT (name) DO NOTHING;
            `
        }
    ];

    let successCount = 0;
    let failureCount = 0;

    // Execute each section
    for (const section of sqlSections) {
        const success = await executeSQLStatement(section.sql.trim(), section.description);
        if (success) {
            successCount++;
        } else {
            failureCount++;
        }
    }

    // Summary
    log('\n📊 Execution Summary:', 'magenta');
    log(`✅ Successful operations: ${successCount}`, 'green');
    log(`❌ Failed operations: ${failureCount}`, 'red');

    if (failureCount === 0) {
        log('\n🎉 All essential tables created successfully!', 'green');
        log('The following have been set up:', 'cyan');
        log('• User profiles table with role-based access', 'blue');
        log('• Teams and team members tables', 'blue');
        log('• App permissions management', 'blue');
        log('• Audit logging system', 'blue');
        log('• Row Level Security policies', 'blue');
        log('• Performance indexes', 'blue');
        log('• Automatic user creation triggers', 'blue');
        log('\n✅ Authentication should now work properly!', 'green');
    } else {
        log('\n⚠️  Some operations failed. Please review the errors above.', 'yellow');
        process.exit(1);
    }
}

// Run the script
createEssentialTables().catch(error => {
    log(`❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
});