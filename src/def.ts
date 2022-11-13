interface Command
{
	kind : Kind
	value: string|number
	see  : string
}

interface ExecResult
{
	status: Status
	value : string
}

interface ColonDef
{
	name     : string
	comment  : string
	loopCode : string[][]
}

const enum Kind {
	Word,
	Number,
	ColonDef,
	Unknown,
}

const enum Status {
	Ok,
	Fail,
}
