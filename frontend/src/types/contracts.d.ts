declare module '@/components/contracts/PropertyDocumentSelector' {
  interface PropertyDocumentSelectorProps {
    onSelectPropertyId: (propertyId: string | null) => void;
    onScanContract: (documentPath: string) => void;
    isScanning: boolean;
  }
  
  const PropertyDocumentSelector: React.FC<PropertyDocumentSelectorProps>;
  export default PropertyDocumentSelector;
}

declare module '@/components/contracts/ContractScanResults' {
  interface ContractScanResultsProps {
    results: any | null;
    isScanning: boolean;
  }
  
  const ContractScanResults: React.FC<ContractScanResultsProps>;
  export default ContractScanResults;
} 