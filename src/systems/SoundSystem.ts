import Phaser from 'phaser';

type ToneName =
  | 'ui'
  | 'playerFire'
  | 'enemyFire'
  | 'missile'
  | 'playerMissile'
  | 'enemySam'
  | 'warning'
  | 'pickup'
  | 'hit'
  | 'shield'
  | 'emp'
  | 'explosionSmall'
  | 'explosionBig'
  | 'boss';

export class SoundSystem {
  private music?: Phaser.Sound.BaseSound;
  private lastPlayed = new Map<ToneName, number>();
  private sfx = new Map<string, Phaser.Sound.BaseSound>();

  constructor(private readonly scene: Phaser.Scene) {}

  unlock(): void {
    if (this.scene.sound.locked) {
      this.scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => undefined);
    }
  }

  startMusic(mode: 'menu' | 'stage' | 'boss'): void {
    this.stopMusic();
    const key = mode === 'menu' ? 'music_menu_loop' : mode === 'stage' ? 'music_stage01_loop' : 'music_boss_loop';
    if (!this.scene.cache.audio.exists(key)) return;
    this.music = this.scene.sound.add(key, {
      loop: true,
      volume: mode === 'boss' ? 0.42 : 0.36
    });
    this.music.play();
  }

  stopMusic(): void {
    this.music?.stop();
    this.music?.destroy();
    this.music = undefined;
  }

  play(name: ToneName): void {
    const key = this.assetKey(name);
    if (!key || !this.scene.cache.audio.exists(key)) return;
    const now = this.scene.time.now;
    const cooldown = this.cooldownMs(name);
    if (now - (this.lastPlayed.get(name) ?? -9999) < cooldown) return;
    this.lastPlayed.set(name, now);
    const sound = this.getSfx(key);
    if (sound.isPlaying) {
      sound.stop();
    }
    sound.play({ volume: this.volume(name) });
  }

  destroy(): void {
    this.stopMusic();
    this.sfx.forEach((sound) => sound.destroy());
    this.sfx.clear();
  }

  private assetKey(name: ToneName): string {
    const keys: Record<ToneName, string> = {
      ui: 'sfx_ui_click',
      playerFire: 'sfx_player_cannon',
      enemyFire: 'sfx_enemy_cannon',
      missile: 'sfx_missile_launch',
      playerMissile: 'sfx_player_missile_launch',
      enemySam: 'sfx_enemy_sam_launch',
      warning: 'sfx_missile_lock',
      pickup: 'sfx_pickup',
      hit: 'sfx_player_hit',
      shield: 'sfx_shield_absorb',
      emp: 'sfx_emp_release',
      explosionSmall: Phaser.Math.RND.pick(['sfx_explosion_small_01', 'sfx_explosion_medium_01']),
      explosionBig: 'sfx_explosion_large_01',
      boss: Phaser.Math.RND.pick(['sfx_boss_intro', 'sfx_boss_phase'])
    };
    return keys[name];
  }

  private cooldownMs(name: ToneName): number {
    if (name === 'playerFire') return 85;
    if (name === 'enemyFire') return 120;
    if (name === 'playerMissile') return 220;
    if (name === 'enemySam') return 360;
    if (name === 'explosionSmall') return 55;
    if (name === 'warning') return 650;
    return 0;
  }

  private volume(name: ToneName): number {
    if (name === 'playerFire') return 0.18;
    if (name === 'enemyFire') return 0.16;
    if (name === 'warning') return 0.5;
    if (name === 'missile') return 0.34;
    if (name === 'playerMissile') return 0.3;
    if (name === 'enemySam') return 0.42;
    if (name === 'explosionBig') return 0.58;
    if (name === 'explosionSmall') return 0.34;
    return 0.42;
  }

  private getSfx(key: string): Phaser.Sound.BaseSound {
    const cached = this.sfx.get(key);
    if (cached) return cached;
    const sound = this.scene.sound.add(key);
    this.sfx.set(key, sound);
    return sound;
  }
}
