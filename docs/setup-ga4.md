# GA4: настройка и проверка (ТЗ, разделы 4 и 8)

## 1. Ресурс и поток (4.1)
1. analytics.google.com → Admin → **Create → Property**: название `ТОЧКА СБОРКИ — сайт`, часовой пояс **(GMT+03:00) Москва**, валюта **Российский рубль (RUB)**.
2. Data streams → **Web** → URL `https://tz-17-kovorking-tochka-sborki.vercel.app`, название `Сайт на Vercel`.
3. В потоке: **Enhanced measurement** включено, в шестерёнке отмечены все пункты, включая **Form interactions** и **File downloads**.
4. Скопировать Measurement ID `G-…` и заменить в репозитории:
   ```bash
   grep -rl "G-XXXXXXXXXX" --include=*.html . | xargs sed -i "s/G-XXXXXXXXXX/G-ВАШ_ID/g"
   ```
   Тег стоит первым в `<head>` всех 9 страниц, включая 404.html.

## 2. Пользовательские параметры (4.4)
Admin → Data display → **Custom definitions → Create custom dimension**, Scope = **Event**, 7 штук:
`button_name`, `page_section`, `space_type`, `best_tariff`, `event_id`, `lead_tariff`, `messenger`
(Dimension name = Event parameter = то же имя).

## 3. Ключевые события (4.5)
Admin → Data display → **Events** (или Key events → New key event): отметить **только** `generate_lead`, `contact_click`, `messenger_click`.
Если событие ещё не приходило — создать ключевое событие вручную по имени.

## 4. Проверка в DebugView (4.6)
1. Открыть сайт с `?ga_debug=1` (или расширение Google Analytics Debugger).
2. Admin → **DebugView**, вызвать каждое из 20 событий (таблица — в `docs/events.md`), раскрыть параметры, сделать снимок
   `screens/ga4/<имя_события>.png` (например, `space_view.png`).
3. Отключение: открыть сайт с `?ga_debug=0`. В коде отладка выключена по умолчанию.

Как вызвать события:
| Событие | Действие |
|---|---|
| page_view, scroll | открыть любую страницу, прокрутить до конца |
| click | кнопка Telegram на contacts.html |
| file_download | «Скачать договор (PDF)» на tariffs.html |
| form_start, form_submit, generate_lead | заполнить и отправить форму на contacts.html |
| form_error | отправить форму с телефоном «123» |
| cta_click | «Записаться на тест-день» на главной |
| space_view | заголовок зоны на spaces.html или карточка на главной |
| select_tariff | «Выбрать» у тарифа |
| tariff_calc | «Рассчитать» в калькуляторе |
| event_view | заголовок мероприятия на events.html |
| event_register | форма регистрации на events.html |
| tour_open | «Открыть панораму 360°» на spaces.html |
| contact_click | телефон в шапке или e-mail в подвале |
| messenger_click | Telegram / WhatsApp на contacts.html |
| social_click | иконка соцсети в подвале |
| promo_copy | «Скопировать» на free-day.html |
| map_open | «Открыть в Яндекс Картах» на free-day.html |

## 5. Доступ Заказчику
Admin → Property access management → **+** → e-mail Заказчика → роль **Viewer**. Записать e-mail в README.

## 6. Отчёты (8.1) — снимки в `screens/reports/`
| Отчёт | Настройка | Файл |
|---|---|---|
| Reports snapshot | период проверок, Compare → Preceding period | snapshot.png |
| User acquisition | First user source / medium | user-acquisition.png |
| Traffic acquisition | Session source / medium + Secondary: Session campaign; второй — Session manual ad content | traffic-campaign.png, traffic-content.png |
| Landing page | Engagement → Landing page + Secondary: Session source | landing-source.png |
| Pages and screens | Views, Active users, Average engagement time | pages.png |
| Events | generate_lead, cta_click, space_view, select_tariff, tariff_calc | events.png |
| Key events | разбивка Session source / medium | key-events.png |
| Tech | Tech details → Device category | tech.png |

- Traffic acquisition → **Add comparison**: `Session source exactly matches instagram` и `Session source exactly matches (direct)` → `comparison.png`.
- Traffic acquisition → Share → **Download file → CSV** → `docs/reports/traffic-acquisition.csv`.
- **Library** → Create collection «ТОЧКА СБОРКИ» → новый detail-отчёт «Кампания free_day_nov_2026»: dimensions Session source / medium,
  Session campaign, Session manual ad content; metrics Sessions, Engagement rate, Key events → Save → Publish → `library.png`.

## 7. Исследования (8.2) — снимки в `screens/explore/` (видно значок качества данных)
Сегменты сеансов: **Instagram Sessions** (Session source = instagram), **Direct Sessions** (Session source = (direct)).
| Название | Настройка |
|---|---|
| ТОЧКА СБОРКИ · Свободная форма | Rows: Session source / medium, Session campaign, Session manual ad content; Values: Sessions, Engaged sessions, Key events; Filter: Session campaign = free_day_nov_2026. Вкладка 2 — те же строки + оба сегмента. Экспорт CSV → `docs/reports/free-form.csv` |
| ТОЧКА СБОРКИ · Воронка | Steps: page_view → space_view → cta_click → form_start → generate_lead. Вкладка Open, копия Closed; Breakdown: Session source; вкладка 3 — Device category; сегменты Instagram и Direct |
| ТОЧКА СБОРКИ · Воронка со временем | копия воронки, у шага form_start: «within 10 minutes» после cta_click |
| ТОЧКА СБОРКИ · Путь | Starting point: Page path = /free-day.html, далее 3 шага Page title, раскрыть один узел |
| ТОЧКА СБОРКИ · Обратный путь | Ending point: Event name = generate_lead, 3 предыдущих шага Event name |

## 8. Атрибуция и оповещение (8.3)
- Admin → **Attribution settings**: записать модель и окно в `docs/report.md`.
- Reports snapshot / Insights → **Create custom insight**: Evaluation frequency Daily, Segment Session source = instagram,
  Metric Sessions, Condition «% decrease more than 50», e-mail Исполнителя → снимок `custom-insight.png`.
