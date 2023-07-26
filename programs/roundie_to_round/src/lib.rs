use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount};

declare_id!("HgpmQVLjipSFXipjqfjkX2LLKRc8nKBktuEXjpeAqqbe");

#[program]
pub mod roundie_to_round {
    use anchor_lang::solana_program::entrypoint::ProgramResult;
    use super::*;

    pub fn exchange(ctx: Context<Exchange>, amount: u64) -> ProgramResult {
        let seeds: &[&[u8]] = &[b"rndi_rnd"];
        let program_id = ctx.program_id;
        let pda_address = Pubkey::create_program_address(seeds, &program_id).map_err(|_| ErrorCode::InvalidPda)?;

        msg!("Program ID: {}", program_id);

        msg!("Executing exchange: {}", ctx.accounts.user.key);

        if ctx.accounts.pda_account.to_account_info().key != &pda_address {
            msg!("Invalid PDA account info: {}", ctx.accounts.pda_account.to_account_info().key);
            return Err(ErrorCode::InvalidPda.into());
        }

        if *ctx.accounts.token_program.key != token::ID {
            msg!("Invalid token program info: {}", ctx.accounts.token_program.key);
            return Err(ErrorCode::InvalidTokenProgram.into());
        }

        // Transfer from user A to PDA
        let cpi_program = ctx.accounts.token_program.to_account_info().clone();
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.user_token_account_a.to_account_info().clone(),
            to: ctx.accounts.pda_account.to_account_info().clone(),
            authority: ctx.accounts.user.to_account_info().clone(),
        };
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, amount)?;

        // Transfer from PDA to user B
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.pda_account.to_account_info().clone(),
            to: ctx.accounts.user_token_account_b.to_account_info().clone(),
            authority: ctx.accounts.pda_account.to_account_info().clone(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, amount)?;

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
    pda_account: Account<'info, TokenAccount>,
    #[account(executable)]
    /// CHECK: no need to type this
    token_program: AccountInfo<'info>,
}
