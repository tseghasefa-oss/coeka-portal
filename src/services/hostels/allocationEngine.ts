export interface BedspaceReservationState {
  bedspaceId: string;
  isOccupied: boolean;
  reservedUntil: number | null; // Unix epoch in seconds
}

export class HostelAllocationEngine {
  /**
   * Evaluates whether a bedspace is currently available for booking
   */
  static isBedspaceAvailable(bed: BedspaceReservationState, currentTimeSeconds: number): boolean {
    if (bed.isOccupied) return false;
    if (bed.reservedUntil && bed.reservedUntil > currentTimeSeconds) return false;
    return true;
  }

  /**
   * Acquire a 15-minute reservation lock (900 seconds)
   */
  static acquireReservationLock(
    bed: BedspaceReservationState,
    currentTimeSeconds: number
  ): { success: boolean; newReservedUntil: number | null; message: string } {
    if (!HostelAllocationEngine.isBedspaceAvailable(bed, currentTimeSeconds)) {
      return {
        success: false,
        newReservedUntil: bed.reservedUntil,
        message: 'Bedspace is currently occupied or held under an active reservation by another student.',
      };
    }

    const lockDurationSeconds = 900; // 15 minutes
    const newReservedUntil = currentTimeSeconds + lockDurationSeconds;

    return {
      success: true,
      newReservedUntil,
      message: 'Bedspace lock acquired successfully. You have 15 minutes to complete payment.',
    };
  }
}
