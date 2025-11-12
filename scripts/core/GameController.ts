/**
 * GameController.ts
 * Main game controller that orchestrates all systems
 * Entry point for PortalSync: Reality Bridge
 */

import { HapticController } from './HapticController';
import { InputController, GestureEvent } from './InputController';
import { PortalManager } from './PortalManager';
import { ScannerSystem } from '../systems/ScannerSystem';
import { CollaborationSystem, Player } from '../systems/CollaborationSystem';
import { ZoneManager } from '../systems/ZoneManager';
import { GestureType, ZoneId } from '../utils/Constants';

export interface GameState {
  isInitialized: boolean;
  isPaused: boolean;
  currentPlayer?: Player;
  sessionStartTime: number;
  totalPlayTime: number;
}

export class GameController {
  // Core systems
  private hapticController: HapticController;
  private inputController: InputController;
  private portalManager: PortalManager;
  private scannerSystem: ScannerSystem;
  private collaborationSystem: CollaborationSystem;
  private zoneManager: ZoneManager;

  // Game state
  private gameState: GameState;

  // Update loop
  private updateIntervalId?: number;
  private readonly UPDATE_RATE = 60; // FPS

  constructor() {
    console.log('PortalSync: Reality Bridge - Initializing...');

    // Initialize core systems
    this.hapticController = new HapticController();
    this.inputController = new InputController();
    this.portalManager = new PortalManager(this.hapticController);
    this.scannerSystem = new ScannerSystem(this.hapticController);
    this.collaborationSystem = new CollaborationSystem(this.hapticController);
    this.zoneManager = new ZoneManager();

    // Initialize game state
    this.gameState = {
      isInitialized: false,
      isPaused: false,
      sessionStartTime: Date.now(),
      totalPlayTime: 0
    };

    this.initialize();
  }

  /**
   * Initialize game systems
   */
  private async initialize(): Promise<void> {
    console.log('Initializing game systems...');

    // Check device capabilities
    this.checkDeviceCapabilities();

    // Setup input event handlers
    this.setupInputHandlers();

    // Register local player
    this.registerLocalPlayer();

    // Enter starting zone (Training Grounds)
    this.zoneManager.enterZone(ZoneId.TRAINING_GROUNDS, this.getLocalPlayerId());

    // Start game loop
    this.startGameLoop();

    this.gameState.isInitialized = true;
    console.log('Game initialized successfully!');

    // Show welcome message
    this.showWelcomeMessage();
  }

  /**
   * Check device capabilities
   */
  private checkDeviceCapabilities(): void {
    // Check haptics support
    const hapticsSupported = HapticController.isSupported();
    console.log(`Haptics supported: ${hapticsSupported}`);

    if (!hapticsSupported) {
      console.warn('Haptic feedback not supported on this device');
    }

    // Check gyroscope/orientation support
    if (typeof window !== 'undefined' && !window.DeviceOrientationEvent) {
      console.warn('Device orientation not supported');
    }

    // Check touch support
    if (typeof window !== 'undefined' && !('ontouchstart' in window)) {
      console.warn('Touch events not supported');
    }
  }

  /**
   * Setup input event handlers
   */
  private setupInputHandlers(): void {
    // Portal creation gestures
    this.inputController.on(GestureType.PINCH, (event: GestureEvent) => {
      if (this.portalManager.isCreating && event.scale) {
        this.portalManager.onPinchGesture(event.scale);
      }
    });

    this.inputController.on(GestureType.ROTATE, (event: GestureEvent) => {
      if (this.portalManager.isCreating && event.rotation) {
        this.portalManager.onRotateGesture(event.rotation);
      }
    });

    this.inputController.on(GestureType.SWIPE, (_event: GestureEvent) => {
      if (this.portalManager.isCreating) {
        const swipePoints = this.inputController.getSwipePoints();
        // Convert to 3D points
        const points3D = swipePoints.map(p => ({ x: p.x, y: 0, z: p.y }));
        this.portalManager.onSwipeGesture(points3D as any);
      }
    });

    this.inputController.on(GestureType.DOUBLE_TAP, (_event: GestureEvent) => {
      if (this.portalManager.isCreating) {
        this.portalManager.onDoubleTap();
      }
    });

    // Long press to start portal creation
    this.inputController.on(GestureType.LONG_PRESS, (event: GestureEvent) => {
      if (!this.portalManager.isCreating) {
        const position = { x: event.position.x, y: 0, z: event.position.y };
        this.portalManager.startPortalCreation(position as any, this.getLocalPlayerId());
      }
    });

    // Tap to collect energy signatures
    this.inputController.on(GestureType.TAP, (_event: GestureEvent) => {
      // Check if tapping on revealed energy signature
      const nearbyEnergies = this.scannerSystem.nearbyEnergies;

      if (nearbyEnergies.length > 0) {
        nearbyEnergies.forEach(energy => {
          if (energy.isRevealed && !energy.isCollected) {
            this.scannerSystem.collectSignature(energy.id);
          }
        });
      }
    });

    // Touch for collaboration
    this.inputController.on(GestureType.TAP, (_event: GestureEvent) => {
      this.collaborationSystem.onPlayerTouch(this.getLocalPlayerId());
    });

    console.log('Input handlers configured');
  }

