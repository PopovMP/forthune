interface Environment
{
	inputBuffer : string
	outputBuffer: string
	runMode     : RunMode
	isLeave     : boolean
	dStack      : Stack
	rStack      : Stack
	cString     : Uint8Array
	cs          : number // The first free cell of cString
	value       : {[name: string]: number}
	constant    : {[name: string]: number}
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
}

enum RunMode {
	Interpret,
	Compile,
	Run
}
