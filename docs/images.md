# Источники изображений

Все изображения сгенерированы программно (Python + Pillow) для этого проекта; сторонних фото и стоков нет,
лицензионных ограничений нет. Формат WebP или JPEG, каждый файл меньше 300 КБ, у всех `<img>` заполнен `alt`.

| Файл | Где используется | Размер | Как получен |
|---|---|---|---|
| `img/hero.webp` | index.html, первый экран | 900×600, ~10 КБ | Иллюстрация open space (векторные фигуры) |
| `img/space-open.webp` | index.html, spaces.html | 600×400, ~6 КБ | Иллюстрация open space |
| `img/space-office.webp` | index.html, spaces.html | 600×400, ~5 КБ | Иллюстрация кабинета |
| `img/space-meeting.webp` | index.html, spaces.html | 600×400, ~4 КБ | Иллюстрация переговорной |
| `img/space-kitchen.webp` | spaces.html | 600×400, ~4 КБ | Иллюстрация кухни |
| `img/panorama.jpg` | spaces.html, Pannellum | 4096×2048 (2:1), ~154 КБ | Сгенерированная эквидистантная панорама 360° |
| `img/panorama-preview.webp` | spaces.html | 1200×420, ~10 КБ | Фрагмент панорамы |
| `img/og/og-*.jpg` | `og:image` всех страниц | 1200×630, 42–52 КБ | Фон-иллюстрация + текст страницы |
| `favicon.ico`, `img/favicon.svg`, `img/apple-touch-icon.png` | значок сайта | 16–180 px | Логотип «точка сборки» |
| `docs/qr-u-12.png` | афиша на ресепшен | — | QR-код полной ссылки U-12 (библиотека `qrcode`) |
| `files/dogovor-tochka-sborki.pdf` | tariffs.html | ~89 КБ | Образец договора (ReportLab) |
