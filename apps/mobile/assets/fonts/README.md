# Brand fonts

Each file joins a Latin brand font with the Arabic brand font, so Arabic text always renders in the brand's Arabic face.

- `Display-*`: Bricolage Grotesque (brand.json `fontDisplay`) + IBM Plex Sans Arabic (`fontArabic`)
- `Body-*`: DM Sans (`fontBody`) + IBM Plex Sans Arabic (`fontArabic`)

Made from the Google Fonts sources with fontTools (`varLib.instancer` for the weights, then `merge`).
All three are under the SIL Open Font License; see the `OFL-*.txt` files.
