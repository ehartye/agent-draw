# Bitmap lettering starter

This manifest exports all95 printable ASCII characters as white glyphs on transparency, using deterministic32x48 cells. The requested generic monospace family is resolved by the local Inkscape/font environment; it does not identify an installed face or provide measured bearings/kerning.

After Draw setup, render into a fresh directory:

```sh
node scripts/run-managed.js font-atlas examples/bitmap-lettering/manifest.json --out output/lettering
```

Load `font.png` and `font.fnt` in a BMFont-compatible loader, including Phaser's native bitmap-font loader. Keep `project.json`, editable `font.svg`, the normalized/original manifests and `receipt.json` with the export. Inspect the actual glyphs against a contrasting background and check cell fit before game use. The [export contract](../../docs/font-atlas.md) defines limits, fixed advances and overwrite safeguards.
