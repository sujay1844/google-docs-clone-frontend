// Example operation
// {"op":"ins", "pos": 5, "char": "b", timestamp: 1234567890}
// {"op":"del", "pos": 2, timestamp: 1234567890}
export function transform(op1: any, op2: any) {
	if(op1.op == "ins" && op2.op == "ins") {
		if(op1.pos < op2.pos) {
			return op1;
		}
		else if(op1.pos == op2.pos) {
			if(op1.timestamp > op2.timestamp) {
				return op1;
			} else {
				return {
					op: "ins",
					pos: op1.pos + 1,
					char: op1.char,
					timestamp: op1.timestamp
				}
			}
		} else {
			return {
				op: "ins",
				pos: op1.pos + 1,
				char: op1.char,
				timestamp: op1.timestamp
			}
		}
	} else if(op1.op == "ins" && op2.op == "del") {
		if(op1.pos <= op2.pos) {
			return op1;
		} else {
			return {
				op: "ins",
				pos: op1.pos - 1,
				char: op1.char,
				timestamp: op1.timestamp
			}
		}
	} else if(op1.op == "del" && op2.op == "ins") {
		if(op1.pos < op2.pos) {
			return op1;
		} else {
			return {
				op: "del",
				pos: op1.pos + 1,
				timestamp: op1.timestamp
			}
		}
	} else if(op1.op == "del" && op2.op == "del") {
		if(op1.pos < op2.pos) {
			return op1;
		} else if (op1.pos > op2.pos) {
			return {
				op: "del",
				pos: op1.pos - 1,
				timestamp: op1.timestamp
			}
		} else {
			return null
		}
	}
}