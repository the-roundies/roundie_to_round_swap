import { workspace } from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RoundieToRound } from "../target/types/roundie_to_round";

describe("roundie_to_round", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = workspace.RoundieToRound as Program<RoundieToRound>;

  it("Is initialized!", async () => {
    // Add your test here.
    // const tx = await program.methods.exchange({
    //
    // });
    // console.log("Your transaction signature", tx);
  });
});
