import { IRestApi, JsonSchemaType, RestApi } from "@aws-cdk/aws-apigateway"

export const createCopaCasesRequestModel = (api: RestApi) => {
    const cccRequestModelName = "CreateCopaCasesRequestModel"
    return api.addModel(cccRequestModelName, {
        modelName: cccRequestModelName,
        contentType: "application/json",
        schema: {
            type: JsonSchemaType.OBJECT,
            properties: {
                cases: {
                    type: JsonSchemaType.ARRAY,
                    items: {
                        type: JsonSchemaType.STRING,
                        minLength: 1
                    },
                    minItems: 1
                }
            },
            required: ["cases"]
        }
    })
}

export const createCopaCasesResponseModel = (api: RestApi) => {
    const cccResponseModelName = "CreateCopaCasesResponseModel"
    return api.addModel(cccResponseModelName, {
        modelName: cccResponseModelName,
        contentType: "application/json",
        schema: {
            type: JsonSchemaType.OBJECT,
            properties: {
                inserted: {
                    type: JsonSchemaType.ARRAY,
                    items: {
                        type: JsonSchemaType.STRING,
                        minLength: 1
                    }
                },
                notFound: {
                    type: JsonSchemaType.ARRAY,
                    items: {
                        type: JsonSchemaType.STRING,
                        minLength: 1
                    }
                },
                present: {
                    type: JsonSchemaType.ARRAY,
                    items: {
                        type: JsonSchemaType.STRING,
                        minLength: 1
                    }
                }
            }
        }
    })
}

export const messageModel = (api: RestApi) => {
    const messageModelName = "MessageModel"
    return api.addModel(messageModelName, {
        modelName: messageModelName,
        contentType: "application/json",
        schema: {
            type: JsonSchemaType.OBJECT,
            properties: {
                message: {
                    type: JsonSchemaType.STRING
                }
            }
        }
    })
}
