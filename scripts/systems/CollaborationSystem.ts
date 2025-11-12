/**
 * CollaborationSystem.ts
 * Manages collaborative touch mechanics and multiplayer challenges
 * Synchronized haptic feedback and team-based puzzles
 */

import { HapticController } from '../core/HapticController';
import { HapticPattern, COLLAB_CONFIG, SoundEffect } from '../utils/Constants';
import { MetaHorizon } from '../adapters/MetaHorizonSDK';

export interface Player {
  id: string;
  name: string;
  position: Vector3;
  isTouching: boolean;
  touchTimestamp?: number;
  deviceId?: string;
}

export interface CollabChallenge {
  id: string;
  type: CollabChallengeType;
  requiredPlayers: number;
  participants: Set<string>;
  isActive: boolean;
  isCompleted: boolean;
  startTime?: number;
  position: Vector3;
  proximityRadius: number;
}

export enum CollabChallengeType {
  SYNCHRONIZED_TOUCH = 'synchronized_touch',
  ENERGY_RELAY = 'energy_relay',
  PORTAL_NETWORK = 'portal_network',
  DUAL_ACTIVATION = 'dual_activation',
  TEAM_PUZZLE = 'team_puzzle'
}

export interface RelayEvent {
  fromPlayerId: string;
  toPlayerId: string;
  timestamp: number;
  timing: RelayTiming;
}

export enum RelayTiming {
  PERFECT = 'perfect',
  GOOD = 'good',
  MISS = 'miss'
}

export class CollaborationSystem {
  private hapticController: HapticController;
  private challenges: Map<string, CollabChallenge> = new Map();
  private activePlayers: Map<string, Player> = new Map();

  // Relay state
  private _energyOrb?: any;
  private relayChain: string[] = [];
  private relayMultiplier: number = 1.0;

  // Touch synchronization
  private playerTouches: Map<string, number> = new Map(); // playerId -> timestamp

  // Network sync
  private _networkUpdateRate: number = 20; // Hz
  private _lastNetworkUpdate: number = 0;

  constructor(hapticController: HapticController) {
    this.hapticController = hapticController;
  }

  /**
   * Register player in collaboration system
   */
  public registerPlayer(player: Player): void {
    this.activePlayers.set(player.id, player);
    console.log(`Player registered: ${player.name} (${player.id})`);
  }

  /**
   * Unregister player
   */
  public unregisterPlayer(playerId: string): void {
    this.activePlayers.delete(playerId);
    this.playerTouches.delete(playerId);

    // Remove from active challenges
    for (const challenge of this.challenges.values()) {
      challenge.participants.delete(playerId);
    }
  }

  /**
   * Create collaboration challenge
   */
  public createChallenge(
    type: CollabChallengeType,
    position: Vector3,
    requiredPlayers: number = 2
  ): CollabChallenge {
    const challenge: CollabChallenge = {
      id: this.generateChallengeId(),
      type,
      requiredPlayers,
      participants: new Set(),
      isActive: false,
      isCompleted: false,
      position,
      proximityRadius: COLLAB_CONFIG.PROXIMITY_RADIUS
    };

    this.challenges.set(challenge.id, challenge);
    return challenge;
  }

  /**
   * Check player proximity to challenge
   */
  public updatePlayerProximity(): void {
    for (const challenge of this.challenges.values()) {
      if (challenge.isCompleted) continue;

      challenge.participants.clear();

      // Check which players are nearby
      for (const player of this.activePlayers.values()) {
        const distance = Vector3.distance(player.position, challenge.position);

        if (distance <= challenge.proximityRadius) {
          challenge.participants.add(player.id);
        }
      }

      // Activate challenge if enough players nearby
      if (
        challenge.participants.size >= challenge.requiredPlayers &&
        !challenge.isActive
      ) {
        this.activateChallenge(challenge);
      }
    }
  }

  /**
   * Activate collaboration challenge
   */
  private activateChallenge(challenge: CollabChallenge): void {
    challenge.isActive = true;
    challenge.startTime = Date.now();

    // Show challenge UI to participating players
    this.showChallengeUI(challenge);

    // Broadcast activation to participants
    this.broadcastToParticipants(challenge, 'challenge_activated', {
      challengeId: challenge.id,
      type: challenge.type,
      requiredPlayers: challenge.requiredPlayers
    });

    // Haptic feedback
    Array.from(challenge.participants).forEach(playerId => {
      this.sendHapticToPlayer(playerId as string, HapticPattern.COLLABORATION_START);
    });

    console.log(`Challenge activated: ${challenge.id} (${challenge.type})`);
  }

  /**
   * Handle player touch event
   */
  public onPlayerTouch(playerId: string): void {
    const player = this.activePlayers.get(playerId);
    if (!player) return;

    const timestamp = Date.now();

    player.isTouching = true;
    player.touchTimestamp = timestamp;
    this.playerTouches.set(playerId, timestamp);

    // Check for synchronized touch challenges
    this.checkSynchronizedTouch();

    // Broadcast touch event
    this.broadcastTouchEvent(playerId, timestamp);
  }

