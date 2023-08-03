import { AnchorProvider, Program, getProvider, setProvider, workspace } from '@coral-xyz/anchor';
import { RoundieToRound } from '../target/types/roundie_to_round';
import { Connection } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { newMint, pda, oldMint, signer, thirdMint } from './0 - setup';
import BN from 'bn.js';
import { expect } from 'chai';

describe('exchange', () => {
    const program = workspace.RoundieToRound as Program<RoundieToRound>;

    const getAccounts = (oldTokenMint = oldMint.publicKey, newTokenMint = newMint.publicKey) => {
        return {
            user: signer.publicKey,
            pda,
            pdaNewTokenAccount: getAssociatedTokenAddressSync(newTokenMint, pda, true),
            pdaOldTokenAccount: getAssociatedTokenAddressSync(oldTokenMint, pda, true),
            userNewTokenAccount: getAssociatedTokenAddressSync(newTokenMint, signer.publicKey),
            userOldTokenAccount: getAssociatedTokenAddressSync(oldTokenMint, signer.publicKey),
            oldTokenMint,
            newTokenMint
        }
    };

    it('Exchange 10 tokens for 10 tokens', async () => {
        const tx = await program.methods
            .exchange(new BN(10))
            .accounts(getAccounts())
            .signers([signer])
            .rpc();
        expect(tx).to.be.ok;
    });

    it('Fail to exchange 10 tokens for 10 tokens with invalid old_mint', async () => {
        try {
            await program.methods
                .exchange(new BN(10))
                .accounts(getAccounts(thirdMint.publicKey))
                .signers([signer])
                .rpc();
            expect.fail();
        } catch (e) {
            expect(e).to.be.ok;
        }
    });

    it('Fail to exchange 10 tokens for 10 tokens with invalid new_mint', async () => {
        try {
            await program.methods
                .exchange(new BN(10))
                .accounts(getAccounts(oldMint.publicKey, thirdMint.publicKey))
                .signers([signer])
                .rpc();
            expect.fail();
        } catch (e) {
            expect(e).to.be.ok;
        }
    });
});

