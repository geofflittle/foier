import { getFoiaRequest } from "../../src/clients/muck-rock-client"

const main = async () => {
    const id = "96403"
    const foiaReq = await getFoiaRequest({ id })
    console.dir({ foiaReq }, { depth: null })
    if (!foiaReq) {
        return
    }
    console.dir({ firstComm: foiaReq.communications[0] }, { depth: null })
}

main()
