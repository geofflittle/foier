import { APIGatewayProxyHandler } from "aws-lambda"
import { asyncReduce } from "../core/utils"
import { getCopaCase } from "../clients/copa-client"
import { tableCreateCCFR } from "../daos/ccfr-dao"
import { verifyPropDefined } from "../daos/dao-utils"

export const handler: APIGatewayProxyHandler = async (event) => {
    const env = verifyEnv()
    console.log({ module: "copa-cases-inserter", method: "handler", env })
    if (!event.body) {
        return {
            statusCode: 400,
            body: "No body"
        }
    }
    const bodyJson = JSON.parse(event.body)
    const caseNumbers = bodyJson.cases.filter((caseNumber: string) => caseNumber.length >= 0)
    console.log({ module: "copa-cases-inserter", method: "handler", caseNumbers })
    if (!caseNumbers || caseNumbers.length <= 0) {
        return {
            statusCode: 400,
            body: "No cases"
        }
    }
    const res = await insertCases(env.CCFR_TABLE_NAME, caseNumbers)
    console.log({ module: "copa-cases-inserter", method: "handler", res })
    return {
        statusCode: 200,
        body: JSON.stringify(res)
    }
}

export interface CopaCasesLoaderEnv {
    CCFR_TABLE_NAME: string
}

const verifyEnv = (): CopaCasesLoaderEnv => ({
    CCFR_TABLE_NAME: verifyPropDefined(process.env, "CCFR_TABLE_NAME")
})

interface InsertCasesResult {
    inserted: string[]
    notFound: string[]
    present: string[]
}

const insertCases = async (tableName: string, caseNumbers: string[]): Promise<InsertCasesResult> => {
    return await asyncReduce(
        caseNumbers,
        async (acc: InsertCasesResult, cur: string) => {
            const copaCase = await getCopaCase({ log_no: cur })
            if (!copaCase) {
                console.log({
                    module: "copa-cases-inserter",
                    method: "handler",
                    copaCaseId: cur,
                    message: `Copa case not found`
                })
                return {
                    ...acc,
                    notFound: acc.notFound.concat([cur])
                }
            }
            try {
                await tableCreateCCFR({
                    tableName,
                    ccfr: {
                        copaCaseId: copaCase.log_no,
                        complaintDateTime: copaCase.complaint_date,
                        foiaRequestStatus: "NOT_SUBMITTED"
                    }
                })
                console.log({
                    module: "copa-cases-inserter",
                    method: "handler",
                    copaCaseId: cur,
                    message: `Copa case inserted`
                })
                return {
                    ...acc,
                    inserted: acc.inserted.concat([cur])
                }
            } catch (err) {
                console.error({ type: err.type, message: err.message, stack: err.stack })
                console.log({
                    module: "copa-cases-inserter",
                    method: "handler",
                    copaCaseId: cur,
                    message: `Copa case already exists`
                })
                return {
                    ...acc,
                    present: acc.present.concat([cur])
                }
            }
        },
        { inserted: [], notFound: [], present: [] }
    )
}
