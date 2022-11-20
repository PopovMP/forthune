class Parser
{
	public static contentWords: {[word: string]: TokenGrammar} = {
		'\\': {
			kind     : TokenKind.LineComment,
			delimiter: '\n',
			trimStart: false,
			strict   : false,
			empty    : true,
		},
		':': {
			kind     : TokenKind.ColonDef,
			delimiter: ' ',
			trimStart: true,
			strict   : false,
			empty    : false,
		},
		'(': {
			kind     : TokenKind.Comment,
			delimiter: ')',
			trimStart: false,
			strict   : true,
			empty    : true,
		},
		'.(': {
			kind     : TokenKind.DotComment,
			delimiter: ')',
			trimStart: false,
			strict   : true,
			empty    : true,
		},
		'."': {
			kind     : TokenKind.String,
			delimiter: '"',
			trimStart: false,
			strict   : true,
			empty    : true,
		},
		'CHAR': {
			kind     : TokenKind.Character,
			delimiter: ' ',
			trimStart: true,
			strict   : false,
			empty    : false,
		},
		'CONSTANT': {
			kind     : TokenKind.Constant,
			delimiter: ' ',
			trimStart: true,
			strict   : false,
			empty    : false,
		},
		'CREATE': {
			kind     : TokenKind.Create,
			delimiter: ' ',
			trimStart: true,
			strict   : false,
			empty    : false,
		},
		'VALUE': {
			kind     : TokenKind.Value,
			delimiter: ' ',
			trimStart: true,
			strict   : false,
			empty    : false,
		},
		'VARIABLE': {
			kind     : TokenKind.Variable,
			delimiter: ' ',
			trimStart: true,
			strict   : false,
			empty    : false,
		},
		'TO': {
			kind     : TokenKind.ValueTo,
			delimiter: ' ',
			trimStart: true,
			strict   : false,
			empty    : false,
		},
	}

	public static parseLine(inputLine: string, lineNum: number): Token[]
	{
		const tokens: Token[] = []

		const codeLine = inputLine.trimStart()

		let index = 0
		while (index < codeLine.length) {
			if (codeLine[index] === ' ') {
				index += 1
				continue
			}

			let toIndex = codeLine.indexOf(' ', index)
			if (toIndex === -1)
				throw new Error('Code line does not end with a space!')

			const value = codeLine.slice(index, toIndex)
			const word  = value.toUpperCase()
			const pos   = {line: lineNum, col: index}

			index = toIndex

			// Words with content
			if ( Parser.contentWords.hasOwnProperty(word) ) {
				const grammar: TokenGrammar = Parser.contentWords[word]
				toIndex += 1

				if (grammar.trimStart) {
					while (codeLine[toIndex] === ' ')
						toIndex += 1
				}

				let endIndex = codeLine.indexOf(grammar.delimiter, toIndex+1)
				index = endIndex + 1 // Eat the delimiter
				if (endIndex === -1) {
					index    = codeLine.length
					endIndex = codeLine.length
					if (grammar.strict) {
						tokens.push({kind: grammar.kind, error: 'Not Closed', content: '', value, word, pos})
						continue
					}
				}

				let content = codeLine.slice(toIndex, endIndex)

				if (!grammar.empty && content.length === 0) {
					tokens.push({kind: grammar.kind, error: 'Empty', content: '', value, word, pos})
					continue
				}

				tokens.push({kind: grammar.kind, error: '', content, value, word, pos})
			}
			else {
				const isNumber = value.match(/^[+-]?\d+(?:.?\d+)?$/)
				const kind     = isNumber ? TokenKind.Number : TokenKind.Word
				tokens.push({kind, error: '', content: '', value, word, pos})
			}
		}

		return tokens
	}

	public static stringify(tokens: Token[]): string
	{
		return tokens.map((token: Token) => {
			let value = token.value

			if (Parser.contentWords.hasOwnProperty(token.word)) {
				const grammar = Parser.contentWords[token.word]
				value += ' ' + token.content

				if (grammar.delimiter === '"' || grammar.delimiter === ')')
					value += grammar.delimiter
			}

			return value
		}).join(' ')
	}
}

module.exports = {
	Parser
}