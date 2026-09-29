import React from 'react';
import { DivisionGuard } from '../common/DivisionGuard';
import { HostelPortal } from '../hostels/HostelPortal';

export const HostelAllocationView: React.FC = () => {
  return (
    <DivisionGuard allowedDivisions={['DEGREE', 'NCE']} featureName="Hostel Allocation">
      <HostelPortal />
    </DivisionGuard>
  );
};
