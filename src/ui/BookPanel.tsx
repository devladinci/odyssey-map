// Reader mode: one book of the poem, scene by scene.
import { BOOKS, DAYS, DAY_COUNT, ITEMS, LAST_BOOK, itemsOfBook, scenesOf } from '../content';
import { fmtLines, t } from '../i18n';
import { unlocked } from '../map/features';
import { useState } from 'preact/hooks';
import { WHOLE_POEM, book, bookDone, closeBook, openBook, panel, peek, progress, reached, replay, sceneIx, seen, sel, setProgress, texts } from '../state';
import { ItemRow } from './bits';

export function stepScene(d: number) {
  const b = book.value; if (!b) return;
  const n = scenesOf(b).length, i = sceneIx.value + d;
  if (i >= -1 && i < n) { sel.value = null; panel.value = 'book'; sceneIx.value = i; }
}

function BookNav({ b }: { b: number }) {
  return (
    <div class="booknav">
      <button type="button" class="btn sm" style={{ visibility: b <= 1 ? 'hidden' : 'visible' }} onClick={() => openBook(b - 1)}>‹ {t('book', { n: b - 1 })}</button>
      <span class="eyebrow">{t('book', { n: b })}</span>
      <button type="button" class="btn sm" style={{ visibility: b >= LAST_BOOK ? 'hidden' : 'visible' }} onClick={() => openBook(b + 1)}>{t('book', { n: b + 1 })} ›</button>
      <button type="button" class="clearlink" onClick={closeBook}>× {t('leaveBook')}</button>
    </div>
  );
}

/** Where this book, or this scene, sits in the forty-one days of the poem. Days at sea are blue, days away from Ithaca are green. */
function DaysStrip({ b, line }: { b: number; line?: number }) {
  const R = texts.value!.reader;
  let n = 0;
  const cells = DAYS.map(d => {
    const from = n + 1; n += d.days;
    return { d, from, to: n, cur: d.parts.some(([pb, f, l]) => pb === b && (line == null || (line >= f && line <= l))) };
  });
  const cur = cells.filter(c => c.cur);
  const label = (c: (typeof cells)[number]) => (seen(c.d.parts[0][0]) || peek.value === c.d.parts[0][0] ? R.days[c.d.id] : '· · ·');
  if (!cur.length) return null;
  const a = cur[0].from, z = cur[cur.length - 1].to;
  return (
    <div class="days" title={R.daysNote}>
      <div class="days-bar" aria-hidden="true">{cells.map(c => <i class={c.d.kind + (c.cur ? ' cur' : '')} style={{ flexGrow: c.d.days }} />)}</div>
      <div class="days-cap">{a === z ? t('dayOf', { a, n: DAY_COUNT }) : t('daysSpan', { a, b: z, n: DAY_COUNT })} · {cur.map(label).filter((x, i, all) => all.indexOf(x) === i).join(' → ')}</div>
    </div>
  );
}

