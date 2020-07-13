import { APIGatewayProxyHandler } from "aws-lambda"
import { asyncReduce } from "../core/utils"
import { getCopaCase } from "../clients/copa-cases-client"
import { tablePutCCFR } from "../daos/ccfr-dao"
import { verifyPropDefined } from "../daos/dao-utils"

export const handler: APIGatewayProxyHandler = async (event) => {
    const env = verifyEnv()
    console.log({ env })
    if (!event.body) {
        return {
            statusCode: 400,
            body: "No body"
        }
    }
    const bodyJson = JSON.parse(event.body)
    const caseNumbers = bodyJson.cases.filter((caseNumber: string) => caseNumber.length >= 0)
    console.log({ caseNumbers })
    if (!caseNumbers || caseNumbers.length <= 0) {
        return {
            statusCode: 400,
            body: "No cases"
        }
    }
    const loadResult = await loadCases(env.CCFR_TABLE_NAME, caseNumbers)
    console.log({ loadResult })
    return {
        statusCode: 200,
        body: JSON.stringify(loadResult)
    }
}

export interface CopaCasesLoaderEnv {
    CCFR_TABLE_NAME: string
}

const verifyEnv = (): CopaCasesLoaderEnv => ({
    CCFR_TABLE_NAME: verifyPropDefined(process.env, "CCFR_TABLE_NAME")
})

interface CreateCasesReductionProps {
    loaded: string[]
    notFound: string[]
    present: string[]
}

const loadCases = async (tableName: string, caseNumbers: string[]) => {
    return await asyncReduce(
        caseNumbers,
        async (acc: CreateCasesReductionProps, cur: string) => {
            const copaCase = await getCopaCase({ log_no: cur })
            if (!copaCase) {
                console.log({ message: `Copa case ${cur} not found` })
                return {
                    ...acc,
                    notFound: acc.notFound.concat([cur])
                }
            }
            try {
                await tablePutCCFR({
                    tableName,
                    ccfr: {
                        copaCaseId: copaCase.log_no,
                        complaintDateTime: copaCase.complaint_date,
                        foiaRequestStatus: "NOT_SUBMITTED"
                    }
                })
            } catch (err) {
                return {
                    ...acc,
                    present: acc.present.concat([cur])
                }
            }
            return {
                ...acc,
                loaded: acc.loaded.concat([cur])
            }
        },
        { loaded: [], notFound: [], present: [] }
    )
}
