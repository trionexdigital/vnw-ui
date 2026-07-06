import CryptoJS from 'crypto-js';

export class Methods {
    
     formatUTCDatetime(date: Date, format: string) {
        const _padStart = (value: number): string => value.toString().padStart(2, '0');
        try {

            if (isNaN(date.getTime())) {
                throw new Error("Invalid Date provided");
            }

            return format
                .replace(/yyyy/g, _padStart(date.getUTCFullYear()))
                .replace(/dd/g, _padStart(date.getUTCDate()))
                .replace(/mm/g, _padStart(date.getUTCMonth() + 1))
                .replace(/hh/g, _padStart(date.getUTCHours()))
                .replace(/mi/g, _padStart(date.getUTCMinutes()))
                .replace(/ss/g, _padStart(date.getUTCSeconds()))
                .replace(/ms/g, _padStart(date.getUTCMilliseconds()));
        } catch (error) {
            throw new Error("formatUTCDatetime : " + JSON.stringify(error));
        }
    }

    getAuthKey() {
        const utcDate = this.formatUTCDatetime(new Date(), 'yyyy-mm-dd');
        // Assuming your cryptoJS utility uses standard MD5
        return CryptoJS.MD5(utcDate).toString();
    }

    getUTCDateMySQL() {
        return new Date().toISOString().slice(0, 10);
    }

    // Helper for React state updates (Async delay)
    async timeDelay(sec: number) {
        return new Promise(resolve => setTimeout(resolve, sec * 1000));
    }

    // Refactored date subtraction logic
    dateSubtract(currentDate: string, yearsToSubtract: number) {
        const date = new Date(currentDate);
        date.setFullYear(date.getFullYear() - yearsToSubtract);
        return date.toISOString().slice(0, 10);
    }
}