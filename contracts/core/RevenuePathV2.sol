// SPDX-License-Identifier: SPWPL
pragma solidity 0.8.15;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/proxy/utils/Initializable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-solidity/contracts/security/ReentrancyGuard.sol";
import "@opengsn/contracts/src/ERC2771Recipient.sol";

/*******************************
 * @title Revenue Path V2
 * @notice The revenue path clone instance contract.
 */

interface IReveelMainV2 {
    function getPlatformWallet() external view returns (address);
}

contract RevenuePathV2 is ERC2771Recipient, Ownable, Initializable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BASE = 1e7;
    uint8 public constant VERSION = 2;

    //@notice Addres of platform wallet to collect fees
    address private platformFeeWallet;

    //@notice Status to flag if fee is applicable to the revenue paths
    bool private feeRequired;

    //@notice Status to flag if revenue path is immutable. True if immutable
    bool private isImmutable;

    //@notice Fee percentage that will be applicable for additional tiers
    uint88 private platformFee;

    //@notice name of the revenue path
    string private name;

    //@notice address of origin factory
    address private mainFactory;

    /** @notice For a given tier & address, the eth revenue distribution proportion is returned
     *  @dev Index for tiers starts from 0. i.e, the first tier is marked 0 in the list.
     */
    mapping(uint256 => mapping(address => uint256)) private revenueProportion;

    // @notice Amount of token released for a given wallet [token][wallet]=>[amount]
    mapping(address => mapping(address => uint256)) private released;

    //@notice ERC20 tier limits for given token address and tier
    mapping(address => mapping(uint256 => uint256)) public tokenTierLimits;

    mapping(address => uint256) private currentTokenTier;

    // @notice Total token released from the revenue path for a given token address
    mapping(address => uint256) public totalTokenReleased;

    // @notice Total ERC20 accounted for the revenue path for a given token address
    mapping(address => uint256) public totalTokenAccounted;

    /**  @notice For a given token & wallet address, the amount of the token that can been withdrawn by the wallet
    [token][wallet]*/
    mapping(address => mapping(address => uint256)) public tokenWithdrawable;

    // @notice Total amount of token distributed for a given tier at that time.
    //[token][tier]-> [distributed amount]
    mapping(address => mapping(uint256 => uint256)) private totalDistributed;

    //@noitce Total fee accumulated by the revenue path and waiting to be collected.
    mapping(address => uint256) private feeAccumulated;

    struct RevenuePath {
        address[] walletList;
    }

    struct PathInfo {
        uint88 platformFee;
        address platformWallet;
        bool isImmutable;
        string name;
        address factory;
        address forwarder;
    }

    /**
     * #TODO: Change structure into keyId => maps
     */
    RevenuePath[] private revenueTiers;

    /********************************
     *           EVENTS              *
     ********************************/

    /** @notice Emits when token payment is withdrawn/claimed by a member
     * @param account The wallet for which ETH has been claimed for
     * @param payment The amount of ETH that has been paid out to the wallet
     */
    event PaymentReleased(address indexed account, address indexed token, uint256 indexed payment);

    /** @notice Emits when ERC20 payment is withdrawn/claimed by a member
     * @param token The token address for which withdrawal is made
     * @param account The wallet address to which withdrawal is made
     * @param payment The amount of the given token the wallet has claimed
     */
    event ERC20PaymentReleased(address indexed token, address indexed account, uint256 indexed payment);

    /** @notice Emits when tokens are distributed during withdraw or external distribution call
     *  @param token Address of token for distribution. Zero address for native token like ETH
     *  @param amount The amount of token distributed in wei
     *  @param tier The tier for which the distribution occured
     */
    event TokenDistributed(address indexed token, uint256 indexed amount, uint256 indexed tier);

    /**
     *  @notice Emits when fee is distributed
     *  @param token The token address. Address 0 for native gas token like ETH
     *  @param amount The amount of fee deducted
     */
    event FeeDistributed(address indexed token, uint256 indexed amount);

    /**
     *  @notice Emits when fee is released
     *  @param token The token address. Address 0 for native gas token like ETH
     *  @param amount The amount of fee released
     */
    event FeeReleased(address indexed token, uint256 indexed amount);

    /********************************
     *           MODIFIERS          *
     ********************************/
    /** @notice Entrant guard for mutable contract methods
     */
    modifier isAllowed() {
        if (isImmutable) {
            revert RevenuePathNotMutable();
        }
        _;
    }

    /********************************
     *           ERRORS          *
     ********************************/

    /** @dev Reverts when passed wallet list and distribution list length is not equal
     * @param walletCount Length of wallet list
     * @param distributionCount Length of distribution list
     */
    error WalletAndDistrbtionCtMismatch(uint256 walletCount, uint256 distributionCount);

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
     *  @dev Reverts when duplicate wallet entry is present during addition or updates
     */
    error DuplicateWalletEntry();

    /**
     * @dev In case invalid zero address is provided for wallet address
     */
    error ZeroAddressProvided();

    /**
     * @dev Reverts when zero distribution percentage is provided
     */
    error ZeroDistributionProvided();

    /**
     * @dev Reverts when summation of distirbution is not equal to BASE
     */
    error TotalShareNot100();

    /**
     * @dev Reverts when a tier not in existence or added is attempted for update
     */
    error OnlyExistingTiersCanBeUpdated();

    /**
     * @dev Reverts when token already released is greater than the new limit that's being set for the tier.
     */
    error TokenLimitNotValid();

    /**
     *  @dev Reverts when tier limit given is zero in certain cases
     */
    error TierLimitGivenZero();

    /**
     * @dev Reverts when tier limit of a non-existant tier is attempted
     */
    error OnlyExistingTierLimitsCanBeUpdated();

    /**
     * @dev The total numb of tokens and equivalent token limit list count mismatch
     */
    error TokensAndTierLimitMismatch(uint256 tokenCount, uint256 limitListCount);

    /**
     * @dev The total tiers list and limits list length mismatch
     */
    error TotalTierLimitsMismatch();

    /**
     * @dev Reverts when final tier is attempted for updates
     */
    error FinalTierLimitNotUpdatable();

    /********************************
     *           FUNCTIONS           *
     ********************************/

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    /** @notice Called for a given token to distribute, unallocated tokens to the respective tiers and wallet members
     *  @param token The address of the token
     */
    function distrbutePendingTokens(address token) public {
        uint256 presentTier;
        uint256 pendingAmount = getPendingDistributionAmount(token);

        uint256 currentTierDistribution;
        uint256 nextTierDistribution;
        while (pendingAmount > 0) {
            if (
                tokenTierLimits[token][presentTier] > 0 &&
                (totalDistributed[token][presentTier] + pendingAmount) > tokenTierLimits[token][presentTier]
            ) {
                currentTierDistribution = tokenTierLimits[token][presentTier] - totalDistributed[token][presentTier];
                nextTierDistribution = pendingAmount - currentTierDistribution;
            } else {
                currentTierDistribution = pendingAmount;
                nextTierDistribution = 0;
            }

            if (currentTierDistribution > 0) {
                address[] memory walletMembers = revenueTiers[presentTier].walletList;
                uint256 totalWallets = walletMembers.length;
                uint256 feeDeduction;
                if (feeRequired && platformFee > 0) {
                    feeDeduction = ((currentTierDistribution * platformFee) / BASE);
                    feeAccumulated[token] += feeDeduction;
                    currentTierDistribution -= feeDeduction;
                    emit FeeDistributed(token,feeDeduction);
                }

                for (uint256 i; i < totalWallets; ) {
                    tokenWithdrawable[token][walletMembers[i]] += ((currentTierDistribution *
                        revenueProportion[presentTier][walletMembers[i]]) / BASE);
                    unchecked {
                        i++;
                    }
                }

                totalTokenAccounted[token] += (currentTierDistribution + feeDeduction);
                totalDistributed[token][presentTier] += (currentTierDistribution + feeDeduction);
                emit TokenDistributed(token, currentTierDistribution, presentTier);
            }
            pendingAmount = nextTierDistribution;
            if (nextTierDistribution > 0) {
                presentTier += 1;
                currentTokenTier[token] += 1;
            }
        }
    }


    /** @notice Get the token amount that has not been allocated for in the revenue path
     */
    function getPendingDistributionAmount(address token) public view returns (uint256) {
        uint256 pathTokenBalance;
        if (token == address(0)) {
            pathTokenBalance = address(this).balance;
        } else {
            pathTokenBalance = IERC20(token).balanceOf(address(this));
        }
        uint256 pendingAmount = (pathTokenBalance + totalTokenReleased[token]) - totalTokenAccounted[token];
        return pendingAmount;
    }

    /** @notice Initializes revenue path
     *  @param _walletList Nested array for wallet list across different tiers
     *  @param _distribution Nested array for distribution percentage across different tiers
     *  @param _tokenList A list of tokens for which limits will be set
     *  @param _limitSequence A nested array of limits for each token
     *  @param pathInfo A property object for the path details
     *  @param _owner Address of path owner
     */

    function initialize(
        address[][] memory _walletList,
        uint256[][] memory _distribution,
        address[] memory _tokenList,
        uint256[][] memory _limitSequence,
        PathInfo memory pathInfo,
        address _owner
    ) external initializer {
        uint256 totalTiers = _walletList.length;
        uint256 totalTokens = _tokenList.length;
        if (totalTiers != _distribution.length) {
            revert WalletAndDistrbtionCtMismatch({
                walletCount: _walletList.length,
                distributionCount: _distribution.length
            });
        }

        if (totalTokens != _limitSequence.length) {
            revert TokensAndTierLimitMismatch({ tokenCount: totalTokens, limitListCount: _limitSequence.length });
        }
        for (uint256 i; i < totalTiers; ) {
            RevenuePath memory tier;

            uint256 walletMembers = _walletList[i].length;

            if (walletMembers != _distribution[i].length) {
                revert WalletAndDistrbtionCtMismatch({
                    walletCount: walletMembers,
                    distributionCount: _distribution[i].length
                });
            }

            tier.walletList = _walletList[i];

            uint256 totalShare;
            for (uint256 j; j < walletMembers; ) {
                address wallet = (_walletList[i])[j];
                if (revenueProportion[i][wallet] > 0) {
                    revert DuplicateWalletEntry();
                }
                if (wallet == address(0)) {
                    revert ZeroAddressProvided();
                }
                if ((_distribution[i])[j] == 0) {
                    revert ZeroDistributionProvided();
                }
                revenueProportion[i][wallet] = (_distribution[i])[j];
                totalShare += (_distribution[i])[j];
                unchecked {
                    j++;
                }
            }
            if (totalShare != BASE) {
                revert TotalShareNot100();
            }
            revenueTiers.push(tier);

            unchecked {
                i++;
            }
        }

        for (uint256 k; k < totalTokens; ) {
            address token = _tokenList[k];
            for (uint256 m; m < totalTiers; ) {
                if ((totalTiers - 1) != _limitSequence[k].length) {
                    revert TotalTierLimitsMismatch();
                }
                // set tier limits, except for final tier which has no limit
                if (m != totalTiers - 1) {
                    if (_limitSequence[k][m] == 0) {
                        revert TierLimitGivenZero();
                    }
                    tokenTierLimits[token][m] = _limitSequence[k][m];
                }

                unchecked {
                    m++;
                }
            }

            unchecked {
                k++;
            }
        }

        if (revenueTiers.length > 1) {
            feeRequired = true;
        }
        mainFactory = pathInfo.factory;
        platformFee = pathInfo.platformFee;
        isImmutable = pathInfo.isImmutable;
        name = pathInfo.name;
        _transferOwnership(_owner);
        _setTrustedForwarder(pathInfo.forwarder);
    }

    /** @notice Adding new revenue tiers
     *  @param _walletList a nested list of new wallets
     *  @param _distribution a nested list of corresponding distribution
     */
    function addRevenueTier(address[][] calldata _walletList, uint256[][] calldata _distribution)
        external
        isAllowed
        onlyOwner
    {
        if (_walletList.length != _distribution.length) {
            revert WalletAndDistrbtionCtMismatch({
                walletCount: _walletList.length,
                distributionCount: _distribution.length
            });
        }

        uint256 listLength = _walletList.length;
        uint256 nextRevenueTier = revenueTiers.length;

        for (uint256 i; i < listLength; ) {
            uint256 walletMembers = _walletList[i].length;

            if (walletMembers != _distribution[i].length) {
                revert WalletAndDistrbtionCtMismatch({
                    walletCount: walletMembers,
                    distributionCount: _distribution[i].length
                });
            }
            RevenuePath memory tier;
            tier.walletList = _walletList[i];
            uint256 totalShares;
            for (uint256 j; j < walletMembers; ) {
                if (revenueProportion[nextRevenueTier][(_walletList[i])[j]] > 0) {
                    revert DuplicateWalletEntry();
                }

                if ((_walletList[i])[j] == address(0)) {
                    revert ZeroAddressProvided();
                }
                if ((_distribution[i])[j] == 0) {
                    revert ZeroDistributionProvided();
                }

                revenueProportion[nextRevenueTier][(_walletList[i])[j]] = (_distribution[i])[j];
                totalShares += (_distribution[i])[j];
                unchecked {
                    j++;
                }
            }

            if (totalShares != BASE) {
                revert TotalShareNot100();
            }
            revenueTiers.push(tier);
            nextRevenueTier += 1;

            unchecked {
                i++;
            }
        }
        if (!feeRequired) {
            feeRequired = true;
        }
    }

    /** @notice Updating distribution for existing revenue tiers
     *  @param _walletList A nested list of wallet address
     *  @param _distribution A nested list of distribution percentage
     *  @param _tierNumbers A list of tier numbers to be updated
     */
    function updateRevenueTier(
        address[][] calldata _walletList,
        uint256[][] calldata _distribution,
        uint256[] calldata _tierNumbers
    ) external isAllowed onlyOwner {

        uint256 totalUpdates = _tierNumbers.length;
        if (_walletList.length != _distribution.length && _walletList.length != totalUpdates ) {
            revert WalletAndDistrbtionCtMismatch({
                walletCount: _walletList.length,
                distributionCount: _distribution.length
            });
        }

        uint256 totalTiers = revenueTiers.length;

        for (uint256 i; i < totalUpdates; ) {
            uint256 totalWallets = _walletList[i].length;
            if (totalWallets != _distribution[i].length) {
                revert WalletAndDistrbtionCtMismatch({
                    walletCount: _walletList[i].length,
                    distributionCount: _distribution[i].length
                });
            }
            uint256 tier = _tierNumbers[i];
            if (tier >= totalTiers) {
                revert OnlyExistingTiersCanBeUpdated();
            }

            uint256 totalShares;
            address[] memory newWalletList = new address[](totalWallets);
            for (uint256 j; j < totalWallets; ) {
                address wallet = (_walletList[i])[j];
                if (revenueProportion[tier][wallet] > 0) {
                    revert DuplicateWalletEntry();
                }

                if (wallet == address(0)) {
                    revert ZeroAddressProvided();
                }
                if ((_distribution[i])[j] == 0) {
                    revert ZeroDistributionProvided();
                }
                revenueProportion[tier][wallet] = (_distribution[i])[j];
                totalShares += (_distribution[i])[j];
                newWalletList[j] = wallet;

                unchecked {
                    j++;
                }
            }
            revenueTiers[tier].walletList = newWalletList;
            if (totalShares != BASE) {
                revert TotalShareNot100();
            }
            unchecked {
                i++;
            }
        }
    }

    /** @notice Update tier limits for given tokens for an existing tier
     * @param tokenList A list of tokens for which limits will be updated
     * @param newLimits A list of corresponding limits for the tokens
     * @param tier The tier for which limits are being updated
     */
    function updateLimits(
        address[] calldata tokenList,
        uint256[] calldata newLimits,
        uint256 tier
    ) external isAllowed onlyOwner {
        uint256 listCount = tokenList.length;
        uint256 totalTiers = revenueTiers.length;

        if (listCount != newLimits.length) {
            revert TokensAndTierLimitMismatch({ tokenCount: listCount, limitListCount: newLimits.length });
        }
        if (tier >= totalTiers) {
            revert OnlyExistingTierLimitsCanBeUpdated();
        }

        if (tier == totalTiers - 1) {
            revert FinalTierLimitNotUpdatable();
        }

        for (uint256 i; i < listCount; ) {
            if (totalDistributed[tokenList[i]][tier] > newLimits[i]) {
                revert TokenLimitNotValid();
            }
            tokenTierLimits[tokenList[i]][tier] = newLimits[i];

            unchecked {
                i++;
            }
        }
    }

    /** @notice Releases distribute token
     * @param token The token address
     * @param account The address of the receiver
     */
    function release(address token, address payable account) external {
        distrbutePendingTokens(token);
        uint256 payment = tokenWithdrawable[token][account];
            if (payment == 0) {
                revert InsufficientWithdrawalBalance();
            }
                    
            released[token][account] += payment;
            totalTokenReleased[token] += payment;
            tokenWithdrawable[token][account] = 0;

        if (token == address(0)) {


            if (feeAccumulated[token] > 0) {
                uint256 value = feeAccumulated[token];
                feeAccumulated[token] = 0;
                totalTokenReleased[token] += value;
                platformFeeWallet = IReveelMainV2(mainFactory).getPlatformWallet();
                sendValue(payable(platformFeeWallet), value);
                emit FeeReleased(token,value);
            }

            sendValue(account, payment);
            emit PaymentReleased(account, token, payment);
        } else {

            if (feeAccumulated[token] > 0) {
                uint256 value = feeAccumulated[token];
                feeAccumulated[token] = 0;
                totalTokenReleased[token] += value;
                platformFeeWallet = IReveelMainV2(mainFactory).getPlatformWallet();
                IERC20(token).safeTransfer(platformFeeWallet, value);
                emit FeeReleased(token,value);
            }

            IERC20(token).safeTransfer(account, payment);

            emit ERC20PaymentReleased(token, account, payment);
        }
    }

    /** @notice Get the wallet list for a given revenue tier
     * @param tierNumber the index of the tier for which list needs to be provided.
     */
    function getRevenueTier(uint256 tierNumber) external view returns (address[] memory _walletList) {
        require(tierNumber <= revenueTiers.length, "TIER_DOES_NOT_EXIST");
        address[] memory listWallet = revenueTiers[tierNumber].walletList;
        return (listWallet);
    }

    /** @notice Get the totalNumber of revenue tiers in the revenue path
     */
    function getTotalRevenueTiers() external view returns (uint256 total) {
        return revenueTiers.length;
    }

    /** @notice Get the current ongoing tier of revenue path
     * For eth: token address(0) is reserved
     */
    function getCurrentTier(address token) external view returns (uint256 tierNumber) {
        return currentTokenTier[token];
    }

    /** @notice Get the current ongoing tier of revenue path
     */
    function getFeeRequirementStatus() external view returns (bool required) {
        return feeRequired;
    }

    /** @notice Get the ETH revenue proportion for a given account at a given tier
     */
    function getRevenueProportion(uint256 tier, address account) external view returns (uint256 proportion) {
        return revenueProportion[tier][account];
    }

    /** @notice Get the amount of ETH distrbuted for a given tier
     */

    function getTierDistributedAmount(address token, uint256 tier) external view returns (uint256 amount) {
        return totalDistributed[token][tier];
    }

    /** @notice Get the amount of ETH accumulated for fee collection
     */

    function getTotalFeeAccumulated(address token) external view returns (uint256 amount) {
        return feeAccumulated[token];
    }

    /** @notice Get the amount of token released for a given account
     */

    function getTokenReleased(address token, address account) external view returns (uint256 amount) {
        return released[token][account];
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

    /** @notice Get the revenue path name.
     */
    function getRevenuePathName() external view returns (string memory) {
        return name;
    }

    /** @notice Get the amount of total eth withdrawn by the account
     */
    function getTokenWithdrawn(address token, address account) external view returns (uint256) {
        return released[token][account];
    }


    /** @notice Update the trusted forwarder address
     *
     */
    function setTrustedForwarder(address forwarder) external onlyOwner {
        _setTrustedForwarder(forwarder);
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

    function _msgSender() internal view virtual override(Context, ERC2771Recipient) returns (address ret) {
        if (msg.data.length >= 20 && isTrustedForwarder(msg.sender)) {
            assembly {
                ret := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            ret = msg.sender;
        }
    }

    function _msgData() internal view virtual override(Context, ERC2771Recipient) returns (bytes calldata ret) {
        if (msg.data.length >= 20 && isTrustedForwarder(msg.sender)) {
            return msg.data[0:msg.data.length - 20];
        } else {
            return msg.data;
        }
    }
}
