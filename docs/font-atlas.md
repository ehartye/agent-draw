# Bitmap lettering export

`agent-draw font-atlas manifest.json --out output [--timeout 1..300] [--overwrite]`

This native Inkscape export creates white, transparent-background glyphs for a
single-page BMFont XML loader, including Phaser bitmap text. It requires the same
existing Inkscape 1.2+ selection as `build`; it never installs fonts or tools.

```json
{
  "version": 1,
  "name": "Noir lettering",
  "font": "monospace",
  "size": 24,
  "characters": " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?-",
  "columns": 16,
  "cellWidth": 32,
  "cellHeight": 48
}
```

Only these fields are accepted. `version: 1` and `name` are required. Defaults
are `font: "monospace"`, `size: 24`, all 95 printable ASCII characters in ascending
code-point order, 16 columns, 32-pixel cell width and 48-pixel cell height.
Name and font are trimmed printable ASCII strings of at most 120 and 128
characters respectively. Characters are a nonempty string of unique printable
ASCII code points 32..126 (bounded to 96 entries; only 95 exist), including at least
one visible glyph. Their supplied order determines cell order.

Size is an integer 8..64, columns 1..16, and cell dimensions 16..128. Cells must
be at least `size + 4` wide and `ceil(size * 1.5) + 4` high, allowing a two-pixel
inset and baseline at `size + 2`. The generated project must also fit Draw's
4096-pixel canvas dimensions and 128 Mi layer-pixel budget; very tall single-column
or large full-character sheets can exceed these limits and are refused.

The bitmap layout uses deterministic fixed-cell monospace advances, regardless of
the selected font's own metrics. For glyph index `i`, BMFont `x` is
`(i % columns) * cellWidth`, `y` is `floor(i / columns) * cellHeight`, width and
height are the full cell, both offsets are zero, and `xadvance` is `cellWidth`.
`lineHeight` is `cellHeight`, `base` is `size + 2`, `scaleW` is
`columns * cellWidth`, and `scaleH` is `ceil(characterCount / columns) * cellHeight`.
There is one page (`font.png`), no trimming, no measured bearings, and no kerning.
Unused cells are transparent. Space advances the same distance as every other
character. Its editable text leaf contains space followed by an invisible
zero-width space (U+200B), because Draw disallows whitespace-only text.

Each glyph is a separate white text leaf in a normal version 1 Draw project.
Prefer a locally installed monospace font. Inkscape resolves family names and
fallbacks; the receipt records the requested family, not proof of a particular
installed font. The exporter does not measure ink, clip individual cells, or
certify glyph coverage: native acceptance must check glyph fit, spacing and font
selection before game use, especially for unusual families. Tint the white atlas
at runtime if needed. Render at native size or review filtering at game scale.

The output contains:

- `font.png`: verified static 8-bit RGBA PNG at the exact sheet dimensions.
- `font.svg`: editable native SVG produced by the existing Draw renderer.
- `project.json`: validated Draw source, rebuildable with the ordinary build CLI.
- `font.fnt`: BMFont XML whose cells and dimensions match the sheet.
- `manifest.json`: normalized configuration, usable to repeat the font export.
- `source-manifest.json`: byte-for-byte original configuration.
- `receipt.json`: tool/renderer versions, layout, requested font, SHA-256 of the
  original source and generated project, and hashes of every output above.

The source is never modified. Inputs must be regular files no larger than 2 MiB;
symlink sources or ancestor paths are refused. Output must not contain the source.
Existing output requires explicit overwrite, a matching font-atlas receipt,
unchanged artifact hashes and no unrelated files, links or directories. Input and
output snapshots are rechecked after rendering before staged publication; failure
leaves previous output in place. Renderer profile/temp state stays in an owned
sibling staging directory. Cleanup only removes that staging state and successful
replacement backups. A failed publication restores the prior directory; if that
restoration fails, the backup remains for recovery.

The default timeout is 60 seconds. The 1..300 second deadline includes reading,
dependency probing, rendering, PNG verification, hashing and publication checks.
Only PNG is rasterized; this command does not export PDF or use FFmpeg.

Library exports from `src/font-atlas.js` are `validateFontAtlasManifest(input)`,
`createFontAtlas(input)` (returns `{manifest, project, fnt}` without tools or writes),
and `fontAtlas(source, out, options)` (returns the receipt plus absolute output path).
Focused tests mock process execution and verify data and publication safeguards;
they do not claim native font rendering acceptance.
