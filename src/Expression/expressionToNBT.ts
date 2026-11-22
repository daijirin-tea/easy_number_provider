import { javaDoubleToString, javaFloatToString } from "./floatStringify";
import type { IndentOption, Tag } from "./types";

function quoteString(string: string): string {
    let quotation = '"';

        const firstQuotationInString = string.match(/'|"/);
        if (firstQuotationInString) {
            if (firstQuotationInString[0] === '"') {
                quotation = "'";
            }
        }

        const escapedString = string
            .split('')
            .map((char): string=>{
                const charCode = char.charCodeAt(0);

                if (char === '\\') {
                    return '\\\\';
                } else if (char === quotation) {
                    return `\\${quotation}`;
                } else if (char === '\b') {
                    return '\\b';
                } else if (char === '\t') {
                    return '\\t';
                } else if (char === '\n') {
                    return '\\n';
                } else if (char === '\f') {
                    return '\\f';
                } else if (char === '\r') {
                    return '\\r';
                } else if (0x00 <= charCode && charCode <= 0x1F) {
                    return `\\x${charCode.toString(16).padStart(2,'0').toUpperCase()}`;
                } else {
                    return char;
                }
            })
            .join('');

        return `${quotation}${escapedString}${quotation}`;
}

function getObjectEntries<T extends keyof object, V>(object: Record<T, V>): [T, V][] {
    let entries: [T, V][] = [];
    for (const e in object) {
        entries.push([e, object[e]]);
    }

    return entries;
}

export function expressionToNBT(tag: Tag, indentOption: IndentOption): string {
    switch (tag.type) {
        case "byte":
            return `${tag.value}b`;
        case "short":
            return `${tag.value}s`;
        case "long":
            return `${tag.value}L`;
        case "int":
            return `${tag.value}`;
        case "float":
            return `${javaFloatToString(tag.value)}f`;
        case "double":
            return `${javaDoubleToString(tag.value)}d`;
        case "string":
            return quoteString(tag.value);
        case "byte_array":
            return `[B;${
                indentOption.spaceAfterDelimiter ? " " : ""
            }${
                tag.value
                    .map((e)=>`${indentOption.multiline ? indentOption.indent : ""}${e.value}b`)
                    .join(`,${
                            indentOption.multiline
                                ? indentOption.characterBeforeEOL + "\n"
                            : indentOption.spaceAfterDelimiter
                                ? " "
                                : ""
                    }`)
            }]`;
        case "int_array":
            return `[I;${
                indentOption.spaceAfterDelimiter ? " " : ""
            }${
                tag.value
                    .map((e)=>`${indentOption.multiline ? indentOption.indent : ""}${e.value}`)
                    .join(`,${
                            indentOption.multiline
                                ? indentOption.characterBeforeEOL + "\n"
                            : indentOption.spaceAfterDelimiter
                                ? " "
                                : ""
                    }`)
            }]`;
        case "long_array":
            return `[L;${
                indentOption.spaceAfterDelimiter ? " " : ""
            }${
                tag.value
                    .map((e)=>`${indentOption.multiline ? indentOption.indent : ""}${e.value}L`)
                    .join(`,${
                            indentOption.multiline
                                ? indentOption.characterBeforeEOL + "\n"
                            : indentOption.spaceAfterDelimiter
                                ? " "
                                : ""
                    }`)
            }]`;
        case "list":
            return `[${indentOption.multiline ? indentOption.characterBeforeEOL + "\n" : ""}${
                tag.value
                    .map((e): string=>`${
                        expressionToNBT(e, indentOption)
                            .split(/\r?\n/)
                            .map((e)=>(indentOption.multiline ? indentOption.indent : "") + e)
                            .join("\n")
                    }`)
                    .join(`,${
                            indentOption.multiline
                                ? indentOption.characterBeforeEOL + "\n"
                            : indentOption.spaceAfterDelimiter
                                ? " "
                                : ""
                    }`)
            }${indentOption.multiline ? indentOption.characterBeforeEOL + "\n" : ""}]`;
        case "compound":
            return `{${indentOption.multiline ? indentOption.characterBeforeEOL + "\n" : ""}${
                getObjectEntries(tag.value)
                    .map((e): string=>`${
                        indentOption.multiline ? indentOption.indent : ""
                    }${
                        /^[a-zA-Z0-9+\-._]+$/.test(e[0])
                            ? e[0]
                            : quoteString(e[0])
                    }:${
                        indentOption.spaceAfterDelimiter ? " " : ""
                    }${
                        expressionToNBT(e[1].tag, indentOption)
                            .split(/\r?\n/)
                            .map((e)=>(indentOption.multiline ? indentOption.indent : "") + e)
                            .join("\n")
                            .replace( indentOption.multiline ? indentOption.indent : "", "")
                    }`)
                    .join(`,${
                            indentOption.multiline
                                ? indentOption.characterBeforeEOL + "\n"
                            : indentOption.spaceAfterDelimiter
                                ? " "
                                : ""
                    }`)
            }${indentOption.multiline ? indentOption.characterBeforeEOL + "\n" : ""}}`;
    }
}
