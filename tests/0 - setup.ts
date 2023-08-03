import { AnchorProvider, Program, setProvider, workspace } from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { RoundieToRound } from "../target/types/roundie_to_round";
import { createAssociatedTokenAccountInstruction, createMint, createMintToInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";

export const newMint = Keypair.generate();
export const oldMint = Keypair.generate();
export const thirdMint = Keypair.generate();
export const signer = Keypair.generate();
export const otherSigner = Keypair.generate();
export let pda = PublicKey.default;

describe('setup', () => {
    const provider = AnchorProvider.local()
    setProvider(provider);
    const program = workspace.RoundieToRound as Program<RoundieToRound>;

    pda = PublicKey.findProgramAddressSync(
        [Buffer.from('rndi_rnd')],
        program.programId
    )[0];

    it('Fund the ephemeral wallets', async () => {
        const tx1 = await provider.connection.requestAirdrop(signer.publicKey, LAMPORTS_PER_SOL);
        await provider.connection.confirmTransaction(tx1);
        const tx2 = await provider.connection.requestAirdrop(otherSigner.publicKey, LAMPORTS_PER_SOL);
        await provider.connection.confirmTransaction(tx2);
    });

    it('Create the new_mint account', async () => {
        await createMint(
            provider.connection,
            signer,
            signer.publicKey,
            signer.publicKey,
            0,
            newMint
        );
    });

    it('Create the old_mint account', async () => {
        await createMint(
            provider.connection,
            signer,
            signer.publicKey,
            signer.publicKey,
            0,
            oldMint
        );
    });

    it('Create the third_mint account', async () => {
        await createMint(
            provider.connection,
            signer,
            signer.publicKey,
            signer.publicKey,
            0,
            thirdMint
        );
    });

    it('Mint 50 old_token to anchor signer ata', async () => {
        const ata = getAssociatedTokenAddressSync(oldMint.publicKey, signer.publicKey);
        const createInstruction = createAssociatedTokenAccountInstruction(
            signer.publicKey,
            ata,
            signer.publicKey,
            oldMint.publicKey
        );
        const mintInstruction = createMintToInstruction(
            oldMint.publicKey,
            ata,
            signer.publicKey,
            50
        );
        const block = await provider.connection.getLatestBlockhash('finalized');
        const transaction = new Transaction()
            .add(createInstruction)
            .add(mintInstruction);
        transaction.recentBlockhash = block.blockhash;
        await provider.sendAndConfirm(transaction, [signer]);
    });

    it('Mint 50 new_token to pda ata', async () => {
        const ata = getAssociatedTokenAddressSync(newMint.publicKey, pda, true);
        const createInstruction = createAssociatedTokenAccountInstruction(
            signer.publicKey,
            ata,
            pda,
            newMint.publicKey
        );
        const mintInstruction = createMintToInstruction(
            newMint.publicKey,
            ata,
            signer.publicKey,
            50
        );
        const block = await provider.connection.getLatestBlockhash('finalized');
        const transaction = new Transaction()
            .add(createInstruction)
            .add(mintInstruction);
        transaction.recentBlockhash = block.blockhash;
        await provider.sendAndConfirm(transaction, [signer]);
    });

    it('Mint 50 third_mint to anchor signer ata', async () => {
        const ata = getAssociatedTokenAddressSync(thirdMint.publicKey, signer.publicKey);
        const createInstruction = createAssociatedTokenAccountInstruction(
            signer.publicKey,
            ata,
            signer.publicKey,
            thirdMint.publicKey
        );
        const mintInstruction = createMintToInstruction(
            thirdMint.publicKey,
            ata,
            signer.publicKey,
            50
        );
        const block = await provider.connection.getLatestBlockhash('finalized');
        const transaction = new Transaction()
            .add(createInstruction)
            .add(mintInstruction);
        transaction.recentBlockhash = block.blockhash;
        await provider.sendAndConfirm(transaction, [signer]);
    });

    it('Mint 50 third_mint to pda ata', async () => {
        const ata = getAssociatedTokenAddressSync(thirdMint.publicKey, pda, true);
        const createInstruction = createAssociatedTokenAccountInstruction(
            signer.publicKey,
            ata,
            pda,
            thirdMint.publicKey
        );
        const mintInstruction = createMintToInstruction(
            thirdMint.publicKey,
            ata,
            signer.publicKey,
            50
        );
        const block = await provider.connection.getLatestBlockhash('finalized');
        const transaction = new Transaction()
            .add(createInstruction)
            .add(mintInstruction);
        transaction.recentBlockhash = block.blockhash;
        await provider.sendAndConfirm(transaction, [signer]);
    });

});
