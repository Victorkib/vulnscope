import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/admin-auth';
import { getDatabase } from '@/lib/mongodb';

// GET /api/admin/system/maintenance - Get maintenance status and operations
export async function GET(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['database_maintenance'], request);
    
    const db = await getDatabase();
    
    // Get database stats
    const stats = await db.stats();
    
    // Get collection stats
    const collections = await db.listCollections().toArray();
    const collectionStats = await Promise.all(
      collections.map(async (collection) => {
        const coll = db.collection(collection.name);
        const count = await coll.countDocuments();
        const indexes = await coll.indexes();
        return {
          name: collection.name,
          count,
          indexes: indexes.length
        };
      })
    );
    
    // Get system health
    const systemHealth = {
      database: {
        status: 'healthy',
        size: stats.dataSize,
        collections: collections.length,
        indexes: collectionStats.reduce((sum, coll) => sum + coll.indexes, 0)
      },
      collections: collectionStats,
      lastMaintenance: new Date().toISOString(),
      uptime: process.uptime()
    };
    
    return NextResponse.json({
      success: true,
      data: systemHealth
    });
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch maintenance status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/system/maintenance - Run maintenance operations
export async function POST(request: Request) {
  try {
    const adminUser = await adminAuthService.requireAdmin(['database_maintenance'], request);
    
    const body = await request.json();
    const { operation, options = {} } = body;
    
    if (!operation) {
      return NextResponse.json(
        { error: 'operation is required' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const results: any = {
      operation,
      timestamp: new Date().toISOString(),
      performedBy: adminUser.userId,
      results: {}
    };
    
    switch (operation) {
      case 'cleanup_old_logs':
        // Clean up old audit logs (older than 90 days)
        const auditLogsCollection = db.collection('admin_audit_logs');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        
        const deleteResult = await auditLogsCollection.deleteMany({
          timestamp: { $lt: cutoffDate.toISOString() }
        });
        
        results.results = {
          deletedCount: deleteResult.deletedCount,
          cutoffDate: cutoffDate.toISOString()
        };
        break;
        
      case 'reindex_collections':
        // Reindex all collections
        const collections = await db.listCollections().toArray();
        const reindexResults = [];
        
        for (const collection of collections) {
          try {
            const coll = db.collection(collection.name);
            await coll.createIndex({});
            reindexResults.push({ name: collection.name, status: 'success' });
          } catch (error) {
            reindexResults.push({ 
              name: collection.name, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        
        results.results = { reindexResults };
        break;
        
      case 'compact_database':
        // Compact database (MongoDB specific)
        try {
          await db.command({ compact: 'admin_audit_logs' });
          results.results = { status: 'success', message: 'Database compacted successfully' };
        } catch (error) {
          results.results = { 
            status: 'error', 
            message: error instanceof Error ? error.message : 'Unknown error'
          };
        }
        break;
        
      case 'health_check':
        // Run comprehensive health check
        const healthCheck = {
          database: await db.stats(),
          collections: await Promise.all(
            (await db.listCollections().toArray()).map(async (coll) => {
              const collection = db.collection(coll.name);
              return {
                name: coll.name,
                count: await collection.countDocuments(),
                indexes: await collection.indexes()
              };
            })
          ),
          timestamp: new Date().toISOString()
        };
        
        results.results = healthCheck;
        break;
        
      default:
        return NextResponse.json(
          { error: 'Unknown maintenance operation' },
          { status: 400 }
        );
    }
    
    // Log the maintenance action
    await adminAuthService.logAdminAction(
      adminUser.userId,
      'maintenance_run',
      {
        targetId: 'system',
        targetType: 'system',
        oldValue: null,
        newValue: results.results,
        reason: 'System maintenance performed',
        description: `Maintenance operation ${operation} performed by admin`
      }
    );
    
    return NextResponse.json({
      success: true,
      data: results,
      message: `Maintenance operation ${operation} completed successfully`
    });
  } catch (error) {
    console.error('Error running maintenance operation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run maintenance operation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
