import got from "got/dist/source"

export interface CopaCase {
    log_no: string
    complaint_date: string
    assignment: string
    case_type: string
    current_status: string
    current_category: string
    finding_code: string
    police_shooting: string
    beat: string
    race_of_complainants: string
    sex_of_complainants: string
    age_of_complainants: string
    race_of_involved_officers: string
    sex_of_involved_officers: string
    age_of_involved_officers: string
    years_on_force_of_officers: string
    complaint_hour: string
    complaint_day: string
    complaint_month: string
}

export interface GetCopaCaseProps {
    log_no: string
}

export const getCopaCase = async (props: GetCopaCaseProps): Promise<CopaCase | undefined> => {
    const res = await got.get(
        `https://data.cityofchicago.org/resource/mft5-nfa8.json/?log_no=${encodeURIComponent(props.log_no)}`,
        {
            responseType: "json"
        }
    )
    const cases = res.body as CopaCase[]
    if (cases.length <= 0) {
        return Promise.resolve(undefined)
    }
    return cases[0]
}

export interface QueryCopaCasesProps {
    limit?: number
    orderBy?: {
        column: "complaint_date"
        order: "ASC" | "DESC"
    }
    where?: string
    current_status?: string
    current_category?: string
}

export const queryCopaCases = async (props: QueryCopaCasesProps): Promise<CopaCase[]> => {
    const queryString = getQueryString(props)
    const res = await got.get(`https://data.cityofchicago.org/resource/mft5-nfa8.json/?${queryString}`, {
        responseType: "json"
    })
    return res.body as CopaCase[]
}

const getQueryString = (props: QueryCopaCasesProps) => {
    const limitQueryString = props.limit ? `$limit=${encodeURIComponent(props.limit)}` : ""
    const orderQueryString = props.orderBy
        ? `$order=${encodeURIComponent(props.orderBy.column + " " + props.orderBy.order)}`
        : ""
    const whereQueryString = props.where ? `$where=${encodeURIComponent(props.where)}` : ""
    const currentStatusQueryString = props.current_status
        ? `current_status=${encodeURIComponent(props.current_status)}`
        : ""
    const currentCategoryQueryString = props.current_category
        ? `current_category=${encodeURIComponent(props.current_category)}`
        : ""
    return [
        limitQueryString,
        orderQueryString,
        whereQueryString,
        currentStatusQueryString,
        currentCategoryQueryString
    ].join("&")
}
