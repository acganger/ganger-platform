import { google } from 'googleapis';

export interface SheetData {
  values: any[][];
  range?: string;
  majorDimension?: 'ROWS' | 'COLUMNS';
}

export interface SheetInfo {
  spreadsheetId: string;
  sheetId: number;
  title: string;
  index: number;
  rowCount: number;
  columnCount: number;
}

export class GoogleSheetsClient {
  private sheets;

  constructor(private auth: any) {
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  static createAuth(credentials: any, scopes: string[]) {
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  }

  async createSpreadsheet(title: string, sheets: string[] = ['Sheet1']) {
    try {
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: { title },
          sheets: sheets.map((sheetTitle, index) => ({
            properties: {
              title: sheetTitle,
              index,
            },
          })),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }

  async getSpreadsheet(spreadsheetId: string) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting spreadsheet:', error);
      throw error;
    }
  }

  async getSheetInfo(spreadsheetId: string): Promise<SheetInfo[]> {
    try {
      const spreadsheet = await this.getSpreadsheet(spreadsheetId);
      return spreadsheet.sheets?.map((sheet: any) => ({
        spreadsheetId,
        sheetId: sheet.properties.sheetId,
        title: sheet.properties.title,
        index: sheet.properties.index,
        rowCount: sheet.properties.gridProperties?.rowCount || 0,
        columnCount: sheet.properties.gridProperties?.columnCount || 0,
      })) || [];
    } catch (error) {
      console.error('Error getting sheet info:', error);
      throw error;
    }
  }

  async readRange(spreadsheetId: string, range: string): Promise<any[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      return response.data.values || [];
    } catch (error) {
      console.error('Error reading range:', error);
      throw error;
    }
  }

  async writeRange(spreadsheetId: string, range: string, values: any[][]) {
    try {
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
          values,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error writing range:', error);
      throw error;
    }
  }

  async appendData(spreadsheetId: string, range: string, values: any[][]) {
    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error appending data:', error);
      throw error;
    }
  }

  async batchUpdate(spreadsheetId: string, requests: any[]) {
    try {
      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error batch updating:', error);
      throw error;
    }
  }

  async addSheet(spreadsheetId: string, title: string) {
    try {
      const response = await this.batchUpdate(spreadsheetId, [
        {
          addSheet: {
            properties: {
              title,
            },
          },
        },
      ]);
      return response.replies?.[0].addSheet;
    } catch (error) {
      console.error('Error adding sheet:', error);
      throw error;
    }
  }

  async deleteSheet(spreadsheetId: string, sheetId: number) {
    try {
      const response = await this.batchUpdate(spreadsheetId, [
        {
          deleteSheet: {
            sheetId,
          },
        },
      ]);
      return response;
    } catch (error) {
      console.error('Error deleting sheet:', error);
      throw error;
    }
  }

  async formatCells(spreadsheetId: string, sheetId: number, startRow: number, endRow: number, startCol: number, endCol: number, format: any) {
    try {
      const response = await this.batchUpdate(spreadsheetId, [
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: startRow,
              endRowIndex: endRow,
              startColumnIndex: startCol,
              endColumnIndex: endCol,
            },
            cell: {
              userEnteredFormat: format,
            },
            fields: 'userEnteredFormat',
          },
        },
      ]);
      return response;
    } catch (error) {
      console.error('Error formatting cells:', error);
      throw error;
    }
  }

  async exportToCSV(spreadsheetId: string, sheetId: number): Promise<string> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
        ranges: [`${sheetId}!A:Z`],
      });

      const values = response.data.sheets?.[0]?.data?.[0]?.rowData || [];
      const csvRows = values.map((row: any) => {
        const cells = row.values || [];
        return cells.map((cell: any) => {
          const value = cell.effectiveValue?.stringValue || 
                       cell.effectiveValue?.numberValue || 
                       cell.effectiveValue?.boolValue || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
      });

      return csvRows.join('\n');
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }
}