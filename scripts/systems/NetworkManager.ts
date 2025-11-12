/**
 * NetworkManager.ts
 * Network synchronization for multiplayer features
 * Optimized for mobile networks (4G/5G)
 */

import { Portal } from '../core/PortalManager';
import { Player } from './CollaborationSystem';
import { EnergySignature } from './ScannerSystem';
import { HapticPattern, NETWORK_CONFIG } from '../utils/Constants';

export enum NetworkEventType {
  PLAYER_JOIN = 'player_join',
  PLAYER_LEAVE = 'player_leave',
  PLAYER_MOVE = 'player_move',
  PORTAL_CREATE = 'portal_create',
  PORTAL_ACTIVATE = 'portal_activate',
  PORTAL_TRAVERSE = 'portal_traverse',
  ENERGY_COLLECT = 'energy_collect',
  TOUCH_EVENT = 'touch_event',
  HAPTIC_EVENT = 'haptic_event',
  COLLAB_START = 'collab_start',
  COLLAB_COMPLETE = 'collab_complete',
  CHAT_MESSAGE = 'chat_message'
}

export interface NetworkEvent {
  type: NetworkEventType;
  senderId: string;
  timestamp: number;
  data: any;
}

export interface PlayerState {
  id: string;
  name: string;
  position: Vector3;
  rotation: number;
  currentAction?: string;
  isTouching: boolean;
  deviceOrientation?: {
    pitch: number;
    roll: number;
  };
}

export type NetworkEventCallback = (event: NetworkEvent) => void;

export class NetworkManager {
  private localPlayerId: string;
  private connectedPlayers: Map<string, Player> = new Map();
  private eventCallbacks: Map<NetworkEventType, NetworkEventCallback[]> = new Map();

  // Network state
  private isConnected: boolean = false;
  private latency: number = 0;
  private updateRate: number = NETWORK_CONFIG.UPDATE_RATE; // Hz

  // Update tracking
  private _lastUpdateTime: number = 0;
  private updateInterval: number;
  private pendingEvents: NetworkEvent[] = [];

  // Optimization
  private _stateCache: Map<string, any> = new Map();
  private lastSentStates: Map<string, PlayerState> = new Map();

  constructor(localPlayerId: string) {
    this.localPlayerId = localPlayerId;
    this.updateInterval = 1000 / this.updateRate;

    this.initialize();
  }

  /**
   * Initialize network connection
   */
  private initialize(): void {
    // TODO: Connect to Meta Horizon network service
    this.isConnected = true;
    console.log('Network manager initialized');

    // Start network update loop
    this.startUpdateLoop();
  }

  /**
   * Start network update loop
   */
  private startUpdateLoop(): void {
    setInterval(() => {
      this.update();
    }, this.updateInterval);
  }

  /**
   * Network update tick
   */
  private update(): void {
    if (!this.isConnected) return;

    const now = Date.now();

    // Process pending events
    this.processPendingEvents();

    // Measure latency
    this.measureLatency();

    this._lastUpdateTime = now;
  }

  /**
   * Process pending network events
   */
  private processPendingEvents(): void {
    while (this.pendingEvents.length > 0) {
      const event = this.pendingEvents.shift();
      if (event) {
        this.handleNetworkEvent(event);
      }
    }
  }

  /**
   * Handle incoming network event
   */
  private handleNetworkEvent(event: NetworkEvent): void {
    const callbacks = this.eventCallbacks.get(event.type) || [];
    callbacks.forEach(callback => callback(event));
  }

  /**
   * Send network event
   */
  public sendEvent(type: NetworkEventType, data: any): void {
    const event: NetworkEvent = {
      type,
      senderId: this.localPlayerId,
      timestamp: Date.now(),
      data
    };

    // Send to network
    this.transmitEvent(event);
  }