export function BookPanel() {
  const T = texts.value!, b = book.value!, ix = sceneIx.value;
  const info = T.story.books[b], scenes = scenesOf(b);
  const p = progress.value ?? 0;
  const visible = seen(b) || peek.value === b;
  const [shown, setShown] = useState<number | null>(null);

  if (!visible) {
    return (
      <div key={'gate' + b}>
        <BookNav b={b} />
        <h2 class="muted-title">{t('book', { n: b })} <small>({t('hiddenTitle')})</small></h2>
        <p>{t('beyond')}</p>
        <p class="small">{p > 0 ? t('bookmarkAt', { n: p }) : null}</p>
        <div class="actions">
          <button type="button" class="btn primary" onClick={() => setProgress(b)}>{t('moveBookmark')}</button>
          <button type="button" class="btn" onClick={() => { peek.value = b; }}>{t('peek')}</button>
        </div>
      </div>
    );
  }

  const sc = ix >= 0 ? scenes[ix] : null;
  const st = sc ? T.scenes.scenes[sc.id] : null;
  const canSee = (n: number) => seen(n) || peek.value === n;
  const places = itemsOfBook(b).filter(id => ITEMS[id] && unlocked(ITEMS[id], canSee));
  // A place that is still hidden from this reader is not listed, even if the scene names it.
  const listed = (list?: string[]) => (list || []).filter(id => !ITEMS[id] || unlocked(ITEMS[id], canSee));
  const here = listed(sc?.at), told = listed(sc?.mentions);
  const last = sc && ix === scenes.length - 1;
  const open = bookDone(b) || shown === b || !scenes.length;      // title and summary tell the whole book
  const upTo = b < p ? scenes.length : reached.value[b] ?? -1;     // scene titles the reader has earned
  const resume = b < p ? 0 : Math.max(0, Math.min(reached.value[b] ?? 0, scenes.length - 1));   // where to pick up again

  return (
    <div key={'book' + b}>
      <BookNav b={b} />
      <DaysStrip b={b} line={sc?.from} />
      <h2>{open ? info.title : t('book', { n: b })}</h2>

      {sc && st ? (
        <div class="scene" key={sc.id}>
          <div class="scene-meta">{t('scene', { i: ix + 1, n: scenes.length })} · {fmtLines(sc.from, sc.to)}</div>
          <h3>{st.title}</h3>
          <p>{st.text}</p>
          {here.length ? <div class="scene-at"><h4>{t('action')}</h4>{here.map(id => <ItemRow id={id} />)}</div> : null}
          {told.length ? <div class="scene-at soft"><h4>{t('mentioned')}</h4>{told.map(id => <ItemRow id={id} />)}</div> : null}
          <div class="stepper">
            <button type="button" class="btn" onClick={() => stepScene(-1)}>‹ {ix === 0 ? t('overview') : t('prev')}</button>
            {sc.path ? <button type="button" class="btn icon" title={t('replay')} aria-label={t('replay')} onClick={() => replay.value++}>▶</button> : null}
            {!last ? <button type="button" class="btn primary" onClick={() => stepScene(1)}>{t('next')} ›</button>
              : b < LAST_BOOK ? <button type="button" class="btn primary" onClick={() => { if (p === b) setProgress(b + 1); openBook(b + 1); }}>{t('nextBook', { n: b + 1 })} ›</button>
              : <button type="button" class="btn primary" onClick={() => setProgress(WHOLE_POEM)}>✓</button>}
          </div>
          {last && p === b && b < LAST_BOOK ? <p class="small">{t('willMove', { n: b + 1 })}</p> : null}
        </div>
      ) : (
        <>
          {open ? <p>{info.summary}</p> : <p class="small">{t('summaryNote')}</p>}
          <div class="actions">
            {scenes.length ? <button type="button" class="btn primary" onClick={() => { sceneIx.value = resume; }}>▶ {resume > 0 ? t('scene', { i: resume + 1, n: scenes.length }) : t('startScenes')}</button> : null}
            {!open ? <button type="button" class="btn" onClick={() => setShown(b)}>{t('showSummary')}</button> : null}
          </div>
          {!scenes.length ? <p class="small">{t('noScenes')}</p> : null}
        </>
      )}

      {scenes.length ? (
        <>
          <h4>{t('scenes')}</h4>
          <ol class="scenelist">
            {scenes.map((s, i) => (
              <li><button type="button" class={i === ix ? 'on' : ''} aria-current={i === ix} onClick={() => { sceneIx.value = i; }}>
                <span class={i <= upTo ? '' : 'veiled'}>{i <= upTo ? T.scenes.scenes[s.id]?.title : t('sceneN', { n: i + 1 })}</span><small>{s.from}–{s.to}</small>
              </button></li>
            ))}
          </ol>
        </>
      ) : null}

      {!sc && places.length ? <><h4>{t('placesHere')}</h4>{places.map(id => <ItemRow id={id} />)}</> : null}

      <div class="actions foot">
        {p !== b && p < WHOLE_POEM ? <button type="button" class="btn sm" onClick={() => setProgress(b)}>🔖 {t('moveBookmark')}</button> : null}
        <button type="button" class="btn sm" onClick={() => { panel.value = 'books'; }}>{t('otherBook')}</button>
        <button type="button" class="btn sm" onClick={closeBook}>{t('leaveBook')}</button>
      </div>
    </div>
  );
}

export function BookPicker() {
  const T = texts.value!, p = progress.value ?? 0;
  return (
    <div>
      <div class="tags"><span class="tag s-event">{t('books')}</span></div>
      <h2>{t('pickBook')}</h2>
      <p>{t('pickBookText')}</p>
      <div class="bookgrid">
        {BOOKS.map(B => (
          <button type="button" class={(B.book === book.value ? 'on ' : '') + (B.book === p ? 'mark ' : '') + (seen(B.book) ? '' : 'locked')}
            title={bookDone(B.book) ? T.story.books[B.book].title : t('hiddenTitle')} onClick={() => openBook(B.book)}>{B.book}</button>
        ))}
      </div>
      <label class="bookmark">
        <span>🔖 {t('bookmark')}</span>
        <select value={String(p || 1)} onChange={e => setProgress(+(e.currentTarget as HTMLSelectElement).value)}>
          {BOOKS.map(B => <option value={String(B.book)}>{t('book', { n: B.book })}</option>)}
          <option value={String(WHOLE_POEM)}>{t('readAll')}</option>
        </select>
      </label>
      <ol class="booklist">
        {BOOKS.map(B => (
          <li class={seen(B.book) ? '' : 'locked'}>
            <button type="button" onClick={() => openBook(B.book)}>
              <b>{B.book}</b>
              {bookDone(B.book) ? <span><strong>{T.story.books[B.book].title}</strong><small>{T.story.books[B.book].summary}</small></span> : <span class="dots">{B.book === p ? '🔖' : '· · ·'}</span>}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
