/**
 * Wedding Planner backend (Google Apps Script)
 * Bound to the planner spreadsheet. Deploy as Web app: Execute as Me, access Anyone.
 */

// CHANGE THIS if your planner page lives at a different address.
var PAGE_URL = 'https://andershyatt.github.io/anders/planner/';

var SPREADSHEET_ID = '1qi3JkuJ2FS-5RH-JXcK7L-8nt-M_0QsWleOo4zYUaXs';
var NOTIFY_EMAIL = 'anders@andershyattmusic.com';
var CHANGE_LOG_SHEET = 'ChangeLog';
var CHANGE_HEADERS = ['When', 'Token', 'Couple', 'By', 'Field', 'Before', 'After'];
var COUPLES_SHEET = 'Couples';
var PLANNER_SHEET = 'Planner';

var COUPLES_HEADERS = ['Token', 'Couple Names', 'Event Date', 'Venue', 'Planner Link', 'Created', 'Last Updated', 'Status',
  'Live music', 'DJ', 'Photo booth',
  'Event Type', 'Venue Address', 'Start Time', 'Length of Service', 'Guest Count', 'Who did you book?', 'Known venue', 'Gender neutral', 'Booking status', 'Updated by', 'Lock override'];
var PLANNER_FIELDS = [
  'Couple photo', 'Names', 'Event type', 'Event date', 'Venue', 'Venue address', 'Start time', 'Length of service',
  'Guest count', 'Who did you book?', 'Wedding website', 'Wedding website password', 'Social media permission', 'IG handle',
  'High school graduation year(s)', 'Wedding colors', 'Dress code', 'Crowd party rating', 'Basic notes', 'Planner (name/contact)', 'Venue manager',
  'Photographer', 'Videographer',
  'Venue contact info', 'Caterer info', 'Floor plan PDF', 'Internet access', 'WiFi network and password', 'Cell reception', 'Ceremony location', 'Ceremony power',
  'Ceremony rain plan', 'Cocktail hour location', 'Cocktail hour power', 'Cocktail hour rain plan', 'Dinner location',
  'Things to remember', 'Songs to learn', 'Timeline', 'Timeline PDF',
  'Photo Booth start/end', 'Photo Booth backdrop', 'Photo Booth template', 'Photo Booth logo/text',
  'Photo Booth props', 'Pre-ceremony music', 'Wedding party processional song',
  'Wedding party processional style (instrumental/vocals)', 'Bridal processional song',
  'Bridal processional style', 'Recessional song', 'Recessional style', 'Recessional cue', 'Live music requests', 'Cocktail hour timing notes', 'Cocktail hour music type', 'Cocktail hour vibe', 'Cocktail hour songs', 'Cocktail hour playlist link',
  'Introductions', 'Toasts/speeches', "Couple's first dance song",
  'First dance format (live/DJ, full/shortened)', 'Father/daughter dance song',
  'Father/daughter format', 'Mother/son dance song', 'Mother/son format', 'DJ music requests',
  'Last song of the night with guests', 'Private last dance', 'Do-not-play list', 'Notes',
  'Pre-ceremony performance', 'Pre-ceremony music type', 'Introductions happening', 'Who is being introduced', 'Couple introduction name', 'First dance choreographed', 'First dance start cue', 'First dance stop cue', 'First dance fade out', 'Father of the bride name', 'Father of the bride dance choreographed', 'Father of the bride start cue', 'Father of the bride stop cue', 'Father of the bride fade out', 'Mother of the groom name', 'Mother of the groom dance choreographed', 'Mother of the groom start cue', 'Mother of the groom stop cue', 'Mother of the groom fade out', 'Other special dance', 'Other announcement notes', 'Dinner music type', 'Dinner songs', 'Dinner music notes', 'Clean music edits', 'Open dancing songs', 'Slow songs preference', 'Slow dance songs', 'Dance floor lighting', 'Private last dance wanted', 'Do not play songs',
  'Introduction songs', 'First dance section', 'Having a first dance', 'Father-daughter section', 'Having a father-daughter dance', 'Mother-son section', 'Having a mother-son dance', 'Private last dance section',
  'Cocktail hour Anders chooses', 'Dinner Anders chooses', 'Open dancing Anders chooses', 'Introductions section',
  'Photo Booth: Names', 'Photo Booth: Event date', 'Photo Booth: Event location', 'Photo Booth: Load-in time', 'Photo Booth: Load-in instructions', 'Photo Booth: Day-of contact', 'Photo Booth: Space', 'Photo Booth: Ceiling height', 'Photo Booth: Weather plan', 'Photo Booth: Terrain', 'Photo Booth: Power', 'Photo Booth: Connectivity', 'Photo Booth: WiFi details', 'Photo Booth: Attendant food', 'Photo Booth: Other info', 'Photo Booth: Backdrop', 'Photo Booth: Print size', 'Photo Booth: Template', 'Photo Booth: Personalization', 'Photo Booth: Props',
  'Wedding party processional notes',
  'Bridal processional notes',
  'Additional processional song',
  'Additional processional style',
  'Additional processional notes',
  'Recessional notes',
  'Officiant microphone',
  'Other ceremony speakers',
  'How late is the photographer scheduled?',
  'How late is the videographer scheduled?',
  'Removed sections',
  'Reception music notes',
  'Reception music Anders chooses',
  'Reception music songs',
  'Collapsed sections',
  'Have a wedding website',
  'Officiant microphone notes',
  'Other ceremony speakers notes',
  'Having parent dances',
  'Parent dances notes',
  'Extra parent dances',
  'Introduction no music',
  'Section renames',
  'Last song of the night notes',
  'Private last dance notes'
];
var PHOTO_FIELD = 'Couple photo';
var FLOORPLAN_FIELD = 'Floor plan PDF';
var FLOORPLAN_FOLDER_NAME = 'Anders Hyatt Music - Floor Plans';
var TIMELINE_FIELD = 'Timeline PDF';
var TIMELINE_FOLDER_NAME = 'Anders Hyatt Music - Timelines';
var FLOORPLAN_MAX_BYTES = 10 * 1024 * 1024;
var PHOTO_FOLDER_NAME = 'Anders Hyatt Music - Couple Photos';
var PHOTO_MAX_BYTES = 8 * 1024 * 1024;
var PHOTO_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif' };
var PLANNER_HEADERS = ['Token', 'Last Updated'].concat(PLANNER_FIELDS);
// Basics: set by Anders in the Couples tab, read-only for the couple. Planner key -> basics key.
var LOCKED_FIELDS = {
  'Names': 'names', 'Event type': 'eventType', 'Event date': 'date', 'Venue': 'venue', 'Venue address': 'venueAddress',
  'Start time': 'startTime', 'Length of service': 'length', 'Guest count': 'guestCount', 'Who did you book?': 'booked'
};
var PLACES_REFERER = 'https://andershyatt.github.io/';

/* ---------- helpers ---------- */

function ss_() {
  try { return SpreadsheetApp.openById(SPREADSHEET_ID); }
  catch (e) { return SpreadsheetApp.getActiveSpreadsheet(); }
}

function sheet_(name, headers) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sh;
}

/** Appends any missing headers at the end of row 1 (never reorders existing columns). */
function ensureHeaders_(sh, headers) {
  var have = sh.getLastColumn() > 0 ? headerRow_(sh) : [];
  var missing = headers.filter(function (h) { return have.indexOf(h) === -1; });
  if (missing.length) sh.getRange(1, have.length + 1, 1, missing.length).setValues([missing]);
  return sh;
}

function couplesSheet_() {
  return ensureHeaders_(sheet_(COUPLES_SHEET, COUPLES_HEADERS), COUPLES_HEADERS);
}

/** "Not yet booked" is the old sheet value. Readers and writers use "Not booked". */
function bookingStage_(value) {
  var text = String(value == null ? '' : value).trim();
  if (text === 'Not yet booked' || text === 'Not booked') return 'Not booked';
  if (text === 'Booked' || text === 'Completed') return text;
  return '';
}

/** Blank = booked (true); only an explicit No/n/false = false. */
function booked_(v) {
  var t = norm_(v);
  return !(t === 'no' || t === 'n' || t === 'false');
}

function norm_(t) { return String(t == null ? '' : t).trim().toLowerCase(); }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function fmtDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, sheetTz_(), 'yyyy-MM-dd');
  return v == null ? '' : String(v);
}

function cellOut_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, sheetTz_(), 'yyyy-MM-dd HH:mm');
  return v == null ? '' : String(v);
}

/** Clock fields only. Timeline text contains the word time and must stay as written. */
function isTimeField_(header) {
  var name = String(header || '').trim();
  if (/timeline/i.test(name)) return false;
  return /time$/i.test(name);
}

function timeLabel_(hour, minute) {
  var suffix = hour < 12 ? 'AM' : 'PM';
  var hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return hour12 + ':' + ('0' + minute).slice(-2) + ' ' + suffix;
}

/** Sheets stores a time-only cell as a Date on 1899-12-30. The planner options are 12:30 AM. */
function plannerTime_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    var clock = Utilities.formatDate(value, sheetTz_(), 'HH:mm');
    var parts = clock.split(':');
    return timeLabel_(Number(parts[0]), Number(parts[1]));
  }
  var text = String(value == null ? '' : value).trim();
  if (!text) return '';
  var twelve = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])$/.exec(text);
  if (twelve) {
    var hour = Number(twelve[1]);
    var suffix = twelve[3].toUpperCase();
    if (suffix === 'AM') hour = hour === 12 ? 0 : hour;
    else hour = hour === 12 ? 12 : hour + 12;
    if (hour > 23) return text;
    return timeLabel_(hour, Number(twelve[2]));
  }
  var sheets = /^1899-\d{2}-\d{2}[ T](\d{1,2}):(\d{2})/.exec(text);
  var plain = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(text);
  var match = sheets || plain;
  if (!match) return text;
  if (Number(match[1]) > 23) return text;
  return timeLabel_(Number(match[1]), Number(match[2]));
}

function fieldOut_(header, value) {
  return isTimeField_(header) ? plannerTime_(value) : cellOut_(value);
}

function headerRow_(sh) {
  var lastCol = Math.max(sh.getLastColumn(), 1);
  return sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
}

