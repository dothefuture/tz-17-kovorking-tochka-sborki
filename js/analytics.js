/* ТОЧКА СБОРКИ — веб-аналитика GA4.
   Все вызовы gtag('event', …) сайта находятся только в этом файле (ТЗ, п. 4.3).
   1) Кнопки и ссылки размечены атрибутами data-event="имя_события" и data-*-параметрами,
      например: data-event="cta_click" data-button-name="hero_trial" data-page-section="hero".
      Обработчик ниже находит такие элементы и отправляет событие с параметрами.
   2) События, которые зависят от результата (generate_lead, event_register, tariff_calc,
      form_error, promo_copy), другие скрипты отправляют через window.TSAnalytics.track(). */
(function () {
  'use strict';

  var NAME_RE = /^[a-z][a-z0-9_]{0,39}$/;       // snake_case, не длиннее 40 символов
  var MAX_VALUE_LENGTH = 100;                    // значения параметров не длиннее 100 символов
  var FORBIDDEN = ['name', 'phone', 'email', 'tel', 'e_mail', 'fio'];  // персональные данные в GA4 не передаём

  // Режим отладки для DebugView: включается адресом ?ga_debug=1 (и запоминается во вкладке),
  // выключается ?ga_debug=0. В коде по умолчанию выключен.
  function isDebug() {
    try {
      var flag = new URLSearchParams(window.location.search).get('ga_debug');
      if (flag === '1') sessionStorage.setItem('ga_debug', '1');
      if (flag === '0') sessionStorage.removeItem('ga_debug');
      return sessionStorage.getItem('ga_debug') === '1';
    } catch (e) {
      return false;
    }
  }
  var DEBUG = isDebug();

  // Приводит параметры к правилам GA4: имена snake_case, строки ≤ 100 символов, без ПДн.
  function cleanParams(params) {
    var result = {};
    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];
      if (!NAME_RE.test(key) || FORBIDDEN.indexOf(key) !== -1) return;
      if (value === undefined || value === null || value === '') return;
      if (typeof value === 'string') value = value.slice(0, MAX_VALUE_LENGTH);
      result[key] = value;
    });
    return result;
  }

  // Единая точка отправки событий в GA4.
  function track(eventName, params) {
    if (!NAME_RE.test(eventName)) return;
    var payload = cleanParams(params);
    if (DEBUG) payload.debug_mode = true;
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
  }

  // data-button-name → button_name
  function toSnake(camel) {
    return camel.replace(/[A-Z]/g, function (ch) { return '_' + ch.toLowerCase(); });
  }

  // Собирает параметры события из data-атрибутов элемента (кроме самого data-event).
  function paramsFromDataset(el) {
    var params = {};
    Object.keys(el.dataset).forEach(function (key) {
      if (key === 'event') return;
      var value = el.dataset[key];
      params[toSnake(key)] = /^\d+$/.test(value) ? Number(value) : value;
    });
    return params;
  }

  // Делегирование: один обработчик кликов на весь документ.
  document.addEventListener('click', function (evt) {
    var el = evt.target.closest('[data-event]');
    if (!el) return;
    track(el.dataset.event, paramsFromDataset(el));
  });

  window.TSAnalytics = { track: track };
})();
