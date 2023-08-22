import { Program, AnchorProvider } from '@coral-xyz/anchor';
import IDL from '../target/idl/roundie_to_round.json';
import { RoundieToRound } from '../target/types/roundie_to_round';
import { getKeypair } from './lib/get-keypair';
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './lib/constants';
import { getConnection } from './lib/get-connection';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';

(async () => {
  const connection = await getConnection();

  const keypair = await getKeypair();

  const signer = new NodeWallet(keypair);

  const provider = new AnchorProvider(connection, signer, {
    commitment: 'processed',
  });

  const program = new Program<RoundieToRound>(
    IDL as unknown as RoundieToRound,
    IDL.metadata.address,
    provider
  );

  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('rndi_rnd')],
    PROGRAM_ID
  );

  const getAccounts = (authority = signer.publicKey) => {
    return {
      authority,
      pda,
      oldTokenMint: new PublicKey(
        'DKzkt1r6QctnQFx5hMnGomcMimXqVfAyBhMcoKHcBiNK'
      ),
      newTokenMint: new PublicKey(
        'AD2AWgBPdfbvko4a7i6ZjKq1JxDGRUTPWpd7bUJ2hSaK'
      ),
    };
  };

  const tx = await program.methods
    .initialize()
    .accounts(getAccounts())
    .signers([keypair])
    .rpc();

  console.log('tx', tx);
})();
