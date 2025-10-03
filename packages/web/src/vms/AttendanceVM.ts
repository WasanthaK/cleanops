/**
 * Attendance view model orchestrates workflow events.
 */
import { useState } from 'react';

import { apiRepo } from '../repos/ApiRepo';
import { captureGps } from '../utils/gps';

export function useAttendanceVM(jobId: string) {
  const [busy, setBusy] = useState(false);

  const trigger = async (action: string) => {
    setBusy(true);
    try {
      const coords = await captureGps();
      await apiRepo.attendance(jobId, action, {
        occurredAt: new Date().toISOString(),
        coordinates: coords ? [coords.latitude, coords.longitude] : undefined
      });
    } finally {
      setBusy(false);
    }
  };

  return {
    busy,
    startTravel: () => trigger('start-travel'),
    arrive: () => trigger('arrive'),
    clockIn: () => trigger('clock-in'),
    takeBreak: () => trigger('break'),
    clockOut: () => trigger('clock-out')
  };
}
