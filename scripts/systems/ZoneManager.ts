/**
 * ZoneManager.ts
 * Manages the 5 world zones and player navigation
 */

import { BasePuzzle } from '../puzzles/BasePuzzle';
import { EnergySignature } from './ScannerSystem';
import { ZoneId } from '../utils/Constants';

export interface WorldZone {
  id: ZoneId;
  name: string;
  description: string;
  bounds: Bounds3D;
  spawnPoint: Vector3;
  puzzles: BasePuzzle[];
  energySignatures: EnergySignature[];
  portalAnchors: Vector3[];
  isUnlocked: boolean;
  isCompleted: boolean;
  visitCount: number;
}

export interface Bounds3D {
  center: Vector3;
  size: Vector3;
}

export class ZoneManager {
  private zones: Map<ZoneId, WorldZone> = new Map();
  private currentZone?: WorldZone;
  private _playerPosition: Vector3 = new Vector3(0, 0, 0);

  constructor() {
    this.initializeZones();
  }

  /**
   * Initialize all 5 zones
   */
  private initializeZones(): void {
    // Zone 1: Training Grounds
    this.zones.set(ZoneId.TRAINING_GROUNDS, {
      id: ZoneId.TRAINING_GROUNDS,
      name: 'Training Grounds',
      description: 'Learn portal creation and scanner basics',
      bounds: {
        center: new Vector3(0, 0, 0),
        size: new Vector3(50, 20, 50)
      },
      spawnPoint: new Vector3(0, 1, 0),
      puzzles: [],
      energySignatures: [],
      portalAnchors: [],
      isUnlocked: true, // Always unlocked
      isCompleted: false,
      visitCount: 0
    });

    // Zone 2: Crystal Caverns
    this.zones.set(ZoneId.CRYSTAL_CAVERNS, {
      id: ZoneId.CRYSTAL_CAVERNS,
      name: 'Crystal Caverns',
      description: 'Gyroscope puzzles and energy collection',
      bounds: {
        center: new Vector3(100, -10, 0),
        size: new Vector3(60, 30, 60)
      },
      spawnPoint: new Vector3(100, -5, 0),
      puzzles: [],
      energySignatures: [],
      portalAnchors: [],
      isUnlocked: false,
      isCompleted: false,
      visitCount: 0
    });

    // Zone 3: Sky Platforms
    this.zones.set(ZoneId.SKY_PLATFORMS, {
      id: ZoneId.SKY_PLATFORMS,
      name: 'Sky Platforms',
      description: 'Precision portal placement and collaboration',
      bounds: {
        center: new Vector3(0, 50, 100),
        size: new Vector3(80, 40, 80)
      },
      spawnPoint: new Vector3(0, 50, 100),
      puzzles: [],
      energySignatures: [],
      portalAnchors: [],
      isUnlocked: false,
      isCompleted: false,
      visitCount: 0
    });

    // Zone 4: Social Hub
    this.zones.set(ZoneId.SOCIAL_HUB, {
      id: ZoneId.SOCIAL_HUB,
      name: 'Social Hub',
      description: 'Leaderboards, portal gallery, and social features',
      bounds: {
        center: new Vector3(-100, 0, 0),
        size: new Vector3(70, 25, 70)
      },
      spawnPoint: new Vector3(-100, 1, 0),
      puzzles: [],
      energySignatures: [],
      portalAnchors: [],
      isUnlocked: true, // Always accessible
      isCompleted: false,
      visitCount: 0
    });

    // Zone 5: Infinite Nexus
    this.zones.set(ZoneId.INFINITE_NEXUS, {
      id: ZoneId.INFINITE_NEXUS,
      name: 'Infinite Nexus',
      description: 'Player-created portal networks and endgame content',
      bounds: {
        center: new Vector3(0, 0, -100),
        size: new Vector3(100, 50, 100)
      },
      spawnPoint: new Vector3(0, 1, -100),
      puzzles: [],
      energySignatures: [],
      portalAnchors: [],
      isUnlocked: false,
      isCompleted: false,
      visitCount: 0
    });
  }

  /**
   * Enter a zone
   */
  public enterZone(zoneId: ZoneId, playerId: string): boolean {
    const zone = this.zones.get(zoneId);

    if (!zone) {
      console.error(`Zone not found: ${zoneId}`);
      return false;
    }

    if (!zone.isUnlocked) {
      console.warn(`Zone locked: ${zone.name}`);
      this.showLockedZoneMessage(zone);
      return false;
    }

    // Leave current zone
    if (this.currentZone) {
      this.leaveZone(this.currentZone, playerId);
    }

    // Enter new zone
    this.currentZone = zone;
    zone.visitCount++;

    // Teleport player to spawn point
    this.teleportPlayer(playerId, zone.spawnPoint);

    // Load zone assets
    this.loadZoneAssets(zone);

    // Play zone intro if first visit
    if (zone.visitCount === 1) {
      this.playZoneIntro(zone);
    }

    // Activate zone puzzles
    zone.puzzles.forEach(puzzle => puzzle.activate());

    console.log(`Entered zone: ${zone.name}`);
    return true;
  }

  /**
   * Leave current zone
   */
  private leaveZone(zone: WorldZone, playerId: string): void {
    // Save progress
    this.saveZoneProgress(zone, playerId);

    // Unload non-essential assets
    this.unloadZoneAssets(zone);

    console.log(`Left zone: ${zone.name}`);
  }

