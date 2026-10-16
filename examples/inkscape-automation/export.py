"""Render a full SVG page through the inkex command API."""
import sys
from inkex.command import inkscape

inkscape(sys.argv[1], export_area_page=True, export_filename=sys.argv[2])
