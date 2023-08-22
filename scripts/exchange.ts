import { Program, AnchorProvider } from '@coral-xyz/anchor';
import IDL from '../target/idl/roundie_to_round.json';
import { RoundieToRound } from '../target/types/roundie_to_round';
import { getKeypair } from './lib/get-keypair';
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './lib/constants';
import { getConnection } from './lib/get-connection';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import BN from 'bn.js';

(async () => {
  const connection = await getConnection();

  const keypair = await getKeypair();

  const signer = new NodeWallet(keypair);

  const provider = new AnchorProvider(connection, signer, {
    commitment: 'processed',
  });

  const idl = IDL as unknown as RoundieToRound;

  const program = new Program<RoundieToRound>(idl, PROGRAM_ID, provider);

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('rndi_rnd')],
    PROGRAM_ID
  );

  const getAccounts = (authority = signer.publicKey) => {
    return {
      authority,
      pda,
    };
  };

  const oldTokenMint = new PublicKey(
    'DKzkt1r6QctnQFx5hMnGomcMimXqVfAyBhMcoKHcBiNK'
  );
  const newTokenMint = new PublicKey(
    'AD2AWgBPdfbvko4a7i6ZjKq1JxDGRUTPWpd7bUJ2hSaK'
  );

  const pdaNewTokenAccount = getAssociatedTokenAddressSync(
    newTokenMint,
    pda,
    true
  );
  const pdaOldTokenAccount = getAssociatedTokenAddressSync(
    oldTokenMint,
    pda,
    true
  );
  const userNewTokenAccount = getAssociatedTokenAddressSync(
    newTokenMint,
    signer.publicKey
  );
  const userOldTokenAccount = getAssociatedTokenAddressSync(
    oldTokenMint,
    signer.publicKey
  );

  console.log('pdaNewTokenAccount', pdaNewTokenAccount.toBase58());

  const tx = await program.methods
    .exchange(new BN(10))
    .accounts({
      user: signer.publicKey,
      pda,
      oldTokenMint,
      newTokenMint,
      pdaNewTokenAccount,
      pdaOldTokenAccount,
      userNewTokenAccount,
      userOldTokenAccount,
    })
    .signers([keypair])
    .rpc();

  console.log('tx', tx);
})();
