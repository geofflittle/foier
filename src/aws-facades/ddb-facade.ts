import { ExpressionAttributeValueMap, Key, PutItemInputAttributeMap } from "aws-sdk/clients/dynamodb"

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
    console.dir({ req }, { depth: null })
    await dynamoDb.putItem(req).promise()
}

export interface BatchWriteItemsProps {
    tableName: string
    items: PutItemInputAttributeMap[]
}

export const tableBatchPutItems = async ({ tableName, items }: BatchWriteItemsProps): Promise<AttributeMap[]> => {
    const req = { RequestItems: { [tableName]: items.map((item) => ({ PutRequest: { Item: item } })) } }
    console.dir({ req }, { depth: null })
    const res = await dynamoDb.batchWriteItem(req).promise()
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
    console.dir({ req }, { depth: null })
    const res = await dynamoDb.getItem(req).promise()
    return res.Item
}

export interface TableDeleteItemProps {
    tableName: string
    partitionKeyName: string
    partitionKeyValue: string
}

export const tableDeleteItem = async ({ tableName, partitionKeyName, partitionKeyValue }: TableDeleteItemProps) => {
    const req = {
        TableName: tableName,
        Key: {
            [partitionKeyName]: {
                S: partitionKeyValue
            }
        }
    }
    console.dir({ req }, { depth: null })
    await dynamoDb.deleteItem(req).promise()
}

export interface TableQueryItemsProps {
    tableName: string
    partitionKeyName: string
    partitionKeyValue: string
    sortKeyName?: string
    sortKeyValue?: string
    indexName?: string
    exclusiveStartKey?: Key
}

export const tableQueryItems = async ({
    tableName,
    partitionKeyName,
    partitionKeyValue,
    sortKeyName,
    sortKeyValue,
    indexName,
    exclusiveStartKey
}: TableQueryItemsProps): Promise<[AttributeMap[], Key | undefined]> => {
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
    const req = {
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: keyCondExpr,
        ExpressionAttributeValues: expressionAttributeValues,
        ExclusiveStartKey: exclusiveStartKey
    }
    console.dir({ req }, { depth: null })
    const res = await dynamoDb.query(req).promise()
    return [res.Items || [], res.LastEvaluatedKey]
}

export interface TableQueryAllItemsProps {
    tableName: string
    partitionKeyName: string
    partitionKeyValue: string
    sortKeyName?: string
    sortKeyValue?: string
    indexName?: string
}

export const tableQueryAllItems = async (props: TableQueryAllItemsProps): Promise<AttributeMap[]> => {
    const req: TableQueryItemsProps = { ...props }
    const items: AttributeMap[] = []
    do {
        const [items, lastEvaluatedKey] = await tableQueryItems(req)
        if (items.length >= 1) {
            items.push(...items)
        }
        req.exclusiveStartKey = lastEvaluatedKey
    } while (req.exclusiveStartKey)
    return items
}
