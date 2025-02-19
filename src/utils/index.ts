const colors = require("colors");

export const logError = (msg: string) => {
    console.log(`[ERROR] ${new Date().toISOString()}: %c${colors.bold.red(msg)}`);
};

export const logInfo = (msg: string) => {
    console.log(`[INFO] ${new Date().toISOString()}: %c${colors.bold.blue(msg)}`);
};

export const successMsg = (msg: string) => {
    console.log(`[SUCCESS] ${new Date().toISOString()}: %c${colors.bold.green(msg)}`);
}
