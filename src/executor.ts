class Executor
{
	public static run(tokens: Token[], env: Environment): ExecResult
	{
		let outText = ''

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i]

			switch (token.kind) {
				case TokenKind.Number:
					env.dStack.push(parseInt(token.value))
					break

				case TokenKind.Comment:
				case TokenKind.LineComment:
					break

				case TokenKind.Character:
					env.dStack.push(token.value.charCodeAt(0))
					break

				case TokenKind.String:
					outText += token.value
					break

				case TokenKind.Word:
					const wordName = token.value.toUpperCase()

					if (env.isLeave)
						break

					if (wordName === 'VALUE' || wordName === 'TO') {
						if (i >= tokens.length || tokens[i+1].kind !== TokenKind.Value)
							return {status: Status.Fail, value: ` ${wordName}  used without name`}

						const valName = tokens[i+1].value.toUpperCase()
						env.value[valName] = env.dStack.pop()
						i += 1 // Eat value name
						break
					}

					if (wordName === 'IF') {
						let thenIndex = i + 1
						let ifDepth = 1
						while (true) {
							thenIndex += 1
							if (thenIndex === tokens.length)
								return {status: Status.Fail, value: ' THEN not found'}
							const loopWord = tokens[thenIndex].value.toUpperCase()
							if (loopWord === 'IF')
								ifDepth += 1
							if (loopWord === 'THEN')
								ifDepth -= 1
							if (ifDepth === 0)
								break
						}

						let elseIndex = i + 1
						ifDepth = 1
						while (elseIndex < thenIndex) {
							elseIndex += 1
							const loopWord = tokens[elseIndex].value.toUpperCase()
							if (loopWord === 'IF')
								ifDepth += 1
							if (loopWord === 'THEN')
								ifDepth -= 1
							if (ifDepth === 1 && loopWord === 'ELSE')
								break
						}

						const flag = env.dStack.pop()
						if (flag === 0) {
							if (elseIndex < thenIndex) {
								const res = Executor.run(tokens.slice(elseIndex+1, thenIndex), env)
								outText += res.value

								if (res.status === Status.Fail)
									return {status: Status.Fail, value: outText}
							}

							i = thenIndex + 1
							continue
						}
						else {
							const res = Executor.run(tokens.slice(i+1, elseIndex), env)
							outText += res.value

							if (res.status === Status.Fail)
								return {status: Status.Fail, value: outText}

							i = thenIndex + 1
							continue
						}
					}

					if (wordName === 'DO' || wordName === '?DO') {
						const isQuestionDup = wordName === '?DO'
						let loopIndex = i + 1
						let doDepth   = 1

						while (true) {
							loopIndex += 1
							if (loopIndex === tokens.length)
								return {status: Status.Fail, value: ' LOOP not found'}
							const loopWord = tokens[loopIndex].value.toUpperCase()
							if (loopWord === 'DO')
								doDepth += 1
							if (loopWord === 'LOOP' || loopWord === '+LOOP')
								doDepth -= 1
							if (doDepth === 0)
								break
						}

						const isPlusLoop = tokens[loopIndex].value.toUpperCase() === '+LOOP'
						let   counter    = env.dStack.pop()
						const limit      = env.dStack.pop()
						const upwards    = limit > counter

						if (isQuestionDup && counter === limit) {
							i = loopIndex
							env.isLeave = false
							continue
						}

						if (!isPlusLoop && !upwards)
							return {status: Status.Fail, value: ' LOOP wrong range'}

						while (upwards ? counter < limit : counter >= limit) {
							env.rStack.push(counter)
							const res = Executor.run(tokens.slice(i+1, loopIndex), env)
							env.rStack.pop()

							if (env.isLeave)
								break

							outText += res.value
							if (res.status === Status.Fail)
								return {status: Status.Fail, value: outText}

							counter += isPlusLoop ? env.dStack.pop() : 1
						}

						i = loopIndex
						env.isLeave = false
						continue
					}

					if (Dictionary.colonDef.hasOwnProperty(wordName)) {
						const res = Executor.run(Dictionary.colonDef[wordName].tokens, env)
						outText += res.value
						if (res.status === Status.Fail)
							return {status: Status.Fail, value: outText}
						break
					}

					if (env.value.hasOwnProperty(wordName)) {
						env.dStack.push(env.value[wordName])
						continue
					}

					if (Dictionary.words.hasOwnProperty(wordName) ) {
						const res = Dictionary.words[wordName](env)
						outText += res.value
						if (res.status === Status.Fail)
							return {status: Status.Fail, value: outText}
						if (env.isLeave)
							return {status: Status.Ok, value: outText}
						break
					}

					return {status: Status.Fail, value: `${outText} ${token.value}  Unknown word`}

				default:
					throw new Error('runTokens:  Unreachable')
			}
		}

		return {status: Status.Ok, value: outText}
	}
}
