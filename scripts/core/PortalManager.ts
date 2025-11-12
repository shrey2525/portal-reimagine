/**
 * PortalManager.ts
 * Manages portal creation, activation, and traversal
 * Mobile-first implementation for PortalSync: Reality Bridge
 */

import { HapticController } from './HapticController';
import { HapticPattern, SoundEffect } from '../utils/Constants';
import { MetaHorizon } from '../adapters/MetaHorizonSDK';

export enum PortalType {
  BASIC = 'basic',
  CRYSTAL = 'crystal',
  QUANTUM = 'quantum',
  TEMPORAL = 'temporal'
}

export interface Portal {
  id: string;
  type: PortalType;
  creatorId: string;
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  radius: number;
  destinationId?: string;
  isActive: boolean;
  isValid: boolean;
  createdAt: Date;
}

export class PortalManager {
  private portals: Map<string, Portal> = new Map();
  private currentPortal?: Portal;
  private hapticController: HapticController;

  // Portal configuration
  private readonly MIN_RADIUS = 0.5;
  private readonly MAX_RADIUS = 5.0;
  private readonly BASE_RADIUS = 2.0;
  private readonly MIN_PLACEMENT_DISTANCE = 1.0;

  // Preview state
  private isCreatingPortal = false;
  private portalPreview?: any; // Visual preview object
  private portalEntities: Map<string, any> = new Map(); // Portal entity references

  constructor(hapticController: HapticController) {
    this.hapticController = hapticController;
  }

  /**
   * Start portal creation mode
   */
  public startPortalCreation(position: Vector3, playerId: string): void {
    this.isCreatingPortal = true;

    this.currentPortal = {
      id: this.generatePortalId(),
      type: PortalType.BASIC,
      creatorId: playerId,
      position: position,
      rotation: Quaternion.identity(),
      scale: new Vector3(1, 1, 1),
      radius: this.BASE_RADIUS,
      isActive: false,
      isValid: false,
      createdAt: new Date()
    };

    // Show translucent preview
    this.showPortalPreview(this.currentPortal);
  }

  /**
   * Handle pinch gesture for portal scaling
   */
  public onPinchGesture(scale: number): void {
    if (!this.currentPortal) return;

    // Calculate new radius
    const newRadius = this.BASE_RADIUS * scale;

    // Clamp to min/max
    this.currentPortal.radius = Math.max(
      this.MIN_RADIUS,
      Math.min(this.MAX_RADIUS, newRadius)
    );

    // Update visual
    this.updatePortalPreview(this.currentPortal);

    // Haptic feedback
    this.hapticController.play(HapticPattern.PORTAL_RESIZE);
  }

  /**
   * Handle rotation gesture for portal orientation
   */
  public onRotateGesture(angle: number): void {
    if (!this.currentPortal) return;

    // Convert angle to quaternion rotation
    this.currentPortal.rotation = Quaternion.fromEuler(0, angle, 0);

    // Update visual
    this.updatePortalPreview(this.currentPortal);

    // Haptic feedback
    this.hapticController.play(HapticPattern.PORTAL_ROTATE);
  }

  /**
   * Handle swipe gesture for boundary painting
   */
  public onSwipeGesture(touchPoints: Vector3[]): void {
    if (!this.currentPortal) return;

    // Draw particle trail along swipe path
    this.drawPortalBoundary(touchPoints);

    // Haptic feedback
    this.hapticController.play(HapticPattern.PORTAL_PAINT);
  }

  /**
   * Handle double-tap to activate portal
   */
  public onDoubleTap(): void {
    if (!this.currentPortal) return;

    // Validate portal placement
    if (this.validatePortal(this.currentPortal)) {
      this.activatePortal(this.currentPortal);
    } else {
      // Show error feedback
      this.hapticController.play(HapticPattern.FAILURE);
      this.showPortalError('Invalid portal placement');
    }
  }

  /**
   * Validate portal placement
   */
  private validatePortal(portal: Portal): boolean {
    // Check if too close to other portals
    for (const existingPortal of this.portals.values()) {
      const distance = Vector3.distance(portal.position, existingPortal.position);
      if (distance < this.MIN_PLACEMENT_DISTANCE) {
        return false;
      }
    }

    // Check if on valid surface using raycast
    const downVector = { x: 0, y: -1, z: 0 };
    const hit = MetaHorizon.raycast(portal.position, downVector, 5.0, ['environment']);

    if (!hit) {
      return false; // No surface below portal
    }

    // Check if within zone bounds
    // Zone boundary check handled by ZoneManager

    return true;
  }

