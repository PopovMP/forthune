class Memory
{
	/*
		Definition
		0000 - 0000 : 1 byte - name length
		0001 - 0031 : name in characters
		0032 - 0039 : link to previous definition ( to the length byte )
		0040 - 0047 : Run-time semantics
		0048 - ...  : data bytes
	 */

	private readonly NAME_LEN  = 31 // ASCII characters
	private readonly BASE_ADDR = 8
	private readonly capacity  : number
	private readonly memory    : ArrayBuffer
	private readonly uint8Arr  : Uint8Array
	private readonly float64Arr: Float64Array

	private SD     : number
	private lastDef: number

	constructor(capacity: number)
	{
		this.capacity   = capacity
		this.memory     = new ArrayBuffer(capacity)
		this.uint8Arr   = new Uint8Array(this.memory)
		this.float64Arr = new Float64Array(this.memory)
		this.SD         = 80
		this.lastDef    = -1

		// Decimal mode
		this.float64Arr[this.BASE_ADDR] = 10

		for (const word of Object.keys(Dictionary.words) ) {
			this.create(word)
			const addrSemantics = this.SD-8
			this.float64Arr[addrSemantics] = RunTimeSemantics.BuiltInWord
			this.allot(8) // Spare
		}
	}

	public align()
	{
		const remainder = this.SD % 8
		if (remainder > 0) {
			const aligned = this.SD + 8 - remainder
			this.uint8Arr.fill(0, this.SD, aligned)
			this.SD = aligned
		}
	}

	public here()
	{
		return this.SD
	}

	public base()
	{
		return this.BASE_ADDR
	}

	public allot(sizeBytes: number): void
	{
		if (this.SD + sizeBytes >= this.capacity)
			throw new Error('Memory Overflow')

		this.uint8Arr.fill(0, this.SD, this.SD + sizeBytes)
		this.SD += sizeBytes
	}

	public create(defName: string): void
	{
		this.align()
		const defAddr = this.SD

		// Set length byte
		const nameLength = Math.min(defName.length, this.NAME_LEN)
		this.uint8Arr[defAddr] = nameLength

		// Fill name
		for (let i = 0; i < nameLength; i += 1)
			this.uint8Arr[defAddr + i + 1] = defName.charCodeAt(i)
		this.uint8Arr.fill(0, defAddr + nameLength + 1, defAddr + this.NAME_LEN)

		// Set link to prev def
		this.float64Arr[defAddr + 32] = this.lastDef

		// Set Run-time behaviour
		this.float64Arr[defAddr + 40] = RunTimeSemantics.DataAddress

		this.lastDef = this.SD
		this.SD = defAddr + 48
	}

	public findName(defName: string): number
	{
		let addr  = this.lastDef

		while (addr > 0) {
			// Compare names length
			if (this.uint8Arr[addr] === defName.length) {
				let found = true

				// Compare names characters
				for (let i = 0; i < defName.length; i += 1) {
					if (this.uint8Arr[addr + 1 + i] !== defName.charCodeAt(i)) {
						found = false
						break
					}
				}

				// Names match. Return address.
				if (found)
					return addr
			}

			addr = this.float64Arr[addr+32] // Previous def
		}

		return addr
	}

	public execDefinition(addr: number): number
	{
		switch (this.float64Arr[addr + 40] as RunTimeSemantics) {
			case RunTimeSemantics.ColonDef:
			case RunTimeSemantics.BuiltInWord:
				return addr + 40                  // Addr of run-time semantics
			case RunTimeSemantics.DataAddress:
				return addr + 48                  // Addr of first data cell
			case RunTimeSemantics.Value:
			case RunTimeSemantics.Constant:
				return this.float64Arr[addr + 48] // Value of first data cell
		}

		throw new Error('Memory Find Unreachable')
	}

	public fetchChar(addr: number): number
	{
		if (addr < 0 || addr >= this.capacity)
			throw new Error('Out of Range')

		return this.uint8Arr[addr]
	}

	public storeChar(addr: number, char: number): void
	{
		if (addr < 0 || addr >= this.capacity)
			throw new Error('Out of Range')

		this.uint8Arr[addr] = char
	}

	public fetchCell(addr: number): number
	{
		if (addr < 0 || addr >= this.capacity)
			throw new Error('Out of Range')
		if (addr % 8 !== 0)
			throw new Error('Address in not aligned')

		return this.float64Arr[addr]
	}

	public storeCell(addr: number, n: number): void
	{
		if (addr < 0 || addr >= this.capacity)
			throw new Error('Out of Range')
		if (addr % 8 !== 0)
			throw new Error('Address in not aligned')

		this.float64Arr[addr] = n
	}
}
