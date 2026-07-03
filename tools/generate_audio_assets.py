#!/usr/bin/env python3
"""Generate original placeholder music and SFX for Gulf Fireline 2026."""

from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path

SAMPLE_RATE = 44100
ROOT = Path(__file__).resolve().parents[1]
AUDIO_DIR = ROOT / "assets" / "audio"
MUSIC_DIR = ROOT / "assets" / "music"


def clamp(value: float) -> float:
    return max(-1.0, min(1.0, value))


def env_adsr(t: float, duration: float, attack: float, decay: float, sustain: float, release: float) -> float:
    if t < attack:
        return t / max(attack, 0.0001)
    if t < attack + decay:
        k = (t - attack) / max(decay, 0.0001)
        return 1.0 + (sustain - 1.0) * k
    if t > duration - release:
        return sustain * max(0.0, (duration - t) / max(release, 0.0001))
    return sustain


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = max(0.001, max(abs(s) for s in samples))
    gain = min(0.96 / peak, 1.0)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for sample in samples:
            frames.extend(struct.pack("<h", int(clamp(sample * gain) * 32767)))
        wav.writeframes(frames)


def sine(freq: float, t: float) -> float:
    return math.sin(2.0 * math.pi * freq * t)


def square(freq: float, t: float) -> float:
    return 1.0 if sine(freq, t) >= 0 else -1.0


def saw(freq: float, t: float) -> float:
    return 2.0 * ((freq * t) % 1.0) - 1.0


def noise(rng: random.Random) -> float:
    return rng.uniform(-1.0, 1.0)


def make_buffer(duration: float) -> list[float]:
    return [0.0] * int(duration * SAMPLE_RATE)


def add(buf: list[float], start: float, duration: float, fn, gain: float = 1.0) -> None:
    start_i = int(start * SAMPLE_RATE)
    count = int(duration * SAMPLE_RATE)
    for i in range(count):
        idx = start_i + i
        if 0 <= idx < len(buf):
            t = i / SAMPLE_RATE
            buf[idx] += fn(t, duration) * gain


def one_shot(path: str, duration: float, fn) -> None:
    buf = make_buffer(duration)
    add(buf, 0.0, duration, fn)
    write_wav(AUDIO_DIR / path, buf)


def sfx_player_cannon() -> None:
    rng = random.Random(10)

    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.002, 0.018, 0.22, 0.035)
        pitch = 420 - 180 * (t / d)
        body = 0.45 * sine(pitch, t) + 0.18 * square(pitch * 1.5, t)
        tick = 0.12 * noise(rng)
        return (body + tick) * e * 0.55

    one_shot("sfx_player_cannon.wav", 0.075, fn)


def sfx_enemy_cannon() -> None:
    rng = random.Random(11)

    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.002, 0.025, 0.18, 0.04)
        pitch = 260 - 90 * (t / d)
        return (0.35 * saw(pitch, t) + 0.22 * noise(rng)) * e * 0.5

    one_shot("sfx_enemy_cannon.wav", 0.095, fn)


def sfx_missile_launch() -> None:
    rng = random.Random(12)

    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.01, 0.05, 0.55, 0.18)
        rise = 90 + 520 * (t / d)
        thrust = 0.45 * noise(rng) + 0.22 * saw(rise, t)
        return thrust * e * 0.65

    one_shot("sfx_missile_launch.wav", 0.42, fn)


def sfx_player_missile_launch() -> None:
    rng = random.Random(15)

    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.004, 0.04, 0.48, 0.13)
        rise = 360 + 760 * (t / d)
        ignition = 0.28 * noise(rng) * (1.0 - t / d)
        body = 0.38 * sine(rise, t) + 0.16 * saw(rise * 0.5, t)
        return (body + ignition) * e * 0.58

    one_shot("sfx_player_missile_launch.wav", 0.32, fn)


def sfx_enemy_sam_launch() -> None:
    rng = random.Random(16)

    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.012, 0.075, 0.68, 0.22)
        rise = 70 + 420 * (t / d)
        blast = 0.52 * noise(rng) * (1.0 - 0.35 * t / d)
        motor = 0.26 * saw(rise, t) + 0.18 * sine(58, t)
        return (blast + motor) * e * 0.78

    one_shot("sfx_enemy_sam_launch.wav", 0.54, fn)


