/**
 * CT Tracker → Google Sheet sync
 * Paste this into Extensions → Apps Script in your "CT Tracker" Google Sheet.
 * Set SECRET to the same value shown in the app under Setup → Secret key.
 */
const SECRET = 'PASTE-YOUR-SECRET-KEY-HERE';

const COLUMNS = [
  ['Case Code', 'code'],
  ['Surgeon', 'surgeon'],
  ['Procedure', 'procedure'],
  ['Side', 'side'],
  ['Hospital', 'hospital'],
  ['Stage', 'stage'],
  ['Next Action', 'nextAction'],
  ['CT Requested', 'ctRequested'],
  ['Last Follow-up', 'lastFollowUp'],
  ['Follow-up Due', 'followUpDue'],
  ['Surgery Week Of', 'surgeryWeekOf'],
  ['Imaging Center', 'center'],
  ['Center Contact', 'centerContact'],
  ['Center Phone', 'centerPhone'],
  ['Center Email', 'centerEmail'],
  ['Center Fax', 'centerFax'],
  ['Completed', 'completed'],
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.token !== SECRET) return reply({ ok: false, error: 'Secret key does not match' });
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    writeTab(ss, 'Active', body.active || []);
    writeTab(ss, 'Completed', body.completed || []);
    writeAbout(ss, body.sentAt);
    return reply({ ok: true, at: new Date().toISOString() });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

function doGet() {
  return reply({ ok: true, message: 'CT Tracker sync is running.' });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function writeTab(ss, name, rows) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clear();
  const data = [COLUMNS.map(c => c[0])].concat(rows.map(r => COLUMNS.map(c => r[c[1]] == null ? '' : r[c[1]])));
  sh.getRange(1, 1, data.length, COLUMNS.length).setNumberFormat('@').setValues(data); // keep dates as plain YYYY-MM-DD text
  sh.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold').setBackground('#e6f2f3');
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, COLUMNS.length);
}

function writeAbout(ss, sentAt) {
  const sh = ss.getSheetByName('About') || ss.insertSheet('About');
  sh.clear();
  const lines = [
    ['CT Tracker: how to read this sheet'],
    ['Last updated from iPhone: ' + (sentAt || new Date().toISOString())],
    [''],
    ['Purpose: track CT scans requested from imaging centers so surgeons can plan shoulder implants in Materialise.'],
    ['Case Code = patient initials + birth year + side (L/R). Full names and birth dates are only on the iPhone.'],
    ['Stages: CT Requested → CT Received → Uploaded (Completed).'],
    ['Follow-up rule: when Stage is "CT Requested" and Follow-up Due is today or earlier, the imaging center needs a follow-up.'],
    ['"CT Received" means the scan still needs to be uploaded to Materialise.'],
    ['Surgery Week Of = the Monday of the surgery week. Within 2 weeks = urgent.'],
    ['Dates are YYYY-MM-DD. Business days skip weekends (not holidays).'],
  ];
  sh.getRange(1, 1, lines.length, 1).setValues(lines);
  sh.getRange(1, 1).setFontWeight('bold').setFontSize(13);
}

/* ---------- Optional: weekday morning email digest (works even without Duet) ----------
 * Run installDailyDigest() once from the Apps Script editor (select it, click Run, approve).
 */
function installDailyDigest() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'dailyDigest').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyDigest').timeBased().everyDays(1).atHour(7).create();
}

function dailyDigest() {
  const now = new Date();
  if (now.getDay() === 0 || now.getDay() === 6) return;
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Active');
  if (!sh || sh.getLastRow() < 2) return;
  const values = sh.getDataRange().getDisplayValues();
  const head = values.shift();
  const col = name => head.indexOf(name);
  const todayStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const in14 = Utilities.formatDate(new Date(now.getTime() + 14 * 864e5), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const follow = [], upload = [], soon = [];
  values.forEach(r => {
    const code = r[col('Case Code')], surgeon = r[col('Surgeon')], center = r[col('Imaging Center')];
    const due = r[col('Follow-up Due')], stage = r[col('Stage')], wk = r[col('Surgery Week Of')];
    const urgent = /^\d{4}-\d{2}-\d{2}$/.test(wk) && wk <= in14;
    const tag = urgent ? ' ⚠ surgery week of ' + wk : '';
    if (stage === 'CT Requested' && due && due <= todayStr)
      follow.push(`• ${code} (${surgeon}): follow up with ${center} ${r[col('Center Phone')] || ''}${tag}`);
    else if (stage === 'CT Received') upload.push(`• ${code} (${surgeon}): upload to Materialise${tag}`);
    else if (urgent) soon.push(`• ${code} (${surgeon}): waiting on ${center}${tag}`);
  });
  if (!follow.length && !upload.length && !soon.length) return;
  const parts = [];
  if (follow.length) parts.push('FOLLOW UP TODAY\n' + follow.join('\n'));
  if (upload.length) parts.push('UPLOAD TO MATERIALISE\n' + upload.join('\n'));
  if (soon.length) parts.push('SURGERY SOON, STILL WAITING\n' + soon.join('\n'));
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), `CT Tracker: ${follow.length + upload.length} to do today`, parts.join('\n\n'));
}
