import { tableCreateCCFR, tableDeleteCCFR, tableGetCCFR, tableUpdateCCFR } from "../../src/daos/ccfr-dao"

const main = async () => {
    const tableName = "Foier-CopaCaseFoiaRequests4CAAAC0E-15XE160DES96T"
    const copaCaseId = "copa-case-id"
    await tableCreateCCFR({
        tableName,
        ccfr: {
            copaCaseId,
            complaintDateTime: "complaint-date-time",
            foiaRequestStatus: "SUBMITTED"
        }
    })
    const ccfr = await tableGetCCFR({ tableName, copaCaseId })
    console.log({ ccfr })
    if (!ccfr) {
        throw new Error("No ccfr")
    }
    ccfr.foiaRequestId = "foia-request-id"
    ccfr.foiaRequestStatus = "FULFILLED"
    await tableUpdateCCFR({ tableName, ccfr })
    const updatedCCFR = await tableGetCCFR({ tableName, copaCaseId })
    console.log({ updatedCCFR })
    await tableDeleteCCFR({ tableName, copaCaseId })
}

;(async () => await main())()
