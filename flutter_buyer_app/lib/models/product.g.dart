// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'product.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Product _$ProductFromJson(Map<String, dynamic> json) => Product(
      id: json['id'] as String,
      name: json['name'] as String,
      subtitle: json['subtitle'] as String?,
      description: json['description'] as String?,
      priceCents: json['price_cents'] as int,
      currency: json['currency'] as String,
      vendorId: json['vendor_id'] as String,
      communityId: json['community_id'] as String?,
      imageUrls: (json['image_urls'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      videoUrl: json['video_url'] as String?,
      pickupLat: (json['pickup_lat'] as num?)?.toDouble(),
      pickupLng: (json['pickup_lng'] as num?)?.toDouble(),
      stockQty: json['stock_qty'] as int?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      category: json['category'] as String?,
      rating: (json['rating'] as num?)?.toDouble(),
      reviewCount: json['review_count'] as int?,
      vendorName: json['vendor_name'] as String?,
    );

Map<String, dynamic> _$ProductToJson(Product instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'subtitle': instance.subtitle,
      'description': instance.description,
      'price_cents': instance.priceCents,
      'currency': instance.currency,
      'vendor_id': instance.vendorId,
      'community_id': instance.communityId,
      'image_urls': instance.imageUrls,
      'video_url': instance.videoUrl,
      'pickup_lat': instance.pickupLat,
      'pickup_lng': instance.pickupLng,
      'stock_qty': instance.stockQty,
      'created_at': instance.createdAt.toIso8601String(),
      'updated_at': instance.updatedAt.toIso8601String(),
      'category': instance.category,
      'rating': instance.rating,
      'review_count': instance.reviewCount,
      'vendor_name': instance.vendorName,
    };