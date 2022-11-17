interface Environment
{
	runMode: RunMode,
	isLeave: boolean
	dStack : Stack
	rStack : Stack
	value  : {[name: string]: number}
	tempDef: ColonDef
	output : (text: string) => void
}

interface Position
{
	line: number,
	col : number
}

interface Token
{
	kind : TokenKind
	value: string
	pos  : Position
}

interface ExecResult
{
	status: Status
	value : string
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
	Comment,
	LineComment,
	Number,
	String,
	Word,
	Value,
}

enum RunMode {
	Interpret,
	Compile,
	Run
}
