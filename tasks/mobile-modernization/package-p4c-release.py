"""Preserve P4c browser evidence and package the clean tagged preview."""
import hashlib
import json
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "tasks/mobile-modernization/evidence/P4c"
TAG = "mobile-next-p4c-20260909"
OUTPUT = ROOT / "tasks/mobile-modernization/releases" / TAG


def run(*args):
    return subprocess.check_output(args, cwd=ROOT, text=True, encoding="utf8").strip()


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def media():
    from PIL import Image, ImageDraw, ImageFont

    OUTPUT.mkdir(parents=True, exist_ok=True)
    before = next((EVIDENCE / "before-02/test-results").glob("*clear-landscape-short/classic.png"))
    after = next((EVIDENCE / "after-03/test-results").glob("*clear-landscape-short/classic.png"))
    poster = Image.new("RGB", (1136, 392), "#122522")
    draw = ImageDraw.Draw(poster)
    font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 20)
    draw.text((12, 8), "P4c | \u6a2a\u5c4f\u624b\u673a\u6218\u6597\u5e03\u5c40 568 x 320", font=font, fill="#eadcaa")
    draw.text((12, 40), "\u4fee\u590d\u524d\uff1a\u6587\u5b57\u91cd\u53e0", font=font, fill="white")
    draw.text((580, 40), "\u4fee\u590d\u540e\uff1a\u5206\u533a\u6e05\u6670", font=font, fill="white")
    poster.paste(Image.open(before).convert("RGB"), (0, 72))
    poster.paste(Image.open(after).convert("RGB"), (568, 72))
    poster.save(OUTPUT / "comparison.png")
    source = next((EVIDENCE / "after-03/test-results").glob("*rotation-landscape-short/video.webm"))
    video = OUTPUT / "wanjie-p4c-natural-test.mp4"
    run("ffmpeg", "-v", "error", "-n", "-i", str(source), "-c:v", "libx264", "-crf", "20",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(video))
    frames = Image.new("RGB", (1136, 640), "#122522")
    for index, seconds in enumerate([1, 4, 10, 15]):
        frame = OUTPUT / f"frame-{seconds}.png"
        run("ffmpeg", "-v", "error", "-n", "-ss", str(seconds), "-i", str(video), "-frames:v", "1", str(frame))
        frames.paste(Image.open(frame).convert("RGB"), (568 * (index % 2), 320 * (index // 2)))
    frames.save(OUTPUT / "recording-review.png")
    recordings = []
    for path in sorted(EVIDENCE.rglob("video.webm")):
        probe = json.loads(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)))
        run("ffmpeg", "-v", "error", "-xerror", "-i", str(path), "-f", "null", "-")
        recordings.append({"path": path.relative_to(EVIDENCE).as_posix(), "bytes": path.stat().st_size,
            "sha256": digest(path), "duration": float(probe["format"]["duration"]), "fullDecodePassed": True})
    run("ffmpeg", "-v", "error", "-xerror", "-i", str(video), "-f", "null", "-")
    (EVIDENCE / "recordings.json").write_text(json.dumps({"recordings": recordings,
        "demo": {"source": source.relative_to(EVIDENCE).as_posix(), "file": video.name,
                 "sha256": digest(video), "uneditedFullRecording": True}}, indent=2), encoding="utf8")
    print(f"Decoded {len(recordings)} raw recordings and the uncut natural test MP4.")


def package(name, sources, commit):
    entries = [{"path": dest, "sha256": digest(path)} for path, dest in sources]
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
    version = json.loads((ROOT / "dist/render/version.json").read_text(encoding="utf8"))
    assert version["sourceCommit"] == commit and version["milestone"] == TAG
    gates = json.loads((EVIDENCE / "gates.json").read_text(encoding="utf8"))
    assert gates and all(gate["exitCode"] == 0 for gate in gates)
    rules = json.loads((EVIDENCE / "rules.json").read_text(encoding="utf8"))
    assert rules["numPassedTests"] == 946 and rules["numFailedTests"] == 0
    for attempt, count in [("after-03", 9), ("regression-01", 27), ("portrait-01", 9)]:
        stats = json.loads((EVIDENCE / attempt / "results.json").read_text(encoding="utf8"))["stats"]
        assert stats["expected"] == count
        assert stats["unexpected"] == 0
    recordings = json.loads((EVIDENCE / "recordings.json").read_text(encoding="utf8"))["recordings"]
    assert len(recordings) == 57
    for item in recordings:
        assert item["fullDecodePassed"] and digest(EVIDENCE / item["path"]) == item["sha256"]
    public = ROOT / "dist/render"
    assets = [package("wanjie-p4c-render-package.zip", [(p, p.relative_to(public).as_posix())
        for p in sorted(public.rglob("*")) if p.is_file()], commit),
        package("wanjie-p4c-test-recordings.zip", [(p, p.relative_to(EVIDENCE).as_posix())
        for p in sorted(EVIDENCE.rglob("*")) if p.is_file()], commit)]
    notes = OUTPUT / "RELEASE-NOTES.md"
    notes.write_bytes((ROOT / "tasks/mobile-modernization/P4c-EVIDENCE.md").read_bytes())
    assets.extend([OUTPUT / "wanjie-p4c-natural-test.mp4", OUTPUT / "comparison.png", notes])
    (OUTPUT / "SHA256SUMS.txt").write_text("".join(f"{digest(p)}  {p.name}\n" for p in assets), encoding="ascii")
    print(json.dumps({"commit": commit, "assets": [{"name": p.name, "bytes": p.stat().st_size} for p in assets]}, indent=2))


if __name__ == "__main__":
    if sys.argv[1:] == ["--media"]:
        media()
    elif sys.argv[1:] == ["--release"]:
        release()
    else:
        raise SystemExit("Use --media, then --release after committing, tagging and building the Render package.")
