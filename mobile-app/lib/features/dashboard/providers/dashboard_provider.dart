import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/models/user_model.dart';
import '../services/dashboard_service.dart';
import '../../auth/providers/auth_provider.dart';

// Dashboard State
class DashboardState {
  final int? totalOrders;
  final int? activeDeliveries;
  final double? totalEarnings;
  final double? averageRating;
  final bool? isAvailable;
  final List<RecentActivity>? recentActivities;
  final bool isLoading;
  final String? error;

  const DashboardState({
    this.totalOrders,
    this.activeDeliveries,
    this.totalEarnings,
    this.averageRating,
    this.isAvailable,
    this.recentActivities,
    this.isLoading = false,
    this.error,
  });

  DashboardState copyWith({
    int? totalOrders,
    int? activeDeliveries,
    double? totalEarnings,
    double? averageRating,
    bool? isAvailable,
    List<RecentActivity>? recentActivities,
    bool? isLoading,
    String? error,
  }) {
    return DashboardState(
      totalOrders: totalOrders ?? this.totalOrders,
      activeDeliveries: activeDeliveries ?? this.activeDeliveries,
      totalEarnings: totalEarnings ?? this.totalEarnings,
      averageRating: averageRating ?? this.averageRating,
      isAvailable: isAvailable ?? this.isAvailable,
      recentActivities: recentActivities ?? this.recentActivities,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// Recent Activity Model
class RecentActivity {
  final String id;
  final String title;
  final String description;
  final String type;
  final DateTime timestamp;
  final String? status;
  final String? icon;

  const RecentActivity({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.timestamp,
    this.status,
    this.icon,
  });

  factory RecentActivity.fromJson(Map<String, dynamic> json) {
    return RecentActivity(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      type: json['type'] ?? '',
      timestamp: DateTime.parse(json['timestamp']),
      status: json['status'],
      icon: json['icon'],
    );
  }
}

// Dashboard Notifier
class DashboardNotifier extends StateNotifier<DashboardState> {
  final DashboardService _dashboardService;

  DashboardNotifier(this._dashboardService) : super(const DashboardState()) {
    loadDashboardData();
  }

  Future<void> loadDashboardData() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _dashboardService.getDashboardData();
      
      if (response['success']) {
        final data = response['data'];
        state = state.copyWith(
          totalOrders: data['totalOrders'],
          activeDeliveries: data['activeDeliveries'],
          totalEarnings: data['totalEarnings']?.toDouble(),
          averageRating: data['averageRating']?.toDouble(),
          isAvailable: data['isAvailable'],
          recentActivities: (data['recentActivities'] as List?)
              ?.map((activity) => RecentActivity.fromJson(activity))
              .toList(),
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response['message'] ?? 'Failed to load dashboard data',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> toggleAvailability() async {
    try {
      final response = await _dashboardService.toggleAvailability();
      
      if (response['success']) {
        state = state.copyWith(
          isAvailable: response['data']['isAvailable'],
        );
      }
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// Providers
final dashboardServiceProvider = Provider<DashboardService>((ref) {
  return DashboardService();
});

final dashboardProvider = StateNotifierProvider<DashboardNotifier, DashboardState>((ref) {
  final dashboardService = ref.watch(dashboardServiceProvider);
  return DashboardNotifier(dashboardService);
});

// Computed providers
final totalOrdersProvider = Provider<int>((ref) {
  return ref.watch(dashboardProvider).totalOrders ?? 0;
});

final activeDeliveriesProvider = Provider<int>((ref) {
  return ref.watch(dashboardProvider).activeDeliveries ?? 0;
});

final totalEarningsProvider = Provider<double>((ref) {
  return ref.watch(dashboardProvider).totalEarnings ?? 0.0;
});

final averageRatingProvider = Provider<double>((ref) {
  return ref.watch(dashboardProvider).averageRating ?? 0.0;
});

final isAvailableProvider = Provider<bool>((ref) {
  return ref.watch(dashboardProvider).isAvailable ?? false;
});

final recentActivitiesProvider = Provider<List<RecentActivity>>((ref) {
  return ref.watch(dashboardProvider).recentActivities ?? [];
});

final isLoadingProvider = Provider<bool>((ref) {
  return ref.watch(dashboardProvider).isLoading;
});

final dashboardErrorProvider = Provider<String?>((ref) {
  return ref.watch(dashboardProvider).error;
});
