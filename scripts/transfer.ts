import { getKeypair } from './lib/get-keypair';
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './lib/constants';
import { getConnection } from './lib/get-connection';
import {
  createAssociatedTokenAccount,
  getAssociatedTokenAddress,
  transferChecked,
} from '@solana/spl-token';

(async () => {
  const connection = await getConnection();

  const keypair = await getKeypair();

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('rndi_rnd')],
    PROGRAM_ID
  );

  console.log('pda', pda.toBase58());

  const newTokenMint = new PublicKey(
    'AD2AWgBPdfbvko4a7i6ZjKq1JxDGRUTPWpd7bUJ2hSaK'
  );

  const userNewTokenAccount = await getAssociatedTokenAddress(
    newTokenMint,
    keypair.publicKey,
    true
  );

  const newTokenAta = await getAssociatedTokenAddress(newTokenMint, pda, true);

  console.log('newTokenAta', newTokenAta.toBase58());

  const createdAta = await createAssociatedTokenAccount(
    connection,
    keypair,
    newTokenMint,
    pda
  );

  console.log('create', createdAta);

  const transfer = await transferChecked(
    connection,
    keypair,
    userNewTokenAccount,
    newTokenMint,
    createdAta,
    newTokenAta,
    10,
    0
  );

  console.log('transfer result', transfer);
})();
