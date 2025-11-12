/**
 * index.ts
 * Main entry point for PortalSync: Reality Bridge
 * Exports all core systems and utilities
 */

// Core Systems
export { GameController, initializeGame, getGameInstance } from './core/GameController';
export { HapticController } from './core/HapticController';
export { InputController } from './core/InputController';
export { PortalManager, PortalType } from './core/PortalManager';

// Subsystems
export { ScannerSystem } from './systems/ScannerSystem';
export { CollaborationSystem, CollabChallengeType } from './systems/CollaborationSystem';
export { ZoneManager } from './systems/ZoneManager';
export { NetworkManager, NetworkEventType } from './systems/NetworkManager';
export { AudioManager, SoundCategory } from './systems/AudioManager';
export { PerformanceMonitor } from './systems/PerformanceMonitor';

// UI
export { UIManager, UIElementType, UIPosition, ThumbZone } from './ui/UIManager';

// Puzzles
export { BasePuzzle, PuzzleDifficulty, PuzzleState } from './puzzles/BasePuzzle';
export { GyroscopePuzzle } from './puzzles/GyroscopePuzzle';
export { MultiTouchPuzzle } from './puzzles/MultiTouchPuzzle';

// Example Puzzles
export {
  PortalCreationTutorial,
  ScannerTutorial,
  GesturePractice
} from './puzzles/examples/TrainingPuzzles';
export {
  CrystalAlignmentPuzzle,
  EnergyConstellation,
  DualActivationPuzzle
} from './puzzles/examples/CrystalCavernsPuzzles';
export {
  PlatformRotationPuzzle,
  PrecisionPortalPlacement,
  TeamBridgeBuilding
} from './puzzles/examples/SkyPlatformsPuzzles';

// Constants and Utilities
export {
  HapticPattern,
  GestureType,
  ZoneId,
  EnergyRarity,
  SoundEffect,
  QualityPreset,
  AchievementId,
  PERFORMANCE_CONFIG,
  SCANNER_CONFIG,
  PORTAL_CONFIG,
  COLLAB_CONFIG,
  UI_CONFIG,
  COLORS
} from './utils/Constants';

// Types
export type { GestureEvent, TouchPoint, GestureCallback } from './core/InputController';
export type { Portal } from './core/PortalManager';
export type { HapticPatternConfig } from './core/HapticController';
export type { EnergySignature, DeviceOrientation, DeviceMotion } from './systems/ScannerSystem';
export type {
  Player,
  CollabChallenge,
  RelayEvent,
  RelayTiming
} from './systems/CollaborationSystem';
export type { WorldZone, Bounds3D } from './systems/ZoneManager';
export type { PuzzleReward } from './puzzles/BasePuzzle';
export type { OrientationTarget } from './puzzles/GyroscopePuzzle';
export type { TouchTarget } from './puzzles/MultiTouchPuzzle';
export type { NetworkEvent, PlayerState } from './systems/NetworkManager';
export type { AudioConfig, SoundDefinition } from './systems/AudioManager';
export type { PerformanceMetrics, PerformanceStats } from './systems/PerformanceMonitor';
export type { UIElement, Button, Notification } from './ui/UIManager';

/**
 * Quick start function for Meta Horizon Worlds
 */
export function startPortalSync() {
  console.log('='.repeat(60));
  console.log('  PortalSync: Reality Bridge');
  console.log('  Mobile-First Meta Horizon Experience');
  console.log('='.repeat(60));

  // Import dynamically to avoid circular dependency
  const { initializeGame } = require('./core/GameController');
  const game = initializeGame();

  console.log('\n✓ Game initialized successfully!');
  console.log('\nControls:');
  console.log('  • Long press: Start portal creation');
  console.log('  • Pinch: Scale portal');
  console.log('  • Rotate: Orient portal');
  console.log('  • Swipe: Paint portal boundary');
  console.log('  • Double tap: Activate portal');
  console.log('  • Tap scanner button: Toggle reality scanner');
  console.log('  • Tilt device: Scan for energy signatures');
  console.log('  • Shake device: Disperse energy clouds');
  console.log('\n' + '='.repeat(60));

  return game as any;
}