  /**
   * Update player position
   */
  public updatePlayerPosition(position: Vector3): void {
    this._playerPosition = position;

    // Check if player is still in current zone
    if (this.currentZone) {
      const isInBounds = this.isPositionInBounds(position, this.currentZone.bounds);

      if (!isInBounds) {
        // Player left zone bounds
        console.warn('Player left zone bounds');
        // Could teleport back or transition to adjacent zone
      }
    }
  }

  /**
   * Check if position is within bounds
   */
  private isPositionInBounds(position: Vector3, bounds: Bounds3D): boolean {
    const halfSize = new Vector3(
      bounds.size.x / 2,
      bounds.size.y / 2,
      bounds.size.z / 2
    );

    return (
      position.x >= bounds.center.x - halfSize.x &&
      position.x <= bounds.center.x + halfSize.x &&
      position.y >= bounds.center.y - halfSize.y &&
      position.y <= bounds.center.y + halfSize.y &&
      position.z >= bounds.center.z - halfSize.z &&
      position.z <= bounds.center.z + halfSize.z
    );
  }

  /**
   * Unlock zone
   */
  public unlockZone(zoneId: ZoneId): void {
    const zone = this.zones.get(zoneId);
    if (zone) {
      zone.isUnlocked = true;
      this.showZoneUnlockedNotification(zone);
      console.log(`Zone unlocked: ${zone.name}`);
    }
  }

  /**
   * Mark zone as completed
   */
  public completeZone(zoneId: ZoneId): void {
    const zone = this.zones.get(zoneId);
    if (zone) {
      zone.isCompleted = true;

      // Unlock next zone(s)
      this.unlockNextZones(zoneId);

      console.log(`Zone completed: ${zone.name}`);
    }
  }

  /**
   * Unlock zones based on progression
   */
  private unlockNextZones(completedZoneId: ZoneId): void {
    switch (completedZoneId) {
      case ZoneId.TRAINING_GROUNDS:
        this.unlockZone(ZoneId.CRYSTAL_CAVERNS);
        break;
      case ZoneId.CRYSTAL_CAVERNS:
        this.unlockZone(ZoneId.SKY_PLATFORMS);
        break;
      case ZoneId.SKY_PLATFORMS:
        this.unlockZone(ZoneId.INFINITE_NEXUS);
        break;
    }
  }

  /**
   * Add puzzle to zone
   */
  public addPuzzleToZone(zoneId: ZoneId, puzzle: BasePuzzle): void {
    const zone = this.zones.get(zoneId);
    if (zone) {
      zone.puzzles.push(puzzle);

      // Set completion callback to check zone completion
      puzzle.setOnComplete(() => this.checkZoneCompletion(zone));
    }
  }

  /**
   * Check if all puzzles in zone are completed
   */
  private checkZoneCompletion(zone: WorldZone): void {
    const allPuzzlesCompleted = zone.puzzles.every(
      puzzle => puzzle.state === 'completed'
    );

    if (allPuzzlesCompleted && !zone.isCompleted) {
      this.completeZone(zone.id);
    }
  }

  /**
   * Add energy signature to zone
   */
  public addEnergySignatureToZone(zoneId: ZoneId, signature: EnergySignature): void {
    const zone = this.zones.get(zoneId);
    if (zone) {
      zone.energySignatures.push(signature);
    }
  }

  /**
   * Get zone progress percentage
   */
  public getZoneProgress(zoneId: ZoneId): number {
    const zone = this.zones.get(zoneId);
    if (!zone) return 0;

    const totalTasks = zone.puzzles.length + zone.energySignatures.length;
    if (totalTasks === 0) return 100;

    const completedPuzzles = zone.puzzles.filter(p => p.state === 'completed').length;
    const collectedSignatures = zone.energySignatures.filter(s => s.isCollected).length;

    const completedTasks = completedPuzzles + collectedSignatures;
    return (completedTasks / totalTasks) * 100;
  }

  /**
   * Get overall game progress
   */
  public getOverallProgress(): number {
    const zones = Array.from(this.zones.values());
    const totalZones = zones.length;

    const completedZones = zones.filter(z => z.isCompleted).length;

    return (completedZones / totalZones) * 100;
  }

  // Helper methods (to be implemented with Meta Horizon API)

  private teleportPlayer(_playerId: string, position: Vector3): void {
    console.log(`Teleporting player to`, position);
  }

  private loadZoneAssets(zone: WorldZone): void {
    console.log(`Loading assets for zone: ${zone.name}`);
  }

  private unloadZoneAssets(zone: WorldZone): void {
    console.log(`Unloading assets for zone: ${zone.name}`);
  }

  private playZoneIntro(zone: WorldZone): void {
    console.log(`Playing intro for zone: ${zone.name}`);
  }

  private saveZoneProgress(zone: WorldZone, _playerId: string): void {
    console.log(`Saving progress for zone: ${zone.name}`);
  }

  private showLockedZoneMessage(zone: WorldZone): void {
    console.log(`Zone locked: ${zone.name}`);
  }

  private showZoneUnlockedNotification(zone: WorldZone): void {
    console.log(`Zone unlocked: ${zone.name}`);
  }

  // Getters

  public getZone(zoneId: ZoneId): WorldZone | undefined {
    return this.zones.get(zoneId);
  }

  public getCurrentZone(): WorldZone | undefined {
    return this.currentZone;
  }

  public getAllZones(): WorldZone[] {
    return Array.from(this.zones.values());
  }

  public getUnlockedZones(): WorldZone[] {
    return Array.from(this.zones.values()).filter(z => z.isUnlocked);
  }
}

// Vector3 utility class
class Vector3 {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}
}
