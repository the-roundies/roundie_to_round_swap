import { AccountInfo, Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export async function isAccountInitialized(
  connection: Connection,
  tokenAccountPubkey: PublicKey
): Promise<boolean> {
  const accountInfo: AccountInfo<Buffer> | null =
    await connection.getAccountInfo(tokenAccountPubkey);

  if (accountInfo === null) {
    // The account does not exist.
    return false;
  }

  if (accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
    // The account exists and is owned by the Token program, so it is a token account.
    // Next, you need to check whether the token account is initialized.

    // Token accounts have a specific layout as defined in the SPL Token program.
    // The mint field in a token account is at byte offset 0 and is 32 bytes long.
    const mint = new PublicKey(accountInfo.data.slice(0, 32));

    if (mint.toBuffer().every((byte) => byte === 0)) {
      // If the mint is the zero public key, the token account has not been initialized.
      return false;
    } else {
      // If the mint is any other public key, the token account has been initialized.
      return true;
    }
  } else {
    // The account exists but is not a token account.
    // You might want to handle this case differently.
    return false;
  }
}
