/**
 * Captação de leads da Calculadora M&G → Google Sheets.
 *
 * COMO PUBLICAR:
 * 1. Crie (ou abra) uma planilha no Google Sheets.
 * 2. Menu Extensões → Apps Script. Apague o conteúdo e cole este código. Salve.
 * 3. Botão "Implantar" → "Nova implantação".
 *    - Tipo: "App da Web".
 *    - Executar como: "Eu".
 *    - Quem pode acessar: "Qualquer pessoa".
 * 4. Autorize quando pedir. Copie a "URL do app da Web" (termina em /exec).
 * 5. Cole essa URL na constante LEAD_ENDPOINT, no <script> do index.html.
 *
 * Para alterar o código depois: Implantar → Gerenciar implantações → editar (ícone
 * de lápis) → Nova versão → Implantar. (Manter a MESMA implantação preserva a URL.)
 */

var SHEET_NAME = 'Leads';
var HEADERS = ['Data/Hora', 'Nome', 'E-mail', 'WhatsApp', 'Gasto mensal (R$)',
               'Cartão', 'Pontos totais', 'Viagens internacionais', 'Viagens nacionais'];

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
    }

    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    sheet.appendRow([
      new Date(),
      data.nome || '',
      data.email || '',
      data.whatsapp || '',
      data.gasto_mensal || '',
      data.cartao || '',
      data.pontos_totais || '',
      data.viagens_internacionais || '',
      data.viagens_nacionais || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Teste rápido no navegador (GET) — deve responder { ok: true }.
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, msg: 'Endpoint ativo' }))
    .setMimeType(ContentService.MimeType.JSON);
}
