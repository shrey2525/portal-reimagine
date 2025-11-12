/**
 * MetaHorizonSDK.ts
 * Type definitions and adapter for Meta Horizon Worlds SDK
 *
 * This file provides TypeScript types for Meta Horizon SDK
 * and a fallback implementation for browser testing
 */

// ============================================================================
// Type Definitions for Meta Horizon SDK
// ============================================================================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  position: Vector3;
  rotation: Quaternion;
  forward: Vector3;
  up: Vector3;
}

export interface TouchEvent {
  touches: Array<{
    identifier: number;
    clientX: number;
    clientY: number;
  }>;
  changedTouches?: Array<{
    identifier: number;
    clientX: number;
    clientY: number;
  }>;
}

export interface TapEvent {
  x: number;
  y: number;
}

export interface GestureEvent {
  x?: number;
  y?: number;
  centerX?: number;
  centerY?: number;
  scale?: number;
  angle?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  velocity?: number;
  distance?: number;
  duration?: number;
  deltaX?: number;
  deltaY?: number;
  totalDeltaX?: number;
  totalDeltaY?: number;
}

export interface OrientationData {
  yaw: number;
  pitch: number;
  roll: number;
  timestamp: number;
}

export interface MotionData {
  acceleration: Vector3;
  accelerationIncludingGravity: Vector3;
  rotationRate: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  timestamp: number;
}

export interface HapticConfig {
  duration?: number;
  intensity?: number;
  pattern?: number[];
}

export interface AudioConfig {
  sound: string;
  volume?: number;
  pitch?: number;
  loop?: boolean;
  position?: Vector3;
  maxDistance?: number;
  rolloffFactor?: number;
}

export interface EntityConfig {
  model: string;
  position: Vector3;
  rotation?: Quaternion;
  scale?: Vector3;
  material?: any;
}

export interface MaterialConfig {
  shader: string;
  textures?: { [key: string]: string };
  properties?: { [key: string]: any };
}

// ============================================================================
// Meta Horizon SDK Adapter
// ============================================================================

/**
 * MetaHorizonAdapter - Provides Meta Horizon SDK interface
 * Falls back to browser APIs when Meta Horizon SDK is unavailable
 */
export class MetaHorizonAdapter {
  private static instance: MetaHorizonAdapter;
  private isMetaHorizon: boolean = false;
  private localPlayerId: string = 'local_' + Date.now();

  private constructor() {
    // Check if running in Meta Horizon environment
    this.isMetaHorizon = typeof (window as any).MetaHorizon !== 'undefined';
  }

  public static getInstance(): MetaHorizonAdapter {
    if (!MetaHorizonAdapter.instance) {
      MetaHorizonAdapter.instance = new MetaHorizonAdapter();
    }
    return MetaHorizonAdapter.instance;
  }

  public isRunningInMetaHorizon(): boolean {
    return this.isMetaHorizon;
  }

  // ============================================================================
  // Player API
  // ============================================================================

  public getLocalPlayer(): PlayerInfo {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Player) {
      const player = (window as any).MetaHorizon.Player.getLocal();
      return {
        id: player.id,
        name: player.name,
        position: player.position,
        rotation: player.rotation,
        forward: player.forward || { x: 0, y: 0, z: -1 },
        up: player.up || { x: 0, y: 1, z: 0 }
      };
    }

