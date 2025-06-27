'use client'

import { useState, useEffect } from 'react';
import { 
  Input, 
  Select, 
  Checkbox, 
  Textarea,
  Button 
} from '@ganger/ui';
import { Calendar, DollarSign, FileText, Plus, X } from 'lucide-react';
import { SlipData, SlipContent, MedicalSlipContent, CosmeticSlipContent, SelfPayContent } from '../types';
import { formatDate } from '@ganger/utils/client';

interface SlipPreviewProps {
  slipData: SlipData;
  onContentChange: (content: SlipContent) => void;
}

export default function SlipPreview({ slipData, onContentChange }: SlipPreviewProps) {
  const [content, setContent] = useState<SlipContent>({});

  // Initialize default content based on slip type
  useEffect(() => {
    const defaultContent: SlipContent = {};
    
    if (slipData.slipType === 'medical') {
      defaultContent.medical = {
        visitInfo: {
          date: new Date(),
          visitType: 'Follow-up',
          chiefComplaint: ''
        },
        followUp: {
          interval: '3M',
          reason: 'Routine follow-up',
          withProvider: slipData.provider.name,
          schedulingNotes: ''
        },
        procedures: [],
        cosmeticInterest: [],
        instructions: '',
        samplesGiven: false
      };
    } else if (slipData.slipType === 'cosmetic') {
      defaultContent.cosmetic = {
        treatments: {},
        products: [],
        returnPlan: '2W',
        totalCharges: 0,
        paymentMethod: 'Credit Card'
      };
    } else if (slipData.slipType === 'self_pay') {
      defaultContent.selfPay = {
        procedures: [],
        disclaimer: 'Prices are office standard rates and subject to change. Payment due at time of service.',
        totalEstimate: 0
      };
    }
    
    setContent(defaultContent);
    onContentChange(defaultContent);
  }, [slipData.slipType, slipData.provider.name, onContentChange]);

  const updateContent = (newContent: SlipContent) => {
    setContent(newContent);
    onContentChange(newContent);
  };

  const renderMedicalSlip = (medical: MedicalSlipContent) => {
    return (
      <div className="slip-preview space-y-4">
        {/* Header */}
        <div className="text-center border-b pb-4">
          <h1 className="slip-header">GANGER DERMATOLOGY</h1>
          <p className="text-sm">MEDICAL CHECKOUT SLIP</p>
          <p className="text-xs">Date: {formatDate(new Date())}</p>
        </div>

        {/* Patient Info */}
        <div className="slip-section">
          <h3 className="font-bold mb-2">PATIENT INFORMATION</h3>
          <div className="slip-field">
            <span className="slip-field-label">Name:</span> {slipData.patient.name}
          </div>
          <div className="slip-field">
            <span className="slip-field-label">DOB:</span> {formatDate(slipData.patient.dob)}
          </div>
          <div className="slip-field">
            <span className="slip-field-label">MRN:</span> {slipData.patient.mrn}
          </div>
          <div className="slip-field">
            <span className="slip-field-label">Provider:</span> {slipData.provider.name}
          </div>
          {slipData.patient.insurance && (
            <div className="slip-field">
              <span className="slip-field-label">Insurance:</span> {slipData.patient.insurance}
            </div>
          )}
          {slipData.patient.balance && slipData.patient.balance > 0 && (
            <div className="slip-field text-red-600 font-bold">
              <span className="slip-field-label">Balance:</span> ${slipData.patient.balance}
            </div>
          )}
        </div>

        {/* Visit Information */}
        <div className="slip-section">
          <h3 className="font-bold mb-2">VISIT INFORMATION</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium w-24">Visit Type:</label>
              <Select
                value={medical.visitInfo.visitType}
                onChange={(value) => updateContent({
                  ...content,
                  medical: {
                    ...medical,
                    visitInfo: { ...medical.visitInfo, visitType: value }
                  }
                })}
                className="text-sm"
              >
                <option value="New Patient">New Patient</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Annual Exam">Annual Exam</option>
                <option value="Procedure">Procedure</option>
                <option value="Consultation">Consultation</option>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium w-24">Chief Complaint:</label>
              <Input
                value={medical.visitInfo.chiefComplaint || ''}
                onChange={(value) => updateContent({
                  ...content,
                  medical: {
                    ...medical,
                    visitInfo: { ...medical.visitInfo, chiefComplaint: value }
                  }
                })}
                placeholder="Primary concern..."
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Follow-up Instructions */}
        <div className="slip-section">
          <h3 className="font-bold mb-2">FOLLOW-UP INSTRUCTIONS</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium w-24">Return in:</label>
              <Select
                value={medical.followUp.interval}
                onChange={(value) => updateContent({
                  ...content,
                  medical: {
                    ...medical,
                    followUp: { ...medical.followUp, interval: value as any }
                  }
                })}
                className="text-sm"
              >
                <option value="1W">1 Week</option>
                <option value="2W">2 Weeks</option>
                <option value="1M">1 Month</option>
                <option value="3M">3 Months</option>
                <option value="6M">6 Months</option>
                <option value="1Y">1 Year</option>
                <option value="PRN">As needed</option>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium w-24">Reason:</label>
              <Input
                value={medical.followUp.reason}
                onChange={(value) => updateContent({
                  ...content,
                  medical: {
                    ...medical,
                    followUp: { ...medical.followUp, reason: value }
                  }
                })}
                className="text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium w-24">With Provider:</label>
              <Input
                value={medical.followUp.withProvider || ''}
                onChange={(value) => updateContent({
                  ...content,
                  medical: {
                    ...medical,
                    followUp: { ...medical.followUp, withProvider: value }
                  }
                })}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Procedures */}
        <div className="slip-section">
          <h3 className="font-bold mb-2">PROCEDURES PERFORMED</h3>
          <div className="space-y-2">
            {medical.procedures.map((procedure, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  checked={procedure.completed}
                  onChange={(checked) => {
                    const newProcedures = [...medical.procedures];
                    newProcedures[index] = { ...procedure, completed: checked };
                    updateContent({
                      ...content,
                      medical: { ...medical, procedures: newProcedures }
                    });
                  }}
                />
                <Input
                  value={procedure.description}
                  onChange={(value) => {
                    const newProcedures = [...medical.procedures];
                    newProcedures[index] = { ...procedure, description: value };
                    updateContent({
                      ...content,
                      medical: { ...medical, procedures: newProcedures }
                    });
                  }}
                  className="text-sm flex-1"
                  placeholder="Procedure description..."
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newProcedures = medical.procedures.filter((_, i) => i !== index);
                    updateContent({
                      ...content,
                      medical: { ...medical, procedures: newProcedures }
                    });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newProcedures = [
                  ...medical.procedures,
                  { description: '', completed: false }
                ];
                updateContent({
                  ...content,
                  medical: { ...medical, procedures: newProcedures }
                });
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Procedure
            </Button>
          </div>
        </div>

        {/* Additional Instructions */}
        <div className="slip-section">
          <h3 className="font-bold mb-2">ADDITIONAL INSTRUCTIONS</h3>
          <Textarea
            value={medical.instructions || ''}
            onChange={(value) => updateContent({
              ...content,
              medical: { ...medical, instructions: value }
            })}
            placeholder="Additional care instructions, medications, etc..."
            rows={3}
            className="text-sm"
          />
        </div>

        {/* Samples */}
        <div className="slip-section">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={medical.samplesGiven || false}
              onChange={(checked) => updateContent({
                ...content,
                medical: { ...medical, samplesGiven: checked }
              })}
            />
            <label className="text-sm font-medium">Samples provided</label>
          </div>
        </div>

        {/* Cosmetic Interest */}
        <div className="slip-section">
          <h3 className="font-bold mb-2">COSMETIC INTEREST</h3>
          <div className="text-xs text-gray-600">
            Patient expressed interest in: {medical.cosmeticInterest?.join(', ') || 'None mentioned'}
          </div>
        </div>
      </div>
    );
  };

  const renderCosmeticSlip = (cosmetic: CosmeticSlipContent) => {
    return (
      <div className="slip-preview space-y-4">
        {/* Header */}
        <div className="text-center border-b pb-4">
          <h1 className="slip-header">GANGER DERMATOLOGY</h1>
          <p className="text-sm">COSMETIC TREATMENT SLIP</p>
          <p className="text-xs">Date: {formatDate(new Date())}</p>
        </div>

        {/* Patient Info */}
        <div className="slip-section">
          <h3 className="font-bold mb-2">PATIENT INFORMATION</h3>
          <div className="slip-field">
            <span className="slip-field-label">Name:</span> {slipData.patient.name}
          </div>
          <div className="slip-field">
            <span className="slip-field-label">Provider:</span> {slipData.provider.name}
          </div>
        </div>

        {/* Treatments */}
        <div className="slip-section">
          <h3 className="font-bold mb-2">TREATMENTS PERFORMED</h3>
          
          {/* Botox */}
          {cosmetic.treatments.botox && (
            <div className="mb-3">
              <h4 className="font-medium mb-1">Botox Treatment</h4>
              <div className="text-sm space-y-1">
                <div>Units: {cosmetic.treatments.botox.units}</div>
                <div>Areas: {cosmetic.treatments.botox.areas.join(', ')}</div>
                {cosmetic.treatments.botox.totalCost && (
                  <div>Cost: ${cosmetic.treatments.botox.totalCost}</div>
                )}
              </div>
            </div>
          )}

          {/* Filler */}
          {cosmetic.treatments.filler && (
            <div className="mb-3">
              <h4 className="font-medium mb-1">Filler Treatment</h4>
              <div className="text-sm space-y-1">
                <div>Type: {cosmetic.treatments.filler.type}</div>
                <div>Amount: {cosmetic.treatments.filler.amount}</div>
                <div>Areas: {cosmetic.treatments.filler.areas.join(', ')}</div>
                {cosmetic.treatments.filler.totalCost && (
                  <div>Cost: ${cosmetic.treatments.filler.totalCost}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Products */}
        <div className="slip-section">
          <h3 className="font-bold mb-2">PRODUCTS PURCHASED</h3>
          {cosmetic.products.length > 0 ? (
            <div className="space-y-1">
              {cosmetic.products.map((product, index) => (
                <div key={index} className="text-sm flex justify-between">
                  <span>{product.name} (x{product.quantity})</span>
                  <span>${product.price * product.quantity}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No products purchased</div>
          )}
        </div>

        {/* Return Plan */}
        <div className="slip-section">
          <h3 className="font-bold mb-2">RETURN PLAN</h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Return in:</label>
            <Select
              value={cosmetic.returnPlan}
              onChange={(value) => updateContent({
                ...content,
                cosmetic: { ...cosmetic, returnPlan: value as any }
              })}
              className="text-sm"
            >
              <option value="1W">1 Week</option>
              <option value="2W">2 Weeks</option>
              <option value="1M">1 Month</option>
              <option value="3M">3 Months</option>
              <option value="6M">6 Months</option>
            </Select>
          </div>
        </div>

        {/* Charges */}
        <div className="slip-section">
          <h3 className="font-bold mb-2">CHARGES TO COLLECT</h3>
          <div className="space-y-1">
            <div className="flex justify-between font-medium">
              <span>Total Charges:</span>
              <span>${cosmetic.totalCharges || 0}</span>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Payment Method:</label>
              <Select
                value={cosmetic.paymentMethod || ''}
                onChange={(value) => updateContent({
                  ...content,
                  cosmetic: { ...cosmetic, paymentMethod: value }
                })}
                className="text-sm"
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Check">Check</option>
                <option value="CareCredit">CareCredit</option>
              </Select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSelfPaySlip = (selfPay: SelfPayContent) => {
    return (
      <div className="slip-preview space-y-4">
        {/* Header */}
        <div className="text-center border-b pb-4">
          <h1 className="slip-header">GANGER DERMATOLOGY</h1>
          <p className="text-sm">SELF-PAY PRICING REFERENCE</p>
          <p className="text-xs">Date: {formatDate(new Date())}</p>
        </div>

        {/* Patient Info */}
        <div className="slip-section">
          <h3 className="font-bold mb-2">PATIENT INFORMATION</h3>
          <div className="slip-field">
            <span className="slip-field-label">Name:</span> {slipData.patient.name}
          </div>
          <div className="slip-field">
            <span className="slip-field-label">Provider:</span> {slipData.provider.name}
          </div>
        </div>

        {/* Procedures */}
        <div className="slip-section">
          <h3 className="font-bold mb-2">PROCEDURE PRICING</h3>
          {selfPay.procedures.length > 0 ? (
            <div className="space-y-2">
              {selfPay.procedures.map((procedure, index) => (
                <div key={index} className="border p-2 rounded">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{procedure.cptCode}</div>
                      <div className="text-sm">{procedure.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${procedure.standardPrice}</div>
                      {procedure.actualPrice && procedure.actualPrice !== procedure.standardPrice && (
                        <div className="text-sm text-green-600">
                          Actual: ${procedure.actualPrice}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No procedures listed</div>
          )}
        </div>

        {/* Total */}
        {selfPay.totalEstimate && selfPay.totalEstimate > 0 && (
          <div className="slip-section">
            <div className="flex justify-between font-bold text-lg">
              <span>Total Estimate:</span>
              <span>${selfPay.totalEstimate}</span>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="slip-section">
          <h3 className="font-bold mb-2">IMPORTANT NOTICE</h3>
          <div className="text-xs text-gray-700 bg-yellow-50 p-2 rounded">
            {selfPay.disclaimer}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Slip Preview</h3>
        <div className="text-sm text-gray-500">
          {slipData.slipType.charAt(0).toUpperCase() + slipData.slipType.slice(1)} Slip
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          {slipData.slipType === 'medical' && content.medical && renderMedicalSlip(content.medical)}
          {slipData.slipType === 'cosmetic' && content.cosmetic && renderCosmeticSlip(content.cosmetic)}
          {slipData.slipType === 'self_pay' && content.selfPay && renderSelfPaySlip(content.selfPay)}
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <strong>Preview Note:</strong> This preview shows how the slip will appear on screen. 
        The actual printed slip will be formatted for thermal printing and may appear differently.
      </div>
    </div>
  );
}