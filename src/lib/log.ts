

let doLogImportant = true;
let doLogInfo = false;
let doLogDebug = false;

export function logImportant(text: string): void {
	if (doLogImportant) console.log(text);
}

export function logInfo(text: string): void {
	if (doLogInfo) console.log(text);
}

export function logDebug(text: string): void {
	if (doLogDebug) console.log(text);
}

export function setLogLevel(logLevel: number): void {
	// 0=quiet, 1=default, 2=verbose, 3=verbose
	doLogImportant = logLevel > 0;
	doLogInfo = logLevel > 1;
	doLogDebug = logLevel > 2;
}
