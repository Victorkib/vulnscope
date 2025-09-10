/**
 * Centralized API Client with Request Deduplication and Caching
 * Prevents duplicate requests and provides consistent error handling
 */

interface RequestOptions extends Omit<RequestInit, 'cache'> {
  timeout?: number;
  enableCache?: boolean;
  cacheTTL?: number; // Time to live in milliseconds
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class APIClient {
  private static instance: APIClient;
  private pendingRequests = new Map<string, Promise<any>>();
  private cache = new Map<string, CacheEntry>();
  private defaultTimeout = 30000; // 30 seconds
  private circuitBreaker = {
    failures: 0,
    lastFailureTime: 0,
    threshold: 5, // Open circuit after 5 failures
    timeout: 60000, // 1 minute timeout
    isOpen: false
  };

  private constructor() {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 300000);
  }

  static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  private generateRequestKey(url: string, options?: RequestOptions): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private getCachedData(key: string): any | null {
    const entry = this.cache.get(key);
    if (entry && this.isCacheValid(entry)) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCachedData(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  async request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      cache = false,
      cacheTTL = 300000, // 5 minutes default
      ...fetchOptions
    } = options;

    const requestKey = this.generateRequestKey(url, options);
    
    // Check circuit breaker
    if (this.circuitBreaker.isOpen) {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime;
      if (timeSinceLastFailure < this.circuitBreaker.timeout) {
        throw new Error('Circuit breaker is open. Service temporarily unavailable.');
      } else {
        // Reset circuit breaker
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.failures = 0;
      }
    }
    
    // Check cache first for GET requests
    if (cache && fetchOptions.method === 'GET' || !fetchOptions.method) {
      const cachedData = this.getCachedData(requestKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Check if request is already pending
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey)!;
    }

    // Create abort controller for timeout (only if no signal provided)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Use provided signal or create new one
    const signal = fetchOptions.signal || controller.signal;

    const requestPromise = fetch(url, {
      ...fetchOptions,
      signal: signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    })
      .then(async (response) => {
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Cache successful GET requests
        if (cache && (fetchOptions.method === 'GET' || !fetchOptions.method)) {
          this.setCachedData(requestKey, data, cacheTTL);
        }

        return data;
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        
        // Update circuit breaker on failure
        this.circuitBreaker.failures++;
        this.circuitBreaker.lastFailureTime = Date.now();
        
        if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
          this.circuitBreaker.isOpen = true;
        }
        
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`);
        }
        
        throw error;
      })
      .finally(() => {
        this.pendingRequests.delete(requestKey);
      });

    this.pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  // Convenience methods
  async get<T = any>(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = any>(url: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(url: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(url: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  // Clear cache for specific URL pattern
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Cleared ${keysToDelete.length} cache entries for pattern: ${pattern}`);
  }

  // Get cache statistics
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const apiClient = APIClient.getInstance();

// Export class for testing
export { APIClient };

// Type exports
export type { RequestOptions, CacheEntry };
