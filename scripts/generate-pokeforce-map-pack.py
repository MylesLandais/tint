#!/usr/bin/env python3
"""Export the PokéForce source ZIP and local PFCK cache as browser map data.

The source ZIP intentionally contains the independent decoder but not the
private game assets. The cache is therefore an explicit input and is never
copied into the repository. The output contains only the selected map chunks
and their decoded tile records.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import struct
import sys
import types
from pathlib import Path
from zipfile import ZipFile

import msgpack  # type: ignore
import xxhash  # type: ignore


CELL = struct.Struct("<BBBqHHHH")
HEADER = struct.Struct("<4sHH16sQQ")
CHUNK_SIZE = 32


def load_pfck_tool(source_zip: Path):
    with ZipFile(source_zip) as archive:
        source = archive.read("pokeforce-source/work/pfck/pfck_tool.py").decode()
    module = types.ModuleType("pokeforce_pfck_tool")
    module.__file__ = str(source_zip)
    sys.modules[module.__name__] = module
    exec(compile(source, module.__file__, "exec"), module.__dict__)
    return module.PfckArchive


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def decode_chunk(data: bytes, origin_x: int, origin_y: int) -> dict:
    layer_count, record_count = struct.unpack_from("<HI", data)
    expected = 6 + record_count * CELL.size
    if expected + 2 > len(data):
        raise ValueError("truncated PFCK chunk")
    cells = []
    for index in range(record_count):
        layer, x, y, z, source, atlas_x, atlas_y, alternative = CELL.unpack_from(
            data, 6 + index * CELL.size
        )
        if x >= CHUNK_SIZE or y >= CHUNK_SIZE or layer >= layer_count:
            raise ValueError("invalid PFCK cell record")
        cells.append(
            {
                "x": origin_x + x,
                "y": origin_y + y,
                "layer": layer,
                "z": z,
                "source": source,
                "atlasX": atlas_x,
                "atlasY": atlas_y,
                "alternative": alternative,
            }
        )
    object_count = struct.unpack_from("<H", data, expected)[0]
    return {"layerCount": layer_count, "cells": cells, "objectCount": object_count}


def find_entry(entries: dict[int, object], path: str):
    key_hash = xxhash.xxh3_64(path.encode()).intdigest()
    entry = entries.get(key_hash)
    if entry is None:
        raise KeyError(f"missing PFCK chunk: {path}")
    return entry


def export(source_zip: Path, cache: Path, output: Path) -> None:
    PfckArchive = load_pfck_tool(source_zip)
    with PfckArchive(cache) as archive:
        maps = {}
        map_entries = {
            entry.record_id: entry
            for section in archive.sections
            if section.section_type == 5
            for entry in archive.iter_entries(section)
        }
        for map_id in (0, 56):
            manifest = msgpack.unpackb(archive.decode_entry(map_entries[map_id]), raw=False)
            maps[map_id] = manifest

        chunk_entries = {
            entry.key_hash: entry
            for section in archive.sections
            if section.section_type == 7
            for entry in archive.iter_entries(section)
        }
        selected = {
            0: {
                "name": maps[0]["name"],
                "origin": [2528, 960],
                "size": [96, 96],
                "spawn": [2586, 1011],
                "chunks": [],
            },
            56: {
                "name": maps[56]["name"],
                "origin": [0, 0],
                "size": [32, 32],
                "spawn": [6, 10],
                "chunks": [],
            },
        }
        for map_id, bounds in selected.items():
            min_x, min_y = bounds["origin"]
            width, height = bounds["size"]
            manifest_paths = set(maps[map_id]["chunk_paths"])
            for origin_y in range(min_y, min_y + height, CHUNK_SIZE):
                for origin_x in range(min_x, min_x + width, CHUNK_SIZE):
                    path = f"{maps[map_id]['name']}/m_{origin_x}_{origin_y}.bin"
                    if path not in manifest_paths:
                        continue
                    entry = find_entry(chunk_entries, path)
                    decoded = decode_chunk(archive.decode_entry(entry), origin_x, origin_y)
                    bounds["chunks"].append({"path": path, **decoded})

        payload = {
            "schema": "tint.pokeforce-map/v1",
            "source": {
                "archiveSha256": sha256(source_zip),
                "cacheSha256": sha256(cache),
                "maps": {str(key): maps[key]["name"] for key in selected},
            },
            "maps": {str(key): value for key, value in selected.items()},
        }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, separators=(",", ":")) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-zip", type=Path, default=Path("/home/warby/Downloads/pokeforce-source.zip"))
    parser.add_argument("--cache", type=Path, default=Path("/home/warby/.local/share/PokeForce/assets/client-cache.pfck"))
    parser.add_argument("--output", type=Path, default=Path("public/pokeforce/map.json"))
    args = parser.parse_args()
    export(args.source_zip, args.cache, args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
