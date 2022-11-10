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

const enum Kind {
	Word,
	Number,
	Unknown,
}

const enum Status {
	Ok,
	Fail,
}
