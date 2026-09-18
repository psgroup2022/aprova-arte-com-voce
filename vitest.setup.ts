import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// O testing-library só registra a limpeza sozinho quando `globals` está ligado
// no vitest, e aqui não está: sem isto, o que um teste renderiza continua no DOM
// durante o próximo, e a busca por elemento acha dois.
afterEach(cleanup);