/** Returns {row (1-based), values, headers} or null. */
function findByToken_(sh, token) {
  var t = norm_(token);
  if (!t) return null;
  var last = sh.getLastRow();
  if (last < 2) return null;
  var headers = headerRow_(sh);
  var rng = sh.getRange(2, 1, last - 1, headers.length);
  var data = rng.getValues();
  for (var i = 0; i < data.length; i++) {
    if (norm_(data[i][0]) === t) {
      var shown = sh.getRange(i + 2, 1, 1, headers.length).getDisplayValues()[0];
      return { row: i + 2, values: data[i], display: shown, headers: headers };
    }
  }
  return null;
}

function findCouple_(token) {
  var sh = couplesSheet_();
  var hit = findByToken_(sh, token);
  if (!hit) return null;
  var get = function (h) { var i = hit.headers.indexOf(h); return i === -1 ? '' : hit.values[i]; };
  var txt = function (h) { var i = hit.headers.indexOf(h); return i === -1 ? '' : String(hit.display[i] == null ? '' : hit.display[i]).trim(); };
  if (norm_(get('Status')) === 'closed') return null;
  var date = dayOf_(get('Event Date'), hit.display[hit.headers.indexOf('Event Date')]);
  return {
    basics: {
      names: String(get('Couple Names') || '').trim(), eventType: txt('Event Type'), date: date,
      venue: String(get('Venue') || '').trim(), venueAddress: txt('Venue Address'), startTime: txt('Start Time'),
      length: txt('Length of Service'), guestCount: txt('Guest Count'), booked: txt('Who did you book?')
    },
    sheet: sh, row: hit.row, token: String(get('Token')).trim(),
    lastUpdatedCol: hit.headers.indexOf('Last Updated') + 1,
    names: String(get('Couple Names') || ''), date: dayOf_(get('Event Date'), hit.display[hit.headers.indexOf('Event Date')]), venue: String(get('Venue') || ''),
    services: { live: booked_(get('Live music')), dj: booked_(get('DJ')), photobooth: booked_(get('Photo booth')),
      venueQuestions: norm_(get('Known venue')) === 'no' || norm_(get('Known venue')) === 'n' || norm_(get('Known venue')) === 'false' },
    genderNeutral: norm_(get('Gender neutral')) === 'yes',
    bookingStatus: bookingStage_(get('Booking status')),
    knownVenue: !(norm_(get('Known venue')) === 'no' || norm_(get('Known venue')) === 'n' || norm_(get('Known venue')) === 'false'),
    lockOverride: norm_(get('Lock override')) === 'unlocked' ? 'Unlocked' : ''
  };
}

/* ---------- GET ---------- */

function doGet(e) {
  try { ensureDailyDigestTrigger_(); } catch (err) { rememberDigestTriggerError_(err); }
  try {
    var p = (e && e.parameter) || {};
    if (p.action !== 'load') return json_({ ok: false, error: 'unknown_action' });
    return loadResponse_(p.c || p.code);
  } catch (err) {
    return json_({ ok: false, error: 'server_error', message: String(err) });
  }
}

function loadResponse_(token) {
  try {
    var couple = findCouple_(token);
    if (!couple) return json_({ ok: false, error: 'invalid_token' });

    var psh = ensureHeaders_(sheet_(PLANNER_SHEET, PLANNER_HEADERS), PLANNER_HEADERS);
    var hit = findByToken_(psh, couple.token);
    var fields = {};
    PLANNER_FIELDS.forEach(function (f) { fields[f] = ''; });
    var lastUpdated = '';
    if (hit) {
      hit.headers.forEach(function (h, i) {
        if (fields.hasOwnProperty(h)) fields[h] = fieldOut_(h, hit.values[i]);
      });
      if (fields['Event date']) fields['Event date'] = dayOf_(hit.values[hit.headers.indexOf('Event date')], hit.display[hit.headers.indexOf('Event date')]);
      lastUpdated = cellOut_(hit.values[1]);
    } else {
      fields['Names'] = couple.names;
      fields['Event date'] = couple.date;
      fields['Venue'] = couple.venue;
    }
    Object.keys(LOCKED_FIELDS).forEach(function (f) {
      var v = couple.basics[LOCKED_FIELDS[f]];
      if (v) fields[f] = v;
    });
    return json_({
      ok: true,
      basics: couple.basics,
      lockedFields: Object.keys(LOCKED_FIELDS),
      couple: { names: couple.names, date: couple.date, venue: couple.venue },
      fields: fields,
      photo: fields[PHOTO_FIELD] ? photoPreview_(fields[PHOTO_FIELD]) : null,
      floorPlan: fields[FLOORPLAN_FIELD] ? floorPlanInfo_(fields[FLOORPLAN_FIELD], couple.token) : null,
      timelinePdf: fields[TIMELINE_FIELD] ? floorPlanInfo_(fields[TIMELINE_FIELD], couple.token) : null,
      services: couple.services,
      genderNeutral: couple.genderNeutral === true,
      bookingStatus: bookingStage_(couple.bookingStatus),
      knownVenue: couple.knownVenue === true,
      lockOverride: couple.lockOverride === 'Unlocked' ? 'Unlocked' : '',
      lastUpdated: lastUpdated
    });
  } catch (err) {
    return json_({ ok: false, error: 'server_error', message: String(err) });
  }
}

/* ---------- POST ---------- */

function doPost(e) {
  try { ensureDailyDigestTrigger_(); } catch (err) { rememberDigestTriggerError_(err); }
  var lock = LockService.getScriptLock();
  try {
    var body = {};
    try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
    catch (x) { return json_({ ok: false, error: 'bad_json' }); }
    if (body.action === 'resolveSlug') return resolveSlug_(body.slug);
    if (body.action === 'load') return loadResponse_(body.c);
    if (body.action === 'importPlaylist') return importPlaylist_(body);
    if (body.action === 'searchSongs') return searchSongs_(body);
    if (body.action === 'adminList' || body.action === 'adminCouple' || body.action === 'adminAddCouple' || body.action === 'adminSetStatus' || body.action === 'adminDeleteCouple') {
      return adminDispatch_(body);
    }

    var couple = findCouple_(body.c);
    if (!couple) return json_({ ok: false, error: 'invalid_token' });
    if (body.action === 'uploadPhoto') return uploadPhoto_(couple, body, lock);
    if (body.action === 'uploadFloorPlan') return uploadPdf_(couple, body, lock, FLOORPLAN_FIELD, FLOORPLAN_FOLDER_NAME, 'floorPlanFolderId');
    if (body.action === 'uploadTimeline') return uploadPdf_(couple, body, lock, TIMELINE_FIELD, TIMELINE_FOLDER_NAME, 'timelineFolderId');
    if (body.action !== 'uploadPhoto' && body.action !== 'uploadFloorPlan' && body.action !== 'uploadTimeline' && body.action !== 'load' && body.action !== 'importPlaylist') {
      var lockDate = couple.date instanceof Date ? Utilities.formatDate(couple.date, 'America/New_York', 'yyyy-MM-dd') : String(couple.date || '').trim();
      var lockedOn = lockoutIso_(lockDate);
      var today = Utilities.formatDate(new Date(), 'America/New_York', 'yyyy-MM-dd');
      if (couple.lockOverride !== 'Unlocked' && lockedOn && today >= lockedOn) return json_({ ok: false, error: 'locked' });
    }
    var incoming = (body.fields && typeof body.fields === 'object') ? body.fields : {};

    if (!lock.tryLock(20000)) return json_({ ok: false, error: 'busy' });

    var psh = ensureHeaders_(sheet_(PLANNER_SHEET, PLANNER_HEADERS), PLANNER_HEADERS);
    var headers = headerRow_(psh);
    var now = new Date();
    var hit = findByToken_(psh, couple.token);
    var row = hit ? hit.values.slice() : headers.map(function () { return ''; });
    while (row.length < headers.length) row.push('');

    if (!hit) {
      // Prefill from Couples for a new row
      var pre = { 'Names': couple.names, 'Event date': couple.date, 'Venue': couple.venue };
      headers.forEach(function (h, i) { if (pre.hasOwnProperty(h)) row[i] = pre[h]; });
    }
    headers.forEach(function (h, i) {
      if (h === 'Token' || h === 'Last Updated') return;
      if (LOCKED_FIELDS.hasOwnProperty(h)) {
        // Locked basics: ignore the couple's value, mirror the Couples tab instead
        var b = couple.basics[LOCKED_FIELDS[h]];
        if (b) row[i] = /^[=+\-@]/.test(b) ? "'" + b : b;
        return;
      }
      if (PLANNER_FIELDS.indexOf(h) !== -1 && Object.prototype.hasOwnProperty.call(incoming, h)) {
        var v = incoming[h];
        v = v == null ? '' : String(v).slice(0, 50000);
        // Never wipe the stored photo link from a save
        if ((h === PHOTO_FIELD || h === FLOORPLAN_FIELD || h === TIMELINE_FIELD) && !v.trim()) return;
        // Prevent formula injection
        if (/^[=+\-@]/.test(v)) v = "'" + v;
        row[i] = v;
      }
    });
    row[0] = couple.token;
    row[1] = now;

    if (hit) psh.getRange(hit.row, 1, 1, headers.length).setValues([row]);
    else psh.appendRow(row);

    var editor = editorFrom_(body);
    logChanges_(couple.token, couple.names, editor, diffRows_(headers, hit ? hit.values : [], row, incoming));
    stampCouple_(couple, editor, now);
    SpreadsheetApp.flush();
    lock.releaseLock();

    return json_({ ok: true, lastUpdated: cellOut_(now) });
  } catch (err) {
    try { lock.releaseLock(); } catch (x) {}
    return json_({ ok: false, error: 'server_error', message: String(err) });
  }
}

/* ---------- Photo upload ---------- */

var PHOTO_INLINE_MAX = 1.5 * 1024 * 1024;

function dataUrl_(blob) {
  return 'data:' + (blob.getContentType() || 'image/jpeg') + ';base64,' + Utilities.base64Encode(blob.getBytes());
}

function thumbDataUrl_(file) {
  try {
    var t = file.getThumbnail();
    if (t && t.getBytes().length > 0 && t.getBytes().length <= PHOTO_INLINE_MAX) return dataUrl_(t);
  } catch (e) {}
  return null;
}

