import 'dotenv/config';
import { Connection } from '@solana/web3.js';
import {RPC_URL} from "./constants";

export const getConnection = () => {
  console.log('RPC_URL', RPC_URL);
  return new Connection(RPC_URL ?? '', 'confirmed');
};
