import { createToken, Lexer } from "chevrotain";

// 行頭、行末のスペースや\\\r?\nの処理はすでにした状態で与える必要がある
export const DoubleQuoteString = createToken({
    name: "DoubleQuoteString",
    pattern: /"([^\\"]|\\(("|'|\\|b|s|t|n|f|r|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|N\{[a-fA-F0-9\- ]*\})))*"/
});

export const SingleQuoteString = createToken({
    name: "SingleQuoteString",
    pattern: /'([^\\']|\\(("|'|\\|b|s|t|n|f|r|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|N\{[a-fA-F0-9\- ]*\})))*'/
});

export const LBrace = createToken({
    name: "LBrace",
    pattern: /\{/
});

export const RBrace = createToken({
    name: "RBrace",
    pattern: /\}/
});

export const LBracket = createToken({
    name: "LBracket",
    pattern: /\[/
});

export const RBracket = createToken({
    name: "RBracket",
    pattern: /\]/
});

export const LParen = createToken({
    name: "LParen",
    pattern: /\(/
});

export const RParen = createToken({
    name: "RParen",
    pattern: /\)/
});

export const ByteArraySign = createToken({
    name: "ByteArraySign",
    pattern: /B\s+;/
});

export const IntArraySign = createToken({
    name: "IntArraySign",
    pattern: /I\s+;/
});

export const LongArraySign = createToken({
    name: "LongArraySign",
    pattern: /L\s+;/
});

export const Colon = createToken({
    name: "Colon",
    pattern: /:/
});

export const Comma = createToken({
    name: "Comma",
    pattern: /,/
});

export const BinaryNumber = createToken({
    name: "BinaryNumber",
    pattern: /[+\-]?0b([01]|[01][01_]*[01])/
});

export const HexNumber = createToken({
    name: "HexNumber",
    pattern: /[+\-]?0x([0-9a-fA-F]|[0-9a-fA-F][0-9a-fA-F_]*[0-9a-fA-F])/
});

export const DecimalNumber = createToken({
    name: "DecimalNumber",
    pattern: /[+\-]?(([1-9][0-9_]*[0-9]|[0-9])(\.([0-9][0-9_]*[0-9]|[0-9]|))?|\.([0-9][0-9_]*[0-9]|[0-9]))([eE][+\-]?([0-9]|[1-9][0-9_]*[0-9]))?/
});

export const PlusToken = createToken({
    name: "PlusToken",
    pattern: /\+/
});

export const MinusToken = createToken({
    name: "MinusToken",
    pattern: /-/
});

export const PowToken = createToken({
    name: "PowToken",
    pattern: /\*\*/
});

export const MultiplyToken = createToken({
    name: "MultiplyToken",
    pattern: /\*/
});

export const DivideToken = createToken({
    name: "DivideToken",
    pattern: /\//
});

export const ModToken = createToken({
    name: "ModToken",
    pattern: /%/
});

export const NumericSuffix = createToken({
    name: "NumericSuffix",
    pattern: /(?<=[0-9]|0x[0-9a-fA-F]+)([fFdD]|[sSuU]?[bBsSiIlL])/
});

export const KeyIdentifier = createToken({
    name: "KeyIdentifier",
    pattern: /[0-9\-.+][a-zA-Z_0-9\-.+]*/
});

export const Identifier = createToken({
    name: "Identifier",
    pattern: /[a-zA-Z_][a-zA-Z_0-9\-.+]*/
});

export const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: Lexer.SKIPPED
});

export const allTokens = [
    DoubleQuoteString,
    SingleQuoteString,
    LBrace,
    RBrace,
    LBracket,
    RBracket,
    LParen,
    RParen,
    ByteArraySign,
    IntArraySign,
    LongArraySign,
    Colon,
    Comma,
    BinaryNumber,
    HexNumber,
    DecimalNumber,
    PlusToken,
    MinusToken,
    PowToken,
    MultiplyToken,
    DivideToken,
    ModToken,
    NumericSuffix,
    Identifier,
    KeyIdentifier,
    WhiteSpace
];
export const ExpressionLexer = new Lexer(allTokens);