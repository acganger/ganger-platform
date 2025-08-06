import { jsPDF } from 'jspdf';
import puppeteer from 'puppeteer';

export interface PDFOptions {
  format?: 'A4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
}

export interface PDFContent {
  title?: string;
  content: string;
  styles?: string;
}

export interface HandoutData {
  patientName: string;
  patientMRN: string;
  date: string;
  providerName: string;
  locationName: string;
  templateContent: string;
  variables?: Record<string, string>;
}

export class PDFGenerator {
  private static defaultOptions: PDFOptions = {
    format: 'A4',
    orientation: 'portrait',
    margin: {
      top: 0.5,
      right: 0.5,
      bottom: 0.5,
      left: 0.5,
    },
    displayHeaderFooter: true,
    printBackground: true,
  };

  static async generateFromHTML(html: string, options: PDFOptions = {}): Promise<Buffer> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: mergedOptions.format,
        landscape: mergedOptions.orientation === 'landscape',
        margin: {
          top: `${mergedOptions.margin?.top}in`,
          right: `${mergedOptions.margin?.right}in`,
          bottom: `${mergedOptions.margin?.bottom}in`,
          left: `${mergedOptions.margin?.left}in`,
        },
        displayHeaderFooter: mergedOptions.displayHeaderFooter,
        headerTemplate: mergedOptions.headerTemplate || '',
        footerTemplate: mergedOptions.footerTemplate || '',
        printBackground: mergedOptions.printBackground,
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  static async generateHandout(data: HandoutData, options: PDFOptions = {}): Promise<Buffer> {
    let content = data.templateContent;
    
    // Replace standard variables
    const standardVariables = {
      patientName: data.patientName,
      patientMRN: data.patientMRN,
      date: data.date,
      providerName: data.providerName,
      locationName: data.locationName,
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString(),
    };

    // Merge with custom variables
    const allVariables = { ...standardVariables, ...data.variables };

    // Replace variables in content
    Object.entries(allVariables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(placeholder, value);
    });

    // Create complete HTML document
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${data.patientName} - Medical Handout</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .patient-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .content {
            line-height: 1.8;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 10px;
            color: #666;
          }
          h1, h2, h3 {
            color: #0066cc;
          }
          .important {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            border-radius: 5px;
            margin: 15px 0;
          }
          .warning {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 10px;
            border-radius: 5px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${data.locationName}</h1>
          <h2>Patient Education Material</h2>
        </div>
        
        <div class="patient-info">
          <strong>Patient:</strong> ${data.patientName}<br>
          <strong>MRN:</strong> ${data.patientMRN}<br>
          <strong>Provider:</strong> ${data.providerName}<br>
          <strong>Date:</strong> ${data.date}
        </div>
        
        <div class="content">
          ${content}
        </div>
        
        <div class="footer">
          Generated on ${new Date().toLocaleString()} | ${data.locationName}
        </div>
      </body>
      </html>
    `;

    return this.generateFromHTML(html, options);
  }

  static async generateInventoryReport(items: any[], locationName: string, options: PDFOptions = {}): Promise<Buffer> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Inventory Report - ${locationName}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            color: #333;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .low-stock {
            background-color: #ffebee;
          }
          .out-of-stock {
            background-color: #f44336;
            color: white;
          }
          .summary {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Inventory Report</h1>
          <h2>${locationName}</h2>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
          <h3>Summary</h3>
          <p>Total Items: ${items.length}</p>
          <p>Low Stock Items: ${items.filter(item => item.quantity_on_hand <= item.reorder_level).length}</p>
          <p>Out of Stock Items: ${items.filter(item => item.quantity_on_hand === 0).length}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Vendor</th>
              <th>On Hand</th>
              <th>Reorder Level</th>
              <th>Unit Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
              let rowClass = '';
              let status = 'OK';
              
              if (item.quantity_on_hand === 0) {
                rowClass = 'out-of-stock';
                status = 'OUT OF STOCK';
              } else if (item.quantity_on_hand <= item.reorder_level) {
                rowClass = 'low-stock';
                status = 'LOW STOCK';
              }
              
              return `
                <tr class="${rowClass}">
                  <td>${item.name}</td>
                  <td>${item.sku}</td>
                  <td>${item.category}</td>
                  <td>${item.vendor}</td>
                  <td>${item.quantity_on_hand}</td>
                  <td>${item.reorder_level}</td>
                  <td>$${item.unit_price.toFixed(2)}</td>
                  <td>${status}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    return this.generateFromHTML(html, options);
  }

  static async generateLabel(text: string, qrCode?: string, size: 'small' | 'medium' | 'large' = 'medium'): Promise<Buffer> {
    const sizes = {
      small: { width: 2, height: 1 },
      medium: { width: 3, height: 2 },
      large: { width: 4, height: 3 },
    };

    const { width, height } = sizes[size];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            margin: 0;
            padding: 10px;
            font-family: 'Arial', sans-serif;
            font-size: 10px;
            width: ${width}in;
            height: ${height}in;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .label {
            width: 100%;
            height: 100%;
            border: 1px solid #000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5px;
            box-sizing: border-box;
          }
          .qr-code {
            margin-bottom: 10px;
          }
          .text {
            font-weight: bold;
            word-wrap: break-word;
          }
        </style>
      </head>
      <body>
        <div class="label">
          ${qrCode ? `<div class="qr-code"><img src="${qrCode}" width="50" height="50"></div>` : ''}
          <div class="text">${text}</div>
        </div>
      </body>
      </html>
    `;

    return this.generateFromHTML(html, {
      format: 'A4',
      orientation: 'portrait',
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  }

  static async generateFromTemplate(templateHtml: string, variables: Record<string, string>, options: PDFOptions = {}): Promise<Buffer> {
    let html = templateHtml;
    
    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(placeholder, value);
    });

    return this.generateFromHTML(html, options);
  }

  /**
   * Generate a simple PDF using jsPDF (alternative to puppeteer for simple documents)
   */
  async generateSimplePDF(content: string, options?: PDFOptions): Promise<Buffer> {
    console.log('[PDFGenerator] Generating simple PDF with jsPDF');
    
    const doc = new jsPDF({
      orientation: options?.orientation || 'portrait',
      unit: 'mm',
      format: options?.format || 'a4'
    });

    // Add content (basic text support)
    const lines = doc.splitTextToSize(content, 180);
    doc.text(lines, 15, 15);

    // TODO: Add more sophisticated formatting when needed
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    return pdfBuffer;
  }
}