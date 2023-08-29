// Example operation
// {"op":"ins", "pos": 5, "char": "b", timestamp: 1234567890}

import { Operation } from "./types";

// {"op":"del", "pos": 2, timestamp: 1234567890}
export function transform(op1: Operation, op2: Operation): Operation {
	if(op1.op == "noop") {
		return op1
	} else if(op2.op == "noop") {
		return op2
	} else if(op1.op == "ins" && op2.op == "ins") {
		if(op1.pos < op2.pos) {
			return op1;
		} else {
			return {
				op: "ins",
				pos: op1.pos + op1.str!.length,
				str: op1.str,
			}
		}
	} else if(op1.op == "ins" && op2.op == "del") {
		if(op1.pos <= op2.pos) {
			return op1;
		} else {
			return {
				op: "ins",
				pos: op1.pos - op1.str!.length,
				str: op1.str,
			}
		}
	} else if(op1.op == "del" && op2.op == "ins") {
		if(op1.pos < op2.pos) {
			return op1;
		} else {
			return {
				op: "del",
				pos: op1.pos + op1.str!.length,
			}
		}
	} else if(op1.op == "del" && op2.op == "del") {
		if(op1.pos < op2.pos) {
			return op1;
		} else if (op1.pos > op2.pos) {
			return {
				op: "del",
				pos: op1.pos - op1.str!.length,
			}
		} else {
			return {
				op: "noop",
				pos: op1.pos,
			}
		}
	} else {
		throw new Error("Invalid operation");
	}
}