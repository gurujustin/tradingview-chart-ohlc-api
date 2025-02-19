import { ethers } from "ethers";
import axios from "axios";
import { logError, logInfo } from "./index";
import TokenModel, { IToken } from "../models/tokens";
import { getErc20Contract } from "./contractHelpers";
import {
  ASSET_PATH,
  COINGECKO_TOKEN_LIST,
  NETWORK_KEYS,
} from "../config/constants";

export const fetchToken = async (chainId: number, addressOrSymbol: string) => {
  const token = await TokenModel.findOne({
    chainId,
    $or: [
      { symbol: { $regex: new RegExp(addressOrSymbol, "i") } },
      { address: { $regex: new RegExp(addressOrSymbol, "i") } },
    ],
  }).lean();

  if (token) return token;

  if (!ethers.utils.isAddress(addressOrSymbol)) {
    logError(`\t invalid token: ${addressOrSymbol}`);
    return;
  }

  const tokenContract = getErc20Contract(chainId, addressOrSymbol);
  const tokenInfo: IToken = {
    chainId,
    name: await tokenContract.name(),
    symbol: await tokenContract.symbol(),
    address: ethers.utils.getAddress(addressOrSymbol),
    decimals: await tokenContract.decimals(),
    isNative: false,
    isToken: true,
    logo: "",
    projectLink: "",
  };

  try {
    const res = await axios.get(
      `${ASSET_PATH}/${
        NETWORK_KEYS[chainId as keyof typeof NETWORK_KEYS]
      }/assets/${tokenInfo.address}/info.json`
    );
    if (res.data) {
      tokenInfo.projectLink = res.data.website;
    }
  } catch {
    try {
      const res = await axios.get(
        COINGECKO_TOKEN_LIST[chainId as keyof typeof COINGECKO_TOKEN_LIST]
      );
      if (res.data?.tokens) {
        const _token = res.data.tokens.find(
          (t: { address: string; logoURI?: string }) =>
            t.address.toLowerCase() === tokenInfo.address.toLowerCase()
        );
        if (_token?.logoURI) tokenInfo.logo = _token.logoURI;
      }
    } catch {
      logError(`\t Error fetching token info from asset path`);
    }
  }

  const newToken = new TokenModel(tokenInfo);
  await newToken.save();

  logInfo("\t Token Added: " + JSON.stringify(tokenInfo));

  return newToken;
};
