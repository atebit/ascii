#!/usr/bin/env python3
"""Build the explainer pages as single, shareable HTML files with three.js inlined.

    python3 build.py            # every page
    python3 build.py --only 3   # dev/stage-3.html: the game with stage 3 real, other stages stubbed

three.js is loaded from vendor/ (gitignored). If it's missing, it's fetched with npm pack.
The game pages also embed skill/ (path -> text) as SKILL_FILES, for stage 5's zip download.
"""
import json
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
THREE_VERSION = "0.170.0"
VENDOR = HERE / "vendor" / "three.module.min.js"
SKILL = HERE / "skill"

# page template -> (output, app scripts in load order)
PAGES = {
    "src/lab-cats.html": ("lab/cats.html", ["ascii.js", "orbit.js", "cats.js", "lab-cats.js"]),
    "src/game.html": ("index.html", [
        "ascii.js", "orbit.js", "cats.js", "music.js", "game-core.js",
        "stage-1-title.js", "stage-2-ascii.js", "stage-3-cats.js", "stage-4-ai.js", "zip.js", "stage-5-start.js",
        "game.js",
    ]),
}

LOADER = """const THREE = await import(URL.createObjectURL(new Blob(
  [document.getElementById('three-src').textContent], { type: 'text/javascript' })));
"""


def ensure_three():
    if VENDOR.exists():
        return
    VENDOR.parent.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["npm", "pack", f"three@{THREE_VERSION}", "--silent"], cwd=tmp, check=True)
        with tarfile.open(Path(tmp) / f"three-{THREE_VERSION}.tgz") as tar:
            for name in ("build/three.module.min.js", "LICENSE"):
                data = tar.extractfile(f"package/{name}").read()
                out = VENDOR if name.endswith(".js") else VENDOR.parent / "three-LICENSE"
                out.write_bytes(data)


def skill_files():
    """skill/ as a JS constant: { "design-wireframe-ascii/SKILL.md": "...", ... }."""
    files = {
        f.relative_to(SKILL).as_posix(): f.read_text()
        for f in sorted(SKILL.rglob("*"))
        if f.is_file() and not any(part.startswith(".") for part in f.relative_to(SKILL).parts)
    }
    # "<\/" keeps the JSON valid and stops a "</script" in a file from closing the page's script.
    return "const SKILL_FILES = " + json.dumps(files, ensure_ascii=False, indent=0).replace("</", "<\\/") + ";\n"


def dev_page(n):
    """The game with stage n real and the other stages swapped for stubs/."""
    template, (_, scripts) = next((t, p) for t, p in PAGES.items() if p[0] == "index.html")
    swap = [s if not s.startswith("stage-") or s.startswith(f"stage-{n}-") else f"stubs/{s}" for s in scripts]
    return {template: (f"dev/stage-{n}.html", swap)}


def main():
    ensure_three()
    three = VENDOR.read_text()
    assert "</script" not in three
    banner = f"/* three.js r{THREE_VERSION.split('.')[1]} · MIT License · https://threejs.org */\n"
    pages = dev_page(sys.argv[sys.argv.index("--only") + 1]) if "--only" in sys.argv else PAGES
    for template, (out, scripts) in pages.items():
        html = (HERE / template).read_text()
        app = LOADER + "\n".join((HERE / "src" / s).read_text() for s in scripts)
        if "zip.js" in scripts:
            app = skill_files() + app
        html = html.replace("<!-- THREE -->", f'<script id="three-src" type="text/plain">{banner}{three}</script>')
        html = html.replace("/* APP */", app)
        dest = HERE / out
        dest.parent.mkdir(exist_ok=True)
        dest.write_text(html)
        print(f"built {out} ({dest.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
