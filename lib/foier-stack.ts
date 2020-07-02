import path = require("path")

import { AuthorizationType, LambdaIntegration, RestApi } from "@aws-cdk/aws-apigateway"
import { Code, Function, Runtime } from "@aws-cdk/aws-lambda"
import { Construct, Stack } from "@aws-cdk/core"

export class FoierStack extends Stack {
    constructor(scope: Construct, id: string) {
        super(scope, id)

        const createCaseHandler = new Function(this, "CaseCreateHandler", {
            code: Code.fromAsset(path.join(process.cwd(), "dist")),
            runtime: Runtime.NODEJS_12_X,
            handler: "case-creator.handler",
            environment: {}
        })

        const api = new RestApi(this, "FoierApi")
        const casesResource = api.root.addResource("cases")
        casesResource.addMethod("POST", new LambdaIntegration(createCaseHandler), {
            authorizationType: AuthorizationType.IAM
        })
    }
}
