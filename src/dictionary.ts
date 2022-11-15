class Dictionary
{
	public static readonly CoreWord: {[word: string]: string} = {
		'('     : 'paren',
		'*'     : 'start',
		'+'     : 'plus',
		'+LOOP' : 'plus-loop',
		'-'     : 'minus',
		'."'    : 'dot-quote',
		'.'     : 'dot',
		'/'     : 'slash',
		':'     : 'colon',
		';'     : 'semicolon',
		'<'     : 'less-than',
		'='     : 'equals',
		'>'     : 'greater-than',
		'ABS'   : 'abs',
		'CR'    : 'cr',
		'DEPTH' : 'depth',
		'DO'    : 'do',
		'DROP'  : 'drop',
		'DUP'   : 'dup',
		'ELSE'  : 'else',
		'EMIT'  : 'emit',
		'I'     : 'i',
		'IF'    : 'if',
		'J'     : 'j',
		'LEAVE' : 'leave',
		'LOOP'  : 'loop',
		'MOD'   : 'mod',
		'OVER'  : 'over',
		'ROT'   : 'rot',
		'SPACE' : 'space',
		'SPACES': 'spaces',
		'SWAP'  : 'swap',
		'THEN'  : 'then',
	}

	public static readonly CoreExtensionWord: {[word: string]: string} = {
		'.('   : 'dot-paren',
		'<>'   : 'not-equals',
	}

	public static readonly ToolsWord: {[word: string]: string} = {
		'.S'   : 'dot-s',
	}

	public static readonly CompileOnlyWords = [
		'.(', '."', 'DO', 'I', 'J', 'LEAVE', 'LOOP', '+LOOP', ';', 'IF', 'ELSE', 'THEN'
	]
}
