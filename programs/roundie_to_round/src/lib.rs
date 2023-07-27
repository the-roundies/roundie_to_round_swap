use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount};

declare_id!("HgpmQVLjipSFXipjqfjkX2LLKRc8nKBktuEXjpeAqqbe");

#[program]
pub mod roundie_to_round {
    // use std::str::FromStr;
    use anchor_lang::solana_program::entrypoint::ProgramResult;
    use super::*;

    pub fn exchange(ctx: Context<Exchange>, amount: u64) -> ProgramResult {
        msg!("Deriving seeds");

        let seeds: &[&[u8]] = &[b"rndi_rnd"];
        let program_id = ctx.program_id;
        let pda_address = Pubkey::find_program_address(&seeds, &program_id);
        let pda_pubkey = pda_address.0;

        msg!("Seeds: {:?}", &seeds);

        msg!("Program ID: {}", &program_id);

        msg!("Executing exchange initiated by: {}", ctx.accounts.user.key);

        msg!("Interacting with pubkey: {}", pda_pubkey);

        // if ctx.accounts.pda_account.mint != Pubkey::from_str("") {
        //
        // }

        if ctx.accounts.pda_account.owner != pda_pubkey {
            msg!("Invalid PDA account owner: {}", ctx.accounts.pda_account.owner);
            msg!("Expected PDA account owner: {:?}", pda_pubkey);
            return Err(ErrorCode::InvalidPda.into());
        }

        if *ctx.accounts.token_program.key != token::ID {
            msg!("Invalid token program info: {}", ctx.accounts.token_program.key);
            return Err(ErrorCode::InvalidTokenProgram.into());
        }

        let cpi_program = ctx.accounts.token_program.to_account_info().clone();

        msg!("Transfer from user to PDA");

        // Transfer from user to PDA
        let cpi_accounts_offering = token::Transfer {
            from: ctx.accounts.user_token_account_a.to_account_info().clone(),
            to: ctx.accounts.pda_account_receiver.to_account_info().clone(),
            authority: ctx.accounts.user.to_account_info().clone(),
        };

        let signer_seeds = &[&seeds[..]];
        let cpi_ctx_offering = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts_offering, signer_seeds);
        token::transfer(cpi_ctx_offering, amount)?;

        msg!("Transfer from PDA to user");

        msg!("Transfer from {}", ctx.accounts.pda_account.to_account_info().key);

        msg!("Transfer to {}", ctx.accounts.user_token_account_b.to_account_info().key);

        msg!("With authority {}", ctx.accounts.pda_account.to_account_info().key);

        // Transfer from PDA to user
        let cpi_accounts_returning = token::Transfer {
            from: ctx.accounts.pda_account.to_account_info().clone(),
            to: ctx.accounts.user_token_account_b.to_account_info().clone(),
            authority: ctx.accounts.pda_account.to_account_info(),
        };

        let cpi_ctx_returning = CpiContext::new_with_signer(cpi_program, cpi_accounts_returning, signer_seeds);

        msg!("Executing transfer");

        token::transfer(cpi_ctx_returning, amount)?;

        Ok(())
    }
}

pub enum ErrorCode {
    InvalidTokenProgram,
    InvalidPda,
}

impl From<ErrorCode> for ProgramError {
    fn from(e: ErrorCode) -> Self {
        ProgramError::Custom(e as u32)
    }
}

#[derive(Accounts)]
pub struct Exchange<'info> {
    user: Signer<'info>,
    #[account(mut)]
    user_token_account_a: Account<'info, TokenAccount>,
    #[account(mut)]
    user_token_account_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pda_account_receiver: Account<'info, TokenAccount>,
    #[account(mut)]
    pda_account: Account<'info, TokenAccount>,
    #[account(executable)]
    /// CHECK: no need to type this
    token_program: AccountInfo<'info>,
}
