// The card for one thing on the map: a place, an event, a route, a dig and so on.
import type { ComponentChildren } from 'preact';
import { HERO, ITEMS, PLACE, ROUTES, SCENES, THEME, nameOf, scenesOf } from '../content';
import { fmtRef, t } from '../i18n';
import { backFromItem, book, openBook, openItem, peek, replay, sceneSeen, seen, sel, texts, theme } from '../state';
import { CoastToggle } from './panels';
import { lookFrom } from '../map/mapview';
import type { Note, Ref } from '../types';
import { CertTag, GROUP_KEY, ItemRow, Rich } from './bits';

function Refs({ refs }: { refs: Ref[] }) {
  if (!refs.length) return null;
  return (
    <div class="refs">
      <h4>{t('inPoem')}</h4>
      <div class="chips-wrap">
        {refs.map(r => r.il
          ? <span class="ref">{fmtRef(r)}</span>
          : <button type="button" class="ref" onClick={() => openBook(r.b)}>{fmtRef(r)}</button>)}
      </div>
    </div>
  );
}
const Loc = ({ text }: { text?: string }) => (text ? <div class="locbox"><b>{t('howSure')}:</b> <Rich text={text} /></div> : null);
const Head = ({ tags, name, sub }: { tags: ComponentChildren; name: string; sub?: ComponentChildren }) => (
  <>
    <div class="tags">{tags}</div>
    <h2>{name}</h2>
    {sub ? <p class="sub">{sub}</p> : null}
  </>
);
const join = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(' · ');

function NoteCard({ kind, n, books }: { kind: string; n: Note; books?: number[] }) {
  return (
    <>
      <Head tags={<span class="tag">{kind}</span>} name={n.name} sub={n.note} />
      <p><Rich text={n.text} /></p>
      {n.src ? <p class="small"><b>{t('source')}:</b> {n.src}</p> : null}
      <Loc text={n.loc} />
      {books?.length ? <Refs refs={books.map(b => ({ b }))} /> : null}
    </>
  );
}

export function ItemCard() {
  const T = texts.value!, id = sel.value!;
  const from = book.value ? t('book', { n: book.value }) : theme.value ? T.themes[theme.value]?.name : null;
  const back = from ? <button type="button" class="backlink" onClick={backFromItem}>‹ {from}</button> : null;
  return <div key={id}>{back}<Body id={id} /></div>;
}

