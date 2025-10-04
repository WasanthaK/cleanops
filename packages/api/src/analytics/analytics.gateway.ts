/**
 * WebSocket gateway for real-time analytics updates.
 */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { AnalyticsService } from './analytics.service.js';

@WebSocketGateway({
  cors: {
    origin: '*', // Configure based on CORS_ORIGINS env var in production
    credentials: true
  },
  namespace: '/analytics'
})
export class AnalyticsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AnalyticsGateway.name);
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Handle client connection
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Start broadcasting updates if this is the first client
    if (this.server.sockets.sockets.size === 1) {
      this.startBroadcasting();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Stop broadcasting if no clients are connected
    if (this.server.sockets.sockets.size === 0) {
      this.stopBroadcasting();
    }
  }

  /**
   * Subscribe to dashboard updates
   */
  @SubscribeMessage('subscribe:dashboard')
  async handleSubscribeDashboard(
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    this.logger.log(`Client ${client.id} subscribed to dashboard updates`);
    
    // Send initial data
    try {
      const dashboard = await this.analyticsService.getDashboardMetrics();
      client.emit('dashboard:update', dashboard);
    } catch (error) {
      this.logger.error('Error fetching dashboard metrics', error);
      client.emit('error', { message: 'Failed to fetch dashboard metrics' });
    }
  }

  /**
   * Subscribe to worker locations
   */
  @SubscribeMessage('subscribe:locations')
  async handleSubscribeLocations(
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    this.logger.log(`Client ${client.id} subscribed to location updates`);
    
    // Send initial data
    try {
      const locations = await this.analyticsService.getCurrentWorkerLocations();
      client.emit('locations:update', locations);
    } catch (error) {
      this.logger.error('Error fetching worker locations', error);
      client.emit('error', { message: 'Failed to fetch worker locations' });
    }
  }

  /**
   * Subscribe to specific worker updates
   */
  @SubscribeMessage('subscribe:worker')
  async handleSubscribeWorker(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workerId: string }
  ): Promise<void> {
    this.logger.log(`Client ${client.id} subscribed to worker ${data.workerId}`);
    
    // Join worker-specific room
    client.join(`worker:${data.workerId}`);
    
    // Send initial data
    try {
      const analytics = await this.analyticsService.getWorkerAnalytics(data.workerId);
      client.emit('worker:update', analytics);
    } catch (error) {
      this.logger.error(`Error fetching worker ${data.workerId} analytics`, error);
      client.emit('error', { message: 'Failed to fetch worker analytics' });
    }
  }

  /**
   * Unsubscribe from worker updates
   */
  @SubscribeMessage('unsubscribe:worker')
  handleUnsubscribeWorker(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workerId: string }
  ): void {
    this.logger.log(`Client ${client.id} unsubscribed from worker ${data.workerId}`);
    client.leave(`worker:${data.workerId}`);
  }

  /**
   * Start broadcasting periodic updates
   */
  private startBroadcasting(): void {
    this.logger.log('Starting real-time broadcasting');
    
    // Broadcast updates every 30 seconds
    this.refreshInterval = setInterval(async () => {
      try {
        // Broadcast dashboard updates
        const dashboard = await this.analyticsService.getDashboardMetrics();
        this.server.emit('dashboard:update', dashboard);

        // Broadcast location updates
        const locations = await this.analyticsService.getCurrentWorkerLocations();
        this.server.emit('locations:update', locations);
      } catch (error) {
        this.logger.error('Error broadcasting updates', error);
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop broadcasting periodic updates
   */
  private stopBroadcasting(): void {
    if (this.refreshInterval) {
      this.logger.log('Stopping real-time broadcasting');
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Manually trigger dashboard update broadcast
   */
  async broadcastDashboardUpdate(): Promise<void> {
    try {
      const dashboard = await this.analyticsService.getDashboardMetrics();
      this.server.emit('dashboard:update', dashboard);
    } catch (error) {
      this.logger.error('Error broadcasting dashboard update', error);
    }
  }

  /**
   * Manually trigger location update broadcast
   */
  async broadcastLocationUpdate(): Promise<void> {
    try {
      const locations = await this.analyticsService.getCurrentWorkerLocations();
      this.server.emit('locations:update', locations);
    } catch (error) {
      this.logger.error('Error broadcasting location update', error);
    }
  }

  /**
   * Broadcast update for specific worker
   */
  async broadcastWorkerUpdate(workerId: string): Promise<void> {
    try {
      const analytics = await this.analyticsService.getWorkerAnalytics(workerId);
      this.server.to(`worker:${workerId}`).emit('worker:update', analytics);
    } catch (error) {
      this.logger.error(`Error broadcasting worker ${workerId} update`, error);
    }
  }
}
