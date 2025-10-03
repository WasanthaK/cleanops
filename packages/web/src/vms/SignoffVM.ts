/**
 * Sign-off view model handles privacy notice acceptance and capture.
 */
import { useState } from 'react';

import { apiRepo } from '../repos/ApiRepo';

export function useSignoffVM(jobId: string) {
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (payload: { clientName: string; clientRole: string; signatureKey: string }) => {
    setSubmitting(true);
    try {
      await apiRepo.signoff(jobId, {
        ...payload,
        signedAt: new Date().toISOString()
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    privacyAccepted,
    setPrivacyAccepted,
    submit,
    submitting
  };
}
