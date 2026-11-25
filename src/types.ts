// Shapes of the content pack. See content/README.md.
export type Lang = 'bg' | 'en';
/** home = homes and kingdoms of the Greek world; wander = a stop of the wanderings; story = a place in a tale or on a route. */
export type Side = 'home' | 'wander' | 'story' | 'water';
export type Certainty = 1 | 2 | 3;
export type Anchor = 'right' | 'left' | 'top' | 'bottom';
export type LonLat = [number, number];

export interface Ref { b: number; from?: number; to?: number; il?: boolean }

export interface Place {
  id: string; side: Side; lat: number; lon: number; certainty: Certainty; minZoom: number; anchor: Anchor;
  greek?: string; suitors?: number; height?: number; refs: Ref[]; alts?: { lat: number; lon: number }[]; flags?: string[]; rotate?: number;
  reveals?: number;           // hidden until the reader reaches this book
}
export interface EventSite { id: string; lat: number; lon: number; certainty: Certainty; minZoom: number; anchor: Anchor; books: number[] }
export interface Route { id: string; books: number[]; color: string; certainty: Certainty; pts: LonLat[]; loop?: boolean; sea?: boolean }
export interface Dig { id: string; lat: number; lon: number; minZoom: number; anchor: Anchor; sea?: boolean; reveals?: number }
export interface Region { id: string; lat: number; lon: number; kind: 'sea' | 'land' }
export interface Overlay { id: string; certainty: Certainty }
export interface ThemeItem { id: string; lat: number; lon: number; icon: string; anchor: Anchor; dir?: number; books?: number[]; zoom?: number; reveals?: number; coast?: boolean }
export interface ThemeLine { id: string; color: string; pts: LonLat[]; labelAt?: number; fast?: boolean; wind?: boolean; sea?: boolean; reveals?: number }
export interface Theme { id: string; color: string; builtin?: 'routes' | 'digs' | 'realms'; tour?: boolean; items?: ThemeItem[]; lines?: ThemeLine[] }
export interface BookInfo { book: number; at: string[] }
export interface ScenePoint { id: string; lat: number; lon: number; certainty: Certainty }
export interface Scene {
  id: string; book: number; from: number; to: number; at?: string[]; mentions?: string[]; points?: ScenePoint[];
  view: { center: LonLat; zoom: number }; path?: { kind: 'walk' | 'ride' | 'sail' | 'fly' | 'tale'; pts: LonLat[] };
}

// ---- words, one set per language
export interface Hero { name: string; role: string }
export interface PlaceText { name: string; note?: string; refNote?: string; heroes?: Hero[]; text: string; loc: string; alts?: string[] }
export interface Note { name: string; note?: string; text: string; loc?: string; src?: string }
export interface Texts {
  places: Record<string, PlaceText>;
  story: {
    events: Record<string, Note>; routes: Record<string, Note>; books: Record<string, { title: string; summary: string }>;
    overlays: Record<string, Note>; regions: Record<string, string>;
  };
  extra: { digs: Record<string, Note>; digNotes: Record<string, string>; rivers: Record<string, string> };
  themes: Record<string, { name: string; sub: string; intro: string; items?: Record<string, Note>; lines?: Record<string, Note> }>;
  scenes: { scenes: Record<string, { title: string; text: string }>; points: Record<string, string> };
  reader: {
    names: Record<string, string>; gods: Record<string, string>; godsIntro: string;
    families: Record<string, { name: string; note: string }>; familiesIntro: string;
    days: Record<string, string>; daysNote: string; modern: Record<string, string>;
    heroes: Record<string, { about: string; find: string[] }>;
  };
}

// ---- one entry for anything that can be selected on the map
export type Kind = 'place' | 'event' | 'dig' | 'route' | 'titem' | 'tline' | 'alt' | 'overlay' | 'point';
export interface Item {
  id: string; kind: Kind; lat: number; lon: number;
  books: number[];            // books of the poem where it appears (empty = not tied to a book)
  minZoom: number;
  reveals?: number;           // hidden until the reader reaches this book (25 = after the poem)
  side?: Side; certainty?: Certainty; anchor?: Anchor;
  theme?: string;             // theme id for theme items and lines
  parent?: string;            // place id for alternative locations
  altIndex?: number;
  pts?: LonLat[];             // for lines
  color?: string;
}

// ---- reading aids
/** Whose side a person is on, for colour and grouping. */
export type Group = 'house' | 'suitors' | 'hosts' | 'wander';
export interface TreeNode { n: string; w?: string; at?: string; c?: TreeNode[] }
export interface People { gods: { id: string; side: 'for' | 'against' | 'other'; reveals?: number }[]; families: { id: string; group: Group; tree: TreeNode; reveals?: number }[] }
/** A stretch of days in the poem. `parts` are [book, first line, last line]. */
export interface DayBlock { id: string; days: number; kind: 'home' | 'away' | 'sea'; parts: [number, number, number][] }
export interface ModernPlace { id: string; lat: number; lon: number; kind: 'city' | 'country' }
export interface HeroInfo { id: string; group: Group; home: string; father?: string; mother?: string; patrons?: string[]; family?: string; reveals?: number }
