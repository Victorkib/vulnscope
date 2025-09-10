# 🗄️ MongoDB Data Seeding Guide

This guide explains how to set up and seed your MongoDB database with sample data for the VulnScope project.

## 📋 Overview

The VulnScope project includes comprehensive MongoDB seeding scripts that populate your database with realistic sample data for testing and development purposes.

## 🚀 Quick Start

### Option 1: Essential Data Setup (Recommended for Development)
```bash
# Reset database and seed essential data
npm run db:setup
```

### Option 2: Full Data Setup (Complete Dataset)
```bash
# Reset database and seed all data
npm run db:setup-full
```

## 📊 Available Seeding Scripts

### Core Seeding Commands

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run seed:vulnerabilities` | Seed vulnerability data only | Quick vulnerability testing |
| `npm run seed:user-data` | Seed basic user data | User functionality testing |
| `npm run seed:essential` | Seed essential collections | Development setup |
| `npm run seed:all` | Seed all collections | Complete testing environment |
| `npm run db:reset` | Clear all collections | Clean slate |
| `npm run db:setup` | Reset + essential data | Standard development setup |
| `npm run db:setup-full` | Reset + all data | Complete testing setup |

## 🗂️ Collections and Data

### Essential Collections (seed:essential)
- **vulnerabilities** - 35+ realistic CVE records with full metadata
- **user_bookmarks** - 20 sample bookmarks
- **user_activity** - 50 activity records
- **saved_searches** - 10 saved search configurations
- **user_preferences** - 5 user preference sets
- **system_config** - Basic system configuration

### Full Collections (seed:all)
All essential collections plus:
- **notifications** - 100 notification records
- **alert_rules** - 25 custom alert rules
- **teams** - 5 collaboration teams
- **discussions** - 30 team discussions
- **shared_vulnerabilities** - 40 shared vulnerability records
- **admin_users** - Admin user management
- **admin_audit_logs** - Admin audit trail
- **system_config** - Extended system configuration

## 🔧 Manual Seeding

### Individual Scripts
```bash
# Seed vulnerabilities only
npm run seed:vulnerabilities

# Seed user data only
npm run seed:user-data

# Reset database
npm run db:reset
```

### Programmatic Usage
```typescript
import { seedAllData } from '@/scripts/seed-all-data';
import { seedEssentialData } from '@/scripts/seed-essential-data';
import { resetDatabase } from '@/scripts/reset-database';

// Reset and seed all data
await resetDatabase();
await seedAllData();

// Or just essential data
await resetDatabase();
await seedEssentialData();
```

## 📈 Sample Data Details

### Vulnerabilities
- **35+ realistic CVEs** with complete metadata
- **CVSS scores** and vectors
- **EPSS data** and threat intelligence
- **Exploit availability** and maturity
- **Mitigation strategies** and workarounds
- **Related CVEs** and references
- **Categories**: RCE, XSS, SQL Injection, Buffer Overflow, etc.

### User Data
- **5 sample users** with consistent IDs
- **Bookmarks** with priorities and tags
- **Activity logs** with timestamps and metadata
- **Saved searches** with realistic filters
- **Preferences** with various configurations
- **Notifications** with different types and priorities

### Team Collaboration
- **5 security teams** with different focuses
- **Team members** with various roles
- **Discussions** about vulnerabilities
- **Shared vulnerabilities** with team context
- **Collaboration settings** and permissions

### Admin System
- **Admin users** with different roles
- **Audit logs** for admin actions
- **System configuration** settings
- **Permission management**

## 🛠️ Customization

### Adding Custom Data
You can modify the seeding scripts to add your own data:

1. **Edit sample data arrays** in the seeding scripts
2. **Add new collections** by extending the scripts
3. **Modify data relationships** by updating the helper functions

### Example: Adding Custom Vulnerabilities
```typescript
// In src/scripts/seed-vulnerabilities.ts
const customVulnerabilities = [
  {
    cveId: 'CVE-2024-CUSTOM-001',
    title: 'Custom Vulnerability',
    description: 'Your custom vulnerability description',
    severity: 'HIGH',
    cvssScore: 8.5,
    // ... other fields
  }
];

// Add to the vulnerabilities array
vulnerabilities.push(...customVulnerabilities);
```

## 🔍 Verification

### Check Seeded Data
```bash
# Check if data was seeded successfully
npm run admin:status

# Or check specific collections in MongoDB
# Connect to your MongoDB instance and run:
db.vulnerabilities.countDocuments()
db.user_bookmarks.countDocuments()
db.teams.countDocuments()
```

### Expected Counts
After running `npm run seed:all`:
- **vulnerabilities**: ~35 documents
- **user_bookmarks**: 50 documents
- **user_activity**: 200 documents
- **saved_searches**: 30 documents
- **user_preferences**: 10 documents
- **notifications**: 100 documents
- **alert_rules**: 25 documents
- **teams**: 5 documents
- **discussions**: 30 documents
- **shared_vulnerabilities**: 40 documents

## 🚨 Troubleshooting

### Common Issues

#### 1. Connection Errors
```
Error: Failed to connect to MongoDB
```
**Solution**: Check your MongoDB connection string in `src/lib/mongodb.ts`

#### 2. Permission Errors
```
Error: Not authorized to perform operation
```
**Solution**: Ensure your MongoDB user has read/write permissions

#### 3. Duplicate Key Errors
```
Error: E11000 duplicate key error
```
**Solution**: Run `npm run db:reset` first to clear existing data

#### 4. Memory Issues
```
Error: JavaScript heap out of memory
```
**Solution**: Increase Node.js memory limit:
```bash
node --max-old-space-size=4096 node_modules/.bin/tsx src/scripts/seed-all-data.ts
```

### Debug Mode
Run scripts with debug output:
```bash
DEBUG=* npm run seed:all
```

## 🔄 Data Refresh

### Refresh Specific Collections
```bash
# Reset and reseed vulnerabilities only
npm run db:reset
npm run seed:vulnerabilities

# Reset and reseed user data only
npm run db:reset
npm run seed:user-data
```

### Incremental Updates
The seeding scripts are designed to be idempotent. You can run them multiple times, but it's recommended to reset first for clean data.

## 📝 Environment Variables

Ensure these environment variables are set:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vulnscope
MONGODB_DB=vulnscope

# Supabase Configuration (for admin system)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🎯 Best Practices

1. **Always reset before seeding** for consistent results
2. **Use essential seeding for development** to save time
3. **Use full seeding for testing** to get complete functionality
4. **Backup production data** before running reset commands
5. **Test seeding scripts** in development before production

## 📚 Related Documentation

- [Database Setup Guide](./supabase-setup-guide.md)
- [Admin System Setup](./admin-setup-guide.md)
- [Environment Configuration](./migration-environment-config.md)

## 🆘 Support

If you encounter issues with the seeding process:

1. Check the troubleshooting section above
2. Verify your MongoDB connection
3. Ensure all dependencies are installed
4. Check the console output for specific error messages
5. Review the seeding script logs for detailed information

---

**Happy Seeding! 🌱**
