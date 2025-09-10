# 🚀 Comment System Migration Guide

## Overview

This guide walks you through migrating the comment system from MongoDB to Supabase while maintaining zero downtime and ensuring graceful rollback capabilities.

## 🛡️ Safety Guarantees

- **Zero Downtime**: Users won't experience any interruption
- **Graceful Rollback**: Can revert to MongoDB at any time
- **No Breaking Changes**: All API contracts remain identical
- **Incremental Migration**: Each step is independently testable

## 📋 Prerequisites

### 1. Supabase Setup
- Supabase project created and configured
- Environment variables set up
- Database access configured

### 2. Environment Variables
Ensure these are set in your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Migration Configuration (Optional - defaults provided)
USE_SUPABASE_COMMENTS=true
USE_SUPABASE_VOTES=true
USE_SUPABASE_COUNTS=true
ENABLE_REPUTATION_INTEGRATION=false
FALLBACK_TO_MONGODB=true
```

### 3. Database Access
- Access to Supabase SQL Editor
- Admin privileges on your Supabase project

## 🚀 Migration Steps

### Step 1: Run Database Migration Scripts

1. **Open Supabase SQL Editor**
2. **Run the unified setup script**:
   ```sql
   -- Copy and paste the contents of:
   -- docs/scripts/supabase-comments-unified-setup.sql
   ```
3. **Run the migration script**:
   ```sql
   -- Copy and paste the contents of:
   -- docs/scripts/run-comment-migration.sql
   ```

### Step 2: Verify Database Setup

The migration script will output verification results. Look for:
- ✅ **Tables Created**: `vulnerability_comments` and `comment_votes`
- ✅ **RLS Enabled**: Row Level Security active
- ✅ **Policies Created**: Security policies in place
- ✅ **Functions Created**: Utility functions working
- ✅ **Triggers Created**: Automatic vote counting
- ✅ **Real-time Enabled**: WebSocket support active

### Step 3: Deploy New API Endpoints

The new Supabase-based endpoints are ready to deploy:

1. **Comment Operations**: `src/app/api/vulnerabilities/[id]/comments/[commentId]/route-supabase.ts`
2. **Comment Counts**: `src/app/api/vulnerabilities/[id]/comments/count/route-supabase.ts`
3. **Reputation Service**: `src/lib/comment-reputation-service.ts`
4. **Migration Config**: `src/lib/migration-config.ts`

### Step 4: Update Environment Variables

Set these environment variables to enable Supabase:

```bash
# Enable Supabase for all comment operations
USE_SUPABASE_COMMENTS=true
USE_SUPABASE_VOTES=true
USE_SUPABASE_COUNTS=true

# Optional: Enable reputation integration
ENABLE_REPUTATION_INTEGRATION=false

# Safety: Keep MongoDB fallback enabled
FALLBACK_TO_MONGODB=true
```

### Step 5: Test the Migration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test comment functionality**:
   - Navigate to any vulnerability page
   - Try posting a comment
   - Try replying to a comment
   - Try voting on comments
   - Try editing/deleting your own comments

3. **Check real-time updates**:
   - Open multiple browser tabs
   - Post a comment in one tab
   - Verify it appears in other tabs instantly

### Step 6: Monitor and Validate

1. **Check browser console** for any errors
2. **Verify database queries** in Supabase dashboard
3. **Test all comment features** thoroughly
4. **Monitor performance** and response times

## 🔄 Rollback Procedure

If you need to rollback to MongoDB:

### Quick Rollback (Environment Variables)
```bash
# Disable Supabase, enable MongoDB fallback
USE_SUPABASE_COMMENTS=false
USE_SUPABASE_VOTES=false
USE_SUPABASE_COUNTS=false
FALLBACK_TO_MONGODB=true
```

### Full Rollback (Database)
1. **Restore from backup tables**:
   ```sql
   -- Restore comments
   INSERT INTO vulnerability_comments 
   SELECT * FROM vulnerability_comments_backup;
   
   -- Restore votes
   INSERT INTO comment_votes 
   SELECT * FROM comment_votes_backup;
   ```

2. **Update environment variables** to use MongoDB

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Post new comments
- [ ] Reply to existing comments
- [ ] Edit own comments
- [ ] Delete own comments
- [ ] Vote on comments (like/dislike)
- [ ] Change votes

### Real-time Features
- [ ] Comments appear instantly in other tabs
- [ ] Vote counts update in real-time
- [ ] Connection status indicators work
- [ ] Fallback to polling when WebSocket fails

### Security
- [ ] Can't edit others' comments
- [ ] Can't delete others' comments
- [ ] Authentication required for all operations
- [ ] Proper error messages for unauthorized access

### Performance
- [ ] Comments load quickly
- [ ] Real-time updates are responsive
- [ ] No memory leaks in browser
- [ ] Database queries are efficient

## 🚨 Troubleshooting

### Common Issues

#### 1. "Unauthorized" Errors
**Cause**: Authentication not working
**Solution**: Check Supabase auth configuration and session handling

#### 2. Comments Not Appearing
**Cause**: RLS policies blocking access
**Solution**: Verify RLS policies are correctly configured

#### 3. Real-time Not Working
**Cause**: WebSocket connection issues
**Solution**: Check Supabase real-time configuration and network

#### 4. Vote Counts Not Updating
**Cause**: Triggers not working
**Solution**: Verify database triggers are created and active

### Debug Commands

#### Check Migration Status
```typescript
import { getMigrationDebugInfo } from '@/lib/migration-config';
console.log(getMigrationDebugInfo());
```

#### Check Supabase Connection
```typescript
import { getSupabaseDebugInfo } from '@/lib/supabase-config';
console.log(getSupabaseDebugInfo());
```

#### Test Database Queries
```sql
-- Test comment insertion
SELECT * FROM vulnerability_comments LIMIT 5;

-- Test vote counting
SELECT * FROM comment_votes LIMIT 5;

-- Test RLS policies
SELECT * FROM pg_policies WHERE tablename = 'vulnerability_comments';
```

## 📊 Performance Monitoring

### Key Metrics to Monitor

1. **Response Times**:
   - Comment creation: < 500ms
   - Comment loading: < 200ms
   - Vote updates: < 300ms

2. **Real-time Performance**:
   - WebSocket connection: < 1s
   - Update propagation: < 100ms
   - Fallback polling: < 10s interval

3. **Database Performance**:
   - Query execution time
   - Connection pool usage
   - Index utilization

### Monitoring Tools

1. **Supabase Dashboard**: Monitor database performance
2. **Browser DevTools**: Check network requests and WebSocket connections
3. **Application Logs**: Monitor error rates and performance

## 🎯 Next Steps

After successful migration:

1. **Enable Reputation Integration**:
   ```bash
   ENABLE_REPUTATION_INTEGRATION=true
   ```

2. **Disable MongoDB Fallback** (after full validation):
   ```bash
   FALLBACK_TO_MONGODB=false
   ```

3. **Clean Up MongoDB Dependencies**:
   - Remove MongoDB comment collections
   - Update documentation
   - Remove unused code

4. **Performance Optimization**:
   - Add comment pagination
   - Implement comment search
   - Add comment moderation tools

## 📞 Support

If you encounter issues during migration:

1. **Check the troubleshooting section** above
2. **Review the migration logs** in Supabase
3. **Test with minimal configuration** first
4. **Use the rollback procedure** if needed

The migration is designed to be safe and reversible, so don't hesitate to rollback if you encounter any issues.
