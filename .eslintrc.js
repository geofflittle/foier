module.exports = {
    root: true,
    env: {
        node: true
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module"
    },
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    rules: {}
}
