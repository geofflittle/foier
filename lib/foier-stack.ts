import path = require("path")

import { AttributeType, Table } from "@aws-cdk/aws-dynamodb"
import {
    AuthorizationType,
    JsonSchemaType,
    LambdaIntegration,
    MethodLoggingLevel,
    RestApi
} from "@aws-cdk/aws-apigateway"
import { Code, Function, Runtime } from "@aws-cdk/aws-lambda"
import { Construct, Duration, Stack } from "@aws-cdk/core"
import { Rule, Schedule } from "@aws-cdk/aws-events"

import { LambdaFunction } from "@aws-cdk/aws-events-targets"

export class FoierStack extends Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id)

        const ccfrTableName = "CopaCaseFoiaRequests"
        const ccfrTable = new Table(this, ccfrTableName, {
            tableName: ccfrTableName,
            partitionKey: {
                name: "copaCaseId",
                type: AttributeType.STRING
            }
        })
        ccfrTable.addGlobalSecondaryIndex({
            indexName: "foiaRequestStatusIndex",
            partitionKey: {
                name: "foiaRequestStatus",
                type: AttributeType.STRING
            },
            sortKey: {
                name: "copaCaseId",
                type: AttributeType.STRING
            }
        })

        const frsUpdaterRuleName = "FoiaRequestStatusUpdaterRule"
        const frsUpdaterRule = new Rule(this, frsUpdaterRuleName, {
            ruleName: frsUpdaterRuleName,
            schedule: Schedule.rate(Duration.days(1))
        })

        const frsUpdaterFunctionName = "FoiaRequestStatusUpdaterFunction"
        const frsUpdaterFuncion = new Function(this, frsUpdaterFunctionName, {
            functionName: frsUpdaterFunctionName,
            code: Code.fromAsset(path.join(process.cwd(), "dist")),
            runtime: Runtime.NODEJS_12_X,
            handler: "handlers/request-status-checker.handler",
            timeout: Duration.minutes(15),
            environment: {
                CCFR_TABLE_NAME: ccfrTable.tableName
            }
        })
        frsUpdaterRule.addTarget(new LambdaFunction(frsUpdaterFuncion))
        ccfrTable.grantReadData(frsUpdaterFuncion)

        const cciFunctionName = "CopaCasesInserterFunction"
        const copaCasesInserterFunction = new Function(this, cciFunctionName, {
            functionName: cciFunctionName,
            code: Code.fromAsset(path.join(process.cwd(), "dist")),
            runtime: Runtime.NODEJS_12_X,
            handler: "handlers/copa-cases-loader.handler",
            timeout: Duration.minutes(15),
            environment: {
                CCFR_TABLE_NAME: ccfrTable.tableName
            }
        })
        ccfrTable.grantWriteData(copaCasesInserterFunction)

        const foierApiName = "FoierApi"
        const foierApi = new RestApi(this, foierApiName, {
            restApiName: foierApiName,
            deployOptions: {
                dataTraceEnabled: true,
                loggingLevel: MethodLoggingLevel.INFO,
                metricsEnabled: true
            }
        })

        const cccRequestModelName = "CreateCopaCasesRequestModel"
        const casesRequestModel = foierApi.addModel(cccRequestModelName, {
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

        const cccResponseModelName = "CreateCopaCasesResponseModel"
        const casesResponseModel = foierApi.addModel(cccResponseModelName, {
            modelName: cccResponseModelName,
            contentType: "application/json",
            schema: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    loaded: {
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

        const messageModelName = "MessageModel"
        const messageModel = foierApi.addModel(messageModelName, {
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

        const casesResource = foierApi.root.addResource("cases")
        casesResource.addMethod("POST", new LambdaIntegration(copaCasesInserterFunction), {
            operationName: "InsertCopaCases",
            authorizationType: AuthorizationType.IAM,
            requestValidatorOptions: {
                validateRequestBody: true,
                validateRequestParameters: true
            },
            requestModels: { "application/json": casesRequestModel },
            methodResponses: [
                {
                    statusCode: "200",
                    responseModels: {
                        "application/json": casesResponseModel
                    }
                },
                {
                    statusCode: "400",
                    responseModels: {
                        "application/json": messageModel
                    }
                },
                {
                    statusCode: "500",
                    responseModels: {
                        "application/json": messageModel
                    }
                }
            ]
        })
    }
}
