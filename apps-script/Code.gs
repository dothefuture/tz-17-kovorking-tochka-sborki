/**
 * ТОЧКА СБОРКИ — приёмник заявок (Google Apps Script, веб-приложение).
 * Таблица «TochkaSborki — Leads»: лист leads — заявки, лист events — регистрации на мероприятия.
 *
 * Установка:
 *  1. Создать Google Таблицу «TochkaSborki — Leads» → Расширения → Apps Script → вставить этот код.
 *  2. Выполнить функцию setup() один раз (создаст листы, заголовки, проверки данных и подсветку).
 *  3. Развернуть → Новое развёртывание → Веб-приложение: «Запуск от имени: я», «Доступ: все».
 *  4. URL вида https://script.google.com/macros/s/…/exec вставить в js/form.js (ENDPOINT).
 * Паролей и ключей в коде нет; идентификатор таблицы допускается (ТЗ, п. 6.2).
 */

// Если скрипт создан из таблицы (Расширения → Apps Script), ID можно не указывать.
var SPREADSHEET_ID = '';

var LEAD_HEADERS = ['request_id', 'created_at', 'name', 'phone', 'email', 'tariff', 'team_size', 'visit_date',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'status'];
var EVENT_HEADERS = ['request_id', 'created_at', 'event_id', 'name', 'email',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

var TARIFFS = ['free_day', 'day_pass', 'flex', 'fixed', 'office', 'meeting_room'];
var TEAM_SIZES = ['1', '2_4', '5_8', '9_plus'];
var STATUSES = ['new', 'contacted', 'visit_booked', 'visited', 'paid', 'lost'];
var EVENT_IDS = ['lecture_2026_11_05', 'networking_2026_11_12', 'portfolio_2026_11_19', 'lecture_2026_11_26'];
var UTM_DEFAULTS = { utm_source: 'direct', utm_medium: 'none', utm_campaign: 'not_set', utm_content: 'not_set' };

var MAX_LEN = 200;
var PHONE_RE = /^\+7\d{10}$/;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var REQUEST_ID_RE = /^REQ-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ===================== Веб-приложение ===================== */

function doGet() {
  return json_({ ok: true, service: 'tochka-sborki-leads' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);                       // одна запись за раз — без гонок при дублях
    var data = readParams_(e);
    var type = data.form_type === 'event' ? 'event' : 'lead';
    var error = type === 'event' ? validateEvent_(data) : validateLead_(data);
    if (error) return json_({ ok: false, error: error.message, field: error.field });

    var sheet = getSheet_(type === 'event' ? 'events' : 'leads');
    if (isDuplicate_(sheet, data.request_id)) {
      return json_({ ok: false, error: 'Заявка с таким request_id уже записана', field: 'request_id', duplicate: true });
    }
    var utm = normalizeUtm_(data);
    var now = new Date();
    var row = type === 'event'
      ? [data.request_id, now, data.event_id, safe_(data.name), safe_(data.email),
         utm.utm_source, utm.utm_medium, utm.utm_campaign, utm.utm_content]
      : [data.request_id, now, safe_(data.name), "'" + data.phone, safe_(data.email), data.tariff, data.team_size, // «'» сохраняет «+» в телефоне
         data.visit_date || '', utm.utm_source, utm.utm_medium, utm.utm_campaign, utm.utm_content,
         'new'];                                // status из браузера игнорируется
    sheet.appendRow(row);
    return json_({ ok: true, request_id: data.request_id });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'Внутренняя ошибка приёмника' });
  } finally {
    lock.releaseLock();
  }
}

/* ===================== Проверки ===================== */

function readParams_(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  if ((!p || !p.request_id) && e && e.postData && e.postData.type === 'application/json') {
    p = JSON.parse(e.postData.contents);       // запасной вариант: JSON в теле запроса
  }
  var data = {};
  Object.keys(p).forEach(function (k) { data[k] = String(p[k] == null ? '' : p[k]).trim(); });
  return data;
}

function commonChecks_(data) {
  var keys = Object.keys(data);
  for (var i = 0; i < keys.length; i++) {
    if (data[keys[i]].length > MAX_LEN) return { field: keys[i], message: 'Слишком длинное значение (больше 200 символов)' };
  }
  if (!REQUEST_ID_RE.test(data.request_id || '')) return { field: 'request_id', message: 'Неверный request_id' };
  if (!data.name) return { field: 'name', message: 'Укажите имя' };
  if (data.name.length < 2 || data.name.length > 60) return { field: 'name', message: 'Имя — от 2 до 60 символов' };
  return null;
}

function validateLead_(data) {
  var err = commonChecks_(data);
  if (err) return err;
  if (!data.phone) return { field: 'phone', message: 'Укажите телефон' };
  if (!PHONE_RE.test(data.phone)) return { field: 'phone', message: 'Телефон в формате +7 и 10 цифр' };
  if (data.email && !EMAIL_RE.test(data.email)) return { field: 'email', message: 'Неверный формат e-mail' };
  if (TARIFFS.indexOf(data.tariff) === -1) return { field: 'tariff', message: 'Недопустимый тариф' };
  if (TEAM_SIZES.indexOf(data.team_size) === -1) return { field: 'team_size', message: 'Недопустимый размер команды' };
  if (data.visit_date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.visit_date)) return { field: 'visit_date', message: 'Дата в формате ГГГГ-ММ-ДД' };
    var day = new Date(data.visit_date + 'T12:00:00').getDay();
    if (day === 0 || day === 6) return { field: 'visit_date', message: 'Тест-день — только в будний день' };
  }
  return null;
}

