import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  paymentService, 
  type Payment, 
  type CreatePaymentRequest, 
  type UpdatePaymentRequest, 
  type PaymentFilters,
  type RefundRequest 
} from '../api/services/payments';

// Query keys
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters?: PaymentFilters) => [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: number) => [...paymentKeys.details(), id] as const,
  stats: () => [...paymentKeys.all, 'stats'] as const,
  methods: () => [...paymentKeys.all, 'methods'] as const,
};

// Hooks for payments
export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => paymentService.getPayments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
  });
}

export function usePayment(id: number) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentService.getPayment(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePaymentStats() {
  return useQuery({
    queryKey: paymentKeys.stats(),
    queryFn: () => paymentService.getPaymentStats(),
    staleTime: 60 * 1000, // 1 minute  
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: paymentKeys.methods(),
    queryFn: () => paymentService.getPaymentMethods(),
    staleTime: 30 * 60 * 1000, // 30 minutes (payment methods don't change often)
  });
}

// Mutations
export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (paymentData: CreatePaymentRequest) => paymentService.createPayment(paymentData),
    onSuccess: () => {
      // Invalidate and refetch payments
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.stats() });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdatePaymentRequest }) => 
      paymentService.updatePayment(id, updates),
    onSuccess: (updatedPayment) => {
      // Update the specific payment in cache
      queryClient.setQueryData(
        paymentKeys.detail(updatedPayment.id),
        updatedPayment
      );
      
      // Invalidate payments list to refetch
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.stats() });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => paymentService.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.stats() });
    },
  });
}

export function useProcessRefund() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, refundData }: { id: number; refundData: RefundRequest }) => 
      paymentService.processRefund(id, refundData),
    onSuccess: (updatedPayment) => {
      // Update the specific payment in cache
      queryClient.setQueryData(
        paymentKeys.detail(updatedPayment.id),
        updatedPayment
      );
      
      // Invalidate payments list to refetch
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.stats() });
    },
  });
}

export function useGenerateInvoice() {
  return useMutation({
    mutationFn: (orderId: number) => paymentService.generateInvoice(orderId),
    onSuccess: (invoice) => {
      // Could trigger download or navigate to invoice view
      console.log('Invoice generated:', invoice);
    },
  });
}

export function useDownloadInvoice() {
  return useMutation({
    mutationFn: (invoiceId: number) => paymentService.downloadInvoice(invoiceId),
    onSuccess: (blob, invoiceId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}

// Razorpay Integration Hooks
export function useInitiateRazorpayPayment() {
  return useMutation({
    mutationFn: (paymentData: {
      amount: number;
      order_id: number;
      customer_details: {
        name: string;
        email: string;
        phone: string;
      };
    }) => paymentService.initiateRazorpayPayment(paymentData),
    onSuccess: (razorpayOrder) => {
      // Open Razorpay checkout
      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.razorpay_order_id,
        theme: {
          color: '#D4AF37' // Gold theme
        }
      };
      
      // Note: In a real implementation, you would load Razorpay SDK
      // and open the checkout: new Razorpay(options).open();
      console.log('Razorpay options:', options);
    },
  });
}

export function useVerifyRazorpayPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (paymentData: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => paymentService.verifyRazorpayPayment(paymentData),
    onSuccess: () => {
      // Invalidate payments to show the new successful payment
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.stats() });
    },
  });
}