// Assuming the module above is named 'logger.js'
import * as logger from './log.js';
import { jest } from '@jest/globals';

describe('logger module', () => {
	beforeEach(() => {
		// Reset log level to default before each test
		logger.setLogLevel(1);
		// Spy on console.log to verify if it's being called
		jest.spyOn(console, 'log');
		// Clear all mocks to ensure a clean slate for each test
		jest.mocked(console.log).mockReturnThis().mockClear();
	});

	afterAll(() => {
		// Restore the original console.log function to its original state
		jest.mocked(console.log).mockRestore();
	});

	test('logImportant should log text when doLogImportant is true', () => {
		const text = 'Important message';
		logger.logImportant(text);
		expect(console.log).toHaveBeenCalledWith(text);
	});

	test('logInfo should not log text when doLogInfo is false', () => {
		const text = 'Info message';
		logger.logInfo(text);
		expect(console.log).not.toHaveBeenCalled();
	});

	test('logDebug should not log text when doLogDebug is false', () => {
		const text = 'Debug message';
		logger.logDebug(text);
		expect(console.log).not.toHaveBeenCalled();
	});

	test('logInfo and logDebug should log text when setLogLevel is called with verbose level', () => {
		logger.setLogLevel(3); // Verbose level, enabling all logs
		const infoText = 'Info message';
		const debugText = 'Debug message';
		logger.logInfo(infoText);
		logger.logDebug(debugText);
		expect(console.log).toHaveBeenCalledWith(infoText);
		expect(console.log).toHaveBeenCalledWith(debugText);
	});

	test('setLogLevel should correctly set log levels', () => {
		logger.setLogLevel(0);
		expect(console.log).not.toHaveBeenCalled();

		const importantText = 'Important message';
		logger.logImportant(importantText);
		expect(console.log).not.toHaveBeenCalled(); // doLogImportant is false after setLogLevel(0)

		logger.setLogLevel(2); // Should enable important and info logs
		logger.logImportant(importantText);
		logger.logInfo('Info message');
		expect(console.log).toHaveBeenCalledWith(importantText);
		expect(console.log).toHaveBeenCalledTimes(2); // Only logImportant should be called
	});
});
