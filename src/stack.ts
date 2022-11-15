class Stack
{
	private readonly holder  : number[]
	private readonly capacity: number
	private index: number

	constructor(capacity: number)
	{
		this.holder   = new Array(capacity)
		this.capacity = capacity
		this.index    = 0
	}

	public depth(): number
	{
		return this.index
	}

	public push(n: number): void
	{
		if (this.index >= this.capacity)
			throw new Error('Stack overflow')

		this.holder[this.index] = n
		this.index += 1
	}

	public pop(): number
	{
		if (this.index <= 0)
			throw new Error('Stack underflow')

		this.index -= 1
		return this.holder[this.index]
	}

	public get(i: number): number
	{
		const index = this.index - i - 1
		if (index < 0 || index >= this.index)
			throw new Error('Stack out of range')

		return this.holder[index]
	}

	public set(i: number, n: number): void
	{
		const index = this.index - i - 1
		if (index < 0 || index >= this.index)
			throw new Error('Stack out of range')

		this.holder[index] = n
	}

	public clear()
	{
		this.index = 0
	}
}
