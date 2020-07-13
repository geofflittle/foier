import { execSync } from "child_process"
import { queryCopaCases } from "./src/clients/copa-client"

const main = async () => {
    const copaCases = await queryCopaCases({
        limit: 21,
        orderBy: {
            column: "complaint_date",
            order: "DESC"
        },
        // where: "NOT (log_no = '2020-0002748')",
        current_status: "Closed",
        current_category: "Excessive Force"
    })
    console.dir({ res: copaCases }, { depth: null })
    const data = {
        cases: copaCases.map((copaCase) => copaCase.log_no)
    }
    const stdout = execSync(
        `awscurl --service execute-api -X POST https://xjq60pq7ji.execute-api.us-east-1.amazonaws.com/prod/cases -d '${JSON.stringify(
            data
        )}'`
    ).toString()
    console.dir({ stdout }, { depth: null })
}

main()
