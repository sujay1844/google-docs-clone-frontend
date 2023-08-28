import { diff_match_patch } from 'diff-match-patch'

const dmp = new diff_match_patch()

export function getOperation(oldStr: string, newStr: string) {
	const diffs = dmp.diff_main(oldStr, newStr)
	dmp.diff_cleanupSemantic(diffs)
	let change = {};

	let position = 0
	for (const [operation, content] of diffs) {
		if(operation === -1) {
			change = {
				op: 'del',
				pos: position,
				char: content,
			}
		} else if(operation === 1) {
			change = {
				op: 'ins',
				pos: position,
				char: content,
			}
		} else {
			position += content.length
		}

	}
	change = {...change, timestamp: Date.now()}
	return change
}

export function applyOperation(doc: string, operation: any) {
	if(operation.op === 'del') {
		return doc.slice(0, operation.pos) + doc.slice(operation.pos + 1)
	} else if(operation.op === 'ins') {
		return doc.slice(0, operation.pos) + operation.char + doc.slice(operation.pos)
	}
	return doc
}