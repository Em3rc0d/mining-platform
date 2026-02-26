import yf from 'yahoo-finance2';

// In some environments, the default export is the class, not the instance.
// This utility ensures we have a working instance.
const yahooFinance = typeof (yf as any) === 'function' ? new (yf as any)() : yf;

export default yahooFinance;
