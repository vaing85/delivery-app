import 'package:dio/dio.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/storage_service.dart';

class AuthService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: AppConstants.baseUrl,
    connectTimeout: Duration(milliseconds: AppConstants.apiTimeout),
    receiveTimeout: Duration(milliseconds: AppConstants.apiTimeout),
  ));

  AuthService() {
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Add auth token to requests
          final token = StorageService.getToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          // Handle 401 errors (unauthorized)
          if (error.response?.statusCode == 401) {
            // Token expired or invalid, clear storage
            StorageService.removeToken();
            StorageService.removeUser();
          }
          handler.next(error);
        },
      ),
    );
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      return {
        'success': true,
        'user': response.data['user'],
        'token': response.data['token'],
      };
    } on DioException catch (e) {
      return _handleError(e);
    } catch (e) {
      return {
        'success': false,
        'message': AppConstants.unknownError,
      };
    }
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
    required String role,
  }) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'phone': phone,
        'role': role,
      });

      return {
        'success': true,
        'user': response.data['user'],
        'token': response.data['token'],
      };
    } on DioException catch (e) {
      return _handleError(e);
    } catch (e) {
      return {
        'success': false,
        'message': AppConstants.unknownError,
      };
    }
  }

  Future<Map<String, dynamic>> refreshToken() async {
    try {
      final response = await _dio.post('/auth/refresh');

      return {
        'success': true,
        'token': response.data['token'],
      };
    } on DioException catch (e) {
      return _handleError(e);
    } catch (e) {
      return {
        'success': false,
        'message': AppConstants.unknownError,
      };
    }
  }

  Future<Map<String, dynamic>> logout() async {
    try {
      await _dio.post('/auth/logout');
      return {'success': true};
    } on DioException catch (e) {
      return _handleError(e);
    } catch (e) {
      return {
        'success': false,
        'message': AppConstants.unknownError,
      };
    }
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> updates) async {
    try {
      final response = await _dio.put('/auth/profile', data: updates);

      return {
        'success': true,
        'user': response.data['user'],
      };
    } on DioException catch (e) {
      return _handleError(e);
    } catch (e) {
      return {
        'success': false,
        'message': AppConstants.unknownError,
      };
    }
  }

  Future<Map<String, dynamic>> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    try {
      await _dio.put('/auth/change-password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });

      return {'success': true};
    } on DioException catch (e) {
      return _handleError(e);
    } catch (e) {
      return {
        'success': false,
        'message': AppConstants.unknownError,
      };
    }
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      await _dio.post('/auth/forgot-password', data: {
        'email': email,
      });

      return {'success': true};
    } on DioException catch (e) {
      return _handleError(e);
    } catch (e) {
      return {
        'success': false,
        'message': AppConstants.unknownError,
      };
    }
  }

  Future<Map<String, dynamic>> resetPassword(
    String token,
    String newPassword,
  ) async {
    try {
      await _dio.post('/auth/reset-password', data: {
        'token': token,
        'newPassword': newPassword,
      });

      return {'success': true};
    } on DioException catch (e) {
      return _handleError(e);
    } catch (e) {
      return {
        'success': false,
        'message': AppConstants.unknownError,
      };
    }
  }

  Future<Map<String, dynamic>> verifyEmail(String token) async {
    try {
      final response = await _dio.post('/auth/verify-email', data: {
        'token': token,
      });

      return {
        'success': true,
        'user': response.data['user'],
      };
    } on DioException catch (e) {
      return _handleError(e);
    } catch (e) {
      return {
        'success': false,
        'message': AppConstants.unknownError,
      };
    }
  }

  Future<Map<String, dynamic>> resendVerificationEmail() async {
    try {
      await _dio.post('/auth/resend-verification');

      return {'success': true};
    } on DioException catch (e) {
      return _handleError(e);
    } catch (e) {
      return {
        'success': false,
        'message': AppConstants.unknownError,
      };
    }
  }

  Map<String, dynamic> _handleError(DioException e) {
    String message = AppConstants.unknownError;

    if (e.response != null) {
      final data = e.response!.data;
      if (data is Map<String, dynamic> && data.containsKey('message')) {
        message = data['message'];
      } else {
        switch (e.response!.statusCode) {
          case 400:
            message = 'Bad request';
            break;
          case 401:
            message = AppConstants.invalidCredentials;
            break;
          case 403:
            message = 'Access forbidden';
            break;
          case 404:
            message = AppConstants.userNotFound;
            break;
          case 409:
            message = AppConstants.emailAlreadyExists;
            break;
          case 422:
            message = 'Validation error';
            break;
          case 500:
            message = AppConstants.serverError;
            break;
          default:
            message = AppConstants.unknownError;
        }
      }
    } else if (e.type == DioExceptionType.connectionTimeout ||
               e.type == DioExceptionType.receiveTimeout) {
      message = 'Connection timeout';
    } else if (e.type == DioExceptionType.connectionError) {
      message = AppConstants.networkError;
    }

    return {
      'success': false,
      'message': message,
    };
  }
}
