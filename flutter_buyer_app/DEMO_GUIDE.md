# 📱 CoopMarket Flutter App - Demo Guide

## 🎯 App Flow & Screen Previews

### **Authentication Flow**
```
Splash Screen → Check Auth State
    ├── Authenticated → Home Screen
    └── Not Authenticated → Login Screen
                               ├── Sign In → Home Screen
                               └── Sign Up → Registration → Home Screen
```

### **Main App Navigation**
Bottom Navigation Bar with 5 tabs:
- 🏠 **Home**: Featured products and quick actions
- 🔍 **Catalog**: Product browsing and search
- 🛒 **Cart**: Shopping cart management
- 📦 **Orders**: Order history and tracking
- 👤 **Profile**: User settings and account

## 📺 Screen Descriptions

### **1. Home Screen**
```
┌─────────────────────────────┐
│ Good Evening, CoopMarket    │ ← Greeting based on time
│ 📍 Current Location   Change│ ← Location banner
├─────────────────────────────┤
│ [🍽️ Food] [🛒 Groceries] [🔧 Services] │ ← Quick actions
├─────────────────────────────┤
│ Shop by Category            │
│ [All] [Food] [Electronics]... │ ← Category chips
├─────────────────────────────┤
│ Featured Products    View All│
│ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │Prod1│ │Prod2│ │Prod3│    │ ← Product grid
│ │$5.99│ │$12.50│ │$8.25│   │
│ └─────┘ └─────┘ └─────┘    │
└─────────────────────────────┘
```

### **2. Catalog Screen**
```
┌─────────────────────────────┐
│ Shop                    [⚙️] │
├─────────────────────────────┤
│ 🔍 Search products...    [❌] │ ← Search bar
├─────────────────────────────┤
│ [All] [Food] [Electronics]... │ ← Category filter
├─────────────────────────────┤
│ Sort by: Newest      12 items│
├─────────────────────────────┤
│ ┌──────┐  ┌──────┐         │
│ │ Prod │  │ Prod │         │ ← Product grid
│ │ $5.99│  │$12.50│         │   with infinite scroll
│ │  [+] │  │  [+] │         │
│ └──────┘  └──────┘         │
│ ┌──────┐  ┌──────┐         │
│ │ Prod │  │ Prod │         │
│ │ $8.25│  │$15.00│         │
│ │  [+] │  │  [+] │         │
│ └──────┘  └──────┘         │
└─────────────────────────────┘
```

### **3. Product Detail Screen**
```
┌─────────────────────────────┐
│ [←]              [📤] [❤️] │
├─────────────────────────────┤
│ ████████████████████████████ │ ← Image carousel
│ ████████ PRODUCT ████████████ │   with indicators
│ ████████ IMAGE ███████████████│
│ ● ○ ○                       │
├─────────────────────────────┤
│ Product Name           ⭐4.5 │
│ Short description       (23) │
│ $12.99              15 stock │
├─────────────────────────────┤
│ Description                  │
│ Detailed product information │
│ about the item...           │
├─────────────────────────────┤
│ [👤] Vendor Name   [Visit Store] │
├─────────────────────────────┤
│ Reviews            View All │
│ No reviews yet...           │
├─────────────────────────────┤
│ [- 1 +]    [Add to Cart]   │ ← Quantity & Add button
└─────────────────────────────┘
```

### **4. Cart Screen**
```
┌─────────────────────────────┐
│ Shopping Cart      Clear All │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │[IMG] Product Name       │ │
│ │     $12.99         $25.98│ │ ← Cart items
│ │     [- 2 +]        [🗑️] │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │[IMG] Another Product    │ │
│ │     $8.50          $8.50│ │
│ │     [- 1 +]        [🗑️] │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Subtotal            $34.48  │
│ Shipping calculated at checkout│
│                              │
│ [   Proceed to Checkout   ] │ ← Checkout button
└─────────────────────────────┘
```

### **5. Orders Screen**
```
┌─────────────────────────────┐
│ My Orders                   │
├─────────────────────────────┤
│ [All (5)] [Active (2)] [Completed (3)] │ ← Tabs
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ Order #AB123456  [Ready]│ │
│ │ [📦] From: Local Vendor  │ │ ← Order cards
│ │      3 items    $34.48  │ │
│ │      Dec 15, 2023    [>]│ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Order #CD789012 [Delivered]│
│ │ [📦] From: Another Store │ │
│ │      1 item     $12.99  │ │
│ │      Dec 10, 2023    [>]│ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### **6. Profile Screen**
```
┌─────────────────────────────┐
│ Profile                 [⚙️] │
├─────────────────────────────┤
│        ┌─────┐              │
│        │  J  │              │ ← User avatar
│        └─────┘              │
│      John Doe               │
│   john@example.com          │
│    [Edit Profile]           │
├─────────────────────────────┤
│ [📦] My Orders           [>] │
│      Track and manage       │
│                             │ ← Menu items
│ [❤️] Favorites           [>] │
│      Your saved items       │
│                             │
│ [📍] Addresses          [>] │
│      Manage delivery        │
│                             │
│ [💳] Payment Methods    [>] │
│      Manage cards           │
├─────────────────────────────┤
│      [Sign Out]             │ ← Sign out button
└─────────────────────────────┘
```

## 🔄 **User Journey Examples**

### **Shopping Journey**
1. User opens app → Splash screen
2. Already logged in → Home screen
3. Taps "Food" quick action → Catalog (filtered)
4. Searches "pizza" → Filtered results
5. Taps product → Product details
6. Adds to cart → Success message
7. Taps cart icon → Cart screen
8. Reviews items → Checkout

### **Order Tracking Journey**
1. User places order → Order confirmation
2. Goes to Orders tab → Order list
3. Taps active order → Order details
4. Views progress tracker → Real-time status
5. Receives updates → Push notifications

## 🎨 **Visual Features**

### **Theme & Colors**
- **Primary**: Purple (#8B5CF6)
- **Secondary**: Cyan (#06B6D4)
- **Background**: Dark theme
- **Cards**: Rounded corners, subtle shadows
- **Typography**: Inter font family

### **Animations & Interactions**
- Smooth page transitions
- Loading shimmer effects
- Pull-to-refresh animations
- Button press feedback
- Image fade-in loading

### **Responsive Elements**
- Grid layouts adapt to screen size
- Text scales appropriately
- Touch targets are optimized
- Bottom navigation stays accessible

## 📊 **Technical Highlights**

### **State Management**
```dart
// Example of state management with Riverpod
final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>((ref) {
  return CartNotifier();
});
```

### **Navigation**
```dart
// GoRouter setup for deep linking
GoRoute(
  path: '/product/:id',
  builder: (context, state) => ProductDetailScreen(
    productId: state.pathParameters['id']!
  ),
)
```

### **API Integration**
```dart
// Supabase service integration
static Future<List<Product>> getProducts({
  String? category,
  String? search,
}) async {
  var query = _client.from('products').select('*');
  // ... filtering logic
}
```

This comprehensive Flutter app provides a native mobile experience that matches the functionality of your React web application while being optimized for mobile interactions and performance.