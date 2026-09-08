"""Package the verified G3 preview and replay viewer without altering raw evidence."""
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "tasks/mobile-modernization/evidence/G3"
TAG = "mobile-next-g3-20260908"
OUTPUT = ROOT / "tasks/mobile-modernization/releases" / TAG


def sha256(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT, text=True).strip()


def package(name, files, readme, revision):
    target = OUTPUT / name
    entries = [{"path": dest, "bytes": source.stat().st_size, "sha256": sha256(source)}
               for source, dest in files]
    manifest = {"tag": TAG, "commit": revision, "files": entries}
    with zipfile.ZipFile(target, "x", zipfile.ZIP_DEFLATED) as bundle:
        for source, dest in files:
            bundle.write(source, dest)
        bundle.writestr("README.txt", readme)
        bundle.writestr("MANIFEST.json", json.dumps(manifest, ensure_ascii=False, indent=2))
    with zipfile.ZipFile(target) as bundle:
        if bundle.testzip() is not None:
            raise RuntimeError(f"ZIP integrity failed: {name}")
        for entry in entries:
            if hashlib.sha256(bundle.read(entry["path"])).hexdigest() != entry["sha256"]:
                raise RuntimeError(f"ZIP content mismatch: {entry['path']}")
    return target


def main():
    revision = git("rev-parse", "HEAD")
    if git("rev-parse", f"{TAG}^{{commit}}") != revision:
        raise RuntimeError("Package only the tagged commit")
    if git("status", "--porcelain"):
        raise RuntimeError("Commit source and acceptance evidence before packaging")
    recordings = json.loads((EVIDENCE / "recordings.json").read_text(encoding="utf-8"))
    viewer = json.loads((EVIDENCE / "viewer-check.json").read_text(encoding="utf-8"))
    if len(recordings) != 4 or not viewer["passed"]:
        raise RuntimeError("Four accepted recordings and viewer verification are required")
    for run in recordings:
        if not run["fullDecodePassed"] or sha256(EVIDENCE / run["video"]) != run["sha256"]:
            raise RuntimeError(f"Video mismatch: {run['id']}")
    OUTPUT.mkdir(parents=True, exist_ok=False)
    files = [(EVIDENCE / name, name) for name in
             ["index.html", "recordings.json", "attempts.json", "checks.json", "final-gates.json",
              "rules.json", "regressions.json", "viewer-check.json"]]
    files += [(path, "attempts/" + path.parent.name + ".json")
              for path in sorted(EVIDENCE.glob("recorded-*/results.json"))]
    files += [(EVIDENCE / run["video"], run["video"]) for run in recordings]
    files += [(path, path.relative_to(EVIDENCE).as_posix())
              for path in sorted((EVIDENCE / "frames").glob("*.png"))]
    files.append((ROOT / "tasks/mobile-modernization/serve-g3-report.mjs", "serve-report.mjs"))
    report = package("wanjie-g3-test-recordings.zip", files,
        "Wanjie G3 automated browser recordings\n"
        f"Version: {TAG}\nCommit: {revision}\n\n"
        "Extract the entire ZIP. Open index.html in Chrome, or serve this folder\n"
        "using Node 22.12+ with node serve-report.mjs and open\n"
        "http://127.0.0.1:4190/ . Keep videos/ and frames/ beside index.html.\n"
        "The included server supports byte ranges required for HTTP video seeking.\n"
        "The player supports chapter markers, speed controls and original downloads.\n"
        "Chrome touch emulation is not physical-device acceptance. The P2j fresh\n"
        "HP-death path remains open; the full verification suite is not green.\n", revision)
    dist = ROOT / "apps/mobile-next/dist"
    preview_files = [(path, "mobile-next/" + path.relative_to(dist).as_posix())
                     for path in sorted(dist.rglob("*")) if path.is_file()]
    if not (dist / "index.html").is_file():
        raise RuntimeError("Missing production build")
    preview = package("wanjie-g3-mobile-preview.zip", preview_files,
        "Wanjie G3 development preview - not a production release\n"
        f"Version: {TAG}\nCommit: {revision}\n\n"
        "Extract the entire ZIP to a new folder. Serve that folder with\n"
        "python -m http.server 4178 --bind 127.0.0.1 and open\n"
        "http://127.0.0.1:4178/mobile-next/ . Do not open the game via file://.\n"
        "For another static server, keep the /mobile-next/ base path. HTTPS is\n"
        "recommended for remote previews. PWA/offline installation is pending.\n"
        "Choose Evolution Journey in the lobby for three starters and nine forms.\n"
        "IndexedDB uses wanjie-mobile-next. JSON imports copy into extra slots;\n"
        "legacy saves are untouched. Ports/origins have independent saves.\n"
        "Export progress before moving origins. Returning to the retained legacy\n"
        "root entry is the rollback path; no automatic reverse save conversion.\n"
        "Do not overwrite the legacy root entry when trying this preview.\n", revision)
    assets = [report, preview]
    notes = ROOT / "tasks/mobile-modernization/G3-RELEASE.md"
    (OUTPUT / "RELEASE-NOTES.md").write_bytes(notes.read_bytes())
    assets.append(OUTPUT / "RELEASE-NOTES.md")
    (OUTPUT / "SHA256SUMS.txt").write_text(
        "".join(f"{sha256(path)}  {path.name}\n" for path in assets) +
        "".join(f"{run['sha256']}  {Path(run['video']).name}\n" for run in recordings),
        encoding="ascii")
    print(json.dumps({"tag": TAG, "commit": revision, "output": str(OUTPUT),
                      "assets": [{"name": p.name, "bytes": p.stat().st_size,
                                  "sha256": sha256(p)} for p in assets]}, indent=2))


if __name__ == "__main__":
    main()