def sfx_missile_lock() -> None:
    def fn(t: float, d: float) -> float:
        pulse = 1.0 if (t % 0.18) < 0.085 else 0.0
        e = env_adsr(t % 0.18, 0.085, 0.003, 0.01, 0.7, 0.035) if pulse else 0.0
        tone = sine(880, t) * 0.62 + sine(1320, t) * 0.18
        return tone * e * 0.55

    one_shot("sfx_missile_lock.wav", 0.72, fn)


def sfx_pickup() -> None:
    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.004, 0.04, 0.38, 0.12)
        arp = 680 if t < d / 3 else 920 if t < d * 2 / 3 else 1240
        return (0.55 * sine(arp, t) + 0.18 * sine(arp * 2, t)) * e * 0.58

    one_shot("sfx_pickup.wav", 0.32, fn)


def sfx_player_hit() -> None:
    rng = random.Random(13)

    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.002, 0.04, 0.4, 0.11)
        scrape = 0.5 * noise(rng) + 0.25 * saw(155 - 50 * t / d, t)
        return scrape * e * 0.62

    one_shot("sfx_player_hit.wav", 0.26, fn)


def sfx_shield_absorb() -> None:
    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.006, 0.06, 0.5, 0.18)
        sweep = 260 + 720 * (1.0 - t / d)
        shimmer = sine(sweep, t) + 0.25 * sine(sweep * 2.01, t)
        return shimmer * e * 0.52

    one_shot("sfx_shield_absorb.wav", 0.38, fn)


def sfx_emp_release() -> None:
    rng = random.Random(14)

    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.008, 0.08, 0.5, 0.38)
        sweep = 1180 - 920 * (t / d)
        zap = 0.42 * sine(sweep, t) + 0.25 * square(sweep * 0.5, t) + 0.16 * noise(rng)
        return zap * e * 0.7

    one_shot("sfx_emp_release.wav", 0.78, fn)


def explosion(path: str, duration: float, seed: int, base: float, gain: float) -> None:
    rng = random.Random(seed)

    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.001, 0.08, 0.48, d * 0.62)
        boom_pitch = max(42, base - base * 0.72 * (t / d))
        thump = 0.55 * sine(boom_pitch, t) + 0.18 * sine(boom_pitch * 0.5, t)
        blast = 0.55 * noise(rng) * (1.0 - t / d)
        return (thump + blast) * e * gain

    one_shot(path, duration, fn)


def sfx_boss_intro() -> None:
    rng = random.Random(30)

    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.02, 0.18, 0.72, 0.42)
        horn = 0.42 * sine(92, t) + 0.26 * sine(138, t) + 0.12 * saw(184, t)
        rumble = 0.18 * noise(rng)
        return (horn + rumble) * e * 0.72

    one_shot("sfx_boss_intro.wav", 1.35, fn)


def sfx_boss_phase() -> None:
    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.006, 0.08, 0.45, 0.24)
        sweep = 240 + 820 * (t / d)
        return (0.46 * square(sweep, t) + 0.28 * sine(sweep * 0.5, t)) * e * 0.62

    one_shot("sfx_boss_phase.wav", 0.62, fn)


def sfx_ui_click() -> None:
    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.001, 0.012, 0.16, 0.035)
        return (0.5 * sine(720, t) + 0.25 * sine(1440, t)) * e * 0.42

    one_shot("sfx_ui_click.wav", 0.08, fn)


def sfx_ui_result() -> None:
    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.005, 0.08, 0.55, 0.22)
        note = 520 if t < 0.16 else 660 if t < 0.32 else 880
        return (0.52 * sine(note, t) + 0.12 * sine(note * 2, t)) * e * 0.55

    one_shot("sfx_ui_result.wav", 0.55, fn)


def note_freq(semitone: int) -> float:
    return 55.0 * (2 ** (semitone / 12))


def add_kick(buf: list[float], start: float, gain: float = 1.0) -> None:
    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.001, 0.025, 0.2, 0.12)
        return sine(95 - 50 * t / d, t) * e * gain

    add(buf, start, 0.18, fn)


def add_snare(buf: list[float], start: float, gain: float = 1.0) -> None:
    rng = random.Random(int(start * 1000) + 100)

    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.001, 0.025, 0.38, 0.1)
        return (0.5 * noise(rng) + 0.18 * sine(185, t)) * e * gain

    add(buf, start, 0.16, fn)


def add_hat(buf: list[float], start: float, gain: float = 1.0) -> None:
    rng = random.Random(int(start * 2000) + 200)

    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.001, 0.015, 0.12, 0.04)
        return noise(rng) * e * gain

    add(buf, start, 0.07, fn)


