class Dictionary
{
	public static readonly CoreWord: {[word: string]: string} = {
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

	public static readonly CoreExtensionWord: {[word: string]: string} = {
		'.('   : 'dot-paren',
		'<>'   : 'not-equals',
	}

	public static readonly ToolsWord: {[word: string]: string} = {
		'.S'   : 'dot-s',
	}

	public static readonly CompileOnlyWords = [
		'.(', '."', 'DO', 'I', 'J', 'LOOP', '+LOOP', ';', 'IF', 'ELSE', 'THEN'
	]
}
