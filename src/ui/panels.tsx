// The simpler panels: first visit, intro, legend, people, themes.
import { useState } from 'preact/hooks';
import { BOOKS, DIGS, HERO, HEROES, ITEMS, PEOPLE, PLACES, ROUTES, THEME, THEMES } from '../content';
import type { Group, TreeNode } from '../types';
import { t } from '../i18n';
import { unlocked } from '../map/features';
import { WHOLE_POEM, closeTheme, coast, lang, openBook, openItem, openTheme, panel, peek, progress, seen, setProgress, setView, texts, theme, tourIx } from '../state';
import { GROUP_KEY, Ico, ItemRow, Rich, plain } from './bits';

const canSee = (n: number) => seen(n) || peek.value === n;

/** Slides between the coast of about 1200 BC and the coast of today. */
export function CoastToggle() {
  const run = () => {
    const from = coast.value, to = from > 50 ? 0 : 100, t0 = performance.now();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { coast.value = to; return; }
    const step = (now: number) => { const k = Math.min(1, (now - t0) / 2600); coast.value = Math.round(from + (to - from) * k); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  return (
    <div class="coast">
      <div class="coast-row">
        <span>{t('coastNow')}</span>
        <input type="range" min="0" max="100" step="1" value={coast.value} aria-label={t('coast')} onInput={e => { coast.value = +(e.currentTarget as HTMLInputElement).value; }} />
        <span>{t('coastThen')}</span>
        <button type="button" class="btn icon sm" title={t('coastPlay')} aria-label={t('coastPlay')} onClick={run}>▶</button>
      </div>
      <p class="small">{t('coastBlend')}</p>
    </div>
  );
}

export function Onboard() {
  return (
    <div>
      <h2>{t('onboardTitle')}</h2>
      <p>{t('onboardText')}</p>
      <div class="bookgrid">
        {BOOKS.map(B => <button type="button" onClick={() => { setProgress(B.book); openBook(B.book); }}>{B.book}</button>)}
      </div>
      <div class="actions">
        <button type="button" class="btn" onClick={() => { setProgress(WHOLE_POEM); panel.value = 'intro'; }}>{t('readAll')}</button>
      </div>
      <p class="small">{t('changeLater')}</p>
    </div>
  );
}

function ReadButton() {
  const p = progress.value;
  return p && p < WHOLE_POEM
    ? <button type="button" class="btn primary" onClick={() => openBook(p)}>📖 {t('reading', { n: p })}</button>
    : <button type="button" class="btn primary" onClick={() => { panel.value = 'books'; }}>📖 {t('books')}</button>;
}

export function Intro() {
  return (
    <div>
      <h2>{t('introTitle')}</h2>
      <p>{t('introText')}</p>
      <LegendMarks />
      <p>{t('introWander')}</p>
      <div class="actions">
        <ReadButton />
        <button type="button" class="btn" onClick={() => { panel.value = 'themes'; }}>{t('themes')} ✦</button>
        <button type="button" class="btn" onClick={() => { panel.value = 'heroes'; }}>{t('peopleTitle')}</button>
        <button type="button" class="btn" onClick={() => setView('ithaca')}>{t('vIthaca')}</button>
        <button type="button" class="btn" onClick={() => setView('all')}>{t('vAll')}</button>
      </div>
    </div>
  );
}

function LegendMarks() {
  const row = (icon: string, label: string) => <li><Ico name={icon} size={20} /> {label}</li>;
  return (
    <ul class="marks">
      {row('hom-1', t('home'))}{row('wan-3', t('wander'))}{row('sto-1', t('story'))}{row('evt', t('event'))}
      {row('hom-1', t('c1'))}{row('hom-2', t('c2'))}{row('hom-3', t('c3'))}{row('alt', t('alt'))}
    </ul>
  );
}

export function Legend() {
  return (
    <div>
      <h2>{t('legendTitle')}</h2>
      <LegendMarks />
      <p>{t('legendShape')}</p>
      <p>{t('legendFill')}</p>
      <p class="small">{t('schematic')}</p>
      <h4>{t('coast')}</h4>
      <CoastToggle />
      <p class="small">{t('coastNote')}</p>
      <h4>{t('credits')}</h4>
      <p class="small">{t('creditsText')}</p>
      <p class="small">
        <a class="link" href="https://github.com/devladinci/odyssey-map/blob/main/ATTRIBUTION.md" target="_blank" rel="noopener">{t('creditsAll')}</a> · <a class="link" href="https://github.com/devladinci/odyssey-map" target="_blank" rel="noopener">{t('sourceCode')}</a> · <a class="link" href="https://devladinci.github.io/iliad-map/" target="_blank" rel="noopener">{t('sister')}</a>
      </p>
      <div class="actions">
        <button type="button" class="btn sm" onClick={() => { lang.value = lang.value === 'bg' ? 'en' : 'bg'; }}>🌐 {t('lang')}</button>
      </div>
    </div>
  );
}

const GROUPS: Group[] = ['house', 'suitors', 'hosts', 'wander'];

function HeroList() {
  const T = texts.value!;
  const [q, setQ] = useState('');
  const open = HEROES.filter(h => !h.reveals || canSee(h.reveals));
  const list = PLACES.filter(p => unlocked(ITEMS[p.id], canSee)).flatMap(p => (T.places[p.id].heroes || []).map(h => ({ ...h, place: p.id, side: p.side })));
  const needle = q.trim().toLowerCase();
  const shown = needle ? list.filter(h => h.name.toLowerCase().includes(needle) || T.places[h.place].name.toLowerCase().includes(needle)) : list;
  return (
    <div>
      {GROUPS.map(g => {
        const mine = open.filter(h => h.group === g);
        return mine.length ? (
          <section>
            <h4 class={'g-' + g}>{t(GROUP_KEY[g])}</h4>
            <div class="chips-wrap">{mine.map(h => <button type="button" class={'ref g-' + g} onClick={() => openItem('hero:' + h.id)}>{T.reader.names[h.id]}</button>)}</div>
          </section>
        ) : null;
      })}
      {open.length < HEROES.length ? <p class="small">{t('hiddenItems', { n: HEROES.length - open.length })}</p> : null}
      <h4>{t('everyone')}</h4>
      <input class="field" type="search" placeholder={t('heroesFilter')} value={q} onInput={e => setQ((e.currentTarget as HTMLInputElement).value)} />
      <div class="herolist">
        {shown.map(h => <ItemRow id={h.place} sub={<><b class={'side-' + h.side}>{h.name}</b>{h.role && plain(h.role) ? ' — ' + plain(h.role) : ''}</>} />)}
      </div>
    </div>
  );
}

export function ThemePicker({ title = true }: { title?: boolean }) {
  const T = texts.value!;
  return (
    <div>
      {title ? <h2>{t('themes')}</h2> : <h4>{t('otherThemes')}</h4>}
      <div class="themelist">
        {THEMES.filter(th => th.id !== theme.value).map(th => (
          <button type="button" class="themecard" onClick={() => openTheme(th.id)}>
            <i style={{ background: th.color }} />
            <span><b>{T.themes[th.id].name}</b><small>{T.themes[th.id].sub}</small></span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThemePanel() {
  const T = texts.value!, id = theme.value!, th = THEME[id], x = T.themes[id];
  let ids: string[] = [...(th.items || []).map(i => i.id), ...(th.lines || []).map(l => l.id)];
  if (th.builtin === 'routes') ids = ROUTES.map(r => r.id);
  if (th.builtin === 'digs') ids = DIGS.map(d => d.id);
  if (th.builtin === 'realms') ids = PLACES.filter(p => p.flags?.includes('realm')).map(p => p.id);
  const open = ids.filter(i => unlocked(ITEMS[i], canSee));
  const hiddenN = ids.length - open.length;
  // A tour steps through the stops the reader may already see.
  const stops = th.tour ? (th.items || []).filter(i => unlocked(ITEMS[i.id], canSee)) : [];
  const ix = Math.min(tourIx.value, stops.length - 1);
  const stop = stops.length ? stops[ix] : null;
  const stopText = stop ? x.items?.[stop.id] : null;

  return (
    <div key={id}>
      <div class="tags"><span class="tag" style={{ color: th.color, borderColor: th.color }}>{t('theme')}</span><button type="button" class="clearlink" onClick={closeTheme}>× {t('themeOff')}</button></div>
      <h2>{x.name}</h2>
      <p><Rich text={x.intro} /></p>
      {th.builtin === 'realms' ? <p class="small">{t('realmsHint')}</p> : null}

      {stop && stopText ? (
        <div class="scene">
          <div class="scene-meta">{t('stop', { i: ix + 1, n: stops.length })}</div>
          <h3>{stopText.name}</h3>
          <p><Rich text={stopText.text} /></p>
          {stopText.src ? <p class="small"><b>{t('source')}:</b> {stopText.src}</p> : null}
          {stop.coast ? <CoastToggle /> : null}
          <div class="stepper">
            <button type="button" class="btn" disabled={ix === 0} onClick={() => { tourIx.value = ix - 1; }}>‹ {t('prev')}</button>
            <button type="button" class="btn primary" disabled={ix >= stops.length - 1} onClick={() => { tourIx.value = ix + 1; }}>{t('next')} ›</button>
          </div>
        </div>
      ) : null}

      <div class="themeitems">
        {th.tour
          ? stops.map((s, n) => <button type="button" class={'row' + (n === ix ? ' on' : '')} onClick={() => { tourIx.value = n; }}><span class="num">{n + 1}</span><span class="row-t"><b>{x.items![s.id].name}</b></span></button>)
          : open.map(i => <ItemRow id={i} sub={th.builtin === 'realms' ? T.places[i].heroes![0].name : undefined} />)}
      </div>
      {hiddenN > 0 ? <p class="small">{t('hiddenItems', { n: hiddenN })}</p> : null}
      <div class="actions foot"><button type="button" class="btn sm" onClick={closeTheme}>{t('themeOff')}</button></div>
      <ThemePicker title={false} />
    </div>
  );
}

// ---- people: characters, gods and families
function Tree({ node }: { node: TreeNode }) {
  const N = texts.value!.reader.names;
  const name = N[node.n] || node.n;
  const h = HERO[node.n], heroOpen = h && (!h.reveals || canSee(h.reveals));
  return (
    <li>
      <span class="node">
        {heroOpen ? <button type="button" class="link" onClick={() => openItem('hero:' + node.n)}>● {name}</button>
          : node.at && ITEMS[node.at] && unlocked(ITEMS[node.at], canSee) ? <button type="button" class="link" onClick={() => openItem(node.at!)}>● {name}</button> : <b>{name}</b>}
        {node.w ? <small> ∞ {N[node.w] || node.w}</small> : null}
      </span>
      {node.c?.length ? <ul>{node.c.map(c => <Tree node={c} />)}</ul> : null}
    </li>
  );
}

function Families() {
  const R = texts.value!.reader;
  return (
    <div>
      <p class="small">{R.familiesIntro}</p>
      {PEOPLE.families.filter(f => !f.reveals || canSee(f.reveals)).map(f => (
        <section class="family">
          <h3 class={'g-' + f.group}>{R.families[f.id].name}</h3>
          <ul class="tree"><Tree node={f.tree} /></ul>
          <p class="small"><Rich text={R.families[f.id].note} /></p>
        </section>
      ))}
    </div>
  );
}

function Gods() {
  const R = texts.value!.reader;
  const group = (side: string, title: string) => (
    <section>
      <h4>{title}</h4>
      <ul class="gods">{PEOPLE.gods.filter(g => g.side === side && (!g.reveals || canSee(g.reveals))).map(g => <li><b class={'god-' + side}>{R.names[g.id]}</b> — <Rich text={R.gods[g.id]} /></li>)}</ul>
    </section>
  );
  return <div>{group('for', t('godsFor'))}{group('against', t('godsAgainst'))}{group('other', t('godsOther'))}<p class="small">{R.godsIntro}</p></div>;
}

export function Heroes() {
  const [tab, setTab] = useState<'heroes' | 'gods' | 'families'>('heroes');
  const tabs = [['heroes', t('tabHeroes')], ['gods', t('tabGods')], ['families', t('tabFamilies')]] as const;
  return (
    <div>
      <h2>{t('peopleTitle')}</h2>
      <div class="seg" role="tablist">
        {tabs.map(([id, label]) => <button type="button" role="tab" aria-selected={tab === id} class={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </div>
      {tab === 'heroes' ? <HeroList /> : tab === 'gods' ? <Gods /> : <Families />}
    </div>
  );
}
