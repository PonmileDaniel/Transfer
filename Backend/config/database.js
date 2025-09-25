export class PaymentRepository {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('payments');
  }

  async createPayment(paymentData) {
    try {
      const result = await this.collection.insertOne(paymentData);
      return { 
        success: true, 
        id: result.insertedId,
        data: paymentData 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async findPaymentById(id) {
    try {
      const payment = await this.collection.findOne({ id: id });
      return { 
        success: true, 
        data: payment 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async findPaymentByReference(reference) {
    try {
      const payment = await this.collection.findOne({ reference: reference });
      return { 
        success: true, 
        data: payment 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async updatePayment(id, updateData) {
    try {
      updateData.updatedAt = new Date();
      const result = await this.collection.updateOne(
        { id: id },
        { $set: updateData }
      );
      return { 
        success: true, 
        modifiedCount: result.modifiedCount 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async getAllPayments(limit = 10, skip = 0) {
    try {
      const payments = await this.collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .toArray();
      
      const total = await this.collection.countDocuments({});
      
      return { 
        success: true, 
        data: payments,
        total: total,
        limit: limit,
        skip: skip
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async findPaymentsByStatus(status, limit = 10) {
    try {
      const payments = await this.collection
        .find({ status: status })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      
      return { 
        success: true, 
        data: payments 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async findPaymentsByEmail(email, limit = 10) {
    try {
      const payments = await this.collection
        .find({ email: email })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      
      return { 
        success: true, 
        data: payments 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}