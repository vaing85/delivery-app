import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import '../constants/app_constants.dart';

class NotificationService {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  static Future<void> init() async {
    // Request permission for notifications
    await _requestPermission();
    
    // Initialize local notifications
    await _initLocalNotifications();
    
    // Initialize Firebase messaging
    await _initFirebaseMessaging();
  }

  static Future<void> _requestPermission() async {
    // Request notification permission
    final status = await Permission.notification.request();
    if (status.isDenied) {
      // Handle permission denied
      print('Notification permission denied');
    }

    // Request Firebase messaging permission
    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted permission');
    } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
      print('User granted provisional permission');
    } else {
      print('User declined or has not accepted permission');
    }
  }

  static Future<void> _initLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );
  }

  static Future<void> _initFirebaseMessaging() async {
    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification taps when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Handle notification tap when app is terminated
    final initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  static void _onNotificationTapped(NotificationResponse response) {
    // Handle local notification tap
    print('Local notification tapped: ${response.payload}');
    // Navigate to appropriate screen based on payload
  }

  static Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
    print('Handling a background message: ${message.messageId}');
    // Handle background message
  }

  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    print('Got a message whilst in the foreground!');
    print('Message data: ${message.data}');

    if (message.notification != null) {
      print('Message also contained a notification: ${message.notification}');
      
      // Show local notification for foreground messages
      await showLocalNotification(
        title: message.notification?.title ?? 'New Notification',
        body: message.notification?.body ?? '',
        payload: message.data.toString(),
      );
    }
  }

  static Future<void> _handleNotificationTap(RemoteMessage message) async {
    print('Notification tapped: ${message.data}');
    // Navigate to appropriate screen based on message data
  }

  // Show local notification
  static Future<void> showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'delivery_app_channel',
      'Delivery App Notifications',
      channelDescription: 'Notifications for delivery app',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      details,
      payload: payload,
    );
  }

  // Get FCM token
  static Future<String?> getToken() async {
    try {
      return await _firebaseMessaging.getToken();
    } catch (e) {
      print('Error getting FCM token: $e');
      return null;
    }
  }

  // Subscribe to topic
  static Future<void> subscribeToTopic(String topic) async {
    try {
      await _firebaseMessaging.subscribeToTopic(topic);
      print('Subscribed to topic: $topic');
    } catch (e) {
      print('Error subscribing to topic: $e');
    }
  }

  // Unsubscribe from topic
  static Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _firebaseMessaging.unsubscribeFromTopic(topic);
      print('Unsubscribed from topic: $topic');
    } catch (e) {
      print('Error unsubscribing from topic: $e');
    }
  }

  // Subscribe to user-specific topics
  static Future<void> subscribeToUserTopics(String userId, String role) async {
    await subscribeToTopic('user_$userId');
    await subscribeToTopic('role_$role');
    
    // Subscribe to general topics based on role
    switch (role) {
      case AppConstants.roleCustomer:
        await subscribeToTopic('customers');
        break;
      case AppConstants.roleDriver:
        await subscribeToTopic('drivers');
        break;
      case AppConstants.roleBusiness:
        await subscribeToTopic('business');
        break;
      case AppConstants.roleAdmin:
        await subscribeToTopic('admin');
        break;
    }
  }

  // Unsubscribe from user-specific topics
  static Future<void> unsubscribeFromUserTopics(String userId, String role) async {
    await unsubscribeFromTopic('user_$userId');
    await unsubscribeFromTopic('role_$role');
    
    // Unsubscribe from general topics based on role
    switch (role) {
      case AppConstants.roleCustomer:
        await unsubscribeFromTopic('customers');
        break;
      case AppConstants.roleDriver:
        await unsubscribeFromTopic('drivers');
        break;
      case AppConstants.roleBusiness:
        await unsubscribeFromTopic('business');
        break;
      case AppConstants.roleAdmin:
        await unsubscribeFromTopic('admin');
        break;
    }
  }

  // Schedule notification
  static Future<void> scheduleNotification({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledDate,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'delivery_app_scheduled',
      'Scheduled Notifications',
      channelDescription: 'Scheduled notifications for delivery app',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.zonedSchedule(
      id,
      title,
      body,
      scheduledDate,
      details,
      payload: payload,
      uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
    );
  }

  // Cancel notification
  static Future<void> cancelNotification(int id) async {
    await _localNotifications.cancel(id);
  }

  // Cancel all notifications
  static Future<void> cancelAllNotifications() async {
    await _localNotifications.cancelAll();
  }

  // Get pending notifications
  static Future<List<PendingNotificationRequest>> getPendingNotifications() async {
    return await _localNotifications.pendingNotificationRequests();
  }
}
