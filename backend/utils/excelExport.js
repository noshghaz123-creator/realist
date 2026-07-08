export async function buildExcelBuffer(leads) {
  let XLSX;
  try {
    XLSX = await import('xlsx');
  } catch {
    throw new Error('Excel export requires the xlsx package. Run: npm install (in backend folder).');
  }

  const { flattenForExport } = await import('./propertyRadarMapper.js');
  const rows = leads.map(flattenForExport);
  const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Leads');
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
}
