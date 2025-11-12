/**
 * SkyPlatformsPuzzles.ts
 * Puzzles for Sky Platforms zone
 */

import { GyroscopePuzzle, OrientationTarget } from '../GyroscopePuzzle';
import { BasePuzzle, PuzzleDifficulty } from '../BasePuzzle';
import { HapticController } from '../../core/HapticController';
import { ScannerSystem } from '../../systems/ScannerSystem';

/**
 * Platform Rotation Puzzle
 * Rotate platforms by orienting device
 */
export class PlatformRotationPuzzle extends GyroscopePuzzle {
  constructor(haptics: HapticController, scanner: ScannerSystem) {
    const targets: OrientationTarget[] = [
      { pitch: 0, roll: 90, tolerance: 5, duration: 3000 },   // Rotate right
      { pitch: 0, roll: -90, tolerance: 5, duration: 3000 },  // Rotate left
      { pitch: 45, roll: 0, tolerance: 5, duration: 3000 },   // Tilt up
      { pitch: 0, roll: 0, tolerance: 5, duration: 1000 }     // Reset
    ];

    super(
      'platform_rotation',
      'Platform Rotation',
      'Rotate the platforms to create a path',
      PuzzleDifficulty.HARD,
      haptics,
      scanner,
      targets
    );
  }

  protected onActivate(): void {
    super.onActivate();
    console.log('Puzzle: Rotate your device to align the platforms');
  }

  protected onComplete(): void {
    super.onComplete();
    console.log('Platforms aligned! Path created.');
  }
}

/**
 * Precision Portal Placement
 * Place portal with exact positioning
 */
export class PrecisionPortalPlacement extends BasePuzzle {
  private targetPosition = { x: 200, y: 300, z: 100 };
  private tolerance = 5; // meters
  private _portalPlaced = false;

  constructor(haptics: HapticController) {
    super(
      'precision_portal',
      'Precision Portal Placement',
      'Place a portal at the exact target location',
      PuzzleDifficulty.HARD,
      haptics
    );
  }

  protected onActivate(): void {
    console.log('Puzzle: Create a portal at the marked location');
    this.showTargetMarker();
  }

  protected onStart(): void {
    // Wait for portal placement
  }

  public checkPortalPlacement(position: any): void {
    const distance = Math.sqrt(
      Math.pow(position.x - this.targetPosition.x, 2) +
      Math.pow(position.y - this.targetPosition.y, 2) +
      Math.pow(position.z - this.targetPosition.z, 2)
    );

    if (distance <= this.tolerance) {
      this._portalPlaced = true;
      this.updateProgress(100);
    } else {
      const proximity = Math.max(0, 100 - (distance / this.tolerance) * 20);
      this.updateProgress(proximity);
      console.log(`Portal placed ${distance.toFixed(1)}m from target`);
    }
  }

  protected onComplete(): void {
    console.log('Perfect portal placement!');
  }

  protected onFail(): void {}
  protected onReset(): void {
    this._portalPlaced = false;
  }
  protected onProgressUpdate(progress: number): void {
    console.log(`Placement accuracy: ${progress.toFixed(0)}%`);
  }

  private showTargetMarker(): void {
    console.log('Target marker displayed at:', this.targetPosition);
  }
}

/**
 * Team Bridge Building
 * 2-4 players create portal bridge together
 */
export class TeamBridgeBuilding extends BasePuzzle {
  private requiredPortals = 4;
  private portalsCreated = 0;
  private participatingPlayers: Set<string> = new Set();

  constructor(haptics: HapticController) {
    super(
      'team_bridge',
      'Team Bridge Building',
      'Work together to build a bridge of portals',
      PuzzleDifficulty.HARD,
      haptics
    );
  }

  protected onActivate(): void {
    console.log('Puzzle: Team up to create a portal bridge (4 portals needed)');
  }

  protected onStart(): void {
    this.showBridgeMarkers();
  }

  public registerPortal(playerId: string): void {
    this.participatingPlayers.add(playerId);
    this.portalsCreated++;

    const progress = (this.portalsCreated / this.requiredPortals) * 100;
    this.updateProgress(progress);

    console.log(`Portal ${this.portalsCreated}/${this.requiredPortals} placed by ${playerId}`);
  }

  protected onComplete(): void {
    console.log(`Bridge complete! ${this.participatingPlayers.size} players participated.`);
  }

  protected onFail(): void {}
  protected onReset(): void {
    this.portalsCreated = 0;
    this.participatingPlayers.clear();
  }
  protected onProgressUpdate(progress: number): void {
    console.log(`Bridge progress: ${progress.toFixed(0)}%`);
  }

  private showBridgeMarkers(): void {
    console.log('Bridge markers displayed');
  }
}