def add_synth(buf: list[float], start: float, length: float, freq: float, gain: float, wave: str = "saw") -> None:
    def fn(t: float, d: float) -> float:
        e = env_adsr(t, d, 0.012, 0.08, 0.68, 0.12)
        osc = saw(freq, t) if wave == "saw" else sine(freq, t)
        return (osc + 0.25 * sine(freq * 2, t)) * e * gain

    add(buf, start, length, fn)


def make_loop(path: str, bpm: int, bars: int, mode: str) -> None:
    beat = 60.0 / bpm
    duration = bars * 4 * beat
    buf = make_buffer(duration)
    bass_pattern = [0, 0, 3, 0, -2, -2, 5, 3]
    lead_pattern = [12, 15, 14, 12, 10, 12, 7, 10]

    for bar in range(bars):
        for b in range(4):
            t = (bar * 4 + b) * beat
            if mode != "menu" or b in (0, 2):
                add_kick(buf, t, 0.42 if mode == "menu" else 0.58)
            if b in (1, 3):
                add_snare(buf, t, 0.28 if mode == "menu" else 0.43)
            for h in range(2 if mode == "menu" else 4):
                add_hat(buf, t + h * beat / (2 if mode == "menu" else 4), 0.12 if mode == "menu" else 0.18)

        root = bass_pattern[bar % len(bass_pattern)]
        for step in range(8):
            t = (bar * 4 * beat) + step * beat / 2
            add_synth(buf, t, beat * 0.42, note_freq(root), 0.18 if mode == "menu" else 0.24)

        if mode in {"stage", "boss"}:
            for step in range(8):
                t = (bar * 4 * beat) + step * beat / 2
                lead = lead_pattern[(bar + step) % len(lead_pattern)]
                add_synth(buf, t, beat * 0.34, note_freq(lead), 0.08 if mode == "stage" else 0.11, "sine")

        if mode == "boss":
            for b in range(4):
                t = (bar * 4 + b) * beat
                add_synth(buf, t, beat * 1.8, note_freq(-12), 0.16, "sine")

    fade_len = int(0.05 * SAMPLE_RATE)
    for i in range(fade_len):
        scale = i / fade_len
        buf[i] *= scale
        buf[-i - 1] *= scale
    write_wav(MUSIC_DIR / path, buf)


def make_stinger(path: str, victory: bool) -> None:
    duration = 3.0 if victory else 2.6
    buf = make_buffer(duration)
    notes = [0, 3, 7, 12] if victory else [0, -2, -5, -12]
    for i, n in enumerate(notes):
        add_synth(buf, i * 0.35, 0.72, note_freq(n + 12), 0.24, "sine")
        if i < 3:
            add_kick(buf, i * 0.35, 0.35)
    if victory:
        add_snare(buf, 1.4, 0.32)
        add_synth(buf, 1.42, 1.1, note_freq(19), 0.18, "sine")
    else:
        add_synth(buf, 1.3, 1.0, note_freq(-12), 0.22, "sine")
    write_wav(MUSIC_DIR / path, buf)


def main() -> None:
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    MUSIC_DIR.mkdir(parents=True, exist_ok=True)

    sfx_player_cannon()
    sfx_enemy_cannon()
    sfx_missile_launch()
    sfx_player_missile_launch()
    sfx_enemy_sam_launch()
    sfx_missile_lock()
    sfx_pickup()
    sfx_player_hit()
    sfx_shield_absorb()
    sfx_emp_release()
    explosion("sfx_explosion_small_01.wav", 0.34, 20, 155, 0.68)
    explosion("sfx_explosion_small_02.wav", 0.36, 21, 145, 0.66)
    explosion("sfx_explosion_medium_01.wav", 0.62, 22, 115, 0.74)
    explosion("sfx_explosion_medium_02.wav", 0.66, 23, 105, 0.72)
    explosion("sfx_explosion_large_01.wav", 1.08, 24, 85, 0.86)
    explosion("sfx_explosion_large_02.wav", 1.16, 25, 78, 0.84)
    sfx_boss_intro()
    sfx_boss_phase()
    sfx_ui_click()
    sfx_ui_result()

    make_loop("music_menu_loop.wav", 120, 16, "menu")
    make_loop("music_stage01_loop.wav", 132, 56, "stage")
    make_loop("music_boss_loop.wav", 140, 40, "boss")
    make_stinger("music_victory_stinger.wav", True)
    make_stinger("music_failure_stinger.wav", False)


if __name__ == "__main__":
    main()
