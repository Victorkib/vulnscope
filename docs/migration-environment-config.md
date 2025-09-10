# 🔧 Migration Environment Configuration

## Environment Variables for Comment System Migration

Copy these environment variables to your `.env.local` file to control the migration:

```bash
# =====================================================
# SUPABASE CONFIGURATION (REQUIRED)
# =====================================================

# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url

# Your Supabase anon key (public key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Your Supabase service role key (private key)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# =====================================================
# MIGRATION CONTROL (OPTIONAL - DEFAULTS PROVIDED)
# =====================================================

# Use Supabase for comment operations (default: true)
USE_SUPABASE_COMMENTS=true

# Use Supabase for vote operations (default: true - already working)
USE_SUPABASE_VOTES=true

# Use Supabase for comment counts (default: true)
USE_SUPABASE_COUNTS=true

# Enable reputation system integration (default: false)
ENABLE_REPUTATION_INTEGRATION=false

# Fallback to MongoDB if Supabase fails (default: true - SAFETY)
FALLBACK_TO_MONGODB=true
```

## Migration Examples

### Example 1: Full Supabase Migration (Recommended)
```bash
USE_SUPABASE_COMMENTS=true
USE_SUPABASE_VOTES=true
USE_SUPABASE_COUNTS=true
ENABLE_REPUTATION_INTEGRATION=false
FALLBACK_TO_MONGODB=true
```

### Example 2: Gradual Migration (Start with Comments Only)
```bash
USE_SUPABASE_COMMENTS=true
USE_SUPABASE_VOTES=false
USE_SUPABASE_COUNTS=false
ENABLE_REPUTATION_INTEGRATION=false
FALLBACK_TO_MONGODB=true
```

### Example 3: Rollback to MongoDB (If Issues Occur)
```bash
USE_SUPABASE_COMMENTS=false
USE_SUPABASE_VOTES=false
USE_SUPABASE_COUNTS=false
ENABLE_REPUTATION_INTEGRATION=false
FALLBACK_TO_MONGODB=true
```

### Example 4: Production Ready (After Full Testing)
```bash
USE_SUPABASE_COMMENTS=true
USE_SUPABASE_VOTES=true
USE_SUPABASE_COUNTS=true
ENABLE_REPUTATION_INTEGRATION=true
FALLBACK_TO_MONGODB=false
```

## Migration Status Endpoint

You can check the current migration status by calling:

```typescript
import { getMigrationStatus } from '@/lib/migration-config';
console.log(getMigrationStatus());
```

This will show you:
- Migration progress percentage
- Which features are migrated
- Next steps to complete migration
- Overall status

## Safety Notes

1. **The migration is designed to be safe and reversible**
2. **You can change these values without code deployment**
3. **FALLBACK_TO_MONGODB=true provides safety during migration**
4. **Test with gradual migration first (one feature at a time)**
5. **Monitor your application after each change**
6. **Use the migration status endpoint to check progress**
