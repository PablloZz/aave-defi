import { ethers } from "hardhat";
import { VALUE_TO_DEPOSIT, getWeth } from "./getWeth";
import { type HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  type AggregatorV3Interface,
  type IERC20,
  type ILendingPool,
  type ILendingPoolAddressesProvider,
} from "typechain-types";
import { type Addressable, type Contract } from "ethers";

async function main() {
  await getWeth();
  const deployer = (await ethers.getSigners())[0];
  const lendingPool = await getLendingPool(deployer);
  console.log(`LendingPool address ${lendingPool.target}`);
  const wethTokensAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  await approveErc20(wethTokensAddress, lendingPool.target, VALUE_TO_DEPOSIT, deployer);
  console.log("Depositing...");
  await lendingPool.deposit(wethTokensAddress, VALUE_TO_DEPOSIT, deployer.address, 0);
  console.log("Deposited!");
  const { availableBorrowsETH } = await getUserAccountData(lendingPool, deployer);
  const daiEthPrice = await getDaiEthPrice();
  const amountDaiToBorrow = Number(String(availableBorrowsETH)) * 0.95 * (1 / Number(daiEthPrice));
  const amountDaiToBorrowWei = ethers.parseEther(String(amountDaiToBorrow));
  const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  await borrowDai(daiTokenAddress, lendingPool, amountDaiToBorrowWei, deployer.address);
  await getUserAccountData(lendingPool, deployer);
  await repay(amountDaiToBorrowWei, daiTokenAddress, lendingPool, deployer);
  await getUserAccountData(lendingPool, deployer);
}

async function repay(
  amount: bigint,
  tokenAddress: string,
  lendingPool: ILendingPool & Contract,
  account: HardhatEthersSigner,
) {
  await approveErc20(tokenAddress, lendingPool.target, amount, account);
  const repayTransactionResponse = await lendingPool.repay(tokenAddress, amount, 2, account);
  await repayTransactionResponse.wait(1);
  console.log("Repaid!");
}

async function borrowDai(
  daiAddress: string,
  lendingPool: ILendingPool & Contract,
  amountDaiToBorrowWei: bigint,
  account: string,
) {
  const borrowTransactionResponse = await lendingPool.borrow(
    daiAddress,
    amountDaiToBorrowWei,
    2,
    0,
    account,
  );

  await borrowTransactionResponse.wait(1);
  console.log("You've borrowed!");
}

async function getUserAccountData(
  lendingPool: Contract & ILendingPool,
  account: HardhatEthersSigner,
) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);

  console.log(`You have ${totalCollateralETH} worth of ETH deposited.`);
  console.log(`You have ${totalDebtETH} worth of ETH borrowed.`);
  console.log(`You can borrow ${availableBorrowsETH} wort of ETH.`);

  return { totalDebtETH, availableBorrowsETH };
}

async function getDaiEthPrice() {
  const daiEthPriceFeed = (await ethers.getContractAt(
    "AggregatorV3Interface",
    "0x773616E4d11A78F511299002da57A0a94577F1f4",
  )) as Contract & AggregatorV3Interface;

  const price = (await daiEthPriceFeed.latestRoundData())[1];
  console.log(`The DAI/ETH price is ${price}`);

  return price;
}

async function getLendingPool(account: HardhatEthersSigner) {
  const lendingPoolAddressesProvider = (await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
    account,
  )) as Contract & ILendingPoolAddressesProvider;

  const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
  const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account);

  return lendingPool as Contract & ILendingPool;
}

async function approveErc20(
  erc20Address: string,
  spenderAddress: string | Addressable,
  amountToSpend: bigint,
  account: HardhatEthersSigner,
) {
  const erc20Token = (await ethers.getContractAt("IERC20", erc20Address, account)) as Contract &
    IERC20;

  const transactionResponse = await erc20Token.approve(spenderAddress, amountToSpend);
  transactionResponse.wait(1);
  console.log("Approved!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
