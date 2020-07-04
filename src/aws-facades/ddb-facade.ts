import { ExpressionAttributeValueMap, PutItemInputAttributeMap } from "aws-sdk/clients/dynamodb"

import { AttributeMap } from "aws-sdk/clients/dynamodbstreams"
import { DynamoDB } from "aws-sdk"

const dynamoDb = new DynamoDB({ region: "us-east-1" })

interface BatchWriteItems {
    tableName: string
    items: PutItemInputAttributeMap[]
}

export const tableBatchPutItems = async ({ tableName, items }: BatchWriteItems): Promise<AttributeMap[]> => {
    const writeRequests = items.map((item) => ({ PutRequest: { Item: item } }))
    console.log({ writeRequests: JSON.stringify(writeRequests) })
    const res = await dynamoDb.batchWriteItem({ RequestItems: { [tableName]: writeRequests } }).promise()
    if (!res.UnprocessedItems || !res.UnprocessedItems[tableName]) {
        return []
    }
    return res.UnprocessedItems[tableName].map((writeRequest) => {
        if (!writeRequest.PutRequest) {
            throw new Error(`Illegal unprocessed write request ${writeRequest}`)
        }
        return writeRequest.PutRequest.Item
    })
}

interface QueryParams {
    tableName: string
    partitionKeyName: string
    partitionKeyValue: string
    sortKeyName?: string
    sortKeyValue?: string
}

export const tableQueryItems = async ({
    tableName,
    partitionKeyName,
    partitionKeyValue,
    sortKeyName,
    sortKeyValue
}: QueryParams): Promise<AttributeMap[]> => {
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
    const res = await dynamoDb
        .query({
            TableName: tableName,
            KeyConditionExpression: keyCondExpr,
            ExpressionAttributeValues: expressionAttributeValues
        })
        .promise()
    return res.Items || []
}
