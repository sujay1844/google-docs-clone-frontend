export interface Operation {
	op: 'ins' | 'del' | 'noop'
	pos: number
	str?: string
	revision?: number
}