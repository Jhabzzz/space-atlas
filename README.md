# Space Atlas

An interactive 3D atlas of spaceflight: every upcoming and recent orbital launch on a globe, a launch simulator with a working cockpit, a hangar of 16 rockets with an X-ray view, live ISS tracking, the big satellite constellations and how their signals travel, Moon landing sites, and the solar system with active spacecraft.

Built with three.js, plain HTML/JS and three small Vercel serverless functions.

## Live data
| Feed | Source | Refresh |
|---|---|---|
| `/api/launches` | [Launch Library 2](https://thespacedevs.com/llapi) (upcoming + previous launches) | cached 15 min at the edge |
| `/api/iss` | ISS orbital elements from [CelesTrak](https://celestrak.org) (NORAD 25544), crew from Launch Library 2 | cached 1 h |
| `/api/sats` | Constellation counts from CelesTrak GP groups | cached 6 h |

The ISS position is propagated in the browser with SGP4 ([satellite.js](https://github.com/shashwatak/satellite-js)).
If a live feed can't be reached, the page falls back to a saved snapshot and says so on screen.

Simulated parts are labelled as such in the UI: the launch ascent profile, constellation dot positions (real altitudes and inclinations, illustrative phasing), and approximate spacecraft positions on the solar-system map.

## Develop
```
python3 build.py     # rebuilds index.html from src/
vercel dev           # serves the page and /api locally
```
