interface Environment
{
	runMode : RunMode,
	isLeave : boolean
	dStack  : Stack
	rStack  : Stack
	value   : {[name: string]: number}
	constant: {[name: string]: number}
	tempDef : ColonDef
	output  : (text: string) => void
}

interface Position
{
	line: number,
	col : number
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
	Character,
	ColonDef,
	Comment,
	Constant,
	Create,
	DotComment,
	LineComment,
	Number,
	String,
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
	pos    : Position
}

enum RunMode {
	Interpret,
	Compile,
	Run
}
