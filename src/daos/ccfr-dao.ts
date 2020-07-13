import {
    TableGetItemProps,
    tableBatchPutItems,
    tableDeleteItem,
    tableGetItem,
    tablePutItem,
    tableQueryAllItems
} from "../aws-facades/ddb-facade"

import { AttributeMap } from "aws-sdk/clients/dynamodbstreams"
import { verifyDefined } from "./dao-utils"

export type FoiaRequestStatus = "NOT_SUBMITTED" | "SUBMITTED" | "FULFILLED"

export interface CopaCaseFoiaRequest {
    copaCaseId: string
    complaintDateTime: string
    foiaRequestStatus: FoiaRequestStatus
    foiaRequestId?: string
    createdAt: string
    updatedAt?: string
}

export interface CopaCaseFoiaRequestToCreate {
    copaCaseId: string
    complaintDateTime: string
    foiaRequestStatus: FoiaRequestStatus
    foiaRequestId?: string
}

export interface TableCreateCCFRProps {
    tableName: string
    ccfr: CopaCaseFoiaRequestToCreate
}

export const tableCreateCCFR = async ({ tableName, ccfr }: TableCreateCCFRProps): Promise<void> => {
    await tablePutItem({
        tableName,
        item: ccfrToItem({
            ...ccfr,
            createdAt: new Date().toISOString()
        }),
        conditionExpression: "attribute_not_exists(copaCaseId)"
    })
}

export interface TableUpdateCCFRProps {
    tableName: string
    ccfr: CopaCaseFoiaRequest
}

export const tableUpdateCCFR = async ({ tableName, ccfr }: TableUpdateCCFRProps): Promise<void> => {
    await tablePutItem({
        tableName,
        item: ccfrToItem({
            ...ccfr,
            updatedAt: new Date().toISOString()
        }),
        conditionExpression: "attribute_exists(copaCaseId)"
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

export interface TableGetCCFRProps {
    tableName: string
    copaCaseId: string
}

export const tableGetCCFR = async ({
    tableName,
    copaCaseId
}: TableGetCCFRProps): Promise<CopaCaseFoiaRequest | undefined> => {
    const req: TableGetItemProps = {
        tableName,
        partitionKeyName: "copaCaseId",
        partitionKeyValue: copaCaseId
    }
    const item = await tableGetItem(req)
    if (!item) {
        return Promise.resolve(undefined)
    }
    return itemToCCFR(item)
}

export interface TableDeleteCCFRProps {
    tableName: string
    copaCaseId: string
}

export const tableDeleteCCFR = async ({ tableName, copaCaseId }: TableDeleteCCFRProps) => {
    const req = {
        tableName,
        partitionKeyName: "copaCaseId",
        partitionKeyValue: copaCaseId
    }
    await tableDeleteItem(req)
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
        ...(ccfr.foiaRequestId ? { foiaRequestId: { S: ccfr.foiaRequestId } } : {}),
        createdAt: { S: ccfr.createdAt },
        ...(ccfr.updatedAt ? { updatedAt: { S: ccfr.updatedAt } } : {})
    }
}

const itemToCCFR = (item: AttributeMap): CopaCaseFoiaRequest => {
    return {
        copaCaseId: verifyItemAttrValS(item, "copaCaseId"),
        complaintDateTime: verifyItemAttrValS(item, "complaintDateTime"),
        foiaRequestStatus: verifyItemAttrValS(item, "foiaRequestStatus") as FoiaRequestStatus,
        foiaRequestId: item["foiaRequestId"]?.S,
        createdAt: verifyItemAttrValS(item, "createdAt"),
        updatedAt: item["updatedAt"]?.S
    }
}

const verifyItemAttrValS = (item: AttributeMap, attrName: string) => verifyDefined(item[attrName].S, attrName)
