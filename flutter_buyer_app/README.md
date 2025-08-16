# CoopMarket Buyer App

A Flutter mobile application for buyers on the CoopMarket platform. This app allows users to browse products, manage their cart, place orders, and track deliveries from local vendors.

## 🎯 Features

### Core Buyer Features
- **Product Browsing**: Browse and search through products with filters and categories
- **Product Details**: View detailed product information, images, and vendor details
- **Shopping Cart**: Add items to cart, manage quantities, and proceed to checkout
- **Order Management**: Place orders, track order status, and view order history
- **User Authentication**: Secure login and registration with Supabase
- **Profile Management**: Manage user profile, addresses, and payment methods

### Design & UX
- **Dark Theme**: Modern dark theme matching the web application
- **Responsive Design**: Optimized for various screen sizes
- **Material Design**: Clean and intuitive UI following Material Design principles
- **Smooth Navigation**: Bottom tab navigation with seamless transitions

## 🏗️ Architecture

### Project Structure
```
lib/
├── main.dart                 # App entry point
├── models/                   # Data models
│   ├── product.dart         # Product model
│   ├── cart_item.dart       # Cart item model
│   ├── order.dart           # Order model
│   └── *.g.dart            # Generated JSON serialization
├── screens/                 # App screens
│   ├── auth/               # Authentication screens
│   ├── catalog/            # Product catalog
│   ├── product/            # Product details
│   ├── cart/               # Shopping cart
│   ├── orders/             # Order management
│   ├── profile/            # User profile
│   ├── home_screen.dart    # Home/dashboard
│   ├── main_navigation.dart # Bottom navigation
│   └── splash_screen.dart   # Splash screen
├── widgets/                 # Reusable widgets
│   ├── product_card.dart   # Product display card
│   ├── cart_item_card.dart # Cart item display
│   ├── order_card.dart     # Order display card
│   └── category_chip.dart  # Category filter chip
├── services/               # Business logic & API
│   ├── supabase_service.dart # Supabase integration
│   └── navigation_service.dart # Navigation configuration
└── utils/                  # Utilities
    └── theme.dart          # App theme configuration
```

### Tech Stack
- **Framework**: Flutter 3.16+
- **State Management**: Riverpod
- **Navigation**: GoRouter
- **Backend**: Supabase (Authentication, Database, Storage)
- **Local Storage**: Hive + SharedPreferences
- **Image Handling**: CachedNetworkImage
- **Icons**: Lucide Icons Flutter

## 🚀 Getting Started

### Prerequisites
- Flutter SDK (3.16 or higher)
- Dart SDK (3.2 or higher)
- Android Studio / VS Code with Flutter plugin
- Supabase project with proper configuration

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flutter_buyer_app
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Generate code**
   ```bash
   flutter packages pub run build_runner build
   ```

4. **Configure Supabase**
   - Create a `.env` file or configure environment variables:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the application**
   ```bash
   flutter run
   ```

## 📱 Screens Overview

### Authentication Flow
- **Splash Screen**: App initialization and auth check
- **Login Screen**: User authentication
- **Signup Screen**: New user registration

### Main App Flow
- **Home Screen**: Featured products, categories, quick actions
- **Catalog Screen**: Product browsing with search and filters
- **Product Detail Screen**: Detailed product view with cart functionality
- **Cart Screen**: Shopping cart management
- **Orders Screen**: Order history and tracking
- **Profile Screen**: User profile and settings

## 🔧 Key Components

### Supabase Integration
The app integrates with Supabase for:
- User authentication (sign up, sign in, sign out)
- Product catalog management
- Cart operations (add, update, remove items)
- Order placement and tracking
- User profile management

### State Management
Using Riverpod for:
- Authentication state
- Cart state management
- API call management
- UI state updates

### Navigation
GoRouter provides:
- Declarative routing
- Deep linking support
- Guard routes for authentication
- Smooth transitions between screens

## 🎨 Design System

### Theme
- **Primary Color**: Purple (#8B5CF6)
- **Secondary Color**: Cyan (#06B6D4)
- **Background**: Dark theme with proper contrast ratios
- **Typography**: Inter font family
- **Spacing**: Consistent 8px grid system

### Components
- Reusable card components for products and orders
- Consistent button styling
- Material Design input fields
- Custom app bars and navigation

## 📦 Dependencies

### Core Dependencies
- `flutter_riverpod`: State management
- `supabase_flutter`: Backend integration
- `go_router`: Navigation
- `cached_network_image`: Image handling
- `shared_preferences`: Local storage

### UI Dependencies
- `lucide_icons_flutter`: Icon library
- `carousel_slider`: Image carousel
- `shimmer`: Loading animations
- `flutter_staggered_grid_view`: Grid layouts

### Development Dependencies
- `json_serializable`: Code generation
- `build_runner`: Build system
- `flutter_lints`: Code analysis

## 🔮 Future Enhancements

### Features to Implement
- [ ] Push notifications for order updates
- [ ] Wishlist/Favorites functionality
- [ ] Multiple delivery addresses
- [ ] Payment integration (Stripe)
- [ ] Product reviews and ratings
- [ ] Social features (sharing, recommendations)
- [ ] Offline support with local caching
- [ ] Advanced search and filtering
- [ ] Barcode scanning for products
- [ ] Location-based vendor discovery

### Technical Improvements
- [ ] Unit and integration tests
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Internationalization (i18n)
- [ ] Advanced error handling
- [ ] Analytics integration
- [ ] App store deployment configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

---

**Note**: This is a companion mobile app to the CoopMarket web application, designed specifically for buyers to have a seamless mobile shopping experience.