import io from 'socket.io-client';

class SocketService {
  private socket: ReturnType<typeof io> | null = null;
  private orderSubscriptions: Map<string, (status: any) => void> = new Map();

  connect() {
    if (!this.socket) {
      this.socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      this.socket.on('orderUpdate', (data: any) => {
        const { orderId, status } = data;
        const callback = this.orderSubscriptions.get(orderId);
        if (callback) {
          callback(status);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToOrder(orderId: string, callback: (status: any) => void) {
    this.connect();
    this.orderSubscriptions.set(orderId, callback);
    this.socket?.emit('subscribeToOrder', { orderId });
  }

  unsubscribeFromOrder(orderId: string) {
    this.orderSubscriptions.delete(orderId);
    this.socket?.emit('unsubscribeFromOrder', { orderId });
  }
}

export const socketService = new SocketService(); 