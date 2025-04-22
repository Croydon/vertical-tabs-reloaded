import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";

export default defineConfig([
    globalIgnores(["dev/*", "lib/*", "data/*", "build/*", "web-ext-artifacts/*"]),
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.webextensions,
            },

            ecmaVersion: 8,
            sourceType: "script",
        },

        rules: {
            "arrow-spacing": 2,
            "block-spacing": 2,
            "array-bracket-spacing": [2, "never"],
            "object-curly-spacing": [2, "never"],
            "space-in-parens": [2, "never"],

            "brace-style": ["error", "allman", {
                allowSingleLine: true,
            }],

            "comma-spacing": [2, {
                before: false,
                after: true,
            }],

            "comma-style": 2,
            "computed-property-spacing": [1, "never"],
            "consistent-return": 0,
            curly: [2, "all"],
            "eol-last": "error",

            "generator-star-spacing": [2, {
                before: false,
                after: true,
            }],

            indent: ["error", 4, {
                SwitchCase: 1,
            }],

            "key-spacing": [2, {
                beforeColon: false,
                afterColon: true,
                mode: "minimum",
            }],

            "new-parens": 2,
            "no-dupe-args": 2,
            "no-dupe-keys": 2,
            "no-duplicate-case": 2,
            "no-empty": 2,
            "no-empty-character-class": 2,
            "no-empty-pattern": 2,
            "no-ex-assign": 2,
            "no-extra-boolean-cast": 1,
            "no-extra-semi": "error",
            "no-func-assign": 2,
            "no-invalid-regexp": 2,
            "no-irregular-whitespace": 2,
            "no-mixed-spaces-and-tabs": [2, "smart-tabs"],
            "no-multi-spaces": 1,
            "no-native-reassign": 2,
            "no-negated-in-lhs": 2,
            "no-nested-ternary": 2,
            "no-new-object": 2,
            "no-obj-calls": 2,
            "no-octal": 2,
            "no-redeclare": 2,
            "no-self-compare": 2,
            "no-spaced-func": "warn",
            "no-trailing-spaces": 2,
            "no-unexpected-multiline": 2,
            "no-unreachable": 2,
            "no-unused-expressions": 2,

            "no-unused-vars": [2, {
                args: "none",
                varsIgnorePattern: "^(Cc|Ci|Cr|Cu|EXPORTED_SYMBOLS)$|^_",
            }],

            "no-use-before-define": ["error", {
                functions: false,
                classes: true,
                variables: true,
            }],

            "no-with": 2,
            semi: [2, "always"],
            "space-before-blocks": 2,

            "space-before-function-paren": [2, {
                anonymous: "never",
                named: "never",
            }],

            "space-infix-ops": [2, {
                int32Hint: true,
            }],

            "space-unary-ops": [1, {
                nonwords: false,
                words: true,

                overrides: {
                    typeof: false,
                },
            }],

            "use-isnan": 2,
            "valid-typeof": 2,
            "block-scoped-var": 2,
            "comma-dangle": ["error", "only-multiline"],

            complexity: ["error", {
                max: 40,
            }],

            "default-case": 0,
            "dot-location": [2, "property"],
            eqeqeq: 0,
            "func-names": 0,
            "func-style": 0,
            "max-depth": 0,
            "max-len": [0, 80],
            "max-nested-callbacks": [2, 4],
            "max-params": 0,
            "max-statements": 0,

            "new-cap": [0, {
                capIsNew: false,
            }],

            "no-bitwise": 0,
            "no-caller": 2,
            "no-catch-shadow": 0,
            "no-cond-assign": 2,
            "no-constant-condition": 0,
            "no-continue": 0,
            "no-control-regex": 2,
            "no-debugger": 2,
            "no-delete-var": 2,
            "no-div-regex": 0,
            "no-eval": 2,
            "no-extend-native": 2,
            "no-extra-bind": 2,
            "no-extra-parens": 0,
            "no-fallthrough": 2,
            "no-floating-decimal": 0,
            "no-inline-comments": 0,

            "no-labels": [2, {
                allowLoop: true,
            }],

            "no-multi-str": 1,

            "no-multiple-empty-lines": [1, {
                max: 2,
            }],

            "no-param-reassign": 0,
            "no-path-concat": 0,
            "no-plusplus": 0,
            "no-process-env": 0,
            "no-process-exit": 0,
            "no-proto": 2,
            "no-regex-spaces": 2,
            "no-reserved-keys": 0,
            "no-restricted-modules": 0,
            "no-return-assign": 2,
            "no-shadow": 0,
            "no-shadow-restricted-names": 2,
            "no-sync": 0,
            "no-ternary": 0,
            "no-throw-literal": 2,
            "no-undef": 2,
            "no-underscore-dangle": 0,
            "no-undefined": 0,
            "no-unneeded-ternary": 2,
            "no-var": 0,
            "no-warn-comments": 0,
            "object-shorthand": 0,
            "one-var": 0,
            "padded-blocks": [1, "never"],
            "prefer-arrow-callback": "error",
            "quote-props": 0,

            quotes: ["error", "double", {
                avoidEscape: true,
                allowTemplateLiterals: true,
            }],

            radix: "error",

            "semi-spacing": [2, {
                before: false,
                after: true,
            }],

            "sort-vars": 0,
            "spaced-comment": [2, "always"],
            strict: ["error", "global"],
            "vars-on-top": 0,
            "wrap-iife": 0,
            "wrap-regex": 0,
            yoda: 2,
            "no-implied-eval": 2,
            "no-inner-declarations": 2,
            "no-iterator": 2,
            "no-label-var": 2,
            "no-new-wrappers": 2,
        },
    },
]);
