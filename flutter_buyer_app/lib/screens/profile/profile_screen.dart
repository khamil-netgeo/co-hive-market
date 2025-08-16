import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../services/supabase_service.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  Map<String, dynamic>? _profile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    if (!SupabaseService.isAuthenticated) {
      setState(() {
        _isLoading = false;
      });
      return;
    }

    try {
      final profile = await SupabaseService.getUserProfile();
      if (mounted) {
        setState(() {
          _profile = profile;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _signOut() async {
    try {
      await SupabaseService.signOut();
      if (mounted) {
        context.go('/login');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to sign out: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!SupabaseService.isAuthenticated) {
      return _buildUnauthenticatedView();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            onPressed: () {
              // TODO: Implement settings
            },
            icon: const Icon(LucideIcons.settings),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadProfile,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _buildProfileHeader(),
                    const SizedBox(height: 24),
                    _buildMenuItems(),
                    const SizedBox(height: 24),
                    _buildSignOutButton(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildUnauthenticatedView() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              LucideIcons.user,
              size: 64,
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4),
            ),
            const SizedBox(height: 16),
            const Text(
              'Sign in to access your profile',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Manage your account, orders, and preferences',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/login'),
              child: const Text('Sign In'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader() {
    final user = SupabaseService.currentUser;
    final fullName = _profile?['full_name'] as String?;
    final email = user?.email ?? '';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
        ),
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 40,
            backgroundColor: Theme.of(context).colorScheme.primary,
            child: Text(
              (fullName?.isNotEmpty == true ? fullName! : email).substring(0, 1).toUpperCase(),
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            fullName ?? 'User',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            email,
            style: TextStyle(
              fontSize: 14,
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: () {
              // TODO: Navigate to edit profile
            },
            child: const Text('Edit Profile'),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItems() {
    final menuItems = [
      ProfileMenuItem(
        icon: LucideIcons.package,
        title: 'My Orders',
        subtitle: 'Track and manage your orders',
        onTap: () => context.go('/orders'),
      ),
      ProfileMenuItem(
        icon: LucideIcons.heart,
        title: 'Favorites',
        subtitle: 'Your saved items',
        onTap: () {
          // TODO: Navigate to favorites
        },
      ),
      ProfileMenuItem(
        icon: LucideIcons.mapPin,
        title: 'Addresses',
        subtitle: 'Manage delivery addresses',
        onTap: () {
          // TODO: Navigate to addresses
        },
      ),
      ProfileMenuItem(
        icon: LucideIcons.creditCard,
        title: 'Payment Methods',
        subtitle: 'Manage cards and payment options',
        onTap: () {
          // TODO: Navigate to payment methods
        },
      ),
      ProfileMenuItem(
        icon: LucideIcons.bell,
        title: 'Notifications',
        subtitle: 'Manage your notifications',
        onTap: () {
          // TODO: Navigate to notifications settings
        },
      ),
      ProfileMenuItem(
        icon: LucideIcons.helpCircle,
        title: 'Help & Support',
        subtitle: 'Get help and contact support',
        onTap: () {
          // TODO: Navigate to support
        },
      ),
      ProfileMenuItem(
        icon: LucideIcons.info,
        title: 'About',
        subtitle: 'App version and information',
        onTap: () {
          // TODO: Show about dialog
        },
      ),
    ];

    return Column(
      children: menuItems
          .map((item) => _buildMenuItem(item))
          .toList(),
    );
  }

  Widget _buildMenuItem(ProfileMenuItem item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            item.icon,
            size: 20,
            color: Theme.of(context).colorScheme.primary,
          ),
        ),
        title: Text(
          item.title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Text(
          item.subtitle,
          style: TextStyle(
            fontSize: 14,
            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
          ),
        ),
        trailing: Icon(
          LucideIcons.chevronRight,
          size: 20,
          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4),
        ),
        onTap: item.onTap,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        tileColor: Theme.of(context).colorScheme.surface,
      ),
    );
  }

  Widget _buildSignOutButton() {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: () => _showSignOutDialog(),
        style: OutlinedButton.styleFrom(
          foregroundColor: Theme.of(context).colorScheme.error,
          side: BorderSide(color: Theme.of(context).colorScheme.error),
          padding: const EdgeInsets.symmetric(vertical: 16),
        ),
        child: const Text(
          'Sign Out',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  void _showSignOutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => context.pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              context.pop();
              _signOut();
            },
            child: Text(
              'Sign Out',
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
        ],
      ),
    );
  }
}

class ProfileMenuItem {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  ProfileMenuItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });
}