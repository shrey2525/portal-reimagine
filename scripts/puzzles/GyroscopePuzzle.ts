/**
 * GyroscopePuzzle.ts
 * Puzzle type that uses device orientation for solving
 */

import { BasePuzzle, PuzzleDifficulty } from './BasePuzzle';
import { HapticController } from '../core/HapticController';
import { ScannerSystem } from '../systems/ScannerSystem';
// import { SCANNER_CONFIG } from '../utils/Constants';

export interface OrientationTarget {
  pitch: number;
  roll: number;
  tolerance: number;
  duration: number; // How long to hold orientation (ms)
}

export class GyroscopePuzzle extends BasePuzzle {
  protected scannerSystem: ScannerSystem;
  protected targets: OrientationTarget[];
  protected currentTargetIndex: number = 0;
  protected targetHoldStart?: number;

  constructor(
    id: string,
    name: string,
    description: string,
    difficulty: PuzzleDifficulty,
    hapticController: HapticController,
    scannerSystem: ScannerSystem,
    targets: OrientationTarget[]
  ) {
    super(id, name, description, difficulty, hapticController);
    this.scannerSystem = scannerSystem;
    this.targets = targets;
  }

  protected onActivate(): void {
    this.currentTargetIndex = 0;
    this.targetHoldStart = undefined;

    // Make sure scanner is active
    if (!this.scannerSystem.active) {
      this.scannerSystem.activate();
    }
  }

  protected onStart(): void {
    // Start checking orientation
    this.checkOrientationLoop();
  }

  protected onComplete(): void {
    // Specific completion logic
  }

  protected onFail(): void {
    // Specific failure logic
  }

  protected onReset(): void {
    this.currentTargetIndex = 0;
    this.targetHoldStart = undefined;
  }

  protected onProgressUpdate(progress: number): void {
    // Update UI with progress
    console.log(`Gyroscope puzzle progress: ${progress}%`);
  }

  /**
   * Check orientation continuously
   */
  private checkOrientationLoop(): void {
    if (this.state !== BasePuzzle.prototype.constructor.name) {
      requestAnimationFrame(() => this.checkOrientationLoop());
      return;
    }

    const currentTarget = this.targets[this.currentTargetIndex];
    if (!currentTarget) return;

    const isAligned = this.scannerSystem.checkAlignment(
      currentTarget.pitch,
      currentTarget.roll
    );

    if (isAligned) {
      // Start or continue holding
      if (!this.targetHoldStart) {
        this.targetHoldStart = Date.now();
      }

      const holdDuration = Date.now() - this.targetHoldStart;

      if (holdDuration >= currentTarget.duration) {
        // Target completed
        this.completeCurrentTarget();
      }
    } else {
      // Lost alignment
      this.targetHoldStart = undefined;
    }

    // Continue checking
    if (this.state === BasePuzzle.prototype.constructor.name) {
      requestAnimationFrame(() => this.checkOrientationLoop());
    }
  }

  /**
   * Complete current orientation target
   */
  private completeCurrentTarget(): void {
    this.currentTargetIndex++;

    // Calculate progress
    const progress = (this.currentTargetIndex / this.targets.length) * 100;
    this.updateProgress(progress);

    // Reset hold timer
    this.targetHoldStart = undefined;

    console.log(
      `Orientation target ${this.currentTargetIndex}/${this.targets.length} completed`
    );
  }

  /**
   * Get current target
   */
  public getCurrentTarget(): OrientationTarget | undefined {
    return this.targets[this.currentTargetIndex];
  }

  /**
   * Get all targets
   */
  public getTargets(): OrientationTarget[] {
    return this.targets;
  }
}
