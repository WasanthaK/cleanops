/**
 * Job store caches assigned jobs and details.
 */
import { create } from 'zustand';

import { Job } from '../models/index.js';

interface JobState {
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  upsertJob: (job: Job) => void;
}

export const useJobStore = create<JobState>((set) => ({
  jobs: [],
  setJobs: (jobs) => set({ jobs }),
  upsertJob: (job) =>
    set((state) => ({
      jobs: state.jobs.some((j) => j.id === job.id)
        ? state.jobs.map((j) => (j.id === job.id ? job : j))
        : [...state.jobs, job]
    }))
}));
