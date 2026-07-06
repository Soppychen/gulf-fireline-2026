import Phaser from 'phaser';
import { SoundSystem } from '../systems/SoundSystem';

export class MenuScene extends Phaser.Scene {
  private soundSystem?: SoundSystem;
  private selectedMode: 'stage' | 'hard' | 'hell' = 'stage';
  private normalButton?: Phaser.GameObjects.Text;
  private hardButton?: Phaser.GameObjects.Text;
  private hellButton?: Phaser.GameObjects.Text;

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
    this.add.text(360, 690, '自动射击  拖拽或 WASD 移动  Space 护盾  P 暂停', {
      fontFamily: 'Arial',
      fontSize: '23px',
      color: '#d0d9e6',
      align: 'center',
      wordWrap: { width: 610 }
    }).setOrigin(0.5);
    const best = Number(localStorage.getItem('gulf-fireline-best') ?? 0);
    const hellBest = Number(localStorage.getItem('gulf-fireline-hell-best-ms') ?? 0);
    this.add.text(360, 760, `主线最高分 ${best.toString().padStart(6, '0')}   炼狱纪录 ${(hellBest / 1000).toFixed(2)}s`, {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffdd86'
    }).setOrigin(0.5);
    this.normalButton = this.add.text(145, 850, '标准', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#07101f',
      backgroundColor: '#8cecff',
      padding: { x: 28, y: 16 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.hardButton = this.add.text(360, 850, '高压', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#dce9f4',
      backgroundColor: '#25324a',
      padding: { x: 28, y: 16 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.hellButton = this.add.text(575, 850, '十秒炼狱', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffe8ed',
      backgroundColor: '#441923',
      padding: { x: 28, y: 16 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.normalButton.on('pointerdown', () => this.selectMode('stage'));
    this.hardButton.on('pointerdown', () => this.selectMode('hard'));
    this.hellButton.on('pointerdown', () => this.selectMode('hell'));
    this.selectMode('stage');
    const start = this.add.text(360, 980, '开始任务', {
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
    if (this.selectedMode === 'hell') {
      this.scene.start('HellChallengeScene');
      return;
    }
    this.scene.start('GameScene', { difficulty: this.selectedMode === 'hard' ? 'hard' : 'normal' });
  }

  private selectMode(mode: 'stage' | 'hard' | 'hell'): void {
    this.selectedMode = mode;
    this.normalButton?.setStyle({
      color: mode === 'stage' ? '#07101f' : '#dce9f4',
      backgroundColor: mode === 'stage' ? '#8cecff' : '#25324a'
    });
    this.hardButton?.setStyle({
      color: mode === 'hard' ? '#07101f' : '#ffe8d2',
      backgroundColor: mode === 'hard' ? '#ffb35c' : '#4a2f18'
    });
    this.hellButton?.setStyle({
      color: mode === 'hell' ? '#16060b' : '#ffe8ed',
      backgroundColor: mode === 'hell' ? '#ff5d6c' : '#441923'
    });
  }
}
