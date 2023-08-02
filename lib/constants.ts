import 'dotenv/config';

export const RPC_URL = process.env.RPC_HOST;

export const RPC_URL_DEV = process.env.RPC_HOST_DEV;

export const SEED = 'rndi_rnd';

export const BASE_PROGRAM_ID = 'C33wP7zndt1MrsGfGnJ91HT6B7rNZdmMASYvmcoRudNm';

export const MAINNET_TOKEN_TO_RECEIVE = process.env.MAINNET_TOKEN_TO_RECEIVE;
export const MAINNET_TOKEN_TO_SEND = process.env.MAINNET_TOKEN_TO_SEND;

export const DEVNET_TOKEN_TO_RECEIVE = process.env.DEVNET_TOKEN_TO_RECEIVE;
export const DEVNET_TOKEN_TO_SEND = process.env.DEVNET_TOKEN_TO_SEND;

export const LOCALNET_TOKEN_TO_RECEIVE = process.env.LOCALNET_TOKEN_TO_RECEIVE;

export const LOCALNET_TOKEN_TO_SEND = process.env.LOCALNET_TOKEN_TO_SEND;
