import path = require("path")

import { Alarm, IMetric } from "@aws-cdk/aws-cloudwatch"
import { Code, Function, Runtime } from "@aws-cdk/aws-lambda"
import { Construct, Duration, Stack } from "@aws-cdk/core"
import { Rule, Schedule } from "@aws-cdk/aws-events"

import { ITopic } from "@aws-cdk/aws-sns"
import { LambdaFunction } from "@aws-cdk/aws-events-targets"
import { SnsAction } from "@aws-cdk/aws-cloudwatch-actions"

export interface ScheduledFunctionProps {
    name: string
    schedule: Schedule
    environment: { [key: string]: string }
    alarmTopic: ITopic
}

const pascalToKebabCase = (pascal: string): string => {
    return Array.from(pascal).reduce((acc, cur, idx) => {
        if (idx == 0) {
            return acc + cur.toLowerCase()
        }
        if (cur == cur.toUpperCase()) {
            return acc + `-${cur.toLowerCase()}`
        }
        return acc + cur
    }, "")
}

export class ScheduledFunction extends Construct {
    readonly rule: Rule
    readonly fnc: Function

    constructor(scope: Construct, props: ScheduledFunctionProps) {
        super(scope, `${props.name}ScheduledFunction`)

        const ruleName = `${props.name}Rule`
        this.rule = new Rule(this, ruleName, { ruleName, schedule: props.schedule })

        const functionName = `${props.name}Function`
        this.fnc = new Function(this, functionName, {
            functionName: functionName,
            environment: props.environment,
            // defaults
            code: Code.fromAsset(path.join(process.cwd(), "dist")),
            runtime: Runtime.NODEJS_12_X,
            handler: `handlers/${pascalToKebabCase(props.name)}.handler`,
            timeout: Duration.minutes(15)
        })
        this.rule.addTarget(new LambdaFunction(this.fnc))

        const alarmName = `${props.name}Alarm`
        const alarm = new Alarm(this, alarmName, {
            alarmName,
            metric: this.fnc.metricErrors(),
            evaluationPeriods: 1,
            threshold: 1
        })
        alarm.addAlarmAction(new SnsAction(props.alarmTopic))
    }
}
