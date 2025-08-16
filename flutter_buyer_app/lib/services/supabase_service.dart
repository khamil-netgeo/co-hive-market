import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/product.dart';
import '../models/cart_item.dart';
import '../models/order.dart';

class SupabaseService {
  static final SupabaseClient _client = Supabase.instance.client;
  
  // Authentication
  static Future<AuthResponse> signUp(String email, String password) async {
    return await _client.auth.signUp(email: email, password: password);
  }

  static Future<AuthResponse> signIn(String email, String password) async {
    return await _client.auth.signInWithPassword(email: email, password: password);
  }

  static Future<void> signOut() async {
    await _client.auth.signOut();
  }

  static Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;
  
  static User? get currentUser => _client.auth.currentUser;
  
  static bool get isAuthenticated => currentUser != null;

  // Products
  static Future<List<Product>> getProducts({
    int limit = 20,
    int offset = 0,
    String? category,
    String? search,
    String? sortBy = 'created_at',
    bool descending = true,
  }) async {
    var query = _client
        .from('products')
        .select('''
          *,
          profiles!products_vendor_id_fkey(full_name),
          product_categories!inner(categories!inner(name))
        ''');

    if (category != null && category.isNotEmpty) {
      query = query.eq('product_categories.categories.name', category);
    }

    if (search != null && search.isNotEmpty) {
      query = query.or('name.ilike.%$search%,description.ilike.%$search%');
    }

    query = query
        .order(sortBy, ascending: !descending)
        .range(offset, offset + limit - 1);

    final response = await query;
    
    return response.map((json) {
      // Add vendor name and category from joined data
      final vendorName = json['profiles']?['full_name'] as String?;
      final categories = json['product_categories'] as List?;
      final category = categories?.isNotEmpty == true 
          ? categories!.first['categories']?['name'] as String?
          : null;
      
      json['vendor_name'] = vendorName;
      json['category'] = category;
      
      return Product.fromJson(json);
    }).toList();
  }

  static Future<Product?> getProduct(String productId) async {
    final response = await _client
        .from('products')
        .select('''
          *,
          profiles!products_vendor_id_fkey(full_name),
          product_categories!inner(categories!inner(name)),
          product_reviews(rating)
        ''')
        .eq('id', productId)
        .maybeSingle();

    if (response == null) return null;

    // Calculate average rating
    final reviews = response['product_reviews'] as List?;
    double? averageRating;
    if (reviews != null && reviews.isNotEmpty) {
      final ratings = reviews
          .map((review) => (review['rating'] as num?)?.toDouble() ?? 0)
          .where((rating) => rating > 0);
      if (ratings.isNotEmpty) {
        averageRating = ratings.reduce((a, b) => a + b) / ratings.length;
      }
    }

    // Add calculated fields
    response['vendor_name'] = response['profiles']?['full_name'];
    response['rating'] = averageRating;
    response['review_count'] = reviews?.length ?? 0;
    
    final categories = response['product_categories'] as List?;
    response['category'] = categories?.isNotEmpty == true 
        ? categories!.first['categories']?['name'] as String?
        : null;

    return Product.fromJson(response);
  }

  // Cart operations
  static Future<List<CartItem>> getCartItems() async {
    final userId = currentUser?.id;
    if (userId == null) return [];

    final response = await _client
        .from('cart_items')
        .select('''
          *,
          products(*)
        ''')
        .eq('user_id', userId)
        .order('added_at', ascending: false);

    return response.map((json) {
      if (json['products'] != null) {
        json['product'] = Product.fromJson(json['products']);
      }
      return CartItem.fromJson(json);
    }).toList();
  }

  static Future<void> addToCart(String productId, int quantity) async {
    final userId = currentUser?.id;
    if (userId == null) throw Exception('User not authenticated');

    // Check if item already exists in cart
    final existingItem = await _client
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

    if (existingItem != null) {
      // Update quantity
      await _client
          .from('cart_items')
          .update({'quantity': existingItem['quantity'] + quantity})
          .eq('id', existingItem['id']);
    } else {
      // Add new item
      await _client.from('cart_items').insert({
        'user_id': userId,
        'product_id': productId,
        'quantity': quantity,
      });
    }
  }

  static Future<void> updateCartItemQuantity(String cartItemId, int quantity) async {
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    await _client
        .from('cart_items')
        .update({'quantity': quantity})
        .eq('id', cartItemId);
  }

  static Future<void> removeFromCart(String cartItemId) async {
    await _client
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);
  }

  static Future<void> clearCart() async {
    final userId = currentUser?.id;
    if (userId == null) return;

    await _client
        .from('cart_items')
        .delete()
        .eq('user_id', userId);
  }

  // Orders
  static Future<List<Order>> getOrders({
    int limit = 20,
    int offset = 0,
    OrderStatus? status,
  }) async {
    final userId = currentUser?.id;
    if (userId == null) return [];

    var query = _client
        .from('orders')
        .select('''
          *,
          profiles!orders_vendor_id_fkey(full_name),
          order_items(
            *,
            products(*)
          )
        ''')
        .eq('user_id', userId);

    if (status != null) {
      query = query.eq('status', status.toString().split('.').last);
    }

    query = query
        .order('created_at', ascending: false)
        .range(offset, offset + limit - 1);

    final response = await query;

    return response.map((json) {
      // Process order items
      final orderItems = (json['order_items'] as List?)?.map((item) {
        if (item['products'] != null) {
          item['product'] = Product.fromJson(item['products']);
        }
        return CartItem.fromJson(item);
      }).toList();

      json['items'] = orderItems;
      json['vendor_name'] = json['profiles']?['full_name'];

      return Order.fromJson(json);
    }).toList();
  }

  static Future<Order?> getOrder(String orderId) async {
    final response = await _client
        .from('orders')
        .select('''
          *,
          profiles!orders_vendor_id_fkey(full_name),
          order_items(
            *,
            products(*)
          )
        ''')
        .eq('id', orderId)
        .maybeSingle();

    if (response == null) return null;

    // Process order items
    final orderItems = (response['order_items'] as List?)?.map((item) {
      if (item['products'] != null) {
        item['product'] = Product.fromJson(item['products']);
      }
      return CartItem.fromJson(item);
    }).toList();

    response['items'] = orderItems;
    response['vendor_name'] = response['profiles']?['full_name'];

    return Order.fromJson(response);
  }

  static Future<String> createOrder(Map<String, dynamic> orderData) async {
    final userId = currentUser?.id;
    if (userId == null) throw Exception('User not authenticated');

    orderData['user_id'] = userId;
    
    final response = await _client
        .from('orders')
        .insert(orderData)
        .select('id')
        .single();

    return response['id'] as String;
  }

  // Categories
  static Future<List<String>> getCategories() async {
    final response = await _client
        .from('categories')
        .select('name')
        .order('name');

    return response.map((json) => json['name'] as String).toList();
  }

  // User Profile
  static Future<Map<String, dynamic>?> getUserProfile() async {
    final userId = currentUser?.id;
    if (userId == null) return null;

    return await _client
        .from('profiles')
        .select()
        .eq('id', userId)
        .maybeSingle();
  }

  static Future<void> updateUserProfile(Map<String, dynamic> profileData) async {
    final userId = currentUser?.id;
    if (userId == null) throw Exception('User not authenticated');

    await _client
        .from('profiles')
        .upsert({...profileData, 'id': userId});
  }
}