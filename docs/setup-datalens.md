# Дашборд Yandex DataLens (ТЗ, п. 8.4)

## Данные
1. GA4 → исследование «ТОЧКА СБОРКИ · Свободная форма»: добавить измерение **Date**, экспорт → Google Sheets/CSV.
   Вставить в листы `ga4_traffic` (date, source, medium, campaign, content, sessions, engaged_sessions, active_users, key_events)
   и `ga4_leads` (date, source, campaign, generate_lead) **без служебных строк и строки «Общий итог»**.
2. Значения GA4 привести к виду формы: `(direct)` → `direct`, `(none)` → `none`, `(not set)` → `not_set`
   (Найти и заменить в листе или вычисляемое поле `REPLACE([source], "(direct)", "direct")`).

## Подключения и датасеты
DataLens (datalens.yandex.ru) → Подключения → **Google Sheets** → ссылка на «TochkaSborki — Leads».
- Датасет **leads**: лист `leads`. Поля `name`, `phone`, `email` → **скрыть** (не выводятся нигде). `created_at` → тип «Дата».
- Датасет **ga4_traffic**, датасет **ga4_leads**.

## Воркбук «ТОЧКА СБОРКИ — free_day_nov_2026», 3 вкладки
| Вкладка | Виджеты |
|---|---|
| Трафик | индикаторы SUM(sessions), SUM(active_users), SUM(generate_lead); линия сеансов по date; таблица source × campaign; селекторы **периода** (закреплён) и источника |
| Заявки | индикаторы «Всего заявок» `COUNTD([request_id])`, «Новые» `COUNTD_IF([request_id], [status]="new")`, «Оплатил тариф» `COUNTD_IF([request_id], [status]="paid")`; столбцы по status; заявки по utm_source и по дням; селекторы периода (закреплён) и статуса |
| Кампании | таблица по source + campaign: sessions и generate_lead (GA4), заявки и заявки в `paid` (leads); связи датасетов — **только** по source, campaign и дате; селектор периода (закреплён) |

На каждой вкладке селектор периода влияет на все виджеты (Настройки селектора → «Влияет на: все»).
Доступ к воркбуку: «Просмотр» для e-mail Заказчика, публичную ссылку **не** создавать. Снимки вкладок → `screens/datalens/`.
