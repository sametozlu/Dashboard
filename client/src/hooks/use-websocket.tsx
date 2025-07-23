import React, { useEffect, useRef, useState, useCallback, useContext, createContext } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketHook {
  socket: Socket | null;
  isConnected: boolean;
  subscribe: (dataType: string) => void;
  unsubscribe: (dataType: string) => void;
  sendControl: (action: string, data: any) => Promise<any>; 
}

const WebSocketContext = createContext<WebSocketHook | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const controlRequestsRef = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map());

  useEffect(() => {
    const socket = io({
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('hardware:control:response', (response) => {
      const request = controlRequestsRef.current.get(response.requestId);
      if (request) {
        if (response.success) {
          request.resolve(response.data);
        } else {
          request.reject(new Error(response.error));
        }
        controlRequestsRef.current.delete(response.requestId);
      }
    });
    socket.on('connect_error', () => setIsConnected(false));
    return () => { socket.disconnect(); };
  }, []);

  const subscribe = useCallback((dataType: string) => {
    if (socketRef.current) {
      socketRef.current.emit('hardware:subscribe', dataType);
    }
  }, []);

  const unsubscribe = useCallback((dataType: string) => {
    if (socketRef.current) {
      socketRef.current.emit('hardware:unsubscribe', dataType);
    }
  }, []);

  const sendControl = useCallback((action: string, data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !isConnected) {
        reject(new Error('WebSocket not connected'));
        return;
      }
      const requestId = `${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      controlRequestsRef.current.set(requestId, { resolve, reject });
      socketRef.current.emit('hardware:control', { action, requestId, ...data });
      setTimeout(() => {
        if (controlRequestsRef.current.has(requestId)) {
          controlRequestsRef.current.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }, [isConnected]);

  const value: WebSocketHook = {
    socket: socketRef.current,
    isConnected,
    subscribe,
    unsubscribe,
    sendControl
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export function useWebSocket(): WebSocketHook {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export function useHardwareData<T>(dataType: string, initialData: T): {
  data: T;
  lastUpdate: number | null;
  isLoading: boolean;
  error: string | null;
} {
  const { socket, isConnected, subscribe, unsubscribe } = useWebSocket();
  const [data, setData] = useState<T>(initialData);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;
    subscribe(dataType);
    const handleData = (response: { data: T; timestamp: number }) => {
      setData(response.data);
      setLastUpdate(response.timestamp);
      setIsLoading(false);
      setError(null);
    };
    const handleError = (errorResponse: { error: string; timestamp: number }) => {
      setError(errorResponse.error);
      setIsLoading(false);
    };
    socket.on(`hardware:${dataType}`, handleData);
    socket.on(`hardware:${dataType}:error`, handleError);
    return () => {
      socket.off(`hardware:${dataType}`, handleData);
      socket.off(`hardware:${dataType}:error`, handleError);
      unsubscribe(dataType);
    };
  }, [socket, isConnected, dataType, subscribe, unsubscribe]);
  return { data, lastUpdate, isLoading, error };
}

export function useRawHardwareData(): { data: string | null; lastUpdate: number | null } {
  const { socket, isConnected } = useWebSocket();
  const [data, setData] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  useEffect(() => {
    if (!socket || !isConnected) return;
    const handleRaw = (payload: { data: string; timestamp: number }) => {
      setData(payload.data);
      setLastUpdate(payload.timestamp);
    };
    socket.on('hardware:raw', handleRaw);
    return () => {
      socket.off('hardware:raw', handleRaw);
    };
  }, [socket, isConnected]);
  return { data, lastUpdate };
} 