import { ExpressionAttributeValueMap, Key, PutItemInputAttributeMap, QueryInput } from "aws-sdk/clients/dynamodb"

import { AttributeMap } from "aws-sdk/clients/dynamodbstreams"
import { DynamoDB } from "aws-sdk"

const dynamoDb = new DynamoDB({ region: "us-east-1" })

export interface TablePutItemProps {
    tableName: string
    item: AttributeMap
    conditionExpression: string
}

export const tablePutItem = async ({ tableName, item, conditionExpression }: TablePutItemProps): Promise<void> => {
    const req = {
        TableName: tableName,
        Item: item,
        ConditionExpression: conditionExpression
    }
    console.log({ module: "ddb-facade", method: "tablePutItem", req })
    const res = await dynamoDb.putItem(req).promise()
    console.log({ module: "ddb-facade", method: "tablePutItem", res })
}

export interface BatchWriteItemsProps {
    tableName: string
    items: PutItemInputAttributeMap[]
}

export const tableBatchPutItems = async ({ tableName, items }: BatchWriteItemsProps): Promise<AttributeMap[]> => {
    const req = { RequestItems: { [tableName]: items.map((item) => ({ PutRequest: { Item: item } })) } }
    console.log({ module: "ddb-facade", method: "tableBatchPutItems", req })
    const res = await dynamoDb.batchWriteItem(req).promise()
    console.log({ module: "ddb-facade", method: "tableBatchPutItems", res })
    if (!res.UnprocessedItems?.tableName) {
        return Promise.resolve([])
    }
    return res.UnprocessedItems[tableName].map((writeRequest) => {
        if (!writeRequest.PutRequest) {
            throw new Error(`Illegal unprocessed write request ${writeRequest}`)
        }
        return writeRequest.PutRequest.Item
    })
}

export interface TableGetItemProps {
    tableName: string
    partitionKeyName: string
    partitionKeyValue: string
}

export const tableGetItem = async ({
    tableName,
    partitionKeyName,
    partitionKeyValue
}: TableGetItemProps): Promise<AttributeMap | undefined> => {
    const req = {
        TableName: tableName,
        Key: {
            [partitionKeyName]: {
                S: partitionKeyValue
            }
        }
    }
    console.log({ module: "ddb-facade", method: "tableGetItem", req })
    const res = await dynamoDb.getItem(req).promise()
    console.log({ module: "ddb-facade", method: "tableGetItem", res })
    return res.Item
}

export interface TableDeleteItemProps {
    tableName: string
    partitionKeyName: string
    partitionKeyValue: string
}

export const tableDeleteItem = async ({
    tableName,
    partitionKeyName,
    partitionKeyValue
}: TableDeleteItemProps): Promise<void> => {
    const req = {
        TableName: tableName,
        Key: {
            [partitionKeyName]: {
                S: partitionKeyValue
            }
        }
    }
    console.log({ module: "ddb-facade", method: "tableDeleteItem", req })
    const res = await dynamoDb.deleteItem(req).promise()
    console.log({ module: "ddb-facade", method: "tableDeleteItem", res })
}

export interface TableQueryItemsProps {
    tableName: string
    partitionKeyName: string
    partitionKeyValue: string
    sortKeyName?: string
    sortKeyValue?: string
    indexName?: string
    exclusiveStartKey?: Key
    scanIndexForward?: boolean
    limit?: number
}

export interface TableQueryItemResult {
    items: AttributeMap[]
    lastEvaluatedKey?: Key
}

export const tableQueryItems = async ({
    tableName,
    partitionKeyName,
    partitionKeyValue,
    sortKeyName,
    sortKeyValue,
    indexName,
    exclusiveStartKey,
    scanIndexForward,
    limit
}: TableQueryItemsProps): Promise<TableQueryItemResult> => {
    const sortCondExpr = sortKeyName && sortKeyValue ? ` and ${sortKeyName} = :skv` : ""
    const keyCondExpr = `${partitionKeyName} = :pkv${sortCondExpr}`
    const sortExprAttrVals: ExpressionAttributeValueMap =
        sortKeyName && sortKeyValue
            ? {
                  ":skv": {
                      S: sortKeyValue
                  }
              }
            : {}
    const expressionAttributeValues = {
        ":pkv": {
            S: partitionKeyValue
        },
        ...sortExprAttrVals
    }
    console.log({ module: "ddb-facade", method: "tableQueryItems", expressionAttributeValues })
    const req: QueryInput = {
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: keyCondExpr,
        ExpressionAttributeValues: expressionAttributeValues,
        ExclusiveStartKey: exclusiveStartKey,
        ScanIndexForward: scanIndexForward,
        Limit: limit
    }
    console.log({ module: "ddb-facade", method: "tableQueryItems", req })
    const res = await dynamoDb.query(req).promise()
    console.log({ module: "ddb-facade", method: "tableQueryItems", res })
    return {
        items: res.Items || [],
        lastEvaluatedKey: res.LastEvaluatedKey
    }
}

export interface TableQueryAllItemsProps {
    limit: number
    tableName: string
    partitionKeyName: string
    partitionKeyValue: string
    sortKeyName?: string
    sortKeyValue?: string
    indexName?: string
    scanIndexForward?: boolean
}

export const tableQueryAllItems = async (props: TableQueryAllItemsProps): Promise<AttributeMap[]> => {
    const req: TableQueryItemsProps = { ...props }
    const items: AttributeMap[] = []
    do {
        const res = await tableQueryItems(req)
        if (res.items.length >= 1) {
            items.push(...res.items)
        }
        req.exclusiveStartKey = res.lastEvaluatedKey
    } while (items.length < props.limit && req.exclusiveStartKey)
    return items
}
