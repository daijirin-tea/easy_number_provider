export type SimpleJSONValue = 
    | number
    | bigint
    | string
    | SimpleJSONValue[]
    | {[K: string]: SimpleJSONValue}

export type IndentOption = {
    multiline: boolean,
    spaceAfterDelimiter: boolean,
    indent: string,
    characterBeforeEOL: string
}

export interface VisitorError {
    type: "error",
    message?: string,
    sourceLocation: SourceLocation
}

export interface CharNames {
    [K:string]: string
}

export interface SourceLocation {
  startOffset: number;
  endOffset: number;

  startLine: number;
  endLine: number;

  startColumn: number;
  endColumn: number;
}

export interface TagTemplate {
    type: string,
    value: any,
    sourceLocation?: SourceLocation,
    sourceString?: {
        [K:string]: string
    }
}

export type Tag = 
    | TagByte
    | TagShort
    | TagInt
    | TagLong
    | TagFloat
    | TagDouble
    | TagString
    | TagByteArray
    | TagIntArray
    | TagLongArray
    | TagList
    | TagCompound;

export interface TagByte extends TagTemplate {
    type: "byte",
    value: number,
    sourceString?: {
        value: string,
        signSuffix: string,
        typeSuffix: string
    }
}

export interface TagShort extends TagTemplate {
    type: "short",
    value: number,
    sourceString?: {
        value: string,
        signSuffix: string,
        typeSuffix: string
    }
}

export interface TagInt extends TagTemplate {
    type: "int",
    value: number,
    sourceString?: {
        value: string,
        signSuffix: string,
        typeSuffix: string
    }
}

export interface TagLong extends TagTemplate {
    type: "long",
    value: bigint,
    sourceString?: {
        value: string,
        signSuffix: string,
        typeSuffix: string
    }
}

export interface TagFloat extends TagTemplate {
    type: "float",
    value: number,
    sourceString?: {
        value: string,
        signSuffix: string,
        typeSuffix: string
    }
}

export interface TagDouble extends TagTemplate {
    type: "double",
    value: number,
    sourceString?: {
        value: string,
        signSuffix: string,
        typeSuffix: string
    }
}

export interface TagString extends TagTemplate {
    type: "string",
    value: string, // 解釈された後の値
    sourceString?: {
        value: string // 解釈される前の値(クオーテーションも含む)
    }
}

export interface TagByteArray extends TagTemplate {
    type: "byte_array",
    value: TagByte[]
}

export interface TagIntArray extends TagTemplate {
    type: "int_array",
    value: TagInt[]
}

export interface TagLongArray extends TagTemplate {
    type: "long_array",
    value: TagLong[]
}

export interface TagList extends TagTemplate {
    type: "list",
    value: Tag[]
}

export interface TagCompound extends TagTemplate {
    type: "compound",
    value: {
        [K: string]: {
            sourceLocation?: SourceLocation, // キーのロケーション
            tag: Tag
        }
    }
}