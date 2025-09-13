import 'package:shared_preferences/shared_preferences.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../constants/app_constants.dart';
import '../../shared/models/user_model.dart';

class StorageService {
  static late SharedPreferences _prefs;
  static late Box<UserModel> _userBox;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    _userBox = await Hive.openBox<UserModel>('users');
  }

  // Token Management
  static Future<void> saveToken(String token) async {
    await _prefs.setString(AppConstants.userTokenKey, token);
  }

  static String? getToken() {
    return _prefs.getString(AppConstants.userTokenKey);
  }

  static Future<void> removeToken() async {
    await _prefs.remove(AppConstants.userTokenKey);
  }

  // User Data Management
  static Future<void> saveUser(UserModel user) async {
    await _userBox.put('current_user', user);
    await _prefs.setString(AppConstants.userDataKey, user.toJson().toString());
  }

  static UserModel? getUser() {
    return _userBox.get('current_user');
  }

  static Future<void> removeUser() async {
    await _userBox.delete('current_user');
    await _prefs.remove(AppConstants.userDataKey);
  }

  // Theme Management
  static Future<void> saveThemeMode(String mode) async {
    await _prefs.setString(AppConstants.themeKey, mode);
  }

  static String getThemeMode() {
    return _prefs.getString(AppConstants.themeKey) ?? 'system';
  }

  // Language Management
  static Future<void> saveLanguage(String language) async {
    await _prefs.setString(AppConstants.languageKey, language);
  }

  static String getLanguage() {
    return _prefs.getString(AppConstants.languageKey) ?? 'en';
  }

  // Generic Storage Methods
  static Future<void> saveString(String key, String value) async {
    await _prefs.setString(key, value);
  }

  static String? getString(String key) {
    return _prefs.getString(key);
  }

  static Future<void> saveInt(String key, int value) async {
    await _prefs.setInt(key, value);
  }

  static int? getInt(String key) {
    return _prefs.getInt(key);
  }

  static Future<void> saveBool(String key, bool value) async {
    await _prefs.setBool(key, value);
  }

  static bool? getBool(String key) {
    return _prefs.getBool(key);
  }

  static Future<void> saveDouble(String key, double value) async {
    await _prefs.setDouble(key, value);
  }

  static double? getDouble(String key) {
    return _prefs.getDouble(key);
  }

  static Future<void> saveStringList(String key, List<String> value) async {
    await _prefs.setStringList(key, value);
  }

  static List<String>? getStringList(String key) {
    return _prefs.getStringList(key);
  }

  // Clear all data
  static Future<void> clearAll() async {
    await _prefs.clear();
    await _userBox.clear();
  }

  // Check if user is logged in
  static bool isLoggedIn() {
    return getToken() != null && getUser() != null;
  }

  // Get user role
  static String? getUserRole() {
    final user = getUser();
    return user?.role;
  }

  // Check if user has specific role
  static bool hasRole(String role) {
    final userRole = getUserRole();
    return userRole == role;
  }

  // Check if user is customer
  static bool isCustomer() {
    return hasRole(AppConstants.roleCustomer);
  }

  // Check if user is driver
  static bool isDriver() {
    return hasRole(AppConstants.roleDriver);
  }

  // Check if user is business
  static bool isBusiness() {
    return hasRole(AppConstants.roleBusiness);
  }

  // Check if user is admin
  static bool isAdmin() {
    return hasRole(AppConstants.roleAdmin);
  }
}
