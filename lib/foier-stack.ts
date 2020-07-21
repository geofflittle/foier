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
import { createCopaCasesRequestModel, createCopaCasesResponseModel, messageModel } from "./foier-api-models"

import { LambdaFunction } from "@aws-cdk/aws-events-targets"
import { ScheduledFunction } from "./scheduled-function"

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
                name: "complaintDateTime",
                type: AttributeType.STRING
            }
        })

        const frsScdFnc = new ScheduledFunction(this, {
            name: "FoiaRequestSubmitter",
            schedule: Schedule.rate(Duration.days(1)),
            environment: {
                CCFR_TABLE_NAME: ccfrTable.tableName,
                MAX_REQUESTS_SUBMITTED: "1"
            }
        })
        ccfrTable.grantReadData(frsScdFnc.fnc)

        const rsuScdFnc = new ScheduledFunction(this, {
            name: "RequestStatusUpdater",
            schedule: Schedule.rate(Duration.days(1)),
            environment: {
                CCFR_TABLE_NAME: ccfrTable.tableName,
                MAX_REQUESTS_SUBMITTED: "1"
            }
        })
        ccfrTable.grantReadData(rsuScdFnc.fnc)

        const cciFunctionName = "CopaCasesInserterFunction"
        const cciFunction = new Function(this, cciFunctionName, {
            functionName: cciFunctionName,
            code: Code.fromAsset(path.join(process.cwd(), "dist")),
            runtime: Runtime.NODEJS_12_X,
            handler: "handlers/copa-cases-inserter.handler",
            timeout: Duration.minutes(15),
            environment: {
                CCFR_TABLE_NAME: ccfrTable.tableName
            }
        })
        ccfrTable.grantWriteData(cciFunction)

        const foierApiName = "FoierApi"
        const foierApi = new RestApi(this, foierApiName, {
            restApiName: foierApiName,
            deployOptions: {
                dataTraceEnabled: true,
                loggingLevel: MethodLoggingLevel.INFO,
                metricsEnabled: true
            }
        })

        const cccReqModel = createCopaCasesRequestModel(foierApi)
        const cccResModel = createCopaCasesResponseModel(foierApi)
        const msgModel = messageModel(foierApi)

        const casesResource = foierApi.root.addResource("cases")
        casesResource.addMethod("POST", new LambdaIntegration(cciFunction), {
            operationName: "InsertCopaCases",
            authorizationType: AuthorizationType.IAM,
            requestValidatorOptions: { validateRequestBody: true, validateRequestParameters: true },
            requestModels: { "application/json": cccReqModel },
            methodResponses: [
                { statusCode: "200", responseModels: { "application/json": cccResModel } },
                { statusCode: "400", responseModels: { "application/json": msgModel } },
                { statusCode: "500", responseModels: { "application/json": msgModel } }
            ]
        })
    }
}
