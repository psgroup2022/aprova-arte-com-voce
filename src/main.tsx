import { createRoot } from 'react-dom/client';
import { initSentry } from '@/lib/monitoring/sentry';
import App from './App.tsx';
import './index.css';

// Inicializa monitoramento de erros o mais cedo possível
initSentry();

createRoot(document.getElementById('root')!).render(<App />);
