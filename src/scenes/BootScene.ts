import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.image('units_sheet', 'assets/sprites/units_sheet.png');
    this.load.image('missile_units_sheet', 'assets/sprites/missile_units_sheet.png');
    this.load.image('fx_sheet', 'assets/fx/fx_sheet.png');
    this.load.image('missile_fx_sheet', 'assets/fx/missile_fx_sheet.png');
    this.load.image('ui_sheet', 'assets/ui/ui_sheet.png');
    this.load.image('background_stage01_canyon', 'assets/backgrounds/bg_stage01_canyon_night.png');
    this.load.image('background_stage01_facility', 'assets/backgrounds/bg_stage01_facility_approach.png');

    this.load.audio('music_menu_loop', ['assets/music/music_menu_loop.ogg', 'assets/music/music_menu_loop.mp3']);
    this.load.audio('music_stage01_loop', ['assets/music/music_stage01_loop.ogg', 'assets/music/music_stage01_loop.mp3']);
    this.load.audio('music_boss_loop', ['assets/music/music_boss_loop.ogg', 'assets/music/music_boss_loop.mp3']);
    this.load.audio('music_victory_stinger', ['assets/music/music_victory_stinger.ogg', 'assets/music/music_victory_stinger.mp3']);
    this.load.audio('music_failure_stinger', ['assets/music/music_failure_stinger.ogg', 'assets/music/music_failure_stinger.mp3']);
    [
      'sfx_player_cannon',
      'sfx_enemy_cannon',
      'sfx_missile_launch',
      'sfx_player_missile_launch',
      'sfx_enemy_sam_launch',
      'sfx_missile_lock',
      'sfx_pickup',
      'sfx_player_hit',
      'sfx_shield_absorb',
      'sfx_emp_release',
      'sfx_explosion_small_01',
      'sfx_explosion_medium_01',
      'sfx_explosion_large_01',
      'sfx_boss_intro',
      'sfx_boss_phase',
      'sfx_ui_click',
      'sfx_ui_result'
    ].forEach((key) => this.load.audio(key, [`assets/audio/${key}.ogg`, `assets/audio/${key}.mp3`]));
  }

  create(): void {
    this.createFrames();
    this.createFallbackPixel();
    this.scene.start('MenuScene');
  }

  private createFrames(): void {
    this.addGridFrames('units_sheet', 4, 3, [
      'aircraft_player_afx35',
      'aircraft_player_afx35_shield',
      'enemy_drone_patrol',
      'enemy_drone_interceptor',
      'enemy_fighter_light',
      'ground_aa_cannon',
      'ground_missile_truck',
      'ground_radar_station',
      'boss_command_car',
      'boss_aa_car',
      'boss_guard_car',
      'missile_enemy_tracking'
    ]);
    this.addGridFrames('missile_units_sheet', 3, 2, [
      'ground_sam_launcher',
      'missile_player_homing',
      'missile_enemy_sam',
      'ground_sam_launcher_armed',
      'ground_sam_launch_pod',
      'ground_lock_emitter'
    ]);
    this.addGridFrames('fx_sheet', 4, 4, [
      'bullet_player_cannon',
      'bullet_enemy_red',
      'bullet_enemy_orange',
      'fx_missile_trail',
      'fx_explosion_small',
      'fx_explosion_medium',
      'fx_explosion_large',
      'pickup_power',
      'pickup_repair',
      'pickup_shield',
      'pickup_multiplier',
      'fx_player_shield',
      'fx_emp_core',
      'fx_emp_ring',
      'fx_boss_phase',
      'fx_smoke'
    ]);
    this.addGridFrames('missile_fx_sheet', 4, 3, [
      'fx_player_missile_trail',
      'fx_enemy_sam_trail',
      'fx_missile_lock_reticle',
      'fx_missile_edge_warning',
      'pickup_missile',
      'fx_sam_launch_smoke',
      'fx_radar_sweep',
      'fx_player_missile_impact',
      'fx_enemy_missile_warning',
      'fx_target_line',
      'ui_icon_missile',
      'fx_ground_launch_flash'
    ]);
    this.addGridFrames('ui_sheet', 3, 2, ['ui_logo', 'ui_button', 'ui_button_pressed', 'ui_hp', 'ui_shield', 'ui_boss_bar']);
  }

  private addGridFrames(textureKey: string, columns: number, rows: number, frameNames: string[]): void {
    const texture = this.textures.get(textureKey);
    const source = texture.getSourceImage() as HTMLImageElement;
    const cellWidth = Math.floor(source.width / columns);
    const cellHeight = Math.floor(source.height / rows);
    frameNames.forEach((name, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const width = col === columns - 1 ? source.width - col * cellWidth : cellWidth;
      const height = row === rows - 1 ? source.height - row * cellHeight : cellHeight;
      texture.add(name, 0, col * cellWidth, row * cellHeight, width, height);
    });
  }

  private createFallbackPixel(): void {
    const g = this.add.graphics();
    g.fillStyle(0xfff2a2, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('fx_spark', 8, 8);
    g.destroy();
  }
}
