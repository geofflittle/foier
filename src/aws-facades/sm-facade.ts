import { GetSecretValueRequest, GetSecretValueResponse } from "aws-sdk/clients/secretsmanager"

import { SecretsManager } from "aws-sdk"

const sm = new SecretsManager({ region: "us-east-1" })

export interface GetSecretValueProps {
    secretId: string
}

export const getSecretValue = async ({ secretId }: GetSecretValueProps): Promise<string | undefined> => {
    const req: GetSecretValueRequest = {
        SecretId: secretId
    }
    console.log({ module: "sm-facade", method: "getSecretValue", req })
    const res = await sm.getSecretValue(req).promise()
    console.log({ module: "sm-facade", method: "getSecretValue", res })
    return res.SecretString
}
