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

			case TokenKind.Character:
				env.dStack.push( token.content.charCodeAt(0) )
				break

			case TokenKind.Constant:
				env.constant[token.content.toUpperCase()] = env.dStack.pop()
				break

			case TokenKind.ColonDef:
				env.tempDef = {name:  token.content.toUpperCase(), tokens: []}
				env.runMode = RunMode.Compile
				break

			case TokenKind.Backslash  :
			case TokenKind.BracketChar:
			case TokenKind.CQuote     :
			case TokenKind.Create     :
			case TokenKind.DotParen   :
			case TokenKind.DotQuote   :
			case TokenKind.Paren      :
			case TokenKind.SQuote     :
			case TokenKind.Value      :
			case TokenKind.ValueTo    :
			case TokenKind.Word       :
				if ( Dictionary.colonDef.hasOwnProperty(token.word) ) {
					env.runMode = RunMode.Run

					const res = Executor.run(Dictionary.colonDef[token.word].tokens, env)

					env.runMode = RunMode.Interpret

					return res
				}

				if ( env.value.hasOwnProperty(token.word) ) {
					env.dStack.push(env.value[token.word])
					break
				}

				if ( env.constant.hasOwnProperty(token.word) ) {
					env.dStack.push(env.constant[token.word])
					break
				}

				if ( Dictionary.words.hasOwnProperty(token.word) )
					return Dictionary.words[token.word](env, token)

				const defAddr = env.memory.findName(token.word)
				if (defAddr >= 0 ) {
					env.dStack.push(defAddr)
					break
				}

				return {status: Status.Fail, message: `${token.value} ?`}

			default:
				return {status: Status.Fail, message: `${token.value} Interpreter: Unknown TokenKind`}
		}

		return {status: Status.Ok, message: ''}
	}
}
