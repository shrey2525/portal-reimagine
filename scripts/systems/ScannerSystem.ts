/**
 * ScannerSystem.ts
 * Gyroscope-based reality scanner for discovering hidden energy signatures
 * Uses device orientation and motion for gameplay mechanics
 */

import { HapticController } from '../core/HapticController';
import { HapticPattern, SCANNER_CONFIG, EnergyRarity, SoundEffect } from '../utils/Constants';
import { MetaHorizon } from '../adapters/MetaHorizonSDK';

export interface DeviceOrientation {
  alpha: number; // Z-axis rotation (0-360)
  beta: number;  // X-axis rotation (-180 to 180) - pitch
  gamma: number; // Y-axis rotation (-90 to 90) - roll
  absolute: boolean;
}

export interface DeviceMotion {
  acceleration: Vector3;
  accelerationIncludingGravity: Vector3;
  rotationRate: Vector3;
  interval: number;
}

export interface EnergySignature {
  id: string;
  position: Vector3;
  rarity: EnergyRarity;
  isRevealed: boolean;
  isCollected: boolean;
  zoneId: string;
}

export class ScannerSystem {
  private hapticController: HapticController;
  private isActive: boolean = false;

  // Device orientation
  private currentOrientation?: DeviceOrientation;
  private scanDirection: Vector3 = new Vector3(0, 0, 1);

  // Device motion
  private currentMotion?: DeviceMotion;
  private _shakeIntensity: number = 0;

  // Energy signatures
  private energySignatures: Map<string, EnergySignature> = new Map();
  private nearbySignatures: EnergySignature[] = [];

  // Scanner state
  private _scannerUI?: any; // Scanner UI overlay
  private _scanCone?: any; // Visual scan cone

  // Shake detection
  private lastShakeTime: number = 0;
  private shakeCount: number = 0;

  // Cloud dispersion
  private energyClouds: any[] = [];

  constructor(hapticController: HapticController) {
    this.hapticController = hapticController;
    this.initializeOrientationListeners();
    this.initializeMotionListeners();
  }

