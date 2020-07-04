import https, { RequestOptions } from "https"

import { IncomingHttpHeaders } from "http2"

interface Response {
    statusCode?: number
    headers: IncomingHttpHeaders
    statusMessage?: string
    body: Buffer
}

export const request = (options: RequestOptions): Promise<Response> => {
    console.log({ options })
    return new Promise<Response>((resolve, reject) => {
        const chunks: Uint8Array[] = []
        https.get(options, (res) => {
            res.on("error", (err) => {
                reject(err)
            })
            res.on("data", (chunk) => chunks.push(chunk))
            res.on("end", () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    statusMessage: res.statusMessage,
                    body: Buffer.concat(chunks)
                })
            })
        })
    })
}
