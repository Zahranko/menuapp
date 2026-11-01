#!/bin/bash
# Writes brand values from brand.json and brand/ into the places that can't read config at runtime:
# Android applicationId and label, iOS bundle ID and display name, the Codemagic signing bundle ID,
# launcher icons (legacy and adaptive), launch screen colors, and the sites favicon.
# Safe to run any number of times. Needs python3; icons also need Pillow (pip install pillow).
set -euo pipefail
cd "$(dirname "$0")/.."

python3 - <<'PY'
import json, re, pathlib, sys

b = json.load(open("brand.json"))
root = pathlib.Path(".")
mobile = root / "apps/mobile"

def sub(path, pattern, repl, count=0):
    p = root / path
    if not p.exists():
        print(f"rebrand: skip {path} (missing)")
        return
    text = p.read_text()
    new, n = re.subn(pattern, repl, text, count=count, flags=re.M)
    if n == 0:
        sys.exit(f"rebrand: pattern not found in {path}: {pattern}")
    p.write_text(new)
    print(f"rebrand: updated {path}")

app_id = b["appId"]
name = b["brandName"]

# Android: applicationId changes with the brand; the Kotlin namespace keeps the code name.
sub("apps/mobile/android/app/build.gradle.kts", r'applicationId = "[^"]*"', f'applicationId = "{app_id}"')
sub("apps/mobile/android/app/src/main/AndroidManifest.xml", r'android:label="[^"]*"', f'android:label="{name}"')

# iOS: bundle ID for the app (test targets get a .RunnerTests suffix) and the name under the icon.
sub("apps/mobile/ios/Runner.xcodeproj/project.pbxproj",
    r'PRODUCT_BUNDLE_IDENTIFIER = [^;]*\.RunnerTests;', f'PRODUCT_BUNDLE_IDENTIFIER = {app_id}.RunnerTests;')
sub("apps/mobile/ios/Runner.xcodeproj/project.pbxproj",
    r'PRODUCT_BUNDLE_IDENTIFIER = (?![^;]*RunnerTests)[^;]*;', f'PRODUCT_BUNDLE_IDENTIFIER = {app_id};')
sub("apps/mobile/ios/Runner/Info.plist",
    r'(<key>CFBundleDisplayName</key>\s*<string>)[^<]*(</string>)', rf'\g<1>{name}\g<2>')

# Codemagic signs the iOS build for this bundle ID.
sub("codemagic.yaml", r'^(\s*bundle_identifier: ).*$', rf'\g<1>{app_id}')

# Launch screens in the brand color, so the app opens straight into its animated splash.
primary = b["colorPrimary"].lstrip("#")
sub("apps/mobile/android/app/src/main/res/values/colors.xml",
    r'(<color name="launch_background">)[^<]*(</color>)', rf'\g<1>#{primary}\g<2>')
r, g, bl = (int(primary[i:i + 2], 16) / 255 for i in (0, 2, 4))
sub("apps/mobile/ios/Runner/Base.lproj/LaunchScreen.storyboard",
    r'<color key="backgroundColor" [^/]*/>',
    f'<color key="backgroundColor" red="{r:.4f}" green="{g:.4f}" blue="{bl:.4f}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>')

# Sites favicon (Next.js serves app/icon.svg).
fav = root / "brand/favicon.svg"
if fav.exists():
    (root / "apps/sites/app/icon.svg").write_text(fav.read_text())
    print("rebrand: updated apps/sites/app/icon.svg")

# Launcher icons from brand/app-icon.png.
icon = root / "brand/app-icon.png"
try:
    from PIL import Image
except ImportError:
    print("rebrand: Pillow not installed, launcher icons not updated (pip install pillow)")
    sys.exit(0)

src = Image.open(icon).convert("RGBA")
android = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
for density, size in android.items():
    out = mobile / f"android/app/src/main/res/mipmap-{density}/ic_launcher.png"
    if out.parent.exists():
        src.resize((size, size), Image.LANCZOS).save(out)

# Android 8+ adaptive icon: brand/app-icon-foreground.png (the mark on transparent, inside the 66/108 safe
# circle) over the brand color. Android 13 themed icons reuse the foreground as the monochrome layer.
fg_path = root / "brand/app-icon-foreground.png"
res = mobile / "android/app/src/main/res"
if fg_path.exists() and res.exists():
    fg = Image.open(fg_path).convert("RGBA")
    for density, size in android.items():
        px = size * 108 // 48
        fg.resize((px, px), Image.LANCZOS).save(res / f"mipmap-{density}/ic_launcher_foreground.png")
    colors = res / "values/colors.xml"
    text = colors.read_text()
    entry = f'<color name="ic_launcher_background">#{primary}</color>'
    if 'name="ic_launcher_background"' in text:
        text = re.sub(r'<color name="ic_launcher_background">[^<]*</color>', entry, text)
    else:
        text = text.replace("</resources>", f"    {entry}\n</resources>")
    colors.write_text(text)
    anydpi = res / "mipmap-anydpi-v26"
    anydpi.mkdir(exist_ok=True)
    (anydpi / "ic_launcher.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<!-- Written by scripts/rebrand.sh from brand/app-icon-foreground.png and brand.json (colorPrimary). -->\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@color/ic_launcher_background" />\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n'
        '    <monochrome android:drawable="@mipmap/ic_launcher_foreground" />\n'
        '</adaptive-icon>\n')
    print("rebrand: updated Android adaptive icon")

iconset = mobile / "ios/Runner/Assets.xcassets/AppIcon.appiconset"
contents = iconset / "Contents.json"
if contents.exists():
    for image in json.load(open(contents))["images"]:
        if "filename" not in image:
            continue
        points = float(image["size"].split("x")[0])
        scale = int(image["scale"].rstrip("x"))
        px = round(points * scale)
        # App Store icons must not have an alpha channel.
        src.resize((px, px), Image.LANCZOS).convert("RGB").save(iconset / image["filename"])
print("rebrand: updated launcher icons")
PY
