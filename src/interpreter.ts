class Interpreter
{
	public static run(tokens: Token[], index: number, env: Environment): ExecResult
	{
		const token: Token = tokens[index]

		if (token.error)
			return {status: Status.Fail, message: `${token.value} ${token.error}`}

		switch (token.kind) {
			case TokenKind.Number:
				env.dStack.push( Number(token.value) )
				break

			case TokenKind.ColonDef:
				env.tempDef = {name:  token.content.toUpperCase(), tokens: []}
				env.runMode = RunMode.Compile
				break

			default:
				if ( Dictionary.colonDef.hasOwnProperty(token.word) ) {
					env.runMode = RunMode.Run

					const res = Executor.run(Dictionary.colonDef[token.word].tokens, env)

					env.runMode = RunMode.Interpret

					return res
				}

				if ( Dictionary.words.hasOwnProperty(token.word) )
					return Dictionary.words[token.word](env, token)

				const defAddr = env.memory.findName(token.word, true)
				if (defAddr > 0 ) {
					const value = env.memory.findName(token.word, false)
					env.dStack.push(value)
					break
				}

				return {status: Status.Fail, message: `${token.value} ?`}
		}

		return {status: Status.Ok, message: ''}
	}
}
