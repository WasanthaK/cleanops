import { Link, Outlet, useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';

import { apiRepo } from '../repos/ApiRepo';
import { useSessionStore } from '../stores/session';

export default function App() {
  const { accessToken, setTokens, clear } = useSessionStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('worker@example.com');
  const [password, setPassword] = useState('password123');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const tokens = await apiRepo.login(email, password);
    setTokens(tokens.accessToken, tokens.refreshToken);
    apiRepo.setToken(tokens.accessToken);
  };

  const logout = () => {
    clear();
    apiRepo.setToken(null);
    navigate('/');
  };

  return (
    <div>
      <header className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>CleanOps</h1>
        <nav>
          <Link to="/">Jobs</Link> | <Link to="/settings">Settings</Link>
        </nav>
        {accessToken ? (
          <button onClick={logout}>Logout</button>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem' }}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
            />
            <button type="submit">Login</button>
          </form>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
