import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Elemen #root tidak ditemukan di index.html');
}

const root = createRoot(container);
if (import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === 'lobby') {
  void import('./previews/LobbyPreview').then(({ LobbyPreview }) => {
    root.render(
      <StrictMode>
        <LobbyPreview />
      </StrictMode>,
    );
  });
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
