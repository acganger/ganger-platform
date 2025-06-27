import { SlipData, MedicalSlipContent, CosmeticSlipContent, SelfPayContent } from '../../types';

/**
 * Generates ZPL (Zebra Programming Language) code for thermal printing
 * Optimized for 4-inch thermal printers (like Zebra ZD621/ZD421)
 */
export function generateZPL(slipData: SlipData): string {
  switch (slipData.slipType) {
    case 'medical':
      return generateMedicalSlipZPL(slipData);
    case 'cosmetic':
      return generateCosmeticSlipZPL(slipData);
    case 'self_pay':
      return generateSelfPaySlipZPL(slipData);
    default:
      throw new Error(`Unsupported slip type: ${slipData.slipType}`);
  }
}

function generateMedicalSlipZPL(slipData: SlipData): string {
  const medical = slipData.content.medical as MedicalSlipContent;
  const patient = slipData.patient;
  const provider = slipData.provider;

  let zpl = `^XA`; // Start ZPL

  // Header
  zpl += `^FO20,20^A0N,40,40^FDGANGER DERMATOLOGY^FS`;
  zpl += `^FO20,70^A0N,25,25^FDMEDICAL CHECKOUT SLIP^FS`;
  zpl += `^FO20,105^A0N,20,20^FDDate: ${new Date().toLocaleDateString()}^FS`;
  
  // Separator line
  zpl += `^FO20,130^GB350,2,2^FS`;

  // Patient Information
  let yPos = 150;
  zpl += `^FO20,${yPos}^A0N,25,25^FDPATIENT INFORMATION^FS`;
  yPos += 35;
  zpl += `^FO20,${yPos}^A0N,20,20^FDName: ${patient.name}^FS`;
  yPos += 25;
  zpl += `^FO20,${yPos}^A0N,20,20^FDDOB: ${new Date(patient.dob).toLocaleDateString()}^FS`;
  yPos += 25;
  zpl += `^FO20,${yPos}^A0N,20,20^FDMRN: ${patient.mrn}^FS`;
  yPos += 25;
  zpl += `^FO20,${yPos}^A0N,20,20^FDProvider: ${provider.name}^FS`;
  yPos += 25;

  if (patient.insurance) {
    zpl += `^FO20,${yPos}^A0N,20,20^FDInsurance: ${patient.insurance}^FS`;
    yPos += 25;
  }

  if (patient.balance && patient.balance > 0) {
    zpl += `^FO20,${yPos}^A0N,20,20^FDBalance: $${patient.balance}^FS`;
    yPos += 25;
  }

  // Separator line
  yPos += 10;
  zpl += `^FO20,${yPos}^GB350,1,1^FS`;
  yPos += 20;

  // Visit Information
  if (medical) {
    zpl += `^FO20,${yPos}^A0N,25,25^FDVISIT INFORMATION^FS`;
    yPos += 35;
    zpl += `^FO20,${yPos}^A0N,20,20^FDVisit Type: ${medical.visitInfo?.visitType || 'N/A'}^FS`;
    yPos += 25;
    
    if (medical.visitInfo?.chiefComplaint) {
      zpl += `^FO20,${yPos}^A0N,20,20^FDChief Complaint:^FS`;
      yPos += 25;
      zpl += `^FO20,${yPos}^A0N,18,18^FD${truncateText(medical.visitInfo.chiefComplaint, 35)}^FS`;
      yPos += 25;
    }

    // Follow-up Instructions
    yPos += 10;
    zpl += `^FO20,${yPos}^GB350,1,1^FS`;
    yPos += 20;
    zpl += `^FO20,${yPos}^A0N,25,25^FDFOLLOW-UP INSTRUCTIONS^FS`;
    yPos += 35;
    zpl += `^FO20,${yPos}^A0N,20,20^FDReturn in: ${formatInterval(medical.followUp?.interval)}^FS`;
    yPos += 25;
    zpl += `^FO20,${yPos}^A0N,20,20^FDReason: ${medical.followUp?.reason || 'Routine'}^FS`;
    yPos += 25;
    zpl += `^FO20,${yPos}^A0N,20,20^FDWith: ${medical.followUp?.withProvider || provider.name}^FS`;
    yPos += 25;

    // Procedures
    if (medical.procedures && medical.procedures.length > 0) {
      yPos += 10;
      zpl += `^FO20,${yPos}^GB350,1,1^FS`;
      yPos += 20;
      zpl += `^FO20,${yPos}^A0N,25,25^FDPROCEDURES PERFORMED^FS`;
      yPos += 35;
      
      medical.procedures.forEach(procedure => {
        const checkbox = procedure.completed ? '[X]' : '[ ]';
        zpl += `^FO20,${yPos}^A0N,18,18^FD${checkbox} ${truncateText(procedure.description, 30)}^FS`;
        yPos += 22;
      });
    }

    // Additional Instructions
    if (medical.instructions) {
      yPos += 10;
      zpl += `^FO20,${yPos}^GB350,1,1^FS`;
      yPos += 20;
      zpl += `^FO20,${yPos}^A0N,25,25^FDADDITIONAL INSTRUCTIONS^FS`;
      yPos += 35;
      
      const lines = wrapText(medical.instructions, 40);
      lines.forEach(line => {
        zpl += `^FO20,${yPos}^A0N,18,18^FD${line}^FS`;
        yPos += 22;
      });
    }

    // Samples
    if (medical.samplesGiven) {
      yPos += 10;
      zpl += `^FO20,${yPos}^A0N,20,20^FD[X] Samples provided^FS`;
      yPos += 25;
    }
  }

  // Footer
  yPos += 20;
  zpl += `^FO20,${yPos}^GB350,2,2^FS`;
  yPos += 15;
  zpl += `^FO20,${yPos}^A0N,18,18^FDThank you for choosing Ganger Dermatology^FS`;
  yPos += 22;
  zpl += `^FO20,${yPos}^A0N,15,15^FDPrinted: ${new Date().toLocaleString()}^FS`;

  zpl += `^XZ`; // End ZPL
  return zpl;
}

