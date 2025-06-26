#!/usr/bin/env node

const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const ProgressBar = require('progress');

const db = require('../config/database');
const settings = require('../config/settings');

console.log(chalk.blue.bold('\n💳 Loading Payments and Invoices Data\n'));

async function loadPayments() {
  try {
    console.log('🔍 Testing database connection...');
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    // Get existing orders to create payments for
    const orders = await db.query('SELECT id, total_amount, advance_paid, payment_status, created_at FROM orders WHERE payment_status != $1', ['pending']);
    
    if (orders.rows.length === 0) {
      console.log('⚠️ No orders found. Please run order loading script first.');
      return { success: true, paymentsLoaded: 0, invoicesLoaded: 0 };
    }

    console.log(`📋 Creating payments for ${orders.rows.length} orders...`);

    const payments = [];
    const invoices = [];

    orders.rows.forEach((order, index) => {
      // Create payment record
      const paymentNumber = `PAY${new Date(order.created_at).getFullYear()}${String(index + 1).padStart(6, '0')}`;
      
      const paymentMethods = ['cash', 'card', 'upi', 'net_banking', 'cheque'];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      const payment = {
        id: uuidv4(),
        order_id: order.id,
        payment_number: paymentNumber,
        payment_method: paymentMethod,
        amount: parseFloat(order.advance_paid) || parseFloat(order.total_amount),
        status: order.payment_status === 'paid' ? 'completed' : order.payment_status === 'partial' ? 'completed' : 'pending',
        transaction_id: paymentMethod !== 'cash' ? `TXN${Date.now()}${Math.floor(Math.random() * 1000)}` : null,
        payment_gateway: paymentMethod === 'card' || paymentMethod === 'upi' ? (Math.random() > 0.5 ? 'razorpay' : 'stripe') : null,
        gateway_response: paymentMethod !== 'cash' ? { status: 'success', reference: `REF${Math.random().toString(36).substr(2, 9)}` } : null,
        reference_number: `REF${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
        processed_at: new Date(order.created_at),
        created_at: new Date(order.created_at),
      };
      payments.push(payment);

      // Create invoice
      const invoiceNumber = `INV${new Date(order.created_at).getFullYear()}${String(index + 1).padStart(6, '0')}`;
      const subtotal = parseFloat(order.total_amount) / 1.03; // Remove GST to get subtotal
      const gstAmount = parseFloat(order.total_amount) - subtotal;
      
      const invoice = {
        id: uuidv4(),
        invoice_number: invoiceNumber,
        order_id: order.id,
        customer_id: null, // Will be linked
        invoice_type: 'sale',
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount_amount: 0,
        cgst_rate: 1.5,
        sgst_rate: 1.5,
        igst_rate: 0,
        cgst_amount: parseFloat((gstAmount / 2).toFixed(2)),
        sgst_amount: parseFloat((gstAmount / 2).toFixed(2)),
        igst_amount: 0,
        total_amount: parseFloat(order.total_amount),
        payment_terms: '30 days',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        pdf_path: `/invoices/${invoiceNumber}.pdf`,
        is_cancelled: false,
        created_at: new Date(order.created_at),
      };
      invoices.push(invoice);
    });

    // Insert payments
    console.log('\n📥 Inserting payments...');
    const paymentResult = await db.bulkInsert('payments', payments, ['payment_number'], ['amount', 'status']);
    
    // Insert invoices (need to link customer_id first)
    console.log('\n📥 Inserting invoices...');
    const orderCustomers = await db.query('SELECT id as order_id, customer_id FROM orders');
    const customerMap = {};
    orderCustomers.rows.forEach(oc => {
      customerMap[oc.order_id] = oc.customer_id;
    });
    
    invoices.forEach(invoice => {
      invoice.customer_id = customerMap[invoice.order_id];
    });
    
    const invoiceResult = await db.bulkInsert('invoices', invoices, ['invoice_number'], ['total_amount']);

    console.log('\n✅ Verifying data...');
    const finalCounts = {
      payments: await db.getRowCount('payments'),
      invoices: await db.getRowCount('invoices'),
    };
    
    console.log('   Final counts:');
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`     ${table}: ${count}`);
    });

    // Display payment method distribution
    const paymentStats = await db.query(`
      SELECT payment_method, COUNT(*) as count, SUM(amount) as total_amount
      FROM payments 
      GROUP BY payment_method 
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Payment method distribution:');
    paymentStats.rows.forEach(stat => {
      console.log(`   ${stat.payment_method.padEnd(12)} ${stat.count.toString().padEnd(6)} payments, ₹${Math.round(stat.total_amount).toLocaleString().padStart(10)}`);
    });

    console.log(chalk.green.bold('\n✅ Payments data loading completed successfully!\n'));

    return {
      success: true,
      paymentsLoaded: finalCounts.payments,
      invoicesLoaded: finalCounts.invoices,
    };

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error loading payments data:'), error.message);
    return { success: false, error: error.message };
  }
}

// Run the script if called directly
if (require.main === module) {
  loadPayments()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('❌ Unexpected error:'), error);
      process.exit(1);
    });
}

module.exports = loadPayments;