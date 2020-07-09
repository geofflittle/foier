import { ScheduledHandler } from "aws-lambda"
import { tableQueryAllCCFRsByStatus } from "../daos/copa-cases-dao"
import { verifyPropDefined } from "../daos/dao-utils"

export const handler: ScheduledHandler = async () => {
    const env = verifyEnv()
    const copaCases = tableQueryAllCCFRsByStatus({ tableName: env.CCFR_TABLE_NAME, foiaRequestStatus: "SUBMITTED" })
    console.log({ copaCases })
    return
}

export interface FoiaRequestStatusCheckerEnv {
    CCFR_TABLE_NAME: string
}

const verifyEnv = (): FoiaRequestStatusCheckerEnv => ({
    CCFR_TABLE_NAME: verifyPropDefined(process.env, "CCFR_TABLE_NAME")
})
