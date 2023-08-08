import { Program, workspace } from "@coral-xyz/anchor";
import { RoundieToRound } from "../target/types/roundie_to_round";
import { expect, assert } from "chai";
import { newMint, oldMint, otherSigner, pda, signer } from "./0 - setup";

describe('initialize', () => {
    const program = workspace.RoundieToRound as Program<RoundieToRound>;

    const getAccounts = (authority = signer.publicKey) => {
        return {
            authority,
            pda,
            oldTokenMint: oldMint.publicKey,
            newTokenMint: newMint.publicKey
        }
    };

    it('Initialize the pda', async () => {
        const tx = await program.methods
            .initialize()
            .accounts(getAccounts())
            .signers([signer])
            .rpc();
        expect(tx).to.be.ok;
    });

    it('Can initialize the pda from the authority wallet a second time', async () => {
        const tx = await program.methods
            .initialize()
            .accounts(getAccounts())
            .signers([signer])
            .rpc();
        expect(tx).to.be.ok;
    });

    it('Fail to initialize the pda from a different signer', async () => {
        try {
            await program.methods
                .initialize()
                .accounts(getAccounts(otherSigner.publicKey))
                .signers([otherSigner])
                .rpc();
            assert.fail();
        } catch (e) {
            expect(e).to.be.ok;
        }
    });
});

