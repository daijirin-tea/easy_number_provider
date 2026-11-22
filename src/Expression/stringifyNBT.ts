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

export function stringifyNBT(tag: Tag, indentOption: IndentOption): string {
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
                indentOption.multiline
                    ? tag.value.length > 0
                        ? indentOption.characterBeforeEOL + "\n"
                        : ""
                : indentOption.spaceAfterDelimiter
                    ? " "
                    : ""
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
            }${
                indentOption.multiline ? indentOption.characterBeforeEOL + "\n" : ""
            }]`;
        case "int_array":
            return `[I;${
                indentOption.multiline
                    ? tag.value.length > 0
                        ? indentOption.characterBeforeEOL + "\n"
                        : ""
                : indentOption.spaceAfterDelimiter
                    ? " "
                    : ""
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
            }${
                indentOption.multiline ? indentOption.characterBeforeEOL + "\n" : ""
            }]`;
        case "long_array":
            return `[L;${
                indentOption.multiline
                    ? tag.value.length > 0
                        ? indentOption.characterBeforeEOL + "\n"
                        : ""
                : indentOption.spaceAfterDelimiter
                    ? " "
                    : ""
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
            }${
                indentOption.multiline ? indentOption.characterBeforeEOL + "\n" : ""
            }]`;
        case "list":
            return `[${indentOption.multiline && tag.value.length > 0 ? indentOption.characterBeforeEOL + "\n" : ""}${
                tag.value
                    .map((e): string=>`${
                        stringifyNBT(e, indentOption)
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
            return `{${indentOption.multiline && getObjectEntries(tag.value).length > 0 ? indentOption.characterBeforeEOL + "\n" : ""}${
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
                        stringifyNBT(e[1].tag, indentOption)
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

export function NBTToJSON(tag: Tag, indentOption: IndentOption): string {
    const lineEnding = `\n`;
    switch (tag.type) {
        case "byte":
        case "short":
        case "int":
        case "long":
        case "float":
        case "double":
            return tag.value.toString();
        case "byte_array":
        case "int_array":
        case "long_array":
        case "list":
            return `[${
                indentOption.multiline && tag.value.length > 0 ? lineEnding : ""
            }${
                tag.value
                    .map((e)=>`${
                        NBTToJSON(e, indentOption)
                            .split(/\r?\n/)
                            .map((f)=>(indentOption.multiline ? indentOption.indent : "") + f)
                            .join("\n")
                    }`
                    )
                    .join(`,${
                        indentOption.multiline
                            ? lineEnding
                        : indentOption.spaceAfterDelimiter
                            ? " "
                        : ""
                    }`)
            }${
                indentOption.multiline ? lineEnding : ""
            }]`;
        case "string":
            return JSON.stringify(tag.value);
        case "compound":
            return `{${
                indentOption.multiline && getObjectEntries(tag.value).length > 0 ? lineEnding : ""
            }${
                getObjectEntries(tag.value)
                    .map((e)=>`${
                        indentOption.multiline ? indentOption.indent : ""
                    }${
                        JSON.stringify(e[0])
                    }:${
                        indentOption.spaceAfterDelimiter ? " " : ""
                    }${
                        NBTToJSON(e[1].tag, indentOption)
                            .split(/\r?\n/)
                            .map((f)=>(indentOption.multiline ? indentOption.indent : "") + f)
                            .join("\n")
                            .replace( indentOption.multiline ? indentOption.indent : "", "")
                    }`)
                    .join(`,${
                        indentOption.multiline
                            ? lineEnding
                        : indentOption.spaceAfterDelimiter
                            ? " "
                        : ""
                    }`)
            }${
                indentOption.multiline ? lineEnding : ""
            }}`;
    }
}
