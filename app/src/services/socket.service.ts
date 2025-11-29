import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  private socket: any = null;
  private listeners: Map<string, Function[]> = new Map();

  async connect(): Promise<void> {
    const token = await AsyncStorage.getItem('authToken');
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    // Setup listeners for real-time events
    this.socket.on('threat:new', (data: any) => {
      this.emit('threat:new', data);
    });

    this.socket.on('verification:complete', (data: any) => {
      this.emit('verification:complete', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  joinUserRoom(userId: string): void {
    if (this.socket) {
      this.socket.emit('join:user', { userId });
    }
  }

  leaveUserRoom(userId: string): void {
    if (this.socket) {
      this.socket.emit('leave:user', { userId });
    }
  }
}

export const socketService = new SocketService();