/** Small inline preview for a stored Drive URL; null on any problem. */
function photoPreview_(url) {
  try {
    var m = /\/d\/([\w-]{10,})/.exec(String(url || '')) || /[?&]id=([\w-]{10,})/.exec(String(url || ''));
    if (!m) return null;
    var file = DriveApp.getFileById(m[1]);
    // Prefer the full photo (sharp enough for a banner); fall back to Drive's small thumbnail.
    var type = String(file.getMimeType() || '');
    if (file.getSize() > 0 && file.getSize() <= PHOTO_INLINE_MAX && !/heic|heif/i.test(type)) return { dataUrl: dataUrl_(file.getBlob()) };
    var thumb = thumbDataUrl_(file);
    if (thumb) return { dataUrl: thumb };
  } catch (e) { console.error('photo preview failed: ' + e); }
  return null;
}

function photoFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('photoFolderId');
  if (id) {
    try { var f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) {}
  }
  var it = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  var folder = it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER_NAME);
  props.setProperty('photoFolderId', folder.getId());
  return folder;
}

function uploadPhoto_(couple, body, lock) {
  try {
    var mime = norm_(body.mimeType);
    var ext = PHOTO_TYPES[mime];
    if (!ext) return json_({ ok: false, error: 'bad_type' });
    var data = String(body.data || '').replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
    if (!data) return json_({ ok: false, error: 'no_data' });
    // Cheap pre-check before decoding (base64 is ~4/3 the size)
    if (data.length > Math.ceil(PHOTO_MAX_BYTES * 4 / 3) + 4) return json_({ ok: false, error: 'too_large' });
    var bytes;
    try { bytes = Utilities.base64Decode(data); } catch (x) { return json_({ ok: false, error: 'bad_data' }); }
    if (!bytes.length) return json_({ ok: false, error: 'no_data' });
    if (bytes.length > PHOTO_MAX_BYTES) return json_({ ok: false, error: 'too_large' });

    var now = new Date();
    var name = couple.token + '-' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '.' + ext;
    var file = photoFolder_().createFile(Utilities.newBlob(bytes, mime, name)); // stays private
    var url = file.getUrl();

    if (!lock.tryLock(20000)) return json_({ ok: false, error: 'busy' });
    var psh = ensureHeaders_(sheet_(PLANNER_SHEET, PLANNER_HEADERS), PLANNER_HEADERS);
    var headers = headerRow_(psh);
    var hit = findByToken_(psh, couple.token);
    var row = hit ? hit.values.slice() : headers.map(function () { return ''; });
    while (row.length < headers.length) row.push('');
    if (!hit) {
      var pre = { 'Names': couple.names, 'Event date': couple.date, 'Venue': couple.venue };
      headers.forEach(function (h, i) { if (pre.hasOwnProperty(h)) row[i] = pre[h]; });
    }
    var pi = headers.indexOf(PHOTO_FIELD);
    if (pi !== -1) row[pi] = url;
    row[0] = couple.token;
    row[1] = now;
    if (hit) psh.getRange(hit.row, 1, 1, headers.length).setValues([row]);
    else psh.appendRow(row);
    var editor = editorFrom_(body);
    var previousPhoto = hit && pi !== -1 ? cellOut_(hit.values[pi]) : '';
    if (previousPhoto !== url) logChanges_(couple.token, couple.names, editor, [{ field: PHOTO_FIELD, before: previousPhoto, after: url }]);
    stampCouple_(couple, editor, now);
    SpreadsheetApp.flush();
    lock.releaseLock();

    var dataUrl = null;
    try {
      dataUrl = bytes.length <= PHOTO_INLINE_MAX
        ? 'data:' + mime + ';base64,' + Utilities.base64Encode(bytes)
        : thumbDataUrl_(file);
    } catch (x) { dataUrl = null; }
    return json_({ ok: true, photo: { url: url, name: name, dataUrl: dataUrl } });
  } catch (err) {
    try { lock.releaseLock(); } catch (x) {}
    return json_({ ok: false, error: 'server_error', message: String(err) });
  }
}

function editorFrom_(body) {
  return adminOk_(body && body.adminKey) ? 'Anders' : 'couple';
}

function stampCouple_(couple, editor, now) {
  if (couple.lastUpdatedCol > 0) {
    var stamp = couple.sheet.getRange(couple.row, couple.lastUpdatedCol);
    stamp.setNumberFormat('yyyy-mm-dd hh:mm');
    stamp.setValue(now);
  }
  var headers = headerRow_(couple.sheet);
  var byCol = headers.indexOf('Updated by');
  if (byCol >= 0) couple.sheet.getRange(couple.row, byCol + 1).setValue(editor === 'Anders' ? 'Anders' : 'couple');
}

function clipChange_(value) {
  var text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  return text.length > 180 ? text.slice(0, 177) + '...' : text;
}

function cmpCell_(value) {
  return cellOut_(value).trim().replace(/ 00:00(?::00)?$/, '');
}

function diffRows_(headers, before, after, only) {
  var changes = [];
  headers.forEach(function (h, i) {
    if (!h || h === 'Token' || h === 'Last Updated' || h === 'Updated by') return;
    if (only && !Object.prototype.hasOwnProperty.call(only, h)) return;
    var prev = cmpCell_(before && before.length > i ? before[i] : '');
    var next = cmpCell_(after && after.length > i ? after[i] : '');
    if (prev === next) return;
    changes.push({ field: h, before: prev.slice(0, 500), after: next.slice(0, 500) });
  });
  return changes;
}

function logChanges_(token, names, editor, changes) {
  if (!changes || !changes.length) return;
  var sh = ensureHeaders_(sheet_(CHANGE_LOG_SHEET, CHANGE_HEADERS), CHANGE_HEADERS);
  var now = new Date();
  var who = editor === 'Anders' ? 'Anders' : 'couple';
  var rows = changes.map(function (change) {
    return [now, token, names || token, who, change.field, change.before, change.after];
  });
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, CHANGE_HEADERS.length).setValues(rows);
  rememberSections_(token, changes);
}

/**
 * The Nov 5 script stopped the per-save "updated their planner" mail and
 * switched to this digest. Creating the clock trigger from doGet/doPost can
 * fail until the script is authorized for installable triggers, and that
 * failure used to be ignored, so the digest never ran. doGet and doPost still
 * install or repair the trigger. If the editor reports an authorization error,
 * run installDailyDigestTrigger once. Run sendDigestNow to mail a test.
 */
function installDailyDigestTrigger() {
  ensureDailyDigestTrigger_();
}

function ensureDailyDigestTrigger_() {
  var spec = 'v2-daily-9-america-new-york';
  var props = PropertiesService.getScriptProperties();
  var triggers = ScriptApp.getProjectTriggers();
  var found = false;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() !== 'sendDailyDigest') continue;
    if (props.getProperty('digestTriggerSpec') === spec) found = true;
    else ScriptApp.deleteTrigger(triggers[i]);
  }
  if (found) return;
  ScriptApp.newTrigger('sendDailyDigest')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .inTimezone('America/New_York')
    .create();
  props.setProperty('digestTriggerSpec', spec);
  props.deleteProperty('digestTriggerError');
}

function rememberDigestTriggerError_(err) {
  try { PropertiesService.getScriptProperties().setProperty('digestTriggerError', String(err)); } catch (ignore) {}
}

function changeTime_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value.getTime();
  if (typeof value === 'number' && isFinite(value)) return Math.round((value - 25569) * 86400000);
  var text = String(value || '').trim();
  if (!text) return NaN;
  var match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(text);
  if (!match) {
    var parsed = new Date(text);
    return isNaN(parsed.getTime()) ? NaN : parsed.getTime();
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4] || 0), Number(match[5] || 0)).getTime();
}

function sendDailyDigest() {
  sendDailyDigest_(false);
}

/** Run once from the script editor to send the digest now, even if nothing changed. */
function sendDigestNow() {
  sendDailyDigest_(true);
}

function digestEscape_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function digestDate_(value) {
  var ymd = ymd_(value);
  var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return String(value || '').trim();
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[Number(match[2]) - 1] + ' ' + Number(match[3]) + ', ' + match[1];
}

function coupleDigestMeta_() {
  var map = {};
  var sh = couplesSheet_();
  var headers = headerRow_(sh);
  var tokenCol = headers.indexOf('Token');
  var nameCol = headers.indexOf('Couple Names');
  var dateCol = headers.indexOf('Event Date');
  var slugCol = headers.indexOf(SHORT_LINK_HEADER);
  if (tokenCol < 0 || sh.getLastRow() < 2) return map;
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
  var display = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getDisplayValues();
  for (var i = 0; i < values.length; i++) {
    var token = String(values[i][tokenCol] || '').trim();
    if (!token) continue;
    var slug = slugCol >= 0 ? String(values[i][slugCol] || '').trim() : '';
    map[token.toLowerCase()] = {
      name: nameCol >= 0 ? String(values[i][nameCol] || '').trim() : '',
      date: dateCol >= 0 ? digestDate_(dayOf_(values[i][dateCol], display[i][dateCol])) : '',
      planner: slug
        ? 'https://andershyattmusic.com/' + slug
        : 'https://andershyattmusic.com/planner/?c=' + encodeURIComponent(token)
    };
  }
  return map;
}

function digestStamp_(when) {
  return when instanceof Date ? Utilities.formatDate(when, 'America/New_York', 'MMM d, yyyy h:mm a') : String(when || '');
}

