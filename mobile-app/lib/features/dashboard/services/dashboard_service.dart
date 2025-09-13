import 'package:dio/dio.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/services/storage_service.dart';

class DashboardService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: AppConstants.baseUrl,
    connectTimeout: Duration(milliseconds: AppConstants.apiTimeout),
    receiveTimeout: Duration(milliseconds: AppConstants.apiTimeout),
  ));

  DashboardService() {
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

  Future<Map<String, dynamic>> getDashboardData() async {
    try {
      final response = await _dio.get('/dashboard');

      return {
        'success': true,
        'data': response.data,
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

  Future<Map<String, dynamic>> toggleAvailability() async {
    try {
      final response = await _dio.put('/driver/toggle-availability');

      return {
        'success': true,
        'data': response.data,
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

  Future<Map<String, dynamic>> getDriverStats() async {
    try {
      final response = await _dio.get('/driver/stats');

      return {
        'success': true,
        'data': response.data,
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

  Future<Map<String, dynamic>> getBusinessStats() async {
    try {
      final response = await _dio.get('/business/stats');

      return {
        'success': true,
        'data': response.data,
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

  Future<Map<String, dynamic>> getAdminStats() async {
    try {
      final response = await _dio.get('/admin/stats');

      return {
        'success': true,
        'data': response.data,
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

  Future<Map<String, dynamic>> getRecentActivities() async {
    try {
      final response = await _dio.get('/dashboard/recent-activities');

      return {
        'success': true,
        'data': response.data,
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
            message = 'Data not found';
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
