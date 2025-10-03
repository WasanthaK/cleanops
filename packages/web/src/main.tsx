import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import App from './views/App';
import JobListView from './views/JobListView';
import JobDetailView from './views/JobDetailView';
import SignoffView from './views/SignoffView';
import IncidentView from './views/IncidentView';
import SettingsView from './views/SettingsView';

import './styles.css';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element missing');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<JobListView />} />
          <Route path="jobs/:jobId" element={<JobDetailView />} />
          <Route path="jobs/:jobId/signoff" element={<SignoffView />} />
          <Route path="jobs/:jobId/incidents" element={<IncidentView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

registerServiceWorker();
