# Foier

## About

Automates FOIA requests to Chicago's COPA (Civilian Office of Police Accountability) dependent on their [complaint database](https://data.cityofchicago.org/Public-Safety/COPA-Cases-Summary/mft5-nfa8/data).

## Commands

| Command                                                                                  | Description                                                      |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| <pre>yarn clean</pre>                                                                    | removes built artifacts                                          |
| <pre>yarn lint</pre>                                                                     | lints the codebase                                               |
| <pre>yarn format</pre>                                                                   | formats the codebase                                             |
| <pre>yarn backend:build</pre>                                                            | compiles the backend js                                          |
| <pre>yarn infra:deploy</pre>                                                             | deploys the Foier stack to the environment's default aws account |
| <pre>yarn deploy</pre>                                                                   | cleans, builds the backend, and deploys the infra                |
| <pre>awscurl --service execute-api \ <br/> -X [method][apig-uri] \ <br/> -d [body]</pre> | curl the apig endpoint with sigv4 auth                           |

## Dirs

-   `bin` contains the only "executable", `app.ts`, that's used for deploying the infrastructure
-   `lib` contains resources used by `app.ts`
-   `src` contains the backend source (hosted on aws lambda)
