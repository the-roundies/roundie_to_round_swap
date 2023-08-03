use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;
use anchor_lang::solana_program::pubkey::Pubkey;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("C33wP7zndt1MrsGfGnJ91HT6B7rNZdmMASYvmcoRudNm");

#[program]
pub mod roundie_to_round {
    use super::*;

    /*
        This instruction sets the mint addresses for the tokens to exchange.
        This instruction can only be called by the authority.

        IMPORTANT:
        The first time this instruction gets called there is no check on the
        authority meaning that everyone can call it and set themselves as the
        authority. Make sure you call this instruction at least once after deploying.
     */
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        msg!("Initializing accounts");
        msg!("Mint to accept {}", ctx.accounts.old_token_mint.to_account_info().key);
        msg!("Mint to return {}", ctx.accounts.new_token_mint.to_account_info().key);

        // Updating the data in the PDA account
        ctx.accounts.pda.authority = *ctx.accounts.authority.key;
        ctx.accounts.pda.old_token_mint = *ctx.accounts.old_token_mint.to_account_info().key;
        ctx.accounts.pda.new_token_mint = *ctx.accounts.new_token_mint.to_account_info().key;

        Ok(())
    }

    /*
        This instruction exchanges an amount of old_mint for new_mint. The tokens for
        the new_mint have already been preminted to the pda account. The instruction
        will transfer the old_mint tokens to the pda account and then transfer the
        new_mint tokens from the pda account to the user account.
     */
    pub fn exchange(ctx: Context<Exchange>, amount: u64) -> ProgramResult {
        msg!("Starting Exchange");
        msg!("Mint to accept {}", ctx.accounts.old_token_mint.to_account_info().key);
        msg!("Mint to return {}", ctx.accounts.new_token_mint.to_account_info().key);
        msg!("Amount {}", amount);

        msg!("Transfering old tokens from user to pda");
        Util::transfer_tokens(
            ctx.accounts.user_old_token_account.to_account_info().clone(),
            ctx.accounts.pda_old_token_account.to_account_info().clone(),
            ctx.accounts.user.to_account_info().clone(),
            ctx.accounts.token_program.to_account_info().clone(),
            amount,
            None
        )?;

        let seed: &[u8] = b"rndi_rnd";
        let bump = *ctx.bumps.get("pda").ok_or(ProgramError::InvalidSeeds)?;
        let signer_seeds: &[&[&[u8]]] = &[
            &[seed, &[bump]]
        ];

        msg!("Transfering new tokens from pda to user");
        Util::transfer_tokens(
            ctx.accounts.pda_new_token_account.to_account_info().clone(),
            ctx.accounts.user_new_token_account.to_account_info().clone(),
            ctx.accounts.pda.to_account_info().clone(),
            ctx.accounts.token_program.to_account_info().clone(),
            amount,
            Some(signer_seeds)
        )?;

        Ok(())
    }
}

pub struct Util;
impl <'info>Util {
    pub fn transfer_tokens(sender: AccountInfo<'info>, receiver: AccountInfo<'info>, owner: AccountInfo<'info>, token_program: AccountInfo<'info>, amount: u64, signer_seeds: Option<&[&[&[u8]]]>) -> ProgramResult {
        let accounts = Transfer {
            from: sender,
            to: receiver,
            authority: owner,
        };

        let mut context = CpiContext::new(token_program, accounts);

        if signer_seeds.is_some() {
            context = context.with_signer(signer_seeds.unwrap());
        }

        transfer(context, amount)?;
        Ok(())
    }

}

#[account]
#[derive(Default)]
pub struct Auth {
    pub authority: Pubkey,
    pub old_token_mint: Pubkey,
    pub new_token_mint: Pubkey,
}

#[derive(Accounts)]
pub struct Exchange<'info> {
    #[account(mut)]
    user: Signer<'info>,
    #[account(
        seeds = [b"rndi_rnd"],
        bump,
    )]
    pda: Account<'info, Auth>,

    #[account(
        constraint = new_token_mint.to_account_info().key == &pda.new_token_mint,
    )]
    new_token_mint: Account<'info, Mint>,
    #[account(
        constraint = old_token_mint.to_account_info().key == &pda.old_token_mint,
    )]
    old_token_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = old_token_mint,
        associated_token::authority = user,
    )]
    user_old_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = new_token_mint,
        associated_token::authority = user,
    )]
    user_new_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = old_token_mint,
        associated_token::authority = pda,
    )]
    pda_old_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = new_token_mint,
        associated_token::authority = pda,
    )]
    pda_new_token_account: Account<'info, TokenAccount>,

    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
    associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        mut,
        constraint = authority.key == &pda.authority || pda.authority == Pubkey::default(),
    )]
    authority: Signer<'info>,
    #[account(
        init_if_needed,
        seeds = [b"rndi_rnd"],
        space = 8 + 32 * 3,
        bump,
        payer = authority
    )]
    pda: Account<'info, Auth>,

    old_token_mint: Account<'info, Mint>,
    new_token_mint: Account<'info, Mint>,

    system_program: Program<'info, System>,
}
