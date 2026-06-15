# Ник Меньшов — Sound Director · DJ

Персональный лендинг. Статический сайт, деплой на GitHub Pages.

## Стек
Vanilla HTML/CSS/JS (без фреймворка и сборки) — одностраничник, минимальный вес, нулевое трение для GitHub Pages. Моушн на CSS + лёгкий JS. Шоурил-фон собран из видео артиста (H.264).

## Структура
```
site/                      # деплоится на Pages
  index.html               # все секции
  rider.html               # печатная версия райдера (из неё собран PDF)
  favicon.svg
  assets/css/main.css      # дизайн-токены + все стили
  assets/js/main.js        # шоурил, плеер, навигация, reveal, календарь, форма
  media/                   # reel1..8.mp4 (шоурил/портфолио), poster*.jpg, rider.pdf
DESIGN.md                  # style guide (палитра, типографика, секции)
CONTENT.md                 # тексты, регалии, копи
concept/                   # черновой hero-концепт (не деплоится)
.github/workflows/deploy.yml
```

## Локальный запуск
```bash
cd site && python3 -m http.server 8262
# http://localhost:8262
```

## Деплой
Push в `main` → GitHub Actions собирает и публикует папку `site/` на Pages.
Включить: Settings → Pages → Source: GitHub Actions.

## Как обновлять контент
- **Фото / визуал кейсов:** положить в `site/media/`, заменить ссылки в `index.html` (секции `#sound-director`, `#portfolio`).
- **Миксы (плеер):** реальные аудио/ссылки — в блок `#player` и логику плеера в `main.js`.
- **Занятые даты:** пока демо-набор в `main.js` (`busy`). После подключения бэкенда — из Google Calendar.
- **Кейсы:** карточки в секции `#sound-director` (`.cases`).
- **Бэкенд бронирования (позже):** Cloudflare Worker, `ENDPOINT` в `main.js`; секреты `BOT_TOKEN`, `CHAT_ID`, доступ к Google Calendar — только в env воркера.

## Регалии / ссылки
- Член жюри Top100 Awards — https://top100awards.ru/jury/menshov
- Участник Top15 Moscow — https://top15moscow.ru/djs/nickmenshov
- Telegram @nickmenshov · канал @soundslikenick · Instagram @nickmenshov · +7 910 572‑25‑08
