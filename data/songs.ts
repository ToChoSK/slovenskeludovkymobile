export type Region =
  | 'Západ'
  | 'Stred'
  | 'Východ'
  | 'Šariš'
  | 'Zemplín'
  | 'Spiš'
  | 'Liptov'
  | 'Orava'
  | 'Tekov'
  | 'Hont'
  | 'Gemer'
  | 'Pohronie';

export type Category =
  | 'Svadobné'
  | 'Tanečné'
  | 'Pastierske'
  | 'Ľúbostné'
  | 'Vojenské'
  | 'Salašnícke'
  | 'Detské'
  | 'Vinšovacie'
  | 'Rekrutské'
  | 'Balady';

export interface Song {
  id: string;
  title: string;
  region: Region;
  category: Category;
  tempo: 'Pomalé' | 'Stredné' | 'Rýchle';
  verses: string[];
  chorus?: string;
  description?: string;
}

export const songs: Song[] = [
  {
    id: '1',
    title: 'Tečie voda, tečie',
    region: 'Západ',
    category: 'Ľúbostné',
    tempo: 'Pomalé',
    description: 'Jedna z najznámejších slovenských ľudových piesní o láske a vernosti.',
    verses: [
      'Tečie voda, tečie,\ncez zelené lúčky,\nvzdychá dievča, vzdychá\npo svojom milučkom.',
      'Kde si, milý môj,\nkde si, drahý môj?\nUžito ťa niet pri mne,\nsmutno je mi bez teba.',
      'Vráť sa, milý, späť,\nvráť sa, drahý, späť,\nčakám na teba každý deň,\nako kvet čaká dážď.',
    ],
    chorus: 'Tečie voda, tečie,\ncez zelené lúčky,\ntečie moje srdce k tebe,\nk tebe, môj milý.',
  },
  {
    id: '2',
    title: 'Kopala studienku',
    region: 'Západ',
    category: 'Ľúbostné',
    tempo: 'Stredné',
    description: 'Stará slovenská ľudová pieseň o dievčine, ktorá čaká na svojho milého.',
    verses: [
      'Kopala studienku,\nstudienku pri ceste,\nkto bude piť z nej vodu,\nten bude moje šťastie.',
      'Prišiel tam mládenec,\nmládenec z ďaleka,\npil vodu z studienky,\nsrdce mu uletelo.',
      'Oj, dievča, dievča,\nty si moje srdce,\nzostaneš navždy so mnou,\nsi moja jediná.',
    ],
  },
  {
    id: '3',
    title: 'Ej, padá, padá rosenka',
    region: 'Západ',
    category: 'Ľúbostné',
    tempo: 'Pomalé',
    description: 'Lyrická pieseň o rose, ktorá symbolizuje nežnosť a krehkosť lásky.',
    verses: [
      'Ej, padá, padá rosenka,\nna zelenu trávu,\nplakal, plakal mládenček\nna dievčenku krásu.',
      'Ej, neplač, neplač, mládenček,\nneplač pre dievčinu,\nlebo nájdeš inú lepšiu\nv inej dedičine.',
      'Ej, nenájdem, nenájdem,\nkde bych mal hľadať,\nkeď sa mi tá jedna páčí,\nbez nej nemôžem žiť.',
    ],
    chorus: 'Ej, padá, padá rosenka,\nna zelenu trávu,\ntak padajú moje slzy\nza mojou milou.',
  },
  {
    id: '4',
    title: 'Červená sa západ',
    region: 'Západ',
    category: 'Pastierske',
    tempo: 'Stredné',
    description: 'Pieseň pastierov, ktorá oslavuje prírodu a slobodný život na horách.',
    verses: [
      'Červená sa západ, západ,\nza tými horami,\nide, ide môj milý\nso svojimi ovcami.',
      'Oj, ty môj pastier,\nty môj salašník,\nkeď prídeš z hôr domov,\nbudem čakať na teba.',
      'Zatrúbi pastier\nna svojej fujare,\nozvú sa hory, lesy,\nozvú sa doliny.',
    ],
  },
  {
    id: '5',
    title: 'Maková panenka',
    region: 'Západ',
    category: 'Detské',
    tempo: 'Rýchle',
    description: 'Veselá detská pesnička o makovej panence.',
    verses: [
      'Maková panenka,\nmaková panôčka,\nkde si si kúpila\nto červené rúcho?',
      'Na trhu, na trhu,\nna sobotnom trhu,\nkúpila mi ho moja mama\nza tri groše štrúdľu.',
      'Tancuj, panenka,\ntancuj, panôčka,\nkým ťa mak rozkvitá\nna záhrade.',
    ],
  },
  {
    id: '6',
    title: 'Išla Nanička do mesta',
    region: 'Západ',
    category: 'Tanečné',
    tempo: 'Rýchle',
    description: 'Rýchla tanečná pieseň o dievčine, ktorá ide do mesta.',
    verses: [
      'Išla Nanička do mesta,\nkupovať si plátenká,\nna ceste ju zastihol\nmladý mládenček.',
      'Nanička, Nanička,\nkam to ponáhľaš?\nKúp mi radšej srdce svoje,\nto je čo mi treba.',
      'Nepredávam, nepredávam,\nsrdce nepredam,\nlebo patrí inému,\ntomu, čo ho má rád.',
    ],
  },
  {
    id: '7',
    title: 'Ej, hore hory',
    region: 'Liptov',
    category: 'Salašnícke',
    tempo: 'Pomalé',
    description: 'Salašnícka pieseň z Liptova o kráse hôr a slobodnom živote.',
    verses: [
      'Ej, hore hory,\nhore hory výsoke,\nacko vaše pasú ovce\nna lúkach ďaleke.',
      'Hej, fujara znie,\nfujara sa ozýva,\npo doloch, po horách\ntón jej sa rozlieva.',
      'Ej, pastier ide,\npastier sa vracia,\nzo salašov liptovských\ncez dúbravy.',
    ],
    chorus: 'Ej, hore hory,\nhore hory výsoke,\ntam kde žijeme slobodne\nmy, liptovskí ľudia.',
  },
  {
    id: '8',
    title: 'Pod horami, pod lesami',
    region: 'Liptov',
    category: 'Ľúbostné',
    tempo: 'Stredné',
    description: 'Romantická liptovská pieseň o láske medzi pastierom a dievčinou.',
    verses: [
      'Pod horami, pod lesami,\npod zelenými,\nchodí moja milá\ns inými chlapcami.',
      'Oj, ty moja milá,\nprečo ma nečakáš?\nKeď prídem z hôr domov,\nsi preč od mna.',
      'Počkaj, môj milý,\npočkaj, drahý môj,\nja ťa čakám každý večer\nna prahu dverí.',
    ],
  },
  {
    id: '9',
    title: 'Zahraj mi, muzikant',
    region: 'Západ',
    category: 'Tanečné',
    tempo: 'Rýchle',
    description: 'Veselá tanečná pieseň, ktorá vyzýva muzikantov na hru.',
    verses: [
      'Zahraj mi, muzikant,\nzahraj mi veselo,\nnech sa všetko tancuje\na srdce sa smejem.',
      'Hraj, hraj, muzikant,\nhraj na husliach svojich,\nnech sa dvíha prach na zemi\nod nôh tanečníkov.',
      'Tancuj, dievča, tancuj,\ntancuj so mnou dnes,\nlebo zajtra nevieme,\nkto s kým bude ísť.',
    ],
    chorus: 'Hej, hej, muzikanti,\nhraj, hraj, hraj!\nNech sa celá dedina\nskáče a spieva!',
  },
  {
    id: '10',
    title: 'Sivá holubička',
    region: 'Západ',
    category: 'Ľúbostné',
    tempo: 'Pomalé',
    description: 'Jemná pieseň o holubičke, symbole lásky a vernosti.',
    verses: [
      'Sivá holubička\nna strome sedela,\ndo záhrady dolu\ncestičku hliadela.',
      'Čaká na holuba,\nčaká každý deň,\nkedy príde k nej domov\ncez hory, cez les.',
      'Prileť, holub môj,\nprileť ku mne spať,\nv cudzine ti nie je dobre,\ntu je tvoje hniezdo.',
    ],
  },
  {
    id: '11',
    title: 'Šijeme, šijeme kožúšky',
    region: 'Západ',
    category: 'Tanečné',
    tempo: 'Rýchle',
    description: 'Veselá pracovná pieseň, ktorá sa spievala pri šití.',
    verses: [
      'Šijeme, šijeme kožúšky,\npre naše dievčuška,\nnech sú teplé v zimičke,\nnech im dobre pasuje.',
      'Ihla šije, ihla šije,\nniť sa naťahuje,\nmajster šije a spieva,\nnohami podupuje.',
      'Hotový je kožúšok,\nhodvábom vyšívaný,\nnajkrajší bude na svete\nna naše dievčatá.',
    ],
  },
  {
    id: '12',
    title: 'Tancovala, vyskakovala',
    region: 'Západ',
    category: 'Tanečné',
    tempo: 'Rýchle',
    description: 'Energická tanečná pieseň opisujúca radostný tanec dievčiny.',
    verses: [
      'Tancovala, vyskakovala,\nmoja milá do výška,\nnožičky jej do tanca\nsamé šli, tak isto.',
      'Hej, dievča, hej,\nhej, skákaj, hej,\nnech ťa vidí celá dedina,\nako ľahko vieš skákať.',
      'Utancovala, vyskakovala,\ncelú noc do rána,\na ráno domov odišla\ncez rosu a mráz.',
    ],
  },
  {
    id: '13',
    title: 'Oj, Javorina',
    region: 'Liptov',
    category: 'Salašnícke',
    tempo: 'Pomalé',
    description: 'Slávna liptovská salašnícka pieseň o hore Javorina.',
    verses: [
      'Oj, Javorina,\nty hora vysoká,\nkto by nechcel bývať\nna tvojej vrcholke.',
      'Hej, tam hore\nje vzduch čistý, svieži,\ntam kde orly liečia,\ntam sú naše srdcia.',
      'Oj, Javorina,\nhora liptovská,\nbudeme ťa spievať\ndo konca sveta.',
    ],
    chorus: 'Oj, Javorina, Javorina,\nty hora zelená,\nv tvojom tieni odpočíva\nnáša duša unavená.',
  },
  {
    id: '14',
    title: 'Rastie mi, rastie',
    region: 'Západ',
    category: 'Ľúbostné',
    tempo: 'Stredné',
    description: 'Lyrická pieseň o raste citov a lásky.',
    verses: [
      'Rastie mi, rastie\nruža v záhrade,\nrastie mi, rastie\nláska v srdci.',
      'Kto mi ju zasadil,\nkto mi ju polial?\nSám Boh to urobil,\nkeď si ťa dal mne.',
      'Ruža neroste\nbez vody, bez slnka,\nlebo ja nerastiem\nbez teba ani deň.',
    ],
  },
  {
    id: '15',
    title: 'Na zelenej tráve',
    region: 'Západ',
    category: 'Pastierske',
    tempo: 'Stredné',
    description: 'Idylická pastierska pieseň o odpočinku na lúke.',
    verses: [
      'Na zelenej tráve\nsedím ja a snívam,\npozorújem oblaky\nako letia nad hlavou.',
      'Ovce pasú okolo,\nbezstarostne chodia,\nfujara mi spieva\npesničku o slobode.',
      'Takto žiť chcem stále,\nna zelenej tráve,\nbez starostí, bez trápenia,\nlen s prirodou žiť.',
    ],
  },
  {
    id: '16',
    title: 'Povedz mi, povedz',
    region: 'Západ',
    category: 'Ľúbostné',
    tempo: 'Pomalé',
    description: 'Dojímavá pieseň o hľadaní odpovede od milovanej osoby.',
    verses: [
      'Povedz mi, povedz,\nty môj milý môj,\nprečo si tak ďaleko\nod mojich očí.',
      'Povedz mi, povedz,\nty moja milá,\nkedy sa vrátiš k mne\ncez hory, cez polia.',
      'Čakám a čakám,\ndeň za dňom čakám,\nlebo bez teba neviem žiť\nani jediný deň.',
    ],
  },
  {
    id: '17',
    title: 'Vlčie hory',
    region: 'Orava',
    category: 'Salašnícke',
    tempo: 'Stredné',
    description: 'Oravská pieseň o divokých horách a slobodnom živote pastierov.',
    verses: [
      'Vlčie hory, vlčie hory,\nhory Oravy,\ntam kde chodí naša mládež\ncez dlhé chodníky.',
      'Vlk zavýja, medveď revie,\nv horách sa to ozýva,\nale pastier nebojí sa,\nlebo hory pozná.',
      'Orava moja, Orava,\nkraj môj najdrahší,\nkde boli naši otcovia\nbudeme aj my.',
    ],
  },
  {
    id: '18',
    title: 'Šarišský tanec',
    region: 'Šariš',
    category: 'Tanečné',
    tempo: 'Rýchle',
    description: 'Rýchly šarišský tanec plný energie a radosti.',
    verses: [
      'Hej, tancujme, skákajme,\nmy Šarišania,\nnáš tanec je najkrajší\npo celom Slovensku.',
      'Zahraj, zahraj, muzikant,\nzahraj šarišský,\nnech sa tancuje veselo\nv každej dedine.',
      'Hej, hej, Šariš môj,\nkraj plný piesní,\ntancovať a spievať viem\nlepšie ako ktokoľvek.',
    ],
    chorus: 'Hej, hej, hej,\nzahraj mi veselo,\nšarišský tanček najkrajší\nbudem tancovať.',
  },
  {
    id: '19',
    title: 'Zemplínska svadobná',
    region: 'Zemplín',
    category: 'Svadobné',
    tempo: 'Stredné',
    description: 'Tradičná svadobná pieseň zo Zemplína.',
    verses: [
      'Dnes je svadobný deň,\ndnes sa veselíme,\nnovemanželia naši\nbúdu šťastní vždy.',
      'Nevesta sa zdobí,\nkvetmi vo vlasoch,\nženích čaká nervózne\npri oltári sám.',
      'Boh vás žehnaj oboch,\nžite dlho spolu,\nv zdraví a v šťastí\ndo konca dni.',
    ],
    chorus: 'Hej, svadobná,\nhej, veselá,\nnech žijú novomanželia\ndo sta rokov.',
  },
  {
    id: '20',
    title: 'Spišská balada',
    region: 'Spiš',
    category: 'Balady',
    tempo: 'Pomalé',
    description: 'Stará balada zo Spiša o nešťastnej láske.',
    verses: [
      'Za Tatrami, za horami,\nžila dievka krásna,\nmilovala mládenca,\nktorý bol z ďaleka.',
      'Prišiel vojak, odviedol ho,\ndo cudzích krajov,\nnikdy viac sa nevrátil\nk svojej milovanej.',
      'Dievka čakala roky,\nčakala márne,\naž zaschla ako kvet\nbez vody a slnka.',
    ],
  },
  {
    id: '21',
    title: 'Hontianská',
    region: 'Hont',
    category: 'Ľúbostné',
    tempo: 'Stredné',
    description: 'Ľúbostná pieseň z Hontu.',
    verses: [
      'Z Hontu pochádza\nmoja milá dievka,\nmá oči ako hviezdy\na vlasy ako noc.',
      'Hontianské polia\nzelené a krásne,\ntak ako tvoje oči\nnadovšetko krásne.',
      'Budem ťa milovať\ncez hory, cez doly,\nbudem ťa milovať\ndo skonania sveta.',
    ],
  },
  {
    id: '22',
    title: 'Pohronie zelené',
    region: 'Pohronie',
    category: 'Pastierske',
    tempo: 'Stredné',
    description: 'Krásna pieseň o doline rieky Hron.',
    verses: [
      'Pohronie zelené,\ndolina prekrásna,\ntečie tam rieka Hron\ncez lúky a polia.',
      'Na brehoch pohronských\npasú sa ovečky,\npastvina zelená\ndo diaľky sa stráca.',
      'Pohronie, Pohronie,\nmoj kraj milovaný,\nkde sú moje korene\na môj domov stálý.',
    ],
  },
  {
    id: '23',
    title: 'Rekrutská',
    region: 'Západ',
    category: 'Rekrutské',
    tempo: 'Stredné',
    description: 'Smutná pieseň rekrútov odchádzajúcich do vojny.',
    verses: [
      'Ideme, ideme\ndo vojny, do vojny,\nlúčime sa s domovom\nna dlhé roky.',
      'Mati, mati moja,\nneplač za mnou,\nvrátim sa som zdravý\na silný domov.',
      'Dievča, dievča moje,\nčakaj na mňa,\nnepísal som ti veľa,\nale myslím na teba.',
    ],
    chorus: 'Hej, rekrúti, hej,\nideme spolu,\nverní zostaneme\ndo konca vojny.',
  },
  {
    id: '24',
    title: 'Gemerská vinšovačka',
    region: 'Gemer',
    category: 'Vinšovacie',
    tempo: 'Rýchle',
    description: 'Tradičná gemerská vinšovačka na Nový rok.',
    verses: [
      'Vinšujem vám, vinšujem,\nnový rok šťastlivý,\nnech vám Boh požehná\ncelý rok priaznivý.',
      'Zdravie, šťastie, pokoj,\nnech vám vždy zostane,\na hojnosť vo vašom dome\nnech vás neopustí.',
      'My sme vinšovníci\npríšli sme k vám,\ndajte nám koláčky\na my povinšujeme.',
    ],
  },
  {
    id: '25',
    title: 'Tekovská',
    region: 'Tekov',
    category: 'Ľúbostné',
    tempo: 'Stredné',
    description: 'Ľúbostná pieseň z Tekova o vernej láske.',
    verses: [
      'Z Tekova som ja,\nTekovčan statočný,\nmilujem dievčinu\nz Tekova zaujatú.',
      'Tekovské vinice\nrodia víno dobré,\nako je naša láska\nsladká a verná.',
      'Budem ťa milovať\ncelý vek môj celý,\nlebo si mi darovala\nsrdce svoje verné.',
    ],
  },
];

export const categories: Category[] = [
  'Svadobné',
  'Tanečné',
  'Pastierske',
  'Ľúbostné',
  'Vojenské',
  'Salašnícke',
  'Detské',
  'Vinšovacie',
  'Rekrutské',
  'Balady',
];

export const regions: Region[] = [
  'Západ',
  'Stred',
  'Východ',
  'Šariš',
  'Zemplín',
  'Spiš',
  'Liptov',
  'Orava',
  'Tekov',
  'Hont',
  'Gemer',
  'Pohronie',
];
