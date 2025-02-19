import PoolModel from "../models/pools";
import { API_URL } from "../config/constants";
import ValidatorModel from "../models/validators";

// update event data every xx seconds
export const updateData = async () => {
  try {
    const lastPool = await PoolModel.findOne().sort({ _id: -1 }).exec();

    if (lastPool) {

      console.log("Last pool timestamp:", lastPool.updated);

      let url = `${API_URL}dtao/pool/history/v1?timestamp_start=${lastPool.updated}&limit=200&order=timestamp_asc`;
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
        console.log(data.pagination, data.data.length);

        // Process the data here if needed
        if (data.data && data.data.length > 0) {
          const poolsData = data.data.map((pool: any) => ({
            timestamp: Math.floor(new Date(pool.timestamp).getTime() / 1000),
            price: pool.price,
            market_cap: pool.market_cap,
            netuid: pool.netuid,
            updated: Math.floor(Date.now() / 1000) // current unix timestamp
          }));
          await PoolModel.insertMany(poolsData);
        }

        url = data.pagination.next_page ? `${API_URL}dtao/pool/history/v1?timestamp_start=${lastPool.updated}&limit=200&order=timestamp_asc&page=${data.pagination.next_page}` : '';
      }
    }

    const pollingInterval = 1000 * 60; // 60 secs
    setTimeout(updateData, pollingInterval);
  } catch (error) {
    console.error("Error updating events:", error);
  }
};

// update the total staked value for each index every xx seconds
export const updateValidators = async () => {
  try {
    await ValidatorModel.deleteMany({});

    let url = `${API_URL}validator/metrics/latest/v1?limit=200&order=netuid_asc`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: 'tao-d1d2da32-6ade-4ddf-8820-09e9eea08174:64717826'
      }
    };

    const response1 = await fetch(`${API_URL}validator/latest/v1`, options);
    const data1 = await response1.json();

    while (url) {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      const data = await response.json();
      // Process the data here if needed
      if (data.data && data.data.length > 0) {
        const validators = data.data
          .filter((v: any) => v.validator_permit && v.hotkey.ss58 !== '5FFApaS75bv5pJHfAp2FVLBj9ZaXuFDjEypsaBNc1wCfe52v')
          .map((v: any) => {
            const name = data1.data.find((d: any) => d.hotkey.ss58 === v.hotkey.ss58)?.name;

            return ({
              name: name,
              ss58: v.hotkey.ss58,
              hex: v.hotkey.hex,
              netuid: v.netuid
            })
          });
        await ValidatorModel.insertMany(validators);
      }

      url = data.pagination.next_page ? `${API_URL}validator/metrics/latest/v1?limit=200&order=netuid_asc&page=${data.pagination.next_page}` : '';
    }

    const pollingInterval = 1000 * 86400; // 1 day
    setTimeout(updateValidators, pollingInterval);
  } catch (error) {
    console.error("Error updating validators:", error);
  }
};

export const getOhlcData = async (netuid: string, resolution: number, from: string, to: string) => {
  const resInSeconds = resolution * 60;
  const fromTimestamp = parseInt(from);
  const toTimestamp = parseInt(to);

  try {
    const data = await PoolModel.find({
      netuid: parseInt(netuid),
      timestamp: { $gte: fromTimestamp, $lte: toTimestamp }
    }).sort({ timestamp: 1 });

    const groupedData: Record<number, number[]> = {};

    data.forEach((item: { timestamp: string, price: string }) => {
      const timestamp = parseInt(item.timestamp);
      const bucket = Math.floor(timestamp / resInSeconds) * resInSeconds;

      if (!groupedData[bucket]) {
        groupedData[bucket] = [];
      }
      groupedData[bucket].push(parseFloat(item.price));
    });

    let previousClose: number | null = null;
    const ohlc = Object.keys(groupedData).map((key) => {
      const prices = groupedData[parseInt(key)];
      const open = previousClose !== null ? previousClose : prices[0];
      const high = Math.max(...prices);
      const low = Math.min(...prices);
      const close = prices[prices.length - 1];
      previousClose = close; // store close for next iteration

      return {
        timestamp: parseInt(key),
        open,
        high,
        low,
        close
      };
    });

    return ohlc;
  } catch (error) {
    console.log('error', error);
  }
};

export const getMarketcapData = async (netuid: string, resolution: number, from: string, to: string) => {
  const resInSeconds = resolution * 60;
  const fromTimestamp = parseInt(from);
  const toTimestamp = parseInt(to);

  try {
    const data = await PoolModel.find({
      netuid: parseInt(netuid),
      timestamp: { $gte: fromTimestamp, $lte: toTimestamp }
    }).sort({ timestamp: 1 });

    const groupedData: Record<number, number[]> = {};

    data.forEach((item: { timestamp: string, market_cap: string }) => {
      const timestamp = parseInt(item.timestamp);
      const bucket = Math.floor(timestamp / resInSeconds) * resInSeconds;

      if (!groupedData[bucket]) {
        groupedData[bucket] = [];
      }
      groupedData[bucket].push(parseFloat(item.market_cap) / 10**9);
    });

    let previousClose: number | null = null;
    const mketcap = Object.keys(groupedData).map((key) => {
      const mketcaps = groupedData[parseInt(key)];
      const open = previousClose !== null ? previousClose : mketcaps[0];
      const high = Math.max(...mketcaps);
      const low = Math.min(...mketcaps);
      const close = mketcaps[mketcaps.length - 1];
      previousClose = close; // store close for next iteration

      return {
        timestamp: parseInt(key),
        open,
        high,
        low,
        close
      };
    });

    return mketcap;
  } catch (error) {
    console.log('error', error);
  }
};