function sendDailyDigest_(force) {
  try {
    var sh = ensureHeaders_(sheet_(CHANGE_LOG_SHEET, CHANGE_HEADERS), CHANGE_HEADERS);
    var values = sh.getLastRow() < 2 ? [] : sh.getDataRange().getValues();
    var cutoff = Date.now() - 24 * 60 * 60 * 1000;
    var groups = {};
    var order = [];
    for (var i = 1; i < values.length; i++) {
      var when = values[i][0];
      var time = changeTime_(when);
      if (!(time >= cutoff)) continue;
      var token = String(values[i][1] || '').trim();
      if (!token) continue;
      if (!groups[token]) {
        groups[token] = { name: String(values[i][2] || token), changes: [] };
        order.push(token);
      }
      var place = placeFor_(String(values[i][4] || ''));
      groups[token].changes.push({
        time: time,
        stamp: digestStamp_(when),
        by: String(values[i][3] || '').trim() || 'someone',
        section: place.section,
        subsection: place.subsection,
        field: String(values[i][4] || '').trim(),
        before: clipChange_(values[i][5]),
        after: clipChange_(values[i][6])
      });
    }
    if (!order.length) {
      if (sh.getLastRow() >= 2) pruneChangeLog_(sh);
      if (!force) return;
    }
    var meta = coupleDigestMeta_();
    var sheetUrl = 'https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID + '/edit';
    order.sort(function (a, b) {
      var left = (meta[a.toLowerCase()] && meta[a.toLowerCase()].name) || groups[a].name;
      var right = (meta[b.toLowerCase()] && meta[b.toLowerCase()].name) || groups[b].name;
      return left.localeCompare(right);
    });
    var textBlocks = [];
    var htmlBlocks = [];
    order.forEach(function (token) {
      var info = meta[token.toLowerCase()] || {};
      var name = info.name || groups[token].name || token;
      var date = info.date || '';
      var planner = info.planner || ('https://andershyattmusic.com/planner/?c=' + encodeURIComponent(token));
      var changes = groups[token].changes.slice().sort(function (a, b) {
        var section = a.section.localeCompare(b.section);
        if (section) return section;
        var sub = a.subsection.localeCompare(b.subsection);
        if (sub) return sub;
        return a.time - b.time;
      });
      var who = {};
      var latest = '';
      var latestTime = 0;
      changes.forEach(function (change) {
        who[change.by] = true;
        if (change.time >= latestTime) {
          latestTime = change.time;
          latest = change.stamp;
        }
      });
      var whoList = Object.keys(who).join(', ');
      var lines = [
        name + (date ? ' — ' + date : ''),
        'Token: ' + token,
        'Planner: ' + planner,
        'Sheet: ' + sheetUrl,
        'Changed by: ' + whoList,
        'Latest change: ' + latest,
        ''
      ];
      var html = [
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#fffdf8;border:1px solid #e4d8c8;border-radius:12px;">',
        '<tr><td style="padding:16px 16px 8px;font-family:Georgia,serif;">',
        '<div style="font-size:20px;line-height:1.3;color:#1c1916;font-weight:700;">' + digestEscape_(name) + '</div>',
        date ? '<div style="margin-top:2px;font-size:14px;color:#6f655b;">' + digestEscape_(date) + '</div>' : '',
        '<div style="margin-top:4px;font-size:12px;color:#8a7d72;">' + digestEscape_(token) + '</div>',
        '</td></tr>',
        '<tr><td style="padding:0 16px 8px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.45;">',
        '<div><a href="' + digestEscape_(planner) + '" style="color:#4e5c41;">Open planner</a></div>',
        '<div><a href="' + digestEscape_(sheetUrl) + '" style="color:#4e5c41;">Open sheet</a></div>',
        '<div style="margin-top:6px;color:#3c342c;">Changed by ' + digestEscape_(whoList) + '</div>',
        '<div style="color:#6f655b;">Latest change ' + digestEscape_(latest) + '</div>',
        '</td></tr>'
      ];
      var currentSection = '';
      var currentSub = '';
      changes.forEach(function (change) {
        if (change.section !== currentSection) {
          currentSection = change.section;
          currentSub = '';
          lines.push(change.section);
          html.push('<tr><td style="padding:10px 16px 2px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#4e5c41;">' + digestEscape_(change.section) + '</td></tr>');
        }
        if (change.subsection !== currentSub) {
          currentSub = change.subsection;
          lines.push('  ' + change.subsection);
          html.push('<tr><td style="padding:6px 16px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#1c1916;">' + digestEscape_(change.subsection) + '</td></tr>');
        }
        lines.push('    ' + change.field + ': ' + change.after);
        lines.push('    was: ' + change.before);
        lines.push('    ' + change.by + ' · ' + change.stamp);
        html.push(
          '<tr><td style="padding:4px 16px 8px 24px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.4;color:#3c342c;">' +
          '<div><strong>' + digestEscape_(change.field) + ':</strong> ' + digestEscape_(change.after) + '</div>' +
          '<div style="color:#6f655b;font-size:13px;">was: ' + digestEscape_(change.before) + '</div>' +
          '<div style="color:#8a7d72;font-size:12px;">' + digestEscape_(change.by) + ' · ' + digestEscape_(change.stamp) + '</div>' +
          '</td></tr>'
        );
      });
      html.push('</table>');
      textBlocks.push(lines.join('\n'));
      htmlBlocks.push(html.join(''));
    });
    var text = order.length
      ? textBlocks.join('\n\n') + '\n\nOpen the sheet: ' + sheetUrl
      : 'No planner changes in the last 24 hours. This is a test of the daily digest.\n\nOpen the sheet: ' + sheetUrl;
    var htmlBody = order.length
      ? '<div style="margin:0;padding:16px;background:#f4efe7;">' + htmlBlocks.join('') + '</div>'
      : '<div style="margin:0;padding:16px;background:#f4efe7;font-family:Helvetica,Arial,sans-serif;color:#3c342c;">No planner changes in the last 24 hours. This is a test of the daily digest.<br><br><a href="' + digestEscape_(sheetUrl) + '">Open the sheet</a></div>';
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: force && !order.length ? 'Planner digest test' : 'Planner changes in the last 24 hours',
      body: text,
      htmlBody: htmlBody
    });
    if (sh.getLastRow() >= 2) pruneChangeLog_(sh);
  } catch (err) {
    console.error('daily digest failed: ' + err);
    if (force) throw err;
  }
}

function pruneChangeLog_(sh) {
  var cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
  var last = sh.getLastRow();
  if (last < 2) return;
  var when = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = when.length - 1; i >= 0; i--) {
    var value = when[i][0];
    var time = value instanceof Date ? value.getTime() : new Date(value).getTime();
    if (time < cutoff) sh.deleteRow(i + 2);
  }
}

/* ---------- Floor plan upload ---------- */

function pdfFolder_(folderName, propKey) {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(propKey);
  if (id) {
    try { var f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) {}
  }
  var it = DriveApp.getFoldersByName(folderName);
  var folder = it.hasNext() ? it.next() : DriveApp.createFolder(folderName);
  props.setProperty(propKey, folder.getId());
  return folder;
}

/** {name, url} for a stored floor plan URL (name without the token prefix). */
function floorPlanInfo_(url, token) {
  url = String(url || '').trim();
  if (!url) return null;
  var name = 'Floor plan.pdf';
  try {
    var m = /\/d\/([\w-]{10,})/.exec(url) || /[?&]id=([\w-]{10,})/.exec(url);
    if (m) name = DriveApp.getFileById(m[1]).getName();
  } catch (e) {}
  var pre = token + ' - ';
  if (name.indexOf(pre) === 0) name = name.slice(pre.length);
  return { name: name, url: url };
}

/** Shared PDF upload (floor plan, timeline). */
function uploadPdf_(couple, body, lock, field, folderName, propKey) {
  try {
    var raw = String(body.dataUrl || '');
    var mm = /^data:([^;,]*)[^,]*,/.exec(raw);
    var mime = norm_(mm ? mm[1] : body.mimeType);
    var orig = String(body.name || 'floor-plan.pdf').replace(/[\\\/:*?"<>|\r\n]+/g, ' ').trim().slice(0, 150) || 'floor-plan.pdf';
    if (mime !== 'application/pdf' && !(mime === '' || mime === 'application/octet-stream') ) return json_({ ok: false, error: 'bad_type' });
    var data = raw.replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
    if (!data) return json_({ ok: false, error: 'no_data' });
    if (data.length > Math.ceil(FLOORPLAN_MAX_BYTES * 4 / 3) + 4) return json_({ ok: false, error: 'too_large' });
    var bytes;
    try { bytes = Utilities.base64Decode(data); } catch (x) { return json_({ ok: false, error: 'bad_data' }); }
    if (!bytes.length) return json_({ ok: false, error: 'no_data' });
    if (bytes.length > FLOORPLAN_MAX_BYTES) return json_({ ok: false, error: 'too_large' });
    // Must really be a PDF (%PDF magic bytes)
    if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)) return json_({ ok: false, error: 'bad_type' });
    if (!/\.pdf$/i.test(orig)) orig += '.pdf';

    var now = new Date();
    var file = pdfFolder_(folderName, propKey).createFile(Utilities.newBlob(bytes, 'application/pdf', couple.token + ' - ' + orig)); // stays private
    var url = file.getUrl();

    if (!lock.tryLock(20000)) return json_({ ok: false, error: 'busy' });
    var psh = ensureHeaders_(sheet_(PLANNER_SHEET, PLANNER_HEADERS), PLANNER_HEADERS);
    var headers = headerRow_(psh);
    var hit = findByToken_(psh, couple.token);
    var row = hit ? hit.values.slice() : headers.map(function () { return ''; });
    while (row.length < headers.length) row.push('');
    if (!hit) {
      var pre = { 'Names': couple.names, 'Event date': couple.date, 'Venue': couple.venue };
      headers.forEach(function (h, i) { if (pre.hasOwnProperty(h)) row[i] = pre[h]; });
    }
    var fi = headers.indexOf(field);
    if (fi !== -1) row[fi] = url;
    row[0] = couple.token;
    row[1] = now;
    if (hit) psh.getRange(hit.row, 1, 1, headers.length).setValues([row]);
    else psh.appendRow(row);
    var editor = editorFrom_(body);
    var previousFile = hit && fi !== -1 ? cellOut_(hit.values[fi]) : '';
    if (previousFile !== url) logChanges_(couple.token, couple.names, editor, [{ field: field, before: previousFile, after: url }]);
    stampCouple_(couple, editor, now);
    SpreadsheetApp.flush();
    lock.releaseLock();

    return json_({ ok: true, name: orig, url: url });
  } catch (err) {
    try { lock.releaseLock(); } catch (x) {}
    return json_({ ok: false, error: 'server_error', message: String(err) });
  }
}

/* ---------- Menu ---------- */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Planner').addItem('Add couple', 'addCouple').addToUi();
}

function addCouple() {
  var html = HtmlService.createHtmlOutput(ADD_COUPLE_HTML_).setWidth(520).setHeight(720);
  SpreadsheetApp.getUi().showModalDialog(html, 'Add couple');
}

