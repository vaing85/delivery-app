import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../providers/dashboard_provider.dart';

class RecentActivityItem extends StatelessWidget {
  final RecentActivity activity;

  const RecentActivityItem({
    super.key,
    required this.activity,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: _getStatusColor().withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            _getIcon(),
            color: _getStatusColor(),
            size: 20,
          ),
        ),
        title: Text(
          activity.title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              activity.description,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textSecondaryColor,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Text(
                  DateFormat('MMM dd, yyyy • HH:mm').format(activity.timestamp),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textHintColor,
                    fontSize: 11,
                  ),
                ),
                if (activity.status != null) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: _getStatusColor().withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      activity.status!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: _getStatusColor(),
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
        trailing: Icon(
          Icons.arrow_forward_ios,
          size: 16,
          color: AppTheme.textSecondaryColor,
        ),
        onTap: () {
          // Handle activity tap
        },
      ),
    );
  }

  IconData _getIcon() {
    switch (activity.type) {
      case 'order':
        return Icons.shopping_bag_outlined;
      case 'delivery':
        return Icons.local_shipping_outlined;
      case 'payment':
        return Icons.payment_outlined;
      case 'notification':
        return Icons.notifications_outlined;
      default:
        return Icons.info_outlined;
    }
  }

  Color _getStatusColor() {
    switch (activity.status?.toLowerCase()) {
      case 'pending':
        return AppTheme.pendingColor;
      case 'confirmed':
        return AppTheme.confirmedColor;
      case 'in_progress':
        return AppTheme.inProgressColor;
      case 'completed':
        return AppTheme.completedColor;
      case 'cancelled':
        return AppTheme.cancelledColor;
      default:
        return AppTheme.primaryColor;
    }
  }
}
