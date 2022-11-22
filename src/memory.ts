class Memory
{
	/*
		Definition
		0000 - 0000 : 1 byte - name length
		0001 - 0031 : name in characters
		0032 - 0039 : link to previous definition ( to the length byte )
		0040 - 0047 : link to Run-time behaviour
		0048 - ...  : data bytes
	 */

	private readonly NAME_LEN = 31 // ASCII characters
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
		this.SD         = 0
		this.lastDef    = -1
	}

	public here()
	{
		return this.SD
	}

	public allot(sizeBytes: number): void
	{
		if (this.SD + sizeBytes >= this.capacity)
			throw new Error('Memory Overflow')

		this.SD     += sizeBytes
		this.uint8Arr.fill(0, this.lastDef + 40, this.SD)
	}

	public create(defName: string): void
	{
		// Align SD
		const remainder = this.SD % 8
		if (remainder !== 0)
			this.allot(this.SD + 8 - remainder)

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
		this.float64Arr[defAddr + 40] = 0

		this.lastDef = this.SD
		this.SD = defAddr + 48
	}

	public findName(defName: string): number
	{
		const nameLen = defName.length
		let addr = this.lastDef
		while (true) {
			if (this.uint8Arr[addr] !== nameLen) {
				// Go to previous def
				addr = this.float64Arr[addr + 32]
				if (addr < 0) return -1
				continue
			}

			for (let i = 0; i < nameLen; i += 1) {
				if (this.uint8Arr[addr + 1 + i] !== defName.charCodeAt(i)) {
					addr = this.float64Arr[addr + 32]
					if (addr < 0) return -1
				}
			}

			return addr + 48
		}
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

	public fetchWord(addr: number): number
	{
		if (addr < 0 || addr >= this.capacity)
			throw new Error('Out of Range')
		if (addr % 8 !== 0)
			throw new Error('Address in not aligned')

		return this.float64Arr[addr]
	}

	public storeWord(addr: number, n: number): void
	{
		if (addr < 0 || addr >= this.capacity)
			throw new Error('Out of Range')
		if (addr % 8 !== 0)
			throw new Error('Address in not aligned')

		this.float64Arr[addr] = n
	}
}