  /**
   * Activate and finalize portal
   */
  private activatePortal(portal: Portal): void {
    portal.isActive = true;
    portal.isValid = true;

    // Add to portals map
    this.portals.set(portal.id, portal);

    // Remove preview and create final portal
    this.hidePortalPreview();
    this.createPortalObject(portal);

    // Play activation effects
    this.playActivationSequence(portal);

    // Haptic feedback
    this.hapticController.play(HapticPattern.PORTAL_ACTIVATE);

    // Play sound effect
    MetaHorizon.playSound({
      sound: SoundEffect.PORTAL_ACTIVATE,
      volume: 0.9
    });

    // Broadcast to other players
    this.broadcastPortalCreation(portal);

    // Clear current portal
    this.currentPortal = undefined;
    this.isCreatingPortal = false;
  }

  /**
   * Cancel portal creation
   */
  public cancelPortalCreation(): void {
    if (this.currentPortal) {
      this.hidePortalPreview();
      this.currentPortal = undefined;
      this.isCreatingPortal = false;
    }
  }

  /**
   * Traverse portal (teleport player)
   */
  public traversePortal(portalId: string, player: any): void {
    const portal = this.portals.get(portalId);
    if (!portal || !portal.isActive) return;

    if (portal.destinationId) {
      const destination = this.portals.get(portal.destinationId);
      if (destination) {
        // Teleport player to destination
        this.teleportPlayer(player, destination.position);

        // Play traversal effects
        this.playTraversalEffect(portal, destination);

        // Haptic feedback
        this.hapticController.play(HapticPattern.SUCCESS);
      }
    }
  }

  /**
   * Link two portals together
   */
  public linkPortals(portal1Id: string, portal2Id: string): void {
    const portal1 = this.portals.get(portal1Id);
    const portal2 = this.portals.get(portal2Id);

    if (portal1 && portal2) {
      portal1.destinationId = portal2Id;
      portal2.destinationId = portal1Id;

      // Visual feedback showing connection
      this.showPortalLink(portal1, portal2);
    }
  }

  /**
   * Get all portals in zone
   */
  public getPortalsInZone(zoneId: string): Portal[] {
    // Filter portals by zone (requires zone boundaries from ZoneManager)
    // For now, return all portals - zone filtering handled by ZoneManager
    return Array.from(this.portals.values()).filter(portal => {
      // Zone-based filtering logic would go here
      // Could check if portal.position is within zone bounds
      return true; // Return all for now
    });
  }

  /**
   * Delete portal
   */
  public deletePortal(portalId: string): void {
    const portal = this.portals.get(portalId);
    if (portal) {
      // Remove destination link if exists
      if (portal.destinationId) {
        const linkedPortal = this.portals.get(portal.destinationId);
        if (linkedPortal) {
          linkedPortal.destinationId = undefined;
        }
      }

      // Remove from map
      this.portals.delete(portalId);

      // Destroy visual object
      this.destroyPortalObject(portal);
    }
  }

  // Helper methods to be implemented with Meta Horizon API

