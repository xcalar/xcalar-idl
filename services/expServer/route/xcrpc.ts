import { Router } from "express";
export const router = Router();
import * as serviceMgr from "../controllers/sdk_service_impls/SDKServiceMgr"
import * as xcrpcManager from "../controllers/xcrpcManager";

// set default timeout to 20 min
const defaultSQLTimeout = process.env.EXP_SQL_TIMEOUT &&
                        !isNaN(parseInt(process.env.EXP_SQL_TIMEOUT)) ?
                        parseInt(process.env.EXP_SQL_TIMEOUT) : 1200000;

router.post("/service/xce", function(req, res) {
    req.setTimeout(defaultSQLTimeout);
    let reqBuf: Buffer = Buffer.from(req.body.data, 'base64');

   serviceMgr.handleService(reqBuf)
   .then(function(ret: any): void  {
       const reqHandled: boolean = ret.reqHandled;
       const resp: any = ret.resp;
       if(!reqHandled) {
           xcrpcManager.routeToXce(reqBuf, res);
           return;
       }
       res.status(200).json({"data": resp});
   })
   .fail(function(err: any): void {
        res.status(500).json({"error": err.error});
   });
});