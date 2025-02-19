import {ethers} from "ethers"; 
import sample from "lodash/sample";
import { NETWORKS } from "../config/constants";

export const simpleRpcProvider = (chainId: number, index: number) =>
  new ethers.providers.JsonRpcProvider(NETWORKS[chainId as keyof typeof NETWORKS || 56][index]);

