import { ethers } from "ethers";
import { simpleRpcProvider } from "./providers";
import erc20Abi from "../config/abis/erc20.json";
import factoryAbi from "../config/abis/factory.json";
import indexAbi from "../config/abis/index.json";
import { indexFactory } from "../config/constants";

const getContract = (
  chainId: number,
  abi: any,
  address: string,
  index: number
) => {
  const rpcPrivider = simpleRpcProvider(chainId, index);
  return new ethers.Contract(address, abi, rpcPrivider);
};

export const getErc20Contract = (
  chainId: number,
  address: string,
  index = 0
) => {
  return getContract(chainId, erc20Abi, address, index);
};

export const getFactoryContract = (chainId: number, index = 0) => {
  return getContract(
    chainId,
    factoryAbi,
    indexFactory[chainId as keyof typeof indexFactory],
    index
  );
};

export const getIndexContract = (
  chainId: number,
  address: string,
  index = 0
) => {
  return getContract(chainId, indexAbi, address, index);
};
