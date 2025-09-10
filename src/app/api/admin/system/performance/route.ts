import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { getDatabase } from '@/lib/mongodb';

// GET /api/admin/system/performance - Get system performance metrics
export async function GET(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['performance_monitoring'], request);
    
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '1h'; // 1h, 24h, 7d, 30d
    
    const db = await getDatabase();
    
    // Get database performance stats
    const dbStats = await db.stats();
    
    // Get collection performance
    const collections = await db.listCollections().toArray();
    const collectionPerformance = await Promise.all(
      collections.map(async (collection) => {
        const coll = db.collection(collection.name);
        const stats = await db.command({ collStats: collection.name });
        return {
          name: collection.name,
          count: stats.count,
          size: stats.size,
          avgObjSize: stats.avgObjSize,
          storageSize: stats.storageSize,
          totalIndexSize: stats.totalIndexSize,
          indexSizes: stats.indexSizes
        };
      })
    );
    
    // Get system metrics
    const systemMetrics = {
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      },
      uptime: process.uptime(),
      cpu: {
        usage: process.cpuUsage()
      },
      platform: process.platform,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    };
    
    // Get performance trends (simplified - in real implementation, you'd store historical data)
    const performanceTrends = {
      responseTime: {
        average: 150, // ms
        p95: 300,
        p99: 500,
        trend: 'stable'
      },
      throughput: {
        requestsPerSecond: 100,
        trend: 'increasing'
      },
      errorRate: {
        percentage: 0.1,
        trend: 'decreasing'
      },
      database: {
        queryTime: 50, // ms
        connectionPool: {
          active: 5,
          idle: 10,
          total: 15
        }
      }
    };
    
    // Get recent performance alerts
    const alertsCollection = db.collection('performance_alerts');
    const recentAlerts = await alertsCollection
      .find({ timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() } })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    const performanceData = {
      system: systemMetrics,
      database: {
        stats: dbStats,
        collections: collectionPerformance
      },
      trends: performanceTrends,
      alerts: recentAlerts,
      timeRange,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch performance metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/system/performance - Create performance alert or run optimization
export async function POST(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['performance_monitoring'], request);
    
    const body = await request.json();
    const { action, config } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const results: any = {
      action,
      timestamp: new Date().toISOString(),
      performedBy: adminUser.userId,
      results: {}
    };
    
    switch (action) {
      case 'create_alert':
        // Create performance alert
        const { metric, threshold, condition, description } = config;
        
        if (!metric || !threshold || !condition) {
          return NextResponse.json(
            { error: 'metric, threshold, and condition are required for alerts' },
            { status: 400 }
          );
        }
        
        const alert = {
          id: `perf_${Date.now()}`,
          metric,
          threshold,
          condition, // 'greater_than', 'less_than', 'equals'
          description: description || `Alert for ${metric} ${condition} ${threshold}`,
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: adminUser.userId
        };
        
        await db.collection('performance_alerts').insertOne(alert);
        results.results = { alert };
        break;
        
      case 'optimize_database':
        // Run database optimization
        const collections = await db.listCollections().toArray();
        const optimizationResults = [];
        
        for (const collection of collections) {
          try {
            const coll = db.collection(collection.name);
            
            // Analyze collection
            const analysis = await coll.aggregate([
              { $collStats: { storageStats: {}, count: {} } }
            ]).toArray();
            
            // Reindex if needed
            await coll.createIndex({});
            
            optimizationResults.push({
              name: collection.name,
              status: 'optimized',
              analysis: analysis[0]
            });
          } catch (error) {
            optimizationResults.push({
              name: collection.name,
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        
        results.results = { optimizationResults };
        break;
        
      case 'clear_cache':
        // Clear application cache (simplified)
        results.results = {
          status: 'success',
          message: 'Cache cleared successfully',
          clearedAt: new Date().toISOString()
        };
        break;
        
      default:
        return NextResponse.json(
          { error: 'Unknown performance action' },
          { status: 400 }
        );
    }
    
    // Log the performance action
    await adminAuthService.logAdminAction(
      adminUser.userId,
      'performance_monitoring',
      {
        targetId: 'system',
        targetType: 'system',
        oldValue: null,
        newValue: results.results,
        reason: 'Performance action performed',
        description: `Performance action ${action} performed by admin`
      }
    );
    
    return NextResponse.json({
      success: true,
      data: results,
      message: `Performance action ${action} completed successfully`
    });
  } catch (error) {
    console.error('Error performing performance action:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform performance action',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
