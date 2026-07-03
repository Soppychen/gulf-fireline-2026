export class ScoreSystem {
  score = 0;
  combo = 0;
  maxCombo = 0;
  kills = 0;
  spawned = 0;
  hitCount = 0;
  multiplierUntil = 0;

  registerSpawn(): void {
    this.spawned += 1;
  }

  registerKill(value: number, time: number): void {
    this.kills += 1;
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const multiplier = time < this.multiplierUntil ? 2 : 1;
    this.score += Math.round(value * multiplier * (1 + Math.min(this.combo, 40) * 0.025));
  }

  registerHit(): void {
    this.hitCount += 1;
    this.combo = 0;
  }

  activateMultiplier(time: number): void {
    this.multiplierUntil = time + 9000;
  }

  rating(lives: number, elapsedMs: number): 'C' | 'B' | 'A' | 'S' {
    const killRate = this.spawned > 0 ? this.kills / this.spawned : 0;
    let points = 0;
    if (killRate > 0.55) points += 1;
    if (killRate > 0.78) points += 1;
    if (this.maxCombo >= 16) points += 1;
    if (this.hitCount <= 2) points += 1;
    if (lives >= 2) points += 1;
    if (elapsedMs < 230000) points += 1;
    return points >= 6 ? 'S' : points >= 4 ? 'A' : points >= 2 ? 'B' : 'C';
  }
}
