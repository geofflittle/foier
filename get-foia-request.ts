import { execSync } from "child_process"
import { getFoiaRequest } from "./src/clients/muck-rock-client"
import { queryCopaCases } from "./src/clients/copa-cases-client"

const main = async () => {
    const id = "96403"
    const foiaReq = await getFoiaRequest({ id })
    console.log({ foiaReq })
    if (!foiaReq) {
        return
    }
    console.log({ firstComm: foiaReq.communications[0] })
}

main()
