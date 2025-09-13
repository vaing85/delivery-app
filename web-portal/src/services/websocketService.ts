import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

export interface WebSocketEventHandlers {
  onOrderUpdate?: (data: any) => void;
  onLocationUpdate?: (data: any) => void;
  onDeliveryStatusUpdate?: (data: any) => void;
  onNotification?: (data: any) => void;
  onDriverStatusUpdate?: (data: any) => void;
  onPhotoReceived?: (data: any) => void;
  onSignatureReceived?: (data: any) => void;
  onChatMessage?: (data: any) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers: WebSocketEventHandlers = {};

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
          auth: {
            token
          },
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.isConnected = false;
          
          if (reason === 'io server disconnect') {
            // Server disconnected, try to reconnect
            this.handleReconnect();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
          this.handleReconnect();
          reject(error);
        });

        // Set up event listeners
        this.setupEventListeners();

      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        reject(error);
      }
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Order updates
    this.socket.on('order:updated', (data) => {
      console.log('Order updated:', data);
      this.eventHandlers.onOrderUpdate?.(data);
    });

    this.socket.on('order:status:changed', (data) => {
      console.log('Order status changed:', data);
      this.eventHandlers.onOrderUpdate?.(data);
    });

    this.socket.on('order:completed', (data) => {
      console.log('Order completed:', data);
      this.eventHandlers.onOrderUpdate?.(data);
    });

    // Location updates
    this.socket.on('driver:location:updated', (data) => {
      console.log('Driver location updated:', data);
      this.eventHandlers.onLocationUpdate?.(data);
    });

    this.socket.on('driverLocationUpdate', (data) => {
      console.log('Driver location update:', data);
      this.eventHandlers.onLocationUpdate?.(data);
    });

    // Delivery status updates
    this.socket.on('delivery:status:updated', (data) => {
      console.log('Delivery status updated:', data);
      this.eventHandlers.onDeliveryStatusUpdate?.(data);
    });

    this.socket.on('delivery:status:changed', (data) => {
      console.log('Delivery status changed:', data);
      this.eventHandlers.onDeliveryStatusUpdate?.(data);
    });

    // Notifications
    this.socket.on('notification:new', (data) => {
      console.log('New notification:', data);
      this.eventHandlers.onNotification?.(data);
    });

    this.socket.on('system:notification', (data) => {
      console.log('System notification:', data);
      this.eventHandlers.onNotification?.(data);
    });

    // Driver status updates
    this.socket.on('driverStatusUpdate', (data) => {
      console.log('Driver status update:', data);
      this.eventHandlers.onDriverStatusUpdate?.(data);
    });

    this.socket.on('driver:offline', (data) => {
      console.log('Driver went offline:', data);
      this.eventHandlers.onDriverStatusUpdate?.(data);
    });

    // Photo and signature updates
    this.socket.on('photo:received', (data) => {
      console.log('Photo received:', data);
      this.eventHandlers.onPhotoReceived?.(data);
    });

    this.socket.on('photo:captured', (data) => {
      console.log('Photo captured:', data);
      this.eventHandlers.onPhotoReceived?.(data);
    });

    this.socket.on('signature:received', (data) => {
      console.log('Signature received:', data);
      this.eventHandlers.onSignatureReceived?.(data);
    });

    this.socket.on('signature:captured', (data) => {
      console.log('Signature captured:', data);
      this.eventHandlers.onSignatureReceived?.(data);
    });

    // Chat messages
    this.socket.on('chat:message:received', (data) => {
      console.log('Chat message received:', data);
      this.eventHandlers.onChatMessage?.(data);
    });

    this.socket.on('chat:message:sent', (data) => {
      console.log('Chat message sent:', data);
      this.eventHandlers.onChatMessage?.(data);
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      const token = useAuthStore.getState().token;
      if (token) {
        this.connect(token).catch(console.error);
      }
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  // Emit events
  emitOrderUpdate(data: { orderId: string; status: string; location?: any }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('order:update', data);
    }
  }

  emitLocationUpdate(data: { latitude: number; longitude: number; orderId?: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('location:update', data);
    }
  }

  emitDeliveryStatusUpdate(data: { deliveryId: string; status: string; notes?: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('delivery:status:update', data);
    }
  }

  emitSignatureCapture(data: { orderId: string; signatureData: string; signatureType: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('signature:captured', data);
    }
  }

  emitPhotoCapture(data: { orderId: string; photoType: string; photoUrl: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('photo:captured', data);
    }
  }

  emitChatMessage(data: { orderId: string; message: string; recipientId: string }) {
    if (this.socket && this.isConnected) {
      this.socket.emit('chat:message', data);
    }
  }

  // Set event handlers
  setEventHandlers(handlers: WebSocketEventHandlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Join specific rooms
  joinOrderRoom(orderId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join:order', { orderId });
    }
  }

  leaveOrderRoom(orderId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave:order', { orderId });
    }
  }

  joinDeliveryRoom(deliveryId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join:delivery', { deliveryId });
    }
  }

  leaveDeliveryRoom(deliveryId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave:delivery', { deliveryId });
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// React hook for WebSocket
export const useWebSocket = () => {
  const { token, user } = useAuthStore();

  const connect = async () => {
    if (token && user) {
      try {
        await websocketService.connect(token);
        console.log('WebSocket connected successfully');
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
      }
    }
  };

  const disconnect = () => {
    websocketService.disconnect();
  };

  const setEventHandlers = (handlers: WebSocketEventHandlers) => {
    websocketService.setEventHandlers(handlers);
  };

  return {
    connect,
    disconnect,
    setEventHandlers,
    emitOrderUpdate: websocketService.emitOrderUpdate.bind(websocketService),
    emitLocationUpdate: websocketService.emitLocationUpdate.bind(websocketService),
    emitDeliveryStatusUpdate: websocketService.emitDeliveryStatusUpdate.bind(websocketService),
    emitSignatureCapture: websocketService.emitSignatureCapture.bind(websocketService),
    emitPhotoCapture: websocketService.emitPhotoCapture.bind(websocketService),
    emitChatMessage: websocketService.emitChatMessage.bind(websocketService),
    joinOrderRoom: websocketService.joinOrderRoom.bind(websocketService),
    leaveOrderRoom: websocketService.leaveOrderRoom.bind(websocketService),
    joinDeliveryRoom: websocketService.joinDeliveryRoom.bind(websocketService),
    leaveDeliveryRoom: websocketService.leaveDeliveryRoom.bind(websocketService),
    isConnected: websocketService.getConnectionStatus()
  };
};