function generateCosmeticSlipZPL(slipData: SlipData): string {
  const cosmetic = slipData.content.cosmetic as CosmeticSlipContent;
  const patient = slipData.patient;
  const provider = slipData.provider;

  let zpl = `^XA`;

  // Header
  zpl += `^FO20,20^A0N,40,40^FDGANGER DERMATOLOGY^FS`;
  zpl += `^FO20,70^A0N,25,25^FDCOSMETIC TREATMENT SLIP^FS`;
  zpl += `^FO20,105^A0N,20,20^FDDate: ${new Date().toLocaleDateString()}^FS`;
  
  // Separator line
  zpl += `^FO20,130^GB350,2,2^FS`;

  // Patient Information
  let yPos = 150;
  zpl += `^FO20,${yPos}^A0N,25,25^FDPATIENT INFORMATION^FS`;
  yPos += 35;
  zpl += `^FO20,${yPos}^A0N,20,20^FDName: ${patient.name}^FS`;
  yPos += 25;
  zpl += `^FO20,${yPos}^A0N,20,20^FDProvider: ${provider.name}^FS`;
  yPos += 35;

  if (cosmetic) {
    // Treatments
    zpl += `^FO20,${yPos}^A0N,25,25^FDTREATMENTS PERFORMED^FS`;
    yPos += 35;

    // Botox
    if (cosmetic.treatments?.botox) {
      zpl += `^FO20,${yPos}^A0N,22,22^FDBotox Treatment^FS`;
      yPos += 28;
      zpl += `^FO25,${yPos}^A0N,18,18^FDUnits: ${cosmetic.treatments.botox.units}^FS`;
      yPos += 22;
      zpl += `^FO25,${yPos}^A0N,18,18^FDAreas: ${cosmetic.treatments.botox.areas.join(', ')}^FS`;
      yPos += 22;
      if (cosmetic.treatments.botox.totalCost) {
        zpl += `^FO25,${yPos}^A0N,18,18^FDCost: $${cosmetic.treatments.botox.totalCost}^FS`;
        yPos += 22;
      }
      yPos += 10;
    }

    // Filler
    if (cosmetic.treatments?.filler) {
      zpl += `^FO20,${yPos}^A0N,22,22^FDFiller Treatment^FS`;
      yPos += 28;
      zpl += `^FO25,${yPos}^A0N,18,18^FDType: ${cosmetic.treatments.filler.type}^FS`;
      yPos += 22;
      zpl += `^FO25,${yPos}^A0N,18,18^FDAmount: ${cosmetic.treatments.filler.amount}^FS`;
      yPos += 22;
      zpl += `^FO25,${yPos}^A0N,18,18^FDAreas: ${cosmetic.treatments.filler.areas.join(', ')}^FS`;
      yPos += 22;
      if (cosmetic.treatments.filler.totalCost) {
        zpl += `^FO25,${yPos}^A0N,18,18^FDCost: $${cosmetic.treatments.filler.totalCost}^FS`;
        yPos += 22;
      }
      yPos += 10;
    }

    // Products
    if (cosmetic.products && cosmetic.products.length > 0) {
      zpl += `^FO20,${yPos}^GB350,1,1^FS`;
      yPos += 20;
      zpl += `^FO20,${yPos}^A0N,25,25^FDPRODUCTS PURCHASED^FS`;
      yPos += 35;
      
      cosmetic.products.forEach(product => {
        zpl += `^FO20,${yPos}^A0N,18,18^FD${product.name} (x${product.quantity})^FS`;
        zpl += `^FO280,${yPos}^A0N,18,18^FD$${(product.price * product.quantity).toFixed(2)}^FS`;
        yPos += 22;
      });
      yPos += 10;
    }

    // Return Plan
    zpl += `^FO20,${yPos}^GB350,1,1^FS`;
    yPos += 20;
    zpl += `^FO20,${yPos}^A0N,25,25^FDRETURN PLAN^FS`;
    yPos += 35;
    zpl += `^FO20,${yPos}^A0N,20,20^FDReturn in: ${formatInterval(cosmetic.returnPlan)}^FS`;
    yPos += 35;

    // Total Charges
    zpl += `^FO20,${yPos}^GB350,2,2^FS`;
    yPos += 15;
    zpl += `^FO20,${yPos}^A0N,25,25^FDCHARGES TO COLLECT^FS`;
    yPos += 35;
    zpl += `^FO20,${yPos}^A0N,22,22^FDTotal: $${cosmetic.totalCharges || 0}^FS`;
    yPos += 28;
    zpl += `^FO20,${yPos}^A0N,20,20^FDPayment: ${cosmetic.paymentMethod || 'N/A'}^FS`;
  }

  // Footer
  yPos += 30;
  zpl += `^FO20,${yPos}^A0N,18,18^FDThank you for choosing Ganger Dermatology^FS`;
  yPos += 22;
  zpl += `^FO20,${yPos}^A0N,15,15^FDPrinted: ${new Date().toLocaleString()}^FS`;

  zpl += `^XZ`;
  return zpl;
}

