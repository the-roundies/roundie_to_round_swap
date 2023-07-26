import splToken from '@solana/spl-token';
import solanaWeb3 from '@solana/web3.js';
import {BASE_PROGRAM_ID, SEED} from "../lib/constants";
import {getKeypair} from "../lib/get-keypair";

(async () => {

    // Assume you have a connection to the Solana network
    const connection = new solanaWeb3.Connection(
        solanaWeb3.clusterApiUrl('mainnet-beta')
    );

    // Assume you have a wallet account with enough SOL
    const wallet = await getKeypair();

    // Your base program ID and the seed

    // Create a PublicKey instance from your base program ID
    const baseProgramId = new solanaWeb3.PublicKey(BASE_PROGRAM_ID);

    // Find the PDA
    const [pdaAddress, nonce] = await solanaWeb3.PublicKey.findProgramAddress(
        [Buffer.from(SEED)],
        baseProgramId
    );

    // Assume you have the mint address
    // AD2AWgBPdfbvko4a7i6ZjKq1JxDGRUTPWpd7bUJ2hSaK <- mainnet token
    // Bp8uHwfpgdN5FFhFe8AowBK4fSrJRf3CPrJ5d4R5dSsb <- devnet token
    const mintAddress = new solanaWeb3.PublicKey('Bp8uHwfpgdN5FFhFe8AowBK4fSrJRf3CPrJ5d4R5dSsb');

    // Generate a new keypair for the token account
    const tokenAccount = new solanaWeb3.Account();

    // Create instruction to create new token account
    const createTokenAccountIx = splToken.Token.createAssociatedTokenAccountInstruction(
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        splToken.TOKEN_PROGRAM_ID,
        mintAddress,
        tokenAccount.publicKey,
        pdaAddress, // owner will be the PDA
        pdaAddress, // address of the new token account will be the same as PDA
    );

    // Send transaction
    const transaction = new solanaWeb3.Transaction().add(createTokenAccountIx);
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    transaction.feePayer = wallet.publicKey;
    transaction.sign(wallet, tokenAccount);

    const txid = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(txid);

    console.log('Token account created for PDA:', tokenAccount.publicKey.toBase58());
})();
