import { FormEvent } from 'react';
import { useParams } from 'react-router-dom';

import { useIncidentVM } from '../vms/IncidentVM';

export default function IncidentView() {
  const { jobId } = useParams();
  if (!jobId) return <p>Missing job</p>;
  const vm = useIncidentVM(jobId);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await vm.submit();
  };

  return (
    <div className="card">
      <h2>Incident report</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <textarea
          value={vm.description}
          onChange={(e) => vm.setDescription(e.target.value)}
          placeholder="Describe the incident"
          required
        />
        <textarea
          value={vm.actionTaken}
          onChange={(e) => vm.setActionTaken(e.target.value)}
          placeholder="Action taken"
        />
        <button type="submit" disabled={vm.submitting}>
          Submit incident
        </button>
      </form>
    </div>
  );
}
