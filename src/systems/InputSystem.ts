import Phaser from 'phaser';

export interface InputState {
  moveX: number;
  moveY: number;
  focus: boolean;
  skillPressed: boolean;
  pausePressed: boolean;
  pointerWorld?: Phaser.Math.Vector2;
}

export class InputSystem {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly pressed = new Set<string>();
  private pointer?: Phaser.Input.Pointer;
  private wasSkillDown = false;
  private wasPauseDown = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: { pointerFollowOffsetY?: number } = {}
  ) {
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keys = scene.input.keyboard!.addKeys('W,A,S,D,SHIFT,SPACE,ESC,P') as Record<string, Phaser.Input.Keyboard.Key>;
    scene.input.keyboard!.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'W', 'A', 'S', 'D', 'SHIFT', 'SPACE', 'ESC', 'P']);
    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointer = pointer;
    });
    scene.input.on('pointerup', () => {
      this.pointer = undefined;
    });
  }

  read(): InputState {
    const left = this.cursors.left.isDown || this.keys.A.isDown || this.isDown('arrowleft', 'a');
    const right = this.cursors.right.isDown || this.keys.D.isDown || this.isDown('arrowright', 'd');
    const up = this.cursors.up.isDown || this.keys.W.isDown || this.isDown('arrowup', 'w');
    const down = this.cursors.down.isDown || this.keys.S.isDown || this.isDown('arrowdown', 's');
    const skillDown = this.keys.SPACE.isDown || this.isDown(' ');
    const pauseDown = this.keys.ESC.isDown || this.keys.P.isDown || this.isDown('escape', 'p');
    const pointerWorld = this.pointer?.isDown
      ? new Phaser.Math.Vector2(this.pointer.x, this.pointer.y - (this.options.pointerFollowOffsetY ?? 0))
      : undefined;
    const state: InputState = {
      moveX: Number(right) - Number(left),
      moveY: Number(down) - Number(up),
      focus: this.keys.SHIFT.isDown,
      skillPressed: skillDown && !this.wasSkillDown,
      pausePressed: pauseDown && !this.wasPauseDown,
      pointerWorld
    };
    this.wasSkillDown = skillDown;
    this.wasPauseDown = pauseDown;
    return state;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.pressed.add(event.key.toLowerCase());
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].includes(event.key)) {
      event.preventDefault();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.key.toLowerCase());
  };

  private isDown(...keys: string[]): boolean {
    return keys.some((key) => this.pressed.has(key));
  }
}
