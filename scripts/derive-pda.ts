import { PublicKey } from '@solana/web3.js';
import {BASE_PROGRAM_ID, SEED} from "../lib/constants";

(async () => {

// Create a PublicKey instance from your base program ID
    const baseProgramId = new PublicKey(BASE_PROGRAM_ID);

// Find the PDA
    const [pda] = await PublicKey.findProgramAddress([Buffer.from(SEED)], baseProgramId);

    console.log('PDA:', pda.toString());

})()
