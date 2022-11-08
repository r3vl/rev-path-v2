# Chainpass: Contract Spec

The Chainpass upgrade is an upgrade to the V1 Contracts (previously audited by Quantstamp) in order to allow two new primary functionalities:

1. meta transactions via ERC-2771
2. tiers for ERC20 tokens (v1 only had tiers for ETH)

---

## 🕵️ Background

chainpass uses [ITX](https://docs.infura.io/infura/features/itx-transactions) as a relayer so they need meta transactions:

- we can add meta transactions via ERC-2771 [https://docs.openzeppelin.com/contracts/4.x/api/metatx](https://docs.openzeppelin.com/contracts/4.x/api/metatx)

chainpass’s customers primarily want to be paid in USDC, so tiers for ERC20s is a MUST:

- in the v1 contracts (previously audited by Quantstamp) we DO NOT allow ERC20 tiers at all

---

## 🛠️ Chainpass Spec (R3VL V2)

### Design

[https://whimsical.com/revenue-share-v1-GzT38V14ZaPEGdbXpUqCXR@2bsEvpTYSt1HioVkMniVN2nTwBxVQKViH8Z](https://whimsical.com/revenue-share-v1-GzT38V14ZaPEGdbXpUqCXR@2bsEvpTYSt1HioVkMniVN2nTwBxVQKViH8Z)

### User Stories

### Path Creator

1. As a path creator I should be able to designate tiers for ETH, USDC, DAI & WETH. Other tokens do not matter at this time. DAI & WETH are optional. If they add more complexity, do not include them at this time.
2. As a path creator I should be able to set a Token Quantity based limit for each tier
3. As a path creator I should be able to set a group of wallets for a given tier & designate each wallet's distribution share for that tier. The distribution should be percentage based so that it works the same for all token types.
4. As a Path creator the FINAL TIER should have an infinite limit & split each token based on the wallet distribution for that tier in perpetuity
5. As a Path creator I should NOT be able to set a token limit for the FINAL TIER (it must be infinite)
6. As a Path creator I should be able to append new tiers
7. As a Path creator I should be able to add & remove wallets from tiers
8. As a Path creator I should be able to edit the tier limit for a given token & given tier BUT I cannot make it lower than what has already been distributed for that tier
9. As a Path creator (and owner) I should be able to change the trusted forwarder for meta transactions.
10. As a Path creator I can create an path with an empty name.

***Examples***

1. Each Tier should have a set of wallets & shares that is applicable to all Tokens for that tier
2. Each Tier should have a set of TierLimits that are unique to each Token for that tier
    1. For instance:
        1. Wallets & Shares
            1. Tier 1 - [Wallet A, Wallet B], [Wallet A's Share, Wallet B's Share]
            2. Tier 2 - [Wallet A, Wallet C], [Wallet A's Share, Wallet C's Share]
            3. Tier 3 - [Wallet A, B, C, etc], [Share's etc]
        2. Token Limits
            1. Tier 1 - ETH Limit = 1 ETH, USDC Limit = 1,000 USDC, WETH Limit = 1 WETH, etc
            2. Tier 2 - ETH Limit = 0.0001 ETH, USDC Limit = 2,000 USDC, ***WETH Limt = 0.00001 WETH***, etc
            3. Tier 3 - Final Distribution - all limits are ∞

### Path Collaborator

1. As a path collaborator I should be able to withdraw at ANY time, with no warmup / cooldown / waiting period.
2. As a path collaborator I should be able to withdraw ETH, USDC, DAI & WETH in as few transactions as possible.
3. As a path collaborator I should be able to see simple accounting depicting the flow of funds for ETH, USDC, DAI & WETH. It should be obvious & self-explanatory that I have been paid what my tier breakdown allows.
4. As a path collaborator I should be able to easily see what my pending / withdrawable balance is for each token
5. As a path collaborator ETH & ERC20 distributions should happen with the same (or as similar as possible) logic
6. As a path collaborator I should be able to call `withdraw/distribute` at any time & all currently deposited tokens will be distributed for all tiers / tier members
7. (Stretch Goal) As a path collaborator I should be able to withdraw unhandled (random) ERC20 tokens based on the Final Tier Distribution percentages. (For example, shiba should be distributed based on final tier distribution)

### Chainpass Developer

1. As a chainpass developer I should be able to create a blank RevenuePath via a meta transaction from Infura ITX.
2. As a chainpass developer I should be able to return the new RevenuePath address to my end user so that they can navigate to R3VL's UI to add tiers, limits, members, etc.

### Path Developer

1. As a path developer I should be able to query the current tier for each Token (it may be different tiers)
2. As a path developer I should be able to `callStatic` the `withdraw/distribute` function to determine (simulate) the not yet distributed token allocations ([https://docs.ethers.io/v5/api/contract/contract/#contract-callStatic](https://docs.ethers.io/v5/api/contract/contract/#contract-callStatic))
3. As a path developer I should be able to query which tokens are handled in a path
4. As a path developer I should be able to allow a Path Creator to dynamically set arbitrary ERC20 tiers for arbitrary tokens. (i.e. Path A handles shiba & USDC, Path B handles OHM & DAI)
5. As a path developer it should be clear to me that only standard ERC20s are accomodated (no rebasing or deflationary tokens).

