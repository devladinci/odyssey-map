# Content

Everything the map says about the *Odyssey* lives here. There is no code in this folder.

- `odyssey/*.json` holds facts that do not depend on language: ids, coordinates, certainty, line references.
- `odyssey/text/<lang>/*.json` holds the words, keyed by the same ids. There is one folder per language (`en`, `bg`). The check script compares every language with `bg`, so all languages must have exactly the same keys.

Run `npm run check` after any change. It fails if an id is missing, a language is incomplete, a spoiler tag is broken, a scene does not fit its book, or a sea journey crosses land.

## Rules for all text

- Plain, short sentences. One fact per sentence.
- Never state something as certain when it is not. Say how sure the location is, and why.
- Do not copy any published translation of the poem. Summaries are in our own words.

## Kinds of place

Every place has a `side`:

| `side` | What it is | Marker |
|---|---|---|
| `home` | a home or kingdom of the Greek world: Ithaca, Pylos, Sparta | bronze circle |
| `wander` | a stop of the wanderings: the Cyclopes, Aeaea, Scheria | red square |
| `story` | a place in a tale or on a route: Troy, Egypt, Cape Malea | green circle |
| `water` | a sea, a strait, the stream of Ocean | a name only |

## Certainty

`1` certain, `2` approximate, `3` disputed or schematic.

Every stop of the wanderings beyond Cape Malea is `3`, even where the tradition is very old. Its `loc` text says plainly that the place comes from tradition and not from Homer, and names the ancient author who put it there. Other candidates go in `alts`, with their names in the text file in the same order.

## Line references

`{ "b": 6, "from": 119, "to": 236 }` means Book 6, lines 119–236. `to` and `from` are optional. `"il": true` marks the *Iliad*.

## Spoilers

A reader sets how far they have read. Whatever comes later stays hidden until they get there. There are three tools.

**1. Spoiler tags in text.** Wrap any sentence or clause that tells what happens in Book N like this:

    {{N|the text}}

- `N` is the book in which the reader learns it (1–24). The wanderings are told in Books 9 to 12, so that is where they belong, although they happened earlier.
- Use `{{25|…}}` for what happens after the poem ends.
- Wrap the smallest piece that still reads well when hidden. Keep the comma or full stop that belongs to the hidden clause inside the tag.
- Do not tag background: geography, archaeology, myths from before the poem, and what the poem itself gives away at the start (Odysseus is with Calypso; Agamemnon was murdered; Poseidon is angry about the Cyclops).
- A tag cannot contain another tag. Every language must have the same tags, in the same order, in the same string.

**2. `"reveals": N` on a place, a dig, a theme item, a person, a god or a family.** The whole thing stays off the map and out of every list until the reader reaches Book N. All stops of the wanderings have it: the Cyclopes appear in Book 9, the Sirens in Book 12. A scene must not list a place before the book that reveals it; the check script enforces this.

**3. Events and routes** are hidden automatically until the first book in their `books` list.

## Scenes

Each book is split into scenes: `odyssey/scenes.json` holds the facts, `text/<lang>/scenes.json` the words.

```json
{
  "id": "9.3",
  "book": 9,
  "from": 62, "to": 104,
  "at": ["malea", "lotus"],
  "mentions": ["kythera"],
  "points": [{ "id": "p_goats", "lat": 37.5625, "lon": 15.1655, "certainty": 3 }],
  "view": { "center": [16.5, 37.5], "zoom": 3.7 },
  "path": { "kind": "tale", "pts": [[25.535, 40.835], [23.215, 36.41], [11.1, 33.83]] }
}
```

- Scenes cover every line of a book: the first starts at line 1, each next one starts where the last one ended, the last ends at the last line. The check script enforces this.
- `at`: ids of places or events where the action happens.
- `mentions`: ids of places that are only talked about.
- `points`: extra places that are not in the main lists. Their names go in the text file under `points`.
- `view`: where the camera goes. `center` is `[lon, lat]`. `zoom` is a MapLibre zoom level: about 2.6 for the whole sea, 4.6 for Greece and the Aegean, 6.2 for Ithaca with Pylos and Sparta, 10.2 for the island of Ithaca, 12 for the palace and the town.
- `path`: an optional journey to animate. `kind` is `walk`, `ride`, `sail`, `fly` or `tale` (a journey inside a story someone tells: all of Books 9 to 12, and the voyages that Nestor, Menelaus and Eumaeus tell about). `pts` are `[lon, lat]`. A path of kind `sail` must stay on the water.

Text for a scene:

```json
"9.3": { "title": "Past Malea to the Lotus-eaters", "text": "A storm from the north tears the sails. …" }
```

A scene text is two to four short sentences. It tells what happens and where. It never reveals anything from a later scene or book, and it takes no spoiler tags. It uses Homer's names for the places of the wanderings, never the modern ones.

## People

- `heroes.json`: one entry per character card. `group` is `house`, `suitors`, `hosts` or `wander`. `home` is the id of a place or event. The card lists the scenes in which the name occurs: the words to look for are in `reader.json` under `heroes.<id>.find`.
- `people.json`: the gods (`for`, `against` or `other`) and the family trees.
- `days.json`: the forty-one days of the action. Every line of every book belongs to exactly one block; the check script enforces this.

## Themes

`themes.json` lists the themes. A theme has `items` (markers), `lines`, or a `builtin` list (`routes`, `digs`, `realms`). A theme with `"tour": true` is read stop by stop.
