class Compiler
{
	public static compile(tokens: Token[], index: number, env: Environment): ExecResult
	{
		const token: Token = tokens[index]

		if (token.value === ':') {
			return {status: Status.Fail, value: token.value + '  Nested definition'}
		}

		if (token.value === ';') {
			Dictionary.colonDef[env.tempDef.name] = {
				name  : env.tempDef.name,
				tokens: env.tempDef.tokens.slice()
			}

			env.tempDef = {name: '', tokens: []}
			env.runMode = RunMode.Interpret

			return {status: Status.Ok, value: ''}
		}

		if (token.kind === TokenKind.Comment &&
			index > 0 && tokens[index-1].value === '.(') {
			return {status: Status.Ok, value: token.value}
		}

		switch (token.kind) {
			case TokenKind.Comment:
			case TokenKind.LineComment:
				break

			case TokenKind.Number:
			case TokenKind.Character:
			case TokenKind.String:
			case TokenKind.Value:
				env.tempDef.tokens.push(token)
				break

			case TokenKind.Word:
				const wordName = token.value.toUpperCase()

				if (Dictionary.words   .hasOwnProperty(wordName) ||
					Dictionary.colonDef.hasOwnProperty(wordName) ||
					env.value.hasOwnProperty(wordName)) {
					env.tempDef.tokens.push(token)
					break
				}

				return {status: Status.Fail, value: token.value + '  Unknown word'}

			default:
				return {status: Status.Fail, value: token.value + '  Compile mode: Unreachable'}
		}

		return {status: Status.Ok, value: ''}
	}
}
