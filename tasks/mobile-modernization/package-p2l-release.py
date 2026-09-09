"""Preserve P2l successes and failed targets in an evidence-only release."""
import hashlib
import json
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EVIDENCE = ROOT / "tasks/mobile-modernization/evidence/P2l"
TAG = "mobile-next-p2l-20260909"
RUNTIME = "649b0b54e16b0016de9ba88dd148516aefd0da8b"
OUTPUT = ROOT / "tasks/mobile-modernization/releases" / TAG


def run(*args):
    return subprocess.check_output(args, cwd=ROOT, text=True, encoding="utf8").strip()


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def load(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def media():
    from PIL import Image, ImageDraw, ImageFont

    OUTPUT.mkdir(parents=True, exist_ok=True)
    recordings = []
    for path in sorted(EVIDENCE.rglob("video.webm")):
        probe = json.loads(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)))
        run("ffmpeg", "-v", "error", "-xerror", "-i", str(path), "-f", "null", "-")
        recordings.append({"path": path.relative_to(EVIDENCE).as_posix(), "bytes": path.stat().st_size,
                           "sha256": digest(path), "duration": float(probe["format"]["duration"]), "fullDecodePassed": True})
    assert len(recordings) == 54, "Preserve all executions, including 3 death and 1 timeout target failures"
    demos = []
    for attempt, pattern, name in [
        ("inset-contact-01", "*replay-phone", "fresh-target-actual-victory"),
        ("natural-regression-01", "*replay-phone", "imported-low-growth-defeat"),
    ]:
        candidates = [p for p in (EVIDENCE / attempt / "test-results").glob(pattern)
                      if (p / "natural-settlement-input.json").exists()]
        if name.startswith("imported"):
            candidates = [p for p in candidates if load(p / "natural-settlement-input.json")["profile"] == "imported-low-growth"]
        assert len(candidates) == 1, candidates
        source = candidates[0] / "video.webm"
        result = load(candidates[0] / "natural-settlement-input.json")
        video = OUTPUT / f"wanjie-p2l-{name}.mp4"
        run("ffmpeg", "-v", "error", "-n", "-i", str(source), "-c:v", "libx264", "-crf", "20",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(video))
        run("ffmpeg", "-v", "error", "-xerror", "-i", str(video), "-f", "null", "-")
        demo = {"source": source.relative_to(EVIDENCE).as_posix(), "file": video.name,
                "sha256": digest(video), "uneditedFullRecording": True,
                "requested": result["outcome"], "profile": result["profile"], "observed": result["observed"]}
        demos.append(demo)
    sheet = Image.new("RGB", (780, 904), "#122522")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 18)
    labels = ["Fresh target: actual victory", "Imported low-growth: HP defeat"]
    for index, demo in enumerate(demos):
        draw.text((390 * index + 10, 16), labels[index], fill="#eadcaa", font=font)
        path = EVIDENCE / demo["source"]
        screenshot = next(path.parent.glob("*-defeat-result.png"))
        picture = Image.open(screenshot).convert("RGB")
        picture.thumbnail((390, 844))
        sheet.paste(picture, (390 * index, 60))
    sheet.save(OUTPUT / "settlement-comparison.png")
    (EVIDENCE / "recordings.json").write_text(json.dumps({"recordings": recordings, "demos": demos}, indent=2, ensure_ascii=False), encoding="utf8")
    print(f"Decoded {len(recordings)} originals and two complete normal-speed MP4 files.")


def package(name, sources, commit):
    entries = [{"path": dest, "sha256": digest(path)} for path, dest in sources]
    assert len({entry["path"] for entry in entries}) == len(entries)
    target = OUTPUT / name
    with zipfile.ZipFile(target, "x", zipfile.ZIP_DEFLATED) as bundle:
        for source, dest in sources:
            bundle.write(source, dest)
        bundle.writestr("MANIFEST.json", json.dumps({"tag": TAG, "commit": commit,
            "releaseType": "evidence-only", "unchangedRuntime": RUNTIME, "files": entries}, indent=2))
    with zipfile.ZipFile(target) as bundle:
        assert bundle.testzip() is None
        for entry in entries:
            assert hashlib.sha256(bundle.read(entry["path"])).hexdigest() == entry["sha256"]
    return target


def release():
    commit = run("git", "rev-parse", "HEAD")
    assert run("git", "rev-parse", f"{TAG}^{{commit}}") == commit
    assert not run("git", "status", "--porcelain"), "Package a clean tagged checkout"
    assert load(ROOT / "dist/render/version.json")["sourceCommit"] == RUNTIME
    assert all(gate["exitCode"] == 0 for gate in load(EVIDENCE / "gates.json"))
    assert all(gate["exitCode"] == 0 for gate in load(EVIDENCE / "app-checks.json"))
    rules = load(EVIDENCE / "rules.json")
    assert rules["numPassedTests"] == 946 and rules["numFailedTests"] == 0
    for attempt, passed, failed in [("inset-contact-01", 0, 3), ("native-01", 42, 0), ("natural-regression-01", 8, 1)]:
        stats = load(EVIDENCE / attempt / "results.json")["stats"]
        assert (stats["expected"], stats["unexpected"], stats["flaky"], stats["skipped"]) == (passed, failed, 0, 0)
    outcomes = []
    for path in sorted(EVIDENCE.glob("*/test-results/*/natural-settlement-input.json")):
        result = load(path)
        assert result["observed"]["persistenceVerified"] and result["observed"]["replayVerified"]
        assert result["errors"] == []
        requested = {"victory": "黄巾巨将已击败", "timeout": "首战时限已到", "defeat": "本局生命耗尽"}[result["outcome"]]
        outcomes.append({"path": path.relative_to(EVIDENCE).as_posix(), "requested": requested,
                         "actual": result["observed"]["title"], "profile": result["profile"]})
    assert len(outcomes) == 12
    failures = [item for item in outcomes if item["requested"] != item["actual"]]
    assert len(failures) == 4 and all(item["profile"] == "fresh-baseline" and item["actual"] == "黄巾巨将已击败" for item in failures)
    report = load(EVIDENCE / "recordings.json")
    assert len(report["recordings"]) == 54
    for item in report["recordings"]:
        assert item["fullDecodePassed"] and digest(EVIDENCE / item["path"]) == item["sha256"]
    for item in report["demos"]:
        assert digest(OUTPUT / item["file"]) == item["sha256"]
    assets = [package("wanjie-p2l-test-evidence.zip", [(p, p.relative_to(EVIDENCE).as_posix())
              for p in sorted(EVIDENCE.rglob("*")) if p.is_file()], commit)]
    notes = OUTPUT / "RELEASE-NOTES.md"
    notes.write_bytes((ROOT / "tasks/mobile-modernization/P2l-EVIDENCE.md").read_bytes())
    assets.extend([OUTPUT / item["file"] for item in report["demos"]])
    assets.extend([OUTPUT / "settlement-comparison.png", notes])
    (OUTPUT / "SHA256SUMS.txt").write_text("".join(f"{digest(p)}  {p.name}\n" for p in assets), encoding="ascii")
    print(json.dumps({"commit": commit, "assets": [{"name": p.name, "bytes": p.stat().st_size} for p in assets]}, indent=2))


if __name__ == "__main__":
    if sys.argv[1:] == ["--media"]:
        media()
    elif sys.argv[1:] == ["--release"]:
        release()
    else:
        raise SystemExit("Use --media, then --release after committing and tagging the evidence.")