    // Fallback for browser testing
    return {
      id: this.localPlayerId,
      name: 'Test Player',
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      forward: { x: 0, y: 0, z: -1 },
      up: { x: 0, y: 1, z: 0 }
    };
  }

  public teleportPlayer(playerId: string, position: Vector3, rotation?: Quaternion): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Player) {
      const player = (window as any).MetaHorizon.Player.getById(playerId);
      if (player) {
        player.teleport({ position, rotation });
      }
    } else {
      console.log(`[Browser Mode] Teleport player ${playerId} to`, position);
    }
  }

  // ============================================================================
  // Input API
  // ============================================================================

  public onTap(callback: (event: TapEvent) => void): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Input) {
      (window as any).MetaHorizon.Input.onTap(callback);
    } else {
      // Browser fallback: use click events
      document.addEventListener('click', (e) => {
        callback({ x: e.clientX, y: e.clientY });
      });
    }
  }

  public onDoubleTap(callback: (event: TapEvent) => void): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Input) {
      (window as any).MetaHorizon.Input.onDoubleTap(callback);
    } else {
      // Browser fallback: use dblclick
      document.addEventListener('dblclick', (e) => {
        callback({ x: e.clientX, y: e.clientY });
      });
    }
  }

  public onLongPress(callback: (event: GestureEvent) => void): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Input) {
      (window as any).MetaHorizon.Input.onLongPress(callback);
    } else {
      // Browser fallback: detect long press
      let pressTimer: any;
      document.addEventListener('mousedown', (e) => {
        pressTimer = setTimeout(() => {
          callback({ x: e.clientX, y: e.clientY, duration: 500 });
        }, 500);
      });
      document.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
      });
    }
  }

  public onPinch(callback: (event: GestureEvent) => void): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Input) {
      (window as any).MetaHorizon.Input.onPinch(callback);
    } else {
      console.log('[Browser Mode] Pinch gesture not available (use touch device)');
    }
  }

  public onRotate(callback: (event: GestureEvent) => void): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Input) {
      (window as any).MetaHorizon.Input.onRotate(callback);
    } else {
      console.log('[Browser Mode] Rotate gesture not available (use touch device)');
    }
  }

  public onSwipe(callback: (event: GestureEvent) => void): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Input) {
      (window as any).MetaHorizon.Input.onSwipe(callback);
    } else {
      console.log('[Browser Mode] Swipe gesture not available (use touch device)');
    }
  }

  // ============================================================================
  // Sensors API
  // ============================================================================

  public enableGyroscope(): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Sensors) {
      (window as any).MetaHorizon.Sensors.enableGyroscope();
    } else {
      console.log('[Browser Mode] Using DeviceOrientationEvent');
    }
  }

  public disableGyroscope(): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Sensors) {
      (window as any).MetaHorizon.Sensors.disableGyroscope();
    }
  }

  public onOrientation(callback: (data: OrientationData) => void): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Sensors) {
      (window as any).MetaHorizon.Sensors.onOrientation(callback);
    } else {
      // Browser fallback
      window.addEventListener('deviceorientation', (e: any) => {
        callback({
          yaw: e.alpha || 0,
          pitch: e.beta || 0,
          roll: e.gamma || 0,
          timestamp: Date.now()
        });
      });
    }
  }

  public enableAccelerometer(): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Sensors) {
      (window as any).MetaHorizon.Sensors.enableAccelerometer();
    } else {
      console.log('[Browser Mode] Using DeviceMotionEvent');
    }
  }

  public disableAccelerometer(): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Sensors) {
      (window as any).MetaHorizon.Sensors.disableAccelerometer();
    }
  }

  public onMotion(callback: (data: MotionData) => void): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Sensors) {
      (window as any).MetaHorizon.Sensors.onMotion(callback);
    } else {
      // Browser fallback
      window.addEventListener('devicemotion', (e: any) => {
        callback({
          acceleration: e.acceleration || { x: 0, y: 0, z: 0 },
          accelerationIncludingGravity: e.accelerationIncludingGravity || { x: 0, y: 0, z: 0 },
          rotationRate: e.rotationRate || { alpha: 0, beta: 0, gamma: 0 },
          timestamp: Date.now()
        });
      });
    }
  }

  // ============================================================================
  // Haptics API
  // ============================================================================

  public playHaptic(config: HapticConfig): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Haptics) {
      (window as any).MetaHorizon.Haptics.play(config);
    } else if (navigator.vibrate) {
      // Browser fallback
      if (config.pattern) {
        navigator.vibrate(config.pattern);
      } else if (config.duration) {
        navigator.vibrate(config.duration);
      }
    } else {
      console.log('[Browser Mode] Haptics not available');
    }
  }

  public playHapticPattern(pattern: number[], intensity?: number): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Haptics) {
      (window as any).MetaHorizon.Haptics.playPattern({ pattern, intensity });
    } else if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  public cancelHaptics(): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Haptics) {
      (window as any).MetaHorizon.Haptics.cancel();
    } else if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  }

  // ============================================================================
  // Audio API
  // ============================================================================

  public playSound(config: AudioConfig): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Audio) {
      (window as any).MetaHorizon.Audio.play(config);
    } else {
      // Browser fallback
      console.log('[Browser Mode] Play sound:', config.sound);
    }
  }

  public playSoundAtLocation(config: AudioConfig): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Audio) {
      (window as any).MetaHorizon.Audio.playAtLocation(config);
    } else {
      console.log('[Browser Mode] Play spatial sound:', config.sound, 'at', config.position);
    }
  }

  public setMasterVolume(volume: number): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Audio) {
      (window as any).MetaHorizon.Audio.setMasterVolume(volume);
    }
  }

  public setCategoryVolume(category: string, volume: number): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Audio) {
      (window as any).MetaHorizon.Audio.setCategoryVolume(category, volume);
    }
  }

  // ============================================================================
  // Network API
  // ============================================================================

  public broadcast(eventType: string, data: any): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Network) {
      (window as any).MetaHorizon.Network.broadcast(eventType, data);
    } else {
      console.log('[Browser Mode] Broadcast:', eventType, data);
    }
  }

  public sendTo(playerIds: string[], eventType: string, data: any): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Network) {
      (window as any).MetaHorizon.Network.sendTo(playerIds, eventType, data);
    } else {
      console.log('[Browser Mode] Send to players:', playerIds, eventType, data);
    }
  }

  public onNetworkEvent(eventType: string, callback: (data: any, senderId: string) => void): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Network) {
      (window as any).MetaHorizon.Network.on(eventType, callback);
    } else {
      console.log('[Browser Mode] Listening for network event:', eventType);
    }
  }

  // ============================================================================
  // Entities API
  // ============================================================================

  public createEntity(config: EntityConfig): any {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Entities) {
      return (window as any).MetaHorizon.Entities.create(config);
    } else {
      console.log('[Browser Mode] Create entity:', config);
      return {
        id: 'entity_' + Date.now(),
        position: config.position,
        rotation: config.rotation,
        scale: config.scale,
        setPosition: (pos: Vector3) => console.log('Set position:', pos),
        setRotation: (rot: Quaternion) => console.log('Set rotation:', rot),
        setScale: (scale: Vector3) => console.log('Set scale:', scale),
        setVisible: (visible: boolean) => console.log('Set visible:', visible),
        destroy: () => console.log('Destroy entity')
      };
    }
  }

  public createMaterial(config: MaterialConfig): any {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Materials) {
      return (window as any).MetaHorizon.Materials.create(config);
    } else {
      console.log('[Browser Mode] Create material:', config);
      return { id: 'material_' + Date.now(), ...config };
    }
  }

  // ============================================================================
  // World API
  // ============================================================================

  public onWorldReady(callback: () => void): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.World) {
      (window as any).MetaHorizon.World.onReady(callback);
    } else {
      // Browser fallback
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
      } else {
        callback();
      }
    }
  }

  public onWorldUpdate(callback: (deltaTime?: number) => void): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.World) {
      (window as any).MetaHorizon.World.onUpdate(callback);
    } else {
      // Browser fallback: use requestAnimationFrame
      let lastTime = performance.now();
      const update = () => {
        const now = performance.now();
        const deltaTime = (now - lastTime) / 1000; // Convert to seconds
        lastTime = now;
        callback(deltaTime);
        requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    }
  }

  public onWorldUnload(callback: () => void): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.World) {
      (window as any).MetaHorizon.World.onUnload(callback);
    } else {
      window.addEventListener('beforeunload', callback);
    }
  }

  // ============================================================================
  // Physics API
  // ============================================================================

  public raycast(origin: Vector3, direction: Vector3, maxDistance: number, layerMask?: string[]): any {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Physics) {
      return (window as any).MetaHorizon.Physics.raycast({
        origin,
        direction,
        maxDistance,
        layerMask
      });
    } else {
      console.log('[Browser Mode] Raycast:', { origin, direction, maxDistance });
      return null;
    }
  }

  public checkSphere(position: Vector3, radius: number, layerMask?: string[]): any[] {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Physics) {
      return (window as any).MetaHorizon.Physics.checkSphere({
        position,
        radius,
        layerMask
      });
    } else {
      console.log('[Browser Mode] Check sphere:', { position, radius });
      return [];
    }
  }

  // ============================================================================
  // Room API
  // ============================================================================

  public onPlayerJoined(callback: (player: PlayerInfo) => void): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Room) {
      (window as any).MetaHorizon.Room.onPlayerJoined(callback);
    } else {
      console.log('[Browser Mode] Listening for player joined events');
    }
  }

  public onPlayerLeft(callback: (player: PlayerInfo) => void): void {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Room) {
      (window as any).MetaHorizon.Room.onPlayerLeft(callback);
    } else {
      console.log('[Browser Mode] Listening for player left events');
    }
  }

  public getRoomPlayerCount(): number {
    if (this.isMetaHorizon && (window as any).MetaHorizon?.Room) {
      return (window as any).MetaHorizon.Room.getPlayerCount();
    }
    return 1; // Just local player in browser mode
  }
}

// Export singleton instance
export const MetaHorizon = MetaHorizonAdapter.getInstance();
