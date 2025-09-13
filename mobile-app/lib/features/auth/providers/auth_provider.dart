import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/services/notification_service.dart';
import '../../../core/constants/app_constants.dart';
import '../../../shared/models/user_model.dart';
import '../services/auth_service.dart';

// Auth State
class AuthState {
  final UserModel? user;
  final bool isLoading;
  final String? error;
  final bool isAuthenticated;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    String? error,
    bool? isAuthenticated,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

// Auth Notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(const AuthState()) {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    final user = StorageService.getUser();
    final token = StorageService.getToken();
    
    if (user != null && token != null) {
      state = state.copyWith(
        user: user,
        isAuthenticated: true,
      );
      
      // Subscribe to user-specific notification topics
      await NotificationService.subscribeToUserTopics(user.id, user.role);
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _authService.login(email, password);
      
      if (response['success']) {
        final user = UserModel.fromJson(response['user']);
        final token = response['token'];

        // Save user data and token
        await StorageService.saveUser(user);
        await StorageService.saveToken(token);

        // Subscribe to notification topics
        await NotificationService.subscribeToUserTopics(user.id, user.role);

        state = state.copyWith(
          user: user,
          isAuthenticated: true,
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response['message'] ?? AppConstants.unknownError,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
    required String role,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _authService.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        role: role,
      );

      if (response['success']) {
        final user = UserModel.fromJson(response['user']);
        final token = response['token'];

        // Save user data and token
        await StorageService.saveUser(user);
        await StorageService.saveToken(token);

        // Subscribe to notification topics
        await NotificationService.subscribeToUserTopics(user.id, user.role);

        state = state.copyWith(
          user: user,
          isAuthenticated: true,
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response['message'] ?? AppConstants.unknownError,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> logout() async {
    try {
      final user = state.user;
      
      if (user != null) {
        // Unsubscribe from notification topics
        await NotificationService.unsubscribeFromUserTopics(user.id, user.role);
      }

      // Clear stored data
      await StorageService.removeUser();
      await StorageService.removeToken();

      state = const AuthState();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> refreshToken() async {
    try {
      final response = await _authService.refreshToken();
      
      if (response['success']) {
        final token = response['token'];
        await StorageService.saveToken(token);
      } else {
        // Token refresh failed, logout user
        await logout();
      }
    } catch (e) {
      // Token refresh failed, logout user
      await logout();
    }
  }

  Future<void> updateProfile(Map<String, dynamic> updates) async {
    if (state.user == null) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _authService.updateProfile(updates);
      
      if (response['success']) {
        final updatedUser = UserModel.fromJson(response['user']);
        await StorageService.saveUser(updatedUser);
        
        state = state.copyWith(
          user: updatedUser,
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response['message'] ?? AppConstants.unknownError,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _authService.changePassword(currentPassword, newPassword);
      
      if (response['success']) {
        state = state.copyWith(isLoading: false);
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response['message'] ?? AppConstants.unknownError,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> forgotPassword(String email) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _authService.forgotPassword(email);
      
      if (response['success']) {
        state = state.copyWith(isLoading: false);
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response['message'] ?? AppConstants.unknownError,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// Providers
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return AuthNotifier(authService);
});

// Computed providers
final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).user;
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});

final isLoadingProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isLoading;
});

final authErrorProvider = Provider<String?>((ref) {
  return ref.watch(authProvider).error;
});

// Role-based providers
final isCustomerProvider = Provider<bool>((ref) {
  final user = ref.watch(currentUserProvider);
  return user?.isCustomer ?? false;
});

final isDriverProvider = Provider<bool>((ref) {
  final user = ref.watch(currentUserProvider);
  return user?.isDriver ?? false;
});

final isBusinessProvider = Provider<bool>((ref) {
  final user = ref.watch(currentUserProvider);
  return user?.isBusiness ?? false;
});

final isAdminProvider = Provider<bool>((ref) {
  final user = ref.watch(currentUserProvider);
  return user?.isAdmin ?? false;
});
