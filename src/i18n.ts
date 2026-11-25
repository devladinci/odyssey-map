// Interface words in each language, and the small rules that differ between languages.
import { lang } from './state';
import type { Lang, Ref } from './types';

const bg = {
  title: 'Картата на Одисея', subtitle: 'пътят към Итака',
  search: 'Търси човек или място', searchNone: 'Няма такова име на картата.', searchHint: 'Напиши име на герой, остров, град или събитие.',
  vIthaca: 'Итака', vGreece: 'Гърция', vAll: 'Цялото море',
  themes: 'Теми', books: 'Песни', heroes: 'Хора', legend: 'Легенда', close: 'Затвори', back: 'Назад',
  reading: 'Чета Песен {n}', startReading: 'Чета „Одисея“', book: 'Песен {n}', bookShort: 'Песен',
  home: 'Домове и царства', wander: 'Спирка от странстванията', story: 'Място от разказ или път', water: 'Морета и води',
  event: 'Място на действието', dig: 'Археология', alt: 'Друго възможно място',
  route: 'Път', overlay: 'Древен бряг и води', point: 'Място от разказа', theme: 'Тема',
  c1: 'Сигурно', c2: 'Приблизително', c3: 'Спорно или неизвестно',
  howSure: 'Точност', inPoem: 'В поемата', people: 'Хора', suitors: 'Женихи на Пенелопа оттук: {n}',
  alts: 'Други възможни места', altOf: 'Друго възможно място за', source: 'Източник',
  digHere: 'Какво е разкопано', iliad: '„Илиада“', lines: 'ст.', line: 'ст.',
  scene: 'Сцена {i} от {n}', scenes: 'Сцени', overview: 'Преглед', next: 'Напред', prev: 'Назад', replay: 'Пусни пътя отново',
  startScenes: 'Започни от първата сцена', placesHere: 'Места в тази песен', mentioned: 'Споменати', action: 'Действието е тук',
  nextBook: 'Към Песен {n}', otherBook: 'Друга песен', leaveBook: 'Затвори песента', noScenes: 'За тази песен още няма сцени.',
  bookmark: 'Отметка', bookmarkAt: 'Отметката ти е на Песен {n}', bookmarkAll: 'Прочел си цялата поема', moveBookmark: 'Премести отметката тук',
  beyond: 'Тази песен е след отметката ти. Картата я крие, за да не ти разкаже края.', peek: 'Покажи я въпреки това',
  willMove: 'Отметката ти ще се премести на Песен {n}.', showSummary: 'Покажи заглавието и резюмето', summaryNote: 'Резюмето разказва цялата песен, затова е скрито, докато я четеш.', sceneN: 'Сцена {n}', hiddenTitle: 'заглавието е скрито', pickBook: 'Избери песен',
  pickBookText: 'Картата показва местата и сцените на избраната песен. Останалото избледнява.',
  onboardTitle: 'Докъде си стигнал?', onboardText: 'Избери песента, която четеш. Картата ще крие всичко, което се случва по-нататък: и случките, и местата, до които Одисей още не е стигнал. Можеш да го смениш по всяко време.',
  readAll: 'Чел съм цялата поема', changeLater: 'Отметката се мести от „Песни“.',
  spoiler: 'Песен {n}', spoilerEnd: 'след края', spoilerTitle: 'Скрито, за да не разваля четенето. Докосни, за да го видиш.',
  introTitle: 'Светът на „Одисея“',
  introText: 'Докосни място или път. Формата и цветът показват какво е мястото, а запълването показва колко сигурно е то.',
  introWander: 'Спирките на странстванията стоят там, където ги е поставила по-късната традиция. Омир не казва къде са.',
  legendTitle: 'Как се чете картата', legendShape: 'Кръг = домове и царства, квадрат = спирка от странстванията, зелен кръг = място от разказ или път, лилав ромб = място на действието.',
  legendFill: 'Пълен знак = сигурно място. Наполовина = приблизително. Празен с въпросителна = спорно.',
  coast: 'Бряг и реки', coastThen: 'около 1200 пр.Хр.', coastNow: 'днес',
  coastNote: 'Сините зони с пунктир са суша днес, но са били вода около 1200 г. пр.Хр.',
  coastPlay: 'Пусни промяната', coastBlend: 'Плъзгачът само прелива едната карта в другата. Междинните положения не са отделни възстановки.',
  tilt: '3D релеф', tiltOn: 'Изглед отгоре', north: 'Север нагоре', zoomIn: 'Приближи', zoomOut: 'Отдалечи',
  themeOff: 'Изключи темата', otherThemes: 'Други теми', stop: 'Спирка {i} от {n}', hiddenItems: 'Още {n} са скрити до по-късна песен.',
  heroesFilter: 'Име на човек или място',
  peopleTitle: 'Хора и богове', tabHeroes: 'Хора', tabGods: 'Богове', tabFamilies: 'Родове', godsFor: 'На страната на Одисей', godsAgainst: 'Срещу него', godsOther: 'Други богове и богини',
  gHouse: 'Домът на Одисей', gSuitors: 'Женихите и хората им', gHosts: 'Царе и домакини', gWander: 'По пътя на странстванията',
  family: 'Род', father: 'Баща', mother: 'Майка', homeOf: 'Дом', patrons: 'Богове покровители', inScenes: 'В сцените, които си прочел', notYet: 'Още не се появява в прочетеното.', hero: 'Лице от поемата', everyone: 'Всички по места',
  dayOf: 'Ден {a} от {n}', daysSpan: 'Дни {a}–{b} от {n}', today: 'Днес', todayHint: 'Днешни градове и държави', lookFrom: 'Погледни оттук към двореца',
  credits: 'Източници', creditsText: 'Брегова линия: © участниците в OpenStreetMap (ODbL). Релеф: © Mapterhorn, по Copernicus DEM (© DLR, Airbus; предоставен от ЕС и ЕКА). Древни места: Pleiades (CC BY). Реки и днешни граници: Natural Earth. Номерата на стиховете са сверени с гръцкия текст в Perseus Digital Library. Текстовете са писани за тази карта и не цитират превод на поемата.',
  creditsAll: 'Всички източници и лицензи', sourceCode: 'Изходен код', sister: 'Картата на Илиада',
  schematic: 'Местата в Итака, пътищата и спирките на странстванията са схематични. Омир назовава местата, но не казва къде точно са.',
  lang: 'English', langCode: 'EN', loading: 'Зареждане…', realmsHint: 'Докосни област, за да видиш царя ѝ и как се е върнал от Троя.',
};

