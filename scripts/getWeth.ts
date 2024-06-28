import { type Contract } from "ethers";
import { ethers } from "hardhat";
import { type IWeth } from "../typechain-types";

const VALUE_TO_DEPOSIT = ethers.parseEther("0.02");

async function getWeth() {
  const deployer = (await ethers.getSigners())[0];
  const iWeth = (await ethers.getContractAt(
    "IWeth",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    deployer,
  )) as Contract & IWeth;

  const transactionResponse = await iWeth.deposit({
    value: VALUE_TO_DEPOSIT,
    maxFeePerGas: ethers.parseEther("0.0000001"),
  });
  
  await transactionResponse.wait(1);
  const wethBalance = await iWeth.balanceOf(deployer.address);
  console.log(`Got ${ethers.formatEther(wethBalance)}`);
}

export { getWeth };
