#!/usr/bin/env node

import { App } from "@aws-cdk/core"
import { FoierStack } from "../lib/foier-stack"

const app = new App()
new FoierStack(app, "Foier")
