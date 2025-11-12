/**
 * BasePuzzle.ts
 * Base class for all puzzle types in PortalSync
 */

import { HapticController } from '../core/HapticController';
import { HapticPattern } from '../utils/Constants';

export enum PuzzleState {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum PuzzleDifficulty {
  TUTORIAL = 'tutorial',
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

export interface PuzzleReward {
  points: number;
  unlocks?: string[];
  achievements?: string[];
}

export abstract class BasePuzzle {
  public id: string;
  public name: string;
  public description: string;
  public difficulty: PuzzleDifficulty;
  public state: PuzzleState;
  public progress: number; // 0-100
  public startTime?: number;
  public completionTime?: number;
  public attempts: number;

  protected hapticController: HapticController;
  protected onCompleteCallback?: (puzzle: BasePuzzle) => void;
  protected onFailCallback?: (puzzle: BasePuzzle) => void;

  constructor(
    id: string,
    name: string,
    description: string,
    difficulty: PuzzleDifficulty,
    hapticController: HapticController
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.difficulty = difficulty;
    this.state = PuzzleState.INACTIVE;
    this.progress = 0;
    this.attempts = 0;
    this.hapticController = hapticController;
  }

  /**
   * Activate puzzle
   */
  public activate(): void {
    if (this.state !== PuzzleState.INACTIVE) return;

    this.state = PuzzleState.ACTIVE;
    this.startTime = Date.now();
    this.attempts++;

    this.onActivate();
    this.showPuzzleUI();

    console.log(`Puzzle activated: ${this.name}`);
  }

  /**
   * Start puzzle
   */
  public start(): void {
    if (this.state !== PuzzleState.ACTIVE) return;

    this.state = PuzzleState.IN_PROGRESS;
    this.onStart();

    console.log(`Puzzle started: ${this.name}`);
  }

  /**
   * Update puzzle progress
   */
  protected updateProgress(progress: number): void {
    this.progress = Math.max(0, Math.min(100, progress));

    this.onProgressUpdate(this.progress);

    // Check if completed
    if (this.progress >= 100) {
      this.complete();
    }
  }

  /**
   * Complete puzzle
   */
  protected complete(): void {
    if (this.state === PuzzleState.COMPLETED) return;

    this.state = PuzzleState.COMPLETED;
    this.completionTime = Date.now();
    this.progress = 100;

    // Haptic feedback
    this.hapticController.play(HapticPattern.SUCCESS);

    // Visual feedback
    this.playCompletionEffects();

    // Rewards
    const rewards = this.getRewards();
    this.awardRewards(rewards);

    // Callback
    this.onComplete();
    if (this.onCompleteCallback) {
      this.onCompleteCallback(this);
    }

    console.log(`Puzzle completed: ${this.name}`);
  }

  /**
   * Fail puzzle
   */
  protected fail(): void {
    if (this.state === PuzzleState.FAILED) return;

    this.state = PuzzleState.FAILED;

    // Haptic feedback
    this.hapticController.play(HapticPattern.FAILURE);

    // Visual feedback
    this.playFailureEffects();

    // Callback
    this.onFail();
    if (this.onFailCallback) {
      this.onFailCallback(this);
    }

    console.log(`Puzzle failed: ${this.name}`);
  }

  /**
   * Reset puzzle
   */
  public reset(): void {
    this.state = PuzzleState.INACTIVE;
    this.progress = 0;
    this.startTime = undefined;
    this.completionTime = undefined;

    this.onReset();
    this.hidePuzzleUI();

    console.log(`Puzzle reset: ${this.name}`);
  }

  /**
   * Get time elapsed in seconds
   */
  public getTimeElapsed(): number {
    if (!this.startTime) return 0;

    const endTime = this.completionTime || Date.now();
    return (endTime - this.startTime) / 1000;
  }

  /**
   * Get puzzle rewards
   */
  protected getRewards(): PuzzleReward {
    // Base rewards (can be overridden)
    const basePoints = this.getBasePoints();
    const timeBonus = this.getTimeBonus();
    const attemptPenalty = Math.max(0, (this.attempts - 1) * 10);

    return {
      points: Math.floor(basePoints + timeBonus - attemptPenalty)
    };
  }

  /**
   * Get base points for difficulty
   */
  private getBasePoints(): number {
    switch (this.difficulty) {
      case PuzzleDifficulty.TUTORIAL:
        return 50;
      case PuzzleDifficulty.EASY:
        return 100;
      case PuzzleDifficulty.MEDIUM:
        return 200;
      case PuzzleDifficulty.HARD:
        return 350;
      case PuzzleDifficulty.EXPERT:
        return 500;
    }
  }

  /**
   * Get time bonus
   */
  private getTimeBonus(): number {
    const timeElapsed = this.getTimeElapsed();
    const targetTime = this.getTargetTime();

    if (timeElapsed < targetTime) {
      const percentFaster = ((targetTime - timeElapsed) / targetTime) * 100;
      return Math.floor(percentFaster);
    }

    return 0;
  }

  /**
   * Get target completion time (can be overridden)
   */
  protected getTargetTime(): number {
    switch (this.difficulty) {
      case PuzzleDifficulty.TUTORIAL:
        return 30;
      case PuzzleDifficulty.EASY:
        return 60;
      case PuzzleDifficulty.MEDIUM:
        return 90;
      case PuzzleDifficulty.HARD:
        return 120;
      case PuzzleDifficulty.EXPERT:
        return 180;
    }
  }

  /**
   * Set completion callback
   */
  public setOnComplete(callback: (puzzle: BasePuzzle) => void): void {
    this.onCompleteCallback = callback;
  }

  /**
   * Set failure callback
   */
  public setOnFail(callback: (puzzle: BasePuzzle) => void): void {
    this.onFailCallback = callback;
  }

  // Abstract methods to be implemented by subclasses

  protected abstract onActivate(): void;
  protected abstract onStart(): void;
  protected abstract onComplete(): void;
  protected abstract onFail(): void;
  protected abstract onReset(): void;
  protected abstract onProgressUpdate(progress: number): void;

  // Helper methods (to be implemented with Meta Horizon API)

  protected showPuzzleUI(): void {
    console.log(`Showing puzzle UI: ${this.name}`);
  }

  protected hidePuzzleUI(): void {
    console.log(`Hiding puzzle UI: ${this.name}`);
  }

  protected playCompletionEffects(): void {
    console.log(`Playing completion effects: ${this.name}`);
  }

  protected playFailureEffects(): void {
    console.log(`Playing failure effects: ${this.name}`);
  }

  protected awardRewards(rewards: PuzzleReward): void {
    console.log(`Awarding rewards:`, rewards);
  }
}
