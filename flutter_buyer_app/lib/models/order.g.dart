// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'order.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Order _$OrderFromJson(Map<String, dynamic> json) => Order(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      vendorId: json['vendor_id'] as String?,
      status: $enumDecode(_$OrderStatusEnumMap, json['status']),
      totalAmountCents: json['total_amount_cents'] as int,
      shippingCents: json['shipping_cents'] as int?,
      currency: json['currency'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      estimatedDelivery: json['estimated_delivery'] == null
          ? null
          : DateTime.parse(json['estimated_delivery'] as String),
      deliveryAddress: json['delivery_address'] as String?,
      deliveryLat: (json['delivery_lat'] as num?)?.toDouble(),
      deliveryLng: (json['delivery_lng'] as num?)?.toDouble(),
      deliveryNotes: json['delivery_notes'] as String?,
      items: (json['items'] as List<dynamic>?)
          ?.map((e) => CartItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      vendorName: json['vendor_name'] as String?,
      riderId: json['rider_id'] as String?,
      riderName: json['rider_name'] as String?,
      riderPhone: json['rider_phone'] as String?,
    );

Map<String, dynamic> _$OrderToJson(Order instance) => <String, dynamic>{
      'id': instance.id,
      'user_id': instance.userId,
      'vendor_id': instance.vendorId,
      'status': _$OrderStatusEnumMap[instance.status]!,
      'total_amount_cents': instance.totalAmountCents,
      'shipping_cents': instance.shippingCents,
      'currency': instance.currency,
      'created_at': instance.createdAt.toIso8601String(),
      'updated_at': instance.updatedAt.toIso8601String(),
      'estimated_delivery': instance.estimatedDelivery?.toIso8601String(),
      'delivery_address': instance.deliveryAddress,
      'delivery_lat': instance.deliveryLat,
      'delivery_lng': instance.deliveryLng,
      'delivery_notes': instance.deliveryNotes,
      'items': instance.items,
      'vendor_name': instance.vendorName,
      'rider_id': instance.riderId,
      'rider_name': instance.riderName,
      'rider_phone': instance.riderPhone,
    };

const _$OrderStatusEnumMap = {
  OrderStatus.pending: 'pending',
  OrderStatus.confirmed: 'confirmed',
  OrderStatus.preparing: 'preparing',
  OrderStatus.ready: 'ready',
  OrderStatus.outForDelivery: 'out_for_delivery',
  OrderStatus.delivered: 'delivered',
  OrderStatus.cancelled: 'cancelled',
  OrderStatus.refunded: 'refunded',
};