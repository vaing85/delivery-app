import 'package:hive/hive.dart';

part 'user_model.g.dart';

@HiveType(typeId: 0)
class UserModel extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String email;

  @HiveField(2)
  final String? phone;

  @HiveField(3)
  final String firstName;

  @HiveField(4)
  final String lastName;

  @HiveField(5)
  final String role;

  @HiveField(6)
  final bool isActive;

  @HiveField(7)
  final bool isVerified;

  @HiveField(8)
  final String? avatar;

  @HiveField(9)
  final DateTime? dateOfBirth;

  @HiveField(10)
  final String? stripeCustomerId;

  @HiveField(11)
  final DateTime createdAt;

  @HiveField(12)
  final DateTime updatedAt;

  @HiveField(13)
  final DriverProfile? driverProfile;

  @HiveField(14)
  final CustomerProfile? customerProfile;

  UserModel({
    required this.id,
    required this.email,
    this.phone,
    required this.firstName,
    required this.lastName,
    required this.role,
    required this.isActive,
    required this.isVerified,
    this.avatar,
    this.dateOfBirth,
    this.stripeCustomerId,
    required this.createdAt,
    required this.updatedAt,
    this.driverProfile,
    this.customerProfile,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      role: json['role'] ?? 'CUSTOMER',
      isActive: json['isActive'] ?? true,
      isVerified: json['isVerified'] ?? false,
      avatar: json['avatar'],
      dateOfBirth: json['dateOfBirth'] != null 
          ? DateTime.parse(json['dateOfBirth']) 
          : null,
      stripeCustomerId: json['stripeCustomerId'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      driverProfile: json['driverProfile'] != null 
          ? DriverProfile.fromJson(json['driverProfile']) 
          : null,
      customerProfile: json['customerProfile'] != null 
          ? CustomerProfile.fromJson(json['customerProfile']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'phone': phone,
      'firstName': firstName,
      'lastName': lastName,
      'role': role,
      'isActive': isActive,
      'isVerified': isVerified,
      'avatar': avatar,
      'dateOfBirth': dateOfBirth?.toIso8601String(),
      'stripeCustomerId': stripeCustomerId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'driverProfile': driverProfile?.toJson(),
      'customerProfile': customerProfile?.toJson(),
    };
  }

  String get fullName => '$firstName $lastName';

  bool get isCustomer => role == 'CUSTOMER';
  bool get isDriver => role == 'DRIVER';
  bool get isBusiness => role == 'BUSINESS';
  bool get isAdmin => role == 'ADMIN';

  UserModel copyWith({
    String? id,
    String? email,
    String? phone,
    String? firstName,
    String? lastName,
    String? role,
    bool? isActive,
    bool? isVerified,
    String? avatar,
    DateTime? dateOfBirth,
    String? stripeCustomerId,
    DateTime? createdAt,
    DateTime? updatedAt,
    DriverProfile? driverProfile,
    CustomerProfile? customerProfile,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      role: role ?? this.role,
      isActive: isActive ?? this.isActive,
      isVerified: isVerified ?? this.isVerified,
      avatar: avatar ?? this.avatar,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      stripeCustomerId: stripeCustomerId ?? this.stripeCustomerId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      driverProfile: driverProfile ?? this.driverProfile,
      customerProfile: customerProfile ?? this.customerProfile,
    );
  }
}

@HiveType(typeId: 1)
class DriverProfile extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String userId;

  @HiveField(2)
  final String licenseNumber;

  @HiveField(3)
  final String vehicleType;

  @HiveField(4)
  final String? vehicleModel;

  @HiveField(5)
  final String? vehicleColor;

  @HiveField(6)
  final String? licensePlate;

  @HiveField(7)
  final String? insuranceInfo;

  @HiveField(8)
  final bool backgroundCheck;

  @HiveField(9)
  final bool isAvailable;

  @HiveField(10)
  final double? currentLocationLat;

  @HiveField(11)
  final double? currentLocationLng;

  @HiveField(12)
  final DateTime? lastActive;

  @HiveField(13)
  final double rating;

  @HiveField(14)
  final int totalDeliveries;

  @HiveField(15)
  final DateTime createdAt;

  @HiveField(16)
  final DateTime updatedAt;

  DriverProfile({
    required this.id,
    required this.userId,
    required this.licenseNumber,
    required this.vehicleType,
    this.vehicleModel,
    this.vehicleColor,
    this.licensePlate,
    this.insuranceInfo,
    required this.backgroundCheck,
    required this.isAvailable,
    this.currentLocationLat,
    this.currentLocationLng,
    this.lastActive,
    required this.rating,
    required this.totalDeliveries,
    required this.createdAt,
    required this.updatedAt,
  });

  factory DriverProfile.fromJson(Map<String, dynamic> json) {
    return DriverProfile(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      licenseNumber: json['licenseNumber'] ?? '',
      vehicleType: json['vehicleType'] ?? '',
      vehicleModel: json['vehicleModel'],
      vehicleColor: json['vehicleColor'],
      licensePlate: json['licensePlate'],
      insuranceInfo: json['insuranceInfo'],
      backgroundCheck: json['backgroundCheck'] ?? false,
      isAvailable: json['isAvailable'] ?? true,
      currentLocationLat: json['currentLocationLat']?.toDouble(),
      currentLocationLng: json['currentLocationLng']?.toDouble(),
      lastActive: json['lastActive'] != null 
          ? DateTime.parse(json['lastActive']) 
          : null,
      rating: (json['rating'] ?? 0.0).toDouble(),
      totalDeliveries: json['totalDeliveries'] ?? 0,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'licenseNumber': licenseNumber,
      'vehicleType': vehicleType,
      'vehicleModel': vehicleModel,
      'vehicleColor': vehicleColor,
      'licensePlate': licensePlate,
      'insuranceInfo': insuranceInfo,
      'backgroundCheck': backgroundCheck,
      'isAvailable': isAvailable,
      'currentLocationLat': currentLocationLat,
      'currentLocationLng': currentLocationLng,
      'lastActive': lastActive?.toIso8601String(),
      'rating': rating,
      'totalDeliveries': totalDeliveries,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

@HiveType(typeId: 2)
class CustomerProfile extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String userId;

  @HiveField(2)
  final String? preferences;

  @HiveField(3)
  final int totalOrders;

  @HiveField(4)
  final double totalSpent;

  @HiveField(5)
  final int loyaltyPoints;

  @HiveField(6)
  final DateTime createdAt;

  @HiveField(7)
  final DateTime updatedAt;

  CustomerProfile({
    required this.id,
    required this.userId,
    this.preferences,
    required this.totalOrders,
    required this.totalSpent,
    required this.loyaltyPoints,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CustomerProfile.fromJson(Map<String, dynamic> json) {
    return CustomerProfile(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      preferences: json['preferences'],
      totalOrders: json['totalOrders'] ?? 0,
      totalSpent: (json['totalSpent'] ?? 0.0).toDouble(),
      loyaltyPoints: json['loyaltyPoints'] ?? 0,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'preferences': preferences,
      'totalOrders': totalOrders,
      'totalSpent': totalSpent,
      'loyaltyPoints': loyaltyPoints,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
