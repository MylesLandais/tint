"""Generate the synthetic track grain for the Tint table demo.

Run once; the output is committed as data. Seeded from each artist id so the
fixture is stable across runs and reviewable as a diff.
"""
import json, pathlib, re, hashlib

ROOT = pathlib.Path('/home/warby/Workspace-git/tint')
fixture = (ROOT / 'src/docs/table/infrasound-fixture.ts').read_text()

# Pull (id, name, track count) triples in document order.
artists = []
for m in re.finditer(
    r'"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)".*?"tracks":\s*(\d+)',
    fixture, re.S):
    artists.append((m.group(1), m.group(2), int(m.group(3))))

# Distributions lifted from the Vault's Mixxx crate so the shape of the
# synthetic data matches the real library it stands in for.
BPM = [92, 98, 100, 108, 128, 132, 140, 142, 150, 155, 160, 174]
KEYS = ['4A','5A','3B','6A','9A','11A','3A','7B','2A','8A','10A','12A','1A','5B','8B']
ENERGY = [1,1,1,1,5,5,5,2,3,4,4,5]        # weighted to the observed 1/5 poles
ADDED = ['2025-10-16', '2025-12-04', '2026-01-01']

HEAD = ['Aetheric','Subsonic','Null','Harmonic','Recursive','Fractal','Umbral','Tidal',
        'Copper','Lucid','Hollow','Vermillion','Static','Perihelion','Glacial','Obsidian',
        'Latent','Cardinal','Pale','Iron']
TAIL = ['Drift','Cartography','Signal','Bloom','Descent','Lattice','Meridian','Fold',
        'Transit','Reverie','Threshold','Cascade','Ember','Interval','Vector','Wake',
        'Aperture','Residue','Passage','Halo']

def rng(seed_text):
    """Deterministic byte stream from a stable seed."""
    buf, counter = b'', 0
    while True:
        if not buf:
            buf = hashlib.sha256(f'{seed_text}:{counter}'.encode()).digest()
            counter += 1
        b, buf = buf[0], buf[1:]
        yield b

def build(artist_id, name, count):
    r = rng(artist_id)
    out = []
    for i in range(count):
        pick = lambda seq: seq[next(r) % len(seq)]
        secs = 90 + next(r) + (next(r) % 200)          # ~90s to ~5.7min
        out.append({
            'id': f'{artist_id}-t{i + 1}',
            'artistId': artist_id,
            'title': f'{pick(HEAD)} {pick(TAIL)}',
            'bpm': pick(BPM),
            'key': pick(KEYS),
            'energy': pick(ENERGY),
            'duration': secs,
            'added': pick(ADDED),
        })
    return out

by_artist = {}
total = 0
for artist_id, name, count in artists:
    tracks = build(artist_id, name, count)
    if tracks:
        by_artist[artist_id] = tracks
    total += len(tracks)

lines = [
    '/*',
    ' * SYNTHETIC DATA — not a real catalog.',
    ' *',
    ' * The Infrasound lineup and the Vault\'s Mixxx crate share exactly one artist,',
    ' * so no real artist-to-track join exists. These tracks are generated',
    ' * deterministically from each artist id, with BPM, Camelot key, energy, and',
    ' * duration drawn from the distributions of the real crate so the table demo',
    ' * sorts and filters against plausible shapes. Track titles are combinatorial',
    ' * and name nothing that exists.',
    ' *',
    ' * Regenerate with scripts/gen-tracks.py. Committed as data so the demo has no',
    ' * runtime generation step.',
    ' */',
    '',
    "import type { MusicTrack } from './music-types'",
    '',
    '/** Tracks keyed by artist id. Artists with a zero rollup are absent. */',
    'export const artistTracks: Readonly<Record<string, readonly MusicTrack[]>> = {',
]
for artist_id, tracks in by_artist.items():
    lines.append(f"  {json.dumps(artist_id)}: [")
    for t in tracks:
        lines.append('    ' + json.dumps(t, separators=(', ', ': ')) + ',')
    lines.append('  ],')
lines.append('}')
lines.append('')

(ROOT / 'src/docs/table/tracks-fixture.ts').write_text('\n'.join(lines))
print(f'artists with tracks: {len(by_artist)} / {len(artists)}')
print(f'total tracks: {total}')
print(f'lines: {len(lines)}')
