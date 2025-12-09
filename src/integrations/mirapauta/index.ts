/**
 * Integração com o sistema MiraPauta
 */

export { mirapautaClient, isMirapautaConfigured, getMirapautaConfig } from './client';
export type {
  MirapautaDatabase,
  MirapautaCliente,
  MirapautaPauta,
  MirapautaTask,
  MirapautaProfile,
  MirapautaPautaWithCliente,
  MirapautaTaskWithCliente,
} from './types';
