# Brand fonts

Each file joins a Latin brand font with the Arabic brand font, so Arabic text always renders in the brand's Arabic face.

- `Display-*`: Bricolage Grotesque (brand.json `fontDisplay`) + Cairo (`fontArabic`)
- `Body-*`: DM Sans (`fontBody`) + Cairo (`fontArabic`)

Made from the variable fonts in the google/fonts repo with fontTools:

1. `varLib.instancer` for each weight: Bricolage Grotesque at `opsz=48, wdth=100`, DM Sans at `opsz=14`, Cairo at `slnt=0`,
   each at the file's weight (Display 600/700/800, Body 400/500/600/700).
2. Cairo subset to its Arabic glyphs (U+0600–06FF, 0750–077F, 08A0–08FF, FB50–FDFF, FE70–FEFF, ZWJ/ZWNJ, LRM/RLM),
   keeping every OpenType feature.
3. `merge` the Latin instance first, then the Arabic subset.
4. Vertical metrics set to ascender 1085, descender -415, line gap 0 (typo and hhea, USE_TYPO_METRICS on), so Latin
   lines keep their height; win ascent/descent cover the tallest glyphs.

Code never names these fonts: it uses the `Display` and `Body` families from pubspec.yaml (see `AppFonts`).
All three are under the SIL Open Font License; see the `OFL-*.txt` files.
