# SCHEMA-PLAN — макет решения schema-пробелов

> Лендинг Ник Меньшов. Цель: добить структурированные данные (Schema.org / JSON-LD)
> для богатых сниппетов Google/Яндекс и попадания в AI-ответы (ChatGPT/Perplexity/Яндекс Нейро).
> Дата: 2026-06-28.

---

## 1. Текущее состояние (что УЖЕ есть в `site/index.html`, строки 27–82)

Единый блок `<script type="application/ld+json">` с `@graph`:

| Тип | Статус | Заметка |
|-----|--------|---------|
| `Person` | ✅ полный | name, jobTitle, award, knowsAbout, knowsLanguage, sameAs, address |
| `ProfessionalService` | ✅ полный | telephone, priceRange, areaServed (Москва/Россия), 4× Offer с ценами |
| `WebSite` | ✅ есть | inLanguage, about → Person |
| `<h1>` | ✅ есть | строка 158 `<h1 class="hero-name">` — **аудит SEO ошибся, H1 на месте, чинить нечего** |

## 2. Пробелы и приоритет

| Пробел | Severity | Данные от владельца? | Действие |
|--------|----------|----------------------|----------|
| `FAQPage` | HIGH | ❌ нет — ответы берём из фактов уже на сайте | **готово к вставке (§3)** |
| `LocalBusiness` (отдельный) | MEDIUM | ❌ нет | **готово к вставке (§3)** — усиливает локалку |
| `BreadcrumbList` | LOW | ❌ нет | готово к вставке (§3), польза на одностраничнике небольшая |
| `AggregateRating` + `Review` | CRITICAL | ✅ **нужны реальные отзывы** | шаблон с плейсхолдерами (§4) — НЕ выдумывать |
| `VideoObject` (рилы) | MEDIUM | ✅ нужны даты/длительности | шаблон с плейсхолдерами (§4) |

> ⚠️ `AggregateRating`/`Review` без реальных отзывов **не вставляем** — фейковые отзывы это нарушение
> Google (ручная санкция) и репутационный риск. Ждём твои 3–5 цитат.

---

## 3. ГОТОВО К ВСТАВКЕ (данных не требует — всё взято из фактов на странице)

Добавить эти объекты в существующий `@graph` (перед закрывающей `]` массива, через запятую
после блока `WebSite`). Ничего не выдумано — цены, время ответа, жанры, гео и оборудование
уже заявлены на сайте.

### 3.1 FAQPage

```json
{
  "@type": "FAQPage",
  "@id": "https://nikumen.github.io/nick-menshov-landing/#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Сколько стоит диджей на свадьбу в Москве?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "DJ на свадьбу (до 7 часов) — 120 000 ₽. Продление +20 000 ₽ за час. Договор и безналичный расчёт через ИП, налог уже включён в гонорар. Цены ориентировочные, точные условия обсуждаем в переписке."
      }
    },
    {
      "@type": "Question",
      "name": "Сколько стоит DJ-сет или диджей на корпоратив?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "DJ-сет до 2 часов — 80 000 ₽, до 3 часов — 100 000 ₽. Частное событие или корпоратив (до 6 часов) — 120 000 ₽. Продление +20 000 ₽ за час."
      }
    },
    {
      "@type": "Question",
      "name": "Как забронировать дату?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Выберите свободную дату в календаре на сайте и оставьте заявку, либо напишите напрямую в Telegram @nickmenshov. Отвечаю лично в течение 15–30 минут."
      }
    },
    {
      "@type": "Question",
      "name": "Какие жанры играет Ник Меньшов?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Основные направления — house, afro house и melodic house. Также готовлю программу под формат события и работаю с клиентской музыкой. Примеры сетов можно послушать в плеере на сайте."
      }
    },
    {
      "@type": "Question",
      "name": "Работаешь ли ты за пределами Москвы и за границей?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Да. География — Москва, регионы России и международные события. Для выездов за пределы Москвы предусмотрены трансфер и проживание (условия в райдере)."
      }
    },
    {
      "@type": "Question",
      "name": "Чьё нужно оборудование?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Оборудование предоставляет площадка по техническому райдеру: 2× Pioneer CDJ-3000, микшер Pioneer DJM-A9 (или DJM-900NXS2), мониторы и PA. Полная версия райдера доступна в PDF на сайте."
      }
    }
  ]
}
```

> На странице желательно показать те же вопросы видимым блоком (секция FAQ) — schema должна
> соответствовать видимому контенту, иначе Google может проигнорировать разметку. Это отдельная
> задача по вёрстке (см. §5).

### 3.2 LocalBusiness (усиление локального поиска)

