import 'dotenv/config';
import { Connection } from '@solana/web3.js';
import { RPC_URL } from './constants';

export const getConnection = (url: string) => {
  return new Connection(url ?? RPC_URL ?? '', 'confirmed');
};
