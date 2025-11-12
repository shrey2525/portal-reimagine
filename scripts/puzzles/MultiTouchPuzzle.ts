/**
 * MultiTouchPuzzle.ts
 * Puzzle type that uses multi-touch gestures for solving
 */

import { BasePuzzle, PuzzleDifficulty } from './BasePuzzle';
import { HapticController } from '../core/HapticController';
import { InputController, GestureEvent } from '../core/InputController';
import { GestureType } from '../utils/Constants';

export interface TouchTarget {
  id: string;
  position: Vector2;
  radius: number;
  isTouched: boolean;
  requiredDuration?: number; // ms to hold touch
}

export class MultiTouchPuzzle extends BasePuzzle {
  protected inputController: InputController;
  protected touchTargets: TouchTarget[];
  protected simultaneousTouchRequired: boolean;

  constructor(
    id: string,
    name: string,
    description: string,
    difficulty: PuzzleDifficulty,
    hapticController: HapticController,
    inputController: InputController,
    touchTargets: TouchTarget[],
    simultaneousTouchRequired: boolean = false
  ) {
    super(id, name, description, difficulty, hapticController);
    this.inputController = inputController;
    this.touchTargets = touchTargets;
    this.simultaneousTouchRequired = simultaneousTouchRequired;
  }

  protected onActivate(): void {
    // Reset all targets
    this.touchTargets.forEach(target => {
      target.isTouched = false;
    });

    // Register touch listeners
    this.inputController.on(GestureType.TAP, this.onTap.bind(this));
    this.inputController.on(GestureType.LONG_PRESS, this.onLongPress.bind(this));
  }

  protected onStart(): void {
    // Show touch targets
    this.showTouchTargets();
  }

  protected onComplete(): void {
    // Cleanup listeners
    this.cleanup();
  }

  protected onFail(): void {
    // Cleanup listeners
    this.cleanup();
  }

  protected onReset(): void {
    this.touchTargets.forEach(target => {
      target.isTouched = false;
    });
    this.cleanup();
  }

  protected onProgressUpdate(progress: number): void {
    console.log(`Multi-touch puzzle progress: ${progress}%`);
  }

  /**
   * Handle tap gesture
   */
  private onTap(event: GestureEvent): void {
    if (this.state !== BasePuzzle.prototype.constructor.name) return;

    // Check if tap is on any target
    const touchedTarget = this.findTargetAtPosition(event.position);

    if (touchedTarget && !touchedTarget.isTouched) {
      this.touchTarget(touchedTarget);
    }
  }

  /**
   * Handle long press gesture
   */
  private onLongPress(event: GestureEvent): void {
    if (this.state !== BasePuzzle.prototype.constructor.name) return;

    const touchedTarget = this.findTargetAtPosition(event.position);

    if (touchedTarget && touchedTarget.requiredDuration) {
      this.touchTarget(touchedTarget);
    }
  }

  /**
   * Find target at screen position
   */
  private findTargetAtPosition(position: Vector2): TouchTarget | undefined {
    // Convert screen position to world position
    const worldPos = this.screenToWorldPosition(position);

    return this.touchTargets.find(target => {
      const distance = Vector2.distance(worldPos, target.position);
      return distance <= target.radius;
    });
  }

  /**
   * Mark target as touched
   */
  private touchTarget(target: TouchTarget): void {
    target.isTouched = true;

    // Visual and haptic feedback
    this.playTargetTouchEffect(target);

    // Check completion
    this.checkCompletion();
  }

  /**
   * Check if puzzle is completed
   */
  private checkCompletion(): void {
    const touchedCount = this.touchTargets.filter(t => t.isTouched).length;
    const totalCount = this.touchTargets.length;

    // Update progress
    const progress = (touchedCount / totalCount) * 100;
    this.updateProgress(progress);
  }

  /**
   * Show touch targets
   */
  private showTouchTargets(): void {
    // TODO: Render touch target UI
    console.log('Showing touch targets', this.touchTargets);
  }

  /**
   * Play touch effect
   */
  private playTargetTouchEffect(target: TouchTarget): void {
    // TODO: Play VFX and SFX
    console.log('Target touched:', target.id);
  }

  /**
   * Convert screen position to world position
   */
  private screenToWorldPosition(screenPos: Vector2): Vector2 {
    // TODO: Implement proper screen-to-world conversion
    return screenPos;
  }

  /**
   * Cleanup event listeners
   */
  private cleanup(): void {
    // Note: We can't easily remove specific bound functions
    // This is a simplified cleanup
  }

  /**
   * Get remaining targets
   */
  public getRemainingTargets(): TouchTarget[] {
    return this.touchTargets.filter(t => !t.isTouched);
  }
}

// Vector2 utility class
class Vector2 {
  constructor(public x: number = 0, public y: number = 0) {}

  static distance(a: Vector2, b: Vector2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