```json
{
  "@type": "LocalBusiness",
  "@id": "https://nikumen.github.io/nick-menshov-landing/#localbusiness",
  "name": "Ник Меньшов · DJ и саунд-дирекция",
  "description": "Диджей и саунд-директор премиальных событий: свадьбы, корпоративы, частные вечера в Москве и по миру.",
  "image": "https://nikumen.github.io/nick-menshov-landing/media/og.jpg",
  "url": "https://nikumen.github.io/nick-menshov-landing/",
  "telephone": "+7-910-572-25-08",
  "priceRange": "от 80 000 ₽",
  "address": { "@type": "PostalAddress", "addressLocality": "Москва", "addressCountry": "RU" },
  "areaServed": [
    { "@type": "City", "name": "Москва" },
    { "@type": "Country", "name": "Россия" }
  ],
  "founder": { "@id": "https://nikumen.github.io/nick-menshov-landing/#person" },
  "sameAs": [
    "https://t.me/nickmenshov",
    "https://www.instagram.com/nickmenshov"
  ]
}
```

> `geo` (координаты) намеренно опущены: фиксированного адреса-студии нет, работа выездная.
> Если появится студия/офис — добавить `geo` с реальными координатами.

### 3.3 BreadcrumbList (опционально, low priority)

```json
{
  "@type": "BreadcrumbList",
  "@id": "https://nikumen.github.io/nick-menshov-landing/#breadcrumbs",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Обо мне", "item": "https://nikumen.github.io/nick-menshov-landing/#about" },
    { "@type": "ListItem", "position": 2, "name": "Портфолио", "item": "https://nikumen.github.io/nick-menshov-landing/#portfolio" },
    { "@type": "ListItem", "position": 3, "name": "Райдер", "item": "https://nikumen.github.io/nick-menshov-landing/#rider" },
    { "@type": "ListItem", "position": 4, "name": "Даты и бронирование", "item": "https://nikumen.github.io/nick-menshov-landing/#book" },
    { "@type": "ListItem", "position": 5, "name": "Контакты", "item": "https://nikumen.github.io/nick-menshov-landing/#contacts" }
  ]
}
```

---

## 4. ШАБЛОНЫ — ТРЕБУЮТ ТВОИХ ДАННЫХ (не вставлять с заглушками!)

### 4.1 AggregateRating + Review — КРИТИЧНО для доверия и AI-ответов

Прикрепляется к `ProfessionalService` (или `LocalBusiness`). **Нужны реальные отзывы.**
От тебя: 3–5 цитат, по каждой → имя автора, формат события (свадьба/корпоратив), текст, дата, оценка.

Добавить ВНУТРЬ объекта `ProfessionalService` (или LocalBusiness):

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "<средняя оценка, напр. 5.0>",
  "reviewCount": "<сколько отзывов, напр. 5>",
  "bestRating": "5"
},
"review": [
  {
    "@type": "Review",
    "author": { "@type": "Person", "name": "<ИМЯ КЛИЕНТА>" },
    "datePublished": "<ГГГГ-ММ-ДД>",
    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
    "reviewBody": "<ТЕКСТ ОТЗЫВА — реальная цитата клиента>"
  }
  /* … повторить по числу отзывов … */
]
```

> Видимый блок отзывов на странице обязателен — schema без видимого контента = риск санкции.

### 4.2 VideoObject — для рилов в портфолио (видеопоиск + AI)

От тебя по каждому рилу: дата публикации, длительность (ISO 8601, напр. `PT12S`),
короткое описание. Картинки-постеры уже есть (`media/poster-reelN.jpg`).

Шаблон на один рил (повторить для нужных; не обязательно для всех 8 — хватит 2–3 ключевых):

```json
{
  "@type": "VideoObject",
  "name": "<НАЗВАНИЕ, напр. Ник Меньшов — сет на большой сцене>",
  "description": "<ОПИСАНИЕ кадра/события>",
  "thumbnailUrl": "https://nikumen.github.io/nick-menshov-landing/media/poster-reel7.jpg",
  "contentUrl": "https://nikumen.github.io/nick-menshov-landing/media/reel7.mp4",
  "uploadDate": "<ГГГГ-ММ-ДД>",
  "duration": "<PTxxS>"
}
```

---

## 5. Как применять и проверять

1. **Готовые блоки (§3)** — вставляю в существующий `@graph` в `site/index.html`, скажи «применяй §3».
2. **FAQ видимым блоком** — отдельная задача вёрстки (секция с аккордеоном), чтобы schema совпадала
   с контентом. Могу сделать в том же стиле, что и остальные секции.
3. **Данные-зависимые (§4)** — пришли отзывы и (опц.) даты/длительности рилов → вставлю.
4. **Валидация** после вставки:
   - Google Rich Results Test: https://search.google.com/test/rich-results
   - Schema.org Validator: https://validator.schema.org/
   - Яндекс Вебмастер → «Валидатор микроразметки».
5. **Домен**: пока сайт на `github.io`, заявить его в Яндекс.Вебмастер / Google Search Console
   можно, но локальный профиль (Яндекс.Бизнес / Google Business) недоступен без своего домена —
   это главный ограничитель локальной выдачи (см. аудит).

---

## Резюме
- **Сейчас могу применить без твоих данных:** FAQPage, LocalBusiness, BreadcrumbList (§3) + видимый FAQ-блок.
- **Жду от тебя:** отзывы (для AggregateRating/Review — самое важное), даты/длительности рилов (для VideoObject).
