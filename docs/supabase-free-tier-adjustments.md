# 🆓 Supabase Free Tier Adjustments for VulnScope

**Important adjustments and considerations for running VulnScope on Supabase Free Tier**

---

## 📊 **Free Tier Limitations**

### **Database & Storage**
- **Database Size**: 500MB maximum
- **Bandwidth**: 2GB per month
- **Concurrent Connections**: 60 connections
- **Real-time Connections**: 2 concurrent connections

### **Authentication**
- **Users**: Unlimited (great for VulnScope!)
- **OAuth Providers**: All supported
- **Email Templates**: Customizable
- **Session Management**: Full support

### **Real-time Features**
- **Automatic Real-time**: ✅ Enabled for all tables with RLS
- **Manual Configuration**: ❌ No replication tab in dashboard
- **Connection Limits**: 2 concurrent real-time connections
- **Rate Limiting**: Basic rate limiting included

---

## 🔧 **Script Adjustments Made**

### **1. Removed pg_cron Dependency**
**Original Script**:
```sql
-- This requires pg_cron extension (not available on free tier)
SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');
```

**Free Tier Version**:
```sql
-- Manual cleanup function (call from application)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
-- Function implementation
$$ LANGUAGE plpgsql;
```

### **2. Simplified Indexing**
**Free Tier Approach**:
- Basic indexes only (no complex composite indexes)
- Focus on essential performance indexes
- Avoid over-indexing to save space

### **3. Optimized Table Structure**
**Space-Saving Measures**:
- Use `TEXT` instead of `VARCHAR` with limits
- Efficient JSONB usage
- Minimal default values
- Compact timestamp handling

---

## 🚀 **Free Tier Optimizations**

### **1. Database Size Management**

#### **Automatic Cleanup Strategy**
```sql
-- Run this function regularly from your application
SELECT cleanup_old_notifications();
```

#### **Data Retention Policies**
- **Notifications**: Keep for 30 days
- **User Activity**: Keep for 90 days
- **Alert Rules**: Keep indefinitely (small data)
- **Team Data**: Keep indefinitely (small data)

#### **Implementation in Application**
```typescript
// Add to your application startup or cron job
export async function cleanupSupabaseData() {
  try {
    const { data, error } = await supabase.rpc('cleanup_old_notifications');
    if (error) throw error;
    console.log(`Cleaned up ${data} old notifications`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}
```

### **2. Real-time Connection Management**

#### **Connection Pooling Strategy**
```typescript
// Limit real-time connections to 1 per user
const MAX_REALTIME_CONNECTIONS = 1;

export function useRealtimeNotifications() {
  const [connectionCount, setConnectionCount] = useState(0);
  
  useEffect(() => {
    if (connectionCount >= MAX_REALTIME_CONNECTIONS) {
      console.warn('Max real-time connections reached');
      return;
    }
    
    // Setup real-time subscription
    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', { /* config */ }, handleNotification)
      .subscribe();
      
    setConnectionCount(prev => prev + 1);
    
    return () => {
      subscription.unsubscribe();
      setConnectionCount(prev => prev - 1);
    };
  }, [user.id]);
}
```

#### **Fallback to Polling**
```typescript
// Fallback when real-time connections are maxed out
export function useNotificationsWithFallback() {
  const [useRealtime, setUseRealtime] = useState(true);
  
  useEffect(() => {
    if (!useRealtime) {
      // Use polling instead
      const interval = setInterval(fetchNotifications, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [useRealtime]);
}
```

### **3. Bandwidth Optimization**

#### **Efficient Data Fetching**
```typescript
// Only fetch necessary fields
const { data } = await supabase
  .from('notifications')
  .select('id, title, message, priority, created_at')
  .eq('user_id', userId)
  .eq('is_read', false)
  .limit(20); // Limit results
```

#### **Pagination Strategy**
```typescript
// Implement cursor-based pagination
export async function fetchNotifications(cursor?: string) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (cursor) {
    query = query.lt('created_at', cursor);
  }
  
  return await query;
}
```

---

## 📈 **Monitoring Free Tier Usage**

### **1. Database Size Monitoring**
```sql
-- Check current database size
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as database_size,
  pg_size_pretty(pg_total_relation_size('notifications')) as notifications_size,
  pg_size_pretty(pg_total_relation_size('user_preferences')) as preferences_size;
```

### **2. Connection Monitoring**
```typescript
// Monitor active connections
export async function checkConnectionStatus() {
  const { data, error } = await supabase
    .from('pg_stat_activity')
    .select('count(*)')
    .eq('state', 'active');
    
  if (data && data[0].count > 50) {
    console.warn('High connection count detected');
  }
}
```

### **3. Bandwidth Tracking**
```typescript
// Track API calls to monitor bandwidth
let apiCallCount = 0;
const MAX_API_CALLS_PER_DAY = 1000; // Estimate based on 2GB limit

export function trackApiCall() {
  apiCallCount++;
  if (apiCallCount > MAX_API_CALLS_PER_DAY) {
    console.warn('Approaching bandwidth limit');
  }
}
```

