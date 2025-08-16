import 'package:json_annotation/json_annotation.dart';
import 'cart_item.dart';

part 'order.g.dart';

enum OrderStatus {
  pending,
  confirmed,
  preparing,
  ready,
  @JsonValue('out_for_delivery')
  outForDelivery,
  delivered,
  cancelled,
  refunded
}

@JsonSerializable()
class Order {
  final String id;
  @JsonKey(name: 'user_id')
  final String userId;
  @JsonKey(name: 'vendor_id')
  final String? vendorId;
  final OrderStatus status;
  @JsonKey(name: 'total_amount_cents')
  final int totalAmountCents;
  @JsonKey(name: 'shipping_cents')
  final int? shippingCents;
  final String currency;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;
  @JsonKey(name: 'estimated_delivery')
  final DateTime? estimatedDelivery;
  
  // Delivery information
  @JsonKey(name: 'delivery_address')
  final String? deliveryAddress;
  @JsonKey(name: 'delivery_lat')
  final double? deliveryLat;
  @JsonKey(name: 'delivery_lng')
  final double? deliveryLng;
  @JsonKey(name: 'delivery_notes')
  final String? deliveryNotes;
  
  // Order items
  final List<CartItem>? items;
  
  // Vendor information
  @JsonKey(name: 'vendor_name')
  final String? vendorName;
  
  // Rider information
  @JsonKey(name: 'rider_id')
  final String? riderId;
  @JsonKey(name: 'rider_name')
  final String? riderName;
  @JsonKey(name: 'rider_phone')
  final String? riderPhone;

  const Order({
    required this.id,
    required this.userId,
    this.vendorId,
    required this.status,
    required this.totalAmountCents,
    this.shippingCents,
    required this.currency,
    required this.createdAt,
    required this.updatedAt,
    this.estimatedDelivery,
    this.deliveryAddress,
    this.deliveryLat,
    this.deliveryLng,
    this.deliveryNotes,
    this.items,
    this.vendorName,
    this.riderId,
    this.riderName,
    this.riderPhone,
  });

  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);
  Map<String, dynamic> toJson() => _$OrderToJson(this);

  String get displayTotalAmount {
    final amount = totalAmountCents / 100;
    return '${currency.toUpperCase()} ${amount.toStringAsFixed(2)}';
  }

  String get displayShipping {
    if (shippingCents == null) return 'Free';
    final amount = shippingCents! / 100;
    return '${currency.toUpperCase()} ${amount.toStringAsFixed(2)}';
  }

  String get statusDisplayName {
    switch (status) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.confirmed:
        return 'Confirmed';
      case OrderStatus.preparing:
        return 'Preparing';
      case OrderStatus.ready:
        return 'Ready';
      case OrderStatus.outForDelivery:
        return 'Out for Delivery';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.cancelled:
        return 'Cancelled';
      case OrderStatus.refunded:
        return 'Refunded';
    }
  }

  bool get canCancel {
    return status == OrderStatus.pending || status == OrderStatus.confirmed;
  }

  bool get canTrack {
    return status == OrderStatus.confirmed ||
        status == OrderStatus.preparing ||
        status == OrderStatus.ready ||
        status == OrderStatus.outForDelivery;
  }

  bool get isCompleted {
    return status == OrderStatus.delivered ||
        status == OrderStatus.cancelled ||
        status == OrderStatus.refunded;
  }

  Order copyWith({
    String? id,
    String? userId,
    String? vendorId,
    OrderStatus? status,
    int? totalAmountCents,
    int? shippingCents,
    String? currency,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? estimatedDelivery,
    String? deliveryAddress,
    double? deliveryLat,
    double? deliveryLng,
    String? deliveryNotes,
    List<CartItem>? items,
    String? vendorName,
    String? riderId,
    String? riderName,
    String? riderPhone,
  }) {
    return Order(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      vendorId: vendorId ?? this.vendorId,
      status: status ?? this.status,
      totalAmountCents: totalAmountCents ?? this.totalAmountCents,
      shippingCents: shippingCents ?? this.shippingCents,
      currency: currency ?? this.currency,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      estimatedDelivery: estimatedDelivery ?? this.estimatedDelivery,
      deliveryAddress: deliveryAddress ?? this.deliveryAddress,
      deliveryLat: deliveryLat ?? this.deliveryLat,
      deliveryLng: deliveryLng ?? this.deliveryLng,
      deliveryNotes: deliveryNotes ?? this.deliveryNotes,
      items: items ?? this.items,
      vendorName: vendorName ?? this.vendorName,
      riderId: riderId ?? this.riderId,
      riderName: riderName ?? this.riderName,
      riderPhone: riderPhone ?? this.riderPhone,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Order && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}