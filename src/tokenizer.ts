class Tokenizer
{
	public static tokenizeLine(codeLine: string, lineNum: number): Token[]
	{
		const tokens: Token[] = []

		let index    = 0
		let prevWord = ''

		while (index < codeLine.length) {
			// Eat leading white space
			if (prevWord !== '."') {
				while (codeLine[index] === ' ' || codeLine[index] === '\t') {
					if (index >= codeLine.length)
						break
					index += 1
				}
			}

			const pos = {line: lineNum, col: index}

			switch (prevWord) {
				case '\\': {
					// Eat line comment delimited by <newline>
					const toIndex = this.findIndex(codeLine, '\n', index)
					const comment = codeLine.slice(index, toIndex)
					tokens.push({kind: TokenKind.LineComment, value: comment, pos})
					index    = toIndex + 1
					prevWord = ''
					break
				}
				case  '(':
				case '.(': {
					// Eat comment delimited by <paren>
					const toIndex = this.findIndex(codeLine, ')', index)
					const comment = codeLine.slice(index, toIndex)
					tokens.push({kind: TokenKind.Comment, value: comment, pos})
					index    = toIndex + 1
					prevWord = ''
					break
				}
				case 'CHAR': {
					// Eat character delimited by <space>
					const toIndex = this.findIndex(codeLine, ' ', index)
					const char    = codeLine.slice(index, toIndex).slice(0, 1)
					tokens.push({kind: TokenKind.Character, value: char, pos})
					index    = toIndex + 1
					prevWord = ''
					break
				}
				case 'VALUE':
				case 'TO'   : {
					// Eat VALUE's name delimited by <space>
					const toIndex   = this.findIndex(codeLine, ' ', index)
					const valueName = codeLine.slice(index, toIndex).toUpperCase()
					tokens.push({kind: TokenKind.Value, value: valueName, pos})
					index    = toIndex + 1
					prevWord = ''
					break
				}
				case 'CONSTANT': {
					// Eat CONSTANT's name delimited by <space>
					const toIndex   = this.findIndex(codeLine, ' ', index)
					const constName = codeLine.slice(index, toIndex).toUpperCase()
					tokens.push({kind: TokenKind.Constant, value: constName, pos})
					index    = toIndex + 1
					prevWord = ''
					break
				}
				case '."': {
					// Eat string delimited by <comma>
					const toIndex = this.findIndex(codeLine, '"', index)
					const text    = codeLine.slice(index, toIndex)
					tokens.push({kind: TokenKind.String, value: text, pos})
					index    = toIndex + 1
					prevWord = ''
					break
				}
				default: {
					// Eat word delimited by <space>
					const toIndex = this.findIndex(codeLine, ' ', index)
					const word    = codeLine.slice(index, toIndex)
					if (word.match(/^[+-]?\d+$/))
						tokens.push({kind: TokenKind.Number, value: word, pos})
					else
						tokens.push({kind: TokenKind.Word, value: word, pos})
					index    = toIndex + 1
					prevWord = word.toUpperCase()
					break
				}
			}
		}

		return tokens
	}

	public static stringify(tokens: Token[]): string
	{
		return tokens.map((token: Token) => {
			switch (token.kind) {
				case TokenKind.Comment: return token.value + ')'
				case TokenKind.String : return token.value + '"'
				default               : return token.value
			}
		}).join(' ')
	}

	private static findIndex(text: string, delimiter: string, fromIndex: number): number
	{
		let i = fromIndex

		while (text[i] !== delimiter && i < text.length)
			i += 1

		return i
	}
}

module.exports = {
	Tokenizer
}