  /**
   * Handle player touch release
   */
  public onPlayerTouchRelease(playerId: string): void {
    const player = this.activePlayers.get(playerId);
    if (!player) return;

    player.isTouching = false;
    player.touchTimestamp = undefined;
    this.playerTouches.delete(playerId);
  }

  /**
   * Check for synchronized touch
   */
  private checkSynchronizedTouch(): void {
    // Find active synchronized touch challenges
    for (const challenge of this.challenges.values()) {
      if (
        challenge.type !== CollabChallengeType.SYNCHRONIZED_TOUCH ||
        !challenge.isActive ||
        challenge.isCompleted
      ) {
        continue;
      }

      // Check if enough participants are touching
      const touchingPlayers = Array.from(challenge.participants)
        .filter(playerId => this.playerTouches.has(playerId as string));

      if (touchingPlayers.length >= challenge.requiredPlayers) {
        // Check touch synchronization
        const isSynchronized = this.checkTouchSynchronization(touchingPlayers as string[]);

        if (isSynchronized) {
          this.completeChallenge(challenge);
        }
      }
    }
  }

  /**
   * Check if touches are synchronized within threshold
   */
  private checkTouchSynchronization(playerIds: string[]): boolean {
    if (playerIds.length < 2) return false;

    const timestamps = playerIds
      .map(id => this.playerTouches.get(id))
      .filter((ts): ts is number => ts !== undefined);

    if (timestamps.length < playerIds.length) return false;

    // Calculate max time difference
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeDiff = maxTime - minTime;

    return timeDiff <= COLLAB_CONFIG.MAX_SYNC_DELAY;
  }

  /**
   * Handle energy relay between players
   */
  public initiateEnergyRelay(fromPlayerId: string, toPlayerId: string): void {
    const fromPlayer = this.activePlayers.get(fromPlayerId);
    const toPlayer = this.activePlayers.get(toPlayerId);

    if (!fromPlayer || !toPlayer) return;

    const timestamp = Date.now();

    // Calculate timing if part of chain
    let timing: RelayTiming = RelayTiming.GOOD;

    if (this.relayChain.length > 0) {
      const lastRelayTime = this.playerTouches.get(this.relayChain[this.relayChain.length - 1]);

      if (lastRelayTime) {
        const timeDiff = timestamp - lastRelayTime;

        if (timeDiff < COLLAB_CONFIG.PERFECT_TIMING_THRESHOLD) {
          timing = RelayTiming.PERFECT;
          this.relayMultiplier += 0.5;
        } else if (timeDiff < COLLAB_CONFIG.GOOD_TIMING_THRESHOLD) {
          timing = RelayTiming.GOOD;
        } else {
          timing = RelayTiming.MISS;
          this.relayMultiplier = 1.0; // Reset multiplier on miss
        }
      }
    }

    // Add to relay chain
    this.relayChain.push(toPlayerId);
    this.playerTouches.set(toPlayerId, timestamp);

    // Create relay event
    const relayEvent: RelayEvent = {
      fromPlayerId,
      toPlayerId,
      timestamp,
      timing
    };

    // Visual and haptic feedback
    this.playRelayEffect(relayEvent);

    // Haptic feedback based on timing
    const hapticPattern = this.getRelayHapticPattern(timing);
    this.sendHapticToPlayer(toPlayerId, hapticPattern);

    console.log(`Energy relay: ${fromPlayerId} -> ${toPlayerId} (${timing})`);
  }

  /**
   * Get haptic pattern based on relay timing
   */
  private getRelayHapticPattern(timing: RelayTiming): HapticPattern {
    switch (timing) {
      case RelayTiming.PERFECT:
        return HapticPattern.RELAY_PERFECT;
      case RelayTiming.GOOD:
        return HapticPattern.RELAY_GOOD;
      case RelayTiming.MISS:
        return HapticPattern.RELAY_MISS;
    }
  }

  /**
   * Complete collaboration challenge
   */
  private completeChallenge(challenge: CollabChallenge): void {
    challenge.isCompleted = true;
    challenge.isActive = false;

    // Play celebration effects
    this.playCelebrationEffects(challenge);

    // Synchronized haptic feedback to all participants
    this.broadcastHapticToParticipants(challenge, HapticPattern.SUCCESS);

    // Award points/rewards
    this.awardChallengeRewards(challenge);

    // Broadcast completion
    this.broadcastToParticipants(challenge, 'challenge_completed', {
      challengeId: challenge.id,
      participants: Array.from(challenge.participants)
    });

    console.log(`Challenge completed: ${challenge.id}`);
  }

  /**
   * Broadcast haptic to all challenge participants
   */
  private broadcastHapticToParticipants(
    _challenge: CollabChallenge,
    pattern: HapticPattern
  ): void {
    const participantIds = Array.from(_challenge.participants);
    this.hapticController.broadcast(pattern, participantIds);
  }

