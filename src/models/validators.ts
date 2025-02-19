import mongoose from "mongoose";

const ValidatorSchema = new mongoose.Schema({
  name: String,
  ss58: String,
  hex: String,
  netuid: Number
});

ValidatorSchema.index({ netuid: 1 });

const ValidatorModel = mongoose.model("validators", ValidatorSchema);

export default ValidatorModel;
