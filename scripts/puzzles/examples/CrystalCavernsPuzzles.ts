/**
 * CrystalCavernsPuzzles.ts
 * Puzzles for Crystal Caverns zone
 */

import { GyroscopePuzzle, OrientationTarget } from '../GyroscopePuzzle';
import { MultiTouchPuzzle, TouchTarget } from '../MultiTouchPuzzle';
import { PuzzleDifficulty } from '../BasePuzzle';
import { HapticController } from '../../core/HapticController';
import { InputController } from '../../core/InputController';
import { ScannerSystem } from '../../systems/ScannerSystem';

/**
 * Crystal Alignment Puzzle
 * Align 5 crystals using device orientation
 */
export class CrystalAlignmentPuzzle extends GyroscopePuzzle {
  constructor(haptics: HapticController, scanner: ScannerSystem) {
    const targets: OrientationTarget[] = [
      { pitch: 45, roll: 0, tolerance: 5, duration: 2000 },
      { pitch: 90, roll: 0, tolerance: 5, duration: 2000 },
      { pitch: 45, roll: 45, tolerance: 5, duration: 2000 },
      { pitch: 0, roll: 45, tolerance: 5, duration: 2000 },
      { pitch: 0, roll: 0, tolerance: 5, duration: 2000 }
    ];

    super(
      'crystal_alignment',
      'Crystal Alignment',
      'Align all 5 crystals by orienting your device precisely',
      PuzzleDifficulty.MEDIUM,
      haptics,
      scanner,
      targets
    );
  }

  protected onActivate(): void {
    super.onActivate();
    console.log('Puzzle: Align the crystals by finding the correct device orientations');
  }

  protected onComplete(): void {
    super.onComplete();
    console.log('All crystals aligned! Portal power increased.');
  }
}

/**
 * Energy Constellation
 * Collect 10 energy nodes in specific order
 */
export class EnergyConstellation extends MultiTouchPuzzle {
  constructor(haptics: HapticController, input: InputController) {
    const targets: TouchTarget[] = [
      { id: 'node1', position: { x: 100, y: 100 }, radius: 40, isTouched: false },
      { id: 'node2', position: { x: 200, y: 150 }, radius: 40, isTouched: false },
      { id: 'node3', position: { x: 300, y: 100 }, radius: 40, isTouched: false },
      { id: 'node4', position: { x: 250, y: 200 }, radius: 40, isTouched: false },
      { id: 'node5', position: { x: 350, y: 250 }, radius: 40, isTouched: false },
      { id: 'node6', position: { x: 150, y: 250 }, radius: 40, isTouched: false },
      { id: 'node7', position: { x: 100, y: 350 }, radius: 40, isTouched: false },
      { id: 'node8', position: { x: 300, y: 350 }, radius: 40, isTouched: false },
      { id: 'node9', position: { x: 200, y: 400 }, radius: 40, isTouched: false },
      { id: 'node10', position: { x: 200, y: 250 }, radius: 40, isTouched: false }
    ];

    super(
      'energy_constellation',
      'Energy Constellation',
      'Collect all energy nodes to complete the constellation',
      PuzzleDifficulty.MEDIUM,
      haptics,
      input,
      targets,
      false
    );
  }

  protected onActivate(): void {
    super.onActivate();
    console.log('Puzzle: Touch all energy nodes to complete the constellation');
  }

  protected onComplete(): void {
    super.onComplete();
    console.log('Constellation complete! Energy levels restored.');
  }
}

/**
 * Dual Activation Puzzle
 * Requires two players to touch simultaneously
 */
export class DualActivationPuzzle extends MultiTouchPuzzle {
  constructor(haptics: HapticController, input: InputController) {
    const targets: TouchTarget[] = [
      { id: 'activation1', position: { x: 100, y: 300 }, radius: 50, isTouched: false, requiredDuration: 3000 },
      { id: 'activation2', position: { x: 300, y: 300 }, radius: 50, isTouched: false, requiredDuration: 3000 }
    ];

    super(
      'dual_activation',
      'Dual Activation',
      'Two players must activate simultaneously',
      PuzzleDifficulty.MEDIUM,
      haptics,
      input,
      targets,
      true // Simultaneous touch required
    );
  }

  protected onActivate(): void {
    super.onActivate();
    console.log('Puzzle: Two players must touch activation points together');
  }

  protected onComplete(): void {
    super.onComplete();
    console.log('Dual activation successful! Chamber unlocked.');
  }
}
