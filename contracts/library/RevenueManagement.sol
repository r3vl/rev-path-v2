// SPDX-License-Identifier: SPWPL
pragma solidity 0.8.15;

struct RevenuePath {
    address[] walletList;
    mapping(address => uint256) allocation;
}

error WalletAndDistrbutionCtMismatch(uint256 walletCount, uint256 distributionCount);
error DuplicateWalletEntry();
error ZeroAddressProvided();
error ZeroDistributionProvided();
error TotalShareNot100();
error OnlyExistingTiersCanBeUpdated();

library RevenueManagement {
    uint256 public constant BASE = 1e7;

        function _addRevenueTiers(
            address[][] calldata _walletList,
             uint256[][] calldata _distribution,
             RevenuePath[] storage revenueTiers)
        internal
    {
        if (_walletList.length != _distribution.length) {
            revert WalletAndDistrbutionCtMismatch({
                walletCount: _walletList.length,
                distributionCount: _distribution.length
            });
        }

        uint256 listLength = _walletList.length;

        for (uint256 i; i < listLength; ) {
            uint256 walletMembers = _walletList[i].length;
            if (walletMembers != _distribution[i].length) {
                revert WalletAndDistrbutionCtMismatch({
                    walletCount: walletMembers,
                    distributionCount: _distribution[i].length
                });
            }

            uint256 nextRevenueTier = revenueTiers.length;
            revenueTiers.push();
            RevenuePath storage tier = revenueTiers[nextRevenueTier];
            

            tier.walletList = _walletList[i];
            uint256 totalShares;
            for (uint256 j; j < walletMembers; ) {
                if ( tier.allocation[(_walletList[i])[j]] > 0) {
                    revert DuplicateWalletEntry();
                }

                if ((_walletList[i])[j] == address(0)) {
                    revert ZeroAddressProvided();
                }
                if ((_distribution[i])[j] == 0) {
                    revert ZeroDistributionProvided();
                }

                // revenueProportion[nextRevenueTier][(_walletList[i])[j]] = (_distribution[i])[j];
                tier.allocation[(_walletList[i])[j]] = (_distribution[i])[j];
                totalShares += (_distribution[i])[j];
                unchecked {
                    j++;
                }
            }

            if (totalShares != BASE) {
                revert TotalShareNot100();
            }
            nextRevenueTier += 1;

            unchecked {
                i++;
            }
        }

    }



     function _updateRevenueTiers(
        address[][] calldata _walletList,
        uint256[][] calldata _distribution,
        uint256[] calldata _tierNumbers,
        RevenuePath[] storage revenueTiers
    ) internal {
        uint256 totalUpdates = _tierNumbers.length;
        if (_walletList.length != _distribution.length && _walletList.length != totalUpdates) {
            revert WalletAndDistrbutionCtMismatch({
                walletCount: _walletList.length,
                distributionCount: _distribution.length
            });
        }

        uint256 totalTiers = revenueTiers.length;

        for (uint256 i; i < totalUpdates; ) {
            uint256 totalWallets = _walletList[i].length;
            if (totalWallets != _distribution[i].length) {
                revert WalletAndDistrbutionCtMismatch({
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
                if (revenueTiers[tier].allocation[wallet] > 0) {
                    revert DuplicateWalletEntry();
                }

                if (wallet == address(0)) {
                    revert ZeroAddressProvided();
                }
                if ((_distribution[i])[j] == 0) {
                    revert ZeroDistributionProvided();
                }

                revenueTiers[tier].allocation[wallet] = (_distribution[i])[j];
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

    
    
    
}
