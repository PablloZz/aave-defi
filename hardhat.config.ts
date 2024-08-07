import "@nomicfoundation/hardhat-toolbox";
import { type HardhatUserConfig } from "hardhat/types";
import { vars } from "hardhat/config";

const SEPOLIA_RPC_URL = vars.get("SEPOLIA_RPC_URL");
const MAINNET_RPC_URL = vars.get("MAINNET_RPC_URL");
const PRIVATE_KEY = vars.get("PRIVATE_KEY");
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");
const COINMARKETCAP_API_KEY = vars.get("COINMARKETCAP_API_KEY");

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: MAINNET_RPC_URL,
      },
    },
    localhost: {
      chainId: 31337,
    },
    sepolia: {
      chainId: 11155111,
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  solidity: {
    compilers: [
      { version: "0.8.24" },
      { version: "0.8.19" },
      { version: "0.6.12" },
      { version: "0.6.6" },
      { version: "0.6.0" },
      { version: "0.4.19" },
    ],
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
  },
  mocha: {
    timeout: 500000,
  },
};

export default config;
