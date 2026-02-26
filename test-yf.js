const yahooFinance = require('yahoo-finance2').default;
console.log('Type of yahooFinance:', typeof yahooFinance);
console.log('Is it a function?', typeof yahooFinance === 'function');

try {
    yahooFinance.historical('AAPL', { period1: '2023-01-01' })
        .then(() => console.log('Historical call successful'))
        .catch(err => console.error('Historical call error:', err.message));
} catch (e) {
    console.error('Immediate error:', e.message);
}
