import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Полезные ссылки — Достопримечательности вокруг ГУАП",
  description:
    "Список источников и сайтов, использованных при подготовке материалов о достопримечательностях вокруг ГУАП.",
};

type UsefulLink = {
  title: string;
  url: string;
  extraLinks?: Array<{ label: string; url: string }>;
};

type RouteLinks = {
  routeNumber: number;
  title: string;
  direction: string;
  links: UsefulLink[];
};

const ROUTES: RouteLinks[] = [
  {
    routeNumber: 1,
    title: "Прогулка по окрестностям Сенной площади",
    direction: "Южное",
    links: [
      { title: "Юсуповский дворец", url: "https://yusupov-palace.ru/" },
      {
        title: "Особняк Общества немецких ремесленников Пальма",
        url: "https://palma.spb.ru/",
      },
      {
        title: "Львиный мост",
        url: "https://www.citywalls.ru/house13163.html",
      },
      {
        title: "Музей искусства Санкт-Петербурга XX–XXI веков",
        url: "https://mispxx-xxi.ru/",
      },
      {
        title: "Екатерининское общественное собрание",
        url: "https://catherineassembly.ru/",
      },
      { title: "Театр Монплезир", url: "https://teatrmonplezir.ru/" },
      { title: "Нос майора Ковалёва", url: "https://gmgs.ru/post/15977" },
      {
        title: "Юсуповский сад",
        url: "https://www.citywalls.ru/house20402.html",
      },
      {
        title: "Центральный музей железнодорожного транспорта РФ",
        url: "https://cmzt.ru/",
      },
      {
        title: "Сенная площадь",
        url: "https://www.encspb.ru/object/2804018919?lc=ru",
      },
      { title: "Театр на Садовой", url: "https://pkteatr.ru/" },
      {
        title: "Воронцовский дворец",
        url: "https://www.citywalls.ru/house2568.html",
        extraLinks: [
          {
            label: "Мальтийская капелла",
            url: "https://kapella.spb.ru/maltijskaya-kapella",
          },
        ],
      },
      { title: "Гостиный двор", url: "https://bgd.ru/" },
    ],
  },
  {
    routeNumber: 2,
    title: "Навстречу Балтике",
    direction: "Западное",
    links: [
      { title: "Петербургский художник", url: "https://moyka100.com/" },
      {
        title: "Мариинский театр 2",
        url: "https://www.mariinsky.ru/about/history/mariinsky_ii/",
      },
      { title: "Хроники огненной истории", url: "https://fieryhistory.ru/" },
      {
        title: "Семимостье (Пикалов мост)",
        url: "https://www.citywalls.ru/house15756.html",
      },
      {
        title: "Место смерти Суворова",
        url: "https://www.citywalls.ru/house1937.html",
      },
      {
        title: "Египетский мост",
        url: "https://www.citywalls.ru/house13158.html",
      },
      {
        title: "Троицкий собор и Колонна Славы",
        url: "https://izmsobor.ru/",
      },
      {
        title: "Сад Валентина Пикуля",
        url: "https://www.citywalls.ru/house32798.html",
      },
      {
        title: "Воскресенская церковь",
        url: "https://spb-21319.cerkov.ru/",
      },
      { title: "Музей «Арт и Факты»", url: "http://www.artfact.ru/" },
      {
        title: "Балтийский вокзал и Музей железных дорог России",
        url: "https://rzd-museum.ru/",
      },
    ],
  },
  {
    routeNumber: 3,
    title: "От искусства к науке: путь к Технологическому институту",
    direction: "Южное",
    links: [
      {
        title:
          "Санкт-Петербургская консерватория им. Н. А. Римского-Корсакова",
        url: "https://www.conservatory.ru/",
      },
      { title: "Мариинский театр", url: "https://www.mariinsky.ru/" },
      {
        title: "Лендок (Ленинградская студия документальных фильмов)",
        url: "https://lendoc.ru/",
      },
      {
        title: "Доходный дом Веге",
        url: "https://www.citywalls.ru/house456.html",
      },
      { title: "Никольский морской собор", url: "https://nikolskiysobor.ru/" },
      { title: "Никольские ряды", url: "https://sadovaya62.ru/" },
      {
        title: "Выставочный центр «Координата» (СПбГУПТД)",
        url: "https://sutd.ru/novosti_i_obyavleniya/announces/19378/",
      },
      {
        title: "Музей-усадьба Г. Р. Державина и Польский сад",
        url: "https://www.museumpushkin.ru/vserossijskij_muzej_a._s._pushkina/muzej-usadba_g.r.derzhavina.html",
      },
      {
        title: "Молодёжный театр на Фонтанке",
        url: "https://mtfontanka.ru/",
      },
      { title: "Метрологический музей", url: "http://museum.vniim.ru/" },
    ],
  },
  {
    routeNumber: 4,
    title: "Таинственная Коломна",
    direction: "Западное",
    links: [
      { title: "Галерея «Мойка 104»", url: "https://moika104.ru/" },
      {
        title:
          "Дворец великой княгини Ксении Александровны (дворец Александра Михайловича)",
        url: "https://www.citywalls.ru/house34273.html",
      },
      { title: "Новая Голландия", url: "https://www.newhollandsp.ru/" },
      {
        title:
          "Дворец великого князя Алексея Александровича (Дом музыки СПб)",
        url: "https://www.spdm.ru/alekseevskiy-dvorec",
      },
      {
        title: "Музей-квартира А. А. Блока",
        url: "https://www.spbmuseum.ru/themuseum/museum_complex/blok_museum/",
      },
      {
        title:
          "Лютеранская церковь Святого Иоанна (Яани Кирик)",
        url: "https://janikirik.ru/",
      },
      {
        title: "Концертный зал Мариинского театра",
        url: "https://www.mariinsky.ru/about/history/concert_hall/",
      },
      {
        title: "Большая хоральная синагога",
        url: "https://sinagoga.jeps.ru/",
      },
      { title: "Исидоровская церковь", url: "https://isidore.ru/" },
      {
        title: "Особняк Серебрякова",
        url: "https://www.spbmuzei.ru/osobnyak-serebryakova-dom-iskusstv",
      },
      {
        title: "Дом, в котором жил Пушкин",
        url: "https://surganova.su/artpoint",
      },
    ],
  },
  {
    routeNumber: 5,
    title: "Променад по линиям Васильевского острова",
    direction: "Северное",
    links: [
      {
        title:
          "Центральный военно-морской музей им. императора Петра Великого",
        url: "https://navalmuseum.ru/",
      },
      {
        title: "Особняк Румянцева",
        url: "https://www.spbmuseum.ru/themuseum/museum_complex/rumyantsev_mansion/",
      },
      {
        title: "Музей-квартира И. П. Павлова",
        url: "https://kvartirapavlova.ru/",
      },
      {
        title: "Аптека доктора Пеля и Ф. К. Феррейна",
        url: "https://aptekapelya.ru/",
      },
      {
        title: "Андреевский собор",
        url: "https://andrew-sobor.ru/",
      },
      {
        title: "Музей повседневной культуры Ленинграда 1945–1965 гг.",
        url: "https://museum19451965.orgs.biz/",
      },
      {
        title: "Лютеранский Михайловский собор",
        url: "https://spbstmihail.ru/home",
      },
      {
        title: "Музей-квартира семьи Бенуа",
        url: "https://kvartira-benua.ru/",
      },
      {
        title: "Дом купца Бекеля",
        url: "https://www.citywalls.ru/house168.html",
      },
      {
        title:
          "Екатерининская лютеранская церковь (кирха Св. Екатерины)",
        url: "http://www.katharinenkirche.ru/",
      },
    ],
  },
  {
    routeNumber: 6,
    title: "Прогулка до стрелки Васильевского острова",
    direction: "Северное",
    links: [
      {
        title: "Николаевский дворец (Дворец Труда)",
        url: "https://nikolaevskypalace.ru/nikolaevsky-palace",
      },
      {
        title:
          "Научно-исследовательский музей Российской академии художеств",
        url: "https://artsacademymuseum.org/",
      },
      {
        title: "Румянцевский сад",
        url: "https://saint-petersburg.ru/m/history/britenkov/372506/?mobile_redirect=false",
      },
      {
        title: "Дворец Меншикова (филиал Эрмитажа)",
        url: "https://www.hermitagemuseum.org/visitus/menshikov-palace",
      },
      {
        title: "Дворец Петра II",
        url: "https://www.citywalls.ru/house27039.html",
      },
      {
        title: "Здание Российской академии наук",
        url: "https://www.citywalls.ru/house419.html",
      },
      {
        title:
          "Кунсткамера (Музей антропологии и этнографии им. Петра Великого РАН)",
        url: "https://www.kunstkamera.ru/",
      },
      {
        title: "Зоологический музей ЗИН РАН",
        url: "https://www.zin.ru/museum/",
      },
      {
        title: "Здание Биржи",
        url: "https://www.citywalls.ru/house6196.html",
      },
      {
        title: "Стрелка Васильевского острова",
        url: "https://www.encspb.ru/object/2804005280?lc=ru",
      },
    ],
  },
  {
    routeNumber: 7,
    title: "Парадный Петербург: по набережной к Эрмитажу",
    direction: "Восточное",
    links: [
      {
        title: "Конногвардейский манеж (выставочный зал «Манеж»)",
        url: "https://manege.spb.ru/",
      },
      {
        title:
          "Дворец бракосочетания №1 (особняк А. П. Кельха)",
        url: "https://spb-zags.ru/dvorcy-sankt-peterburga/dvorets-brakosochetanija-1",
      },
      {
        title: "Особняк Нарышкина — дом Воронцова-Дашкова",
        url: "https://www.citywalls.ru/house1222.html",
      },
      {
        title:
          "Здания Сената и Синода (Президентская библиотека им. Б. Н. Ельцина)",
        url: "https://www.prlib.ru/",
      },
      {
        title: "Медный всадник",
        url: "https://www.citywalls.ru/house23572.html",
      },
      {
        title: "Адмиралтейство",
        url: "https://www.citywalls.ru/house1141.html",
      },
      {
        title: "Дворец великого князя Михаила Михайловича",
        url: "https://www.citywalls.ru/house800.html",
      },
      {
        title: "Зимний дворец / Государственный Эрмитаж",
        url: "https://www.hermitagemuseum.org/",
      },
      {
        title: "Эрмитажный театр",
        url: "https://www.hermitagemuseum.org/learn/theatre",
      },
      {
        title: "Зимний дворец Петра I",
        url: "https://www.hermitagemuseum.org/visitus/winter-palace",
      },
      {
        title: "Ново-Михайловский дворец",
        url: "https://www.citywalls.ru/house797.html",
      },
    ],
  },
  {
    routeNumber: 8,
    title: "Путешествие по набережной Мойки",
    direction: "Восточное",
    links: [
      {
        title:
          "Дворец культуры связи им. С. М. Кирова (быв. Немецкая реформатская церковь)",
        url: "https://walkspb.ru/zd/bol_morskaya58.html",
        extraLinks: [
          {
            label: "Про кирху (Немецкая реформатская церковь)",
            url: "https://www.citywalls.ru/house1487.html",
          },
        ],
      },
      {
        title: "Дом Билдерлингов",
        url: "https://walkspb.ru/istoriya-peterburga/zd/bol-mprskaya53",
      },
      {
        title: "Особняк Гагарина (Дом архитектора)",
        url: "https://arcunionspb.ru/architects-house/",
      },
      { title: "Исаакиевский собор", url: "https://cathedral.ru/" },
      {
        title:
          "Мариинский дворец (Законодательное собрание Санкт-Петербурга)",
        url: "https://www.assembly.spb.ru/",
      },
      {
        title:
          "Дом у Красного моста (особняк Косиковского / дом Чичерина)",
        url: "https://www.citywalls.ru/house1562.html",
      },
      {
        title: "Строгановский дворец (филиал Русского музея)",
        url: "https://rusmuseum.ru/museums/stroganov-palace/",
      },
      {
        title: "Дворец графа Разумовского (РГПУ им. А. И. Герцена)",
        url: "https://walkspb.ru/zd/moyka48.html",
      },
      { title: "Казанский собор", url: "http://kazansky-spb.ru/" },
      {
        title: "Базилика Святой Екатерины Александрийской",
        url: "https://bazilika-catherine.ru/",
      },
      { title: "Башня Городской думы", url: "https://dumatower.ru/" },
    ],
  },
];

