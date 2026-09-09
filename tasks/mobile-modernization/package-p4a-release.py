"""Create the P4a comparison and retain every original browser attempt."""
import hashlib
import json
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "tasks/mobile-modernization/evidence/P4a"
TAG = "mobile-next-p4a-20260909"
OUTPUT = ROOT / "tasks/mobile-modernization/releases" / TAG


def run(*args):
    return subprocess.check_output(args, cwd=ROOT, text=True, encoding="utf8").strip()


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def media():
    from PIL import Image, ImageDraw, ImageFont

    OUTPUT.mkdir(parents=True, exist_ok=True)
    font = "C:/Windows/Fonts/msyh.ttc"
    banner = Image.new("RGB", (736, 104), "#122522")
    draw = ImageDraw.Draw(banner)
    draw.text((18, 10), "\u5730\u56fe\u8fb9\u7f18\u89c6\u91ce\u4fee\u590d | P4a", font=ImageFont.truetype(font, 25), fill="#eadcaa")
    draw.text((18, 57), "\u4fee\u590d\u524d\uff1a\u53f3\u4e0b\u89d2\u906e\u6321", font=ImageFont.truetype(font, 20), fill="#ffffff")
    draw.text((386, 57), "\u4fee\u590d\u540e\uff1a\u89d2\u8272\u6e05\u6670\u53ef\u89c1", font=ImageFont.truetype(font, 20), fill="#ffffff")
    banner.save(OUTPUT / "banner.png")
    before = next((EVIDENCE / "before-01").glob("test-results/*f3ec2*phone/video.webm"))
    after = next((EVIDENCE / "after-03").glob("test-results/*f3ec2*phone/video.webm"))
    video = OUTPUT / "wanjie-p4a-before-after.mp4"
    run("ffmpeg", "-v", "error", "-n", "-ss", "20", "-i", str(before),
        "-ss", "20", "-i", str(after), "-loop", "1", "-i", str(OUTPUT / "banner.png"),
        "-filter_complex", "[0:v]fps=25,setpts=PTS-STARTPTS[a];[1:v]fps=25,setpts=PTS-STARTPTS[b];[a][b]hstack[v];[2:v][v]vstack[out]",
        "-map", "[out]", "-t", "12", "-c:v", "libx264", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(video))
    run("ffmpeg", "-v", "error", "-n", "-ss", "8", "-i", str(video), "-frames:v", "1", str(OUTPUT / "comparison.png"))
    recordings = []
    for path in sorted(EVIDENCE.rglob("video.webm")):
        probe = json.loads(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)))
        run("ffmpeg", "-v", "error", "-xerror", "-i", str(path), "-f", "null", "-")
        recordings.append({"path": path.relative_to(EVIDENCE).as_posix(), "bytes": path.stat().st_size,
            "sha256": digest(path), "duration": float(probe["format"]["duration"]), "fullDecodePassed": True})
    run("ffmpeg", "-v", "error", "-xerror", "-i", str(video), "-f", "null", "-")
    (EVIDENCE / "recordings.json").write_text(json.dumps({"recordings": recordings,
        "comparison": {"file": video.name, "sha256": digest(video), "duration": 12,
            "sourceStartSeconds": 20, "independentNaturalRuns": True,
            "before": before.relative_to(EVIDENCE).as_posix(), "after": after.relative_to(EVIDENCE).as_posix()}}, indent=2), encoding="utf8")
    print(f"Decoded {len(recordings)} original recordings and the 12-second comparison.")


def package(name, sources, commit):
    entries = [{"path": dest, "bytes": path.stat().st_size, "sha256": digest(path)} for path, dest in sources]
    assert len({e["path"] for e in entries}) == len(entries)
    target = OUTPUT / name
    with zipfile.ZipFile(target, "x", zipfile.ZIP_DEFLATED) as bundle:
        for source, dest in sources:
            bundle.write(source, dest)
        bundle.writestr("MANIFEST.json", json.dumps({"tag": TAG, "commit": commit, "files": entries}, indent=2))
    with zipfile.ZipFile(target) as bundle:
        assert bundle.testzip() is None
        for entry in entries:
            assert hashlib.sha256(bundle.read(entry["path"])).hexdigest() == entry["sha256"]
    return target


def release():
    commit = run("git", "rev-parse", "HEAD")
    assert run("git", "rev-parse", f"{TAG}^{{commit}}") == commit
    assert not run("git", "status", "--porcelain"), "Package a clean tagged checkout"
    for report in ["final-gates.json", "app-gates.json"]:
        gates = json.loads((EVIDENCE / report).read_text(encoding="utf8"))
        assert gates and all(gate["exitCode"] == 0 for gate in gates)
    version = json.loads((ROOT / "dist/render/version.json").read_text(encoding="utf8"))
    assert version["sourceCommit"] == commit
    record = json.loads((EVIDENCE / "recordings.json").read_text(encoding="utf8"))
    assert len(record["recordings"]) == 35
    for item in record["recordings"]:
        assert item["fullDecodePassed"] and digest(EVIDENCE / item["path"]) == item["sha256"]
    for attempt, expected in [("after-04", 1), ("controls-01", 9)]:
        stats = json.loads((EVIDENCE / attempt / "results.json").read_text(encoding="utf8"))["stats"]
        assert stats["expected"] == expected and stats["unexpected"] == 0
    corners = json.loads((EVIDENCE / "after-03/results.json").read_text(encoding="utf8"))["stats"]
    assert corners["expected"] == 7 and corners["unexpected"] == 1
    assets = [package("wanjie-p4a-test-recordings.zip",
        [(p, p.relative_to(EVIDENCE).as_posix()) for p in sorted(EVIDENCE.rglob("*")) if p.is_file()] +
        [(ROOT / "tasks/mobile-modernization/P4a-EVIDENCE.md", "P4a-EVIDENCE.md")], commit)]
    public = ROOT / "dist/render"
    assets.append(package("wanjie-p4a-render-package.zip",
        [(p, p.relative_to(public).as_posix()) for p in sorted(public.rglob("*")) if p.is_file()], commit))
    notes = OUTPUT / "RELEASE-NOTES.md"
    notes.write_bytes((ROOT / "tasks/mobile-modernization/P4a-RELEASE.md").read_bytes())
    assets.extend([OUTPUT / "wanjie-p4a-before-after.mp4", OUTPUT / "comparison.png", notes])
    (OUTPUT / "SHA256SUMS.txt").write_text("".join(f"{digest(p)}  {p.name}\n" for p in assets), encoding="ascii")
    print(json.dumps({"commit": commit, "assets": [{"name": p.name, "bytes": p.stat().st_size} for p in assets]}, indent=2))


if __name__ == "__main__":
    if sys.argv[1:] == ["--media"]:
        media()
    elif sys.argv[1:] == ["--release"]:
        release()
    else:
        raise SystemExit("Use --media after browser tests, then --release after commit/tag/build.")
