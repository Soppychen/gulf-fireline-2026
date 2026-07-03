import Phaser from 'phaser';
import { SoundSystem } from '../systems/SoundSystem';

export class MenuScene extends Phaser.Scene {
  private soundSystem?: SoundSystem;

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.soundSystem = new SoundSystem(this);
    this.add.tileSprite(360, 640, 720, 1280, 'background_stage01_canyon').setAlpha(0.72);
    this.add.rectangle(360, 640, 720, 1280, 0x05101b, 0.35);
    this.add.image(360, 185, 'ui_sheet', 'ui_logo').setDisplaySize(520, 180);
    this.add.text(360, 300, '海湾火线 2026', { fontFamily: 'Arial', fontSize: '54px', color: '#e8f8ff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(360, 360, '闪电攻击 / Web Demo', { fontFamily: 'Arial', fontSize: '26px', color: '#82e8ff' }).setOrigin(0.5);
    this.add.image(360, 520, 'units_sheet', 'aircraft_player_afx35').setDisplaySize(190, 220);
    this.add.text(360, 705, '自动射击  拖拽或 WASD 移动  Space 护盾  P 暂停', {
      fontFamily: 'Arial',
      fontSize: '23px',
      color: '#d0d9e6',
      align: 'center',
      wordWrap: { width: 610 }
    }).setOrigin(0.5);
    const best = Number(localStorage.getItem('gulf-fireline-best') ?? 0);
    this.add.text(360, 790, `最高分 ${best.toString().padStart(6, '0')}`, { fontFamily: 'Arial', fontSize: '26px', color: '#ffdd86' }).setOrigin(0.5);
    const start = this.add.text(360, 925, '开始任务', {
      fontFamily: 'Arial',
      fontSize: '38px',
      color: '#07101f',
      backgroundColor: '#8cecff',
      padding: { x: 48, y: 20 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    start.on('pointerdown', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
  }

  private startGame(): void {
    this.soundSystem?.unlock();
    this.soundSystem?.play('ui');
    this.game.canvas.focus();
    this.scene.start('GameScene');
  }
}
