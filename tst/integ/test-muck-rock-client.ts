import { createFoiaRequest, getFoiaRequest } from "../../src/clients/muck-rock-client"

const main = async () => {
    // const res = await createFoiaRequest({
    //     apiToken: "eff4f182c3ae305ca2ca85a268f54993c24dd176",
    //     title: `Auto Test ${new Date().getTime()}`,
    //     agency: "248",
    //     documentRequest: "auto test records"
    // })
    // console.log({ res })

    // const id = "86737"
    const foiaReq = await getFoiaRequest({ id: "98873" })
    console.log({ foiaReq })
    if (!foiaReq) {
        return
    }
    console.log({ firstComm: foiaReq.communications[0] })
}

main()
