/* ТОЧКА СБОРКИ — интерфейс: меню, калькулятор тарифа, промокод, панорама, страница «Спасибо».
   События GA4 отправляются через window.TSAnalytics.track() из js/analytics.js. */
(function () {
  'use strict';

  function track(name, params) {
    if (window.TSAnalytics) window.TSAnalytics.track(name, params);
  }

  /* ---------- Мобильное меню ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });
  }

  /* ---------- Калькулятор тарифа (tariffs.html) ---------- */
  var PRICES = {
    dayPass: 700,          // «Дневной», ₽ за день
    flexBase: 5500,        // «Гибкий»: 10 дней в месяц
    flexDays: 10,
    flexExtraDay: 600,     // каждый следующий день
    fixed: 11000,          // «Фикс» за месяц
    fixedFreeHours: 5,     // часов переговорной включено в «Фикс»
    meetingHour: 900       // переговорная, ₽ за час
  };

  // Стоимость месяца по каждому тарифу; возвращает {day_pass, flex, fixed}
  function calcTotals(days, hours) {
    return {
      day_pass: days * PRICES.dayPass + hours * PRICES.meetingHour,
      flex: PRICES.flexBase + Math.max(0, days - PRICES.flexDays) * PRICES.flexExtraDay + hours * PRICES.meetingHour,
      fixed: PRICES.fixed + Math.max(0, hours - PRICES.fixedFreeHours) * PRICES.meetingHour
    };
  }

  // Самый дешёвый вариант; при равенстве — первый по порядку
  function findBest(totals) {
    return Object.keys(totals).reduce(function (best, key) {
      return totals[key] < totals[best] ? key : best;
    });
  }

  function rub(n) {
    return n.toLocaleString('ru-RU') + ' ₽';
  }

  var calcForm = document.getElementById('calc-form');
  if (calcForm) {
    calcForm.addEventListener('submit', function (evt) {
      evt.preventDefault();
      var daysInput = calcForm.elements.days;
      var hoursInput = calcForm.elements.hours;
      var days = Number(daysInput.value);
      var hours = Number(hoursInput.value);
      var ok = true;
      [daysInput, hoursInput].forEach(function (el) {
        el.removeAttribute('aria-invalid');
        document.getElementById(el.id + '-error').textContent = '';
      });
      if (!Number.isInteger(days) || days < 1 || days > 31) {
        daysInput.setAttribute('aria-invalid', 'true');
        document.getElementById('calc-days-error').textContent = 'Введите целое число от 1 до 31';
        ok = false;
      }
      if (!Number.isInteger(hours) || hours < 0 || hours > 200) {
        hoursInput.setAttribute('aria-invalid', 'true');
        document.getElementById('calc-hours-error').textContent = 'Введите целое число часов от 0 до 200';
        ok = false;
      }
      if (!ok) return;

      var totals = calcTotals(days, hours);
      var best = findBest(totals);
      document.querySelectorAll('.calc__row').forEach(function (row) {
        var key = row.dataset.tariff;
        row.querySelector('[data-total]').textContent = rub(totals[key]);
        row.classList.toggle('is-best', key === best);
      });
      var names = { day_pass: 'Дневной', flex: '«Гибкий»', fixed: '«Фикс»' };
      document.getElementById('calc-summary').textContent =
        'Для ' + days + ' дн. и ' + hours + ' ч переговорной выгоднее всего ' + names[best] + ' — ' + rub(totals[best]) + ' в месяц.';
      track('tariff_calc', { days_per_month: days, meeting_hours: hours, best_tariff: best, total_price: totals[best] });
    });
  }

  /* ---------- Подробности мероприятия (events.html) ---------- */
  document.querySelectorAll('.event-card__more[aria-controls]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var details = document.getElementById(btn.getAttribute('aria-controls'));
      if (!details) return;
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      details.hidden = !open;
    });
  });

  /* ---------- Промокод (free-day.html) ---------- */
  var promoBtn = document.getElementById('promo-copy');
  if (promoBtn) {
    promoBtn.addEventListener('click', function () {
      var code = promoBtn.dataset.promo;
      var done = function () {
        promoBtn.textContent = 'Скопировано';
        track('promo_copy', { promo_code: code });
        setTimeout(function () { promoBtn.textContent = 'Скопировать'; }, 2000);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(code).then(done, function () { selectCode(); done(); });
      } else {
        selectCode(); document.execCommand('copy'); done();
      }
    });
  }
  function selectCode() {
    var range = document.createRange();
    range.selectNodeContents(document.getElementById('promo-code'));
    var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  }

  /* ---------- Панорама 360° (spaces.html): Pannellum грузится только по кнопке ---------- */
  var panoBtn = document.getElementById('pano-open');
  if (panoBtn) {
    panoBtn.addEventListener('click', function () {
      panoBtn.disabled = true;
      panoBtn.textContent = 'Загружаем панораму…';
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
      document.head.appendChild(css);
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
      script.onload = function () {
        var box = document.getElementById('panorama');
        box.classList.add('is-active');
        document.querySelector('.pano__preview').remove();
        panoBtn.remove();
        window.pannellum.viewer('panorama', {
          type: 'equirectangular', panorama: 'img/panorama.jpg', autoLoad: true,
          autoRotate: -2, compass: false, showFullscreenCtrl: true, hfov: 110
        });
      };
      script.onerror = function () {
        panoBtn.disabled = false;
        panoBtn.textContent = 'Не удалось загрузить — попробовать ещё раз';
      };
      document.head.appendChild(script);
    });
  }

  /* ---------- Номер заявки (thanks.html) ---------- */
  var idBox = document.getElementById('request-id');
  if (idBox) {
    var id = null;
    try { id = sessionStorage.getItem('ts_last_request'); } catch (e) { id = null; }
    idBox.textContent = id || 'номер придёт в сообщении от комьюнити-менеджера';
  }
})();
