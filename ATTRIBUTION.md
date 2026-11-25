# Sources and credits

This map stands on the work of many people who share their data and research openly. Thank you.

If something here is missing or wrongly credited, please open an issue.

## Map data

| What | Source | Licence | Where it is used |
|---|---|---|---|
| Coastline of the sheet | © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, as packaged by the [geo-maps](https://github.com/simonepri/geo-maps) project (`@geo-maps/earth-lands-100m`) | ODbL 1.0 | `public/geo/land.json` |
| Fine coastline of Ithaca and Cephalonia | © OpenStreetMap contributors, through the [Overpass API](https://overpass-api.de) | ODbL 1.0 | `scripts/detail/coast.json`, `public/geo/land.json` |
| Elevation | © [Mapterhorn](https://mapterhorn.com/attribution) terrain tiles. For most of the sheet they are built from the Copernicus GLO-30 elevation model. | see "Elevation data" below | `public/terrain/` |
| Ancient places | Places shared with the Iliad Map keep its coordinates, which come from [Pleiades: A Gazetteer of Past Places](https://pleiades.stoa.org). The others are well-known coordinates of the sites, rounded; no dataset was copied. | CC BY (Pleiades) | `content/odyssey/places.json`, `digs.json` |
| Rivers | [Natural Earth](https://www.naturalearthdata.com), 10 m rivers; the small rivers of the Troad are OpenStreetMap lines | Public domain; ODbL 1.0 | `public/geo/rivers.json` |
| Modern borders | Natural Earth, 50 m boundary lines | Public domain | `public/geo/borders.json` |
| Modern towns | Well-known coordinates, rounded to about one kilometre; no dataset was copied | | `content/odyssey/modern.json` |
| Kingdoms, the coast of about 1200 BC, old river beds | Drawn for the sister project, [The Iliad Map](https://github.com/devladinci/iliad-map) | CC BY 4.0 | `public/geo/realms.json`, `public/geo/ancient.json` |

### Required notices

**OpenStreetMap.** © OpenStreetMap contributors. `public/geo/land.json` and `scripts/detail/coast.json` are simplified extracts of OpenStreetMap data and are made available under the Open Database Licence: https://www.openstreetmap.org/copyright

**Copernicus DEM.** © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the European Union and ESA; all rights reserved.

**Mapterhorn.** © Mapterhorn. Full list of its sources: https://mapterhorn.com/attribution

**Pleiades.** Pleiades: A Gazetteer of Past Places, https://pleiades.stoa.org, Creative Commons Attribution.

**Natural Earth.** Made with Natural Earth. Free vector and raster map data at naturalearthdata.com.

### Elevation data

The elevation tiles in `public/terrain/` were downloaded from Mapterhorn with `scripts/fetch-terrain.mjs`. Mapterhorn blends many open datasets. For most of this sheet, and for all of Greece, Türkiye, the Balkans and North Africa, the tiles are built from Copernicus GLO-30. Where a finer national model exists, Mapterhorn uses it. On this sheet that includes:

| Area | Dataset | Producer | Licence |
|---|---|---|---|
| Southern Italy | TINITALY 1.1 | Istituto Nazionale di Geofisica e Vulcanologia (INGV) | CC BY 4.0 |
| Sicily | Modello digitale del terreno 2 m | Regione Siciliana | CC BY 4.0 |
| Cyprus | Cyprus DTM 2019 | Department of Lands and Surveys, Cyprus | CC BY 4.0 |

The sheet reaches from Gibraltar to the Levant, so other datasets on Mapterhorn's list are part of the tiles too. The full and authoritative list, with the licence of each dataset, is at https://mapterhorn.com/attribution.

## The poem

- Line numbers follow the standard numbering of the Greek text. Scene boundaries and line references were checked against Homer, *Odyssey*, edited by A. T. Murray (Loeb Classical Library, 1919), as published by the [Perseus Digital Library](https://www.perseus.tufts.edu) (`canonical-greekLit`, CC BY-SA).
- The scene summaries were written from that Greek text and from Murray's English prose translation of 1919 (public domain) in the same Perseus edition. The translation was a source of facts only.
- No text of the poem and no published translation is reproduced. All summaries are written for this map.
- Bulgarian names follow, where we could check them, the forms of Georgi Batakliev's translation of the *Odyssey*.

## Research the map relies on

The places of the wanderings are not Homer's. Each note on the map says which ancient or modern author put the place there. The main ones:

| What | Source |
|---|---|
| Circe's sons in Italy | Hesiod, *Theogony* 1011–1016 |
| Cyclopes and Laestrygonians in Sicily; Charybdis as the strait; the Phaeacians on Corcyra | Thucydides 6.2, 4.24, 1.25, 3.70 |
| The Lotus-eaters in Libya and on Meninx | Herodotus 4.177; Polybius 1.39; Strabo 17.3.17 |
| Eratosthenes' doubts; the answers of Polybius and Strabo; the Sirens; Aeolus on Strongyle | Strabo, *Geography* 1.2, 5.4, 6.2 |
| Circeii, the grave of Elpenor | Theophrastus, *Enquiry into Plants* 5.8.3; Strabo 5.3.6 |
| The Laestrygonians at Formiae | Pliny, *Natural History* 3.59 |
| Avernus and the Cimmerians | Ephorus in Strabo 5.4.5 |
| The Acheron and the rivers of Hades | Pausanias 1.17.5; Herodotus 5.92 |
| Calypso's island | Callimachus in Strabo 1.2.37 and 7.3.6; Pseudo-Scylax 13; Plutarch, *On the Face in the Moon* 941a |
| Dulichium, Taphos, Temesa, Pylos in Triphylia | Strabo 10.2, 6.1.5, 8.3 |
| A Phoenician sailing guide | V. Bérard, *Les Phéniciens et l'Odyssée* (1902–03); *Les navigations d'Ulysse* (1927–29) |
| The wanderings in Greek waters | T. Severin, *The Ulysses Voyage* (1987) |
| Adventures taken over from a poem about the Argo | K. Meuli, *Odyssee und Argonautika* (1921) |
| Ithaca on Lefkada | W. Dörpfeld, *Alt-Ithaka* (1927) |
| Ithaca on Paliki | R. Bittlestone, J. Diggle, J. Underhill, *Odysseus Unbound* (2005) |

Archaeology and changing coasts:

| What | Study |
|---|---|
| Cave at Polis Bay, Pilikata, Aetos | S. Benton and W. A. Heurtley, *Annual of the British School at Athens* 35 and following (1934–39) |
| Agios Athanasios ("School of Homer") | Excavations of the University of Ioannina, led by A. Papadopoulos and L. Kontorli-Papadopoulou (1994–2011) |
| Palace of Nestor | C. Blegen and others (1939–1969); the "Griffin Warrior" grave: J. Davis and S. Stocker (2015) |
| Harbour basin near Pylos | E. Zangger and others (1997) |
| Achelous delta and the Echinades | A. Vött, H. Brückner and others (2004–2017) |
| Mouth of the Acheron | M. Besonen, G. Rapp, Z. Jing (2003) |
| The "oracle of the dead" on the Acheron | S. Dakaris (1958–1977) |
| Pharos and the causeway of Alexandria | N. Marriner, J.-P. Goiran, C. Morhange (2008) |
| Thonis-Heracleion | F. Goddio (2007) |
| Bay of Troy | J. Kraft, G. Rapp, İ. Kayan, J. Luce (2003); İ. Kayan (2014) |

Other things on the map come from the same kind of reading:

- **The routes** are schematic. Homer names the stops, not the course between them.
- **The forty-one days** follow the usual count of the commentaries; some scholars count forty.
- **The kingdoms** are computed from the towns Homer lists in the *Iliad*. They are not historical borders.

## Software and fonts

| What | Licence |
|---|---|
| [MapLibre GL JS](https://maplibre.org), the map engine | BSD 3-Clause |
| [Preact](https://preactjs.com) and Preact Signals, the interface | MIT |
| [Vite](https://vite.dev) and TypeScript, the build | MIT, Apache 2.0 |
| [PMTiles](https://github.com/protomaps/PMTiles), used to download the elevation tiles | BSD 3-Clause |
| Puppeteer, used for the automated checks | Apache 2.0 |
| Cormorant Garamond by Christian Thalmann (Catharsis Fonts) | SIL Open Font Licence 1.1 |
| PT Sans by ParaType | SIL Open Font Licence 1.1 |

The fonts are packaged by [Fontsource](https://fontsource.org).
