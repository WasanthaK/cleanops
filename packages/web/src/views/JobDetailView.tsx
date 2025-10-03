import { ChangeEvent, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useJobDetailVM } from '../vms/JobListVM';
import { useAttendanceVM } from '../vms/AttendanceVM';
import { useTaskVM } from '../vms/TaskVM';
import { photoRepo } from '../repos/PhotoRepo';

export default function JobDetailView() {
  const { jobId } = useParams();
  if (!jobId) return <p>Job not found.</p>;
  const { job, loading } = useJobDetailVM(jobId);
  const attendance = useAttendanceVM(jobId);
  const [photoKind, setPhotoKind] = useState<'BEFORE' | 'AFTER'>('BEFORE');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const taskVm = useTaskVM(jobId, job?.tasks ?? []);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await photoRepo.upload(jobId, file, photoKind);
    event.target.value = '';
  };

  if (loading) {
    return <p>Loading job...</p>;
  }

  if (!job) {
    return <p>Job information unavailable. Ensure you are logged in and synced.</p>;
  }

  return (
    <div className="card">
      <h2>{job.title}</h2>
      <p>{job.site.address}</p>
      <nav style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <Link to={`/jobs/${jobId}/signoff`}>Client sign-off</Link>
        <Link to={`/jobs/${jobId}/incidents`}>Report incident</Link>
      </nav>
      <section>
        <h3>Attendance</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={attendance.startTravel} disabled={attendance.busy}>
            Start travel
          </button>
          <button onClick={attendance.arrive} disabled={attendance.busy}>
            Arrive onsite
          </button>
          <button onClick={attendance.clockIn} disabled={attendance.busy}>
            Clock in
          </button>
          <button onClick={attendance.takeBreak} disabled={attendance.busy}>
            Break
          </button>
          <button onClick={attendance.clockOut} disabled={attendance.busy}>
            Clock out
          </button>
        </div>
      </section>
      <section>
        <h3>Tasks</h3>
        {taskVm.tasks.map((task) => (
          <label key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={task.completed} onChange={() => taskVm.toggleTask(task.id)} />
            {task.title}
          </label>
        ))}
        <button onClick={taskVm.save} disabled={taskVm.saving}>
          Save tasks
        </button>
      </section>
      <section>
        <h3>Photos</h3>
        <p>Please obtain client consent before capturing imagery. Avoid identifiable faces where possible.</p>
        <select value={photoKind} onChange={(event) => setPhotoKind(event.target.value as 'BEFORE' | 'AFTER')}>
          <option value="BEFORE">Before</option>
          <option value="AFTER">After</option>
        </select>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileChange}
        />
      </section>
    </div>
  );
}
