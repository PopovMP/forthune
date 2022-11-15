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
	LineComment,
	Comment,
	String,
	Keyword,
	Number,
	Word,
}

enum RunMode {
	Interpret,
	Compile,
	Run
}
