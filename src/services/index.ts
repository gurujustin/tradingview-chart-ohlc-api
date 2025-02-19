import { Request, Response } from "express";
import { API_URL } from "../config/constants";
import dotenv from "dotenv";
import PoolModel from "../models/pools";
import { getMarketcapData, getOhlcData } from "../controllers";
import ValidatorModel from "../models/validators";

dotenv.config();

export const getOhlc = async (req: Request, res: Response) => {
  try {
    const netuid = req.query.netuid as string;
    const resolution = req.query.resolution as keyof typeof resolutionMapping;
    const resolutionMapping = { '1': 1, '3': 3, '5': 5, '15': 15, '30': 30, '60': 60, '120': 120, '240': 240, '1D': 1440, '1W': 10080, '1M': 43200 };
    const from = req.query.from as string;
    const to = req.query.to as string;
    const ohlc = await getOhlcData(netuid, resolutionMapping[resolution], from, to);

    res.status(200).json(ohlc);
  } catch (error) {
    console.error("Error fetching OHLC data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMarketcap = async (req: Request, res: Response) => {
  try {
    const netuid = req.query.netuid as string;
    const resolution = req.query.resolution as keyof typeof resolutionMapping;
    const resolutionMapping = { '1': 1, '3': 3, '5': 5, '15': 15, '30': 30, '60': 60, '120': 120, '240': 240, '1D': 1440, '1W': 10080, '1M': 43200 };
    const from = req.query.from as string;
    const to = req.query.to as string;
    const mketcap = await getMarketcapData(netuid, resolutionMapping[resolution], from, to);

    res.status(200).json(mketcap);
  } catch (error) {
    console.error("Error fetching Marketcap data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getValidators = async (req: Request, res: Response) => {
  try {
    const netuid = req.query.netuid as string;
    const uniqueValidators = await ValidatorModel.aggregate([
      { $match: { netuid: Number(netuid) } }, // ✅ Filter by netuid
      { $group: { _id: "$ss58", doc: { $first: "$$ROOT" } } }, // ✅ Group by unique `ss58`
      { $replaceRoot: { newRoot: "$doc" } } // ✅ Return full validator objects
    ]);

    console.log(uniqueValidators, netuid);
    res.status(200).json(uniqueValidators);
  } catch (error) {
    console.error("Error fetching OHLC data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const syncData = async (req: Request, res: Response) => {
  console.log("Syncing indexes data...");
  try {
    let url = `${API_URL}dtao/pool/history/v1?limit=200&order=timestamp_asc`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: 'tao-d1d2da32-6ade-4ddf-8820-09e9eea08174:64717826'
      }
    };

    while (url) {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(data.pagination);

      // Process the data here if needed
      const poolsData = data.data.map((pool: any) => ({
        timestamp: Math.floor(new Date(pool.timestamp).getTime() / 1000),
        price: pool.price,
        market_cap: pool.market_cap,
        netuid: pool.netuid,
        updated: Math.floor(Date.now() / 1000) // current unix timestamp
      }));
      await PoolModel.insertMany(poolsData);

      url = data.pagination.next_page ? `${API_URL}dtao/pool/history/v1?limit=200&order=timestamp_asc&page=${data.pagination.next_page}` : '';
    }
    res.status(200).json({ message: "Indexes data synced successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error syncing indexes data" });
    console.error("Error syncing indexes data:", error);
  }
};