import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Placeholder hook to satisfy imports - can be enhanced later
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: () => Promise.resolve([]),
    enabled: false // Disabled for now
  });
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => Promise.resolve(null),
    enabled: false
  });
}