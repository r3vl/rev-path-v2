# r3vl-rev-path V2

Get Packages installed via:

```sh

npm install

```

  

### Compile

  

Compile the smart contracts with Hardhat:

  

```sh

$ npm run compile

```

  

### TypeChain

  

Compile the smart contracts and generate TypeChain artifacts:

  

```sh

$ npm run typechain

```

  

### Lint Solidity

  

Lint the Solidity code:

  

```sh

$ npm run lint:sol

```

  

### Test

  

Run the Mocha tests:

  

```sh

$ npm run test

```

  

### Coverage

  

Generate the code coverage report:

  

```sh

$ npm run coverage

```

  

### Report Gas

  

See the gas usage per unit test and average gas per method call:

  

```sh

$ REPORT_GAS=true npm run test

```

  

### Clean

  

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

  

```sh

$ npm run clean

```

  

### Deploy

  

Deploy the contracts to the network of your choice. Make sure to review the initializing variables in the scripts.

  

```sh

$ npx hardhat run deploy/{SCRIPT_NAME} --network {NETWORK_NAME}

```

e.g:

```sh

$ npx hardhat run deploy/1_ReveelMain_deploy.js --network goerli

```

#### Deploy on Localhost

3 terminal windows:

```sh
# 1.
npx hardhat node --network hardhat

# 2.
npx hardhat console --network localhost

# 3.
npx hardhat run deploy/3_All_deploy.ts --network localhost
```

In the console windows, send yourself some ETH:

```sh
const YOUR_WALLET_ADDRESS=""
const signer = await ethers.provider.getSigner()
await signer.sendTransaction({to: YOUR_WALLET_ADDRESS, value: ethers.utils.parseEther("1")})
```
