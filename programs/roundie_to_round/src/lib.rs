use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("C33wP7zndt1MrsGfGnJ91HT6B7rNZdmMASYvmcoRudNm");

#[program]
pub mod roundie_to_round {
    use std::str::FromStr;
    use anchor_lang::solana_program::entrypoint::ProgramResult;
    use super::*;

    pub fn initialize_authority(_ctx: Context<InitializeAuthority>) -> ProgramResult {
        msg!("Initializing authority");

        Ok(())
    }

    // TODO: refactor this to validate mints in it's own function
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        msg!("Initializing accounts");

        msg!("Mint to accept {}", ctx.accounts.mint_to_accept.to_account_info().key);

        msg!("Mint to return {}", ctx.accounts.mint_to_return.to_account_info().key);

        Ok(())
    }

    pub fn exchange(ctx: Context<Exchange>, amount: u64) -> ProgramResult {
        msg!("Beginning exchange operation");

        // TODO: use refactored fn to validate mints
        let mint_to_accept = "FRDBGxn9zaGmYWFZREdXMJZ7hiar9KHmaEPA4yQYs56Z";
        let mint_to_return = "4m3yG7EKgAXXFJUTDLLFBQ91QmJwiG8T9nC2YGcfpj1m";
        let mint_to_accept_pub_key = Pubkey::from_str(&mint_to_accept).unwrap();
        let mint_to_return_pub_key = Pubkey::from_str(&mint_to_return).unwrap();

        let seed_phrase = b"rndi_rnd";
        let (pda_authority, pda_authority_bump) = Pubkey::find_program_address(&[seed_phrase.as_ref()], ctx.program_id);
        let pda_authority_seed: &[&[&[u8]]] = &[&[&[pda_authority_bump]]];

        let acceptor_seed = &[
            mint_to_accept_pub_key.as_ref()
        ];
        let return_seed = &[
            mint_to_return_pub_key.as_ref()
        ];

        let (pda_account_acceptor, _pda_acceptor_bump_seed) = Pubkey::find_program_address(
            acceptor_seed,
            ctx.program_id
        );
        let (pda_account_sender, _pda_sender_bump_seed) = Pubkey::find_program_address(
            return_seed,
            ctx.program_id
        );

        msg!("acceptor_seed: {:?}", &acceptor_seed);

        msg!("return_seed: {:?}", &return_seed);

        msg!("Executing exchange initiated by: {}", ctx.accounts.user.key);

        msg!("Acceptor PDA: {}", pda_account_acceptor.key());

        msg!("Sender PDA: {}", pda_account_sender.key());

        if ctx.accounts.mint_to_return.to_account_info().key != &mint_to_return_pub_key {
            msg!("Invalid mint to return offered: {}", ctx.accounts.mint_to_return.to_account_info().key);
            return Err(ErrorCode::InvalidMint.into());
        }

        if ctx.accounts.mint_to_accept.to_account_info().key != &mint_to_accept_pub_key {
            msg!("Invalid mint to accept offered: {}", ctx.accounts.mint_to_accept.to_account_info().key);
            return Err(ErrorCode::InvalidMint.into());
        }

        if ctx.accounts.pda_account_sender.owner != pda_authority {
            msg!("Invalid PDA account owner: {}", ctx.accounts.pda_account_sender.owner);
            msg!("Expected PDA account owner: {:?}", pda_authority);
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
            to: ctx.accounts.pda_account_acceptor.to_account_info().clone(),
            authority: ctx.accounts.user.to_account_info().clone(),
        };

        let cpi_ctx_offering = CpiContext::new_with_signer(
            cpi_program.clone(),
            cpi_accounts_offering,
            pda_authority_seed
        );
        token::transfer(cpi_ctx_offering, amount)?;

        msg!("Transfer from PDA to user. PDA owner {}", ctx.accounts.pda_account_sender.owner);

        msg!("Transfer from {}", ctx.accounts.pda_account_sender.to_account_info().key);

        msg!("Transfer to {}", ctx.accounts.user_token_account_b.to_account_info().key);

        msg!("With authority {}", ctx.accounts.user.to_account_info().clone().key);

        // Transfer from PDA to user
        let cpi_accounts_returning = token::Transfer {
            from: ctx.accounts.pda_account_sender.to_account_info().clone(),
            to: ctx.accounts.user_token_account_b.to_account_info().clone(),
            authority: ctx.accounts.pda_account_sender.to_account_info().clone(),
        };

        let cpi_ctx_returning = CpiContext::new_with_signer(
            cpi_program.clone(),
            cpi_accounts_returning,
            pda_authority_seed,
        );

        msg!("Executing transfer");

        token::transfer(cpi_ctx_returning, amount)?;

        Ok(())
    }
}

pub enum ErrorCode {
    InvalidTokenProgram,
    InvalidPda,
    InvalidMint,
}

impl From<ErrorCode> for ProgramError {
    fn from(e: ErrorCode) -> Self {
        ProgramError::Custom(e as u32)
    }
}

#[account]
pub struct Auth {}

#[derive(Accounts)]
pub struct Exchange<'info> {
    #[account(mut)]
    user: Signer<'info>,
    pda_authority: Account<'info, Auth>,
    #[account(mut)]
    user_token_account_a: Account<'info, TokenAccount>,
    #[account(mut)]
    user_token_account_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pda_account_acceptor: Account<'info, TokenAccount>,
    #[account(mut)]
    pda_account_sender: Account<'info, TokenAccount>,
    mint_to_accept: Account<'info, Mint>,
    mint_to_return: Account<'info, Mint>,
    rent: Sysvar<'info, Rent>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeAuthority<'info> {
    #[account(mut)]
    initializer: Signer<'info>,
    #[account(
        init,
        seeds = [b"rndi_rnd".as_ref()],
        bump,
        payer = initializer,
        space = TokenAccount::LEN
    )]
    pda_authority: Account<'info, Auth>,
    rent: Sysvar<'info, Rent>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    initializer: Signer<'info>,
    #[account(mut)]
    pda_authority: Account<'info, Auth>,
    #[account(
        init,
        seeds = [mint_to_accept.key().as_ref()],
        bump,
        payer = initializer,
        token::mint = mint_to_accept,
        token::authority = pda_authority,
    )]
    pda_account_acceptor: Account<'info, TokenAccount>,
    #[account(
        init,
        seeds = [mint_to_return.key().as_ref()],
        bump,
        payer = initializer,
        token::mint = mint_to_return,
        token::authority = pda_authority,
    )]
    pda_account_sender: Account<'info, TokenAccount>,
    mint_to_accept: Account<'info, Mint>,
    mint_to_return: Account<'info, Mint>,
    rent: Sysvar<'info, Rent>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}
