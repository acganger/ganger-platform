import React, { useState, useEffect } from 'react';
import { Card, Button, LoadingSpinner } from '@ganger/ui';
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

interface InsuranceInfo {
  planName: string;
  planType: string;
  memberId: string;
  groupNumber: string;
  effectiveDate: string;
  status: 'active' | 'inactive' | 'pending';
  copayAmount?: number;
  deductible?: number;
  outOfPocketMax?: number;
}

interface CoverageInfo {
  isCovered: boolean;
  requiresPA: boolean;
  copayAmount?: number;
  coinsurancePercent?: number;
  deductibleApplies: boolean;
  priorAuthStatus?: 'approved' | 'denied' | 'pending' | 'not_required';
  limitations?: string[];
  alternatives?: string[];
}

interface InsuranceCheckerProps {
  patientId: string;
  medicationId?: string;
  onCoverageVerified: (coverage: CoverageInfo) => void;
}

export function InsuranceChecker({ patientId, medicationId, onCoverageVerified }: InsuranceCheckerProps) {
  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo | null>(null);
  const [coverageInfo, setCoverageInfo] = useState<CoverageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string>('');

  // Mock insurance data
  useEffect(() => {
    const loadInsuranceInfo = async () => {
      setLoading(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockInsurance: InsuranceInfo = {
          planName: 'Blue Cross Blue Shield Premium Plan',
          planType: 'PPO',
          memberId: 'BC123456789',
          groupNumber: 'GRP001',
          effectiveDate: '2024-01-01',
          status: 'active',
          copayAmount: 25,
          deductible: 1500,
          outOfPocketMax: 8000
        };
        
        setInsuranceInfo(mockInsurance);
      } catch {
        setError('Failed to load insurance information');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      loadInsuranceInfo();
    }
  }, [patientId]);

  const verifyCoverage = async () => {
    if (!medicationId || !insuranceInfo) return;

    setVerifying(true);
    setError('');

    try {
      // Simulate coverage verification
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockCoverage: CoverageInfo = {
        isCovered: true,
        requiresPA: true,
        copayAmount: 50,
        coinsurancePercent: 20,
        deductibleApplies: true,
        priorAuthStatus: 'pending',
        limitations: [
          'Must try formulary alternatives first',
          'Requires dermatologist prescription',
          'Limited to 30-day supply initially'
        ],
        alternatives: [
          'Methotrexate (preferred formulary)',
          'Sulfasalazine (preferred formulary)',
          'Leflunomide (non-preferred formulary)'
        ]
      };

      setCoverageInfo(mockCoverage);
      onCoverageVerified(mockCoverage);
    } catch {
      setError('Failed to verify coverage. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPAStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-blue-500" />
        <h3 className="text-xl font-semibold">Insurance Verification</h3>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <LoadingSpinner className="w-8 h-8 mx-auto mb-3" />
          <p className="text-gray-500">Loading insurance information...</p>
        </div>
      ) : insuranceInfo ? (
        <div className="space-y-6">
          {/* Insurance Plan Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Primary Insurance</h4>
              <div className="flex items-center gap-2">
                {getStatusIcon(insuranceInfo.status)}
                <span className="text-sm font-medium capitalize">{insuranceInfo.status}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Plan:</span> {insuranceInfo.planName}</p>
                <p><span className="font-medium">Type:</span> {insuranceInfo.planType}</p>
                <p><span className="font-medium">Member ID:</span> {insuranceInfo.memberId}</p>
              </div>
              <div>
                <p><span className="font-medium">Group:</span> {insuranceInfo.groupNumber}</p>
                <p><span className="font-medium">Effective:</span> {new Date(insuranceInfo.effectiveDate).toLocaleDateString()}</p>
                <p><span className="font-medium">Copay:</span> ${insuranceInfo.copayAmount}</p>
              </div>
            </div>
          </div>

          {/* Coverage Verification */}
          {medicationId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Medication Coverage</h4>
                <Button
                  onClick={verifyCoverage}
                  disabled={verifying}
                  variant="outline"
                  size="sm"
                >
                  {verifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Verify Coverage
                    </>
                  )}
                </Button>
              </div>

              {verifying && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <LoadingSpinner className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-blue-900">Verifying Coverage</p>
                      <p className="text-sm text-blue-700">Checking formulary status and prior authorization requirements...</p>
                    </div>
                  </div>
                </div>
              )}

              {coverageInfo && (
                <div className={`border rounded-lg p-4 ${coverageInfo.isCovered ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    {coverageInfo.isCovered ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {coverageInfo.isCovered ? 'Medication is Covered' : 'Medication Not Covered'}
                      </p>
                      {coverageInfo.requiresPA && (
                        <p className="text-sm text-gray-600">Prior authorization required</p>
                      )}
                    </div>
                  </div>

                  {coverageInfo.isCovered && (
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p><span className="font-medium">Copay:</span> ${coverageInfo.copayAmount}</p>
                        <p><span className="font-medium">Coinsurance:</span> {coverageInfo.coinsurancePercent}%</p>
                      </div>
                      <div>
                        <p><span className="font-medium">Deductible Applies:</span> {coverageInfo.deductibleApplies ? 'Yes' : 'No'}</p>
                        {coverageInfo.priorAuthStatus && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">PA Status:</span>
                            <span className={`text-xs px-2 py-1 rounded ${getPAStatusColor(coverageInfo.priorAuthStatus)}`}>
                              {coverageInfo.priorAuthStatus.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {coverageInfo.limitations && coverageInfo.limitations.length > 0 && (
                    <div className="mb-4">
                      <p className="font-medium text-gray-900 mb-2">Coverage Limitations:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {coverageInfo.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-orange-500 mt-1">•</span>
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {coverageInfo.alternatives && coverageInfo.alternatives.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-900 mb-2">Formulary Alternatives:</p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {coverageInfo.alternatives.map((alternative, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {alternative}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!medicationId && (
            <div className="text-center py-4 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Select a medication to verify coverage</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No insurance information available</p>
        </div>
      )}
    </Card>
  );
}