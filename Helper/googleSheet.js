const { google } = require('googleapis');
const keys = require('../sheet.json');

const auth = new google.auth.JWT(
  keys.client_email,
  null,
  keys.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);
const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = '1IgV3g_yazQuwElyV8uSe59rRkzygprHzvDNZLTmn1nk';
/**
 * Append data to a specific sheet tab.
 * @param {Object} data - The form or register data.
 * @param {string} tabName - The sheet tab name to write into.
 */
async function appendFormDataToSheet(data, tabName = 'Form') {
  const values = [];

  if (tabName === 'Register') {
    values.push([
      data.agentName || '',
      data.email || '',
      data.ipAddress || '',
      data.userAgent || '',
      new Date().toISOString()
    ]);
  } else if (tabName === 'Form') {
    values.push([
      data.fname || '',
      data.lname || '',
      data.phone || '',
      data.email || '',
      data.zipcode || '',
      data.city || '',
      data.state || '',
      data.address || '',
      data.agentName || '',
      new Date().toISOString(),
      data.campaign || '',
      data.dob || '',
      data.publisher || '',
      data.jornaya_leadid || '',
      data.ip_address || '',
      data. Age || '',
    ]);
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${tabName}!A1`,
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });
}
async function getFormDataByPhone(phone) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Form!A2:P', 
  });
  console.log('sheet resspone', response?.data)
  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    return null;
  }

  const headers = [
    "fname", "lname", "phone", "email", "zipcode", "city", "state",
    "address", "agentName", "timestamp", "campaign", "dob", "publisher",
    "jornaya_leadid", "ip_address", "Age"
  ];

  for (const row of rows) {
    const rowData = {};
    headers.forEach((key, i) => {
      rowData[key] = row[i] || '';
    });

    if (rowData.phone === phone) {
      return rowData;
    }
  }

  return null;
}


module.exports = { appendFormDataToSheet,getFormDataByPhone };
