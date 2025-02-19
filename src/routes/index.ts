import { Router } from "express";
import { getMarketcap, getOhlc, getValidators, syncData } from "../services";

const router = Router();


router.get("/ohlc", getOhlc);
router.get("/marketcap", getMarketcap);
router.post("/syncData", syncData)
router.get('/validators', getValidators)

export default router;
