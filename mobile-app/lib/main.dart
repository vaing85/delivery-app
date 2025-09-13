import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:firebase_core/firebase_core.dart';

import 'core/theme/app_theme.dart';
import 'core/constants/app_constants.dart';
import 'core/services/storage_service.dart';
import 'core/services/notification_service.dart';
import 'shared/models/user_model.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/register_screen.dart';
import 'features/dashboard/screens/dashboard_screen.dart';
import 'features/orders/screens/orders_screen.dart';
import 'features/deliveries/screens/deliveries_screen.dart';
import 'features/profile/screens/profile_screen.dart';
import 'features/notifications/screens/notifications_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Initialize Hive for local storage
  await Hive.initFlutter();
  Hive.registerAdapter(UserModelAdapter());
  
  // Initialize services
  await StorageService.init();
  await NotificationService.init();
  
  runApp(const ProviderScope(child: DeliveryApp()));
}

class DeliveryApp extends ConsumerWidget {
  const DeliveryApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    
    return MaterialApp.router(
      title: AppConstants.appName,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: _createRouter(authState),
      debugShowCheckedModeBanner: false,
    );
  }

  GoRouter _createRouter(AsyncValue<UserModel?> authState) {
    return GoRouter(
      initialLocation: '/login',
      redirect: (context, state) {
        final isLoggedIn = authState.value != null;
        final isLoggingIn = state.matchedLocation == '/login' || 
                           state.matchedLocation == '/register';
        
        if (!isLoggedIn && !isLoggingIn) {
          return '/login';
        }
        
        if (isLoggedIn && isLoggingIn) {
          return '/dashboard';
        }
        
        return null;
      },
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          builder: (context, state) => const RegisterScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const DashboardScreen(),
        ),
        GoRoute(
          path: '/orders',
          builder: (context, state) => const OrdersScreen(),
        ),
        GoRoute(
          path: '/deliveries',
          builder: (context, state) => const DeliveriesScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
        GoRoute(
          path: '/notifications',
          builder: (context, state) => const NotificationsScreen(),
        ),
      ],
    );
  }
}
