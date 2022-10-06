// SPDX-License-Identifier: SPWPL
pragma solidity 0.8.15;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/proxy/utils/Initializable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-solidity/contracts/security/ReentrancyGuard.sol";

/*******************************
 * @title Revenue Path V2
 * @notice The revenue path clone instance contract.
 */

/**
 * #TODO:
 * - ERC20 Distribution accounting -> Tier level balanced
 * - If possible (trigger, all erc20 accounting[Listed])
 * - Separate Limit updates VS Distribution updates
 * - Re-evaluate ETH distribution
 * - Sequential data mapping => Reorg of tiers
 * 
 */
interface IReveelMain {
    function getPlatformWallet() external view returns (address);
}

contract RevenuePathV2 is Ownable, Initializable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BASE = 1e4;
    uint8 public constant VERSION = 2;

    //@notice Addres of platform wallet to collect fees
    address private platformFeeWallet;

    //@notice Status to flag if fee is applicable to the revenue paths
    bool private feeRequired;

    //@notice Status to flag if revenue path is immutable. True if immutable
    bool private isImmutable;

    //@notice Fee percentage that will be applicable for additional tiers
    uint88 private platformFee;

    //@notice Current ongoing tier for eth distribution, in case multiple tiers are added
    uint256 private currentTier;

    //@noitce Total fee accumulated by the revenue path and waiting to be collected.
    uint256 private feeAccumulated;

    //@notice Total ETH that has been released/withdrawn by the revenue path members
    uint256 private totalReleased;

    string private name;

    address private mainFactory;

    /// ETH

    // @notice ETH revenue waiting to be collected for a given address
    mapping(address => uint256) private ethRevenuePending;

    /** @notice For a given tier & address, the eth revenue distribution proportion is returned
     *  @dev Index for tiers starts from 0. i.e, the first tier is marked 0 in the list.
     */
    mapping(uint256 => mapping(address => uint256)) private revenueProportion;

    // @notice Amount of ETH release for a given address
    mapping(address => uint256) private released;

    // @notice Total amount of ETH distributed for a given tier at that time.
    mapping(uint256 => uint256) private totalDistributed;

    /// ERC20
    // @notice ERC20 revenue share/proportion for a given address
    mapping(address => uint256) private erc20RevenueShare;

    /**  @notice For a given token & wallet address, the amount of the token that has been released
    . erc20Released[token][wallet]*/
    mapping(address => mapping(address => uint256)) private erc20Released;

    // @notice Total ERC20 released from the revenue path for a given token address
    mapping(address => uint256) private totalERC20Released;

    /**  @notice For a given token & wallet address, the amount of the token that can been withdrawn by the wallet
    . erc20Withdrawable[token][wallet]*/
    mapping(address => mapping(address => uint256)) public erc20Withdrawable;

    // @notice Total ERC20 accounted for the revenue path for a given token address
    mapping(address => uint256) private totalERC20Accounted;

    // array of address having erc20 distribution shares
    address[] private erc20DistributionWallets;

    struct Revenue {
        uint256 limitAmount;
        address[] walletList;
    }

    struct PathInfo {
        uint88 platformFee;
        address platformWallet;
        bool isImmutable;
        string name;
        address factory;
    }

    /**
     * #TODO: Change structure into keyId => maps
     */
    Revenue[] private revenueTiers;

    /********************************
     *           EVENTS              *
     ********************************/

    /** @notice Emits when incoming ETH is distributed among members
     * @param amount The amount of eth that has been distributed in a tier
     * @param distributionTier the tier index at which the distribution is being done.
     * @param walletList the list of wallet addresses for which ETH has been distributed
     */
    event EthDistributed(uint256 indexed amount, uint256 indexed distributionTier, address[] walletList);

    /** @notice Emits when ETH payment is withdrawn/claimed by a member
     * @param account The wallet for which ETH has been claimed for
     * @param payment The amount of ETH that has been paid out to the wallet
     */
    event PaymentReleased(address indexed account, uint256 indexed payment);

    /** @notice Emits when ERC20 payment is withdrawn/claimed by a member
     * @param token The token address for which withdrawal is made
     * @param account The wallet address to which withdrawal is made
     * @param payment The amount of the given token the wallet has claimed
     */
    event ERC20PaymentReleased(address indexed token, address indexed account, uint256 indexed payment);

   
    /********************************
     *           MODIFIERS          *
     ********************************/
    /** @notice Entrant guard for mutable contract methods
     */
    modifier isAllowed() {
        // require(!isImmutable, "IMMUTABLE_PATH_CAN_NOT_USE_THIS");
        if (isImmutable) {
            revert RevenuePathNotMutable();
        }
        _;
    }

    /********************************
     *           ERRORS          *
     ********************************/


    /** @dev Reverts when the member has zero ETH withdrawal balance available
     */
    error InsufficientWithdrawalBalance();
    /** @dev Reverts when the member has zero percentage shares for ERC20 distribution
     */
    error ZeroERC20Shares(address wallet);

    /** @dev Reverts when wallet has no due ERC20 available for withdrawal
     * @param wallet The member's wallet address
     * @param tokenAddress The requested token address
     */
    error NoDueERC20Payment(address wallet, address tokenAddress);

    /** @dev Reverts when immutable path attempts to use mutable methods
     */
    error RevenuePathNotMutable();

    /** @dev Reverts when contract has insufficient ETH for withdrawal
     * @param contractBalance  The total balance of ETH available in the contract
     * @param requiredAmount The total amount of ETH requested for withdrawal
     */
    error InsufficentBalance(uint256 contractBalance, uint256 requiredAmount);

    /**
     * @dev Reverts when sum of all distribution is not equal to BASE
     */
  

    /********************************
     *           FUNCTIONS           *
     ********************************/

    /** @notice Contract ETH receiver, triggers distribution. Called when ETH is transferred to the revenue path.
     */
    receive() external payable {
        distrbuteIncomingEth(msg.value, currentTier);
    }

    function erc20Accounting(address token) public {
        // Pending asset validatoin
        // Token Lookup
        // Default fallback
    }


    function initialize(
        address[][] memory _walletList,
        uint256[][] memory _distribution,
        uint256[][] memory _tierLimit,
        PathInfo memory pathInfo,
        address _owner
    ) external initializer {
        
    }


    function addRevenueTier(
        address[][] calldata _walletList,
        uint256[][] calldata _distribution
    ) external isAllowed onlyOwner {

    }

 
    function updateRevenueTier(
        address[] calldata _walletList,
        uint256[] calldata _distribution
    ) external isAllowed onlyOwner {

    }

    /**
     * Update Limits based on tokens/ETH separately
     */
    function updateLimits()
        external
        isAllowed
        onlyOwner
    {
       /**
        *  Limit sequence by address pointer
        */

    }

    /** @notice Releases distributed ETH for the provided address
     * @param account The member's wallet address
     */
    function release(address payable account) external {
        if (ethRevenuePending[account] == 0) {
            revert InsufficientWithdrawalBalance();
        }

        uint256 payment = ethRevenuePending[account];
        released[account] += payment;
        totalReleased += payment;
        ethRevenuePending[account] = 0;

        if (feeAccumulated > 0) {
            uint256 value = feeAccumulated;
            feeAccumulated = 0;
            totalReleased += value;
            platformFeeWallet = IReveelMain(mainFactory).getPlatformWallet();
            sendValue(payable(platformFeeWallet), value);
        }

        sendValue(account, payment);
        emit PaymentReleased(account, payment);
    }

    /** @notice Releases allocated ERC20 for the provided address
     * @param token The address of the ERC20 token
     * @param account The member's wallet address
     */
    function releaseERC20(address token, address account) external nonReentrant {
        erc20Accounting(token);
        uint256 payment = erc20Withdrawable[token][account];

        if (payment == 0) {
            revert NoDueERC20Payment({ wallet: account, tokenAddress: token });
        }

        erc20Released[token][account] += payment;
        erc20Withdrawable[token][account] = 0;
        totalERC20Released[token] += payment;

        IERC20(token).safeTransfer(account, payment);

        emit ERC20PaymentReleased(token, account, payment);
    }

    /** @notice Get the limit amoutn & wallet list for a given revenue tier
     * @param tierNumber the index of the tier for which list needs to be provided.
     */
    function getRevenueTier(uint256 tierNumber)
        external
        view
        returns (uint256 _limitAmount, address[] memory _walletList)
    {
        require(tierNumber <= revenueTiers.length, "TIER_DOES_NOT_EXIST");
        uint256 limit = revenueTiers[tierNumber].limitAmount;
        address[] memory listWallet = revenueTiers[tierNumber].walletList;
        return (limit, listWallet);
    }

    /** @notice Get the totalNumber of revenue tiers in the revenue path
     */
    function getTotalRevenueTiers() external view returns (uint256 total) {
        return revenueTiers.length;
    }

    /** @notice Get the current ongoing tier of revenue path
     */
    function getCurrentTier() external view returns (uint256 tierNumber) {
        return currentTier;
    }

    /** @notice Get the current ongoing tier of revenue path
     */
    function getFeeRequirementStatus() external view returns (bool required) {
        return feeRequired;
    }

    /** @notice Get the pending eth balance for given address
     */
    function getPendingEthBalance(address account) external view returns (uint256 pendingAmount) {
        return ethRevenuePending[account];
    }

    /** @notice Get the ETH revenue proportion for a given account at a given tier
     */
    function getRevenueProportion(uint256 tier, address account) external view returns (uint256 proportion) {
        return revenueProportion[tier][account];
    }

    /** @notice Get the amount of ETH distrbuted for a given tier
     */

    function getTierDistributedAmount(uint256 tier) external view returns (uint256 amount) {
        return totalDistributed[tier];
    }

    /** @notice Get the amount of ETH accumulated for fee collection
     */

    function getTotalFeeAccumulated() external view returns (uint256 amount) {
        return feeAccumulated;
    }

    /** @notice Get the amount of ETH accumulated for fee collection
     */

    function getERC20Released(address token, address account) external view returns (uint256 amount) {
        return erc20Released[token][account];
    }

    /** @notice Get the platform wallet address
     */
    function getPlatformWallet() external view returns (address) {
        return platformFeeWallet;
    }

    /** @notice Get the platform fee percentage
     */
    function getPlatformFee() external view returns (uint256) {
        return platformFee;
    }

    /** @notice Get the revenue path Immutability status
     */
    function getImmutabilityStatus() external view returns (bool) {
        return isImmutable;
    }

    /** @notice Get the total amount of eth withdrawn from revenue path
     */
    function getTotalEthReleased() external view returns (uint256) {
        return totalReleased;
    }

    /** @notice Get the revenue path name.
     */
    function getRevenuePathName() external view returns (string memory) {
        return name;
    }

    /** @notice Get the amount of total eth withdrawn by the account
     */
    function getEthWithdrawn(address account) external view returns (uint256) {
        return released[account];
    }

    /** @notice Get the erc20 revenue share percentage for given account
     */
    function getErc20WalletShare(address account) external view returns (uint256) {
        return erc20RevenueShare[account];
    }

    /** @notice Get the total erc2o released from the revenue path.
     */
    function getTotalErc20Released(address token) external view returns (uint256) {
        return totalERC20Released[token];
    }

    /** @notice Get the token amount that has not been accounted for in the revenue path
     */
    function getPendingERC20Account(address token) external view returns (uint256) {
        uint256 pathTokenBalance = IERC20(token).balanceOf(address(this));
        uint256 pendingAmount = (pathTokenBalance + totalERC20Released[token]) - totalERC20Accounted[token];

        return pendingAmount;
    }

    function getTierWalletCount(uint256 tier) external view returns (uint256) {
        return revenueTiers[tier].walletList.length;
    }

    /** @notice Transfer handler for ETH
     * @param recipient The address of the receiver
     * @param amount The amount of ETH to be received
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        if (address(this).balance < amount) {
            revert InsufficentBalance({ contractBalance: address(this).balance, requiredAmount: amount });
        }

        (bool success, ) = recipient.call{ value: amount }("");
        require(success, "ETH_TRANSFER_FAILED");
    }

    /** @notice Distributes received ETH based on the required conditions of the tier sequences
     * @param amount The amount of ETH to be distributed
     * @param presentTier The current tier for which distribution will take place.
     */

    function distrbuteIncomingEth(uint256 amount, uint256 presentTier) private {
        uint256 currentTierDistribution = amount;
        uint256 nextTierDistribution;

        if (
            totalDistributed[presentTier] + amount > revenueTiers[presentTier].limitAmount &&
            revenueTiers[presentTier].limitAmount > 0
        ) {
            currentTierDistribution = revenueTiers[presentTier].limitAmount - totalDistributed[presentTier];
            nextTierDistribution = amount - currentTierDistribution;
        }

        uint256 totalDistributionAmount = currentTierDistribution;

        if (platformFee > 0 && feeRequired) {
            uint256 feeDeduction = ((currentTierDistribution * platformFee) / BASE);
            feeAccumulated += feeDeduction;
            currentTierDistribution -= feeDeduction;
        }

        uint256 totalMembers = revenueTiers[presentTier].walletList.length;

        for (uint256 i; i < totalMembers; ) {
            address wallet = revenueTiers[presentTier].walletList[i];
            ethRevenuePending[wallet] += ((currentTierDistribution * revenueProportion[presentTier][wallet]) / BASE);
            unchecked {
                i++;
            }
        }

        totalDistributed[presentTier] += totalDistributionAmount;

        emit EthDistributed(currentTierDistribution, presentTier, revenueTiers[presentTier].walletList);

        if (nextTierDistribution > 0) {
            currentTier += 1;
            return distrbuteIncomingEth(nextTierDistribution, currentTier);
        }
    }
}