  /**
   * Send haptic to specific player
   */
  private sendHapticToPlayer(playerId: string, pattern: HapticPattern): void {
    // Local player
    const localPlayerId = this.getLocalPlayerId();
    if (playerId === localPlayerId) {
      this.hapticController.play(pattern);
    } else {
      // Remote player - send via network
      this.broadcastHapticEvent(playerId, pattern);
    }
  }

  /**
   * Broadcast event to challenge participants
   */
  private broadcastToParticipants(
    challenge: CollabChallenge,
    eventType: string,
    data: any
  ): void {
    // Implement network broadcast to challenge participants
    const participantIds = Array.from(challenge.participants) as string[];
    MetaHorizon.sendTo(participantIds, eventType, data);
    console.log(`Broadcasting to ${participantIds.length} participants: ${eventType}`, data);
  }

  /**
   * Broadcast touch event to other players
   */
  private broadcastTouchEvent(playerId: string, timestamp: number): void {
    // Broadcast touch event to all players via network
    MetaHorizon.broadcast('touch_event', {
      playerId,
      timestamp,
      isTouching: true
    });
  }

  /**
   * Broadcast haptic event to remote player
   */
  private broadcastHapticEvent(playerId: string, pattern: HapticPattern): void {
    // Send haptic event to specific player via network
    MetaHorizon.sendTo([playerId], 'haptic_event', {
      pattern,
      timestamp: Date.now()
    });
  }

  /**
   * Get nearby players
   */
  public getNearbyPlayers(position: Vector3, radius: number): Player[] {
    const nearby: Player[] = [];

    for (const player of this.activePlayers.values()) {
      const distance = Vector3.distance(player.position, position);
      if (distance <= radius) {
        nearby.push(player);
      }
    }

    return nearby;
  }

  /**
   * Reset relay chain
   */
  public resetRelayChain(): void {
    this.relayChain = [];
    this.relayMultiplier = 1.0;
  }

  // Helper methods (to be implemented with Meta Horizon API)

  private generateChallengeId(): string {
    return `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLocalPlayerId(): string {
    // Get local player ID from Meta Horizon API
    const player = MetaHorizon.getLocalPlayer();
    return player.id;
  }

  private showChallengeUI(challenge: CollabChallenge): void {
    // Show challenge UI to participants
    // In Meta Horizon, this would create UI notification
    console.log(`Challenge UI: ${challenge.type} - ${challenge.requiredPlayers} players needed`);

    // Play UI sound
    MetaHorizon.playSound({
      sound: SoundEffect.UI_CLICK,
      volume: 0.8
    });
  }

  private playRelayEffect(relayEvent: RelayEvent): void {
    // Play visual relay effect between players
    const soundEffect = relayEvent.timing === RelayTiming.PERFECT
      ? SoundEffect.COLLABORATION_SUCCESS
      : SoundEffect.ENERGY_COLLECT;

    MetaHorizon.playSound({
      sound: soundEffect,
      volume: 0.7
    });

    console.log(`Relay effect: ${relayEvent.fromPlayerId} → ${relayEvent.toPlayerId} (${relayEvent.timing})`);
  }

  private playCelebrationEffects(challenge: CollabChallenge): void {
    // Play celebration VFX and SFX for completing challenge
    MetaHorizon.playSound({
      sound: SoundEffect.COLLABORATION_SUCCESS,
      volume: 1.0
    });

    // Play success sound at challenge location
    MetaHorizon.playSoundAtLocation({
      sound: SoundEffect.PUZZLE_COMPLETE,
      position: challenge.position,
      volume: 0.9,
      maxDistance: 50
    });

    console.log(`Celebrating challenge completion: ${challenge.id}`);
  }

  private awardChallengeRewards(challenge: CollabChallenge): void {
    // Award points/achievements to participants
    const participantIds = Array.from(challenge.participants);

    // Broadcast reward notification
    MetaHorizon.broadcast('challenge_reward', {
      challengeId: challenge.id,
      type: challenge.type,
      participants: participantIds,
      reward: {
        points: 100 * challenge.requiredPlayers,
        achievement: `${challenge.type}_master`
      }
    });

    console.log(`Awarding rewards to ${participantIds.length} participants`);
  }

  // Getters

  public getChallenge(id: string): CollabChallenge | undefined {
    return this.challenges.get(id);
  }

  public getActiveChallenges(): CollabChallenge[] {
    return Array.from(this.challenges.values()).filter(c => c.isActive);
  }

  public getPlayer(id: string): Player | undefined {
    return this.activePlayers.get(id);
  }

  public getAllPlayers(): Player[] {
    return Array.from(this.activePlayers.values());
  }

  public getRelayMultiplier(): number {
    return this.relayMultiplier;
  }
}

// Vector3 utility class
class Vector3 {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) {}

  static distance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
