import "./style.css";
import { convertExpression } from "./Expression/convert";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main class="shell">
    <section class="intro">
      <h1>Expression -> NBT</h1>
    </section>
    <section class="description">
      <p>演算子: <span class="code-block">**</span>, <span class="code-block">%</span>, <span class="code-block">*</span>, <span class="code-block">/</span>, <span class="code-block">+</span>, <span class="code-block">-</span></p>
      <p>値: compound直書きか数値型。数値型は接尾辞を付けないとintやdoubleとして解釈される</p>
      <p>関数: 
        <span class="code-block">abs(nbt)</span>, 
        <span class="code-block">avg(...nbt[])</span>, 
        <span class="code-block">max(...nbt[])</span>, 
        <span class="code-block">min(...nbt[])</span>, 
        <span class="code-block">negate(nbt)</span>, 
        <span class="code-block">storage(nbt, nbt)</span>, 
        <span class="code-block">score(nbt, nbt)</span>, 
        <span class="code-block">cos(nbt)</span>, 
        <span class="code-block">floor(nbt)</span>, 
        <span class="code-block">length(nbt)</span>, 
        <span class="code-block">round(nbt)</span>, 
        <span class="code-block">sin(nbt)</span>, 
        <span class="code-block">sqrt(nbt)</span>, 
        <span class="code-block">truncate(nbt)</span>
      </p>
      <p> ストレージは<span class="code-block">(storage, path)</span>、スコアは<span class="code-block">(name, score)</span>。<span class="code-block">name</span>は<span class="code-block">@s</span>のような形式なので注意</p>
    </section>
    <section class="workspace" aria-label="Expression converter">
      <div class="panel input-panel">
        <div class="panel-head"><label for="expression">入力式</label><span class="hint">EXPRESSION</span></div>
        <textarea id="expression" spellcheck="false" aria-label="入力式">1 + 2 - 3 + 4</textarea>
        <div class="controls">
          <label class="option"><input id="multiline" type="checkbox" checked> 複数行</label>
          <label class="option"><input id="space-after-delimiter" type="checkbox" checked> 区切り文字の後に空白</label>
          <label class="field-label" for="indent">インデント
            <input id="indent" type="text" value="    " aria-describedby="indent-help">
            <span id="indent-help" class="help">スペースやタブを入力</span>
          </label>
          <label class="field-label" for="before-eol">改行前の文字
            <input id="before-eol" type="text" value="\\" placeholder="例: \\">
          </label>
          <button id="convert" class="convert-button" type="button">NBT に変換 <span>↗</span></button>
        </div>
      </div>
      <div class="panel output-panel">
        <div class="panel-head"><label for="output">変換結果</label><div class="output-meta"><span class="hint">NBT</span><button id="copy" class="copy-button" type="button" disabled>コピー</button></div></div>
        <pre id="output" aria-live="polite">ここに変換結果が表示されます</pre>
        <div id="status" class="status" role="status">式を入力して変換してください</div>
      </div>
    </section>
  </main>
`;

const expression = document.querySelector<HTMLTextAreaElement>("#expression")!;
const output = document.querySelector<HTMLElement>("#output")!;
const status = document.querySelector<HTMLElement>("#status")!;
const convertButton = document.querySelector<HTMLButtonElement>("#convert")!;
const copyButton = document.querySelector<HTMLButtonElement>("#copy")!;
const multiline = document.querySelector<HTMLInputElement>("#multiline")!;
const spaceAfterDelimiter = document.querySelector<HTMLInputElement>("#space-after-delimiter")!;
const indent = document.querySelector<HTMLInputElement>("#indent")!;
const beforeEOL = document.querySelector<HTMLInputElement>("#before-eol")!;

function convert() {
  const result = convertExpression(expression.value, {
    multiline: multiline.checked,
    spaceAfterDelimiter: spaceAfterDelimiter.checked,
    indent: indent.value.replace(/\\t/g, "\t"),
    characterBeforeEOL: beforeEOL.value,
  });
  if (result.errors.length) {
    output.textContent = "";
    status.className = "status error";
    status.textContent = result.errors.map(({ message, sourceLocation }) =>
      `${sourceLocation.startLine}:${sourceLocation.startColumn} ${message ?? "変換できませんでした"}`,
    ).join("\n");
    copyButton.disabled = true;
    return;
  }
  output.textContent = result.output ?? "";
  status.className = "status success";
  status.textContent = "変換しました";
  copyButton.disabled = false;
}

convertButton.addEventListener("click", convert);
expression.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") convert();
});
copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(output.textContent ?? "");
    status.className = "status success";
    status.textContent = "クリップボードにコピーしました";
  } catch {
    status.className = "status error";
    status.textContent = "コピーできませんでした。結果を選択してコピーしてください。";
  }
});
multiline.addEventListener("change", convert);
spaceAfterDelimiter.addEventListener("change", convert);
indent.addEventListener("input", convert);
beforeEOL.addEventListener("input", convert);
convert();
