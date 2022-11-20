class Compiler
{
	public static compile(tokens: Token[], index: number, env: Environment): ExecResult
	{
		const token: Token = tokens[index]

		if (token.error)
			return {status: Status.Fail, message: `${token.value} ${token.error}`}

		if (token.word === ':')
			return {status: Status.Fail, message: `Nested definition`}

		if (token.word === ';') {
			Dictionary.colonDef[env.tempDef.name] = {
				name  : env.tempDef.name,
				tokens: env.tempDef.tokens.slice()
			}

			env.tempDef = {name: '', tokens: []}
			env.runMode = RunMode.Interpret

			return {status: Status.Ok, message: ''}
		}

		if (token.kind === TokenKind.DotComment) {
			env.output(token.content)
			return {status: Status.Ok, message: ''}
		}

		switch (token.kind) {
			case TokenKind.Comment:
			case TokenKind.LineComment:
				break

			case TokenKind.Word:
				if (Dictionary.words   .hasOwnProperty(token.word) ||
					Dictionary.colonDef.hasOwnProperty(token.word) ||
					env.value          .hasOwnProperty(token.word) ||
					env.constant       .hasOwnProperty(token.word)) {
					env.tempDef.tokens.push(token)
					break
				}
				return {status: Status.Fail, message: `${token.value} ?`}

			default:
				env.tempDef.tokens.push(token)
		}

		return {status: Status.Ok, message: ''}
	}
}
