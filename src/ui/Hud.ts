import Phaser from 'phaser';
import { aircraft } from '../data/aircraft';
import { stage01 } from '../data/levels';
import { Boss } from '../entities/Boss';
import { Player } from '../entities/Player';
import { ScoreSystem } from '../systems/ScoreSystem';

export class Hud {
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly skillBar: Phaser.GameObjects.Rectangle;
  private readonly weaponText: Phaser.GameObjects.Text;
  private readonly missileText: Phaser.GameObjects.Text;
  private readonly bossBarBg: Phaser.GameObjects.Rectangle;
  private readonly bossBar: Phaser.GameObjects.Rectangle;
  private readonly missionText: Phaser.GameObjects.Text;
  private readonly alertText: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene) {
    this.scoreText = scene.add.text(28, 24, '000000', { fontFamily: 'Arial', fontSize: '30px', color: '#d8f4ff' }).setDepth(100);
    this.comboText = scene.add.text(28, 64, 'COMBO 0', { fontFamily: 'Arial', fontSize: '20px', color: '#ffd882' }).setDepth(100);
    this.hpText = scene.add.text(520, 24, 'HP 3', { fontFamily: 'Arial', fontSize: '30px', color: '#ffffff' }).setDepth(100);
    this.weaponText = scene.add.text(520, 58, 'WPN Lv1', { fontFamily: 'Arial', fontSize: '20px', color: '#8ff3ff' }).setDepth(100);
    this.missileText = scene.add.text(520, 84, 'MSL 0', { fontFamily: 'Arial', fontSize: '20px', color: '#b8d7ff' }).setDepth(100);
    scene.add.rectangle(610, 75, 130, 12, 0x203049, 0.92).setDepth(100).setOrigin(0, 0.5);
    this.skillBar = scene.add.rectangle(610, 75, 130, 12, 0x77e8ff, 0.92).setDepth(101).setOrigin(0, 0.5);
    this.missionText = scene.add.text(360, 108, `${stage01.displayName} / ${stage01.missionType}`, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#c7d8e8'
    }).setOrigin(0.5).setDepth(100);
    this.bossBarBg = scene.add.rectangle(120, 126, 480, 16, 0x12090c, 0.85).setDepth(100).setOrigin(0, 0.5).setVisible(false);
    this.bossBar = scene.add.rectangle(120, 126, 480, 16, 0xff4d5f, 0.95).setDepth(101).setOrigin(0, 0.5).setVisible(false);
    this.alertText = scene.add.text(360, 226, '', {
      fontFamily: 'Arial',
      fontSize: '34px',
      color: '#ffdf82',
      fontStyle: 'bold',
      stroke: '#101820',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(130).setAlpha(0);
  }

  update(player: Player, score: ScoreSystem, time: number, boss?: Boss): void {
    this.scoreText.setText(score.score.toString().padStart(6, '0'));
    this.comboText.setText(`COMBO ${score.combo}`);
    this.hpText.setText(`HP ${player.hp}`);
    this.weaponText.setText(`WPN Lv${player.weaponLevel}`);
    this.missileText.setText(`MSL ${player.missileAmmo}`);
    const cooldown = aircraft.afx35.skillCooldownMs;
    const ready = Phaser.Math.Clamp(1 - Math.max(0, player.skillReadyAt - time) / cooldown, 0, 1);
    this.skillBar.displayWidth = 130 * ready;
    this.skillBar.setFillStyle(ready >= 1 ? 0x77e8ff : 0x75839a);
    if (boss?.active) {
      this.bossBarBg.setVisible(true);
      this.bossBar.setVisible(true);
      this.bossBar.displayWidth = 480 * Phaser.Math.Clamp(boss.hp / boss.maxHp, 0, 1);
    }
  }

  hideMission(): void {
    this.scene.tweens.add({ targets: this.missionText, alpha: 0, duration: 800 });
  }

  showAlert(message: string, color = '#ffdf82'): void {
    this.alertText.setText(message).setColor(color).setAlpha(1).setY(226);
    this.scene.tweens.killTweensOf(this.alertText);
    this.scene.tweens.add({
      targets: this.alertText,
      alpha: 0,
      y: 196,
      duration: 1200,
      ease: 'Quad.easeOut'
    });
  }
}
