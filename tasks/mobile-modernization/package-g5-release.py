"""Preserve G5 browser evidence and package the clean tagged preview."""
import hashlib
import json
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "tasks/mobile-modernization/evidence/G5"
TAG = "mobile-next-g5-20260909"
OUTPUT = ROOT / "tasks/mobile-modernization/releases" / TAG


def run(*args):
    return subprocess.check_output(args, cwd=ROOT, text=True, encoding="utf8").strip()


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def inspect_video(path):
    probe = json.loads(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)))
    run("ffmpeg", "-v", "error", "-xerror", "-i", str(path), "-f", "null", "-")
    return {"bytes": path.stat().st_size, "sha256": digest(path),
            "duration": float(probe["format"]["duration"]), "fullDecodePassed": True}


def media():
    from PIL import Image, ImageDraw, ImageFont

    OUTPUT.mkdir(parents=True, exist_ok=True)
    demos = []
    for profile in ["desktop", "phone"]:
        source = next((EVIDENCE / "natural-01/test-results").glob(f"*-{profile}/video.webm"))
        video = OUTPUT / f"wanjie-g5-{profile}-full.mp4"
        run("ffmpeg", "-v", "error", "-n", "-i", str(source), "-c:v", "libx264", "-crf", "20",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(video))
        demos.append({"source": source.relative_to(EVIDENCE).as_posix(), "file": video.name,
                      "uneditedFullRecording": True, **inspect_video(video)})

    font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 20)
    sheet = Image.new("RGB", (1280, 850), "#122522")
    draw = ImageDraw.Draw(sheet)
    for index, seconds in enumerate([26, 104, 210, 315]):
        frame = OUTPUT / f"phone-frame-{seconds}.png"
        run("ffmpeg", "-v", "error", "-n", "-ss", str(seconds), "-i", str(OUTPUT / "wanjie-g5-phone-full.mp4"), "-frames:v", "1", str(frame))
        shot = Image.open(frame).convert("RGB")
        shot.thumbnail((312, 800))
        x = index * 320 + (320 - shot.width) // 2
        sheet.paste(shot, (x, 44))
        draw.text((index * 320 + 12, 8), f"G5 | {seconds}s", font=font, fill="#eadcaa")
    sheet.save(OUTPUT / "recording-review.png")

    poster = Image.new("RGB", (960, 900), "#122522")
    draw = ImageDraw.Draw(poster)
    draw.text((18, 10), "G5 | \u971c\u7130\u5251\u7687 / \u516b\u65b9\u7130\u8f6e / \u971c\u706b\u6dec\u70bc", font=font, fill="#eadcaa")
    for index, filename in enumerate(["form-frostflame.png", "route-ringfire.png", "evolution-bond.png"]):
        source = next((EVIDENCE / "natural-01/test-results").glob(f"*-narrow/{filename}"))
        poster.paste(Image.open(source).convert("RGB"), (index * 320, 48))
    poster.save(OUTPUT / "g5-build-preview.png")
    recordings = [{"path": path.relative_to(EVIDENCE).as_posix(), **inspect_video(path)}
                  for path in sorted(EVIDENCE.rglob("*.webm"))]
    (EVIDENCE / "recordings.json").write_text(json.dumps({"recordings": recordings, "demos": demos}, indent=2), encoding="utf8")
    print(f"Decoded {len(recordings)} raw recordings and both complete normal-speed MP4s.")


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
    rules = json.loads((EVIDENCE / "rules-01.json").read_text(encoding="utf8"))
    assert rules["numPassedTests"] == 974 and rules["numFailedTests"] == 0
    for attempt, count in [("natural-01", 3), ("regression-01", 51)]:
        stats = json.loads((EVIDENCE / attempt / "results.json").read_text(encoding="utf8"))["stats"]
        assert stats["expected"] == count and stats["unexpected"] == stats["skipped"] == stats["flaky"] == 0
    media_info = json.loads((EVIDENCE / "recordings.json").read_text(encoding="utf8"))
    assert len(media_info["recordings"]) == 57
    for item in media_info["recordings"]:
        assert item["fullDecodePassed"] and digest(EVIDENCE / item["path"]) == item["sha256"]
    for item in media_info["demos"]:
        assert item["fullDecodePassed"] and digest(OUTPUT / item["file"]) == item["sha256"]
    public = ROOT / "dist/render"
    assets = [package("wanjie-g5-render-package.zip", [(p, p.relative_to(public).as_posix())
        for p in sorted(public.rglob("*")) if p.is_file()], commit),
        package("wanjie-g5-test-recordings.zip", [(p, p.relative_to(EVIDENCE).as_posix())
        for p in sorted(EVIDENCE.rglob("*")) if p.is_file()], commit)]
    notes = OUTPUT / "RELEASE-NOTES.md"
    notes.write_bytes((ROOT / "tasks/mobile-modernization/G5-EVIDENCE.md").read_bytes())
    assets.extend([OUTPUT / item["file"] for item in media_info["demos"]])
    assets.extend([OUTPUT / "g5-build-preview.png", notes])
    (OUTPUT / "SHA256SUMS.txt").write_text("".join(f"{digest(p)}  {p.name}\n" for p in assets), encoding="ascii")
    print(json.dumps({"commit": commit, "assets": [{"name": p.name, "bytes": p.stat().st_size} for p in assets]}, indent=2))


if __name__ == "__main__":
    if sys.argv[1:] == ["--media"]:
        media()
    elif sys.argv[1:] == ["--release"]:
        release()
    else:
        raise SystemExit("Use --media, then --release after committing, tagging and building the Render package.")
