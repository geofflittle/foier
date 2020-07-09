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

        const ccfrTable = new Table(this, "CopaCaseFoiaRequests", {
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

        const rule = new Rule(this, "FoiaRequestStatusCheckerRule", {
            schedule: Schedule.rate(Duration.days(1))
        })
        const requestStatusChecker = new Function(this, "CopaCasesLoader", {
            code: Code.fromAsset(path.join(process.cwd(), "dist")),
            runtime: Runtime.NODEJS_12_X,
            handler: "handlers/request-status-checker.handler",
            timeout: Duration.minutes(15),
            environment: {
                CCFR_TABLE_NAME: ccfrTable.tableName
            }
        })
        rule.addTarget(new LambdaFunction(requestStatusChecker))
        ccfrTable.grantReadData(requestStatusChecker)

        const copaCasesLoader = new Function(this, "CopaCasesLoader", {
            code: Code.fromAsset(path.join(process.cwd(), "dist")),
            runtime: Runtime.NODEJS_12_X,
            handler: "handlers/copa-cases-loader.handler",
            timeout: Duration.minutes(15),
            environment: {
                CCFR_TABLE_NAME: ccfrTable.tableName
            }
        })
        ccfrTable.grantWriteData(copaCasesLoader)

        const api = new RestApi(this, "FoierApi", {
            deployOptions: {
                dataTraceEnabled: true,
                loggingLevel: MethodLoggingLevel.INFO,
                metricsEnabled: true
            }
        })

        const casesRequestModel = api.addModel("CreateCasesRequestModel", {
            modelName: "CreateCasesRequestModel",
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

        const casesResponseModel = api.addModel("CreateCasesResponseModel", {
            modelName: "CreateCasesResponseModel",
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

        const messageModel = api.addModel("MessageModel", {
            modelName: "MessageModel",
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

        const casesResource = api.root.addResource("cases")
        casesResource.addMethod("POST", new LambdaIntegration(copaCasesLoader), {
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
