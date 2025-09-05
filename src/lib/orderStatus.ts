// Order Status Constants - Single source of truth for all order statuses

export const ORDER_STATUS = {
  // Payment statuses
  PENDING: 'pending',
  TO_PAY: 'to_pay',
  AWAITING_PAYMENT: 'awaiting_payment',
  PAYMENT_PENDING: 'payment_pending',
  CREATED: 'created',
  UNPAID: 'unpaid',
  
  // Processing statuses
  PAID: 'paid',
  PROCESSING: 'processing',
  TO_SHIP: 'to_ship',
  AWAITING_SHIPMENT: 'awaiting_shipment',
  CONFIRMED: 'confirmed',
  PACKAGING: 'packaging',
  READY_TO_SHIP: 'ready_to_ship',
  
  // Shipping statuses
  SHIPPED: 'shipped',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  TO_RECEIVE: 'to_receive',
  
  // Completion statuses
  FULFILLED: 'fulfilled',
  COMPLETED: 'completed',
  DELIVERED: 'delivered',
  
  // Cancellation/Return statuses
  CANCELED: 'canceled',
  CANCELLED: 'cancelled',
  RETURN_REQUESTED: 'return_requested',
  REFUND_REQUESTED: 'refund_requested',
  REFUNDED: 'refunded',
  RETURNED: 'returned',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Status groups for easier filtering
export const ORDER_STATUS_GROUPS = {
  TO_PAY: [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.TO_PAY,
    ORDER_STATUS.AWAITING_PAYMENT,
    ORDER_STATUS.PAYMENT_PENDING,
    ORDER_STATUS.CREATED,
    ORDER_STATUS.UNPAID,
  ],
  TO_SHIP: [
    ORDER_STATUS.PAID,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.TO_SHIP,
    ORDER_STATUS.AWAITING_SHIPMENT,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PACKAGING,
    ORDER_STATUS.READY_TO_SHIP,
  ],
  TO_RECEIVE: [
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.IN_TRANSIT,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.TO_RECEIVE,
  ],
  COMPLETED: [
    ORDER_STATUS.FULFILLED,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.DELIVERED,
  ],
  RETURNS: [
    ORDER_STATUS.RETURN_REQUESTED,
    ORDER_STATUS.REFUND_REQUESTED,
    ORDER_STATUS.REFUNDED,
    ORDER_STATUS.RETURNED,
    ORDER_STATUS.CANCELED,
    ORDER_STATUS.CANCELLED,
  ],
} as const;

// Status display names for UI
export const ORDER_STATUS_DISPLAY = {
  [ORDER_STATUS.PENDING]: 'Pending Payment',
  [ORDER_STATUS.TO_PAY]: 'To Pay',
  [ORDER_STATUS.AWAITING_PAYMENT]: 'Awaiting Payment',
  [ORDER_STATUS.PAYMENT_PENDING]: 'Payment Pending',
  [ORDER_STATUS.CREATED]: 'Created',
  [ORDER_STATUS.UNPAID]: 'Unpaid',
  
  [ORDER_STATUS.PAID]: 'Paid',
  [ORDER_STATUS.PROCESSING]: 'Processing',
  [ORDER_STATUS.TO_SHIP]: 'To Ship',
  [ORDER_STATUS.AWAITING_SHIPMENT]: 'Awaiting Shipment',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.PACKAGING]: 'Packaging',
  [ORDER_STATUS.READY_TO_SHIP]: 'Ready to Ship',
  
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.IN_TRANSIT]: 'In Transit',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [ORDER_STATUS.TO_RECEIVE]: 'To Receive',
  
  [ORDER_STATUS.FULFILLED]: 'Fulfilled',
  [ORDER_STATUS.COMPLETED]: 'Completed',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  
  [ORDER_STATUS.CANCELED]: 'Canceled',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
  [ORDER_STATUS.RETURN_REQUESTED]: 'Return Requested',
  [ORDER_STATUS.REFUND_REQUESTED]: 'Refund Requested',
  [ORDER_STATUS.REFUNDED]: 'Refunded',
  [ORDER_STATUS.RETURNED]: 'Returned',
} as const;

// Helper functions
export function getStatusGroup(status: string): keyof typeof ORDER_STATUS_GROUPS | 'ALL' {
  const normalizedStatus = status.toLowerCase();
  
  for (const [group, statuses] of Object.entries(ORDER_STATUS_GROUPS)) {
    const statusArray = statuses as readonly string[];
    if (statusArray.includes(normalizedStatus)) {
      return group as keyof typeof ORDER_STATUS_GROUPS;
    }
  }
  
  return 'ALL';
}

export function getStatusDisplay(status: string): string {
  const normalizedStatus = status.toLowerCase();
  return ORDER_STATUS_DISPLAY[normalizedStatus as OrderStatus] || status;
}

export function isOrderInGroup(status: string, group: keyof typeof ORDER_STATUS_GROUPS): boolean {
  const normalizedStatus = status.toLowerCase();
  const statusArray = ORDER_STATUS_GROUPS[group] as readonly string[];
  return statusArray.includes(normalizedStatus);
}