class Compiler
{
	public static compile(tokens: Token[], index: number, env: Environment): ExecResult
	{
		const token: Token = tokens[index]

		if (token.error)
			return {status: Status.Fail, message: `${token.value} ${token.error}`}

		if (token.word === ':')
			return {status: Status.Fail, message: 'Nested definition'}

		if (token.word === ';') {
			Dictionary.colonDef[env.tempDef.name] = {
				name  : env.tempDef.name,
				tokens: env.tempDef.tokens.slice()
			}

			env.tempDef = {name: '', tokens: []}
			env.runMode = RunMode.Interpret

			return {status: Status.Ok, message: ''}
		}

		switch (token.kind) {
			case TokenKind.ColonDef :
			case TokenKind.Character:
			case TokenKind.Constant :
			case TokenKind.Create   :
			case TokenKind.Value    :
			case TokenKind.Variable :
				return {status: Status.Fail, message: `${token.value} No Compilation`}

			case TokenKind.DotParen:
				env.outputBuffer += token.content
				break

			case TokenKind.CQuote: {
				Dictionary.words[token.word](env, token)
				const cAddr  = env.dStack.pop()
				env.tempDef.tokens.push(Compiler.makeNumberToken(cAddr))
				break
			}

			case TokenKind.SQuote: {
				Dictionary.words[token.word](env, token)
				const length = env.dStack.pop()
				const cAddr  = env.dStack.pop()
				env.tempDef.tokens.push(Compiler.makeNumberToken(cAddr))
				env.tempDef.tokens.push(Compiler.makeNumberToken(length))
				break
			}

			case TokenKind.Word: {
				if (Dictionary.words   .hasOwnProperty(token.word) ||
					Dictionary.colonDef.hasOwnProperty(token.word)) {
					env.tempDef.tokens.push(token)
					break
				}

				const defAddr = env.memory.findName(token.word, true)
				if (defAddr > 0 ) {
					const value = env.memory.findName(token.word, false)
					env.tempDef.tokens.push( Compiler.makeNumberToken(value) )
					break
				}

				return {status: Status.Fail, message: `${token.value} ?`}
			}

			default:
				env.tempDef.tokens.push(token)
		}

		return {status: Status.Ok, message: ''}
	}

	public static makeNumberToken(num: number): Token
	{
		return {content: '', error: '', kind: TokenKind.Number, value: String(num), word: String(num)}
	}
}
