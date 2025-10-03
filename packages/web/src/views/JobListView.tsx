import { Link } from 'react-router-dom';

import { useJobListVM } from '../vms/JobListVM';

export default function JobListView() {
  const { jobs, loading, authenticated } = useJobListVM();

  if (!authenticated) {
    return <p>Please log in to view jobs.</p>;
  }

  if (loading) {
    return <p>Loading jobs...</p>;
  }

  if (!jobs.length) {
    return <p>No jobs assigned.</p>;
  }

  return (
    <div>
      {jobs.map((job) => (
        <div key={job.id} className="card">
          <h2>{job.title}</h2>
          <p>{new Date(job.scheduledDate).toLocaleString()}</p>
          <p>{job.site.name}</p>
          <Link to={`/jobs/${job.id}`}>Open job</Link>
        </div>
      ))}
    </div>
  );
}
