import { APIGatewayProxyHandler } from "aws-lambda"

// export interface AudioDownloaderEnv {
//     TRUNK_ID: string
//     TALKGROUP_ID: string
//     LOOK_BACK_SECONDS: string
//     AUDIO_FILES_BUCKET_NAME: string
// }

// const handleTalkgroup = async (
//     trunkId: string,
//     talkgroupId: string,
//     lookbackStart: number,
//     lookBackSeconds: number,
//     bucketName: string
// ) => {
//     for (let i = 0; i < lookBackSeconds; i++) {
//         const timestamp = (lookbackStart + i).toString()
//         const res = await openMhzRequest({
//             trunkId,
//             talkgroupId,
//             timestamp
//         })
//         if (res.statusCode != 200) {
//             continue
//         }
//         const key = `${trunkId}-${talkgroupId}-${timestamp}.m4a`
//         await maybePutObject({
//             bucket: bucketName,
//             key,
//             body: res.body,
//             acl: "public-read"
//         })
//     }
// }

// const verifyEnv = (): AudioDownloaderEnv => {
//     return {
//         TRUNK_ID: verifyPropDefined(process.env, "TRUNK_ID"),
//         TALKGROUP_ID: verifyPropDefined(process.env, "TALKGROUP_ID"),
//         LOOK_BACK_SECONDS: verifyPropDefined(process.env, "LOOK_BACK_SECONDS"),
//         AUDIO_FILES_BUCKET_NAME: verifyPropDefined(process.env, "AUDIO_FILES_BUCKET_NAME")
//     }
// }

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log({ event })
    if (!event.body) {
        return {
            statusCode: 400,
            body: "No body"
        }
    }
    const bodyJson = JSON.parse(event.body)
    console.log({ bodyJson })
    const cases = bodyJson.cases.filter((kase: string) => kase.length >= 0)
    console.log({ cases })
    if (!cases || cases.length <= 0) {
        return {
            statusCode: 400,
            body: "No cases"
        }
    }
    const rand = Math.random()
    if (rand < 0.3) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Random 400" })
        }
    }
    if (rand < 0.6) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Random 500" })
        }
    }
    return {
        statusCode: 200,
        body: "{}"
    }
}
