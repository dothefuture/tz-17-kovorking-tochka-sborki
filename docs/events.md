# Таблица событий GA4

Ресурс GA4 «ТОЧКА СБОРКИ — сайт». Все вызовы `gtag('event', …)` — в одном месте: `js/analytics.js:48` (функция `track`). Клики по элементам с атрибутом `data-event` ловит общий обработчик `js/analytics.js:69`; параметры берутся из атрибутов `data-*` (например, `data-button-name` → `button_name`). События, зависящие от результата (ответ приёмника, расчёт, копирование), вызываются через `window.TSAnalytics.track()` из `js/form.js` и `js/main.js`.

★ — ключевые события (Key events): `generate_lead`, `contact_click`, `messenger_click`.

| № | Событие | Тип | Где отправляется (файл:строка) | Параметры и пример значений |
|---|---|---|---|---|
| 1 | `page_view` | авто | —, расширенная статистика GA4 (без кода); тег gtag.js в `<head>` каждой страницы, строка 3–9 | page_location=`https://…/free-day.html?utm_source=instagram…`, page_title=`Тест-день бесплатно…` |
| 2 | `scroll` | авто | —, расширенная статистика GA4 (без кода) | percent_scrolled=`90` |
| 3 | `click` | авто | —, расширенная статистика GA4 (без кода); внешние ссылки: соцсети, Telegram, WhatsApp, карты | link_url=`https://t.me/tochka_community`, outbound=`true` |
| 4 | `file_download` | авто | —, расширенная статистика GA4 (без кода); ссылка tariffs.html:159 | file_name=`/files/dogovor-tochka-sborki.pdf`, file_extension=`pdf` |
| 5 | `form_start` | авто | —, расширенная статистика GA4 (без кода); формы `#lead-form`, `#event-form` | form_id=`lead-form` |
| 6 | `form_submit` | авто | —, расширенная статистика GA4 (без кода) | form_id=`lead-form` |
| 7 | `generate_lead` ★ | рекоменд. | js/form.js:189 (после ответа `ok: true`) | lead_tariff=`flex`, team_size=`2_4`, lead_source=`instagram` |
| 8 | `cta_click` | своё | index.html:69, spaces.html:125, free-day.html:97 | button_name=`hero_trial`, page_section=`hero` |
| 9 | `space_view` | своё | index.html:89, index.html:95, index.html:101, spaces.html:76, … всего 7 | space_type=`office` |
| 10 | `select_tariff` | своё | index.html:121, index.html:130, index.html:139, index.html:148, … всего 10 | tariff_name=`fixed`, tariff_price=`11000` |
| 11 | `tariff_calc` | своё | js/main.js:87 | days_per_month=`12`, meeting_hours=`0`, best_tariff=`flex`, total_price=`6700` |
| 12 | `event_view` | своё | index.html:161, index.html:171, index.html:181, events.html:77, … всего 7 | event_id=`networking_2026_11_12` |
| 13 | `event_register` | своё | js/form.js:228 (после ответа `ok: true`) | event_id=`portfolio_2026_11_19` |
| 14 | `tour_open` | своё | spaces.html:115 | space_type=`open_space` |
| 15 | `contact_click` ★ | своё | index.html:58, index.html:200, index.html:201, tariffs.html:58, … всего 23 | contact_type=`phone` / `email`, page_section=`header` |
| 16 | `messenger_click` ★ | своё | contacts.html:147, contacts.html:148 | messenger=`telegram` / `whatsapp` |
| 17 | `social_click` | своё | index.html:216, index.html:217, index.html:218, index.html:219, … всего 32 | network=`vk`, page_section=`footer` / `thanks` |
| 18 | `form_error` | своё | js/form.js:129, 148 | field_name=`phone`, error_type=`format` / `required` / `server` |
| 19 | `promo_copy` (по выбору) | своё | js/main.js:109 | promo_code=`FIRST15` |
| 20 | `map_open` (по выбору) | своё | free-day.html:106, free-day.html:107 | map_service=`yandex_maps` / `2gis` |

## Пользовательские параметры (Admin → Custom definitions, Event scope)

| Параметр | Событие | Вопрос отчёта |
|---|---|---|
| `button_name` | cta_click | Какая кнопка заявки сработала |
| `page_section` | cta_click, social_click | В каком блоке страницы был клик |
| `space_type` | space_view, tour_open | Какие зоны интересуют |
| `best_tariff` | tariff_calc | Какой тариф советует калькулятор |
| `event_id` | event_view, event_register | Какие мероприятия привлекают |
| `lead_tariff` | generate_lead | Тариф в заявке |
| `messenger` | messenger_click | Какой мессенджер выбирают |

## Правила

- Имена событий и параметров — snake_case, ≤ 40 символов; значения обрезаются до 100 символов (`cleanParams` в js/analytics.js).
- Имя, телефон и e-mail в GA4 не передаются: ключи `name`, `phone`, `email` отбрасываются, форма не кладёт данные в адрес страницы (отправка через `fetch`).
- `generate_lead` — только после ответа приёмника `{"ok": true}`; при ошибке приёмника — `form_error` с `error_type = "server"`.
- Отладка: открыть сайт с `?ga_debug=1` — ко всем событиям добавится `debug_mode: true` (видно в DebugView); `?ga_debug=0` — выключить. В коде режим по умолчанию выключен.