---

## 🛠️ **Free Tier Workarounds**

### **1. Real-time Limitations**

#### **Problem**: Only 2 concurrent real-time connections
#### **Solution**: Connection pooling and fallback strategies

```typescript
class RealtimeConnectionManager {
  private connections = new Map<string, any>();
  private maxConnections = 2;
  
  subscribe(userId: string, callback: Function) {
    if (this.connections.size >= this.maxConnections) {
      // Use polling fallback
      return this.startPolling(userId, callback);
    }
    
    const subscription = supabase
      .channel(`user:${userId}`)
      .on('postgres_changes', { /* config */ }, callback)
      .subscribe();
      
    this.connections.set(userId, subscription);
    return subscription;
  }
  
  private startPolling(userId: string, callback: Function) {
    const interval = setInterval(() => {
      this.fetchLatestData(userId).then(callback);
    }, 5000);
    
    return { unsubscribe: () => clearInterval(interval) };
  }
}
```

### **2. Storage Limitations**

#### **Problem**: 500MB database limit
#### **Solution**: Aggressive data cleanup and archiving

```typescript
// Implement data archiving
export async function archiveOldData() {
  // Archive notifications older than 30 days
  const oldNotifications = await supabase
    .from('notifications')
    .select('*')
    .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
  if (oldNotifications.data) {
    // Archive to external storage (MongoDB, S3, etc.)
    await archiveToExternalStorage(oldNotifications.data);
    
    // Delete from Supabase
    await supabase
      .from('notifications')
      .delete()
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  }
}
```

### **3. Bandwidth Limitations**

#### **Problem**: 2GB per month bandwidth limit
#### **Solution**: Efficient data transfer and caching

```typescript
// Implement client-side caching
class NotificationCache {
  private cache = new Map<string, any>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  
  async getNotifications(userId: string) {
    const cacheKey = `notifications:${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .limit(50); // Limit to reduce bandwidth
      
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
}
```

---

## 🎯 **Free Tier Best Practices**

### **1. Data Management**
- ✅ **Regular Cleanup**: Run cleanup functions weekly
- ✅ **Efficient Queries**: Use specific field selection
- ✅ **Pagination**: Implement proper pagination
- ✅ **Archiving**: Archive old data to external storage

### **2. Connection Management**
- ✅ **Connection Pooling**: Reuse connections when possible
- ✅ **Fallback Strategies**: Use polling when real-time is maxed
- ✅ **Connection Monitoring**: Track active connections
- ✅ **Graceful Degradation**: Handle connection limits gracefully

### **3. Performance Optimization**
- ✅ **Indexing**: Use indexes strategically
- ✅ **Caching**: Implement client-side caching
- ✅ **Batch Operations**: Group multiple operations
- ✅ **Lazy Loading**: Load data only when needed

### **4. Monitoring & Alerts**
- ✅ **Usage Tracking**: Monitor database size and bandwidth
- ✅ **Error Handling**: Implement proper error handling
- ✅ **Fallback Mechanisms**: Have backup strategies
- ✅ **User Communication**: Inform users of limitations

---

## 🚀 **Upgrade Path**

### **When to Consider Upgrading**
- Database size approaches 400MB
- Bandwidth usage exceeds 1.5GB/month
- Need more than 2 real-time connections
- Require advanced features (custom domains, etc.)

### **Upgrade Options**
1. **Pro Plan**: $25/month - 8GB database, 250GB bandwidth
2. **Team Plan**: $599/month - 8GB database, 1TB bandwidth
3. **Enterprise**: Custom pricing for large-scale deployments

### **Migration Strategy**
- Export data from free tier
- Set up new project on paid tier
- Import data to new project
- Update environment variables
- Test thoroughly before switching

---

## 📋 **Free Tier Checklist**

### **Setup Phase**
- [ ] Use optimized SQL scripts
- [ ] Implement connection management
- [ ] Set up monitoring
- [ ] Configure fallback strategies

### **Runtime Phase**
- [ ] Monitor database size weekly
- [ ] Track bandwidth usage
- [ ] Run cleanup functions regularly
- [ ] Handle connection limits gracefully

### **Maintenance Phase**
- [ ] Archive old data monthly
- [ ] Optimize queries regularly
- [ ] Update indexes as needed
- [ ] Plan for potential upgrade

---

## 🎉 **Conclusion**

The Supabase free tier is perfectly capable of running VulnScope for development and small-scale production use. With proper optimization and monitoring, you can:

- ✅ Support unlimited users
- ✅ Handle real-time notifications
- ✅ Manage team collaboration
- ✅ Store user preferences and alert rules
- ✅ Maintain good performance

The key is implementing efficient data management, connection pooling, and fallback strategies to work within the free tier limitations.

**Happy coding on the free tier! 🚀**
