/**
 * Incident view model handles form state.
 */
import { useState } from 'react';

import { apiRepo } from '../repos/ApiRepo';

export function useIncidentVM(jobId: string) {
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await apiRepo.reportIncident(jobId, {
        occurredAt: new Date().toISOString(),
        description,
        actionTaken
      });
      setDescription('');
      setActionTaken('');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    description,
    setDescription,
    actionTaken,
    setActionTaken,
    submit,
    submitting
  };
}