  /**
   * Initialize device orientation listeners
   */
  private initializeOrientationListeners(): void {
    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      // Request permission on iOS 13+
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((permissionState: string) => {
            if (permissionState === 'granted') {
              window.addEventListener('deviceorientation', this.onOrientationChange.bind(this));
            }
          })
          .catch((error: Error) => console.error('Error requesting orientation permission:', error));
      } else {
        // Non-iOS 13+ devices
        window.addEventListener('deviceorientation', this.onOrientationChange.bind(this));
      }
    }

    // Meta Horizon API (if available)
    MetaHorizon.enableGyroscope();
    MetaHorizon.onOrientation((data) => {
      this.onOrientationChange({
        alpha: data.yaw,
        beta: data.pitch,
        gamma: data.roll,
        absolute: true
      } as any);
    });
  }

  /**
   * Initialize device motion listeners
   */
  private initializeMotionListeners(): void {
    if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
      // Request permission on iOS 13+
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any).requestPermission()
          .then((permissionState: string) => {
            if (permissionState === 'granted') {
              window.addEventListener('devicemotion', this.onMotionChange.bind(this));
            }
          })
          .catch((error: Error) => console.error('Error requesting motion permission:', error));
      } else {
        window.addEventListener('devicemotion', this.onMotionChange.bind(this));
      }
    }
  }

  /**
   * Handle device orientation change
   */
  private onOrientationChange(event: DeviceOrientationEvent): void {
    if (!this.isActive) return;

    this.currentOrientation = {
      alpha: event.alpha || 0,
      beta: event.beta || 0,
      gamma: event.gamma || 0,
      absolute: event.absolute
    };

    // Convert orientation to world direction vector
    this.scanDirection = this.orientationToDirection(this.currentOrientation);

    // Check for energy signatures in scan direction
    this.scanForEnergies();

    // Update scanner UI
    this.updateScannerUI();
  }

  /**
   * Handle device motion change
   */
  private onMotionChange(event: DeviceMotionEvent): void {
    if (!this.isActive) return;

    const accel = event.accelerationIncludingGravity;

    if (accel && accel.x !== null && accel.y !== null && accel.z !== null) {
      this.currentMotion = {
        acceleration: new Vector3(
          event.acceleration?.x || 0,
          event.acceleration?.y || 0,
          event.acceleration?.z || 0
        ),
        accelerationIncludingGravity: new Vector3(accel.x, accel.y, accel.z),
        rotationRate: new Vector3(
          event.rotationRate?.alpha || 0,
          event.rotationRate?.beta || 0,
          event.rotationRate?.gamma || 0
        ),
        interval: event.interval || 0
      };

      // Detect shake
      this.detectShake();
    }
  }

  /**
   * Convert device orientation to world direction vector
   */
  private orientationToDirection(orientation: DeviceOrientation): Vector3 {
    // Convert Euler angles to direction vector
    const pitch = orientation.beta * (Math.PI / 180);
    const yaw = orientation.alpha * (Math.PI / 180);

    const x = Math.sin(yaw) * Math.cos(pitch);
    const y = -Math.sin(pitch);
    const z = Math.cos(yaw) * Math.cos(pitch);

    return new Vector3(x, y, z).normalized();
  }

  /**
   * Scan for energy signatures in current direction
   */
  private scanForEnergies(): void {
    if (!this.currentOrientation) return;

    this.nearbySignatures = [];

    // Check each energy signature
    for (const signature of this.energySignatures.values()) {
      if (signature.isCollected) continue;

      // Calculate direction to signature
      const playerPosition = this.getPlayerPosition();
      const toSignature = Vector3.subtract(signature.position, playerPosition);
      const distance = toSignature.magnitude();

      // Check if within scan range
      if (distance > SCANNER_CONFIG.SCAN_RANGE) continue;

      // Calculate angle between scan direction and signature direction
      const angle = Vector3.angleBetween(this.scanDirection, toSignature.normalized());

      // Check if within scan cone
      if (angle <= SCANNER_CONFIG.SCAN_CONE_ANGLE) {
        this.nearbySignatures.push(signature);

        // Reveal signature if not already revealed
        if (!signature.isRevealed) {
          this.revealEnergySignature(signature);
        }
      }
    }
  }

  /**
   * Reveal energy signature
   */
  private revealEnergySignature(signature: EnergySignature): void {
    signature.isRevealed = true;

    // Play reveal animation
    this.playRevealAnimation(signature);

    // Haptic feedback based on rarity
    switch (signature.rarity) {
      case EnergyRarity.RARE:
        this.hapticController.play(HapticPattern.SUCCESS);
        break;
      case EnergyRarity.UNCOMMON:
        this.hapticController.play(HapticPattern.DISCOVERY);
        break;
      case EnergyRarity.COMMON:
        this.hapticController.play(HapticPattern.DISCOVERY);
        break;
    }

    // Play sound effect based on rarity
    const soundVolume = signature.rarity === EnergyRarity.LEGENDARY ? 1.0 :
                        signature.rarity === EnergyRarity.RARE ? 0.9 : 0.8;

    MetaHorizon.playSoundAtLocation({
      sound: SoundEffect.DISCOVERY,
      position: signature.position,
      volume: soundVolume,
      maxDistance: 40
    });

    console.log(`Energy signature revealed: ${signature.id} (${signature.rarity})`);
  }

  /**
   * Detect shake gesture
   */
  private detectShake(): void {
    if (!this.currentMotion) return;

    const accel = this.currentMotion.accelerationIncludingGravity;
    const magnitude = accel.magnitude();

    if (magnitude > SCANNER_CONFIG.SHAKE_THRESHOLD) {
      const currentTime = Date.now();

      // Debounce shake detection
      if (currentTime - this.lastShakeTime > 500) {
        this.onDeviceShake(magnitude);
        this.lastShakeTime = currentTime;
        this.shakeCount++;
      }
    }
  }

  /**
   * Handle shake gesture
   */
  private onDeviceShake(intensity: number): void {
    // Disperse energy clouds
    this.disperseEnergyClouds();

    // Haptic feedback
    this.hapticController.play(HapticPattern.SHAKE_FEEDBACK);

    console.log(`Device shaken with intensity: ${intensity}`);
  }

  /**
   * Disperse energy clouds
   */
  private disperseEnergyClouds(): void {
    // Find nearby energy clouds
    const playerPosition = this.getPlayerPosition();

    this.energyClouds.forEach(cloud => {
      const distance = Vector3.distance(cloud.position, playerPosition);

      if (distance < 10) {
        // Disperse cloud
        this.playCloudDisperseEffect(cloud);

        // Might reveal hidden signature
        if (cloud.hiddenSignature) {
          this.revealEnergySignature(cloud.hiddenSignature);
        }
      }
    });
  }

  /**
   * Check orientation alignment (for puzzles)
   */
  public checkAlignment(targetPitch: number, targetRoll: number): boolean {
    if (!this.currentOrientation) return false;

    const pitchDiff = Math.abs(this.currentOrientation.beta - targetPitch);
    const rollDiff = Math.abs(this.currentOrientation.gamma - targetRoll);

    return (
      pitchDiff < SCANNER_CONFIG.ALIGNMENT_TOLERANCE &&
      rollDiff < SCANNER_CONFIG.ALIGNMENT_TOLERANCE
    );
  }

  /**
   * Activate scanner
   */
  public activate(): void {
    this.isActive = true;
    this.showScannerUI();
    this.showScanCone();
    console.log('Scanner activated');
  }

  /**
   * Deactivate scanner
   */
  public deactivate(): void {
    this.isActive = false;
    this.hideScannerUI();
    this.hideScanCone();
    console.log('Scanner deactivated');
  }

  /**
   * Toggle scanner on/off
   */
  public toggle(): void {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  /**
   * Add energy signature to world
   */
  public addEnergySignature(signature: EnergySignature): void {
    this.energySignatures.set(signature.id, signature);
  }

  /**
   * Collect energy signature
   */
  public collectSignature(signatureId: string): void {
    const signature = this.energySignatures.get(signatureId);
    if (signature && signature.isRevealed && !signature.isCollected) {
      signature.isCollected = true;

      // Play collection effect
      this.playCollectionEffect(signature);

      // Haptic feedback
      this.hapticController.play(HapticPattern.SUCCESS);

      // Update progress UI - notify game controller
      console.log(`Energy signature collected: ${signatureId}`);
    }
  }

  /**
   * Get collection progress
   */
  public getProgress(): { collected: number; total: number; percentage: number } {
    const total = this.energySignatures.size;
    const collected = Array.from(this.energySignatures.values())
      .filter(sig => sig.isCollected).length;

    return {
      collected,
      total,
      percentage: total > 0 ? (collected / total) * 100 : 0
    };
  }

  // Helper methods (to be implemented with Meta Horizon API)

  private getPlayerPosition(): Vector3 {
    // Get actual player position from Meta Horizon API
    const player = MetaHorizon.getLocalPlayer();
    return new Vector3(player.position.x, player.position.y, player.position.z);
  }

  private showScannerUI(): void {
    // Show scanner overlay UI
    // In Meta Horizon, this would create UI elements for the scanner HUD
    console.log('Showing scanner UI');

    // Play scanner activation sound
    MetaHorizon.playSound({
      sound: SoundEffect.UI_CLICK,
      volume: 0.7
    });
  }

  private hideScannerUI(): void {
    // Hide scanner overlay UI
    console.log('Hiding scanner UI');

    // Play scanner deactivation sound
    MetaHorizon.playSound({
      sound: SoundEffect.UI_CLICK,
      volume: 0.6
    });
  }

  private updateScannerUI(): void {
    // Update scanner UI with current scan data
    // Display nearby signatures count, scan cone direction, etc.
    console.log(`Scanner UI updated: ${this.nearbySignatures.length} signatures nearby`);
  }

  private showScanCone(): void {
    // Show visual scan cone using Meta Horizon entities
    const player = MetaHorizon.getLocalPlayer();

    this._scanCone = MetaHorizon.createEntity({
      model: 'scanner_cone',
      position: player.position,
      rotation: player.rotation,
      scale: new Vector3(1, 1, SCANNER_CONFIG.SCAN_RANGE)
    });

    // Apply scanner cone shader
    const coneMaterial = MetaHorizon.createMaterial({
      shader: 'scanner_cone_shader',
      properties: {
        _ConeColor: { r: 0.3, g: 1.0, b: 0.7, a: 0.3 },
        _ScanlineSpeed: 5.0
      }
    });

    if (this._scanCone && this._scanCone.setMaterial) {
      this._scanCone.setMaterial(coneMaterial);
    }
  }

  private hideScanCone(): void {
    // Hide visual scan cone
    if (this._scanCone) {
      this._scanCone.destroy();
      this._scanCone = undefined;
    }
  }

  private playRevealAnimation(signature: EnergySignature): void {
    // Play reveal VFX when energy signature is discovered
    MetaHorizon.playSoundAtLocation({
      sound: SoundEffect.DISCOVERY,
      position: signature.position,
      volume: 0.8,
      maxDistance: 30
    });

    // Visual reveal effect
    console.log(`Playing reveal animation for energy signature: ${signature.id} (${signature.rarity})`);
  }

  private playCollectionEffect(signature: EnergySignature): void {
    // Play collection VFX when energy is collected
    MetaHorizon.playSoundAtLocation({
      sound: SoundEffect.ENERGY_COLLECT,
      position: signature.position,
      volume: 0.7,
      maxDistance: 20
    });

    // Particle burst effect at collection point
    console.log(`Energy collected: ${signature.id}`);
  }

  private playCloudDisperseEffect(cloud: any): void {
    // Play cloud disperse VFX when shake disperses energy clouds
    if (cloud && cloud.position) {
      MetaHorizon.playSoundAtLocation({
        sound: SoundEffect.ENERGY_COLLECT,
        position: cloud.position,
        volume: 0.5,
        maxDistance: 25
      });
    }

    console.log('Dispersing energy cloud');
  }

  // Getters

  public get active(): boolean {
    return this.isActive;
  }

  public get orientation(): DeviceOrientation | undefined {
    return this.currentOrientation;
  }

  public get direction(): Vector3 {
    return this.scanDirection;
  }

  public get nearbyEnergies(): EnergySignature[] {
    return this.nearbySignatures;
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('deviceorientation', this.onOrientationChange.bind(this));
      window.removeEventListener('devicemotion', this.onMotionChange.bind(this));
    }
  }
}

// Vector3 utility class
class Vector3 {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}

  static subtract(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  static distance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  static angleBetween(a: Vector3, b: Vector3): number {
    const dot = a.x * b.x + a.y * b.y + a.z * b.z;
    const magA = a.magnitude();
    const magB = b.magnitude();

    if (magA === 0 || magB === 0) return 0;

    const cosAngle = dot / (magA * magB);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    return angleRad * (180 / Math.PI); // Convert to degrees
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalized(): Vector3 {
    const mag = this.magnitude();
    return mag > 0 ? new Vector3(this.x / mag, this.y / mag, this.z / mag) : new Vector3(0, 0, 0);
  }
}
