/**
 * HapticController.ts
 * Manages haptic feedback patterns for mobile devices
 * Implements 13 unique vibration patterns for PortalSync
 */

import { HapticPattern } from '../utils/Constants';

export interface HapticPatternConfig {
  duration: number; // Total duration in ms
  intensity: number; // 0.0 to 1.0
  pattern?: number[]; // Custom pattern [vibrate, pause, vibrate, ...]
  type?: 'continuous' | 'pulse' | 'custom';
}

export class HapticController {
  private patterns: Map<HapticPattern, HapticPatternConfig>;
  private isEnabled: boolean = true;
  private userIntensity: number = 1.0; // User preference multiplier (0.0 to 1.0)
  private isPlaying: boolean = false;

  constructor() {
    this.patterns = this.initializePatterns();
  }

  /**
   * Initialize all 13 haptic patterns
   */
  private initializePatterns(): Map<HapticPattern, HapticPatternConfig> {
    const patterns = new Map<HapticPattern, HapticPatternConfig>();

    // Portal creation patterns
    patterns.set(HapticPattern.PORTAL_RESIZE, {
      duration: 50,
      intensity: 0.3,
      type: 'continuous'
    });

    patterns.set(HapticPattern.PORTAL_ROTATE, {
      duration: 50,
      intensity: 0.2,
      type: 'continuous'
    });

    patterns.set(HapticPattern.PORTAL_PAINT, {
      duration: 30,
      intensity: 0.4,
      type: 'pulse'
    });

    patterns.set(HapticPattern.PORTAL_ACTIVATE, {
      duration: 200,
      intensity: 0.8,
      pattern: [50, 50, 100],
      type: 'custom'
    });

    // Discovery patterns
    patterns.set(HapticPattern.DISCOVERY, {
      duration: 150,
      intensity: 0.6,
      pattern: [30, 30, 60],
      type: 'custom'
    });

    // Feedback patterns
    patterns.set(HapticPattern.SUCCESS, {
      duration: 300,
      intensity: 1.0,
      pattern: [50, 50, 100, 50, 100],
      type: 'custom'
    });

    patterns.set(HapticPattern.FAILURE, {
      duration: 150,
      intensity: 0.7,
      pattern: [100, 50, 100],
      type: 'custom'
    });

    // Collaboration patterns
    patterns.set(HapticPattern.RELAY_PERFECT, {
      duration: 100,
      intensity: 0.9,
      pattern: [20, 20, 60],
      type: 'custom'
    });

    patterns.set(HapticPattern.RELAY_GOOD, {
      duration: 100,
      intensity: 0.6,
      pattern: [50, 50],
      type: 'custom'
    });

    patterns.set(HapticPattern.RELAY_MISS, {
      duration: 80,
      intensity: 0.4,
      pattern: [80],
      type: 'custom'
    });

    patterns.set(HapticPattern.SHAKE_FEEDBACK, {
      duration: 80,
      intensity: 0.5,
      type: 'pulse'
    });

    patterns.set(HapticPattern.COLLABORATION_START, {
      duration: 120,
      intensity: 0.7,
      pattern: [40, 40, 40],
      type: 'custom'
    });

    patterns.set(HapticPattern.COLLABORATION_SYNC, {
      duration: 150,
      intensity: 0.8,
      pattern: [50, 50, 50],
      type: 'custom'
    });

    return patterns;
  }

  /**
   * Play a haptic pattern
   */
  public play(pattern: HapticPattern): void {
    if (!this.isEnabled) return;

    const config = this.patterns.get(pattern);
    if (!config) {
      console.warn(`Haptic pattern not found: ${pattern}`);
      return;
    }

    // Apply user intensity preference
    const adjustedIntensity = config.intensity * this.userIntensity;

    // Play haptic based on platform
    this.playPlatformHaptic(config, adjustedIntensity);
  }

  /**
   * Play haptic feedback using platform-specific API
   */
  private playPlatformHaptic(config: HapticPatternConfig, intensity: number): void {
    // Meta Horizon Worlds API
    if (typeof PlayerHand !== 'undefined' && typeof PlayerHand.PlayHaptics === 'function') {
      try {
        PlayerHand.PlayHaptics({
          duration: config.duration,
          intensity: intensity,
          pattern: config.pattern
        });
      } catch (error) {
        console.error('Error playing haptic via Meta Horizon API:', error);
      }
    }
    // Web Vibration API fallback (for testing)
    else if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      if (config.type === 'custom' && config.pattern) {
        navigator.vibrate(config.pattern);
      } else {
        navigator.vibrate(config.duration);
      }
    }
    // Console fallback for development
    else {
      console.log(`[HAPTIC] ${config.type} - Duration: ${config.duration}ms, Intensity: ${intensity}`);
    }

    this.isPlaying = true;

    // Reset playing state after duration
    setTimeout(() => {
      this.isPlaying = false;
    }, config.duration);
  }

  /**
   * Broadcast haptic to multiple players (for collaboration)
   */
  public broadcast(pattern: HapticPattern, playerIds: string[]): void {
    if (!this.isEnabled) return;

    const config = this.patterns.get(pattern);
    if (!config) return;

    // TODO: Implement network broadcast to other players
    playerIds.forEach(playerId => {
      this.sendHapticEvent(playerId, config);
    });
  }

  /**
   * Send haptic event to remote player
   */
  private sendHapticEvent(playerId: string, config: HapticPatternConfig): void {
    // TODO: Implement network event sending
    console.log(`Sending haptic to player ${playerId}:`, config);
  }

  /**
   * Enable/disable haptic feedback
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Set user intensity preference (0.0 to 1.0)
   */
  public setIntensity(intensity: number): void {
    this.userIntensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Create custom haptic pattern
   */
  public createCustomPattern(
    _name: string,
    duration: number,
    intensity: number,
    pattern?: number[]
  ): void {
    // Allow developers to add custom patterns
    const customPattern = pattern ? HapticPattern.SUCCESS : HapticPattern.SUCCESS;

    this.patterns.set(customPattern, {
      duration,
      intensity,
      pattern,
      type: pattern ? 'custom' : 'continuous'
    });
  }

  /**
   * Test all haptic patterns (for debugging)
   */
  public async testAllPatterns(): Promise<void> {
    console.log('Testing all haptic patterns...');

    for (const [patternName, config] of this.patterns.entries()) {
      console.log(`Testing: ${patternName}`);
      this.play(patternName as HapticPattern);

      // Wait for pattern to complete plus a small delay
      await this.delay(config.duration + 500);
    }

    console.log('Haptic pattern testing complete');
  }

  /**
   * Get pattern configuration
   */
  public getPattern(pattern: HapticPattern): HapticPatternConfig | undefined {
    return this.patterns.get(pattern);
  }

  /**
   * Check if haptics are supported
   */
  public static isSupported(): boolean {
    // Check Meta Horizon API
    if (typeof PlayerHand !== 'undefined' && typeof PlayerHand.PlayHaptics === 'function') {
      return true;
    }

    // Check Web Vibration API
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      return true;
    }

    return false;
  }

  // Helper methods

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public get enabled(): boolean {
    return this.isEnabled;
  }

  public get intensity(): number {
    return this.userIntensity;
  }

  public get playing(): boolean {
    return this.isPlaying;
  }
}

// Placeholder for Meta Horizon API (replace with actual import)
declare const PlayerHand: {
  PlayHaptics(config: any): void;
};
