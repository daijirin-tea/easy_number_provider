import { ExpressionParser } from "./parser";
import { ExpressionLexer } from "./tokens";
import { interpretVisitor } from "./visitor";
import { expressionToNBT } from "./expressionToNBT";
import type { IndentOption, SourceLocation, Tag, VisitorError } from "./types";

const parser = new ExpressionParser();

export interface ConversionResult {
  output?: string;
  errors: VisitorError[];
}

export function convertExpression(input: string, indentOption: IndentOption): ConversionResult {
  const lexResult = ExpressionLexer.tokenize(input);
  const errors: VisitorError[] = lexResult.errors.map((error) => ({
    type: "error",
    message: error.message,
    sourceLocation: {
      startOffset: error.offset,
      endOffset: error.offset + 1,
      startLine: error.line ?? 1,
      endLine: error.line ?? 1,
      startColumn: error.column ?? 1,
      endColumn: (error.column ?? 1) + 1,
    },
  }));
  if (errors.length) return { errors };

  parser.input = lexResult.tokens;
  const cst = parser.expression();
  if (parser.errors.length) {
    return {
      errors: parser.errors.map((error) => {
        const token = error.token;
        const location: SourceLocation = {
          startOffset: token.startOffset ?? input.length,
          endOffset: token.endOffset ?? input.length,
          startLine: token.startLine ?? 1,
          endLine: token.endLine ?? token.startLine ?? 1,
          startColumn: token.startColumn ?? input.length + 1,
          endColumn: token.endColumn ?? token.startColumn ?? input.length + 1,
        };
        return { type: "error", message: error.message, sourceLocation: location };
      }),
    };
  }

  const result = interpretVisitor.initialExpression(cst);
  if (result.errors.length) return { errors: result.errors };
  return { output: expressionToNBT(result.tag as Tag, indentOption), errors: [] };
}
