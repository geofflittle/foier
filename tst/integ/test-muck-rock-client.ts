import { createFoiaRequest, getFoiaRequest } from "../../src/clients/muck-rock-client"

const main = async () => {
    // const id = "98543"
    // const foiaReq = await getFoiaRequest({ id })
    // console.log({ foiaReq })
    // if (!foiaReq) {
    //     return
    // }
    // console.log({ firstComm: foiaReq.communications[0] })
    const res = await createFoiaRequest({
        apiToken: "",
        title: `Auto Test ${new Date().getTime()}`,
        agency: "248",
        documentRequest: "auto test records"
    })
    console.log({ res })
}

main()
