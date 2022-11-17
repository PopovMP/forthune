class Interpreter
{
	public static run(tokens: Token[], index: number, env: Environment): ExecResult
	{
		const token: Token = tokens[index]

		switch (token.kind) {
			case TokenKind.Number:
				env.dStack.push(parseInt(token.value))
				break

			case TokenKind.Character:
				env.dStack.push(token.value.charCodeAt(0))
				break

			case TokenKind.Comment:
			case TokenKind.LineComment:
			case TokenKind.String:
				break

			case TokenKind.Word: {
				const wordName = token.value.toUpperCase()

				if (wordName === 'VALUE' || wordName === 'TO') {
					if (index >= tokens.length || tokens[index+1].kind !== TokenKind.Value)
						return {status: Status.Fail, value: ` ${wordName}  used without name`}

					const valName = tokens[index+1].value.toUpperCase()
					env.value[valName] = env.dStack.pop()
					break
				}

				if (wordName === ':') {
					if (index === tokens.length-1 ||
						tokens[index+1].kind !== TokenKind.Word ||
						tokens[index+1].value === ';') {
						return {status: Status.Fail, value: token.value + '  Empty definition name'}
					}

					env.tempDef = {
						name  :  tokens[index+1].value.toUpperCase(),
						tokens: []
					}

					env.runMode = RunMode.Compile

					return {status: Status.Ok, value: ''}
				}

				if (Dictionary.colonDef.hasOwnProperty(wordName)) {
					env.runMode = RunMode.Run

					const res = Executor.run(Dictionary.colonDef[wordName].tokens, env)

					env.runMode = RunMode.Interpret

					return res
				}

				if (env.value.hasOwnProperty(wordName)) {
					env.dStack.push(env.value[wordName])
					return {status: Status.Ok, value: ''}
				}

				if (Dictionary.words.hasOwnProperty(wordName)) {
					return Dictionary.words[wordName](env)
				}

				return {status: Status.Fail, value: token.value + '  Unknown word'}
			}

			default:
				return {status: Status.Fail, value: token.value + '  Interpret mode: Unreachable'}
		}

		return {status: Status.Ok, value: ''}
	}
}
