import { AttributeMap } from "aws-sdk/clients/dynamodbstreams"
import { tableBatchPutItems } from "../aws-facades/ddb-facade"
import { verifyDefined } from "./dao-utils"

export type FoiaRequestStatus = "NOT_SUBMITTED" | "SUBMITTED" | "FULFILLED"

export interface CopaCaseFoiaRequest {
    copaCaseId: string
    complaintDateTime: string
    foiaRequestStatus: FoiaRequestStatus
    foiaRequestId?: string
}

export interface TableBatchPutCCFRs {
    tableName: string
    ccfrs: CopaCaseFoiaRequest[]
}

export const tableBatchPutCCFRs = async ({ tableName, ccfrs }: TableBatchPutCCFRs): Promise<CopaCaseFoiaRequest[]> => {
    const items = ccfrs.map(ccfrToItem)
    const unprocessedItems = await tableBatchPutItems({ tableName, items })
    return unprocessedItems.map(itemToCCFR)
}

const ccfrToItem = (ccfr: CopaCaseFoiaRequest): AttributeMap => {
    return {
        copaCaseId: { S: ccfr.copaCaseId },
        complaintDateTime: { S: ccfr.complaintDateTime },
        foiaRequestStatus: { S: ccfr.foiaRequestStatus },
        ...(ccfr.foiaRequestId ? { foiaRequestId: { S: ccfr.foiaRequestId } } : {})
    }
}

const itemToCCFR = (item: AttributeMap): CopaCaseFoiaRequest => {
    return {
        copaCaseId: verifyItemAttrValS(item, "copaCaseId"),
        complaintDateTime: verifyItemAttrValS(item, "complaintDateTime"),
        foiaRequestStatus: verifyItemAttrValS(item, "foiaRequestStatus") as FoiaRequestStatus,
        foiaRequestId: item["foiaRequestId"]?.S
    }
}

const verifyItemAttrValS = (item: AttributeMap, attrName: string) => verifyDefined(item[attrName].S, attrName)
