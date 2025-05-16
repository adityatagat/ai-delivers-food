import { Server } from 'socket.io';
import { ITrackingInfo, IOrderStatus } from '../interfaces/tracking';

class SocketService {
  private io: Server | null = null;
  private listeners: Map<string, (data: ITrackingInfo) => void> = new Map();

  initialize(server: any): void {
    try {
      this.io = new Server(server, {
        cors: {
          origin: process.env.FRONTEND_URL || 'http://localhost:3000',
          methods: ['GET', 'POST']
        }
      });

      this.io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('disconnect', () => {
          console.log('Client disconnected:', socket.id);
        });
      });
    } catch (error) {
      console.error('Failed to initialize socket service:', error);
      throw new Error('Socket service initialization failed');
    }
  }

  emitTrackingUpdate(orderId: string, trackingInfo: ITrackingInfo): void {
    try {
      if (!this.io) {
        throw new Error('Socket service not initialized');
      }
      this.io.emit(`tracking:${orderId}`, trackingInfo);
    } catch (error) {
      console.error('Failed to emit tracking update:', error);
      throw new Error('Failed to emit tracking update');
    }
  }

  emitOrderStatusUpdate(orderId: string, status: IOrderStatus): void {
    try {
      if (!this.io) {
        throw new Error('Socket service not initialized');
      }
      this.io.emit(`order:${orderId}`, status);
    } catch (error) {
      console.error('Failed to emit order status update:', error);
      throw new Error('Failed to emit order status update');
    }
  }

  subscribeToOrder(orderId: string, callback: (data: ITrackingInfo) => void): void {
    try {
      if (!this.io) {
        throw new Error('Socket service not initialized');
      }
      const eventName = `tracking:${orderId}`;
      this.listeners.set(eventName, callback);
      this.io.on(eventName, callback);
    } catch (error) {
      console.error('Failed to subscribe to order updates:', error);
      throw new Error('Failed to subscribe to order updates');
    }
  }

  unsubscribeFromOrder(orderId: string): void {
    try {
      if (!this.io) {
        throw new Error('Socket service not initialized');
      }
      const eventName = `tracking:${orderId}`;
      const listener = this.listeners.get(eventName);
      if (listener) {
        this.io.off(eventName, listener);
        this.listeners.delete(eventName);
      }
    } catch (error) {
      console.error('Failed to unsubscribe from order updates:', error);
      throw new Error('Failed to unsubscribe from order updates');
    }
  }
}

export default new SocketService(); 