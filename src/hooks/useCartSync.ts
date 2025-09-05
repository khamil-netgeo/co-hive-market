import { useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, type CartItem } from "@/hooks/useCart";
import { toast } from "sonner";

interface DatabaseCartItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
  products?: {
    name: string;
    status: string;
    vendor_id: string;
    community_id: string;
    currency: string;
    image_urls?: string[];
  };
}

/**
 * Cart synchronization hook
 * Handles syncing cart between local storage and database
 */
export function useCartSync() {
  const cart = useCart();

  // Sync local cart to database
  const syncToDatabase = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Clear existing cart items for this user
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      // Insert current cart items
      if (cart.items.length > 0) {
        const cartItemsToInsert = cart.items.map(item => ({
          user_id: user.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_cents: item.price_cents,
        }));

        const { error } = await supabase
          .from('cart_items')
          .insert(cartItemsToInsert);

        if (error) {
          console.error('Cart sync error:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Cart sync to database failed:', error);
      return false;
    }
  }, [cart.items]);

  // Load cart from database
  const loadFromDatabase = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          unit_price_cents,
          products:product_id (
            name,
            status,
            vendor_id,
            community_id,
            currency,
            image_urls
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Cart load error:', error);
        return false;
      }

      // Clear local cart first
      cart.clear();

      // Add items from database to local cart
      if (cartItems && cartItems.length > 0) {
        for (const item of cartItems) {
          const product = item.products as DatabaseCartItem['products'];
          
          // Check if product is still active
          if (product && product.status === 'active') {
            cart.add({
              product_id: item.product_id,
              name: product.name,
              price_cents: item.unit_price_cents,
              currency: product.currency,
              vendor_id: product.vendor_id,
              community_id: product.community_id,
            }, item.quantity);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Cart load from database failed:', error);
      return false;
    }
  }, [cart]);

  // Validate cart against current product data
  const validateCart = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cart.items.length === 0) return true;

      const productIds = cart.items.map(item => item.product_id);
      
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, status, price_cents, currency')
        .in('id', productIds);

      if (error) {
        console.error('Cart validation error:', error);
        return false;
      }

      let hasChanges = false;
      const productsMap = new Map(products?.map(p => [p.id, p]) || []);

      // Check each cart item
      for (const cartItem of cart.items) {
        const currentProduct = productsMap.get(cartItem.product_id);
        
        if (!currentProduct) {
          // Product no longer exists
          cart.remove(cartItem.product_id);
          hasChanges = true;
          toast.warning(`${cartItem.name} is no longer available and was removed from your cart`);
        } else if (currentProduct.status !== 'active') {
          // Product is inactive
          cart.remove(cartItem.product_id);
          hasChanges = true;
          toast.warning(`${cartItem.name} is no longer available and was removed from your cart`);
        } else if (currentProduct.price_cents !== cartItem.price_cents) {
          // Price has changed - we need to remove and re-add with new price
          cart.remove(cartItem.product_id);
          cart.add({
            product_id: cartItem.product_id,
            name: cartItem.name,
            price_cents: currentProduct.price_cents,
            currency: cartItem.currency,
            vendor_id: cartItem.vendor_id,
            community_id: cartItem.community_id,
          }, cartItem.quantity);
          hasChanges = true;
          toast.info(`Price for ${cartItem.name} has been updated`);
        }
      }

      // Sync changes back to database if any
      if (hasChanges) {
        await syncToDatabase();
      }

      return true;
    } catch (error) {
      console.error('Cart validation failed:', error);
      return false;
    }
  }, [cart, syncToDatabase]);

  // Auto-sync when user logs in/out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // User signed in, load cart from database
        await loadFromDatabase();
      } else if (event === 'SIGNED_OUT') {
        // User signed out, clear local cart
        cart.clear();
      }
    });

    return () => subscription.unsubscribe();
  }, [loadFromDatabase, cart]);

  // Periodically sync cart to database when user is logged in
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && cart.items.length > 0) {
        await syncToDatabase();
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(interval);
  }, [syncToDatabase, cart.items.length]);

  return {
    syncToDatabase,
    loadFromDatabase,
    validateCart,
  };
}
