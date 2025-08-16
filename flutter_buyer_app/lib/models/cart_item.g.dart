// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cart_item.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CartItem _$CartItemFromJson(Map<String, dynamic> json) => CartItem(
      id: json['id'] as String,
      productId: json['product_id'] as String,
      quantity: json['quantity'] as int,
      addedAt: DateTime.parse(json['added_at'] as String),
      product: json['product'] == null
          ? null
          : Product.fromJson(json['product'] as Map<String, dynamic>),
      selectedDate: json['selected_date'] == null
          ? null
          : DateTime.parse(json['selected_date'] as String),
      selectedTime: json['selected_time'] as String?,
      customizations: json['customizations'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$CartItemToJson(CartItem instance) => <String, dynamic>{
      'id': instance.id,
      'product_id': instance.productId,
      'quantity': instance.quantity,
      'added_at': instance.addedAt.toIso8601String(),
      'product': instance.product,
      'selected_date': instance.selectedDate?.toIso8601String(),
      'selected_time': instance.selectedTime,
      'customizations': instance.customizations,
    };