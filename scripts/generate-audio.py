#!/usr/bin/env python3
"""Compose the game's original, offline ambient loop and soft UI click.

Requires NumPy and ffmpeg. No samples, third-party recordings or network services.
Oscillators and envelopes complete whole cycles for a seamless 32-second loop.
"""
from pathlib import Path
import subprocess
import tempfile
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'app/src/main/res/raw'
RATE = 32000


def encode(name, samples):
    OUT.mkdir(parents=True, exist_ok=True)
    pcm = np.clip(samples * 32767, -32768, 32767).astype('<i2')
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / (name + '.wav')
        with wave.open(str(wav), 'wb') as stream:
            stream.setnchannels(2); stream.setsampwidth(2); stream.setframerate(RATE)
            stream.writeframes(pcm.tobytes())
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav),
                        '-c:a', 'libvorbis', '-q:a', '3', str(OUT / (name + '.ogg'))], check=True)


def main():
    seconds = 32
    t = np.arange(RATE * seconds) / RATE
    pad = np.zeros((len(t), 2))
    chords = [[73.416, 87.307, 110, 130.813], [58.27, 87.307, 116.541, 146.832],
              [65.406, 97.999, 130.813, 195.998], [73.416, 87.307, 110, 146.832]]
    for index, chord in enumerate(chords):
        distance = (t - index*8 + seconds/2) % seconds - seconds/2
        envelope = np.where(np.abs(distance) < 8, .5 + .5*np.cos(np.pi*distance/8), 0)
        for voice, hz in enumerate(chord):
            hz = round(hz * seconds) / seconds
            for channel in range(2):
                phase = voice*.37 + channel*.075
                tone = np.sin(2*np.pi*hz*t + phase) + .16*np.sin(2*np.pi*hz*2*t + phase)
                pad[:, channel] += envelope * tone * (.055 if voice == 0 else .025)
    pulse = .86 + .14*np.cos(2*np.pi*t/8)
    pad *= pulse[:, None]
    # A quiet, repeating high-frequency texture. It never masks story/button cues.
    rng = np.random.default_rng(29)
    frequencies = np.fft.rfftfreq(len(t), 1/RATE)
    spectrum = rng.normal(size=len(frequencies)) + 1j*rng.normal(size=len(frequencies))
    spectrum *= np.where((frequencies > 160) & (frequencies < 1600), 1/np.maximum(frequencies, 1), 0)
    texture = np.fft.irfft(spectrum, n=len(t))
    texture /= max(np.max(np.abs(texture)), 1e-12)
    pad += texture[:, None] * .003
    assert np.max(np.abs(pad)) < .5
    encode('night_loop', pad)
    click_t = np.arange(int(RATE*.065)) / RATE
    click = (np.sin(2*np.pi*760*click_t)*.13 + np.sin(2*np.pi*220*click_t)*.08)*np.exp(-85*click_t)
    click *= np.minimum(click_t/.002, 1) * np.minimum((.065-click_t)/.008, 1)
    encode('button_click', np.column_stack((click, click)))
    print('Generated original 32-second ambient music and 65 ms button click.')


if __name__ == '__main__':
    main()
