import 'dotenv/config';
import process from 'process';
import { readFile } from 'fs/promises';
import { Keypair } from '@solana/web3.js';

export const getKeypair = async () => {
  // we need to retrieve our local keypair here
  const keypairPath = process.env.KEY_PATH;

  if (!keypairPath) {
    throw new Error('Please configure KEY_PATH');
  }

  let keypairFileContents: number[];

  try {
    keypairFileContents = JSON.parse(await readFile(keypairPath, 'utf-8'));
  } catch (_) {
    throw new Error('Could not ready keypair file');
  }

  const secretKey = Uint8Array.from(keypairFileContents);

  return Keypair.fromSecretKey(secretKey);
};
