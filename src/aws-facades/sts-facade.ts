import STS, { Credentials } from "aws-sdk/clients/sts"

const sts = new STS({ region: "us-east-1" })

export const getSessionToken = async (): Promise<Credentials> => {
    const res = await sts.getSessionToken().promise()
    if (!res.Credentials) {
        throw new Error("Couldn't get session token")
    }
    return res.Credentials
}
