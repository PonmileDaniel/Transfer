export class Payment {
    constructor(data) {
        this.id = data.id || this.generateId();
        this.amount = data.amount;
        this.currency = data.currency || 'NGN';
        this.email = data.email;
        this.reference = data.reference || this.generateReference();
        this.status = data.status || 'pending';
        this.provider = data.provider;
        this.providerReference = data.providerReference;
        this.authorizationUrl = data.authorizationUrl;
        this.metadata = data.metadata || {};
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
        
    }

    generateReference() {
        return 'PAY_' + Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    static validate(data) {
        const errors = [];

        if (!data.amount || data.amount <= 0) {
            errors.push("Amount must be a positive number.")
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            errors.push("Invalid email address.")
        }

        if (data.currency && !['NGN', 'USD', 'GHS', 'KES'].includes(data.currency)) {
            errors.push("Unsupported currency. Supported currencies are NGN, USD, GHS, KES.")
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    toJSON() {
        return {
            id: this.id,
            amount: this.amount,
            currency: this.currency,
            email: this.email,
            reference: this.reference,
            status: this.status,
            provider: this.provider,
            providerReference: this.providerReference,
            authorizationUrl: this.authorizationUrl,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}