import 'package:json_annotation/json_annotation.dart';

part 'product.g.dart';

@JsonSerializable()
class Product {
  final String id;
  final String name;
  final String? subtitle;
  final String? description;
  @JsonKey(name: 'price_cents')
  final int priceCents;
  final String currency;
  @JsonKey(name: 'vendor_id')
  final String vendorId;
  @JsonKey(name: 'community_id')
  final String? communityId;
  @JsonKey(name: 'image_urls')
  final List<String>? imageUrls;
  @JsonKey(name: 'video_url')
  final String? videoUrl;
  @JsonKey(name: 'pickup_lat')
  final double? pickupLat;
  @JsonKey(name: 'pickup_lng')
  final double? pickupLng;
  @JsonKey(name: 'stock_qty')
  final int? stockQty;
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime updatedAt;
  
  // Additional fields for display
  final String? category;
  final double? rating;
  @JsonKey(name: 'review_count')
  final int? reviewCount;
  @JsonKey(name: 'vendor_name')
  final String? vendorName;

  const Product({
    required this.id,
    required this.name,
    this.subtitle,
    this.description,
    required this.priceCents,
    required this.currency,
    required this.vendorId,
    this.communityId,
    this.imageUrls,
    this.videoUrl,
    this.pickupLat,
    this.pickupLng,
    this.stockQty,
    required this.createdAt,
    required this.updatedAt,
    this.category,
    this.rating,
    this.reviewCount,
    this.vendorName,
  });

  factory Product.fromJson(Map<String, dynamic> json) => _$ProductFromJson(json);
  Map<String, dynamic> toJson() => _$ProductToJson(this);

  String get formattedPrice {
    return (priceCents / 100).toStringAsFixed(2);
  }

  String get displayPrice {
    final amount = priceCents / 100;
    return '${currency.toUpperCase()} ${amount.toStringAsFixed(2)}';
  }

  String get primaryImage {
    return imageUrls?.isNotEmpty == true 
        ? imageUrls!.first 
        : 'https://via.placeholder.com/300x300?text=No+Image';
  }

  bool get isInStock {
    return stockQty == null || stockQty! > 0;
  }

  Product copyWith({
    String? id,
    String? name,
    String? subtitle,
    String? description,
    int? priceCents,
    String? currency,
    String? vendorId,
    String? communityId,
    List<String>? imageUrls,
    String? videoUrl,
    double? pickupLat,
    double? pickupLng,
    int? stockQty,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? category,
    double? rating,
    int? reviewCount,
    String? vendorName,
  }) {
    return Product(
      id: id ?? this.id,
      name: name ?? this.name,
      subtitle: subtitle ?? this.subtitle,
      description: description ?? this.description,
      priceCents: priceCents ?? this.priceCents,
      currency: currency ?? this.currency,
      vendorId: vendorId ?? this.vendorId,
      communityId: communityId ?? this.communityId,
      imageUrls: imageUrls ?? this.imageUrls,
      videoUrl: videoUrl ?? this.videoUrl,
      pickupLat: pickupLat ?? this.pickupLat,
      pickupLng: pickupLng ?? this.pickupLng,
      stockQty: stockQty ?? this.stockQty,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      category: category ?? this.category,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
      vendorName: vendorName ?? this.vendorName,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Product && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}