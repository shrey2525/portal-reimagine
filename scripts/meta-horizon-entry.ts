/**
 * Meta Horizon Entry Point
 *
 * This file bundles all TypeScript systems into a single JavaScript file
 * that can be uploaded to Meta Horizon Worlds.
 *
 * Build: npm run build:horizon
 * Output: dist/portalsync-bundle.js
 */

// Import core systems
import { GameController } from './core/GameController';
import { PortalManager } from './core/PortalManager';
import { InputController } from './core/InputController';
import { HapticController } from './core/HapticController';
import { ScannerSystem } from './core/ScannerSystem';

// Import adapter
import { MetaHorizonAdapter } from './adapters/MetaHorizonSDK';

// Import utilities
import { Vector3 } from './utils/Vector3';
import { Quaternion } from './utils/Quaternion';

/**
 * Initialize PortalSync systems
 * This function is called when the Meta Horizon world loads
 */
function initializePortalSync() {
  console.log('========================================');
  console.log('PORTALSYNC: REALITY BRIDGE - Initializing...');
  console.log('========================================\n');

  try {
    // Initialize adapter
    const adapter = new MetaHorizonAdapter();
    console.log('✅ Meta Horizon adapter initialized');

    // Check if we're in Meta Horizon environment
    const isMetaHorizon = typeof (window as any).world !== 'undefined';
    console.log(isMetaHorizon ? '✅ Running in Meta Horizon' : '⚠️ Running in browser (test mode)');

    // Initialize game controller
    const gameController = new GameController();
    console.log('✅ Game controller initialized');

    // Initialize portal manager
    const portalManager = new PortalManager();
    console.log('✅ Portal manager initialized');

    // Initialize input controller
    const inputController = new InputController();
    console.log('✅ Input controller initialized');

    // Initialize haptic controller
    const hapticController = new HapticController();
    console.log('✅ Haptic controller initialized');

    // Initialize scanner system
    const scannerSystem = new ScannerSystem();
    console.log('✅ Scanner system initialized');

    console.log('\n✅ PortalSync initialized successfully!');
    console.log('>>> TAP SCREEN TO CREATE PORTAL <<<\n');

    // Expose to window for debugging
    (window as any).PortalSync = {
      gameController,
      portalManager,
      inputController,
      hapticController,
      scannerSystem,
      adapter,
      Vector3,
      Quaternion
    };

    return true;
  } catch (error) {
    console.error('❌ PortalSync initialization failed:', error);
    return false;
  }
}

/**
 * Auto-initialize when script loads
 * Meta Horizon will call this when world starts
 */
if (typeof window !== 'undefined') {
  // Wait for world to be ready
  if (typeof (window as any).world !== 'undefined') {
    initializePortalSync();
  } else {
    // Retry after 1 second if world not ready
    console.log('⏳ Waiting for Meta Horizon world...');
    setTimeout(() => {
      if (typeof (window as any).world !== 'undefined') {
        initializePortalSync();
      } else {
        console.error('❌ Meta Horizon world not available');
        console.log('ℹ️ Running in browser test mode');
        initializePortalSync(); // Initialize anyway for testing
      }
    }, 1000);
  }
}

// Export for module systems (if needed)
export {
  initializePortalSync,
  GameController,
  PortalManager,
  InputController,
  HapticController,
  ScannerSystem,
  MetaHorizonAdapter,
  Vector3,
  Quaternion
};
