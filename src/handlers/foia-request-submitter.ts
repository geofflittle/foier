import { tableQueryCCFRsByStatus, tableUpdateCCFR } from "../daos/ccfr-dao"

import { ScheduledHandler } from "aws-lambda"
import { createFoiaRequest } from "../clients/muck-rock-client"
import { getSecretValue } from "../aws-facades/sm-facade"
import { verifyPropDefined } from "../daos/dao-utils"

const AGENCY_ID_COPA = "15293"
const AGENCY_ID_TEST = "248"

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
    if (ccfrsToSubmit.length <= 0) {
        return
    }
    const mrt = await getSecretValue({ secretId: env.MUCK_ROCK_API_TOKEN_ARN })
    if (!mrt) {
        console.log({ module: "foia-request-submitter", method: "handler", message: "No muck rock api token" })
        return
    }
    await Promise.all(
        ccfrsToSubmit.map(
            async (ccfr): Promise<void> => {
                const foiaRequestId = await createFoiaRequest({
                    apiToken: mrt,
                    title: `COPA Case ${ccfr.copaCaseId}`,
                    agency: AGENCY_ID_COPA,
                    documentRequest:
                        `Copies of the attachment sheets, the summary digest report, and any other final disposition` +
                        ` documentation (e.g., an Administrative Closure order, mediation agreement, grievance ` +
                        `decision, or arbitration award) for COPA case __${ccfr.copaCaseId}__ as identified by the ` +
                        `data provided at ` +
                        `https://data.cityofchicago.org/Public-Safety/COPA-Cases-Summary/mft5-nfa8/data.`
                })
                ccfr.foiaRequestId = foiaRequestId.toString()
                ccfr.foiaRequestStatus = "SUBMITTED"
                await tableUpdateCCFR({ tableName: env.CCFR_TABLE_NAME, ccfr })
            }
        )
    )
}

export interface FoiaRequestSubmitterEnv {
    CCFR_TABLE_NAME: string
    MAX_REQUESTS_SUBMITTED: number
    MUCK_ROCK_API_TOKEN_ARN: string
}

const verifyEnv = (): FoiaRequestSubmitterEnv => ({
    CCFR_TABLE_NAME: verifyPropDefined(process.env, "CCFR_TABLE_NAME"),
    MAX_REQUESTS_SUBMITTED: parseInt(verifyPropDefined(process.env, "MAX_REQUESTS_SUBMITTED")),
    MUCK_ROCK_API_TOKEN_ARN: verifyPropDefined(process.env, "MUCK_ROCK_API_TOKEN_ARN")
})
