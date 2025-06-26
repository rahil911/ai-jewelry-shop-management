'use client';

import { useState, useRef } from 'react';
import {
  DocumentTextIcon,
  PrinterIcon,
  ShareIcon,
  CalendarIcon,
  UserIcon,
  CurrencyRupeeIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useGenerateInvoice } from '@/lib/hooks/useOrdersEnhanced';
import { JewelryOrder } from '@/lib/api/services/orders';

interface InvoiceData {
  id: string;
  invoice_number: string;
  order: JewelryOrder;
  business_details: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
    logo_url?: string;
  };
  customer_details: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    gstin?: string;
  };
  invoice_date: string;
  due_date: string;
  items: Array<{
    description: string;
    hsn_code: string;
    quantity: number;
    unit_price: number;
    discount: number;
    taxable_value: number;
    gst_rate: number;
    gst_amount: number;
    total: number;
  }>;
  subtotal: number;
  total_discount: number;
  taxable_amount: number;
  total_gst: number;
  round_off: number;
  total_amount: number;
  amount_in_words: string;
  payment_terms: string;
  notes?: string;
}

interface InvoiceGeneratorProps {
  order: JewelryOrder;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceGenerator({ order, isOpen, onClose }: InvoiceGeneratorProps) {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const { mutate: generateInvoice, isPending: isDownloading } = useGenerateInvoice();

  // Generate invoice data from order
  const createInvoiceData = (): InvoiceData => {
    const invoiceNumber = `INV-${order.order_number}-${Date.now().toString().slice(-4)}`;
    const items = order.items?.map(item => ({
      description: `${item.item_name} (${item.customization_details || 'Standard'})`,
      hsn_code: '7113', // Standard HSN code for jewelry
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: 0,
      taxable_value: item.unit_price * item.quantity,
      gst_rate: 3, // 3% GST for jewelry
      gst_amount: (item.unit_price * item.quantity * 0.03),
      total: item.total_price,
    })) || [];

    const subtotal = order.subtotal || 0;
    const totalGst = order.gst_amount || 0;
    const roundOff = Math.round(order.total_amount || 0) - (order.total_amount || 0);

    return {
      id: `invoice-${order.id}`,
      invoice_number: invoiceNumber,
      order,
      business_details: {
        name: 'Jewelry Shop Management System',
        address: '123 Jewelry Street, Gold District, City - 560001',
        phone: '+91-9876543210',
        email: 'info@jewelryshop.com',
        gstin: '29ABCDE1234F1Z5',
        logo_url: '/logo.png'
      },
      customer_details: {
        name: order.customer_name || 'Walk-in Customer',
        address: order.customer_address || 'Address not provided',
        phone: order.customer_phone || 'Phone not provided',
        email: order.customer_email,
      },
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items,
      subtotal,
      total_discount: 0,
      taxable_amount: subtotal,
      total_gst: totalGst,
      round_off: roundOff,
      total_amount: order.total_amount || 0,
      amount_in_words: convertToWords(order.total_amount || 0),
      payment_terms: 'Payment due within 30 days',
      notes: order.special_instructions,
    };
  };

  const convertToWords = (amount: number): string => {
    // Simplified number to words conversion for INR
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (amount === 0) return 'Zero Rupees Only';
    
    const crores = Math.floor(amount / 10000000);
    const lakhs = Math.floor((amount % 10000000) / 100000);
    const thousands = Math.floor((amount % 100000) / 1000);
    const hundreds = Math.floor((amount % 1000) / 100);
    const remainder = Math.floor(amount % 100);
    
    let result = '';
    if (crores > 0) result += `${ones[crores]} Crore `;
    if (lakhs > 0) result += `${ones[lakhs]} Lakh `;
    if (thousands > 0) result += `${ones[thousands]} Thousand `;
    if (hundreds > 0) result += `${ones[hundreds]} Hundred `;
    if (remainder > 0) {
      if (remainder < 10) result += ones[remainder];
      else if (remainder < 20) result += teens[remainder - 10];
      else result += `${tens[Math.floor(remainder / 10)]} ${ones[remainder % 10]}`;
    }
    
    return `${result.trim()} Rupees Only`;
  };

  const handleGenerateInvoice = () => {
    setIsGenerating(true);
    const data = createInvoiceData();
    setInvoiceData(data);
    setShowPreview(true);
    setIsGenerating(false);
  };

  const handleDownloadPDF = () => {
    generateInvoice(order.id);
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white min-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Invoice Generator</h3>
            <p className="text-sm text-gray-500 mt-1">Order: {order.order_number}</p>
          </div>
          <div className="flex space-x-3">
            {!showPreview ? (
              <button
                onClick={handleGenerateInvoice}
                className="btn-primary flex items-center"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Generate Invoice
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={handlePrint}
                  className="btn-outline flex items-center"
                >
                  <PrinterIcon className="h-5 w-5 mr-2" />
                  Print
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="btn-primary flex items-center"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                      Download PDF
                    </>
                  )}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="btn-outline"
            >
              Close
            </button>
          </div>
        </div>

        {/* Invoice Preview */}
        {showPreview && invoiceData ? (
          <div ref={printRef} className="bg-white p-8 border rounded-lg">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <div className="text-gray-600">
                  <p className="font-medium">Invoice #: {invoiceData.invoice_number}</p>
                  <p>Date: {new Date(invoiceData.invoice_date).toLocaleDateString('en-IN')}</p>
                  <p>Due Date: {new Date(invoiceData.due_date).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {invoiceData.business_details.name}
                </div>
                <div className="text-gray-600 text-sm">
                  <p>{invoiceData.business_details.address}</p>
                  <p>Phone: {invoiceData.business_details.phone}</p>
                  <p>Email: {invoiceData.business_details.email}</p>
                  <p>GSTIN: {invoiceData.business_details.gstin}</p>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
                <div className="text-gray-700">
                  <p className="font-medium text-lg">{invoiceData.customer_details.name}</p>
                  <p>{invoiceData.customer_details.address}</p>
                  <p>Phone: {invoiceData.customer_details.phone}</p>
                  {invoiceData.customer_details.email && (
                    <p>Email: {invoiceData.customer_details.email}</p>
                  )}
                  {invoiceData.customer_details.gstin && (
                    <p>GSTIN: {invoiceData.customer_details.gstin}</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Details:</h3>
                <div className="text-gray-700">
                  <p>Order Number: <span className="font-medium">{order.order_number}</span></p>
                  <p>Order Date: {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                  <p>Order Type: <span className="capitalize">{order.order_type}</span></p>
                  {order.estimated_completion && (
                    <p>Expected Delivery: {new Date(order.estimated_completion).toLocaleDateString('en-IN')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        S.No
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Description of Goods
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        HSN Code
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                        Qty
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Rate
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Taxable Value
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                        GST Rate
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-700">
                        GST Amount
                      </th>
                      <th className="border border-gray-300 px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                          {index + 1}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          {item.description}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                          {item.hsn_code}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                          {item.quantity}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                          {formatCurrency(item.taxable_value)}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-center">
                          {item.gst_rate}%
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-right">
                          {formatCurrency(item.gst_amount)}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-sm text-right font-medium">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Amount in Words:</h3>
                <p className="text-gray-700 italic bg-gray-50 p-4 rounded-lg">
                  {invoiceData.amount_in_words}
                </p>
              </div>
              <div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoiceData.subtotal)}</span>
                  </div>
                  {invoiceData.total_discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Discount:</span>
                      <span className="font-medium text-red-600">-{formatCurrency(invoiceData.total_discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-700">Taxable Amount:</span>
                    <span className="font-medium">{formatCurrency(invoiceData.taxable_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Total GST (3%):</span>
                    <span className="font-medium">{formatCurrency(invoiceData.total_gst)}</span>
                  </div>
                  {invoiceData.round_off !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Round Off:</span>
                      <span className="font-medium">{formatCurrency(invoiceData.round_off)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-green-600">{formatCurrency(invoiceData.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Terms & Conditions:</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>• {invoiceData.payment_terms}</p>
                  <p>• All jewelry items come with quality assurance</p>
                  <p>• Returns accepted within 7 days with original receipt</p>
                  <p>• GST as applicable as per government rules</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Authorized Signature:</h3>
                <div className="mt-16 text-center">
                  <div className="border-t border-gray-400 pt-2">
                    <p className="text-sm text-gray-700">{invoiceData.business_details.name}</p>
                    <p className="text-xs text-gray-500">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoiceData.notes && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Instructions:</h3>
                <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg">{invoiceData.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 border-t pt-4">
              <p>This is a computer-generated invoice and does not require a physical signature.</p>
              <p>Generated on {new Date().toLocaleString('en-IN')}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <DocumentTextIcon className="h-24 w-24 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">Generate Professional Invoice</h3>
            <p className="text-gray-500 text-center max-w-md">
              Create a GST-compliant invoice for order {order.order_number} with detailed itemization,
              tax calculations, and professional formatting.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                GST Compliant
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                Professional Format
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                PDF Download
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}