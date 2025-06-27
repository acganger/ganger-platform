export interface SlipData {
  patient: PatientInfo;
  provider: ProviderInfo;
  slipType: SlipType;
  content: SlipContent;
  location: string;
}

export interface PatientInfo {
  id: string;
  name: string;
  dob: Date;
  mrn: string;
  insurance?: string;
  copay?: number;
  balance?: number;
  phone?: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  title: string;
  npi?: string;
}

export type SlipType = 'medical' | 'cosmetic' | 'self_pay';

export interface SlipContent {
  medical?: MedicalSlipContent;
  cosmetic?: CosmeticSlipContent;
  selfPay?: SelfPayContent;
}

export interface MedicalSlipContent {
  visitInfo: {
    date: Date;
    visitType: string;
    chiefComplaint?: string;
  };
  followUp: {
    interval: '1W' | '2W' | '1M' | '3M' | '6M' | '1Y' | 'PRN';
    reason: string;
    withProvider?: string;
    schedulingNotes?: string;
  };
  procedures: {
    code?: string;
    description: string;
    completed: boolean;
  }[];
  cosmeticInterest?: string[];
  instructions?: string;
  samplesGiven?: boolean;
}

export interface CosmeticSlipContent {
  treatments: {
    botox?: {
      units: number;
      areas: string[];
      totalCost?: number;
    };
    filler?: {
      type: string;
      amount: string;
      areas: string[];
      totalCost?: number;
    };
    other?: {
      procedure: string;
      details: string;
      cost?: number;
    }[];
  };
  products: {
    name: string;
    quantity: number;
    price: number;
  }[];
  returnPlan: '1W' | '2W' | '1M' | '3M' | '6M';
  totalCharges?: number;
  paymentMethod?: string;
}

export interface SelfPayContent {
  procedures: {
    cptCode: string;
    description: string;
    standardPrice: number;
    actualPrice?: number;
  }[];
  disclaimer: string;
  totalEstimate?: number;
}

export interface PrintJob {
  id: string;
  patientId: string;
  providerId: string;
  locationId: string;
  slipType: SlipType;
  slipContent: SlipContent;
  printerId: string;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  errorMessage?: string;
  printedAt?: Date;
  printedBy: string;
  createdAt: Date;
}

export interface PrinterInfo {
  id: string;
  name: string;
  location: string;
  ip: string;
  model: string;
  status: 'online' | 'offline' | 'error';
  lastSeen?: Date;
}

export interface SlipTemplate {
  id: string;
  slipType: SlipType;
  version: number;
  templateData: any;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}