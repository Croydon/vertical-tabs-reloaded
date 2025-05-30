import {defineConfig, globalIgnores} from "eslint/config";
import globals from "globals";

const eslintSharedRules = {
    // Require spacing around =>
    "arrow-spacing": 2,

    // Always require spacing around a single line block
    "block-spacing": 2,

    // Forbid spaces inside the square brackets of array literals.
    "array-bracket-spacing": [2, "never"],

    // Forbid spaces inside the curly brackets of object literals.
    "object-curly-spacing": [2, "never"],

    // No space padding in parentheses
    "space-in-parens": [2, "never"],

    // Enforce one true brace style (opening brace on the same line) and avoid
    // start and end braces on the same line.
    "brace-style": ["error", "allman", {"allowSingleLine": true}],

    // No space before always a space after a comma
    "comma-spacing": [2, {"before": false, "after": true}],

    // Commas at the end of the line not the start
    "comma-style": 2,

    // Don't require spaces around computed properties
    "computed-property-spacing": [1, "never"],

    // Functions are not required to consistently return something or nothing
    "consistent-return": 0,

    // Require braces around blocks that start a new line
    "curly": [2, "all"],

    // Always require a trailing EOL
    "eol-last": "error",

    // Require function* name()
    "generator-star-spacing": [2, {"before": false, "after": true}],

    // Two space indent
    "indent": ["error", 4, {
        "SwitchCase": 1
    }
    ],

    // Space after colon not before in property declarations
    "key-spacing": [2, {"beforeColon": false, "afterColon": true, "mode": "minimum"}],

    // Always require parenthesis for new calls
    "new-parens": 2,

    // No duplicate arguments in function declarations
    "no-dupe-args": 2,

    // No duplicate keys in object declarations
    "no-dupe-keys": 2,

    // No duplicate cases in switch statements
    "no-duplicate-case": 2,

    // Disallow empty statements. This will report an error for:
    // try { something(); } catch (e) {}
    // but will not report it for:
    // try { something(); } catch (e) { /* Silencing the error because ...*/ }
    // which is a valid use case.
    "no-empty": 2,

    // No empty character classes in regex
    "no-empty-character-class": 2,

    // Disallow empty destructuring
    "no-empty-pattern": 2,

    // No assiging to exception variable
    "no-ex-assign": 2,

    // No using !! where casting to boolean is already happening
    "no-extra-boolean-cast": 1,

    // No double semicolon
    "no-extra-semi": "error",

    // No overwriting defined functions
    "no-func-assign": 2,

    // No invalid regular expresions
    "no-invalid-regexp": 2,

    // No odd whitespace characters
    "no-irregular-whitespace": 2,

    // No mixing spaces and tabs in indent
    "no-mixed-spaces-and-tabs": [2, "smart-tabs"],

    // Disallow use of multiple spaces (sometimes used to align const values,
    // array or object items, etc.). It's hard to maintain and doesn't add that
    // much benefit.
    "no-multi-spaces": 1,

    // No reassigning native JS objects
    "no-native-reassign": 2,

    // No (!foo in bar)
    "no-negated-in-lhs": 2,

    // Nested ternary statements are confusing
    "no-nested-ternary": 2,

    // Use {} instead of new Object()
    "no-new-object": 2,

    // No Math() or JSON()
    "no-obj-calls": 2,

    // No octal literals
    "no-octal": 2,

    // No redeclaring variables
    "no-redeclare": 2,

    // No unnecessary comparisons
    "no-self-compare": 2,

    // No spaces between function name and parentheses
    "no-spaced-func": "warn",

    // No trailing whitespace
    "no-trailing-spaces": 2,

    // Error on newline where a semicolon is needed
    "no-unexpected-multiline": 2,

    // No unreachable statements
    "no-unreachable": 2,

    // No expressions where a statement is expected
    "no-unused-expressions": 2,

    // No declaring variables that are never used
    "no-unused-vars": [2, {"args": "none", "varsIgnorePattern": "^(main|utils|log|Cc|Ci|Cr|Cu|EXPORTED_SYMBOLS)$|^_"}],

    // No using variables and classes before defined
    "no-use-before-define": ["error", {"functions": false, "classes": true, "variables": true}],

    // No using with
    "no-with": 2,

    // Always require semicolon at end of statement
    "semi": [2, "always"],

    // Require space before blocks
    "space-before-blocks": 2,

    // Never use spaces before function parentheses
    "space-before-function-paren": [2, {"anonymous": "never", "named": "never"}],

    // Require spaces around operators, except for a|0.
    "space-infix-ops": [2, {"int32Hint": true}],

    // ++ and -- should not need spacing
    "space-unary-ops": [1, {"nonwords": false, "words": true, "overrides": {"typeof": false}}],

    // No comparisons to NaN
    "use-isnan": 2,

    // Only check typeof against valid results
    "valid-typeof": 2,

    // Disallow using variables outside the blocks they are defined (especially
    // since only let and const are used, see "no-var").
    "block-scoped-var": 2,

    // Allow trailing commas for easy list extension.  Having them does not
    // impair readability, but also not required either.
    "comma-dangle": ["error", "only-multiline"],

    // Warn about cyclomatic complexity in functions.
    "complexity": ["error", {"max": 40}],

    // Don't require a default case in switch statements. Avoid being forced to
    // add a bogus default when you know all possible cases are handled.
    "default-case": 0,

    // Enforce dots on the next line with property name.
    "dot-location": [2, "property"],

    // Allow using == instead of ===, in the interest of landing something since
    // the devtools codebase is split on convention here.
    "eqeqeq": 0,

    // Don't require function expressions to have a name.
    // This makes the code more verbose and hard to read. Our engine already
    // does a fantastic job assigning a name to the function, which includes
    // the enclosing function name, and worst case you have a line number that
    // you can just look up.
    "func-names": 0,

    // Allow use of function declarations and expressions.
    "func-style": 0,

    // Don't enforce the maximum depth that blocks can be nested. The complexity
    // rule is a better rule to check this.
    "max-depth": 0,

    // Maximum length of a line.
    // Disabled because we exceed this in too many places.
    "max-len": [0, 80],

    // Maximum depth callbacks can be nested.
    "max-nested-callbacks": [2, 4],

    // Don't limit the number of parameters that can be used in a function.
    "max-params": 0,

    // Don't limit the maximum number of statement allowed in a function. We
    // already have the complexity rule that's a better measurement.
    "max-statements": 0,

    // Don't require a capital letter for constructors, only check if all new
    // operators are followed by a capital letter. Don't warn when capitalized
    // functions are used without the new operator.
    "new-cap": [0, {"capIsNew": false}],

    // Allow use of bitwise operators.
    "no-bitwise": 0,

    // Disallow use of arguments.caller or arguments.callee.
    "no-caller": 2,

    // Disallow the catch clause parameter name being the same as a variable in
    // the outer scope, to avoid confusion.
    "no-catch-shadow": 0,

    // Disallow assignment in conditional expressions.
    "no-cond-assign": 2,

    // Allow using constant expressions in conditions like while (true)
    "no-constant-condition": 0,

    // Allow use of the continue statement.
    "no-continue": 0,

    // Disallow control characters in regular expressions.
    "no-control-regex": 2,

    // Disallow use of debugger.
    "no-debugger": 2,

    // Disallow deletion of variables (deleting properties is fine).
    "no-delete-var": 2,

    // Allow division operators explicitly at beginning of regular expression.
    "no-div-regex": 0,

    // Disallow use of eval(). We have other APIs to evaluate code in content.
    "no-eval": 2,

    // Disallow adding to native types
    "no-extend-native": 2,

    // Disallow unnecessary function binding.
    "no-extra-bind": 2,

    // Allow unnecessary parentheses, as they may make the code more readable.
    "no-extra-parens": 0,

    // Disallow fallthrough of case statements, except if there is a comment.
    "no-fallthrough": 2,

    // Allow the use of leading or trailing decimal points in numeric literals.
    "no-floating-decimal": 0,

    // Allow comments inline after code.
    "no-inline-comments": 0,

    // Disallow use of labels for anything other then loops and switches.
    "no-labels": [2, {"allowLoop": true}],

    // Disallow use of multiline strings (use template strings instead).
    "no-multi-str": 1,

    // Disallow multiple empty lines.
    "no-multiple-empty-lines": [1, {"max": 2}],

    // Allow reassignment of function parameters.
    "no-param-reassign": 0,

    // Allow string concatenation with __dirname and __filename (not a node env).
    "no-path-concat": 0,

    // Allow use of unary operators, ++ and --.
    "no-plusplus": 0,

    // Allow using process.env (not a node environment).
    "no-process-env": 0,

    // Allow using process.exit (not a node environment).
    "no-process-exit": 0,

    // Disallow usage of __proto__ property.
    "no-proto": 2,

    // Disallow multiple spaces in a regular expression literal.
    "no-regex-spaces": 2,

    // Allow reserved words being used as object literal keys.
    "no-reserved-keys": 0,

    // Don't restrict usage of specified node modules (not a node environment).
    "no-restricted-modules": 0,

    // Disallow use of assignment in return statement. It is preferable for a
    // single line of code to have only one easily predictable effect.
    "no-return-assign": 2,

    // Don't warn about declaration of variables already declared in the outer scope.
    "no-shadow": 0,

    // Disallow shadowing of names such as arguments.
    "no-shadow-restricted-names": 2,

    // Allow use of synchronous methods (not a node environment).
    "no-sync": 0,

    // Allow the use of ternary operators.
    "no-ternary": 0,

    // Disallow throwing literals (eg. throw "error" instead of
    // throw new Error("error")).
    "no-throw-literal": 2,

    // Disallow use of undeclared variables unless mentioned in a /* global */
    // block. Note that globals from head.js are automatically imported in tests
    // by the import-headjs-globals rule form the mozilla eslint plugin.
    "no-undef": 2,

    // Allow dangling underscores in identifiers (for privates).
    "no-underscore-dangle": 0,

    // Allow use of undefined variable.
    "no-undefined": 0,

    // Disallow the use of Boolean literals in conditional expressions.
    "no-unneeded-ternary": 2,

    // We use var-only-at-top-level instead of no-var as we allow top level
    // vars.
    "no-var": 0,

    // Allow using TODO/FIXME comments.
    "no-warn-comments": 0,

    // Don't require method and property shorthand syntax for object literals.
    // We use this in the code a lot, but not consistently, and this seems more
    // like something to check at code review time.
    "object-shorthand": 0,

    // Allow more than one variable declaration per function.
    "one-var": 0,

    // Disallow padding within blocks.
    "padded-blocks": [1, "never"],

    // Prefer arrow callback over functions callbacks
    "prefer-arrow-callback": "error",

    // Don't require quotes around object literal property names.
    "quote-props": 0,

    // Double quotes should be used.
    "quotes": ["error", "double", {"avoidEscape": true, "allowTemplateLiterals": true}],

    // Require use of the second argument for parseInt().
    "radix": "error",

    // Enforce spacing after semicolons.
    "semi-spacing": [2, {"before": false, "after": true}],

    // Don't require to sort variables within the same declaration block.
    // Anyway, one-var is disabled.
    "sort-vars": 0,

    // Require a space immediately following the // in a line comment.
    "spaced-comment": [2, "always"],

    // Require "use strict" to be defined globally in the script.
    "strict": ["error", "global"],

    // Allow vars to be declared anywhere in the scope.
    "vars-on-top": 0,

    // Don't require immediate function invocation to be wrapped in parentheses.
    "wrap-iife": 0,

    // Don't require regex literals to be wrapped in parentheses (which
    // supposedly prevent them from being mistaken for division operators).
    "wrap-regex": 0,

    // Disallow Yoda conditions (where literal value comes first).
    "yoda": 2,

    // disallow use of eval()-like methods
    "no-implied-eval": 2,

    // Disallow function or variable declarations in nested blocks
    "no-inner-declarations": 2,

    // Disallow usage of __iterator__ property
    "no-iterator": 2,

    // Disallow labels that share a name with a variable
    "no-label-var": 2,

    // Disallow creating new instances of String, Number, and Boolean
    "no-new-wrappers": 2,
};

export default defineConfig([
    globalIgnores(["dev/*", "lib/*", "data/*", "build/*", "web-ext-artifacts/*"]),
    {
        files: ["**/*.mjs"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.webextensions,
            },

            ecmaVersion: "latest",
            sourceType: "module",
        },
        rules: eslintSharedRules,
    },
    {
        files: ["**/*.js"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.webextensions,
            },

            ecmaVersion: 8,
            sourceType: "script",
        },
        rules: eslintSharedRules,
    },
]);