function generateSelfPaySlipZPL(slipData: SlipData): string {
  const selfPay = slipData.content.selfPay as SelfPayContent;
  const patient = slipData.patient;
  const provider = slipData.provider;

  let zpl = `^XA`;

  // Header
  zpl += `^FO20,20^A0N,40,40^FDGANGER DERMATOLOGY^FS`;
  zpl += `^FO20,70^A0N,25,25^FDSELF-PAY PRICING REFERENCE^FS`;
  zpl += `^FO20,105^A0N,20,20^FDDate: ${new Date().toLocaleDateString()}^FS`;
  
  // Separator line
  zpl += `^FO20,130^GB350,2,2^FS`;

  // Patient Information
  let yPos = 150;
  zpl += `^FO20,${yPos}^A0N,25,25^FDPATIENT INFORMATION^FS`;
  yPos += 35;
  zpl += `^FO20,${yPos}^A0N,20,20^FDName: ${patient.name}^FS`;
  yPos += 25;
  zpl += `^FO20,${yPos}^A0N,20,20^FDProvider: ${provider.name}^FS`;
  yPos += 35;

  if (selfPay && selfPay.procedures && selfPay.procedures.length > 0) {
    // Procedure Pricing
    zpl += `^FO20,${yPos}^A0N,25,25^FDPROCEDURE PRICING^FS`;
    yPos += 35;
    
    selfPay.procedures.forEach(procedure => {
      zpl += `^FO20,${yPos}^A0N,20,20^FD${procedure.cptCode}^FS`;
      zpl += `^FO280,${yPos}^A0N,20,20^FD$${procedure.standardPrice}^FS`;
      yPos += 22;
      zpl += `^FO20,${yPos}^A0N,16,16^FD${truncateText(procedure.description, 35)}^FS`;
      yPos += 20;
      
      if (procedure.actualPrice && procedure.actualPrice !== procedure.standardPrice) {
        zpl += `^FO20,${yPos}^A0N,16,16^FDActual: $${procedure.actualPrice}^FS`;
        yPos += 20;
      }
      yPos += 5;
    });

    // Total
    if (selfPay.totalEstimate && selfPay.totalEstimate > 0) {
      yPos += 10;
      zpl += `^FO20,${yPos}^GB350,2,2^FS`;
      yPos += 15;
      zpl += `^FO20,${yPos}^A0N,25,25^FDTotal Estimate: $${selfPay.totalEstimate}^FS`;
      yPos += 35;
    }
  }

  // Disclaimer
  if (selfPay?.disclaimer) {
    yPos += 10;
    zpl += `^FO20,${yPos}^GB350,1,1^FS`;
    yPos += 20;
    zpl += `^FO20,${yPos}^A0N,20,20^FDIMPORTANT NOTICE^FS`;
    yPos += 30;
    
    const lines = wrapText(selfPay.disclaimer, 45);
    lines.forEach(line => {
      zpl += `^FO20,${yPos}^A0N,15,15^FD${line}^FS`;
      yPos += 18;
    });
  }

  // Footer
  yPos += 20;
  zpl += `^FO20,${yPos}^A0N,15,15^FDPrinted: ${new Date().toLocaleString()}^FS`;

  zpl += `^XZ`;
  return zpl;
}

// Helper functions
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function wrapText(text: string, maxLineLength: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length <= maxLineLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

function formatInterval(interval: string | undefined): string {
  if (!interval) return 'As needed';
  
  const intervals: Record<string, string> = {
    '1W': '1 Week',
    '2W': '2 Weeks',
    '1M': '1 Month',
    '3M': '3 Months',
    '6M': '6 Months',
    '1Y': '1 Year',
    'PRN': 'As needed'
  };
  
  return intervals[interval] || interval;
}