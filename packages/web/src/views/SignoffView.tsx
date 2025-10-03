import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import SignaturePad from '../components/SignaturePad';
import { useSignoffVM } from '../vms/SignoffVM';
import { photoRepo } from '../repos/PhotoRepo';

export default function SignoffView() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  if (!jobId) return <p>Job missing</p>;
  const vm = useSignoffVM(jobId);
  const [clientName, setClientName] = useState('');
  const [clientRole, setClientRole] = useState('');
  const [signature, setSignature] = useState<string>('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!signature) return;
    const blob = await (await fetch(signature)).blob();
    const file = new File([blob], 'signature.png', { type: 'image/png' });
    const objectKey = await photoRepo.upload(jobId, file, 'SIGNATURE', 'Client signature');
    await vm.submit({ clientName, clientRole, signatureKey: objectKey });
    navigate(-1);
  };

  return (
    <div className="card">
      <h2>Client sign-off</h2>
      <p>Please show the Australian Privacy Principles notice to the client before capturing their signature.</p>
      <label>
        <input type="checkbox" checked={vm.privacyAccepted} onChange={(e) => vm.setPrivacyAccepted(e.target.checked)} />
        I have explained the privacy notice to the client.
      </label>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" required />
        <input value={clientRole} onChange={(e) => setClientRole(e.target.value)} placeholder="Role" required />
        <SignaturePad onChange={setSignature} />
        <button type="submit" disabled={!vm.privacyAccepted || vm.submitting}>
          Capture sign-off
        </button>
      </form>
    </div>
  );
}