/** Called from the Add couple dialog. Returns {ok, token, link} or {ok:false, error}. */
function addCoupleSubmit(obj) {
  obj = obj || {};
  var clean = function (v, max) {
    v = String(v == null ? '' : v).trim().slice(0, max || 2000);
    return /^[=+\-@]/.test(v) ? "'" + v : v;
  };
  var names = clean(obj.names, 200);
  if (!names) return { ok: false, error: 'Couple names are required.' };
  var dateStr = String(obj.date || '').trim();
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return { ok: false, error: 'Event date is required (YYYY-MM-DD).' };
  var yn = function (v) { return v ? 'Yes' : 'No'; };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = couplesSheet_();
    ensureHeaders_(sh, [SHORT_LINK_HEADER]);
    var token = uniqueToken_(sh, baseToken_(names, m[2] + m[3]));
    var slug = uniqueShortLink_(sh, names, dateStr, 0);
    var link = PAGE_URL + '?c=' + token;
    var vals = {
      'Token': token, 'Couple Names': names, 'Event Date': dateStr, 'Venue': clean(obj.venue, 300), 'Planner Link': link,
      'Created': new Date(), 'Last Updated': '', 'Status': 'active',
      'Live music': yn(obj.live), 'DJ': yn(obj.dj), 'Photo booth': yn(obj.photobooth),
      'Event Type': clean(obj.eventType, 100) || 'Wedding', 'Venue Address': clean(obj.venueAddress, 500),
      'Start Time': clean(obj.startTime, 100), 'Length of Service': clean(obj.length, 100),
      'Guest Count': clean(obj.guestCount, 50), 'Who did you book?': clean(obj.booked, 5000),
      'Known venue': yn(obj.knownVenue), 'Gender neutral': yn(obj.genderNeutral),
      'Booking status': bookingStage_(obj.bookingStatus) || 'Not booked',
      'Short link': slug
    };
    var headers = headerRow_(sh);
    var rowNum = sh.getLastRow() + 1;
    var dCol = headers.indexOf('Event Date') + 1;
    var gCol = headers.indexOf('Guest Count') + 1;
    // Plain text so the date never shifts with time zones
    if (dCol > 0) sh.getRange(rowNum, dCol).setNumberFormat('@');
    if (gCol > 0) sh.getRange(rowNum, gCol).setNumberFormat('@');
    sh.getRange(rowNum, 1, 1, headers.length).setValues([headers.map(function (h) { return vals.hasOwnProperty(h) ? vals[h] : ''; })]);
    SpreadsheetApp.flush();
    return { ok: true, token: token, link: link, slug: slug };
  } finally {
    lock.releaseLock();
  }
}

/** Venue autocomplete for the Add couple dialog (server side; the Places key is referrer-restricted). */
function searchVenues(q) {
  q = String(q || '').trim();
  if (q.length < 2) return [];
  var cache = CacheService.getScriptCache();
  var cacheKey = 'venue:' + q.toLowerCase();
  var hit = cache.get(cacheKey);
  if (hit) {
    try { return JSON.parse(hit); } catch (e) {}
  }
  var key = PropertiesService.getScriptProperties().getProperty('GOOGLE_PLACES_API_KEY');
  if (!key) return [];
  var matches = venueAutocomplete_(q, key);
  if (!matches) matches = venueTextSearch_(q, key);
  if (!matches) return [];
  try { cache.put(cacheKey, JSON.stringify(matches), 21600); } catch (e2) {}
  return matches;
}

function venueAutocomplete_(q, key) {
  var res;
  try {
    res = UrlFetchApp.fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'suggestions.placePrediction.structuredFormat',
      'Referer': PLACES_REFERER
    },
    payload: JSON.stringify({
      input: q,
      includedRegionCodes: ['us'],
      locationBias: {
        circle: { center: { latitude: 40.2, longitude: -75.2 }, radius: 50000 }
      }
    })
  });
  } catch (e) { return null; }
  if (res.getResponseCode() !== 200) return null;
  var suggestions = (JSON.parse(res.getContentText()).suggestions) || [];
  return suggestions.map(function (item) {
    var format = item.placePrediction && item.placePrediction.structuredFormat;
    var name = format && format.mainText && format.mainText.text;
    if (!name) return null;
    return { name: name, address: (format.secondaryText && format.secondaryText.text) || '' };
  }).filter(Boolean).slice(0, 6);
}

function venueTextSearch_(q, key) {
  var res;
  try {
    res = UrlFetchApp.fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress',
      'Referer': PLACES_REFERER
    },
    payload: JSON.stringify({ textQuery: q, regionCode: 'US', pageSize: 6 })
  });
  } catch (e) { return null; }
  if (res.getResponseCode() !== 200) return null;
  var places = (JSON.parse(res.getContentText()).places) || [];
  return places.slice(0, 6).map(function (place) {
    return {
      name: (place.displayName && place.displayName.text) || '',
      address: place.formattedAddress || ''
    };
  }).filter(function (place) { return place.name; });
}

var ADD_COUPLE_HTML_ = [
  '<!DOCTYPE html><html><head><base target="_top"><style>',
  'body{font-family:Arial,sans-serif;font-size:13px;margin:0;padding:12px 16px;color:#222}',
  'label{display:block;font-weight:bold;margin:10px 0 3px}',
  'input[type=text],input[type=date],textarea{width:100%;box-sizing:border-box;padding:6px;font-size:13px;border:1px solid #bbb;border-radius:4px}',
  'textarea{height:70px}.row{display:flex;gap:10px}.row>div{flex:1}',
  '.checks label{display:inline-block;font-weight:normal;margin-right:14px}',
  '.wrap{position:relative}#sugg{position:absolute;left:0;right:0;top:100%;background:#fff;border:1px solid #bbb;z-index:9;max-height:220px;overflow:auto;display:none}',
  '#sugg div{padding:6px;cursor:pointer;border-bottom:1px solid #eee}#sugg div:hover{background:#eef4ff}#sugg small{color:#666;display:block}',
  'button{margin-top:14px;padding:8px 16px;font-size:13px;cursor:pointer}#err{color:#b00;margin-top:8px}',
  '#done{display:none}#link{width:100%;box-sizing:border-box;padding:6px}',
  '</style></head><body>',
  '<div id="form">',
  '<label>Couple names</label><input type="text" id="names" placeholder="Sarah & Mike">',
  '<div class="row"><div><label>Event type</label><input type="text" id="eventType" value="Wedding"></div>',
  '<div><label>Event date</label><input type="date" id="date"></div></div>',
  '<label>Venue</label><div class="wrap"><input type="text" id="venue" autocomplete="off" placeholder="Start typing to search"><div id="sugg"></div></div>',
  '<label>Venue address</label><input type="text" id="venueAddress">',
  '<div class="row"><div><label>Start time</label><input type="text" id="startTime" placeholder="5:00 PM"></div>',
  '<div><label>Length of service</label><input type="text" id="length" placeholder="5 hours"></div>',
  '<div><label>Guest count</label><input type="text" id="guestCount"></div></div>',
  '<label>Who did you book?</label><textarea id="booked" placeholder="Musicians, DJ, etc."></textarea>',
  '<label>Booking status</label><select id="bookingStatus"><option>Booked</option><option>Not booked</option><option>Completed</option></select>',
  '<label>Services booked</label><div class="checks"><label><input type="checkbox" id="live"> Live music</label>',
  '<label><input type="checkbox" id="dj"> DJ</label><label><input type="checkbox" id="photobooth"> Photo booth</label></div>',
  '<div class="checks"><label><input type="checkbox" id="knownVenue"> Known venue (I\'ve played here)</label></div>',
  '<div class="checks"><label><input type="checkbox" id="genderNeutral"> Use gender neutral language for this couple?</label></div>',
  '<button id="go" onclick="submitForm()">Add couple</button> <button onclick="google.script.host.close()">Cancel</button>',
  '<div id="err"></div></div>',
  '<div id="done"><h3>Couple added</h3><p>Token: <b id="tok"></b></p><label>Planner link</label>',
  '<input id="link" readonly><button onclick="copyLink()">Copy link</button> <span id="copied"></span>',
  '<br><button onclick="google.script.host.close()">Close</button></div>',
  '<script>',
  'var $=function(i){return document.getElementById(i)};var t=null,seq=0,mem={};',
  'function hide(){$("sugg").style.display="none"}',
  'function remembered(q){',
  '  var key=q.toLowerCase();',
  '  if(mem[key]) return mem[key];',
  '  var best="",list=null;',
  '  Object.keys(mem).forEach(function(k){',
  '    if(key.indexOf(k)===0 && k.length>best.length){',
  '      best=k;',
  '      list=mem[k].filter(function(p){return (p.name+" "+p.address).toLowerCase().indexOf(key)!==-1});',
  '    }',
  '  });',
  '  return list && list.length ? list : null;',
  '}',
  'function show(list){var s=$("sugg");s.innerHTML="";if(!list.length){hide();return}',
  '  list.forEach(function(p){var d=document.createElement("div");var b=document.createElement("b");b.textContent=p.name;var sm=document.createElement("small");sm.textContent=p.address;',
  '  d.appendChild(b);d.appendChild(sm);d.onmousedown=function(e){e.preventDefault();$("venue").value=p.name;$("venueAddress").value=p.address;hide()};s.appendChild(d)});s.style.display="block"}',
  '$("venue").addEventListener("input",function(){clearTimeout(t);var q=this.value.trim();if(q.length<2){hide();return}',
  '  var local=remembered(q);',
  '  if(local) show(local); else {$("sugg").innerHTML="<div>Searching…</div>";$("sugg").style.display="block"}',
  '  t=setTimeout(function(){var my=++seq,key=q.toLowerCase();',
  '    if(mem[key]){if(my===seq) show(mem[key]);return}',
  '    google.script.run.withSuccessHandler(function(list){list=list||[];mem[key]=list;if(my!==seq)return;show(list)})',
  '      .withFailureHandler(function(){if(my===seq && !local) hide()}).searchVenues(q)},250)});',
  '$("venue").addEventListener("blur",function(){setTimeout(hide,200)});',
  'function submitForm(){$("err").textContent="";var o={};["names","eventType","date","venue","venueAddress","startTime","length","guestCount","booked","bookingStatus"].forEach(function(k){o[k]=$(k).value});',
  ' ["live","dj","photobooth","knownVenue","genderNeutral"].forEach(function(k){o[k]=$(k).checked});',
  ' if(!o.names.trim()){$("err").textContent="Couple names are required.";return}if(!o.date){$("err").textContent="Event date is required.";return}',
  ' $("go").disabled=true;google.script.run.withSuccessHandler(function(r){$("go").disabled=false;if(!r||!r.ok){$("err").textContent=(r&&r.error)||"Error";return}',
  ' $("form").style.display="none";$("done").style.display="block";$("tok").textContent=r.token;$("link").value=r.link})',
  ' .withFailureHandler(function(e){$("go").disabled=false;$("err").textContent=String(e&&e.message||e)}).addCoupleSubmit(o)}',
  'function copyLink(){var l=$("link");l.select();var ok=false;try{ok=document.execCommand("copy")}catch(e){}',
  ' if(navigator.clipboard){navigator.clipboard.writeText(l.value).then(function(){$("copied").textContent="Copied!"},function(){$("copied").textContent=ok?"Copied!":"Select and copy manually"})}else{$("copied").textContent=ok?"Copied!":"Select and copy manually"}}',
  '</script></body></html>'
].join('\n');

