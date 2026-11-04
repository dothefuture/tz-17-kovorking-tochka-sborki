# ТОЧКА СБОРКИ — сайт коворкинга, GA4, UTM и заявки (ТЗ-17/2026)

Практическая работа по дисциплине ОП.03 «Информационные технологии». Исполнитель: ___ (фамилия, имя, группа).

| Что | Ссылка |
|---|---|
| Сайт на Vercel | https://tz-17-kovorking-tochka-sborki.vercel.app |
| Репозиторий | https://github.com/dothefuture/tz-17-kovorking-tochka-sborki |
| Таблица заявок «TochkaSborki — Leads» | ___ |
| Дашборд DataLens | ___ |
| Instagram | ___ |
| Reel с автоответами (ManyChat) | ___ |
| ВКонтакте | ___ |
| Telegram | ___ |
| YouTube | ___ |

**Ресурс GA4:** `G-GJGYBG03CN` («ТОЧКА СБОРКИ — сайт», GMT+03:00 Москва, RUB)
**Доступ Viewer к ресурсу GA4 выдан:** ___ (e-mail Заказчика)

## Состав

| Путь | Что внутри |
|---|---|
| `index.html` … `privacy.html`, `404.html` | 8 страниц + 404, статический HTML без сборки |
| `css/style.css` | общий стиль, адаптив 375 / 768 / 1280 px |
| `js/analytics.js` | **все** вызовы `gtag('event', …)`; делегирование по `data-event`, защита от ПДн, отладка `?ga_debug=1` |
| `js/form.js` | UTM → sessionStorage, форма заявки и регистрации, проверка полей, `fetch` в Apps Script |
| `js/main.js` | меню, калькулятор тарифа, промокод, панорама 360° (Pannellum), номер заявки |
| `apps-script/Code.gs` | приёмник заявок `doPost`, проверка полей, защита от дублей, `setup()` таблицы |
| `files/dogovor-tochka-sborki.pdf` | договор (образец) |
| `docs/prompts.md` | запросы к нейросети |
| `docs/events.md` | таблица 20 событий: файл и строка, параметры |
| `docs/utm.csv`, `docs/qr-u-12.png`, `docs/afisha.pdf` | реестр ссылок, QR-код и афиша для ресепшен |
| `docs/images.md` | источники изображений |
| `docs/report.md` | аналитическая записка (шаблон, заполняется по данным) |
| `docs/setup-*.md` | пошаговые инструкции: GA4, таблица и приёмник, соцсети и ManyChat, DataLens |
| `screens/` | снимки: ga4, utm, instagram, reports, explore, datalens, lighthouse |

## Как запустить локально
```bash
python -m http.server 8000
```
Открыть http://localhost:8000. Отладка событий: http://localhost:8000/?ga_debug=1 → GA4 DebugView.

## Проверка калькулятора (И-13)
12 дней, 0 часов → «Гибкий»: 5 500 + 2 × 600 = **6 700 ₽**, событие `tariff_calc` с `best_tariff = flex`.

---

Не получилось: ___

Нейросеть использовалась для: генерации страниц сайта, стилей, изображений и PDF, кода js/ и apps-script/, реестра UTM, QR-кода и афиши, документации в docs/ (журнал — docs/prompts.md).
