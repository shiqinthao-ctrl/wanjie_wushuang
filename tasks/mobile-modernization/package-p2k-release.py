"""Package the P2k diagnostic checkpoint, including failed original recordings."""
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "tasks/mobile-modernization/evidence/P2k"
TAG = "mobile-next-p2k-20260908"
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
    if len({entry["path"] for entry in entries}) != len(entries):
        raise RuntimeError("Duplicate archive paths")
    with zipfile.ZipFile(target, "x", zipfile.ZIP_DEFLATED) as bundle:
        for source, dest in files:
            bundle.write(source, dest)
        bundle.writestr("README.txt", readme)
        bundle.writestr("MANIFEST.json", json.dumps(
            {"tag": TAG, "commit": revision, "files": entries}, indent=2))
    with zipfile.ZipFile(target) as bundle:
        if bundle.testzip() is not None:
            raise RuntimeError(f"ZIP integrity failed: {name}")
        for entry in entries:
            if hashlib.sha256(bundle.read(entry["path"])).hexdigest() != entry["sha256"]:
                raise RuntimeError(f"ZIP content mismatch: {entry['path']}")
    return target


def main():
    revision = git("rev-parse", "HEAD")
    if git("rev-parse", f"{TAG}^{{commit}}") != revision or git("status", "--porcelain"):
        raise RuntimeError("Package only a clean, tagged commit")
    recordings = json.loads((EVIDENCE / "recordings.json").read_text(encoding="utf-8"))
    viewer = json.loads((EVIDENCE / "viewer-check.json").read_text(encoding="utf-8"))
    gates = json.loads((EVIDENCE / "final-gates.json").read_text(encoding="utf-8"))
    if len(recordings) != 12 or not viewer["passed"] or any(gate["exitCode"] for gate in gates):
        raise RuntimeError("Missing complete recordings, viewer or final gates")
    for run in recordings:
        if not run["fullDecodePassed"] or sha256(EVIDENCE / run["video"]) != run["sha256"]:
            raise RuntimeError(f"Video mismatch: {run['id']}")
    OUTPUT.mkdir(parents=True, exist_ok=False)
    copied_sources = {run["source"] for run in recordings}
    files = []
    for path in sorted(EVIDENCE.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(EVIDENCE)
        # Only omit originals already copied into videos/. Failed setup attempts
        # have no complete settlement recording and must remain in raw evidence.
        if path.suffix == ".webm" and relative.parent.as_posix() in copied_sources:
            continue
        files.append((path, relative.as_posix()))
    files.append((ROOT / "tasks/mobile-modernization/serve-g3-report.mjs", "serve-report.mjs"))
    files.append((ROOT / "tasks/mobile-modernization/P2k-EVIDENCE.md", "P2k-EVIDENCE.md"))
    report = package("wanjie-p2k-test-recordings.zip", files,
        f"Wanjie P2k diagnostic checkpoint\nVersion: {TAG}\nCommit: {revision}\n\n"
        "Extract the full ZIP. Open index.html in Chrome or run\n"
        "node serve-report.mjs . 4191 and visit http://127.0.0.1:4191/ .\n"
        "Keep videos/ and frames/ beside index.html. Node 22.12+ is supported.\n"
        "The viewer labels actual results and failed targets explicitly.\n"
        "All 12 natural original recordings are under videos/. Raw JSON,\n"
        "screenshots, failure assertions and supplemental native evidence\n"
        "remain included. MANIFEST.json identifies every file by SHA-256.\n\n"
        "The unchanged fresh-preparation HP-death acceptance gate remains open.\n"
        "Synthetic diagnostics and imported low-growth runs do not close it.\n"
        "Chrome touch emulation is not physical-device acceptance.\n", revision)
    dist = ROOT / "apps/mobile-next/dist"
    if not (dist / "index.html").is_file():
        raise RuntimeError("Missing production build")
    preview = package("wanjie-p2k-mobile-preview.zip",
        [(path, "mobile-next/" + path.relative_to(dist).as_posix())
         for path in sorted(dist.rglob("*")) if path.is_file()],
        f"Wanjie P2k development checkpoint\nVersion: {TAG}\nCommit: {revision}\n\n"
        "Gameplay is unchanged from G3: three starters, nine evolving forms,\n"
        "ten routes and six skill bonds. This checkpoint improves evidence.\n"
        "Extract into a NEW directory and serve the parent of mobile-next/\n"
        "with python -m http.server 4178 --bind 127.0.0.1 . Then visit\n"
        "http://127.0.0.1:4178/mobile-next/ . Do not open via file://.\n"
        "Keep the /mobile-next/ base path with other static servers.\n"
        "Storage uses independent IndexedDB wanjie-mobile-next; JSON imports\n"
        "copy into new slots. Export before changing origins or ports.\n"
        "Rollback: return to the retained legacy root entry. Do not overwrite\n"
        "it. Automatic reverse save conversion and PWA are not provided.\n"
        "The fresh HP-death gate remains open; this is not a full release.\n", revision)
    notes = OUTPUT / "RELEASE-NOTES.md"
    notes.write_bytes((ROOT / "tasks/mobile-modernization/P2k-RELEASE.md").read_bytes())
    assets = [report, preview, notes]
    (OUTPUT / "SHA256SUMS.txt").write_text(
        "".join(f"{sha256(path)}  {path.name}\n" for path in assets) +
        "".join(f"{run['sha256']}  {Path(run['video']).name}\n" for run in recordings), encoding="ascii")
    print(json.dumps({"tag": TAG, "commit": revision, "output": str(OUTPUT),
        "assets": [{"name": p.name, "bytes": p.stat().st_size, "sha256": sha256(p)} for p in assets]}, indent=2))


if __name__ == "__main__":
    main()
