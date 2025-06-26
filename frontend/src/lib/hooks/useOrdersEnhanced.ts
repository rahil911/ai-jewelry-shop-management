'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  orderService, 
  JewelryOrder, 
  OrderFilters, 
  OrderStats,
  CreateOrderRequest,
  UpdateOrderRequest,
  RepairOrder,
  ReturnRequest,
  CreateRepairRequest,
  CreateReturnRequest
} from '../api/services/orders';
import { toast } from 'react-hot-toast';

// ===== ORDER QUERIES =====
export const useOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => orderService.getOrders(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useOrder = (id: number) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOrder(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: 2,
  });
};

export const useOrderStats = () => {
  return useQuery({
    queryKey: ['orderStats'],
    queryFn: () => orderService.getOrderStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Auto-refresh every 10 minutes
    retry: 2,
  });
};

// ===== ORDER MUTATIONS =====
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderData: CreateOrderRequest) => orderService.createOrder(orderData),
    onSuccess: (newOrder) => {
      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
      
      // Add the new order to cache
      queryClient.setQueryData(['order', newOrder.id], newOrder);
      
      toast.success(`Order ${newOrder.order_number} created successfully!`);
    },
    onError: (error: any) => {
      console.error('Failed to create order:', error);
      toast.error(error?.response?.data?.message || 'Failed to create order');
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateOrderRequest }) => 
      orderService.updateOrder(id, updates),
    onSuccess: (updatedOrder) => {
      // Update the specific order in cache
      queryClient.setQueryData(['order', updatedOrder.id], updatedOrder);
      
      // Update the order in the orders list
      queryClient.setQueryData(['orders'], (oldData: JewelryOrder[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        );
      });
      
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
      toast.success('Order updated successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to update order:', error);
      toast.error(error?.response?.data?.message || 'Failed to update order');
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) => 
      orderService.updateOrderStatus(id, status, notes),
    onSuccess: (updatedOrder) => {
      // Optimistic update
      queryClient.setQueryData(['order', updatedOrder.id], updatedOrder);
      
      queryClient.setQueryData(['orders'], (oldData: JewelryOrder[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        );
      });
      
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
      toast.success(`Order status updated to ${updatedOrder.status}!`);
    },
    onError: (error: any) => {
      console.error('Failed to update order status:', error);
      toast.error(error?.response?.data?.message || 'Failed to update order status');
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => 
      orderService.cancelOrder(id, reason),
    onSuccess: (cancelledOrder) => {
      queryClient.setQueryData(['order', cancelledOrder.id], cancelledOrder);
      
      queryClient.setQueryData(['orders'], (oldData: JewelryOrder[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(order => 
          order.id === cancelledOrder.id ? cancelledOrder : order
        );
      });
      
      queryClient.invalidateQueries({ queryKey: ['orderStats'] });
      toast.success('Order cancelled successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to cancel order:', error);
      toast.error(error?.response?.data?.message || 'Failed to cancel order');
    },
  });
};

export const useGenerateInvoice = () => {
  return useMutation({
    mutationFn: (orderId: number) => orderService.generateInvoice(orderId),
    onSuccess: (blob, orderId) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to generate invoice:', error);
      toast.error(error?.response?.data?.message || 'Failed to generate invoice');
    },
  });
};

// ===== REPAIR QUERIES & MUTATIONS =====
export const useRepairs = (filters?: any) => {
  return useQuery({
    queryKey: ['repairs', filters],
    queryFn: () => orderService.getRepairs(filters),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    retry: 2,
  });
};

export const useCreateRepair = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (repairData: CreateRepairRequest) => orderService.createRepair(repairData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      toast.success('Repair request created successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to create repair:', error);
      toast.error(error?.response?.data?.message || 'Failed to create repair');
    },
  });
};

export const useUpdateRepairStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) => 
      orderService.updateRepairStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      toast.success('Repair status updated successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to update repair status:', error);
      toast.error(error?.response?.data?.message || 'Failed to update repair status');
    },
  });
};

// ===== RETURN QUERIES & MUTATIONS =====
export const useReturns = (filters?: any) => {
  return useQuery({
    queryKey: ['returns', filters],
    queryFn: () => orderService.getReturns(filters),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
    retry: 2,
  });
};

export const useCreateReturn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (returnData: CreateReturnRequest) => orderService.createReturn(returnData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Return request created successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to create return:', error);
      toast.error(error?.response?.data?.message || 'Failed to create return');
    },
  });
};

export const useApproveReturn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, approved, notes }: { id: number; approved: boolean; notes?: string }) => 
      orderService.approveReturn(id, approved, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      toast.success('Return request processed successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to approve return:', error);
      toast.error(error?.response?.data?.message || 'Failed to process return');
    },
  });
};

// ===== NOTIFICATION MUTATIONS =====
export const useSendNotification = () => {
  return useMutation({
    mutationFn: (data: {
      customer_id: number;
      message: string;
      channels: ('whatsapp' | 'sms' | 'email')[];
      template?: string;
    }) => orderService.sendNotification(data),
    onSuccess: () => {
      toast.success('Notification sent successfully!');
    },
    onError: (error: any) => {
      console.error('Failed to send notification:', error);
      toast.error(error?.response?.data?.message || 'Failed to send notification');
    },
  });
};

// ===== UTILITY HOOKS =====
export const useOrderActions = () => {
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();
  const generateInvoice = useGenerateInvoice();
  const sendNotification = useSendNotification();
  
  return {
    updateStatus: updateStatus.mutate,
    cancelOrder: cancelOrder.mutate,
    generateInvoice: generateInvoice.mutate,
    sendNotification: sendNotification.mutate,
    isLoading: updateStatus.isPending || cancelOrder.isPending || generateInvoice.isPending || sendNotification.isPending,
  };
};