type StringKeyObj = { [key: string]: unknown }

export const verifyDefined = <T>(v: T | undefined, name: string): T => {
    if (v == undefined) {
        throw new Error(`Undefined ${name}`)
    }
    return v
}

export const verifyPropDefined = <T extends StringKeyObj>(t: T, key: string): T => verifyDefined(t[key], key) as T
