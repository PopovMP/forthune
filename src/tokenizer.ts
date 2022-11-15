class Tokenizer
{
	public static tokenizeLine(codeLine: string, lineNum: number): Token[]
	{
		const keywords = [
			...Object.keys(Dictionary.CoreWord),
			...Object.keys(Dictionary.CoreExtensionWord),
			...Object.keys(Dictionary.ToolsWord),
		]

		const tokens: Token[] = []

		let fromIndex = 0
		let prevWord  = ''
		while (fromIndex < codeLine.length) {
			const ch0 = codeLine[fromIndex]

			// Eat leading spaces
			if (prevWord !== '."' && (ch0 === ' ' || ch0 === '\t')) {
				fromIndex += 1
				continue
			}

			let toIndex = fromIndex

			// Immediate words
			switch (prevWord.toUpperCase()) {
				case '\\': // Eat line comment delimited by <newline>
					while (toIndex < codeLine.length)
						toIndex += 1
					break
				case '(':
				case '.(': // Eat comment delimited by <paren>
					while (codeLine[toIndex] !== ')' && toIndex < codeLine.length)
						toIndex += 1
					break
				case '."': // Eat string delimited by <comma>
					while (codeLine[toIndex] !== '"' && toIndex < codeLine.length)
						toIndex += 1
					break
				case 'CHAR': // Eat character delimited by <space>
					while (codeLine[toIndex] !== ' ' && codeLine[toIndex] !== '\t' && toIndex < codeLine.length)
						toIndex += 1
					break
				default: // Eat word delimited by <space>
					while (codeLine[toIndex] !== ' ' && codeLine[toIndex] !== '\t' && toIndex < codeLine.length)
						toIndex += 1
					break
			}

			const pos = {line: lineNum, col: fromIndex}

			const currentWord = codeLine.slice(fromIndex, toIndex)
			fromIndex = toIndex + 1

			switch (prevWord.toUpperCase()) {
				case '\\': // Line comment
					tokens.push({kind: TokenKind.LineComment, value: currentWord, pos})
					break
				case '(': // Comment
				case '.(':
					tokens.push({kind: TokenKind.Comment, value: currentWord, pos})
					break
				case '."': // String
					tokens.push({kind: TokenKind.String, value: currentWord, pos})
					break
				case 'CHAR': // Character
					tokens.push({kind: TokenKind.Character, value: currentWord, pos})
					break
				default:
					if (keywords.includes(currentWord.toUpperCase())) // Known word
						tokens.push({kind: TokenKind.Keyword, value: currentWord, pos})
					else if (currentWord.match(/^[+-]?\d+$/)) // Number
						tokens.push({kind: TokenKind.Number, value: currentWord, pos})
					else // Unknown word
						tokens.push({kind: TokenKind.Word, value: currentWord, pos})
					break
			}

			prevWord = currentWord
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
}

module.exports = {
	Tokenizer
}
