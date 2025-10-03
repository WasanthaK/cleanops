import { useState } from 'react';

import { syncRepo } from '../repos/SyncRepo.js';

export default function SettingsView() {
  const [result, setResult] = useState<string>('');

  const flush = async () => {
    const { flushed } = await syncRepo.flush();
    setResult(`Flushed ${flushed} events.`);
  };

  return (
    <div className="card">
      <h2>Settings & Privacy</h2>
      <section>
        <h3>Privacy notice</h3>
        <p>
          CleanOps collects photos and signatures for proof of service. We follow the Australian Privacy Principles and only use
          captured media for job verification and payroll. Obtain consent before capturing personal information.
        </p>
      </section>
      <section>
        <h3>Offline queue</h3>
        <button onClick={flush}>Flush pending events</button>
        {result && <p>{result}</p>}
      </section>
    </div>
  );
}