function Body({ id }: { id: string }) {
  const T = texts.value!;
  if (id.startsWith('ov:')) {
    const n = T.story.overlays[id.slice(3)];
    return n ? <><NoteCard kind={t('overlay')} n={n} /><p class="small">{t('coastNote')}</p><CoastToggle /></> : null;
  }
  if (id.startsWith('hero:')) return <HeroCard id={id.slice(5)} />;
  const it = ITEMS[id];
  if (!it) return null;

  switch (it.kind) {
    case 'place': {
      const p = PLACE[id], x = T.places[id];
      const dig = T.extra.digNotes[id];
      return (
        <>
          <Head tags={<><span class={'tag s-' + p.side}>{t(p.side)}</span><CertTag c={p.certainty} /></>} name={x.name} sub={join(p.greek, x.note)} />
          {p.suitors ? <p class="ships">{t('suitors', { n: p.suitors })}</p> : null}
          {p.height ? <p><button type="button" class="btn sm" onClick={() => lookFrom(p.lon, p.lat, p.height!)}>👁 {t('lookFrom')}</button> <span class="small">{p.height} m</span></p> : null}
          {x.heroes?.length ? (
            <div class="heroes"><h4>{t('people')}</h4>
              <ul>{x.heroes.map(h => <li><b>{h.name}</b>{h.role ? <> — <Rich text={h.role} /></> : null}</li>)}</ul>
            </div>) : null}
          <p><Rich text={x.text} /></p>
          <Loc text={x.loc} />
          {dig ? <div class="locbox dig"><b>{t('digHere')}:</b> <Rich text={dig} /></div> : null}
          <Refs refs={p.refs} />
          {x.refNote ? <p class="small">{x.refNote}</p> : null}
          {p.alts?.length ? <div><h4>{t('alts')}</h4>{p.alts.map((_, i) => <ItemRow id={`${id}~${i}`} />)}</div> : null}
        </>
      );
    }
    case 'alt': return (
      <>
        <Head tags={<><span class="tag">{t('alt')}</span><CertTag c={3} /></>} name={nameOf(id, T)} />
        <p>{t('altOf')} <button type="button" class="link" onClick={() => openItem(it.parent!)}>{nameOf(it.parent!, T)}</button>.</p>
        <Loc text={T.places[it.parent!]?.loc} />
      </>
    );
    case 'event': {
      const n = T.story.events[id];
      return (
        <>
          <Head tags={<><span class="tag s-event">{t('event')}</span><CertTag c={it.certainty!} /></>} name={n.name} sub={n.note} />
          <p><Rich text={n.text} /></p>
          <Loc text={n.loc} />
          <Refs refs={it.books.map(b => ({ b }))} />
        </>
      );
    }
    case 'route': {
      const n = T.story.routes[id], r = ROUTES.find(x => x.id === id)!;
      return (
        <>
          <Head tags={<><span class="tag" style={{ color: r.color, borderColor: r.color }}>{t('route')}</span><CertTag c={r.certainty} /></>} name={n.name} />
          <p><Rich text={n.text} /></p>
          <p><button type="button" class="btn" onClick={() => { replay.value++; }}>▶ {t('replay')}</button></p>
          <Loc text={n.loc} />
          <Refs refs={r.books.map(b => ({ b }))} />
        </>
      );
    }
    case 'dig': return <NoteCard kind={t('dig')} n={T.extra.digs[id]} />;
    case 'titem': case 'tline': {
      const th = T.themes[it.theme!], n = (it.kind === 'titem' ? th.items : th.lines)?.[id];
      return n ? <NoteCard kind={th.name} n={n} books={it.books} /> : null;
    }
    case 'point': return <Head tags={<><span class="tag">{t('point')}</span>{it.certainty ? <CertTag c={it.certainty} /> : null}</>} name={nameOf(id, T)} />;
    default: return null;
  }
}
export const themeColor = (id: string) => THEME[id]?.color;

/** Who a hero is, and the scenes read so far in which the name comes up. */
function HeroCard({ id }: { id: string }) {
  const T = texts.value!, h = HERO[id], R = T.reader;
  if (!h || (h.reveals && !(seen(h.reveals) || peek.value === h.reveals))) return null;
  const x = R.heroes[id], N = R.names;
  // The name must stand as a whole word: "Arete" is not "Aretus", and "Ир" is not part of "мир".
  const letter = /\p{L}/u;
  const has = (s: string) => x.find.some(w => { for (let i = s.indexOf(w); i >= 0; i = s.indexOf(w, i + 1)) if (!letter.test(s[i - 1] || '') && !letter.test(s[i + w.length] || '')) return true; return false; });
  const hits = SCENES.filter(s => { const st = T.scenes.scenes[s.id]; return st && sceneSeen(s.book, scenesOf(s.book).indexOf(s)) && has(st.title + ' ' + st.text); });
  const books = [...new Set(hits.map(s => s.book))];
  return (
    <>
      <div class="tags"><span class={'tag g-' + h.group}>{t(GROUP_KEY[h.group])}</span><span class="tag">{t('hero')}</span></div>
      <h2>{N[id]}</h2>
      <p><Rich text={x.about} /></p>
      <dl class="facts">
        {h.father ? <><dt>{t('father')}</dt><dd>{N[h.father]}</dd></> : null}
        {h.mother ? <><dt>{t('mother')}</dt><dd>{N[h.mother]}</dd></> : null}
        {h.patrons?.length ? <><dt>{t('patrons')}</dt><dd>{h.patrons.map(g => N[g]).join(', ')}</dd></> : null}
        {h.family ? <><dt>{t('family')}</dt><dd>{R.families[h.family].name}</dd></> : null}
      </dl>
      <h4>{t('homeOf')}</h4>
      <ItemRow id={h.home} />
      <h4>{t('inScenes')}</h4>
      {books.length ? books.map(b => (
        <p class="herobook"><span>{t('book', { n: b })}</span>
          {hits.filter(s => s.book === b).map(s => <button type="button" class="ref" title={T.scenes.scenes[s.id].title} onClick={() => openBook(b, scenesOf(b).indexOf(s))}>{s.id.split('.')[1]}</button>)}
        </p>
      )) : <p class="small">{t('notYet')}</p>}
    </>
  );
}
