import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class MainNavigation extends ConsumerStatefulWidget {
  final Widget child;
  
  const MainNavigation({
    super.key,
    required this.child,
  });

  @override
  ConsumerState<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends ConsumerState<MainNavigation> {
  int _selectedIndex = 0;

  final List<NavigationItem> _navigationItems = [
    NavigationItem(
      icon: LucideIcons.home,
      label: 'Home',
      route: '/',
    ),
    NavigationItem(
      icon: LucideIcons.search,
      label: 'Catalog',
      route: '/catalog',
    ),
    NavigationItem(
      icon: LucideIcons.shoppingCart,
      label: 'Cart',
      route: '/cart',
    ),
    NavigationItem(
      icon: LucideIcons.package,
      label: 'Orders',
      route: '/orders',
    ),
    NavigationItem(
      icon: LucideIcons.user,
      label: 'Profile',
      route: '/profile',
    ),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
    context.go(_navigationItems[index].route);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: Theme(
        data: Theme.of(context).copyWith(
          splashColor: Colors.transparent,
          highlightColor: Colors.transparent,
        ),
        child: BottomNavigationBar(
          type: BottomNavigationBarType.fixed,
          currentIndex: _selectedIndex,
          onTap: _onItemTapped,
          selectedItemColor: Theme.of(context).colorScheme.primary,
          unselectedItemColor: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
          backgroundColor: Theme.of(context).scaffoldBackgroundColor,
          elevation: 8,
          selectedLabelStyle: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
          items: _navigationItems.map((item) {
            return BottomNavigationBarItem(
              icon: Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Icon(
                  item.icon,
                  size: 24,
                ),
              ),
              activeIcon: Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  child: Icon(
                    item.icon,
                    size: 24,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ),
              label: item.label,
            );
          }).toList(),
        ),
      ),
    );
  }
}

class NavigationItem {
  final IconData icon;
  final String label;
  final String route;

  NavigationItem({
    required this.icon,
    required this.label,
    required this.route,
  });
}