function formatHostname(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname === "/" ? "" : u.pathname;
    return path ? `${host}${path}` : host;
  } catch {
    return url;
  }
}

export default function UsefulLinksPage() {
  return (
    <main className="min-h-page">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="space-y-2">
          <h1 className="mb-1 text-xl font-bold tracking-tight text-guap-heading sm:text-2xl">
            Полезные ссылки
          </h1>
          <p className="text-suai-text">
            Ниже представлены ссылки на сайты, с которых была взята основная
            информация для написания текстов маршрутов. Вы можете ознакомиться
            с сайтами для получения более подробной информации при желании.
          </p>
        </header>

        <div className="space-y-8">
          {ROUTES.map((route) => (
            <section
              key={route.routeNumber}
              className="rounded-suai border border-suai-border bg-guap-card p-5 shadow-suai sm:p-6"
            >
              <div className="mb-4 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-suai-brand">
                  Маршрут {route.routeNumber} · Направление: {route.direction}
                </p>
                <h2 className="text-base font-semibold text-guap-heading sm:text-lg">
                  {route.title}
                </h2>
              </div>

              <ol className="space-y-2">
                {route.links.map((link, index) => (
                  <li
                    key={link.url}
                    className="flex flex-col gap-1 rounded-lg border border-suai-border/60 bg-guap-nav px-3 py-2.5 transition hover:bg-guap-hover sm:flex-row sm:items-baseline sm:gap-3"
                  >
                    <span className="shrink-0 text-[12px] font-semibold text-guap-muted sm:w-7 sm:text-right">
                      {index + 1}.
                    </span>
                    <div className="min-w-0 flex-1">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[13px] font-medium leading-snug text-guap-heading transition hover:text-suai-brand"
                      >
                        {link.title}
                      </a>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 block break-all text-[11px] text-suai-brand underline underline-offset-2 hover:opacity-90"
                      >
                        {formatHostname(link.url)}
                      </a>

                      {link.extraLinks && link.extraLinks.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {link.extraLinks.map((x) => (
                            <div key={x.url} className="text-[12px] text-suai-text">
                              <a
                                href={x.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block font-medium text-guap-heading transition hover:text-suai-brand"
                              >
                                {x.label}
                              </a>
                              <a
                                href={x.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-0.5 block break-all text-[11px] text-suai-brand underline underline-offset-2 hover:opacity-90"
                              >
                                {formatHostname(x.url)}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
