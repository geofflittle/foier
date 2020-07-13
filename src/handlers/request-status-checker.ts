import { tableQueryAllCCFRsByStatus, tableUpdateCCFR } from "../daos/ccfr-dao"

import { ScheduledHandler } from "aws-lambda"
import { getFoiaRequest } from "../clients/muck-rock-client"
import { verifyPropDefined } from "../daos/dao-utils"

export const handler: ScheduledHandler = async () => {
    const env = verifyEnv()
    const ccfrs = await tableQueryAllCCFRsByStatus({
        tableName: env.CCFR_TABLE_NAME,
        foiaRequestStatus: "SUBMITTED"
    })
    console.log({ ccfrs })
    ccfrs.forEach(async (ccfr) => {
        if (!ccfr.foiaRequestId) {
            console.error({
                copaCaseId: ccfr.copaCaseId,
                foiaRequestId: ccfr.foiaRequestId,
                message: `Expected copa case to have a foia request id`
            })
            await tableUpdateCCFR({
                tableName: env.CCFR_TABLE_NAME,
                ccfr: ccfr
            })
            return
        }
        const foiaRequest = await getFoiaRequest({
            id: ccfr.foiaRequestId
        })
        if (!foiaRequest) {
            console.error({
                copaCaseId: ccfr.copaCaseId,
                foiaRequestId: ccfr.foiaRequestId,
                message: `Foia request not found`
            })
            await tableUpdateCCFR({
                tableName: env.CCFR_TABLE_NAME,
                ccfr: ccfr
            })
            return
        }
        if (foiaRequest.status != "done") {
            console.log({
                copaCaseId: ccfr.copaCaseId,
                foiaRequestId: ccfr.foiaRequestId,
                foiaRequestStatus: foiaRequest.status,
                message: `Foia request status is not 'done', nothing to update`
            })
            await tableUpdateCCFR({
                tableName: env.CCFR_TABLE_NAME,
                ccfr: ccfr
            })
            return
        }
        console.log({
            copaCaseId: ccfr.copaCaseId,
            foiaRequestId: ccfr.foiaRequestId,
            foiaRequestStatus: foiaRequest.status,
            message: `Foia request status is 'done'`
        })
        await tableUpdateCCFR({
            tableName: env.CCFR_TABLE_NAME,
            ccfr: {
                ...ccfr,
                foiaRequestStatus: "FULFILLED"
            }
        })
    })

    return
}

export interface FoiaRequestStatusCheckerEnv {
    CCFR_TABLE_NAME: string
}

const verifyEnv = (): FoiaRequestStatusCheckerEnv => ({
    CCFR_TABLE_NAME: verifyPropDefined(process.env, "CCFR_TABLE_NAME")
})
