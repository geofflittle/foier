import { CopaCase, getCopaCase } from "../clients/copa-cases-client"

import { APIGatewayProxyHandler } from "aws-lambda"
import { asyncReduce } from "../core/utils"
import { tableBatchPutCCFRs } from "../daos/copa-cases-dao"
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
    const failedCases = await loadCases(env.CCFR_TABLE_NAME, caseNumbers)
    console.log({ failedCases })
    return {
        statusCode: 200,
        body: "{}"
    }
}

export interface CopaCasesLoaderEnv {
    CCFR_TABLE_NAME: string
}

const verifyEnv = (): CopaCasesLoaderEnv => ({
    CCFR_TABLE_NAME: verifyPropDefined(process.env, "CCFR_TABLE_NAME")
})

interface CreateCasesReductionProps {
    cases: CopaCase[]
    notFoundCases: string[]
}

const loadCases = async (tableName: string, caseNumbers: string[]) => {
    const res = await asyncReduce(
        caseNumbers,
        async (acc: CreateCasesReductionProps, cur: string) => {
            const copaCase = await getCopaCase({ log_no: cur })
            if (!copaCase) {
                console.log({ message: `Copa case ${cur} not found` })
                return {
                    cases: acc.cases,
                    notFoundCases: acc.notFoundCases.concat([cur])
                }
            }
            return {
                cases: acc.cases.concat([copaCase]),
                notFoundCases: acc.notFoundCases
            }
        },
        { cases: [], notFoundCases: [] }
    )
    if (!res.cases || res.cases.length <= 0) {
        return {
            notFoundCases: res.notFoundCases,
            unprocessedCases: []
        }
    }
    const unprocessedCases = await tableBatchPutCCFRs({
        tableName,
        ccfrs: res.cases.map((copaCase) => ({
            copaCaseId: copaCase.log_no,
            complaintDateTime: copaCase.complaint_date,
            foiaRequestStatus: "NOT_SUBMITTED"
        }))
    })
    return {
        notFoundCases: res.notFoundCases,
        unprocessedCases: unprocessedCases.map((unprocessedCase) => unprocessedCase.copaCaseId)
    }
}