  /**
   * Transmit event over network
   */
  private transmitEvent(event: NetworkEvent): void {
    // TODO: Send via Meta Horizon network API
    console.log('Transmitting event:', event.type, event.data);

    // Simulate network delay for testing
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        // Broadcast to local callbacks (for testing)
        this.receiveEvent(event);
      }, this.latency);
    }
  }

  /**
   * Receive event from network
   */
  public receiveEvent(event: NetworkEvent): void {
    // Ignore own events
    if (event.senderId === this.localPlayerId) return;

    this.pendingEvents.push(event);
  }

  /**
   * Sync player state
   */
  public syncPlayerState(state: PlayerState): void {
    // Check if state has changed significantly
    const lastState = this.lastSentStates.get(state.id);

    if (lastState && !this.hasStateChanged(state, lastState)) {
      return; // Skip if no significant change
    }

    // Send state update
    this.sendEvent(NetworkEventType.PLAYER_MOVE, state);

    // Cache last sent state
    this.lastSentStates.set(state.id, { ...state });
  }

  /**
   * Check if player state has changed significantly
   */
  private hasStateChanged(newState: PlayerState, oldState: PlayerState): boolean {
    const positionThreshold = 0.1; // meters
    const rotationThreshold = 5; // degrees

    const positionDelta = Vector3.distance(newState.position, oldState.position);
    const rotationDelta = Math.abs(newState.rotation - oldState.rotation);

    return (
      positionDelta > positionThreshold ||
      rotationDelta > rotationThreshold ||
      newState.isTouching !== oldState.isTouching
    );
  }

  /**
   * Broadcast portal creation
   */
  public broadcastPortalCreation(portal: Portal): void {
    this.sendEvent(NetworkEventType.PORTAL_CREATE, {
      portalId: portal.id,
      creatorId: portal.creatorId,
      position: portal.position,
      rotation: portal.rotation,
      radius: portal.radius,
      type: portal.type
    });
  }

  /**
   * Broadcast portal activation
   */
  public broadcastPortalActivation(portalId: string): void {
    this.sendEvent(NetworkEventType.PORTAL_ACTIVATE, {
      portalId
    });
  }

  /**
   * Broadcast energy collection
   */
  public broadcastEnergyCollection(signature: EnergySignature, playerId: string): void {
    this.sendEvent(NetworkEventType.ENERGY_COLLECT, {
      signatureId: signature.id,
      playerId,
      rarity: signature.rarity
    });
  }

  /**
   * Broadcast touch event
   */
  public broadcastTouchEvent(playerId: string, isTouching: boolean, timestamp: number): void {
    this.sendEvent(NetworkEventType.TOUCH_EVENT, {
      playerId,
      isTouching,
      timestamp
    });
  }

  /**
   * Broadcast haptic event
   */
  public broadcastHapticEvent(pattern: HapticPattern, targetPlayerIds: string[]): void {
    this.sendEvent(NetworkEventType.HAPTIC_EVENT, {
      pattern,
      targetPlayerIds
    });
  }

  /**
   * Broadcast collaboration challenge start
   */
  public broadcastCollabStart(challengeId: string, participantIds: string[]): void {
    this.sendEvent(NetworkEventType.COLLAB_START, {
      challengeId,
      participantIds
    });
  }

  /**
   * Broadcast collaboration challenge completion
   */
  public broadcastCollabComplete(challengeId: string, participantIds: string[]): void {
    this.sendEvent(NetworkEventType.COLLAB_COMPLETE, {
      challengeId,
      participantIds
    });
  }

  /**
   * Register event callback
   */
  public on(eventType: NetworkEventType, callback: NetworkEventCallback): void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, []);
    }
    this.eventCallbacks.get(eventType)!.push(callback);
  }

  /**
   * Unregister event callback
   */
  public off(eventType: NetworkEventType, callback: NetworkEventCallback): void {
    const callbacks = this.eventCallbacks.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Measure network latency
   */
  private measureLatency(): void {
    const pingStart = Date.now();

    // TODO: Implement actual ping measurement with Meta Horizon API
    // For now, simulate latency
    setTimeout(() => {
      this.latency = Date.now() - pingStart;
    }, 10);
  }

  /**
   * Add player to network
   */
  public addPlayer(player: Player): void {
    this.connectedPlayers.set(player.id, player);
    console.log(`Player connected: ${player.name} (${player.id})`);
  }

  /**
   * Remove player from network
   */
  public removePlayer(playerId: string): void {
    this.connectedPlayers.delete(playerId);
    this.lastSentStates.delete(playerId);
    console.log(`Player disconnected: ${playerId}`);
  }

  /**
   * Get connected player count
   */
  public getPlayerCount(): number {
    return this.connectedPlayers.size + 1; // +1 for local player
  }

  /**
   * Get all connected players
   */
  public getPlayers(): Player[] {
    return Array.from(this.connectedPlayers.values());
  }

  /**
   * Get network statistics
   */
  public getNetworkStats(): {
    latency: number;
    playerCount: number;
    updateRate: number;
    isConnected: boolean;
  } {
    return {
      latency: this.latency,
      playerCount: this.getPlayerCount(),
      updateRate: this.updateRate,
      isConnected: this.isConnected
    };
  }

  /**
   * Disconnect from network
   */
  public disconnect(): void {
    this.isConnected = false;
    this.connectedPlayers.clear();
    this.lastSentStates.clear();
    this.pendingEvents = [];
    console.log('Network disconnected');
  }
}

// Vector3 utility
class Vector3 {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}

  static distance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
