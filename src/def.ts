interface Environment
{
	inputBuffer : string
	outputBuffer: string
	runMode     : RunMode
	isLeave     : boolean
	dStack      : Stack
	rStack      : Stack
	memory      : Memory,
	tempDef     : ColonDef
}

interface ExecResult
{
	status   : Status
	message  : string
	newIndex?: number
}

interface ColonDef
{
	name  : string
	tokens: Token[]
}

const enum Status {
	Ok,
	Fail,
}

enum TokenKind {
	Backslash,
	BracketChar,
	CQuote,
	Character,
	ColonDef,
	Constant,
	Create,
	DotParen,
	DotQuote,
	Number,
	Paren,
	SQuote,
	Tick,
	Value,
	ValueTo,
	Variable,
	Word,
}

interface TokenGrammar {
	kind     : TokenKind,
	delimiter: string,
	trimStart: boolean,
	strict   : boolean, // true - requires closing with delimiter
	empty    : boolean,
}

interface Token {
	kind   : TokenKind,
	error  : string,
	value  : string,
	word   : string, // message.toUppercase()
	content: string, // string content or definition / variable name
	number : number
}

enum RunMode {
	Interpret,
	Compile,
	Run,
}

enum RunTimeSemantics {
	BuiltInWord,
	ColonDef,
	Constant,
	DataAddress,
	Value,
	Variable,
}
