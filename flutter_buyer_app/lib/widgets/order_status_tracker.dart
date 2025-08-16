import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/order.dart';

class OrderStatusTracker extends StatelessWidget {
  final Order order;

  const OrderStatusTracker({
    super.key,
    required this.order,
  });

  @override
  Widget build(BuildContext context) {
    final steps = _getOrderSteps();
    final currentStep = _getCurrentStepIndex();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Order Progress',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
            ),
          ),
          child: Column(
            children: [
              for (int i = 0; i < steps.length; i++) ...[
                _buildStep(
                  context,
                  steps[i],
                  isActive: i <= currentStep,
                  isCompleted: i < currentStep,
                  isLast: i == steps.length - 1,
                ),
                if (i < steps.length - 1) _buildConnector(context, i < currentStep),
              ],
            ],
          ),
        ),
      ],
    );
  }

  List<OrderStep> _getOrderSteps() {
    return [
      OrderStep(
        icon: LucideIcons.checkCircle,
        title: 'Order Confirmed',
        description: 'Your order has been placed successfully',
      ),
      OrderStep(
        icon: LucideIcons.chef,
        title: 'Preparing',
        description: 'Your order is being prepared',
      ),
      OrderStep(
        icon: LucideIcons.package,
        title: 'Ready for Pickup',
        description: 'Order is ready for delivery',
      ),
      OrderStep(
        icon: LucideIcons.truck,
        title: 'Out for Delivery',
        description: 'Your order is on the way',
      ),
      OrderStep(
        icon: LucideIcons.home,
        title: 'Delivered',
        description: 'Order delivered successfully',
      ),
    ];
  }

  int _getCurrentStepIndex() {
    switch (order.status) {
      case OrderStatus.pending:
        return -1;
      case OrderStatus.confirmed:
        return 0;
      case OrderStatus.preparing:
        return 1;
      case OrderStatus.ready:
        return 2;
      case OrderStatus.outForDelivery:
        return 3;
      case OrderStatus.delivered:
        return 4;
      case OrderStatus.cancelled:
      case OrderStatus.refunded:
        return -1;
    }
  }

  Widget _buildStep(
    BuildContext context,
    OrderStep step,
    {
    required bool isActive,
    required bool isCompleted,
    required bool isLast,
  }) {
    final color = isActive
        ? Theme.of(context).colorScheme.primary
        : Theme.of(context).colorScheme.onSurface.withOpacity(0.4);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: isActive ? color.withOpacity(0.1) : Colors.transparent,
            border: Border.all(
              color: color,
              width: 2,
            ),
            shape: BoxShape.circle,
          ),
          child: Icon(
            isCompleted ? LucideIcons.check : step.icon,
            size: 20,
            color: color,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                step.title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: isActive
                      ? Theme.of(context).colorScheme.onSurface
                      : Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                step.description,
                style: TextStyle(
                  fontSize: 14,
                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildConnector(BuildContext context, bool isActive) {
    return Container(
      margin: const EdgeInsets.only(left: 19.5, top: 8, bottom: 8),
      width: 1,
      height: 24,
      color: isActive
          ? Theme.of(context).colorScheme.primary
          : Theme.of(context).colorScheme.onSurface.withOpacity(0.2),
    );
  }
}

class OrderStep {
  final IconData icon;
  final String title;
  final String description;

  OrderStep({
    required this.icon,
    required this.title,
    required this.description,
  });
}