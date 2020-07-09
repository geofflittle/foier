import https, { RequestOptions } from "https"

import { IncomingHttpHeaders } from "http2"

interface Response {
    statusCode?: number
    headers: IncomingHttpHeaders
    statusMessage?: string
    body: Buffer
}

export const get = (opts: RequestOptions): Promise<Response> => {
    console.log({ opts })
    return new Promise<Response>((resolve, reject) => {
        const chunks: Uint8Array[] = []
        https.get(opts, (res) => {
            res.on("error", (err) => reject(err))
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

export const request = (opts: RequestOptions, data?: string): Promise<Response> => {
    return new Promise<Response>((resolve, reject) => {
        const chunks: Uint8Array[] = []
        const req = { ...opts, ...(data ? { method: "POST" } : {}) }
        console.log({ req })
        const clientRequest = https[data ? "request" : "get"](req, (res) => {
            res.on("error", (error) => reject(error))
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
        if (!data) {
            return
        }
        clientRequest.on("error", (error) => reject(error))
        clientRequest.write(data)
        clientRequest.end()
    })
}
