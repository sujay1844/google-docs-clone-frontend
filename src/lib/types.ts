export interface Operation {
	op: 'ins' | 'del' | 'noop'
	pos: number
	char?: string
}