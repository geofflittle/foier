# Foier

## About

Automates FOIA requests to Chicago's COPA (Civilian Office of Police Accountability) dependent on their [complaint database](https://data.cityofchicago.org/Public-Safety/COPA-Cases-Summary/mft5-nfa8/data).

## Commands

| Command                                                | Description                                                      |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| `yarn clean`                                           | removes built artifacts                                          |
| `yarn lint`                                            | lints the codebase                                               |
| `yarn format`                                          | formats the codebase                                             |
| `yarn backend:build`                                   | compiles the backend js                                          |
| `yarn infra:deploy`                                    | deploys the Foier stack to the environment's default aws account |
| `yarn deploy`                                          | cleans, builds the backend, and deploys the infra                |
| `awscurl --service execute-api -X <method> <apig-uri>` | curl the apig endpoint with sigv4 auth                           |
