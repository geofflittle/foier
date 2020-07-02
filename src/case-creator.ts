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

export const handler: APIGatewayProxyHandler = async () => {
    const message = "Received create case request"
    console.log({ message })
    return {
        statusCode: 200,
        body: message
    }
}
