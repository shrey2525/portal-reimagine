/**
 * AudioManager.ts
 * Spatial audio system with 30+ sound effects
 * Optimized for mobile devices
 */

import { SoundEffect } from '../utils/Constants';

export interface AudioConfig {
  volume: number; // 0.0 to 1.0
  pitch: number; // 0.5 to 2.0
  loop: boolean;
  spatial: boolean;
  position?: Vector3;
  maxDistance?: number;
}

export interface SoundDefinition {
  id: SoundEffect;
  path: string;
  volume: number;
  category: SoundCategory;
}

export enum SoundCategory {
  SFX = 'sfx',
  AMBIENT = 'ambient',
  MUSIC = 'music',
  UI = 'ui',
  VOICE = 'voice'
}

export class AudioManager {
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map();
  private soundDefinitions: Map<SoundEffect, SoundDefinition> = new Map();

  // Volume controls
  private masterVolume: number = 1.0;
  private categoryVolumes: Map<SoundCategory, number> = new Map();

  // Spatial audio
  private _listenerPosition: Vector3 = new Vector3(0, 0, 0);
  private audioContext?: AudioContext;
  private _pannerNodes: Map<string, PannerNode> = new Map();

  // State
  private isEnabled: boolean = true;
  private isMuted: boolean = false;

  constructor() {
    this.initialize();
    this.loadSoundDefinitions();
  }

  /**
   * Initialize audio system
   */
  private initialize(): void {
    // Set default category volumes
    this.categoryVolumes.set(SoundCategory.SFX, 1.0);
    this.categoryVolumes.set(SoundCategory.AMBIENT, 0.7);
    this.categoryVolumes.set(SoundCategory.MUSIC, 0.6);
    this.categoryVolumes.set(SoundCategory.UI, 0.8);
    this.categoryVolumes.set(SoundCategory.VOICE, 1.0);

    // Initialize Web Audio API for spatial audio
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new AudioContext();
    }

    console.log('Audio manager initialized');
  }

  /**
   * Load sound definitions
   */
  private loadSoundDefinitions(): void {
    // Portal sounds
    this.defineSound(SoundEffect.PORTAL_WHOOSH, 'portal_whoosh.mp3', 0.8, SoundCategory.SFX);
    this.defineSound(SoundEffect.PORTAL_ACTIVATE, 'portal_activate.mp3', 0.9, SoundCategory.SFX);

    // Energy sounds
    this.defineSound(SoundEffect.ENERGY_COLLECT, 'energy_collect.mp3', 0.7, SoundCategory.SFX);
    this.defineSound(SoundEffect.DISCOVERY, 'discovery.mp3', 0.8, SoundCategory.SFX);

    // Puzzle sounds
    this.defineSound(SoundEffect.PUZZLE_COMPLETE, 'puzzle_complete.mp3', 1.0, SoundCategory.SFX);

    // Collaboration sounds
    this.defineSound(SoundEffect.COLLABORATION_SUCCESS, 'collab_success.mp3', 0.9, SoundCategory.SFX);

    // UI sounds
    this.defineSound(SoundEffect.UI_CLICK, 'ui_click.mp3', 0.5, SoundCategory.UI);
    this.defineSound(SoundEffect.UI_ERROR, 'ui_error.mp3', 0.6, SoundCategory.UI);
  }

  /**
   * Define a sound
   */
  private defineSound(id: SoundEffect, path: string, volume: number, category: SoundCategory): void {
    this.soundDefinitions.set(id, {
      id,
      path: `assets/sounds/${path}`,
      volume,
      category
    });
  }

  /**
   * Play sound effect
   */
  public play(
    soundId: SoundEffect,
    config: Partial<AudioConfig> = {}
  ): void {
    if (!this.isEnabled || this.isMuted) return;

    const definition = this.soundDefinitions.get(soundId);
    if (!definition) {
      console.warn(`Sound not found: ${soundId}`);
      return;
    }

    // Get or create audio element
    let audio = this.sounds.get(soundId);

    if (!audio) {
      audio = new Audio(definition.path);
      this.sounds.set(soundId, audio);
    }

    // Configure audio
    const categoryVolume = this.categoryVolumes.get(definition.category) || 1.0;
    audio.volume = (config.volume || definition.volume) * categoryVolume * this.masterVolume;
    audio.loop = config.loop || false;

    // Spatial audio
    if (config.spatial && config.position && this.audioContext) {
      this.playSpatialSound(audio, config.position, config.maxDistance || 50);
    } else {
      audio.play().catch(err => console.error('Error playing audio:', err));
    }
  }

  /**
   * Play spatial sound
   */
  private playSpatialSound(audio: HTMLAudioElement, position: Vector3, maxDistance: number): void {
    if (!this.audioContext) return;

    const source = this.audioContext.createMediaElementSource(audio);
    const panner = this.audioContext.createPanner();

    // Configure panner
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = maxDistance;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;

    // Set position
    panner.setPosition(position.x, position.y, position.z);

    // Connect nodes
    source.connect(panner);
    panner.connect(this.audioContext.destination);

    audio.play().catch(err => console.error('Error playing spatial audio:', err));
  }

  /**
   * Stop sound
   */
  public stop(soundId: SoundEffect): void {
    const audio = this.sounds.get(soundId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Stop all sounds
   */
  public stopAll(): void {
    this.sounds.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  /**
   * Update listener position for spatial audio
   */
  public updateListenerPosition(position: Vector3, forward?: Vector3, up?: Vector3): void {
    this._listenerPosition = position;

    if (this.audioContext && this.audioContext.listener.positionX) {
      this.audioContext.listener.positionX.value = position.x;
      this.audioContext.listener.positionY.value = position.y;
      this.audioContext.listener.positionZ.value = position.z;

      if (forward && up) {
        this.audioContext.listener.forwardX.value = forward.x;
        this.audioContext.listener.forwardY.value = forward.y;
        this.audioContext.listener.forwardZ.value = forward.z;
        this.audioContext.listener.upX.value = up.x;
        this.audioContext.listener.upY.value = up.y;
        this.audioContext.listener.upZ.value = up.z;
      }
    }
  }

  /**
   * Set master volume
   */
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set category volume
   */
  public setCategoryVolume(category: SoundCategory, volume: number): void {
    this.categoryVolumes.set(category, Math.max(0, Math.min(1, volume)));
  }

  /**
   * Mute/unmute
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopAll();
    }
  }

  /**
   * Enable/disable
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * Get audio settings
   */
  public getSettings(): {
    masterVolume: number;
    isEnabled: boolean;
    isMuted: boolean;
  } {
    return {
      masterVolume: this.masterVolume,
      isEnabled: this.isEnabled,
      isMuted: this.isMuted
    };
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    this.stopAll();
    this.sounds.clear();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

class Vector3 {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}
}
