import { tableQueryCCFRsByStatus, tableUpdateCCFR } from "../daos/ccfr-dao"

import { ScheduledHandler } from "aws-lambda"
import { getFoiaRequest } from "../clients/muck-rock-client"
import { verifyPropDefined } from "../daos/dao-utils"

export const handler: ScheduledHandler = async () => {
    const env = verifyEnv()
    console.log({ module: "request-status-updater", method: "handler", env })
    const ccfrs = await tableQueryCCFRsByStatus({
        tableName: env.CCFR_TABLE_NAME,
        foiaRequestStatus: "SUBMITTED",
        limit: 100
    })
    console.log({ module: "request-status-updater", method: "handler", ccfrs })
    await Promise.all(
        ccfrs.map(async (ccfr) => {
            if (!ccfr.foiaRequestId) {
                console.error({
                    module: "request-status-updater",
                    method: "handler",
                    copaCaseId: ccfr.copaCaseId,
                    foiaRequestId: ccfr.foiaRequestId,
                    message: `Expected copa case to have a foia request id`
                })
                throw new Error(`Expected copa case ${ccfr.copaCaseId} to have a foia request id`)
            }
            const foiaRequest = await getFoiaRequest({ id: ccfr.foiaRequestId })
            if (!foiaRequest) {
                console.error({
                    module: "request-status-updater",
                    method: "handler",
                    copaCaseId: ccfr.copaCaseId,
                    foiaRequestId: ccfr.foiaRequestId,
                    message: `Foia request not found`
                })
                throw new Error(`Foia request ${ccfr.foiaRequestId} for copa case ${ccfr.copaCaseId} not found`)
            }
            if (foiaRequest.status != "done") {
                console.log({
                    module: "request-status-updater",
                    method: "handler",
                    copaCaseId: ccfr.copaCaseId,
                    foiaRequestId: ccfr.foiaRequestId,
                    foiaRequestStatus: foiaRequest.status,
                    message: `Foia request status is not 'done', nothing to update`
                })
                return
            }
            console.log({
                module: "request-status-updater",
                method: "handler",
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
    )
}

export interface RequestStatusUpdaterEnv {
    CCFR_TABLE_NAME: string
    MAX_REQUESTS_SUBMITTED: number
}

const verifyEnv = (): RequestStatusUpdaterEnv => ({
    CCFR_TABLE_NAME: verifyPropDefined(process.env, "CCFR_TABLE_NAME"),
    MAX_REQUESTS_SUBMITTED: parseInt(verifyPropDefined(process.env, "MAX_REQUESTS_SUBMITTED"))
})
