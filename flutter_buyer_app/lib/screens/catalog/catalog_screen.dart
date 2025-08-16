import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../services/supabase_service.dart';
import '../../models/product.dart';
import '../../widgets/product_card.dart';
import '../../widgets/category_chip.dart';

class CatalogScreen extends ConsumerStatefulWidget {
  const CatalogScreen({super.key});

  @override
  ConsumerState<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends ConsumerState<CatalogScreen> {
  final _searchController = TextEditingController();
  List<Product> _products = [];
  List<String> _categories = [];
  String? _selectedCategory;
  String _searchQuery = '';
  String _sortBy = 'created_at';
  bool _isLoading = true;
  bool _hasMore = true;
  int _offset = 0;
  final int _limit = 20;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    try {
      final [products, categories] = await Future.wait([
        SupabaseService.getProducts(
          limit: _limit,
          offset: 0,
          sortBy: _sortBy,
        ),
        SupabaseService.getCategories(),
      ]);

      if (mounted) {
        setState(() {
          _products = products as List<Product>;
          _categories = categories as List<String>;
          _isLoading = false;
          _hasMore = _products.length >= _limit;
          _offset = _products.length;
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

  Future<void> _loadProducts({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _isLoading = true;
        _offset = 0;
        _hasMore = true;
      });
    }

    try {
      final products = await SupabaseService.getProducts(
        limit: _limit,
        offset: refresh ? 0 : _offset,
        category: _selectedCategory,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        sortBy: _sortBy,
      );

      if (mounted) {
        setState(() {
          if (refresh) {
            _products = products;
          } else {
            _products.addAll(products);
          }
          _isLoading = false;
          _hasMore = products.length >= _limit;
          _offset = _products.length;
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

  void _onCategorySelected(String? category) {
    if (_selectedCategory != category) {
      setState(() {
        _selectedCategory = category;
      });
      _loadProducts(refresh: true);
    }
  }

  void _onSearchChanged(String value) {
    setState(() {
      _searchQuery = value;
    });
    
    // Debounce search
    Future.delayed(const Duration(milliseconds: 500), () {
      if (_searchQuery == value) {
        _loadProducts(refresh: true);
      }
    });
  }

  void _onSortChanged(String sortBy) {
    setState(() {
      _sortBy = sortBy;
    });
    _loadProducts(refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Shop'),
        actions: [
          IconButton(
            onPressed: () {
              // TODO: Implement filters
            },
            icon: const Icon(LucideIcons.sliders3),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildCategoriesFilter(),
          _buildSortOptions(),
          Expanded(
            child: _buildProductsList(),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: TextField(
        controller: _searchController,
        onChanged: _onSearchChanged,
        decoration: InputDecoration(
          hintText: 'Search products...',
          prefixIcon: const Icon(LucideIcons.search),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  onPressed: () {
                    _searchController.clear();
                    _onSearchChanged('');
                  },
                  icon: const Icon(LucideIcons.x),
                )
              : null,
        ),
      ),
    );
  }

  Widget _buildCategoriesFilter() {
    if (_categories.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 56,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _categories.length + 1, // +1 for "All" option
        itemBuilder: (context, index) {
          if (index == 0) {
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: CategoryChip(
                category: 'All',
                isSelected: _selectedCategory == null,
                onTap: () => _onCategorySelected(null),
              ),
            );
          }

          final category = _categories[index - 1];
          return Padding(
            padding: EdgeInsets.only(
              right: index == _categories.length ? 0 : 8,
            ),
            child: CategoryChip(
              category: category,
              isSelected: _selectedCategory == category,
              onTap: () => _onCategorySelected(category),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSortOptions() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Text(
            'Sort by:',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
          const SizedBox(width: 8),
          DropdownButton<String>(
            value: _sortBy,
            onChanged: (value) => _onSortChanged(value!),
            underline: const SizedBox.shrink(),
            items: const [
              DropdownMenuItem(value: 'created_at', child: Text('Newest')),
              DropdownMenuItem(value: 'name', child: Text('Name')),
              DropdownMenuItem(value: 'price_cents', child: Text('Price')),
            ],
          ),
          const Spacer(),
          Text(
            '${_products.length} items',
            style: TextStyle(
              fontSize: 14,
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductsList() {
    if (_isLoading && _products.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_products.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              LucideIcons.searchX,
              size: 64,
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.4),
            ),
            const SizedBox(height: 16),
            const Text(
              'No products found',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Try adjusting your search or filters',
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadProducts(refresh: true),
      child: NotificationListener<ScrollNotification>(
        onNotification: (scrollInfo) {
          if (!_isLoading && 
              _hasMore && 
              scrollInfo.metrics.pixels == scrollInfo.metrics.maxScrollExtent) {
            _loadProducts();
          }
          return false;
        },
        child: GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.75,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: _products.length + (_hasMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == _products.length) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(),
                ),
              );
            }

            final product = _products[index];
            return ProductCard(
              product: product,
              onTap: () => context.go('/product/${product.id}'),
              onAddToCart: () async {
                try {
                  await SupabaseService.addToCart(product.id, 1);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('${product.name} added to cart'),
                        action: SnackBarAction(
                          label: 'View Cart',
                          onPressed: () => context.go('/cart'),
                        ),
                      ),
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Failed to add to cart: $e'),
                        backgroundColor: Theme.of(context).colorScheme.error,
                      ),
                    );
                  }
                }
              },
            );
          },
        ),
      ),
    );
  }
}