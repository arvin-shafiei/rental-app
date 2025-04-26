'use client';

import { Loader2, AlertCircle, Check, FileText, User, Home, Clock } from 'lucide-react';

interface ContractScanResultsProps {
  results: any | null;
  isScanning: boolean;
}

export default function ContractScanResults({ results, isScanning }: ContractScanResultsProps) {
  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-lg text-gray-700">Analyzing your contract...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <p className="text-lg text-gray-700">No contract analyzed yet</p>
      </div>
    );
  }

  // Handle different formats of landlord/tenant data
  const renderPartyInfo = (party: any) => {
    if (typeof party === 'string') {
      return party;
    } else if (party && typeof party === 'object') {
      // Check if it has name and address properties
      if ('name' in party && 'address' in party) {
        return (
          <>
            <div>
              <p className="text-sm font-medium text-gray-500">Name:</p>
              <p className="text-base">{party.name}</p>
            </div>
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-500">Address:</p>
              <p className="text-base">{party.address}</p>
            </div>
          </>
        );
      } else {
        // Fallback for other object structures
        return JSON.stringify(party);
      }
    }
    return 'Not specified';
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800">
          {results.contractType || 'Contract Analysis'}
        </h3>
      </div>

      {/* Parties */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-md font-semibold mb-3 flex items-center">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Parties
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Landlord/Agent:</p>
            {renderPartyInfo(results.parties.landlord)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tenant:</p>
            {renderPartyInfo(results.parties.tenant)}
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-md font-semibold mb-3 flex items-center">
          <Home className="h-5 w-5 mr-2 text-blue-600" />
          Property Details
        </h3>
        <div>
          <p className="text-sm font-medium text-gray-500">Address:</p>
          <p className="text-base">{results.propertyDetails.address}</p>
        </div>
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-500">Postcode:</p>
          <p className="text-base">{results.propertyDetails.postcode}</p>
        </div>
      </div>

      {/* Contract Terms */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-md font-semibold mb-3 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Contract Terms
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Start Date:</p>
            <p className="text-base">{results.terms.startDate}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">End Date:</p>
            <p className="text-base">{results.terms.endDate}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Rent Amount:</p>
            <p className="text-base">{results.terms.rentAmount}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Deposit Amount:</p>
            <p className="text-base">{results.terms.depositAmount}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Payment Due:</p>
            <p className="text-base">{results.terms.paymentDue}</p>
          </div>
        </div>
      </div>

      {/* Special Clauses */}
      {results.specialClauses && results.specialClauses.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-md font-semibold mb-3 flex items-center">
            <Check className="h-5 w-5 mr-2 text-blue-600" />
            Special Clauses
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            {results.specialClauses.map((clause: string, index: number) => (
              <li key={index} className="text-sm text-gray-700">{clause}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Issues/Warnings */}
      {results.issues && results.issues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-md font-semibold mb-3 flex items-center text-red-800">
            <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
            Potential Issues
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            {results.issues.map((issue: string, index: number) => (
              <li key={index} className="text-sm text-red-700">{issue}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-gray-600">
            Note: This analysis is automated and for informational purposes only. 
            Please consult with a legal professional for proper legal advice.
          </p>
        </div>
      )}
    </div>
  );
} 