function baseToken_(names, mmdd) {
  var words = names.toLowerCase().split(/\s*(?:&|\band\b|\+|,|\/)\s*/)
    .map(function (part) { return (part.trim().split(/\s+/)[0] || '').replace(/[^a-z0-9]/g, ''); })
    .filter(function (w) { return w; });
  if (!words.length) words = ['couple'];
  return words.slice(0, 2).join('-') + '-' + mmdd;
}

function uniqueToken_(sh, base) {
  var existing = {};
  if (sh.getLastRow() >= 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r) { existing[norm_(r[0])] = true; });
  }
  if (!existing[base]) return base;
  for (var n = 2; ; n++) { if (!existing[base + '-' + n]) return base + '-' + n; }
}

/** Run this once from the editor to grant Drive access for couple photos. */
function authorizeDrive() {
  var folder = photoFolder_();
  Logger.log('Drive access OK. Photos folder: ' + folder.getUrl());
}

/** Dates in the Sheet are midnight in the Sheet's own time zone, so format them in that zone (not the script's). */
function sheetTz_() {
  try { return ss_().getSpreadsheetTimeZone() || Session.getScriptTimeZone(); } catch (e) { return Session.getScriptTimeZone(); }
}

/** The calendar day exactly as the Sheet shows it (avoids time-zone shifts), as yyyy-MM-dd. */
function dayOf_(v, shown) {
  var t = String(shown || '').trim();
  var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
  if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(t);
  if (m) { var y = m[3].length === 2 ? '20' + m[3] : m[3]; return y + '-' + ('0' + m[1]).slice(-2) + '-' + ('0' + m[2]).slice(-2); }
  return fmtDate_(v);
}

var SHORT_LINK_HEADER = 'Short link';
var LAST_SECTIONS_HEADER = 'Last sections';

/** Sheet column -> [section, subsection] for the daily digest and pipeline cards. */
var FIELD_PLACE = {
  'Wedding party processional song': ['Ceremony', 'Wedding Party Processional'],
  'Wedding party processional style (instrumental/vocals)': ['Ceremony', 'Wedding Party Processional'],
  'Wedding party processional notes': ['Ceremony', 'Wedding Party Processional'],
  'Bridal processional song': ['Ceremony', 'Bridal Processional'],
  'Bridal processional style': ['Ceremony', 'Bridal Processional'],
  'Bridal processional notes': ['Ceremony', 'Bridal Processional'],
  'Recessional song': ['Ceremony', 'Recessional'],
  'Recessional style': ['Ceremony', 'Recessional'],
  'Recessional notes': ['Ceremony', 'Recessional'],
  'Recessional cue': ['Ceremony', 'Recessional'],
  'Pre-ceremony music': ['Ceremony', 'Pre-ceremony music'],
  'Pre-ceremony music type': ['Ceremony', 'Pre-ceremony music'],
  'Pre-ceremony performance': ['Ceremony', 'Pre-ceremony music'],
  'Officiant microphone': ['Ceremony', 'Ceremony details'],
  'Other ceremony speakers': ['Ceremony', 'Ceremony details'],
  "Couple's first dance song": ['Reception', 'First Dance'],
  'First dance format (live/DJ, full/shortened)': ['Reception', 'First Dance'],
  'First dance section': ['Reception', 'First Dance'],
  'Having a first dance': ['Reception', 'First Dance'],
  'First dance choreographed': ['Reception', 'First Dance'],
  'First dance start cue': ['Reception', 'First Dance'],
  'First dance stop cue': ['Reception', 'First Dance'],
  'First dance fade out': ['Reception', 'First Dance'],
  'Father/daughter dance song': ['Reception', 'Parent Dances'],
  'Father/daughter format': ['Reception', 'Parent Dances'],
  'Father-daughter section': ['Reception', 'Parent Dances'],
  'Having a father-daughter dance': ['Reception', 'Parent Dances'],
  'Mother/son dance song': ['Reception', 'Parent Dances'],
  'Mother/son format': ['Reception', 'Parent Dances'],
  'Mother-son section': ['Reception', 'Parent Dances'],
  'Having a mother-son dance': ['Reception', 'Parent Dances'],
  'Introduction songs': ['Reception', 'Introductions'],
  'Introductions': ['Reception', 'Introductions'],
  'Introductions happening': ['Reception', 'Introductions'],
  'Introductions section': ['Reception', 'Introductions'],
  'Cocktail hour songs': ['Cocktail Hour', 'Cocktail hour music'],
  'Cocktail hour music type': ['Cocktail Hour', 'Cocktail hour music'],
  'Cocktail hour vibe': ['Cocktail Hour', 'Cocktail hour music'],
  'Cocktail hour Anders chooses': ['Cocktail Hour', 'Cocktail hour music'],
  'Open dancing songs': ['Reception', 'Open Dancing'],
  'Open dancing Anders chooses': ['Reception', 'Open Dancing'],
  'Dinner songs': ['Reception', 'Dinner'],
  'Dinner music type': ['Reception', 'Dinner'],
  'Dinner Anders chooses': ['Reception', 'Dinner'],
  'Private last dance': ['Reception', 'Private last dance'],
  'Private last dance wanted': ['Reception', 'Private last dance'],
  'Private last dance section': ['Reception', 'Private last dance'],
  'Do-not-play list': ['Reception', 'Do Not Play'],
  'Do not play songs': ['Reception', 'Do Not Play'],
  'Have a wedding website': ['Details', 'Wedding website'],
  'Wedding website': ['Details', 'Wedding website'],
  'Wedding website password': ['Details', 'Wedding website'],
  'Officiant microphone': ['Ceremony', 'Ceremony details'],
  'Officiant microphone notes': ['Ceremony', 'Ceremony details'],
  'Other ceremony speakers': ['Ceremony', 'Ceremony details'],
  'Other ceremony speakers notes': ['Ceremony', 'Ceremony details'],
  'Having parent dances': ['Reception', 'Parent Dances'],
  'Parent dances notes': ['Reception', 'Parent Dances'],
  'Extra parent dances': ['Reception', 'Parent Dances'],
  'Introduction no music': ['Reception', 'Introductions'],
  'Last song of the night notes': ['Reception', 'Last song of the night'],
  'Private last dance notes': ['Reception', 'Private last dance'],
  'Planner (name/contact)': ['Details', 'Vendors'],
  'Venue manager': ['Details', 'Vendors'],
  'Photographer': ['Details', 'Vendors'],
  'How late is the photographer scheduled?': ['Details', 'Vendors'],
  'Videographer': ['Details', 'Vendors'],
  'How late is the videographer scheduled?': ['Details', 'Vendors'],
  'Caterer info': ['Details', 'Vendors']
};

function placeFor_(field) {
  var name = String(field || '');
  var known = FIELD_PLACE[name];
  if (known) return { section: known[0], subsection: known[1] };
  if (name.indexOf('Photo Booth') === 0) return { section: 'Photo Booth', subsection: name.replace(/^Photo Booth:?\s*/, '') || name };
  if (name.indexOf('Cocktail hour') === 0) return { section: 'Cocktail Hour', subsection: name };
  return { section: 'Planner', subsection: name };
}

function sectionSummary_(changes) {
  var seen = {};
  var parts = [];
  (changes || []).forEach(function (change) {
    var place = placeFor_(change.field);
    var label = place.section + ' › ' + place.subsection;
    if (seen[label]) return;
    seen[label] = true;
    parts.push(label);
  });
  return parts.join(', ');
}

function rememberSections_(token, changes) {
  var summary = sectionSummary_(changes);
  if (!summary) return;
  var sh = couplesSheet_();
  ensureHeaders_(sh, [LAST_SECTIONS_HEADER]);
  var hit = findByToken_(sh, token);
  if (!hit) return;
  var col = hit.headers.indexOf(LAST_SECTIONS_HEADER);
  if (col >= 0) sh.getRange(hit.row, col + 1).setValue(summary);
}

function camelName_(word) {
  var letters = String(word || '').replace(/[^A-Za-z]/g, '');
  if (!letters) return '';
  return letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase();
}

/** First names, alphabetical, CamelCase, joined. "Sarah & Mike Smith" -> MikeSarah. */
function firstNamesSlug_(names) {
  var parts = String(names || '').split(/\s+(?:&|and|\+|\/)\s+|,/i);
  var firsts = [];
  for (var i = 0; i < parts.length; i++) {
    var word = (parts[i].trim().split(/\s+/)[0] || '');
    var camel = camelName_(word);
    if (camel) firsts.push(camel);
  }
  firsts.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
  return firsts.join('');
}

function ymd_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value, sheetTz_(), 'yyyy-MM-dd');
  return dayOf_(value, String(value || ''));
}

function mmddyy_(value) {
  var ymd = ymd_(value);
  var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return '';
  return match[2] + match[3] + match[1].slice(2);
}

/** Public planner URL: the short link when the couple has one, otherwise the token link. */
function plannerUrlsByToken_() {
  var map = {};
  var sh = couplesSheet_();
  var headers = headerRow_(sh);
  var tokenCol = headers.indexOf('Token');
  var slugCol = headers.indexOf(SHORT_LINK_HEADER);
  if (tokenCol < 0 || sh.getLastRow() < 2) return map;
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
  for (var i = 0; i < values.length; i++) {
    var token = String(values[i][tokenCol] || '').trim();
    if (!token) continue;
    var slug = slugCol >= 0 ? String(values[i][slugCol] || '').trim() : '';
    map[token.toLowerCase()] = slug
      ? 'https://andershyattmusic.com/' + slug
      : 'https://andershyattmusic.com/planner/?c=' + encodeURIComponent(token);
  }
  return map;
}

function shortLinkBase_(names, dateValue) {
  var date = mmddyy_(dateValue);
  var who = firstNamesSlug_(names);
  if (!date || !who) return '';
  return date + who + 'Planner';
}

function takenSlugs_(sh, exceptRow) {
  var headers = headerRow_(sh);
  var col = headers.indexOf(SHORT_LINK_HEADER);
  var taken = {};
  if (col < 0 || sh.getLastRow() < 2) return taken;
  var values = sh.getRange(2, col + 1, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (exceptRow && i + 2 === exceptRow) continue;
    var slug = String(values[i][0] || '').trim().toLowerCase();
    if (slug) taken[slug] = true;
  }
  return taken;
}

