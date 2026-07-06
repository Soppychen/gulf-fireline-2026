import Phaser from 'phaser';
import type { ResultStats } from '../types/game';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  create(stats: ResultStats): void {
    this.add.tileSprite(360, 640, 720, 1280, 'background_stage01_facility').setAlpha(0.55);
    this.add.rectangle(360, 640, 720, 1280, 0x050910, 0.72);
    const isHell = stats.mode === 'hell10';
    const title = stats.outcome === 'victory' ? (isHell ? '地狱通过' : '任务完成') : (isHell ? '挑战失败' : '任务失败');
    this.add.text(360, 190, title, { fontFamily: 'Arial', fontSize: '56px', color: stats.outcome === 'victory' ? '#9cf7ff' : '#ff7886', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(360, 290, `评级 ${stats.rating}`, { fontFamily: 'Arial', fontSize: '72px', color: '#ffdf72', fontStyle: 'bold' }).setOrigin(0.5);
    const lines = isHell ? [
      `模式 ${stats.modeName ?? '十秒炼狱'}`,
      `生存 ${(stats.elapsedMs / 1000).toFixed(2)} 秒`,
      `最佳 ${(stats.bestScore / 1000).toFixed(2)} 秒`,
      `击毁 ${stats.kills}`,
      `最高连击 ${stats.maxCombo}`
    ] : [
      `得分 ${stats.score}`,
      `最高分 ${stats.bestScore}`,
      `击毁率 ${stats.spawned ? Math.round((stats.kills / stats.spawned) * 100) : 0}%`,
      `最高连击 ${stats.maxCombo}`,
      `受击次数 ${stats.hitCount}`,
      `剩余生命 ${stats.lives}`,
      `用时 ${Math.floor(stats.elapsedMs / 1000)} 秒`
    ];
    this.add.text(360, 515, lines.join('\n'), {
      fontFamily: 'Arial',
      fontSize: '31px',
      color: '#d8e7f2',
      align: 'center',
      lineSpacing: 14
    }).setOrigin(0.5);
    const retry = this.add.text(360, 925, '重新出击', {
      fontFamily: 'Arial',
      fontSize: '36px',
      color: '#07101f',
      backgroundColor: '#8cecff',
      padding: { x: 44, y: 18 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const menu = this.add.text(360, 1032, '返回菜单', {
      fontFamily: 'Arial',
      fontSize: '30px',
      color: '#e8f4ff',
      backgroundColor: '#25324a',
      padding: { x: 38, y: 16 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retry.on('pointerdown', () => this.scene.start(stats.retryScene ?? 'GameScene', stats.retryData));
    menu.on('pointerdown', () => this.scene.start('MenuScene'));
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start(stats.retryScene ?? 'GameScene', stats.retryData));
  }
}
