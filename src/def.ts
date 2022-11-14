interface Token
{
	kind : TokenKind
	value: string
}

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

enum TokenKind {
	LineComment,
	Comment,
	Word,
	Keyword,
	Number,
	String,
}

const CoreWord = {
	'('    : 'paren',
	'*'    : 'start',
	'+'    : 'plus',
	'+LOOP': 'plus-loop',
	'-'    : 'minus',
	'.'    : 'dot',
	'."'   : 'dot-quote',
	'/'    : 'slash',
	':'    : 'colon',
	';'    : 'semicolon',
	'<'    : 'less-than',
	'='    : 'equals',
	'>'    : 'greater-than',
	'ABS'  : 'abs',
	'DEPTH': 'depth',
	'IF'   : 'if',
	'THEN' : 'then',
	'ELSE' : 'else',
	'DO'   : 'do',
	'DROP' : 'drop',
	'DUP'  : 'dup',
	'I'    : 'i',
	'J'    : 'j',
	'LOOP' : 'loop',
	'MOD'  : 'mod',
	'OVER' : 'over',
	'ROT'  : 'rot',
	'SWAP' : 'swap',
}

const CoreExtensionWord = {
	'.('   : 'dot-paren',
	'<>'   : 'not-equals',
}

const ToolsWord = {
	'.S'   : 'dot-s',
}
