import 'package:json_annotation/json_annotation.dart';
import 'product.dart';

part 'cart_item.g.dart';

@JsonSerializable()
class CartItem {
  final String id;
  @JsonKey(name: 'product_id')
  final String productId;
  final int quantity;
  @JsonKey(name: 'added_at')
  final DateTime addedAt;
  
  // Populated product information
  final Product? product;
  
  // Service-specific fields
  @JsonKey(name: 'selected_date')
  final DateTime? selectedDate;
  @JsonKey(name: 'selected_time')
  final String? selectedTime;
  final Map<String, dynamic>? customizations;

  const CartItem({
    required this.id,
    required this.productId,
    required this.quantity,
    required this.addedAt,
    this.product,
    this.selectedDate,
    this.selectedTime,
    this.customizations,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) => _$CartItemFromJson(json);
  Map<String, dynamic> toJson() => _$CartItemToJson(this);

  int get totalPriceCents {
    if (product == null) return 0;
    return product!.priceCents * quantity;
  }

  String get displayTotalPrice {
    if (product == null) return '';
    final amount = totalPriceCents / 100;
    return '${product!.currency.toUpperCase()} ${amount.toStringAsFixed(2)}';
  }

  CartItem copyWith({
    String? id,
    String? productId,
    int? quantity,
    DateTime? addedAt,
    Product? product,
    DateTime? selectedDate,
    String? selectedTime,
    Map<String, dynamic>? customizations,
  }) {
    return CartItem(
      id: id ?? this.id,
      productId: productId ?? this.productId,
      quantity: quantity ?? this.quantity,
      addedAt: addedAt ?? this.addedAt,
      product: product ?? this.product,
      selectedDate: selectedDate ?? this.selectedDate,
      selectedTime: selectedTime ?? this.selectedTime,
      customizations: customizations ?? this.customizations,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is CartItem && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}