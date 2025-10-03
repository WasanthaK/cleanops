/**
 * View model fetching jobs and exposing derived state.
 */
import { useEffect, useState } from 'react';

import { apiRepo } from '../repos/ApiRepo';
import { useJobStore } from '../stores/jobStore';
import { Job } from '../models';
import { useSessionStore } from '../stores/session';

export function useJobListVM() {
  const { jobs, setJobs } = useJobStore();
  const accessToken = useSessionStore((state) => state.accessToken);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    apiRepo.setToken(accessToken);
    apiRepo
      .listJobs()
      .then((response) => setJobs(response))
      .finally(() => setLoading(false));
  }, [accessToken, setJobs]);

  return { jobs, loading, authenticated: Boolean(accessToken) };
}

export function useJobDetailVM(jobId: string) {
  const { jobs, upsertJob } = useJobStore();
  const accessToken = useSessionStore((state) => state.accessToken);
  const [loading, setLoading] = useState(false);
  const job = jobs.find((j) => j.id === jobId) ?? null;

  useEffect(() => {
    if (!jobId || !accessToken) return;
    setLoading(true);
    apiRepo.setToken(accessToken);
    apiRepo
      .getJob(jobId)
      .then((response: Job) => upsertJob(response))
      .finally(() => setLoading(false));
  }, [jobId, upsertJob, accessToken]);

  return { job, loading };
}
