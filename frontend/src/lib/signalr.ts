// ==========================================
// Bus Tracking System — SignalR Client
// ==========================================

import * as signalR from '@microsoft/signalr';
import { LocationData } from '@/types';

const HUB_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/hubs/location`
  : 'http://localhost:5044/hubs/location';

let connection: signalR.HubConnection | null = null;

export function getConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => {
          if (typeof window !== 'undefined') {
            return localStorage.getItem('auth_token') || '';
          }
          return '';
        },
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return connection;
}

export async function startConnection(): Promise<signalR.HubConnection> {
  const conn = getConnection();

  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try {
      await conn.start();
      console.log('SignalR connected');
    } catch (err) {
      console.error('SignalR connection error:', err);
      // Retry after 5 seconds
      setTimeout(() => startConnection(), 5000);
    }
  }

  return conn;
}

export function onLocationUpdate(callback: (data: LocationData) => void): () => void {
  const conn = getConnection();
  conn.on('ReceiveLocationUpdate', callback);
  return () => conn.off('ReceiveLocationUpdate', callback);
}

export async function stopConnection(): Promise<void> {
  if (connection) {
    await connection.stop();
    connection = null;
  }
}
