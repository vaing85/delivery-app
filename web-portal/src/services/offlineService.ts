import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

interface DeliveryAppDB extends DBSchema {
  offlineActions: {
    key: string;
    value: OfflineAction;
  };
  cache: {
    key: string;
    value: {
      data: any;
      timestamp: number;
      expiresAt: number;
    };
  };
}

class OfflineService {
  private db: IDBPDatabase<DeliveryAppDB> | null = null;
  private isOnline = navigator.onLine;
  private syncQueue: OfflineAction[] = [];

  constructor() {
    this.init();
    this.setupEventListeners();
  }

  private async init() {
    try {
      this.db = await openDB<DeliveryAppDB>('delivery-app-offline', 1, {
        upgrade(db) {
          // Create offline actions store
          if (!db.objectStoreNames.contains('offlineActions')) {
            const actionStore = db.createObjectStore('offlineActions', {
              keyPath: 'id',
              autoIncrement: false,
            });
            actionStore.createIndex('timestamp', 'timestamp');
            actionStore.createIndex('type', 'type');
          }

          // Create cache store
          if (!db.objectStoreNames.contains('cache')) {
            const cacheStore = db.createObjectStore('cache', {
              keyPath: 'key',
            });
            cacheStore.createIndex('expiresAt', 'expiresAt');
          }
        },
      });

      // Load pending actions
      await this.loadPendingActions();
    } catch (error) {
      console.error('Failed to initialize offline service:', error);
    }
  }

  private setupEventListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Visibility change - sync when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncPendingActions();
      }
    });
  }

  // Store action for offline processing
  async storeOfflineAction(
    type: string,
    data: any,
    maxRetries: number = 3
  ): Promise<string> {
    const action: OfflineAction = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries,
    };

    if (this.db) {
      await this.db.add('offlineActions', action);
    }

    this.syncQueue.push(action);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingActions();
    }

    return action.id;
  }

  // Load pending actions from IndexedDB
  private async loadPendingActions() {
    if (!this.db) return;

    try {
      const actions = await this.db.getAll('offlineActions');
      this.syncQueue = actions.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Failed to load pending actions:', error);
    }
  }

  // Sync pending actions
  private async syncPendingActions() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const actionsToSync = [...this.syncQueue];
    this.syncQueue = [];

    for (const action of actionsToSync) {
      try {
        await this.processAction(action);
        await this.removeAction(action.id);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        
        // Increment retry count
        action.retries++;
        
        if (action.retries < action.maxRetries) {
          // Re-queue for retry
          this.syncQueue.push(action);
          if (this.db) {
            await this.db.put('offlineActions', action);
          }
        } else {
          // Max retries reached, remove action
          await this.removeAction(action.id);
        }
      }
    }
  }

  // Process individual action
  private async processAction(action: OfflineAction) {
    switch (action.type) {
      case 'CREATE_ORDER':
        return this.processCreateOrder(action.data);
      case 'UPDATE_ORDER':
        return this.processUpdateOrder(action.data);
      case 'CREATE_DELIVERY':
        return this.processCreateDelivery(action.data);
      case 'UPDATE_DELIVERY_STATUS':
        return this.processUpdateDeliveryStatus(action.data);
      case 'SEND_NOTIFICATION':
        return this.processSendNotification(action.data);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Action processors
  private async processCreateOrder(data: any) {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.statusText}`);
    }

    return response.json();
  }

  private async processUpdateOrder(data: any) {
    const { orderId, ...updateData } = data;
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update order: ${response.statusText}`);
    }

    return response.json();
  }

  private async processCreateDelivery(data: any) {
    const response = await fetch('/api/deliveries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create delivery: ${response.statusText}`);
    }

    return response.json();
  }

  private async processUpdateDeliveryStatus(data: any) {
    const { deliveryId, status } = data;
    const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update delivery status: ${response.statusText}`);
    }

    return response.json();
  }

  private async processSendNotification(data: any) {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    return response.json();
  }

  // Remove action from storage
  private async removeAction(actionId: string) {
    if (this.db) {
      await this.db.delete('offlineActions', actionId);
    }
  }

  // Cache management
  async setCache(key: string, data: any, ttl: number = 5 * 60 * 1000) {
    if (!this.db) return;

    const cacheItem = {
      key,
      value: {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      },
    };

    await this.db.put('cache', cacheItem);
  }

  async getCache(key: string) {
    if (!this.db) return null;

    try {
      const cacheItem = await this.db.get('cache', key);
      
      if (!cacheItem) return null;
      
      // Check if expired
      if (Date.now() > cacheItem.value.expiresAt) {
        await this.db.delete('cache', key);
        return null;
      }
      
      return cacheItem.value.data;
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  async clearCache() {
    if (!this.db) return;

    await this.db.clear('cache');
  }

  // Get offline status
  isOffline(): boolean {
    return !this.isOnline;
  }

  // Get pending actions count
  getPendingActionsCount(): number {
    return this.syncQueue.length;
  }

  // Get pending actions
  getPendingActions(): OfflineAction[] {
    return [...this.syncQueue];
  }

  // Clear all pending actions
  async clearPendingActions() {
    this.syncQueue = [];
    if (this.db) {
      await this.db.clear('offlineActions');
    }
  }

  // Force sync
  async forceSync() {
    if (this.isOnline) {
      await this.syncPendingActions();
    }
  }
}

// Singleton instance
const offlineService = new OfflineService();

export default offlineService;

// Hook for offline functionality
export const useOffline = () => {
  return {
    isOffline: offlineService.isOffline(),
    pendingActionsCount: offlineService.getPendingActionsCount(),
    pendingActions: offlineService.getPendingActions(),
    storeOfflineAction: offlineService.storeOfflineAction.bind(offlineService),
    forceSync: offlineService.forceSync.bind(offlineService),
    clearPendingActions: offlineService.clearPendingActions.bind(offlineService),
  };
};
