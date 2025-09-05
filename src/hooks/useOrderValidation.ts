import { useMemo } from "react";
import { ORDER_STATUS_GROUPS } from "@/lib/orderStatus";

interface OrderValidationRule {
  field: string;
  message: string;
  isValid: boolean;
}

interface OrderData {
  id?: string;
  status?: string;
  total_amount_cents?: number;
  currency?: string;
  buyer_user_id?: string;
  vendor_id?: string;
  items?: Array<{
    product_id: string;
    quantity: number;
    unit_price_cents: number;
  }>;
}

/**
 * Hook for validating order data and ensuring data consistency
 * Provides comprehensive validation rules for order processing
 */
export function useOrderValidation(order?: OrderData | null) {
  const validationResults = useMemo(() => {
    if (!order) {
      return {
        isValid: false,
        errors: [],
        warnings: [],
        rules: [],
      };
    }

    const rules: OrderValidationRule[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!order.id) {
      rules.push({
        field: "id",
        message: "Order ID is required",
        isValid: false,
      });
      errors.push("Missing order ID");
    }

    if (!order.buyer_user_id) {
      rules.push({
        field: "buyer_user_id",
        message: "Buyer user ID is required",
        isValid: false,
      });
      errors.push("Missing buyer information");
    }

    if (!order.vendor_id) {
      rules.push({
        field: "vendor_id",
        message: "Vendor ID is required",
        isValid: false,
      });
      errors.push("Missing vendor information");
    }

    // Amount validation
    if (typeof order.total_amount_cents !== "number" || order.total_amount_cents <= 0) {
      rules.push({
        field: "total_amount_cents",
        message: "Total amount must be greater than 0",
        isValid: false,
      });
      errors.push("Invalid order total");
    }

    // Currency validation
    if (!order.currency || order.currency.length !== 3) {
      rules.push({
        field: "currency",
        message: "Valid currency code is required",
        isValid: false,
      });
      errors.push("Invalid currency");
    }

    // Status validation
    const allStatuses = Object.values(ORDER_STATUS_GROUPS).flat() as string[];
    if (order.status && !allStatuses.includes(order.status.toLowerCase())) {
      rules.push({
        field: "status",
        message: "Invalid order status",
        isValid: false,
      });
      warnings.push(`Unknown order status: ${order.status}`);
    }

    // Items validation
    if (!order.items || order.items.length === 0) {
      rules.push({
        field: "items",
        message: "Order must contain at least one item",
        isValid: false,
      });
      errors.push("No items in order");
    } else {
      // Validate individual items
      order.items.forEach((item, index) => {
        if (!item.product_id) {
          rules.push({
            field: `items[${index}].product_id`,
            message: "Product ID is required for all items",
            isValid: false,
          });
          errors.push(`Item ${index + 1}: Missing product ID`);
        }

        if (!item.quantity || item.quantity <= 0) {
          rules.push({
            field: `items[${index}].quantity`,
            message: "Quantity must be greater than 0",
            isValid: false,
          });
          errors.push(`Item ${index + 1}: Invalid quantity`);
        }

        if (typeof item.unit_price_cents !== "number" || item.unit_price_cents <= 0) {
          rules.push({
            field: `items[${index}].unit_price_cents`,
            message: "Unit price must be greater than 0",
            isValid: false,
          });
          errors.push(`Item ${index + 1}: Invalid price`);
        }
      });

      // Validate total amount matches items
      if (order.items.length > 0) {
        const calculatedTotal = order.items.reduce(
          (sum, item) => sum + (item.unit_price_cents * item.quantity),
          0
        );
        
        if (Math.abs(calculatedTotal - (order.total_amount_cents || 0)) > 1) {
          warnings.push("Order total doesn't match sum of items");
        }
      }
    }

    const isValid = rules.every(rule => rule.isValid);

    return {
      isValid,
      errors,
      warnings,
      rules,
    };
  }, [order]);

  return validationResults;
}