import { ScheduledHandler } from "aws-lambda"
import { tableQueryCCFRsByStatus } from "../daos/ccfr-dao"
import { verifyPropDefined } from "../daos/dao-utils"

export const handler: ScheduledHandler = async () => {
    const env = verifyEnv()
    console.log({ module: "foia-request-submitter", method: "handler", env })
    const submittedCCFRs = await tableQueryCCFRsByStatus({
        tableName: env.CCFR_TABLE_NAME,
        foiaRequestStatus: "SUBMITTED",
        limit: env.MAX_REQUESTS_SUBMITTED
    })
    console.log({ module: "foia-request-submitter", method: "handler", submittedCCFRs })
    if (submittedCCFRs.length >= env.MAX_REQUESTS_SUBMITTED) {
        console.log({
            module: "foia-request-submitter",
            method: "handler",
            ccfrsLength: submittedCCFRs.length,
            max: env.MAX_REQUESTS_SUBMITTED,
            message: "Submitted is >= max"
        })
        return
    }
    const ccfrsToSubmit = await tableQueryCCFRsByStatus({
        tableName: env.CCFR_TABLE_NAME,
        foiaRequestStatus: "NOT_SUBMITTED",
        limit: env.MAX_REQUESTS_SUBMITTED - submittedCCFRs.length
    })
    console.log({ module: "foia-request-submitter", method: "handler", ccfrsToSubmit })
    ccfrsToSubmit.forEach((ccfr) => {})
}

export interface FoiaRequestSubmitterEnv {
    CCFR_TABLE_NAME: string
    MAX_REQUESTS_SUBMITTED: number
}

const verifyEnv = (): FoiaRequestSubmitterEnv => ({
    CCFR_TABLE_NAME: verifyPropDefined(process.env, "CCFR_TABLE_NAME"),
    MAX_REQUESTS_SUBMITTED: parseInt(verifyPropDefined(process.env, "MAX_REQUESTS_SUBMITTED"))
})
