// The frame around the map: title, chips, map buttons and the panel.
import { useEffect, useRef } from 'preact/hooks';
import { t } from '../i18n';
import { resetNorth, zoomBy } from '../map/mapview';
import * as S from '../state';
import { BookPanel, BookPicker, stepScene } from './BookPanel';
import { Chip, FilterChip } from './bits';
import { ItemCard } from './ItemCard';
import { Heroes, Intro, Legend, Onboard, ThemePanel, ThemePicker } from './panels';
import { Search } from './Search';

function PanelBody() {
  switch (S.panel.value) {
    case 'onboard': return <Onboard />;
    case 'intro': return <Intro />;
    case 'item': return S.sel.value ? <ItemCard /> : null;
    case 'book': return S.book.value ? <BookPanel /> : <BookPicker />;
    case 'books': return <BookPicker />;
    case 'themes': return <ThemePicker />;
    case 'theme': return S.theme.value ? <ThemePanel /> : <ThemePicker />;
    case 'heroes': return <Heroes />;
    case 'legend': return <Legend />;
    default: return null;
  }
}

export function App() {
  const T = S.texts.value;
  const body = useRef<HTMLDivElement>(null);
  const chips = useRef<HTMLElement>(null);
  const open = S.panel.value !== 'none';
  const b = S.book.value, th = S.theme.value, p = S.progress.value;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName || '');
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); S.searchOpen.value = true; }
      else if (e.key === 'Escape') {
        if (S.searchOpen.value) S.searchOpen.value = false;
        else if (S.panel.value !== 'none') S.closePanel();
        else if (S.book.value) S.closeBook();
        else if (S.theme.value) S.closeTheme();
      }
      else if (!typing && S.book.value && S.panel.value === 'book' && !S.searchOpen.value) {
        if (e.key === 'ArrowRight') stepScene(1); else if (e.key === 'ArrowLeft') stepScene(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { document.title = t('title'); }, [S.lang.value]);
  useEffect(() => { chips.current?.scrollTo({ left: 0 }); }, [S.book.value, S.theme.value]);
  useEffect(() => { document.body.classList.toggle('panel-open', open); }, [open]);
  useEffect(() => { if (body.current) body.current.scrollTop = 0; }, [S.panel.value, S.sel.value, S.book.value, S.sceneIx.value, S.theme.value, S.tourIx.value]);

  if (!T) return <div class="loading">{t('loading')}</div>;

  const toggle = (name: S.Panel) => { S.sel.value = null; S.panel.value = S.panel.value === name ? 'none' : name; };
  const reader = () => {
    if (b) return toggle('book');
    if (p && p < S.WHOLE_POEM) return S.openBook(p);
    toggle('books');
  };

  const bookChip = b
    ? <FilterChip onOpen={() => toggle('book')} onClear={S.closeBook} clearLabel={t('leaveBook')}>📖 {t('book', { n: b })}</FilterChip>
    : <Chip onClick={reader}>📖 {p && p < S.WHOLE_POEM ? t('reading', { n: p }) : t('books')}</Chip>;
  const themeChip = th
    ? <FilterChip onOpen={() => toggle('theme')} onClear={S.closeTheme} clearLabel={t('themeOff')}><span class="clip">{T.themes[th].name}</span> ✦</FilterChip>
    : <Chip onClick={() => toggle('themes')}>{t('themes')} ✦</Chip>;

  return (
    <>
      <header class="top">
        <div class="brand">
          <h1>{t('title')}</h1>
          <span class="when">{t('subtitle')}</span>
          <span class="grow" />
          <button type="button" class="round" aria-label={t('search')} title={t('search')} onClick={() => { S.searchOpen.value = true; }}>⌕</button>
          <button type="button" class="round lang" aria-label={t('lang')} title={t('lang')} onClick={() => { S.lang.value = S.lang.value === 'bg' ? 'en' : 'bg'; }}>{t('langCode')}</button>
        </div>
        <nav class="chips" aria-label={t('title')} ref={chips}>
          {/* An active filter comes first and carries its own off switch, so it can always be cleared. */}
          {b ? bookChip : null}
          {th ? themeChip : null}
          {b || th ? <span class="sep" /> : null}
          <Chip on={S.view.value === 'ithaca'} onClick={() => S.setView('ithaca')}>{t('vIthaca')}</Chip>
          <Chip on={S.view.value === 'greece'} onClick={() => S.setView('greece')}>{t('vGreece')}</Chip>
          <Chip on={S.view.value === 'all'} onClick={() => S.setView('all')}>{t('vAll')}</Chip>
          <span class="sep" />
          {b ? null : bookChip}
          {th ? null : themeChip}
          <Chip on={S.modern.value} label={t('todayHint')} onClick={() => { S.modern.value = !S.modern.value; }}>{t('today')}</Chip>
          <Chip tool onClick={() => toggle('heroes')}>{t('heroes')}</Chip>
          <Chip tool onClick={() => toggle('legend')}>{t('legend')}</Chip>
        </nav>
      </header>

      <div class="mapbtns">
        <button type="button" aria-label={t('zoomIn')} title={t('zoomIn')} onClick={() => zoomBy(1)}>+</button>
        <button type="button" aria-label={t('zoomOut')} title={t('zoomOut')} onClick={() => zoomBy(-1)}>−</button>
        <button type="button" class={S.tilt.value ? 'on' : ''} aria-pressed={S.tilt.value} aria-label={t('tilt')} title={S.tilt.value ? t('tiltOn') : t('tilt')} onClick={() => { S.tilt.value = !S.tilt.value; }}>3D</button>
        <button type="button" aria-label={t('north')} title={t('north')} onClick={resetNorth}>N</button>
      </div>

      <aside class={'sheet' + (open ? '' : ' closed')} aria-hidden={!open}>
        <button type="button" class="x" aria-label={t('close')} onClick={S.closePanel}>×</button>
        <div class="sheet-body" ref={body}><PanelBody /></div>
      </aside>

      <Search />
    </>
  );
}