/** MMDDYY + alphabetical CamelCase first names + Planner. Collisions append 2, 3, ... */
function uniqueShortLink_(sh, names, dateValue, exceptRow) {
  var base = shortLinkBase_(names, dateValue);
  if (!base) return '';
  var taken = takenSlugs_(sh, exceptRow);
  if (!taken[base.toLowerCase()]) return base;
  for (var n = 2; n < 1000; n++) {
    var candidate = base + String(n);
    if (!taken[candidate.toLowerCase()]) return candidate;
  }
  return '';
}

function backfillShortLinks_() {
  var sh = couplesSheet_();
  ensureHeaders_(sh, [SHORT_LINK_HEADER]);
  var headers = headerRow_(sh);
  var nameCol = headers.indexOf('Couple Names');
  var dateCol = headers.indexOf('Event Date');
  var slugCol = headers.indexOf(SHORT_LINK_HEADER);
  if (nameCol < 0 || dateCol < 0 || slugCol < 0 || sh.getLastRow() < 2) return 0;
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
  var taken = {};
  for (var i = 0; i < rows.length; i++) {
    var existing = String(rows[i][slugCol] || '').trim().toLowerCase();
    if (existing) taken[existing] = true;
  }
  var count = 0;
  for (var r = 0; r < rows.length; r++) {
    if (String(rows[r][slugCol] || '').trim()) continue;
    var base = shortLinkBase_(rows[r][nameCol], rows[r][dateCol]);
    if (!base) continue;
    var slug = base;
    if (taken[slug.toLowerCase()]) {
      for (var n = 2; n < 1000; n++) {
        if (!taken[(base + n).toLowerCase()]) { slug = base + n; break; }
      }
    }
    taken[slug.toLowerCase()] = true;
    sh.getRange(r + 2, slugCol + 1).setValue(slug);
    count++;
  }
  if (count) SpreadsheetApp.flush();
  return count;
}

function resolveSlug_(slug) {
  var needle = String(slug || '').trim().replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!/^\d{6}[a-z]+planner\d*$/.test(needle)) return json_({ ok: false, error: 'not_found' });
  function findToken() {
    var sh = couplesSheet_();
    var headers = headerRow_(sh);
    var col = headers.indexOf(SHORT_LINK_HEADER);
    var tokenCol = headers.indexOf('Token');
    if (col < 0 || tokenCol < 0 || sh.getLastRow() < 2) return '';
    var values = sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][col] || '').trim().toLowerCase() === needle) return String(values[i][tokenCol] || '').trim();
    }
    return '';
  }
  var token = findToken();
  if (!token) {
    backfillShortLinks_();
    token = findToken();
  }
  if (!token) return json_({ ok: false, error: 'not_found' });
  return json_({ ok: true, token: token });
}

/* ---------- playlist import ---------- */

function htmlDecode_(value) {
  return String(value || '')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function tracksFromHtml_(html, pattern) {
  var tracks = [];
  var match;
  var re = new RegExp(pattern, 'g');
  while ((match = re.exec(html)) && tracks.length < 100) {
    var title = htmlDecode_(match[1]);
    var artist = htmlDecode_(match[2]);
    if (title) tracks.push({ title: title, artist: artist });
  }
  return tracks;
}

function fetchSpotifyPlaylist_(id) {
  var response = UrlFetchApp.fetch('https://open.spotify.com/embed/playlist/' + id, {
    muteHttpExceptions: true,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (response.getResponseCode() !== 200) return [];
  return tracksFromHtml_(
    response.getContentText(),
    'data-testid="tracklist-row-\\d+"[\\s\\S]*?<h3[^>]*>([^<]*)</h3>[\\s\\S]*?<h4[^>]*>([^<]*)</h4>'
  );
}

function fetchApplePlaylist_(url) {
  var embed = String(url).replace('https://music.apple.com/', 'https://embed.music.apple.com/');
  var response = UrlFetchApp.fetch(embed, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (response.getResponseCode() !== 200) return [];
  var html = response.getContentText();
  var schema = tracksFromHtml_(html, '"name"\\s*:\\s*"([^"]+)"\\s*,\\s*"artistName"\\s*:\\s*"([^"]+)"');
  if (schema.length) return schema;
  return tracksFromHtml_(html, '<h3[^>]*>([^<]*)</h3>[\\s\\S]*?<h4[^>]*>([^<]*)</h4>');
}

function importPlaylist_(body) {
  try {
    var couple = findCouple_(body.c);
    if (!couple) return json_({ ok: false, error: 'invalid_token' });
    var url = String(body.url || '').trim();
    var spotify = /open\.spotify\.com\/(?:embed\/)?playlist\/([A-Za-z0-9]+)/.exec(url);
    var tracks = [];
    if (spotify) tracks = fetchSpotifyPlaylist_(spotify[1]);
    else if (/music\.apple\.com\//.test(url)) tracks = fetchApplePlaylist_(url);
    else return json_({ ok: false, error: 'unsupported_link' });
    if (!tracks.length) return json_({ ok: false, error: 'no_tracks' });
    return json_({ ok: true, tracks: tracks });
  } catch (err) {
    return json_({ ok: false, error: 'server_error', message: String(err) });
  }
}

function lockoutIso_(eventDate) {
  var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(eventDate || '').trim());
  if (!match) return '';
  var utc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) - 7));
  return Utilities.formatDate(utc, 'UTC', 'yyyy-MM-dd');
}


function searchSongs_(body) {
  var q = String(body.q || '').trim();
  if (q.length < 2 || q.length > 80) return json_({ ok: true, songs: [] });
  var cache = CacheService.getScriptCache();
  var key = 'song:' + q.toLowerCase();
  var hit = cache.get(key);
  if (hit) {
    try { return json_(JSON.parse(hit)); } catch (e) {}
  }
  try {
    var url = 'https://itunes.apple.com/search?term=' + encodeURIComponent(q) + '&media=music&entity=song&limit=8';
    var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
    if (res.getResponseCode() !== 200) return json_({ ok: false, error: 'search_failed' });
    var results = (JSON.parse(res.getContentText()).results) || [];
    var songs = [];
    results.slice(0, 8).forEach(function (track) {
      var title = String(track.trackName || '').trim();
      if (!title) return;
      songs.push({
        id: String(track.trackId || title),
        title: title,
        artist: String(track.artistName || '').trim(),
        artwork: String(track.artworkUrl60 || '')
      });
    });
    var payload = { ok: true, songs: songs };
    try { cache.put(key, JSON.stringify(payload), 21600); } catch (e2) {}
    return json_(payload);
  } catch (err) {
    return json_({ ok: false, error: 'search_failed' });
  }
}


function adminOk_(key) {
  var expected = String(PropertiesService.getScriptProperties().getProperty('ADMIN_KEY') || '');
  var given = String(key || '');
  if (!expected) return false;
  var a = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, expected, Utilities.Charset.UTF_8);
  var b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, given, Utilities.Charset.UTF_8);
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= (a[i] & 255) ^ (b[i] & 255);
  return diff === 0;
}

function adminDispatch_(body) {
  if (!adminOk_(body.key)) return json_({ ok: false, error: 'unauthorized' });
  if (body.action === 'adminList') return adminList_();
  if (body.action === 'adminCouple') return adminCouple_(body.token);
  if (body.action === 'adminAddCouple') return adminAddCouple_(body.couple || body);
  if (body.action === 'adminSetStatus') return adminSetStatus_(body);
  if (body.action === 'adminDeleteCouple') return adminDeleteCouple_(body);
  return json_({ ok: false, error: 'unknown_action' });
}


function teamText_(get) {
  var team = String(get('Team') || '').trim();
  return team || String(get('Who did you book?') || '').trim();
}

function updatedStamp_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'America/New_York', 'yyyy-MM-dd HH:mm');
  return v == null ? '' : String(v).trim();
}

function coupleSummary_(get, txt, date) {
  var who = String(get('Updated by') || '').trim();
  return {
    token: String(get('Token') || '').trim(),
    names: String(get('Couple Names') || '').trim(),
    date: date,
    venue: String(get('Venue') || '').trim(),
    venueAddress: txt('Venue Address'),
    eventType: txt('Event Type'),
    startTime: txt('Start Time'),
    length: txt('Length of Service'),
    guestCount: txt('Guest Count'),
    services: { live: booked_(get('Live music')), dj: booked_(get('DJ')), photobooth: booked_(get('Photo booth')) },
    team: teamText_(get),
    bookingStatus: bookingStage_(get('Booking status')),
    slug: String(get(SHORT_LINK_HEADER) || '').trim(),
    lastSections: String(get(LAST_SECTIONS_HEADER) || '').trim(),
    genderNeutral: norm_(get('Gender neutral')) === 'yes',
    knownVenue: !(norm_(get('Known venue')) === 'no' || norm_(get('Known venue')) === 'n' || norm_(get('Known venue')) === 'false'),
    lockOverride: norm_(get('Lock override')) === 'unlocked' ? 'Unlocked' : '',
    photo: '',
    lastUpdated: updatedStamp_(get('Last Updated')),
    updatedBy: who === 'Anders' || who === 'couple' ? who : ''
  };
}

function plannerFieldsFor_(token) {
  var psh = ensureHeaders_(sheet_(PLANNER_SHEET, PLANNER_HEADERS), PLANNER_HEADERS);
  var hit = findByToken_(psh, token);
  var fields = {};
  PLANNER_FIELDS.forEach(function (f) { fields[f] = ''; });
  if (hit) {
    hit.headers.forEach(function (h, i) {
      if (fields.hasOwnProperty(h)) fields[h] = fieldOut_(h, hit.values[i]);
    });
  }
  return fields;
}




function adminCouple_(token) {
  var couple = findCouple_(token);
  if (!couple) return json_({ ok: false, error: 'missing_couple' });
  var sh = couplesSheet_();
  ensureHeaders_(sh, ['Team']);
  var headers = headerRow_(sh);
  var row = sh.getRange(couple.row, 1, 1, headers.length).getValues()[0];
  var display = sh.getRange(couple.row, 1, 1, headers.length).getDisplayValues()[0];
  var get = function (h) { var i = headers.indexOf(h); return i === -1 ? '' : row[i]; };
  var txt = function (h) { var i = headers.indexOf(h); return i === -1 ? '' : String(display[i] == null ? '' : display[i]).trim(); };
  var fields = plannerFieldsFor_(couple.token);
  var photo = fields[PHOTO_FIELD] ? photoPreview_(fields[PHOTO_FIELD]) : null;
  var summary = coupleSummary_(get, txt, couple.date);
  summary.photo = photo && photo.dataUrl ? photo.dataUrl : '';
  return json_({ ok: true, couple: summary, fields: fields });
}

