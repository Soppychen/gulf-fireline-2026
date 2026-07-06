import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { HellChallengeScene } from './scenes/HellChallengeScene';
import { MenuScene } from './scenes/MenuScene';
import { ResultScene } from './scenes/ResultScene';
import './styles.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#07101f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 720,
    height: 1280
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      fps: 60
    }
  },
  scene: [BootScene, MenuScene, GameScene, HellChallengeScene, ResultScene],
  input: {
    activePointers: 3
  }
};

const game = new Phaser.Game(config);
game.canvas.setAttribute('tabindex', '0');
window.__gulfFirelineGame = game;

declare global {
  interface Window {
    __gulfFirelineGame: Phaser.Game;
  }
}
