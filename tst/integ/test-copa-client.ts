import { getCopaCase, queryCopaCases } from "../../src/clients/copa-client"
;
(async () => {
    const copaCases = await queryCopaCases({
        limit: 2,
        orderBy: {
            column: "complaint_date",
            order: "DESC"
        },
        current_status: "Closed",
        current_category: "Excessive Force"
    })
    console.dir({ res: copaCases }, { depth: null })
    const copaCase = await getCopaCase({
        log_no: "2020-0002737"
    })
    console.dir({ copaCase }, { depth: null })
})()
