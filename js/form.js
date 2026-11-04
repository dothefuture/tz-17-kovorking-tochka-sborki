/* ТОЧКА СБОРКИ — UTM-метки и формы (заявка на contacts.html, регистрация на events.html).
   Данные уходят в приёмник Apps Script (apps-script/Code.gs), который пишет их в Google Таблицу.
   События GA4 отправляются через window.TSAnalytics.track() из js/analytics.js. */
(function () {
  'use strict';

  // Адрес веб-приложения Apps Script (Развернуть → Веб-приложение → URL, оканчивается на /exec).
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbwRpt4EUPzQvfpTcv8s1crz1WBrts-QCzimLNUehwOcCwAgG5q11nAmNDbyeaEUxH9J9w/exec';

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  var UTM_DEFAULTS = { utm_source: 'direct', utm_medium: 'none', utm_campaign: 'not_set', utm_content: 'not_set' };
  var STORAGE_KEY = 'ts_utm';

  function track(name, params) {
    if (window.TSAnalytics) window.TSAnalytics.track(name, params);
  }

  /* ---------- UTM: читаем из адреса и храним в sessionStorage ---------- */
  function saveUtmFromUrl() {
    var query = new URLSearchParams(window.location.search);
    if (!query.get('utm_source')) return;           // новых меток нет — оставляем сохранённые
    var utm = {};
    UTM_KEYS.forEach(function (key) {
      utm[key] = (query.get(key) || '').trim().toLowerCase().slice(0, 200);
    });
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utm)); } catch (e) { /* приватный режим */ }
  }

  function getUtm() {
    var saved = {};
    try { saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { saved = {}; }
    var utm = {};
    UTM_KEYS.forEach(function (key) { utm[key] = saved[key] || UTM_DEFAULTS[key]; });
    return utm;
  }

  /* ---------- Вспомогательные ---------- */
  function makeRequestId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return 'REQ-' + window.crypto.randomUUID();
    }
    return 'REQ-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // «8 (900) 717-17-71», «+7 900 7171771» → «+79007171771»; иначе null
  function normalizePhone(raw) {
    var digits = String(raw || '').replace(/\D/g, '');
    if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) digits = digits.slice(1);
    return digits.length === 10 ? '+7' + digits : null;
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function showError(form, field, message) {
    var input = form.elements[field];
    var box = form.querySelector('#' + input.id + '-error');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', input.id + '-error');
    if (box) box.textContent = message;
  }

  function clearErrors(form) {
    form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
    form.querySelectorAll('.field__error').forEach(function (el) { el.textContent = ''; });
    setStatus(form, '', '');
  }

  function setStatus(form, type, text) {
    var box = form.querySelector('.form__status');
    if (!box) return;
    box.className = 'form__status' + (type ? ' is-' + type : '');
    box.textContent = text;
  }

  function isWeekday(dateStr) {
    var day = new Date(dateStr + 'T12:00:00').getDay();
    return day !== 0 && day !== 6;
  }

  /* ---------- Проверка полей ---------- */
  // Возвращает список ошибок [{field, type, message}]
  function validateLead(form) {
    var errors = [];
    var v = function (n) { return form.elements[n].value.trim(); };
    var name = v('name');
    if (!name) errors.push({ field: 'name', type: 'required', message: 'Укажите имя' });
    else if (name.length < 2 || name.length > 60) errors.push({ field: 'name', type: 'length', message: 'Имя — от 2 до 60 символов' });

    var phone = v('phone');
    if (!phone) errors.push({ field: 'phone', type: 'required', message: 'Укажите телефон' });
    else if (!normalizePhone(phone)) errors.push({ field: 'phone', type: 'format', message: 'Телефон в формате +7 и 10 цифр, например +7 900 717-17-71' });

    var email = v('email');
    if (email && !EMAIL_RE.test(email)) errors.push({ field: 'email', type: 'format', message: 'Проверьте e-mail, например name@mail.ru' });

    if (!v('tariff')) errors.push({ field: 'tariff', type: 'required', message: 'Выберите тариф' });
    if (!v('team_size')) errors.push({ field: 'team_size', type: 'required', message: 'Выберите размер команды' });

    var date = v('visit_date');
    if (date) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      if (new Date(date + 'T12:00:00') < today) errors.push({ field: 'visit_date', type: 'past_date', message: 'Дата уже прошла' });
      else if (!isWeekday(date)) errors.push({ field: 'visit_date', type: 'weekend', message: 'Тест-день проводится в будние дни' });
    }
    if (!form.elements.consent.checked) errors.push({ field: 'consent', type: 'required', message: 'Нужно согласие на обработку персональных данных' });
    return errors;
  }

  function validateEvent(form) {
    var errors = [];
    var v = function (n) { return form.elements[n].value.trim(); };
    if (!v('event_id')) errors.push({ field: 'event_id', type: 'required', message: 'Выберите мероприятие' });
    var name = v('name');
    if (!name) errors.push({ field: 'name', type: 'required', message: 'Укажите имя' });
    else if (name.length < 2 || name.length > 60) errors.push({ field: 'name', type: 'length', message: 'Имя — от 2 до 60 символов' });
    var email = v('email');
    if (!email) errors.push({ field: 'email', type: 'required', message: 'Укажите e-mail' });
    else if (!EMAIL_RE.test(email)) errors.push({ field: 'email', type: 'format', message: 'Проверьте e-mail, например name@mail.ru' });
    if (!form.elements.consent.checked) errors.push({ field: 'consent', type: 'required', message: 'Нужно согласие на обработку персональных данных' });
    return errors;
  }

  function reportErrors(form, errors) {
    errors.forEach(function (err) {
      showError(form, err.field, err.message);
      track('form_error', { field_name: err.field, error_type: err.type, form_id: form.id });
    });
    form.elements[errors[0].field].focus();
  }

  /* ---------- Отправка в Apps Script ---------- */
  // application/x-www-form-urlencoded — «простой» запрос без CORS-preflight, Apps Script читает его из e.parameter
  function send(data) {
    if (ENDPOINT.indexOf('PASTE_DEPLOYMENT_ID') !== -1) {
      return Promise.resolve({ ok: false, error: 'Приёмник заявок ещё не подключён' });
    }
    return fetch(ENDPOINT, { method: 'POST', body: new URLSearchParams(data) })
      .then(function (res) { return res.json(); });
  }

  function serverFail(form, button, message, field) {
    button.disabled = false;
    if (field && form.elements[field] && form.elements[field].id) showError(form, field, message);
    setStatus(form, 'error', message || 'Не удалось отправить. Попробуйте ещё раз или позвоните нам.');
    track('form_error', { field_name: field || 'form', error_type: 'server', form_id: form.id });
  }

  function initLeadForm(form) {
    var requestId = makeRequestId();                 // один id на попытки — повтор не создаст дубль
    var preset = new URLSearchParams(window.location.search).get('tariff');
    if (preset && form.elements.tariff.querySelector('option[value="' + preset + '"]')) {
      form.elements.tariff.value = preset;
    }

    form.addEventListener('submit', function (evt) {
      evt.preventDefault();
      clearErrors(form);
      var errors = validateLead(form);
      if (errors.length) { reportErrors(form, errors); return; }

      var utm = getUtm();
      form.elements.request_id.value = requestId;
      UTM_KEYS.forEach(function (key) { form.elements[key].value = utm[key]; });

      var data = {
        form_type: 'lead',
        request_id: requestId,
        name: form.elements.name.value.trim(),
        phone: normalizePhone(form.elements.phone.value),
        email: form.elements.email.value.trim(),
        tariff: form.elements.tariff.value,
        team_size: form.elements.team_size.value,
        visit_date: form.elements.visit_date.value,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        utm_content: utm.utm_content
      };
      var button = form.querySelector('[type="submit"]');
      button.disabled = true;
      setStatus(form, 'ok', 'Отправляем…');

      send(data).then(function (res) {
        // duplicate: строка с этим request_id уже записана (повторная отправка) — считаем заявку принятой
        if (!res || (res.ok !== true && !res.duplicate)) { serverFail(form, button, res && res.error, res && res.field); return; }
        track('generate_lead', { lead_tariff: data.tariff, team_size: data.team_size, lead_source: data.utm_source });
        try { sessionStorage.setItem('ts_last_request', requestId); } catch (e) { /* ignore */ }
        setTimeout(function () { window.location.href = 'thanks.html'; }, 300);  // время на отправку события
      }).catch(function () { serverFail(form, button); });
    });
  }

  function initEventForm(form) {
    var requestId = makeRequestId();
    // Кнопки «Зарегистрироваться» в карточках выбирают мероприятие в форме
    document.querySelectorAll('[data-register]').forEach(function (btn) {
      btn.addEventListener('click', function () { form.elements.event_id.value = btn.dataset.register; });
    });
    var fromHash = window.location.hash.slice(1);
    if (fromHash && form.elements.event_id.querySelector('option[value="' + fromHash + '"]')) {
      form.elements.event_id.value = fromHash;
    }

    form.addEventListener('submit', function (evt) {
      evt.preventDefault();
      clearErrors(form);
      var errors = validateEvent(form);
      if (errors.length) { reportErrors(form, errors); return; }
      var utm = getUtm();
      var data = {
        form_type: 'event',
        request_id: requestId,
        event_id: form.elements.event_id.value,
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        utm_content: utm.utm_content
      };
      var button = form.querySelector('[type="submit"]');
      button.disabled = true;
      send(data).then(function (res) {
        if (!res || res.ok !== true) { serverFail(form, button, res && res.error, res && res.field); return; }
        track('event_register', { event_id: data.event_id });
        setStatus(form, 'ok', 'Готово! Вы зарегистрированы. Ждём вас в четверг в 19:00.');
        form.reset();
        requestId = makeRequestId();
        button.disabled = false;
      }).catch(function () { serverFail(form, button); });
    });
  }

  saveUtmFromUrl();
  document.querySelectorAll('form[data-form="lead"]').forEach(initLeadForm);
  document.querySelectorAll('form[data-form="event"]').forEach(initEventForm);
})();