  /**
   * Register local player
   */
  private registerLocalPlayer(): void {
    const player: Player = {
      id: this.getLocalPlayerId(),
      name: this.getLocalPlayerName(),
      position: { x: 0, y: 0, z: 0 },
      isTouching: false
    };

    this.collaborationSystem.registerPlayer(player);
    this.gameState.currentPlayer = player;

    console.log(`Local player registered: ${player.name}`);
  }

  /**
   * Start game update loop
   */
  private startGameLoop(): void {
    const updateInterval = 1000 / this.UPDATE_RATE;

    this.updateIntervalId = window.setInterval(() => {
      this.update();
    }, updateInterval);

    console.log(`Game loop started at ${this.UPDATE_RATE} FPS`);
  }

  /**
   * Main game update loop
   */
  private update(): void {
    if (this.gameState.isPaused || !this.gameState.isInitialized) return;

    // Update player position
    const playerPosition = this.getPlayerPosition();
    this.zoneManager.updatePlayerPosition(playerPosition);

    // Update collaboration proximity
    this.collaborationSystem.updatePlayerProximity();

    // Check for performance issues
    this.monitorPerformance();
  }

  /**
   * Monitor performance
   */
  private monitorPerformance(): void {
    // TODO: Implement FPS monitoring and quality adjustment
    // Track frame times, memory usage, battery drain
  }

  /**
   * Toggle scanner
   */
  public toggleScanner(): void {
    this.scannerSystem.toggle();
  }

  /**
   * Pause game
   */
  public pause(): void {
    this.gameState.isPaused = true;
    console.log('Game paused');
  }

  /**
   * Resume game
   */
  public resume(): void {
    this.gameState.isPaused = false;
    console.log('Game resumed');
  }

  /**
   * Show settings menu
   */
  public showSettings(): void {
    // TODO: Show settings UI
    console.log('Opening settings menu');
  }

  /**
   * Update haptic intensity setting
   */
  public setHapticIntensity(intensity: number): void {
    this.hapticController.setIntensity(intensity);
    console.log(`Haptic intensity set to: ${intensity}`);
  }

  /**
   * Enable/disable haptics
   */
  public setHapticsEnabled(enabled: boolean): void {
    this.hapticController.setEnabled(enabled);
    console.log(`Haptics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Share portal to social media
   */
  public sharePortal(portalId: string): void {
    const portal = this.portalManager.getPortal(portalId);
    if (portal) {
      // TODO: Implement social sharing
      console.log('Sharing portal:', portal);
    }
  }

  /**
   * Get game statistics
   */
  public getStatistics(): any {
    return {
      totalPortalsCreated: this.portalManager.getAllPortals().length,
      currentZone: this.zoneManager.getCurrentZone()?.name,
      overallProgress: this.zoneManager.getOverallProgress(),
      sessionTime: (Date.now() - this.gameState.sessionStartTime) / 1000,
      hapticsEnabled: this.hapticController.enabled
    };
  }

  /**
   * Cleanup and dispose
   */
  public dispose(): void {
    console.log('Disposing game controller...');

    // Stop game loop
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }

    // Cleanup systems
    this.inputController.dispose();
    this.scannerSystem.dispose();

    console.log('Game controller disposed');
  }

  // Helper methods (to be implemented with Meta Horizon API)

  private getLocalPlayerId(): string {
    // TODO: Get from Meta Horizon API
    return 'local_player_' + Math.random().toString(36).substr(2, 9);
  }

  private getLocalPlayerName(): string {
    // TODO: Get from Meta Horizon API
    return 'Player';
  }

  private getPlayerPosition(): any {
    // TODO: Get from Meta Horizon API
    return { x: 0, y: 1, z: 0 };
  }

  private showWelcomeMessage(): void {
    console.log('Welcome to PortalSync: Reality Bridge!');
    console.log('Use multi-touch gestures to create portals');
    console.log('Toggle scanner to discover hidden energy signatures');
  }

  // Getters for systems (for external access if needed)

  public get haptics(): HapticController {
    return this.hapticController;
  }

  public get input(): InputController {
    return this.inputController;
  }

  public get portals(): PortalManager {
    return this.portalManager;
  }

  public get scanner(): ScannerSystem {
    return this.scannerSystem;
  }

  public get collaboration(): CollaborationSystem {
    return this.collaborationSystem;
  }

  public get zones(): ZoneManager {
    return this.zoneManager;
  }

  public get state(): GameState {
    return this.gameState;
  }
}

// Global game instance
export let gameInstance: GameController | null = null;

/**
 * Initialize the game
 */
export function initializeGame(): GameController {
  if (!gameInstance) {
    gameInstance = new GameController();
  }
  return gameInstance;
}

/**
 * Get game instance
 */
export function getGameInstance(): GameController | null {
  return gameInstance;
}
