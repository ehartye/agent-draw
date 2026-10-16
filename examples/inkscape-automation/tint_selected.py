"""A minimal native Inkscape effect, usable from its menu or Python CLI."""
import inkex


class TintSelected(inkex.EffectExtension):
    def effect(self):
        for element in self.svg.selection:
            element.style["fill"] = "#22c55e"


if __name__ == "__main__":
    TintSelected().run()
