import 'dotenv/config';
import { google } from 'googleapis';

const sheetTitle = process.env.GOOGLE_SHEETS_TAB || 'Orders';
const headers = [
  'Дата создания заказа',
  'Время создания заказа',
  'Имя',
  'Телефон',
  'Комментарий',
  'Названия товаров',
  'Сумма',
  'Доставка/самовывоз',
  'Цена с доставкой'
];

if (!process.env.GOOGLE_SHEETS_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
  console.error('Google Sheets env vars are not set');
  process.exit(1);
}

function sheetRange(range) {
  return `'${sheetTitle.replaceAll("'", "''")}'!${range}`;
}

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheet = await sheets.spreadsheets.get({
  spreadsheetId: process.env.GOOGLE_SHEETS_ID
});
const sheetExists = spreadsheet.data.sheets?.some(sheet => sheet.properties?.title === sheetTitle);

if (!sheetExists) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    requestBody: {
      requests: [{
        addSheet: {
          properties: {
            title: sheetTitle,
            gridProperties: {
              rowCount: 1000,
              columnCount: headers.length
            }
          }
        }
      }]
    }
  });
}

await sheets.spreadsheets.values.update({
  spreadsheetId: process.env.GOOGLE_SHEETS_ID,
  range: sheetRange(`A1:${String.fromCharCode(64 + headers.length)}1`),
  valueInputOption: 'USER_ENTERED',
  requestBody: {
    values: [headers]
  }
});

await sheets.spreadsheets.values.clear({
  spreadsheetId: process.env.GOOGLE_SHEETS_ID,
  range: sheetRange('J:O')
});

console.log(`Google Sheet tab "${sheetTitle}" is ready`);
