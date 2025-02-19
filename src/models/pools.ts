import mongoose from "mongoose";

const PoolSchema = new mongoose.Schema({
  timestamp: String,
  price: String,
  market_cap: String,
  netuid: Number,
  updated: String
});

PoolSchema.index({ netuid: 1 });

const PoolModel = mongoose.model("pools", PoolSchema);

export default PoolModel;
