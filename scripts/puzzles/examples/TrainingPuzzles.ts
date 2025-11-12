/**
 * TrainingPuzzles.ts
 * Tutorial puzzles for Training Grounds zone
 */

import { BasePuzzle, PuzzleDifficulty } from '../BasePuzzle';
import { GyroscopePuzzle, OrientationTarget } from '../GyroscopePuzzle';
import { MultiTouchPuzzle } from '../MultiTouchPuzzle';
import { HapticController } from '../../core/HapticController';
import { InputController } from '../../core/InputController';
import { ScannerSystem } from '../../systems/ScannerSystem';

/**
 * Portal Creation Tutorial
 * Teaches basic portal creation gestures
 */
export class PortalCreationTutorial extends MultiTouchPuzzle {
  constructor(haptics: HapticController, input: InputController) {
    super(
      'tutorial_portal_creation',
      'Portal Creation Basics',
      'Learn to create your first portal using multi-touch gestures',
      PuzzleDifficulty.TUTORIAL,
      haptics,
      input,
      [
        {
          id: 'target1',
          position: { x: 200, y: 300 },
          radius: 60,
          isTouched: false
        }
      ],
      false
    );
  }

  protected onActivate(): void {
    super.onActivate();
    console.log('Tutorial: Portal Creation - Long press to start creating a portal');
  }

  protected onComplete(): void {
    super.onComplete();
    console.log('Tutorial Complete: You created your first portal!');
  }
}

/**
 * Scanner Tutorial
 * Teaches how to use the gyroscope scanner
 */
export class ScannerTutorial extends GyroscopePuzzle {
  constructor(haptics: HapticController, scanner: ScannerSystem) {
    const targets: OrientationTarget[] = [
      { pitch: 0, roll: 0, tolerance: 10, duration: 1000 },   // Center
      { pitch: 30, roll: 0, tolerance: 10, duration: 1000 },  // Tilt forward
      { pitch: -30, roll: 0, tolerance: 10, duration: 1000 }  // Tilt back
    ];

    super(
      'tutorial_scanner',
      'Scanner Basics',
      'Learn to use the gyroscope scanner by tilting your device',
      PuzzleDifficulty.TUTORIAL,
      haptics,
      scanner,
      targets
    );
  }

  protected onActivate(): void {
    super.onActivate();
    console.log('Tutorial: Scanner - Tilt your device to scan for energy signatures');
  }

  protected onComplete(): void {
    super.onComplete();
    console.log('Tutorial Complete: You mastered the scanner!');
  }
}

/**
 * Gesture Practice
 * Practice all gesture types
 */
export class GesturePractice extends BasePuzzle {
  private gesturesCompleted: Set<string> = new Set();
  private requiredGestures = ['tap', 'double-tap', 'pinch', 'rotate', 'swipe'];

  constructor(haptics: HapticController) {
    super(
      'tutorial_gestures',
      'Gesture Practice',
      'Practice all available gestures',
      PuzzleDifficulty.TUTORIAL,
      haptics
    );
  }

  protected onActivate(): void {
    console.log('Tutorial: Practice tapping, double-tapping, pinching, rotating, and swiping');
  }

  protected onStart(): void {
    // Instructions
    console.log('Try each gesture:');
    console.log('- Tap once');
    console.log('- Double tap');
    console.log('- Pinch (two fingers closer)');
    console.log('- Rotate (two fingers twist)');
    console.log('- Swipe (fast slide)');
  }

  public registerGesture(gesture: string): void {
    if (this.requiredGestures.includes(gesture) && !this.gesturesCompleted.has(gesture)) {
      this.gesturesCompleted.add(gesture);
      console.log(`Gesture learned: ${gesture}`);

      const progress = (this.gesturesCompleted.size / this.requiredGestures.length) * 100;
      this.updateProgress(progress);
    }
  }

  protected onComplete(): void {
    console.log('Tutorial Complete: You learned all gestures!');
  }

  protected onFail(): void {}
  protected onReset(): void {
    this.gesturesCompleted.clear();
  }
  protected onProgressUpdate(_progress: number): void {
    console.log(`Gestures learned: ${this.gesturesCompleted.size}/${this.requiredGestures.length}`);
  }
}
