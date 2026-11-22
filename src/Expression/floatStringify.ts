/**
 * Java Float.toString() / Double.toString() に近い形式へ変換
 */

/** JS Number (Java double 相当) */
export function javaDoubleToString(value: number): string {
  return formatJavaFloatingPoint(value);
}

/** Java float (32bit) 相当 */
export function javaFloatToString(value: number): string {
  const f = Math.fround(value);

  if (!Number.isFinite(f)) return formatJavaFloatingPoint(f);
  if (Object.is(f, -0)) return "-0.0";

  // floatとして元の値を再現できる最短桁数を探す (最大9桁)
  let shortest = f.toString();

  for (let precision = 1; precision <= 9; precision++) {
    const candidate = f.toPrecision(precision);
    if (Math.fround(Number(candidate)) === f) {
      shortest = candidate;
      break;
    }
  }

  return formatJavaFloatingPoint(Number(shortest));
}

function formatJavaFloatingPoint(value: number): string {
  if (Number.isNaN(value)) return "NaN";
  if (value === Infinity) return "Infinity";
  if (value === -Infinity) return "-Infinity";
  if (Object.is(value, -0)) return "-0.0";

  const negative = value < 0;
  const abs = Math.abs(value);

  // Number.toString() の表現を仮取得
  const raw = abs.toString().toLowerCase();

  let mantissa: string;
  let exponentPart = 0;

  if (raw.includes("e")) {
    const parts = raw.split("e");
    mantissa = parts[0];
    exponentPart = Number(parts[1]);
  } else {
    mantissa = raw;
  }

  // 小数点位置
  const dotIndex = mantissa.indexOf(".");
  const decimalPosition =
    dotIndex === -1 ? mantissa.length : dotIndex;

  const digits = mantissa.replace(".", "");

  // 先頭ゼロを除去し、指数を調整
  const firstNonZero = digits.search(/[1-9]/);
  if (firstNonZero === -1) return negative ? "-0.0" : "0.0";

  const leadingZeros = firstNonZero;
  let significant = digits.slice(leadingZeros);

  let exp =
    decimalPosition + exponentPart - leadingZeros - 1;

  // 末尾の不要なゼロを除去
  significant = significant.replace(/0+$/, "");

  if (significant.length === 0) significant = "0";

  // Javaの指数表記の範囲
  // plain: 1e-3 ～ 1e7 未満
  // scientific: 1e-3 未満、1e7 以上
  const useScientific = exp < -3 || exp >= 7;

  let result: string;

  if (useScientific) {
    const fraction = significant.slice(1) || "0";
    result = `${significant[0]}.${fraction}E${exp}`;
  } else {
    const decimalIndex = exp + 1;

    if (decimalIndex >= significant.length) {
      result =
        significant +
        "0".repeat(decimalIndex - significant.length) +
        ".0";
    } else if (decimalIndex <= 0) {
      result =
        "0." +
        "0".repeat(-decimalIndex) +
        significant;
    } else {
      result =
        significant.slice(0, decimalIndex) +
        "." +
        significant.slice(decimalIndex);
    }
  }

  return negative ? "-" + result : result;
}