function adminAddCouple_(obj) {
  obj = obj || {};
  var clean = function (v, max) {
    v = String(v == null ? '' : v).trim().slice(0, max || 2000);
    return /^[=+\-@]/.test(v) ? "'" + v : v;
  };
  var names = clean(obj.names, 200);
  if (!names) return json_({ ok: false, error: 'Couple names are required.' });
  var dateStr = String(obj.date || '').trim();
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return json_({ ok: false, error: 'Event date is required (YYYY-MM-DD).' });
  var yn = function (v) { return v ? 'Yes' : 'No'; };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = couplesSheet_();
    ensureHeaders_(sh, ['Team', SHORT_LINK_HEADER]);
    var token = uniqueToken_(sh, baseToken_(names, m[2] + m[3]));
    var slug = uniqueShortLink_(sh, names, dateStr, 0);
    var link = PAGE_URL + '?c=' + token;
    var team = clean(obj.team, 5000);
    var vals = {
      'Token': token, 'Couple Names': names, 'Event Date': dateStr, 'Venue': clean(obj.venue, 300), 'Planner Link': link,
      'Created': new Date(), 'Last Updated': '', 'Status': 'active',
      'Live music': yn(obj.live), 'DJ': yn(obj.dj), 'Photo booth': yn(obj.photobooth),
      'Event Type': clean(obj.eventType, 100) || 'Wedding', 'Venue Address': clean(obj.venueAddress, 500),
      'Start Time': clean(obj.startTime, 100), 'Length of Service': clean(obj.length, 100),
      'Guest Count': clean(obj.guestCount, 50), 'Who did you book?': team, 'Team': team,
      'Known venue': yn(obj.knownVenue), 'Gender neutral': yn(obj.genderNeutral),
      'Booking status': bookingStage_(obj.bookingStatus) || 'Not booked',
      'Short link': slug
    };
    var headers = headerRow_(sh);
    var rowNum = sh.getLastRow() + 1;
    var dCol = headers.indexOf('Event Date') + 1;
    var gCol = headers.indexOf('Guest Count') + 1;
    if (dCol > 0) sh.getRange(rowNum, dCol).setNumberFormat('@');
    if (gCol > 0) sh.getRange(rowNum, gCol).setNumberFormat('@');
    sh.getRange(rowNum, 1, 1, headers.length).setValues([headers.map(function (h) { return vals.hasOwnProperty(h) ? vals[h] : ''; })]);
    SpreadsheetApp.flush();
    return json_({ ok: true, token: token, link: link, slug: slug });
  } finally {
    lock.releaseLock();
  }
}

function adminSetStatus_(body) {
  var couple = findCouple_(body.token);
  if (!couple) return json_({ ok: false, error: 'missing_couple' });
  var sh = couplesSheet_();
  ensureHeaders_(sh, ['Team', 'Updated by']);
  var headers = headerRow_(sh);
  var beforeRow = sh.getRange(couple.row, 1, 1, headers.length).getValues()[0];
  var clean = function (v, max) {
    v = String(v == null ? '' : v).trim().slice(0, max || 2000);
    return /^[=+\-@]/.test(v) ? "'" + v : v;
  };
  var allowed = { 'Booked': true, 'Not booked': true, 'Not yet booked': true, 'Completed': true };
  if (body.bookingStatus != null && body.bookingStatus !== '') {
    if (!allowed[body.bookingStatus]) return json_({ ok: false, error: 'bad_status' });
    var statusCol = headers.indexOf('Booking status');
    if (statusCol >= 0) sh.getRange(couple.row, statusCol + 1).setValue(bookingStage_(body.bookingStatus));
  }
  if (body.team != null) {
    var team = String(body.team).slice(0, 5000);
    ['Team', 'Who did you book?'].forEach(function (name) {
      var col = headers.indexOf(name);
      if (col >= 0) sh.getRange(couple.row, col + 1).setValue(team);
    });
  }
  if (body.services) {
    var yn = function (v) { return v ? 'Yes' : 'No'; };
    var serviceCols = { live: 'Live music', dj: 'DJ', photobooth: 'Photo booth' };
    Object.keys(serviceCols).forEach(function (key) {
      if (body.services[key] == null) return;
      var col = headers.indexOf(serviceCols[key]);
      if (col >= 0) sh.getRange(couple.row, col + 1).setValue(yn(!!body.services[key]));
    });
  }
  if (body.date != null && String(body.date).trim() !== '') {
    var dateStr = String(body.date).trim();
    if (!/^(\d{4})-(\d{2})-(\d{2})$/.test(dateStr)) return json_({ ok: false, error: 'bad_date' });
    var dateCol = headers.indexOf('Event Date');
    if (dateCol >= 0) {
      sh.getRange(couple.row, dateCol + 1).setNumberFormat('@');
      sh.getRange(couple.row, dateCol + 1).setValue(dateStr);
    }
  }
  if (body.venue != null) {
    var venueCol = headers.indexOf('Venue');
    if (venueCol >= 0) sh.getRange(couple.row, venueCol + 1).setValue(clean(body.venue, 300));
  }
  if (body.venueAddress != null) {
    var addressCol = headers.indexOf('Venue Address');
    if (addressCol >= 0) sh.getRange(couple.row, addressCol + 1).setValue(clean(body.venueAddress, 500));
  }
  if (body.guestCount != null) {
    var guestCol = headers.indexOf('Guest Count');
    if (guestCol >= 0) {
      sh.getRange(couple.row, guestCol + 1).setNumberFormat('@');
      sh.getRange(couple.row, guestCol + 1).setValue(clean(body.guestCount, 50));
    }
  }
  if (body.lockOverride != null) {
    ensureHeaders_(sh, ['Lock override']);
    headers = headerRow_(sh);
    var lockCol = headers.indexOf('Lock override');
    if (lockCol >= 0) sh.getRange(couple.row, lockCol + 1).setValue(norm_(body.lockOverride) === 'unlocked' ? 'Unlocked' : '');
  }
  var updated = headers.indexOf('Last Updated');
  var by = headers.indexOf('Updated by');
  if (updated >= 0) {
    var stamp = sh.getRange(couple.row, updated + 1);
    stamp.setNumberFormat('yyyy-mm-dd hh:mm');
    stamp.setValue(new Date());
  }
  if (by >= 0) sh.getRange(couple.row, by + 1).setValue('Anders');
  var afterRow = sh.getRange(couple.row, 1, 1, headers.length).getValues()[0];
  logChanges_(couple.token, couple.names, 'Anders', diffRows_(headers, beforeRow, afterRow));
  return json_({ ok: true });
}







function adminDeleteCouple_(body) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var couple = findCouple_(body.token);
    if (!couple) return json_({ ok: false, error: 'missing_couple' });
    var token = couple.token;
    var psh = sheet_(PLANNER_SHEET, PLANNER_HEADERS);
    var hit = findByToken_(psh, token);
    if (hit) psh.deleteRow(hit.row);
    couple = findCouple_(token);
    if (couple) couple.sheet.deleteRow(couple.row);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function listThumb_(url) {
  try {
    var m = /\/d\/([\w-]{10,})/.exec(String(url || '')) || /[?&]id=([\w-]{10,})/.exec(String(url || ''));
    if (!m) return '';
    var file = DriveApp.getFileById(m[1]);
    return thumbDataUrl_(file) || '';
  } catch (e) {
    return '';
  }
}

function plannerFieldsByToken_() {
  var psh = ensureHeaders_(sheet_(PLANNER_SHEET, PLANNER_HEADERS), PLANNER_HEADERS);
  var headers = headerRow_(psh);
  var map = {};
  if (psh.getLastRow() < 2) return map;
  var values = psh.getRange(2, 1, psh.getLastRow() - 1, headers.length).getValues();
  values.forEach(function (row) {
    var token = norm_(row[0]);
    if (!token) return;
    var fields = {};
    headers.forEach(function (h, i) {
      if (h === 'Token' || h === 'Last Updated' || h === PHOTO_FIELD) return;
      var text = fieldOut_(h, row[i]);
      if (!String(text).trim()) return;
      fields[h] = text;
    });
    map[token] = fields;
  });
  return map;
}

function adminList_() {
  backfillShortLinks_();
  var sh = couplesSheet_();
  ensureHeaders_(sh, ['Team', SHORT_LINK_HEADER, LAST_SECTIONS_HEADER]);
  var headers = headerRow_(sh);
  var last = sh.getLastRow();
  var couples = [];
  var psh = ensureHeaders_(sheet_(PLANNER_SHEET, PLANNER_HEADERS), PLANNER_HEADERS);
  var pHeaders = headerRow_(psh);
  var photoCol = pHeaders.indexOf(PHOTO_FIELD);
  var photos = {};
  if (photoCol >= 0 && psh.getLastRow() >= 2) {
    var pValues = psh.getRange(2, 1, psh.getLastRow() - 1, pHeaders.length).getValues();
    pValues.forEach(function (row) { photos[norm_(row[0])] = row[photoCol]; });
  }
  var fieldMap = plannerFieldsByToken_();
  if (last >= 2) {
    var values = sh.getRange(2, 1, last - 1, headers.length).getValues();
    var display = sh.getRange(2, 1, last - 1, headers.length).getDisplayValues();
    values.forEach(function (row, index) {
      if (norm_(row[0]) === '' || norm_(row[headers.indexOf('Status')]) === 'closed') return;
      var get = function (h) { var i = headers.indexOf(h); return i === -1 ? '' : row[i]; };
      var txt = function (h) { var i = headers.indexOf(h); return i === -1 ? '' : String(display[index][i] == null ? '' : display[index][i]).trim(); };
      var dateCol = headers.indexOf('Event Date');
      var date = dayOf_(get('Event Date'), dateCol === -1 ? '' : display[index][dateCol]);
      var summary = coupleSummary_(get, txt, date);
      summary.photo = listThumb_(photos[norm_(summary.token)] || '');
      summary.fields = fieldMap[norm_(summary.token)] || {};
      couples.push(summary);
    });
  }
  return json_({ ok: true, couples: couples });
}
