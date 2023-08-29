import { Operation } from '@/lib/types'
import { diff_match_patch } from 'diff-match-patch'

const dmp = new diff_match_patch()

export function getOperation(oldStr: string, newStr: string) {
	const diffs = dmp.diff_main(oldStr, newStr)
	dmp.diff_cleanupSemantic(diffs)
	let change: Operation = {
		op: 'noop',
		pos: 0,
	};

	let position = 0
	for (const [operation, content] of diffs) {
		if(operation === -1) {
			change = {
				op: 'del',
				pos: position,
				str: content,
			}
		} else if(operation === 1) {
			change = {
				op: 'ins',
				pos: position,
				str: content,
			}
		} else {
			position += content.length
		}

	}
	return change
}

export function applyOperation(doc: string, operation: Operation) {
	if(operation.op === 'del') {
		return doc.slice(0, operation.pos) + doc.slice(operation.pos + operation.str!.length)
	} else if(operation.op === 'ins') {
		return doc.slice(0, operation.pos) + operation.str + doc.slice(operation.pos)
	}
	return doc
}