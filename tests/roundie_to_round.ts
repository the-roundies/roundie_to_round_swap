import {
  Program,
  workspace,
  AnchorProvider,
  setProvider,
} from '@coral-xyz/anchor';
import { RoundieToRound } from '../target/types/roundie_to_round';
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { SEED } from '../lib/constants';
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  transfer,
  getAccount,
  createMint,
  mintTo,
  Account,
  createAssociatedTokenAccount,
} from '@solana/spl-token';
import BN from 'bn.js';
import { expect } from 'chai';
import { getKeypair } from '../lib/get-keypair';
import { isAccountInitialized } from '../lib/is-account-initialized';

describe('roundie_to_round', () => {
  // Configure the client to use the local cluster.
  setProvider(AnchorProvider.local());

  const program = workspace.RoundieToRound as Program<RoundieToRound>;

  const connection = new Connection('http://127.0.0.1:8899');

  it('exchanges 10 tokens for 10 tokens', async () => {
    const wallet = await getKeypair();

    const swapAmount = 10;

    const programId = program.programId;

    const [authorityPda, _authorityPdaNonce] = PublicKey.findProgramAddressSync(
      [Buffer.from(SEED)],
      programId
    );

    console.log('authorityPda', authorityPda.toBase58());

    // this is the mint the user (AKA "sender") will provide in exchange for
    // another token
    const oldToken = await createMint(
      connection,
      wallet,
      wallet.publicKey,
      wallet.publicKey,
      0
    );

    console.log('old token mint', oldToken.toBase58());

    // this is the mint the program (AKA "pda") will return in exchange
    // the sender's token
    const newToken = await createMint(
      connection,
      wallet,
      wallet.publicKey,
      wallet.publicKey,
      0
    );

    console.log('new token mint', newToken.toBase58());

    // this is the token account in the user's wallet that will receive the
    // tokens the program will be returning
    const newTokenAccountAddress = await getAssociatedTokenAddress(
      newToken,
      wallet.publicKey
    );

    console.log('newTokenAccountAddress', newTokenAccountAddress.toBase58());

    // this is the token account for the tokens the user
    // is offering
    const oldTokenAccountAddress = await getAssociatedTokenAddress(
      oldToken,
      wallet.publicKey
    );

    console.log('oldTokenAccountAddress', oldTokenAccountAddress.toBase58());

    let oldTokenAccount: Account | undefined;

    try {
      oldTokenAccount = await getAccount(connection, oldTokenAccountAddress);
      console.log(`oldTokenAccount`, oldTokenAccount.address);
    } catch (_) {}

    if (!oldTokenAccount) {
      try {
        console.log('creating oldTokenAccount');
        await createAssociatedTokenAccount(
          connection,
          wallet,
          oldToken,
          wallet.publicKey
        );

        console.log('minting to oldTokenAccount');

        const mint = await mintTo(
          connection,
          wallet,
          oldToken,
          oldTokenAccountAddress,
          wallet,
          1000000
        );

        console.error(`old token account does not exist, minted`, mint);

        oldTokenAccount = await getAccount(connection, oldTokenAccountAddress);

        console.error(`oldTokenAccount`, oldTokenAccount.address.toBase58());
      } catch (e) {
        console.error(e);
        return;
      }
    }

    let newTokenAccount: Account | undefined;

    try {
      newTokenAccount = await getAccount(connection, newTokenAccountAddress);
      console.log(`newTokenAccount`, newTokenAccount.address.toBase58());
    } catch (_) {}

    if (!newTokenAccount) {
      try {
        console.log('creating newTokenAccount');

        await createAssociatedTokenAccount(
          connection,
          wallet,
          newToken,
          wallet.publicKey
        );

        console.log('minting to newTokenAccount');

        await mintTo(
          connection,
          wallet,
          newToken,
          newTokenAccountAddress,
          wallet,
          1000000
        );

        newTokenAccount = await getAccount(connection, newTokenAccountAddress);

        console.log(`newTokenAccount`, newTokenAccount.address.toBase58());
      } catch (e) {
        console.error(e);
        return;
      }
    }

    console.log('deriving PDA accounts...');

    const [mintForReturnPda, _mintForReturnPdaNonce] =
      PublicKey.findProgramAddressSync([newToken.toBuffer()], programId);

    const mintForReturnAta = await getAssociatedTokenAddress(
      newToken,
      mintForReturnPda,
      true
    );

    console.log('mintForReturnPda', mintForReturnPda.toBase58());
    console.log('mintForReturnAta', mintForReturnAta.toBase58());

    const [mintToAcceptPda, _mintToAcceptPdaNonce] =
      PublicKey.findProgramAddressSync([oldToken.toBuffer()], programId);

    const mintToAcceptAta = await getAssociatedTokenAddress(
      oldToken,
      mintToAcceptPda,
      true
    );

    console.log('mintToAcceptPda', mintToAcceptPda.toBase58());
    console.log('mintToAcceptAta', mintToAcceptAta.toBase58());

    const isAuthorityInitialized = await isAccountInitialized(
      connection,
      authorityPda
    );

    console.log('isAuthorityInitialized', isAuthorityInitialized);

    if (!isAuthorityInitialized) {
      console.log('initializing authority');
      try {
        const init = await program.methods
          .initializeAuthority()
          .accounts({
            initializer: wallet.publicKey,
            pdaAuthority: authorityPda,
            rent: SYSVAR_RENT_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log('Authority initialized:', init);
      } catch (error) {
        console.error('Error initializing authority:', error);
        return;
      }
    }

    const isAcceptorInitialized = await isAccountInitialized(
      connection,
      mintToAcceptPda
    );

    console.log('isAcceptorInitialized', isAcceptorInitialized);

    const isSenderInitialized = await isAccountInitialized(
      connection,
      mintForReturnPda
    );

    console.log('isSenderInitialized', isSenderInitialized);

    if (!isAcceptorInitialized || !isSenderInitialized) {
      console.log(
        'isAcceptorInitialized || isSenderInitialized not initialized'
      );
      try {
        const init = await program.methods
          .initialize()
          .accounts({
            initializer: wallet.publicKey,
            pdaAuthority: authorityPda,
            pdaAccountAcceptor: mintToAcceptPda,
            pdaAccountSender: mintForReturnPda,
            mintToAccept: oldToken,
            mintToReturn: newToken,
            rent: SYSVAR_RENT_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log('Program initialized:', init);
      } catch (error) {
        console.error('Error initializing program:', error);
        return;
      }
    } else {
      console.log(
        'isAcceptorInitialized & isSenderInitialized already initialized'
      );
    }

    let mintForReturnPdaInfo: PublicKey | undefined;
    //
    try {
      const ata = await getAssociatedTokenAddress(newToken, mintForReturnPda);
      console.log('ata', ata.toBase58());

      const account = await getAccount(connection, ata);

      console.log('mintForReturnPda owner', account.owner);

      console.log('mintForReturnPda mint', account.mint);

      console.log('mint for return', newToken.toBase58());

      // mintForReturnPdaInfo = await createAssociatedTokenAccount(
      //   connection,
      //   wallet,
      //   newToken,
      //   mintForReturnPda
      // );
      // console.log('mintForReturnPdaInfo', mintForReturnPdaInfo.toBase58());
      // console.log('mintForReturnPda', mintForReturnPda.toBase58());
    } catch (e) {
      console.log('could not create account', e);
      return;
    }

    console.log(
      'mintToAcceptAccount (oldTokenAccount)',
      oldTokenAccountAddress.toBase58()
    );

    try {
      console.log('sending mints to program...');
      const sendMints = await transfer(
        connection,
        wallet,
        newTokenAccountAddress,
        mintForReturnPda,
        wallet.publicKey,
        swapAmount
      );
      console.log(`sent ${swapAmount} mints`, sendMints);
    } catch (e) {
      console.error('error sending mints', e);
      return;
    }

    console.log('beginning swap');

    // 64-bit representation of the amount we want to swap
    const swapAmount64 = new BN(swapAmount);

    let txid: string | undefined;

    try {
      txid = await program.methods
        .exchange(swapAmount64)
        .accounts({
          user: wallet.publicKey,
          pdaAuthority: authorityPda,
          userTokenAccountA: oldTokenAccountAddress,
          userTokenAccountB: newTokenAccountAddress,
          pdaAccountAcceptor: mintToAcceptAta,
          pdaAccountSender: mintForReturnAta,
          mintToAccept: oldToken,
          mintToReturn: newToken,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([wallet])
        .rpc();

      console.log('Transaction sent:', txid);
    } catch (error) {
      console.error('Error sending transaction:', error);
    }

    expect(typeof txid === 'string').to.equal(true);
  });
});