function validateEvent_(data) {
  var err = commonChecks_(data);
  if (err) return err;
  if (EVENT_IDS.indexOf(data.event_id) === -1) return { field: 'event_id', message: 'Неизвестное мероприятие' };
  if (!data.email) return { field: 'email', message: 'Укажите e-mail' };
  if (!EMAIL_RE.test(data.email)) return { field: 'email', message: 'Неверный формат e-mail' };
  return null;
}

function normalizeUtm_(data) {
  var utm = {};
  Object.keys(UTM_DEFAULTS).forEach(function (k) {
    var v = (data[k] || '').toLowerCase().replace(/[^a-z0-9_.\-()]/g, '').slice(0, 100);
    utm[k] = v || UTM_DEFAULTS[k];
  });
  return utm;
}

// Защита от формул в ячейках: «=HYPERLINK(…)» в имени запишется как текст
function safe_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function isDuplicate_(sheet, requestId) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  return sheet.getRange(2, 1, last - 1, 1)
    .createTextFinder(requestId).matchEntireCell(true).findNext() !== null;
}

/* ===================== Таблица ===================== */

function ss_() {
  return SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_(name) {
  var sheet = ss_().getSheetByName(name);
  if (!sheet) throw new Error('Нет листа ' + name + ' — запустите setup()');
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Запустить один раз вручную: листы, заголовки, проверки данных, условное форматирование. */
function setup() {
  var ss = ss_();
  var leads = ensureSheet_(ss, 'leads', LEAD_HEADERS);
  var maxRows = leads.getMaxRows();

  leads.getRange('D2:D').setNumberFormat('@');               // телефон хранится как текст «+7…»
  leads.getRange('H2:H').setNumberFormat('yyyy-mm-dd');
  leads.getRange('B2:B').setNumberFormat('yyyy-mm-dd hh:mm:ss');

  var list = function (values) {
    return SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
  };
  leads.getRange(2, 6, maxRows - 1, 1).setDataValidation(list(TARIFFS));
  leads.getRange(2, 7, maxRows - 1, 1).setDataValidation(list(TEAM_SIZES));
  leads.getRange(2, 13, maxRows - 1, 1).setDataValidation(list(STATUSES));

  // Подсветка: пустые обязательные ячейки (в непустых строках) и повторяющиеся request_id
  var required = ['A', 'B', 'C', 'D', 'F', 'G', 'I', 'J', 'K', 'L', 'M'];
  var rules = required.map(function (col) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND(COUNTA($A2:$M2)>0, ISBLANK(' + col + '2))')
      .setBackground('#F8D7DA').setRanges([leads.getRange(col + '2:' + col)]).build();
  });
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($A2<>"", COUNTIF($A:$A, $A2)>1)')
    .setBackground('#FFE08A').setRanges([leads.getRange('A2:A')]).build());
  leads.setConditionalFormatRules(rules);

  var events = ensureSheet_(ss, 'events', EVENT_HEADERS);
  events.setConditionalFormatRules([SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($A2<>"", COUNTIF($A:$A, $A2)>1)')
    .setBackground('#FFE08A').setRanges([events.getRange('A2:A')]).build()]);

  ensureSheet_(ss, 'ga4_traffic', ['date', 'session_source', 'session_medium', 'session_campaign', 'session_manual_ad_content',
    'sessions', 'engaged_sessions', 'active_users', 'key_events']);
  ensureSheet_(ss, 'ga4_leads', ['date', 'session_source', 'session_campaign', 'generate_lead']);
  setupUtmSheet_(ss);
}

function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#F2E6D0');
  sheet.setFrozenRows(1);
  return sheet;
}

/** Лист utm: реестр ссылок. Полная ссылка собирается формулой из столбцов меток (ТЗ, п. 5.3). */
function setupUtmSheet_(ss) {
  var headers = ['num', 'channel', 'placement', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'page', 'full_url', 'short_url', 'post_url', 'post_date', 'note'];
  var sheet = ensureSheet_(ss, 'utm', headers);
  var props = PropertiesService.getScriptProperties();
  var base = props.getProperty('SITE_URL') || 'https://tz-17-kovorking-tochka-sborki.vercel.app/';
  sheet.getRange('P1').setValue('base_url');
  sheet.getRange('Q1').setValue(base);
  var last = Math.max(sheet.getLastRow(), 13);
  for (var r = 2; r <= last; r++) {
    sheet.getRange(r, 10).setFormula(
      '=IF(D' + r + '="","",CONCATENATE($Q$1, REGEXEXTRACT(I' + r + ',"^[^#]*"),' +
      '"?utm_source=",D' + r + ',"&utm_medium=",E' + r + ',"&utm_campaign=",F' + r + ',"&utm_content=",G' + r + ',' +
      'IF(H' + r + '="","","&utm_term="&H' + r + '),IFERROR(REGEXEXTRACT(I' + r + ',"#.*"),"")))');
  }
}
