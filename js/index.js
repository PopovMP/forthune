"use strict";
// noinspection JSUnusedGlobalSymbols
class Application {
    // noinspection JSUnusedGlobalSymbols
    constructor() {
        this.OUT_BUFFER_LINES = 24;
        this.STACK_CAPACITY = 1024;
        this.interpreter = new Interpreter(this.STACK_CAPACITY, this.output.bind(this));
        this.screen = document.getElementById('screen');
        this.outputLog = document.getElementById('output-log');
        this.inputLine = document.getElementById('input-line');
        this.stackView = document.getElementById('stack-view');
        this.wordsElem = document.getElementById('dictionary');
        this.inputBuffer = [];
        this.outputBuffer = "";
        this.inputIndex = 0;
        this.inputLine.addEventListener("keydown", this.inputLine_keydown.bind(this));
        this.outputLog.innerText = '';
        this.inputLine.value = '';
        this.stackView.innerText = ' < Top';
        this.outputLog.addEventListener('click', () => this.inputLine.focus());
        this.screen.addEventListener('click', () => this.inputLine.focus());
        document.addEventListener('click', () => this.inputLine.focus());
        this.inputLine.focus();
    }
    inputLine_keydown(event) {
        if (event.code === 'Enter') {
            event.preventDefault();
            const cmdText = this.inputLine.value;
            this.inputLine.value = '';
            if (cmdText !== '' && (this.inputBuffer.length === 0 || this.inputBuffer[this.inputBuffer.length - 1] !== cmdText)) {
                this.inputBuffer.push(cmdText);
                this.inputIndex = this.inputBuffer.length - 1;
            }
            const tokens = Tokenizer.tokenizeLine(cmdText, 0);
            this.interpreter.interpret(tokens, cmdText);
            this.stackView.innerText = this.interpreter.getStack().join(' ') + ' < Top';
            return;
        }
        if (event.code === 'ArrowUp') {
            event.preventDefault();
            if (this.inputBuffer.length > 0)
                this.inputLine.value = this.inputBuffer[this.inputIndex];
            if (this.inputIndex > 0)
                this.inputIndex -= 1;
        }
        if (event.code === 'ArrowDown') {
            event.preventDefault();
            if (this.inputIndex < this.inputBuffer.length - 1) {
                this.inputIndex += 1;
                this.inputLine.value = this.inputBuffer[this.inputIndex];
            }
        }
    }
    output(text) {
        const outputText = this.outputBuffer + text;
        const outSplit = outputText.split('\n');
        while (outSplit.length > this.OUT_BUFFER_LINES)
            outSplit.shift();
        this.outputBuffer = outSplit.join('\n');
        this.outputLog.innerText = this.outputBuffer;
    }
}
var Status;
(function (Status) {
    Status[Status["Ok"] = 0] = "Ok";
    Status[Status["Fail"] = 1] = "Fail";
})(Status || (Status = {}));
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["Character"] = 0] = "Character";
    TokenKind[TokenKind["Comment"] = 1] = "Comment";
    TokenKind[TokenKind["Keyword"] = 2] = "Keyword";
    TokenKind[TokenKind["LineComment"] = 3] = "LineComment";
    TokenKind[TokenKind["Number"] = 4] = "Number";
    TokenKind[TokenKind["String"] = 5] = "String";
    TokenKind[TokenKind["Word"] = 6] = "Word";
})(TokenKind || (TokenKind = {}));
var RunMode;
(function (RunMode) {
    RunMode[RunMode["Interpret"] = 0] = "Interpret";
    RunMode[RunMode["Compile"] = 1] = "Compile";
    RunMode[RunMode["Run"] = 2] = "Run";
})(RunMode || (RunMode = {}));
class Dictionary {
}
Dictionary.CoreWord = {
    '(': 'paren',
    '*': 'start',
    '+': 'plus',
    '+LOOP': 'plus-loop',
    '-': 'minus',
    '."': 'dot-quote',
    '.': 'dot',
    '/': 'slash',
    ':': 'colon',
    ';': 'semicolon',
    '<': 'less-than',
    '=': 'equals',
    '>': 'greater-than',
    'ABS': 'abs',
    'BL': 'bl',
    'CHAR': 'char',
    'CR': 'cr',
    'DEPTH': 'depth',
    'DO': 'do',
    'DROP': 'drop',
    'DUP': 'dupe',
    'ELSE': 'else',
    'EMIT': 'emit',
    'I': 'i',
    'IF': 'if',
    'J': 'j',
    'LEAVE': 'leave',
    'LOOP': 'loop',
    'MOD': 'mod',
    'OVER': 'over',
    'ROT': 'rot',
    'SPACE': 'space',
    'SPACES': 'spaces',
    'SWAP': 'swap',
    'THEN': 'then',
    '?DUP': 'question-dupe',
};
Dictionary.CoreExtensionWord = {
    '.(': 'dot-paren',
    '<>': 'not-equals',
    '?DO': 'question-do',
};
Dictionary.ToolsWord = {
    '.S': 'dot-s',
};
Dictionary.CompileOnlyWords = [
    '.(', '."', '?DO', 'DO', 'I', 'J', 'LEAVE', 'LOOP', '+LOOP', ';', 'IF', 'ELSE', 'THEN'
];
class Interpreter {
    constructor(capacity, output) {
        this.TRUE = -1;
        this.FALSE = 0;
        this.colonDef = {};
        this.keyword = {
            // Comments
            '(': () => {
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '.(': () => {
                return this.runMode === RunMode.Interpret
                    ? { status: 1 /* Status.Fail */, value: ' No Interpretation' }
                    : { status: 0 /* Status.Ok */, value: '' };
            },
            '\\': () => {
                return { status: 0 /* Status.Ok */, value: '' };
            },
            // Char
            'BL': () => {
                // Put the ASCII code of space in Stack
                this.dStack.push(32);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'CHAR': () => {
                return { status: 0 /* Status.Ok */, value: '' };
            },
            // String
            '."': () => {
                return this.runMode === RunMode.Interpret
                    ? { status: 1 /* Status.Fail */, value: ' No Interpretation' }
                    : { status: 0 /* Status.Ok */, value: '' };
            },
            // Output
            'CR': () => {
                return { status: 0 /* Status.Ok */, value: '\n' };
            },
            'EMIT': () => {
                const charCode = this.dStack.pop();
                this.output(String.fromCharCode(charCode));
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'SPACE': () => {
                return { status: 0 /* Status.Ok */, value: ' ' };
            },
            'SPACES': () => {
                const count = this.dStack.pop();
                return { status: 0 /* Status.Ok */, value: ' '.repeat(count) };
            },
            // Numbers
            '+': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 + n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '-': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 - n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '*': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 * n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '/': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 / n2);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'ABS': () => {
                const n1 = this.dStack.pop();
                this.dStack.push(Math.abs(n1));
                return { status: 0 /* Status.Ok */, value: '' };
            },
            // Stack manipulation
            '.': () => {
                return { status: 0 /* Status.Ok */, value: this.dStack.pop().toString() };
            },
            'DEPTH': () => {
                this.dStack.push(this.dStack.depth());
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'DUP': () => {
                this.dStack.push(this.dStack.get(0));
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'OVER': () => {
                this.dStack.push(this.dStack.get(1));
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'DROP': () => {
                this.dStack.pop();
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'SWAP': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n2);
                this.dStack.push(n1);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'ROT': () => {
                const n3 = this.dStack.pop();
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n2);
                this.dStack.push(n3);
                this.dStack.push(n1);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '?DUP': () => {
                const n = this.dStack.get(0);
                if (n !== 0)
                    this.dStack.push(this.dStack.get(0));
                return { status: 0 /* Status.Ok */, value: '' };
            },
            // Comparison
            '=': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 === n2 ? this.TRUE : this.FALSE);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '<>': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 !== n2 ? this.TRUE : this.FALSE);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '>': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 > n2 ? this.TRUE : this.FALSE);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            '<': () => {
                const n2 = this.dStack.pop();
                const n1 = this.dStack.pop();
                this.dStack.push(n1 < n2 ? this.TRUE : this.FALSE);
                return { status: 0 /* Status.Ok */, value: '' };
            },
            // DO
            'I': () => {
                this.dStack.push(this.rStack.get(0));
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'J': () => {
                this.dStack.push(this.rStack.get(1));
                return { status: 0 /* Status.Ok */, value: '' };
            },
            'LEAVE': () => {
                this.isLeaveActivated = true;
                return { status: 0 /* Status.Ok */, value: '' };
            },
            // Tools
            '.S': () => {
                return { status: 0 /* Status.Ok */, value: this.getStack().join(' ') + ' < Top' };
            },
        };
        this.dStack = new Stack(capacity);
        this.rStack = new Stack(capacity);
        this.output = output;
        this.runMode = RunMode.Interpret;
        this.isLeaveActivated = false;
        this.tempColonDef = { name: '', tokens: [] };
    }
    interpret(tokens, lineText) {
        let outText = '';
        try {
            for (let i = 0; i < tokens.length; i += 1) {
                const token = tokens[i];
                if (this.runMode === RunMode.Interpret) {
                    switch (token.kind) {
                        case TokenKind.Number:
                            this.dStack.push(parseInt(token.value));
                            break;
                        case TokenKind.Character:
                            this.dStack.push(token.value.charCodeAt(0));
                            break;
                        case TokenKind.Comment:
                        case TokenKind.LineComment:
                        case TokenKind.String:
                            break;
                        case TokenKind.Keyword: {
                            const wordName = token.value.toUpperCase();
                            if (wordName === ':') {
                                if (i === tokens.length - 1 ||
                                    tokens[i + 1].kind !== TokenKind.Word ||
                                    tokens[i + 1].value === ';') {
                                    this.die(lineText, token.value + ' Empty definition name');
                                    return;
                                }
                                this.tempColonDef = {
                                    name: tokens[i + 1].value.toUpperCase(),
                                    tokens: []
                                };
                                i += 1; // Eat def name
                                this.runMode = RunMode.Compile;
                                continue;
                            }
                            if (Dictionary.CompileOnlyWords.includes(wordName)) {
                                this.die(lineText, token.value + ' No Interpretation');
                                return;
                            }
                            if (!this.keyword.hasOwnProperty(wordName)) {
                                this.die(lineText, token.value + ' Unknown keyword');
                                return;
                            }
                            const res = this.keyword[wordName]();
                            outText += res.value;
                            if (res.status === 1 /* Status.Fail */) {
                                this.die(lineText, outText);
                                return;
                            }
                            break;
                        }
                        case TokenKind.Word: {
                            const wordName = token.value.toUpperCase();
                            if (!this.colonDef.hasOwnProperty(wordName)) {
                                this.die(lineText, token.value + ' Unknown word');
                                return;
                            }
                            this.runMode = RunMode.Run;
                            const res = this.runTokens(this.colonDef[wordName].tokens);
                            this.runMode = RunMode.Interpret;
                            outText += res.value;
                            if (res.status === 1 /* Status.Fail */) {
                                this.die(lineText, outText);
                                return;
                            }
                            break;
                        }
                        default:
                            this.die(lineText, token.value + ' Unknown word');
                            return;
                    }
                }
                else if (this.runMode === RunMode.Compile) {
                    if (token.value === ':') {
                        this.die(lineText, token.value + ' Nested definition');
                        return;
                    }
                    if (token.value === ';') {
                        this.colonDef[this.tempColonDef.name] = {
                            name: this.tempColonDef.name,
                            tokens: this.tempColonDef.tokens.slice()
                        };
                        this.tempColonDef = { name: '', tokens: [] };
                        this.runMode = RunMode.Interpret;
                        continue;
                    }
                    if (token.kind === TokenKind.Comment &&
                        i > 0 && tokens[i - 1].value === '.(') {
                        outText += token.value;
                        continue;
                    }
                    if (token.kind === TokenKind.LineComment ||
                        token.kind === TokenKind.Comment) {
                        continue;
                    }
                    this.tempColonDef.tokens.push(token);
                }
                else if (this.runMode === RunMode.Run) {
                    this.die(lineText, token.value + ' You should not be in Run mode here');
                    return;
                }
            }
        }
        catch (e) {
            this.die(lineText, e.message);
            return;
        }
        if (this.runMode === RunMode.Interpret)
            this.output(`${lineText} ${outText === '' ? '' : outText + ' '} ok\n`);
        else
            this.output(`${lineText} ${outText === '' ? '' : outText + ' '} compiling\n`);
    }
    getStack() {
        const depth = this.dStack.depth();
        const stack = Array(depth);
        for (let i = 0; i < depth; i += 1)
            stack[depth - i] = this.dStack.get(i);
        return stack;
    }
    runTokens(tokens) {
        let outText = '';
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            switch (token.kind) {
                case TokenKind.Number:
                    this.dStack.push(parseInt(token.value));
                    break;
                case TokenKind.Comment:
                case TokenKind.LineComment:
                    break;
                case TokenKind.Character:
                    this.dStack.push(token.value.charCodeAt(0));
                    break;
                case TokenKind.String:
                    outText += token.value;
                    break;
                case TokenKind.Keyword: {
                    const wordName = token.value.toUpperCase();
                    if (this.isLeaveActivated)
                        break;
                    if (wordName === 'IF') {
                        let thenIndex = i + 1;
                        let ifDepth = 1;
                        while (true) {
                            thenIndex += 1;
                            if (thenIndex === tokens.length)
                                return { status: 1 /* Status.Fail */, value: ' THEN not found' };
                            const loopWord = tokens[thenIndex].value.toUpperCase();
                            if (loopWord === 'IF')
                                ifDepth += 1;
                            if (loopWord === 'THEN')
                                ifDepth -= 1;
                            if (ifDepth === 0)
                                break;
                        }
                        let elseIndex = i + 1;
                        ifDepth = 1;
                        while (elseIndex < thenIndex) {
                            elseIndex += 1;
                            const loopWord = tokens[elseIndex].value.toUpperCase();
                            if (loopWord === 'IF')
                                ifDepth += 1;
                            if (loopWord === 'THEN')
                                ifDepth -= 1;
                            if (ifDepth === 1 && loopWord === 'ELSE')
                                break;
                        }
                        const flag = this.dStack.pop();
                        if (flag === 0) {
                            if (elseIndex < thenIndex) {
                                const res = this.runTokens(tokens.slice(elseIndex + 1, thenIndex));
                                outText += res.value;
                                if (res.status === 1 /* Status.Fail */)
                                    return { status: 1 /* Status.Fail */, value: outText };
                            }
                            i = thenIndex + 1;
                            continue;
                        }
                        else {
                            const res = this.runTokens(tokens.slice(i + 1, elseIndex));
                            outText += res.value;
                            if (res.status === 1 /* Status.Fail */)
                                return { status: 1 /* Status.Fail */, value: outText };
                            i = thenIndex + 1;
                            continue;
                        }
                    }
                    if (wordName === 'DO' || wordName === '?DO') {
                        const isQuestionDup = wordName === '?DO';
                        let loopIndex = i + 1;
                        let doDepth = 1;
                        while (true) {
                            loopIndex += 1;
                            if (loopIndex === tokens.length)
                                return { status: 1 /* Status.Fail */, value: ' LOOP not found' };
                            const loopWord = tokens[loopIndex].value.toUpperCase();
                            if (loopWord === 'DO')
                                doDepth += 1;
                            if (loopWord === 'LOOP' || loopWord === '+LOOP')
                                doDepth -= 1;
                            if (doDepth === 0)
                                break;
                        }
                        const isPlusLoop = tokens[loopIndex].value.toUpperCase() === '+LOOP';
                        let counter = this.dStack.pop();
                        const limit = this.dStack.pop();
                        const upwards = limit > counter;
                        if (isQuestionDup && counter === limit) {
                            i = loopIndex;
                            this.isLeaveActivated = false;
                            continue;
                        }
                        if (!isPlusLoop && !upwards)
                            return { status: 1 /* Status.Fail */, value: ' LOOP wrong range' };
                        while (upwards ? counter < limit : counter >= limit) {
                            this.rStack.push(counter);
                            const res = this.runTokens(tokens.slice(i + 1, loopIndex));
                            this.rStack.pop();
                            if (this.isLeaveActivated)
                                break;
                            outText += res.value;
                            if (res.status === 1 /* Status.Fail */)
                                return { status: 1 /* Status.Fail */, value: outText };
                            counter += isPlusLoop ? this.dStack.pop() : 1;
                        }
                        i = loopIndex;
                        this.isLeaveActivated = false;
                        continue;
                    }
                    if (!this.keyword.hasOwnProperty(wordName))
                        return { status: 1 /* Status.Fail */, value: token.value + ' Unknown keyword' };
                    const res = this.keyword[wordName]();
                    outText += res.value;
                    if (res.status === 1 /* Status.Fail */)
                        return { status: 1 /* Status.Fail */, value: outText };
                    break;
                }
                case TokenKind.Word: {
                    const wordName = token.value.toUpperCase();
                    if (!this.colonDef.hasOwnProperty(wordName))
                        return { status: 1 /* Status.Fail */, value: token.value + ' Unknown word' };
                    const res = this.runTokens(this.colonDef[wordName].tokens);
                    outText += res.value;
                    if (res.status === 1 /* Status.Fail */)
                        return { status: 1 /* Status.Fail */, value: outText };
                    break;
                }
                default:
                    throw new Error('Interpreter: Unreachable');
            }
        }
        return { status: 0 /* Status.Ok */, value: outText };
    }
    die(lineText, message) {
        this.dStack.clear();
        this.rStack.clear();
        this.output(`${lineText} ${message}\n`);
        this.runMode = RunMode.Interpret;
        this.isLeaveActivated = false;
    }
}
class Stack {
    constructor(capacity) {
        this.holder = new Array(capacity);
        this.capacity = capacity;
        this.index = 0;
    }
    depth() {
        return this.index;
    }
    push(n) {
        if (this.index >= this.capacity)
            throw new Error('Stack overflow');
        this.holder[this.index] = n;
        this.index += 1;
    }
    pop() {
        if (this.index <= 0)
            throw new Error('Stack underflow');
        this.index -= 1;
        return this.holder[this.index];
    }
    get(i) {
        const index = this.index - i - 1;
        if (index < 0 || index >= this.index)
            throw new Error('Stack out of range');
        return this.holder[index];
    }
    set(i, n) {
        const index = this.index - i - 1;
        if (index < 0 || index >= this.index)
            throw new Error('Stack out of range');
        this.holder[index] = n;
    }
    clear() {
        this.index = 0;
    }
}
class Tokenizer {
    static tokenizeLine(codeLine, lineNum) {
        const keywords = [
            ...Object.keys(Dictionary.CoreWord),
            ...Object.keys(Dictionary.CoreExtensionWord),
            ...Object.keys(Dictionary.ToolsWord),
        ];
        const tokens = [];
        let fromIndex = 0;
        let prevWord = '';
        while (fromIndex < codeLine.length) {
            const ch0 = codeLine[fromIndex];
            // Eat leading spaces
            if (prevWord !== '."' && (ch0 === ' ' || ch0 === '\t')) {
                fromIndex += 1;
                continue;
            }
            let toIndex = fromIndex;
            // Immediate words
            switch (prevWord.toUpperCase()) {
                case '\\': // Eat line comment delimited by <newline>
                    while (toIndex < codeLine.length)
                        toIndex += 1;
                    break;
                case '(':
                case '.(': // Eat comment delimited by <paren>
                    while (codeLine[toIndex] !== ')' && toIndex < codeLine.length)
                        toIndex += 1;
                    break;
                case '."': // Eat string delimited by <comma>
                    while (codeLine[toIndex] !== '"' && toIndex < codeLine.length)
                        toIndex += 1;
                    break;
                case 'CHAR': // Eat character delimited by <space>
                    while (codeLine[toIndex] !== ' ' && codeLine[toIndex] !== '\t' && toIndex < codeLine.length)
                        toIndex += 1;
                    break;
                default: // Eat word delimited by <space>
                    while (codeLine[toIndex] !== ' ' && codeLine[toIndex] !== '\t' && toIndex < codeLine.length)
                        toIndex += 1;
                    break;
            }
            const pos = { line: lineNum, col: fromIndex };
            const currentWord = codeLine.slice(fromIndex, toIndex);
            fromIndex = toIndex + 1;
            switch (prevWord.toUpperCase()) {
                case '\\': // Line comment
                    tokens.push({ kind: TokenKind.LineComment, value: currentWord, pos });
                    break;
                case '(': // Comment
                case '.(':
                    tokens.push({ kind: TokenKind.Comment, value: currentWord, pos });
                    break;
                case '."': // String
                    tokens.push({ kind: TokenKind.String, value: currentWord, pos });
                    break;
                case 'CHAR': // Character
                    tokens.push({ kind: TokenKind.Character, value: currentWord, pos });
                    break;
                default:
                    if (keywords.includes(currentWord.toUpperCase())) // Known word
                        tokens.push({ kind: TokenKind.Keyword, value: currentWord, pos });
                    else if (currentWord.match(/^[+-]?\d+$/)) // Number
                        tokens.push({ kind: TokenKind.Number, value: currentWord, pos });
                    else // Unknown word
                        tokens.push({ kind: TokenKind.Word, value: currentWord, pos });
                    break;
            }
            prevWord = currentWord;
        }
        return tokens;
    }
    static stringify(tokens) {
        return tokens.map((token) => {
            switch (token.kind) {
                case TokenKind.Comment: return token.value + ')';
                case TokenKind.String: return token.value + '"';
                default: return token.value;
            }
        }).join(' ');
    }
}
module.exports = {
    Tokenizer
};
//# sourceMappingURL=index.js.map