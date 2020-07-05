type StringKeyObj = { [key: string]: unknown }

export const verifyDefined = <T>(v: T | undefined, name: string): T => {
    if (v == undefined) {
        throw new Error(`Undefined ${name}`)
    }
    return v
}

export const verifyPropDefined = <T extends StringKeyObj, U>(t: T, key: string): U => verifyDefined(t[key], key) as U
