import { tableBatchPutItems, tablePutItem, tableQueryAllItems, tableQueryItems } from "../aws-facades/ddb-facade"

import { AttributeMap } from "aws-sdk/clients/dynamodbstreams"
import { verifyDefined } from "./dao-utils"

export type FoiaRequestStatus = "NOT_SUBMITTED" | "SUBMITTED" | "FULFILLED"

export interface CopaCaseFoiaRequest {
    copaCaseId: string
    complaintDateTime: string
    foiaRequestStatus: FoiaRequestStatus
    foiaRequestId?: string
}

export interface TablePutCCFRProps {
    tableName: string
    ccfr: CopaCaseFoiaRequest
}

export const tablePutCCFR = async ({ tableName, ccfr }: TablePutCCFRProps): Promise<void> => {
    await tablePutItem({
        tableName,
        item: ccfrToItem(ccfr),
        conditionExpression: "attribute_not_exists(copaCaseId)"
    })
}

export interface TableBatchPutCCFRsProps {
    tableName: string
    ccfrs: CopaCaseFoiaRequest[]
}

export const tableBatchPutCCFRs = async ({
    tableName,
    ccfrs
}: TableBatchPutCCFRsProps): Promise<CopaCaseFoiaRequest[]> => {
    const items = ccfrs.map(ccfrToItem)
    const unprocessedItems = await tableBatchPutItems({ tableName, items })
    return unprocessedItems.map(itemToCCFR)
}

export interface TableQueryAllCCFRsByStatusProps {
    tableName: string
    foiaRequestStatus: FoiaRequestStatus
}

export const tableQueryAllCCFRsByStatus = async ({ tableName, foiaRequestStatus }: TableQueryAllCCFRsByStatusProps) => {
    const res = await tableQueryAllItems({
        tableName,
        indexName: "foiaRequestStatusIndex",
        partitionKeyName: "foiaRequestStatus",
        partitionKeyValue: foiaRequestStatus
    })
    return res.map(itemToCCFR)
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
