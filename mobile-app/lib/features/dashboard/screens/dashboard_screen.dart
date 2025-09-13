import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../providers/dashboard_provider.dart';
import '../widgets/dashboard_card.dart';
import '../widgets/quick_action_button.dart';
import '../widgets/recent_activity_item.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardState = ref.watch(dashboardProvider);
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Welcome, ${user?.firstName ?? 'User'}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.go('/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.person_outlined),
            onPressed: () => context.go('/profile'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(dashboardProvider.future),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Quick Stats
              _buildQuickStats(dashboardState, user?.role),
              
              const SizedBox(height: 24),
              
              // Quick Actions
              _buildQuickActions(context, user?.role),
              
              const SizedBox(height: 24),
              
              // Recent Activity
              _buildRecentActivity(dashboardState),
              
              const SizedBox(height: 24),
              
              // Role-specific content
              if (user?.isDriver == true) _buildDriverContent(dashboardState),
              if (user?.isBusiness == true) _buildBusinessContent(dashboardState),
              if (user?.isAdmin == true) _buildAdminContent(dashboardState),
            ],
          ),
        ),
      ),
      floatingActionButton: _buildFloatingActionButton(context, user?.role),
    );
  }

  Widget _buildQuickStats(dashboardState, String? role) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Stats',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.5,
          children: [
            DashboardCard(
              title: 'Total Orders',
              value: dashboardState.totalOrders?.toString() ?? '0',
              icon: Icons.shopping_bag_outlined,
              color: AppTheme.primaryColor,
            ),
            DashboardCard(
              title: 'Active Deliveries',
              value: dashboardState.activeDeliveries?.toString() ?? '0',
              icon: Icons.local_shipping_outlined,
              color: AppTheme.successColor,
            ),
            if (role == AppConstants.roleDriver || role == AppConstants.roleBusiness)
              DashboardCard(
                title: 'Earnings',
                value: '\$${dashboardState.totalEarnings?.toStringAsFixed(2) ?? '0.00'}',
                icon: Icons.attach_money_outlined,
                color: AppTheme.warningColor,
              ),
            DashboardCard(
              title: 'Rating',
              value: dashboardState.averageRating?.toStringAsFixed(1) ?? '0.0',
              icon: Icons.star_outlined,
              color: AppTheme.accentColor,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context, String? role) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.2,
          children: [
            if (role == AppConstants.roleCustomer)
              QuickActionButton(
                title: 'New Order',
                icon: Icons.add_shopping_cart_outlined,
                color: AppTheme.primaryColor,
                onTap: () => context.go('/orders/create'),
              ),
            if (role == AppConstants.roleDriver)
              QuickActionButton(
                title: 'Available Jobs',
                icon: Icons.work_outlined,
                color: AppTheme.successColor,
                onTap: () => context.go('/deliveries/available'),
              ),
            if (role == AppConstants.roleBusiness)
              QuickActionButton(
                title: 'Manage Orders',
                icon: Icons.inventory_outlined,
                color: AppTheme.warningColor,
                onTap: () => context.go('/orders'),
              ),
            QuickActionButton(
              title: 'Track Delivery',
              icon: Icons.location_on_outlined,
              color: AppTheme.infoColor,
              onTap: () => context.go('/deliveries/track'),
            ),
            QuickActionButton(
              title: 'View Orders',
              icon: Icons.list_alt_outlined,
              color: AppTheme.primaryColor,
              onTap: () => context.go('/orders'),
            ),
            QuickActionButton(
              title: 'My Deliveries',
              icon: Icons.local_shipping_outlined,
              color: AppTheme.successColor,
              onTap: () => context.go('/deliveries'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRecentActivity(dashboardState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent Activity',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        if (dashboardState.recentActivities?.isEmpty ?? true)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Icon(
                    Icons.history_outlined,
                    size: 48,
                    color: AppTheme.textSecondaryColor,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No recent activity',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: AppTheme.textSecondaryColor,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Your recent orders and deliveries will appear here',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondaryColor,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          )
        else
          ...dashboardState.recentActivities!.map(
            (activity) => RecentActivityItem(activity: activity),
          ),
      ],
    );
  }

  Widget _buildDriverContent(dashboardState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Driver Dashboard',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.location_on_outlined,
                      color: AppTheme.primaryColor,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Current Status',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Available for deliveries'),
                    Switch(
                      value: dashboardState.isAvailable ?? false,
                      onChanged: (value) {
                        // Toggle availability
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBusinessContent(dashboardState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Business Dashboard',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.business_outlined,
                      color: AppTheme.warningColor,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Business Overview',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Manage your delivery business efficiently',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondaryColor,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAdminContent(dashboardState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Admin Dashboard',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.admin_panel_settings_outlined,
                      color: AppTheme.errorColor,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'System Overview',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Monitor and manage the entire delivery system',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textSecondaryColor,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget? _buildFloatingActionButton(BuildContext context, String? role) {
    if (role == AppConstants.roleCustomer) {
      return FloatingActionButton(
        onPressed: () => context.go('/orders/create'),
        child: const Icon(Icons.add),
      );
    }
    return null;
  }
}
