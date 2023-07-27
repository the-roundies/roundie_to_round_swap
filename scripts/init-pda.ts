import splToken, {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  setAuthority,
  getAccount,
  AuthorityType,
} from '@solana/spl-token';
import {
  PublicKey,
  Transaction,
  sendAndConfirmRawTransaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  BASE_PROGRAM_ID,
  DEVNET_TOKEN,
  RPC_URL_DEV,
  SEED,
} from '../lib/constants';
import { getKeypair } from '../lib/get-keypair';
import { getConnection } from '../lib/get-connection';

(async () => {
  // Assume you have a connection to the Solana network
  const connection = await getConnection(RPC_URL_DEV);

  // Assume you have a wallet account with enough SOL
  const wallet = await getKeypair();

  // Your base program ID and the seed

  // Create a PublicKey instance from your base program ID
  const baseProgramId = new PublicKey(BASE_PROGRAM_ID);

  // Find the PDA
  const [pdaAddress, nonce] = await PublicKey.findProgramAddress(
    [Buffer.from(SEED)],
    baseProgramId
  );

  console.log('pdaAddress', pdaAddress.toBase58());

  // Assume you have the mint address
  const mintAddress = new PublicKey(DEVNET_TOKEN);

  const pdaAccount = await getAssociatedTokenAddress(
    mintAddress,
    pdaAddress,
    true
  );

  let createTokenAccountIx: TransactionInstruction | undefined;

  try {
    await getAccount(connection, pdaAddress, 'confirmed', TOKEN_PROGRAM_ID);
  } catch (e) {
    // Create instruction to create new token account
    createTokenAccountIx = createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      pdaAccount,
      pdaAddress,
      mintAddress,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
  }

  const transaction = new Transaction();

  if (createTokenAccountIx) {
    transaction.add(createTokenAccountIx);
  } else {
    const setAuthorityResult = await setAuthority(
      connection,
      wallet,
      pdaAccount,
      wallet.publicKey,
      AuthorityType.AccountOwner,
      pdaAccount
    );

    console.log('setAuthorityResult', setAuthorityResult);
    return;
  }

  // Send transaction

  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  transaction.feePayer = wallet.publicKey;

  const txid = await sendAndConfirmRawTransaction(
    connection,
    transaction.serialize(),
    {
      commitment: 'confirmed',
    }
  );

  console.log('Token account created for PDA:', pdaAccount.toBase58());
})();