const en: typeof bg = {
  title: 'The Odyssey Map', subtitle: 'the way to Ithaca',
  search: 'Search a person or a place', searchNone: 'No such name on the map.', searchHint: 'Type the name of a hero, an island, a town or an event.',
  vIthaca: 'Ithaca', vGreece: 'Greece', vAll: 'The whole sea',
  themes: 'Themes', books: 'Books', heroes: 'People', legend: 'Legend', close: 'Close', back: 'Back',
  reading: 'Reading Book {n}', startReading: 'Reading the Odyssey', book: 'Book {n}', bookShort: 'Book',
  home: 'Homes and kingdoms', wander: 'Stop of the wanderings', story: 'Place in a tale or on a route', water: 'Seas and waters',
  event: 'Scene of the action', dig: 'Archaeology', alt: 'Other possible location',
  route: 'Journey', overlay: 'Ancient coast and waters', point: 'Place in the tale', theme: 'Theme',
  c1: 'Certain', c2: 'Approximate', c3: 'Disputed or unknown',
  howSure: 'How sure', inPoem: 'In the poem', people: 'People', suitors: 'Suitors of Penelope from here: {n}',
  alts: 'Other possible locations', altOf: 'Another possible location for', source: 'Source',
  digHere: 'What has been excavated', iliad: 'Iliad', lines: 'lines', line: 'line',
  scene: 'Scene {i} of {n}', scenes: 'Scenes', overview: 'Overview', next: 'Next', prev: 'Back', replay: 'Play the journey again',
  startScenes: 'Start with the first scene', placesHere: 'Places in this book', mentioned: 'Mentioned', action: 'The action is here',
  nextBook: 'On to Book {n}', otherBook: 'Another book', leaveBook: 'Close the book', noScenes: 'There are no scenes for this book yet.',
  bookmark: 'Bookmark', bookmarkAt: 'Your bookmark is at Book {n}', bookmarkAll: 'You have read the whole poem', moveBookmark: 'Move the bookmark here',
  beyond: 'This book is past your bookmark. The map keeps it hidden so it does not give the story away.', peek: 'Show it anyway',
  willMove: 'Your bookmark will move to Book {n}.', showSummary: 'Show the title and the summary', summaryNote: 'The summary tells the whole book, so it stays hidden while you read it.', sceneN: 'Scene {n}', hiddenTitle: 'title hidden', pickBook: 'Choose a book',
  pickBookText: 'The map shows the places and scenes of the book you choose. Everything else fades.',
  onboardTitle: 'How far have you read?', onboardText: 'Choose the book you are reading. The map will hide whatever comes later: the events, and the places Odysseus has not reached yet. You can change this at any time.',
  readAll: 'I have read the whole poem', changeLater: 'You can move the bookmark under “Books”.',
  spoiler: 'Book {n}', spoilerEnd: 'after the end', spoilerTitle: 'Hidden so it does not spoil your reading. Tap to see it.',
  introTitle: 'The world of the Odyssey',
  introText: 'Tap a place or a journey. Shape and colour show what kind of place it is. The filling shows how sure the location is.',
  introWander: 'The stops of the wanderings stand where later tradition put them. Homer does not say where they are.',
  legendTitle: 'How to read the map', legendShape: 'Circle = homes and kingdoms, square = stop of the wanderings, green circle = place in a tale or on a route, purple diamond = scene of the action.',
  legendFill: 'Full mark = certain location. Half = approximate. Hollow with a question mark = disputed.',
  coast: 'Coast and rivers', coastThen: 'around 1200 BC', coastNow: 'today',
  coastNote: 'The blue areas with a dotted edge are dry land today, but were water around 1200 BC.',
  coastPlay: 'Play the change', coastBlend: 'The slider only fades one map into the other. The positions in between are not separate reconstructions.',
  tilt: '3D relief', tiltOn: 'View from above', north: 'North up', zoomIn: 'Zoom in', zoomOut: 'Zoom out',
  themeOff: 'Turn the theme off', otherThemes: 'Other themes', stop: 'Stop {i} of {n}', hiddenItems: '{n} more are hidden until a later book.',
  heroesFilter: 'Name of a person or a place',
  peopleTitle: 'People and gods', tabHeroes: 'People', tabGods: 'Gods', tabFamilies: 'Families', godsFor: 'On Odysseus’ side', godsAgainst: 'Against him', godsOther: 'Other gods and goddesses',
  gHouse: 'The house of Odysseus', gSuitors: 'The suitors and their helpers', gHosts: 'Kings and hosts', gWander: 'On the wanderings',
  family: 'Family', father: 'Father', mother: 'Mother', homeOf: 'Home', patrons: 'Gods who help', inScenes: 'In the scenes you have read', notYet: 'Not in what you have read yet.', hero: 'Person in the poem', everyone: 'Everyone by place',
  dayOf: 'Day {a} of {n}', daysSpan: 'Days {a}–{b} of {n}', today: 'Today', todayHint: 'Modern towns and countries', lookFrom: 'Look towards the palace from here',
  credits: 'Sources', creditsText: 'Coastline: © OpenStreetMap contributors (ODbL). Relief: © Mapterhorn, from Copernicus DEM (© DLR, Airbus; provided by the EU and ESA). Ancient places: Pleiades (CC BY). Rivers and modern borders: Natural Earth. Line numbers were checked against the Greek text of the Perseus Digital Library. The texts were written for this map and quote no translation of the poem.',
  creditsAll: 'All sources and licences', sourceCode: 'Source code', sister: 'The Iliad Map',
  schematic: 'The sites on Ithaca, the routes and the stops of the wanderings are schematic. Homer names the places, but does not say where exactly they are.',
  lang: 'Български', langCode: 'БГ', loading: 'Loading…', realmsHint: 'Tap a region to see its king and how he came home from Troy.',
};

const UI: Record<Lang, typeof bg> = { bg, en };
export type Key = keyof typeof bg;

export function t(key: Key, vars?: Record<string, string | number>): string {
  let s = UI[lang.value][key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace('{' + k + '}', String(v));
  return s;
}
const range = (r: Ref) => (r.to ? `${r.from}–${r.to}` : String(r.from));

/** "Песен 2, ст. 494–510" or "Book 2, lines 494–510". */
export function fmtRef(r: Ref): string {
  if (r.il) return `${t('iliad')} ${r.b}${r.from ? '.' + range(r) : ''}`;
  if (!r.from) return t('book', { n: r.b });
  return `${t('book', { n: r.b })}, ${t(r.to ? 'lines' : 'line')} ${range(r)}`;
}
export const fmtLines = (from: number, to: number) => `${t('lines')} ${from}–${to}`;
