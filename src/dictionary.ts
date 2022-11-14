class Dictionary
{
	public static CoreWord: {[word: string]: string} = {
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

	public static CoreExtensionWord: {[word: string]: string} = {
		'.('   : 'dot-paren',
		'<>'   : 'not-equals',
	}

	public static ToolsWord: {[word: string]: string} = {
		'.S'   : 'dot-s',
	}
}