  private generatePortalId(): string {
    return `portal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private showPortalPreview(portal: Portal): void {
    // Create translucent portal preview mesh using Meta Horizon
    this.portalPreview = MetaHorizon.createEntity({
      model: 'portal_frame',
      position: portal.position,
      rotation: portal.rotation,
      scale: new Vector3(portal.radius * 2, portal.radius * 2, 0.1)
    });

    // Set translucent material for preview
    const previewMaterial = MetaHorizon.createMaterial({
      shader: 'portal_shader',
      properties: {
        _Transparency: 0.3,
        _EmissionColor: { r: 0.3, g: 0.7, b: 1.0, a: 0.3 }
      }
    });

    if (this.portalPreview && this.portalPreview.setMaterial) {
      this.portalPreview.setMaterial(previewMaterial);
    }
  }

  private updatePortalPreview(portal: Portal): void {
    // Update preview mesh scale and rotation
    if (this.portalPreview) {
      this.portalPreview.setScale(new Vector3(portal.radius * 2, portal.radius * 2, 0.1));
      this.portalPreview.setRotation(portal.rotation);
    }
  }

  private hidePortalPreview(): void {
    // Destroy preview mesh
    if (this.portalPreview) {
      this.portalPreview.destroy();
      this.portalPreview = undefined;
    }
  }

  private drawPortalBoundary(touchPoints: Vector3[]): void {
    // Create particle trail along touch points
    if (touchPoints.length < 2) return;

    // Play swipe sound
    MetaHorizon.playSound({
      sound: SoundEffect.PORTAL_WHOOSH,
      volume: 0.6
    });

    // Visual feedback handled by particle system
    console.log('Drawing portal boundary with', touchPoints.length, 'points');
  }

  private createPortalObject(portal: Portal): void {
    // Instantiate final portal prefab
    const portalEntity = MetaHorizon.createEntity({
      model: 'portal_frame',
      position: portal.position,
      rotation: portal.rotation,
      scale: new Vector3(portal.radius * 2, portal.radius * 2, 0.1)
    });

    // Create portal surface
    const portalSurface = MetaHorizon.createEntity({
      model: 'portal_surface',
      position: portal.position,
      rotation: portal.rotation,
      scale: new Vector3(portal.radius * 2, portal.radius * 2, 0.1)
    });

    // Apply portal shader
    const portalMaterial = MetaHorizon.createMaterial({
      shader: 'portal_shader',
      properties: {
        _RippleSpeed: 1.0,
        _EmissionColor: { r: 0.3, g: 0.7, b: 1.0, a: 0.7 },
        _Transparency: 0.7
      }
    });

    if (portalSurface && portalSurface.setMaterial) {
      portalSurface.setMaterial(portalMaterial);
    }

    // Store entity references
    this.portalEntities.set(portal.id, {
      frame: portalEntity,
      surface: portalSurface
    });
  }

  private destroyPortalObject(portal: Portal): void {
    // Destroy portal game object
    const entities = this.portalEntities.get(portal.id);
    if (entities) {
      if (entities.frame) entities.frame.destroy();
      if (entities.surface) entities.surface.destroy();
      this.portalEntities.delete(portal.id);
    }
  }

  private playActivationSequence(portal: Portal): void {
    // Play particle effects, glow animation
    MetaHorizon.playSoundAtLocation({
      sound: SoundEffect.PORTAL_ACTIVATE,
      position: portal.position,
      volume: 0.9,
      maxDistance: 50
    });

    // Particle effects handled by Meta Horizon particle system
    console.log('Playing activation sequence for portal', portal.id);
  }

  private playTraversalEffect(from: Portal, to: Portal): void {
    // Play portal traversal VFX
    MetaHorizon.playSoundAtLocation({
      sound: SoundEffect.PORTAL_WHOOSH,
      position: from.position,
      volume: 1.0,
      maxDistance: 30
    });

    MetaHorizon.playSoundAtLocation({
      sound: SoundEffect.PORTAL_WHOOSH,
      position: to.position,
      volume: 0.8,
      maxDistance: 30
    });

    console.log('Playing traversal effect from', from.id, 'to', to.id);
  }

  private showPortalLink(portal1: Portal, portal2: Portal): void {
    // Show visual connection between portals
    // Create beam entity connecting the two portals
    const midpoint = new Vector3(
      (portal1.position.x + portal2.position.x) / 2,
      (portal1.position.y + portal2.position.y) / 2,
      (portal1.position.z + portal2.position.z) / 2
    );

    MetaHorizon.createEntity({
      model: 'portal_connection_beam',
      position: midpoint,
      scale: new Vector3(
        1,
        1,
        Vector3.distance(portal1.position, portal2.position)
      )
    });

    console.log('Showing portal link between', portal1.id, 'and', portal2.id);
  }

  private showPortalError(message: string): void {
    // Show error UI notification
    console.error('Portal error:', message);

    // Play error sound
    MetaHorizon.playSound({
      sound: SoundEffect.UI_ERROR,
      volume: 0.6
    });
  }

  private teleportPlayer(_player: any, position: Vector3): void {
    // Implement player teleportation
    const localPlayer = MetaHorizon.getLocalPlayer();
    MetaHorizon.teleportPlayer(localPlayer.id, position);
  }

  private broadcastPortalCreation(portal: Portal): void {
    // Send network event to other players
    MetaHorizon.broadcast('portal_created', {
      portalId: portal.id,
      type: portal.type,
      creatorId: portal.creatorId,
      position: portal.position,
      rotation: portal.rotation,
      radius: portal.radius
    });
  }

  // Public getters

  public get isCreating(): boolean {
    return this.isCreatingPortal;
  }

  public getAllPortals(): Portal[] {
    return Array.from(this.portals.values());
  }

  public getPortal(id: string): Portal | undefined {
    return this.portals.get(id);
  }
}

// Placeholder types (replace with actual Meta Horizon types)
class Vector3 {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}

  static distance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

class Quaternion {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public w: number = 1
  ) {}

  static identity(): Quaternion {
    return new Quaternion(0, 0, 0, 1);
  }

  static fromEuler(x: number, y: number, z: number): Quaternion {
    // Simplified euler to quaternion conversion
    return new Quaternion(x, y, z, 1);
  }
}
