"""Edit the named sample object through Inkscape's bundled inkex API."""
import sys
import inkex

tree = inkex.load_svg(sys.argv[1])
tree.getroot().getElementById("hero").style["fill"] = "#22c55e"
tree.write(sys.argv[2], encoding="UTF-8", xml_declaration=True)
